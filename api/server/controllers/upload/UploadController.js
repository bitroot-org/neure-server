const { createReadStream, unlinkSync } = require("fs");
const { nanoid } = require("nanoid");
const db = require('../../../config/db');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const MediaService = require("../../services/upload/UploadService.js");
const { s3Client } = require("../../../config/s3Client.js");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

// Set ffmpeg and ffprobe paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// Helper function to get media duration
const getMediaDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error("FFprobe error:", err);
        return reject(err);
      }

      try {
        // Log the full metadata for debugging
        console.log("File metadata:", JSON.stringify(metadata, null, 2));
        
        if (!metadata || !metadata.format || typeof metadata.format.duration !== 'number') {
          console.warn("Invalid duration metadata:", metadata?.format?.duration);
          return resolve(null);
        }

        // Store duration with 2 decimal places
        const duration = Number(metadata.format.duration.toFixed(2));
        
        // Validate the duration
        if (duration <= 0 || !isFinite(duration)) {
          console.warn("Invalid duration value:", duration);
          return resolve(null);
        }

        console.log("Extracted duration:", duration, "seconds"); // Debug log
        resolve(duration);
      } catch (error) {
        console.error("Error processing duration:", error);
        resolve(null);
      }
    });
  });
};

class MediaController {
  // static async uploadImage(req, res) {
  //   let s3Path = '';

  //   try {
  //     const {
  //       type,
  //       userId,
  //       companyId,
  //       rewardId,
  //       articleId,
  //       workshopId
  //     } = req.body;

  //     // Validate required parameter
  //     if (!type) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Image type is required (profile, icon, article, workshop)"
  //       });
  //     }

  //     // Validate type is supported
  //     const supportedTypes = ['profile', 'icon', 'article', 'workshop'];
  //     if (!supportedTypes.includes(type)) {
  //       return res.status(400).json({
  //         success: false,
  //         message: `Unsupported image type: ${type}. Supported types are: ${supportedTypes.join(', ')}`
  //       });
  //     }

  //     if (!req.file) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "No file uploaded"
  //       });
  //     }

  //     const filename = `${nanoid()}.jpg`;
  //     const fileType = req.file.mimetype;

  //     // Generate S3 path based on type
  //     switch (type) {
  //       case 'icon':
  //         s3Path = `images/icons/${filename}`;
  //         break;
  //       case 'article':
  //         s3Path = `images/articles/${filename}`;
  //         break;
  //       case 'workshop':
  //         s3Path = `images/workshops/${filename}`;
  //         break;
  //       case 'profile':
  //         // Further categorize profiles by entity type
  //         if (userId) {
  //           s3Path = `images/profiles/users/${filename}`;
  //         } else if (companyId) {
  //           s3Path = `images/profiles/companies/${filename}`;
  //         } else {
  //           s3Path = `images/profiles/${filename}`;
  //         }
  //         break;
  //     }

  //     const uploadParams = {
  //       Bucket: process.env.AWS_BUCKET_NAME,
  //       Key: s3Path,
  //       Body: createReadStream(req.file.path),
  //       ContentType: fileType,
  //       ACL: 'public-read'
  //     };

  //     const command = new PutObjectCommand(uploadParams);
  //     await s3Client.send(command);

  //     // Clean up temp file
  //     unlinkSync(req.file.path);

  //     // Save file info to database with all relevant parameters
  //     const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}`;

  //     try {
  //       const savedFile = await MediaService.uploadImageService({
  //         filename,
  //         type,
  //         url: fileUrl,
  //         path: s3Path,
  //         userId,
  //         companyId,
  //         rewardId,
  //         articleId,
  //         workshopId
  //       });

  //       return res.status(200).json({
  //         success: true,
  //         message: "File uploaded successfully",
  //         data: savedFile
  //       });
  //     } catch (dbError) {
  //       // If database update fails, delete the file from S3
  //       console.error("Database error - rolling back S3 upload:", dbError);

  //       // Delete the file from S3
  //       const deleteParams = {
  //         Bucket: process.env.AWS_BUCKET_NAME,
  //         Key: s3Path
  //       };

  //       try {
  //         const deleteCommand = new DeleteObjectCommand(deleteParams);
  //         await s3Client.send(deleteCommand);
  //         console.log(`Successfully deleted ${s3Path} from S3 after database failure`);
  //       } catch (deleteError) {
  //         console.error("Error during S3 rollback:", deleteError);
  //       }

  //       // Re-throw the original error
  //       throw dbError;
  //     }

  //   } catch (error) {
  //     console.error("Upload error:", error);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Error uploading file",
  //       error: error.message
  //     });
  //   }
  // }

  static async uploadImage(req) {
    try {
      const { type } = req.body;

      // Validate required parameter
      if (!type) {
        throw new Error("Image type is required (profile, icon, article, workshop)");
      }

      // Validate type is supported
      const supportedTypes = ['profile', 'icon', 'article', 'workshop', 'soundCover'];
      if (!supportedTypes.includes(type)) {
        throw new Error(`Unsupported image type: ${type}. Supported types are: ${supportedTypes.join(', ')}`);
      }

      if (!req.file) {
        throw new Error("No file uploaded");
      }

      // For profile images, ensure they're properly sized
      if (type === 'profile') {
        // You could add image processing here with sharp or another library
        // Example: resize to standard dimensions for profile images
        // const processedImagePath = await resizeImage(req.file.path, 300, 300);
        // Then use processedImagePath instead of req.file.path below
      }

      const filename = `${nanoid()}.jpg`;
      const fileType = req.file.mimetype;

      // Generate S3 path based on type
      let s3Path;
      switch (type) {
        case 'icon':
          s3Path = `images/icons/${filename}`;
          break;
        case 'article':
          s3Path = `images/articles/${filename}`;
          break;
        case 'workshop':
          s3Path = `images/workshops/${filename}`;
          break;
        case 'profile':
          s3Path = `images/profiles/${filename}`;
          break;
        case 'soundCover': // New case for sound cover images
          s3Path = `images/soundCovers/${filename}`;
          break;
        default:
          throw new Error(`Invalid type: ${type}`);
      }

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Path,
        Body: createReadStream(req.file.path),
        ContentType: fileType,
        ACL: 'public-read',
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      // Clean up temp file
      unlinkSync(req.file.path);

      // Generate file URL
      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}`;

      return {
        success: true,
        url: fileUrl,
      };
    } catch (error) {
      console.error("Upload image error:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }


  static async uploadSound({ soundFile, coverImage }) {
    try {
      if (!soundFile) {
        throw new Error("No sound file provided");
      }
  
      const title = soundFile.originalname.split(".")[0];
      const fileSize = soundFile.size;
  
      // Extract audio duration using ffmpeg
      let duration = null;
      try {
        if (soundFile.path) {
          duration = await getMediaDuration(soundFile.path);
          console.log("Extracted duration:", duration);
        }
      } catch (durationError) {
        console.warn("Could not extract audio duration:", durationError.message);
      }
  
      // Upload sound file to S3
      const soundFilename = `${nanoid()}.${soundFile.originalname.split(".").pop()}`;
      const soundS3Path = `sounds/therapy/${soundFilename}`;
  
      const soundUploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: soundS3Path,
        Body: createReadStream(soundFile.path),
        ContentType: soundFile.mimetype,
        ACL: "public-read",
      };
  
      const soundCommand = new PutObjectCommand(soundUploadParams);
      await s3Client.send(soundCommand);
  
      // Generate sound file URL
      const soundFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${soundS3Path}`;
  
      // Clean up sound file
      unlinkSync(soundFile.path);
  
      // Upload cover image if provided
      let coverImageUrl = null;
      if (coverImage) {
        const imageFilename = `${nanoid()}.${coverImage.originalname.split(".").pop()}`;
        const coverImageS3Path = `sounds/therapy/covers/${imageFilename}`;
  
        const imageUploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: coverImageS3Path,
          Body: createReadStream(coverImage.path),
          ContentType: coverImage.mimetype,
          ACL: "public-read",
        };
  
        const imageCommand = new PutObjectCommand(imageUploadParams);
        await s3Client.send(imageCommand);
  
        // Generate cover image URL
        coverImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${coverImageS3Path}`;
  
        // Clean up cover image file
        unlinkSync(coverImage.path);
      }
  
      // Return the URLs and metadata
      return {
        success: true,
        data: {
          title,
          soundFileUrl,
          coverImageUrl,
          fileSize,
          duration,
        },
      };
    } catch (error) {
      console.error("Upload sound error:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  static async uploadGalleryFile(req) {
    try {
      if (!req.file) {
        throw new Error("No file uploaded");
      }
  
      // Determine file type category based on mimetype
      let fileType;
      if (req.file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        fileType = 'video';
      } else {
        fileType = 'document';
      }
  
      // Get file extension from original filename
      const extension = req.file.originalname.split('.').pop().toLowerCase();
      const filename = `${nanoid()}.${extension}`;
      const s3Path = `gallery/${fileType}/${filename}`;
  
      // Upload to S3
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Path,
        Body: createReadStream(req.file.path),
        ContentType: req.file.mimetype,
        ACL: 'public-read',
      };
  
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
  
      // Clean up temp file after S3 upload
      unlinkSync(req.file.path);
  
      // Generate file URL
      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}`;
  
      return {
        success: true,
        url: fileUrl,
      };
    } catch (error) {
      console.error("Gallery upload error:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  static async deleteImage(req, res = null) {
    try {
      const { url, type } = req.body;
      console.log('🗑️ Attempting to delete image:', {
        url,
        type,
        timestamp: new Date().toISOString()
      });

      if (!url) {
        console.error('❌ Delete image failed: No URL provided');
        const error = { success: false, message: "Image URL is required" };
        return res ? res.status(400).json(error) : error;
      }

      // Extract S3 key from URL
      const s3Key = url.split(`${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1];
      console.log('📍 Extracted S3 Key:', s3Key);

      if (!s3Key) {
        console.error('❌ Delete image failed: Invalid S3 URL format');
        const error = { success: false, message: "Invalid S3 URL format" };
        return res ? res.status(400).json(error) : error;
      }

      // Delete from S3
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key
      };

      const command = new DeleteObjectCommand(deleteParams);
      await s3Client.send(command);
      
      console.log('✅ Successfully deleted image from S3:', {
        bucket: process.env.AWS_BUCKET_NAME,
        key: s3Key,
        type,
        originalUrl: url
      });

      const response = {
        success: true,
        message: "Image deleted successfully",
        deletedFile: {
          type,
          s3Key,
          originalUrl: url
        }
      };

      return res ? res.status(200).json(response) : response;

    } catch (error) {
      console.error('❌ Delete image error:', {
        error: error.message,
        stack: error.stack,
        requestBody: req.body
      });
      
      const errorResponse = {
        success: false,
        message: "Error deleting image",
        error: error.message
      };

      return res ? res.status(500).json(errorResponse) : errorResponse;
    }
  }

  static async deleteSound(soundId) {
    try {
      console.log("Deleting sound with ID:", soundId);

      if (!soundId) {
        return {
          success: false,
          message: "Sound ID is required"
        };
      }

      // Get sound details from database
      const [rows] = await db.query(
        "SELECT sound_file_url, sound_cover_image FROM soundscapes WHERE id = ?",
        [soundId]
      );

      const sound = rows[0];
      if (!sound) {
        return {
          success: false,
          message: "Sound not found"
        };
      }

      // Extract S3 keys from URLs
      const getS3KeyFromUrl = (url) => {
        if (!url) return null;
        return url.split(`${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1];
      };

      // Delete sound file from S3
      const soundKey = getS3KeyFromUrl(sound.sound_file_url);
      if (soundKey) {
        const soundDeleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: soundKey
        };
        const soundDeleteCommand = new DeleteObjectCommand(soundDeleteParams);
        await s3Client.send(soundDeleteCommand);
        console.log("Deleted sound file from S3:", soundKey);
      }

      // Delete cover image from S3 if it exists
      const coverImageKey = getS3KeyFromUrl(sound.sound_cover_image);
      if (coverImageKey) {
        const imageDeleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: coverImageKey
        };
        const imageDeleteCommand = new DeleteObjectCommand(imageDeleteParams);
        await s3Client.send(imageDeleteCommand);
        console.log("Deleted cover image from S3:", coverImageKey);
      }

      // Delete from database
      await db.query("DELETE FROM soundscapes WHERE id = ?", [soundId]);

      return {
        success: true,
        message: "Sound and associated files deleted successfully"
      };

    } catch (error) {
      console.error("Delete sound error:", error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // static async deleteGalleryFile(req, res) {
  //   try {
  //     const { fileId } = req.body;

  //     if (!fileId) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "File ID is required"
  //       });
  //     }

  //     const file = await MediaService.getGalleryFileById(fileId);
  //     if (!file) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Gallery file not found"
  //       });
  //     }

  //     // Delete from S3
  //     const deleteParams = {
  //       Bucket: process.env.AWS_BUCKET_NAME,
  //       Key: file.path
  //     };

  //     const command = new DeleteObjectCommand(deleteParams);
  //     await s3Client.send(command);

  //     // Delete from database
  //     await MediaService.deleteGalleryFile(fileId);

  //     return res.status(200).json({
  //       success: true,
  //       message: "Gallery file deleted successfully"
  //     });
  //   } catch (error) {
  //     console.error("Delete gallery file error:", error);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Error deleting gallery file",
  //       error: error.message
  //     });
  //   }
  // }

  static async uploadWorkshopFiles(req, res) {
    console.log('Received files:', req.files);
    try {
      const { workshopId } = req.body;

      if (!workshopId) {
        return res.status(400).json({
          success: false,
          message: "Workshop ID is required"
        });
      }

      // First get existing workshop files
      const [existingWorkshop] = await db.query(
        "SELECT pdf_url, poster_image FROM workshops WHERE id = ?",
        [workshopId]
      );

      if (!existingWorkshop) {
        return res.status(404).json({
          success: false,
          message: "Workshop not found"
        });
      }

      const pdfFile = req.files?.pdf?.[0];
      const coverImageFile = req.files?.coverImage?.[0];

      if (!pdfFile && !coverImageFile) {
        return res.status(400).json({
          success: false,
          message: "At least one file (PDF or cover image) must be uploaded"
        });
      }

      let pdfUrl = null;
      let coverImageUrl = null;

      // Upload PDF to S3
      if (pdfFile) {
        // Delete existing PDF if it exists
        if (existingWorkshop.pdf_url) {
          await MediaController.deleteGalleryFile(existingWorkshop.pdf_url);
        }

        const pdfFilename = `${nanoid()}.${pdfFile.originalname.split('.').pop()}`;
        const pdfPath = `workshops/${workshopId}/files/${pdfFilename}`;

        const pdfUploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: pdfPath,
          Body: createReadStream(pdfFile.path),
          ContentType: pdfFile.mimetype,
          ACL: 'public-read'
        };

        const pdfCommand = new PutObjectCommand(pdfUploadParams);
        await s3Client.send(pdfCommand);

        pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfPath}`;
        unlinkSync(pdfFile.path); // Clean up temp file
      }

      // Upload cover image to S3
      if (coverImageFile) {
        // Delete existing cover image if it exists
        if (existingWorkshop.poster_image) {
          await MediaController.deleteGalleryFile(existingWorkshop.poster_image);
        }

        const imageFilename = `${nanoid()}.${coverImageFile.originalname.split('.').pop()}`;
        const imagePath = `workshops/${workshopId}/cover/${imageFilename}`;

        const imageUploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: imagePath,
          Body: createReadStream(coverImageFile.path),
          ContentType: coverImageFile.mimetype,
          ACL: 'public-read'
        };

        const imageCommand = new PutObjectCommand(imageUploadParams);
        await s3Client.send(imageCommand);

        coverImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imagePath}`;
        unlinkSync(coverImageFile.path); // Clean up temp file
      }

      // Save file info to the database
      const savedFiles = await MediaService.uploadWorkshopFilesService({
        workshopId,
        pdfUrl: pdfUrl || existingWorkshop.pdf_url,
        coverImageUrl: coverImageUrl || existingWorkshop.poster_image
      });

      return res.status(200).json({
        success: true,
        message: "Workshop files uploaded successfully",
        data: savedFiles
      });

    } catch (error) {
      console.error("Upload workshop files error:", error);
      return res.status(500).json({
        success: false,
        message: "Error uploading workshop files",
        error: error.message
      });
    }
  }

  static async deleteGalleryFile(fileUrl) {
    try {
      // Extract the key from the file URL
      const key = fileUrl.split('.amazonaws.com/')[1];
      
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
      };

      const command = new DeleteObjectCommand(deleteParams);
      await s3Client.send(command);

      return {
        success: true,
        message: "File deleted successfully from S3"
      };
    } catch (error) {
      console.error("Delete S3 file error:", error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  static async deleteWorkshopFiles(id) {
    try {
      // Get existing workshop files
      const [workshop] = await db.query(
        "SELECT pdf_url, poster_image FROM workshops WHERE id = ?",
        [id]
      );

      if (!workshop) {
        return {
          success: false,
          message: "Workshop not found"
        };
      }

      // Delete PDF if exists
      if (workshop.pdf_url) {
        await MediaController.deleteGalleryFile(workshop.pdf_url);
      }

      // Delete cover image if exists
      if (workshop.poster_image) {
        await MediaController.deleteGalleryFile(workshop.poster_image);
      }

      return {
        success: true,
        message: "Workshop files deleted successfully"
      };

    } catch (error) {
      console.error("Delete workshop files error:", error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = MediaController;
