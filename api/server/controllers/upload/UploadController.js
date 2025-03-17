const { createReadStream, unlinkSync } = require("fs");
const { nanoid } = require("nanoid");
const MediaService = require("../../services/upload/UploadService.js");
const { s3Client } = require("../../../config/s3Client.js");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

class MediaController {
  static async uploadImage(req, res) {
    let s3Path = '';

    try {
      const {
        type,
        userId,
        companyId,
        rewardId,
        articleId,
        workshopId
      } = req.body;

      // Validate required parameter
      if (!type) {
        return res.status(400).json({
          success: false,
          message: "Image type is required (profile, icon, article, workshop)"
        });
      }

      // Validate type is supported
      const supportedTypes = ['profile', 'icon', 'article', 'workshop'];
      if (!supportedTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Unsupported image type: ${type}. Supported types are: ${supportedTypes.join(', ')}`
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      const filename = `${nanoid()}.jpg`;
      const fileType = req.file.mimetype;

      // Generate S3 path based on type
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
          // Further categorize profiles by entity type
          if (userId) {
            s3Path = `images/profiles/users/${filename}`;
          } else if (companyId) {
            s3Path = `images/profiles/companies/${filename}`;
          } else {
            s3Path = `images/profiles/${filename}`;
          }
          break;
      }

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Path,
        Body: createReadStream(req.file.path),
        ContentType: fileType,
        ACL: 'public-read'
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      // Clean up temp file
      unlinkSync(req.file.path);

      // Save file info to database with all relevant parameters
      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}`;

      try {
        const savedFile = await MediaService.uploadImageService({
          filename,
          type,
          url: fileUrl,
          path: s3Path,
          userId,
          companyId,
          rewardId,
          articleId,
          workshopId
        });

        return res.status(200).json({
          success: true,
          message: "File uploaded successfully",
          data: savedFile
        });
      } catch (dbError) {
        // If database update fails, delete the file from S3
        console.error("Database error - rolling back S3 upload:", dbError);

        // Delete the file from S3
        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Path
        };

        try {
          const deleteCommand = new DeleteObjectCommand(deleteParams);
          await s3Client.send(deleteCommand);
          console.log(`Successfully deleted ${s3Path} from S3 after database failure`);
        } catch (deleteError) {
          console.error("Error during S3 rollback:", deleteError);
        }

        // Re-throw the original error
        throw dbError;
      }

    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Error uploading file",
        error: error.message
      });
    }
  }

  static async uploadSound(req, res) {
    let s3Path = '';

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      // Get the title from request body or use filename
      const title = req.body.title || req.file.originalname.split('.')[0];

      // Validate title
      if (!title || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: "Sound title is required"
        });
      }

      // Get file size in bytes
      const fileSize = req.file.size;

      // Extract audio duration using music-metadata
      let duration = null;
      try {
        const metadata = await mm.parseFile(req.file.path);
        if (metadata.format && metadata.format.duration) {
          duration = Math.round(metadata.format.duration); // Duration in seconds, rounded
        }
      } catch (metadataError) {
        console.warn("Could not extract audio duration:", metadataError.message);
        // Continue with upload even if duration extraction fails
      }

      const filename = `${nanoid()}.${req.file.originalname.split('.').pop()}`;
      s3Path = `sounds/therapy/${filename}`;

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Path,
        Body: createReadStream(req.file.path),
        ContentType: req.file.mimetype,
        ACL: 'public-read'
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      // Clean up temp file
      unlinkSync(req.file.path);

      // Save file info to database with size and duration
      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}`;

      try {
        const savedFile = await MediaService.uploadSoundService({
          filename,
          title,
          url: fileUrl,
          path: s3Path,
          fileSize,
          duration
        });

        return res.status(200).json({
          success: true,
          message: "Sound file uploaded successfully",
          data: savedFile
        });

      } catch (dbError) {
        // If database update fails, delete the file from S3
        console.error("Database error - rolling back S3 upload:", dbError);

        // Delete the file from S3
        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Path
        };

        try {
          const deleteCommand = new DeleteObjectCommand(deleteParams);
          await s3Client.send(deleteCommand);
          console.log(`Successfully deleted ${s3Path} from S3 after database failure`);
        } catch (deleteError) {
          console.error("Error during S3 rollback:", deleteError);
        }

        // Re-throw the original error
        throw dbError;
      }

    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Error uploading sound file",
        error: error.message
      });
    }
  }

  static async uploadGalleryFile(req, res) {
    try {
      const { company_id } = req.body;

      if (!company_id) {
        return res.status(400).json({
          success: false,
          message: "Company ID is required"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
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

      // Generate S3 path
      const s3Path = `gallery/${company_id}/${fileType}/${filename}`;

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Path,
        Body: createReadStream(req.file.path),
        ContentType: req.file.mimetype,
        ACL: 'public-read'
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      // Clean up temp file
      unlinkSync(req.file.path);

      // Save file info to database with company_id
      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}`;
      const fileSize = req.file.size; // File size in bytes

      const savedFile = await MediaService.saveGalleryFile({
        company_id: parseInt(company_id),
        file_type: fileType,
        file_url: fileUrl,
        path: s3Path,
        size: fileSize
      });

      return res.status(200).json({
        success: true,
        message: "File uploaded to gallery successfully",
        data: savedFile
      });

    } catch (error) {
      console.error("Gallery upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Error uploading file to gallery",
        error: error.message
      });
    }
  }

  static async deleteImage(req, res) {
    try {
      const { fileId } = req.body;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: "File ID is required"
        });
      }

      const file = await MediaService.getFileById(fileId);
      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found"
        });
      }

      // ... rest of delete logic remains same
    } catch (error) {
      console.error("Delete error:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting file",
        error: error.message
      });
    }
  }

  static async deleteSound(req, res) {
    try {
      const { fileId } = req.body;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: "File ID is required"
        });
      }

      const file = await MediaService.getFileById(fileId);
      if (!file) {
        return res.status(404).json({
          success: false,
          message: "Sound file not found"
        });
      }

      // ... rest of delete logic remains same
    } catch (error) {
      console.error("Delete error:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting sound file",
        error: error.message
      });
    }
  }

  static async deleteGalleryFile(req, res) {
    try {
      const { fileId } = req.body;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: "File ID is required"
        });
      }

      const file = await MediaService.getGalleryFileById(fileId);
      if (!file) {
        return res.status(404).json({
          success: false,
          message: "Gallery file not found"
        });
      }

      // Delete from S3
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.path
      };

      const command = new DeleteObjectCommand(deleteParams);
      await s3Client.send(command);

      // Delete from database
      await MediaService.deleteGalleryFile(fileId);

      return res.status(200).json({
        success: true,
        message: "Gallery file deleted successfully"
      });
    } catch (error) {
      console.error("Delete gallery file error:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting gallery file",
        error: error.message
      });
    }
  }

}

module.exports = MediaController;