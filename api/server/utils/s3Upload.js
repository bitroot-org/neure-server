const { createReadStream, unlinkSync } = require('fs');
const { nanoid } = require('nanoid');
const { s3Client } = require('../../config/s3Client');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Allowed types per folder
const FOLDER_MAP = {
  'prodesk/profiles':   { types: ['image/jpeg','image/png','image/webp','image/gif'], maxMB: 5 },
  'prodesk/logos':      { types: ['image/jpeg','image/png','image/webp','image/gif'], maxMB: 5 },
  'prodesk/documents':  { types: ['application/pdf'], maxMB: 20 },
  'prodesk/resources':  { types: ['application/pdf','audio/mpeg','audio/wav','audio/mp4'], maxMB: 50 },
  'prodesk/notes':      { types: ['image/jpeg','image/png','image/webp','application/pdf'], maxMB: 10 },
};

/**
 * Upload a file to S3 and return its public URL.
 * @param {object} file        - multer file object (req.file)
 * @param {string} folder      - one of the keys in FOLDER_MAP above
 * @returns {{ success, url, key, message }}
 */
const uploadToS3 = async (file, folder) => {
  try {
    if (!file) return { success: false, message: 'No file provided' };

    const config = FOLDER_MAP[folder];
    if (!config) return { success: false, message: `Unknown upload folder: ${folder}` };

    if (!config.types.includes(file.mimetype)) {
      if (file.path) try { unlinkSync(file.path); } catch (_) {}
      return { success: false, message: `File type ${file.mimetype} not allowed for ${folder}` };
    }

    if (file.size > config.maxMB * 1024 * 1024) {
      if (file.path) try { unlinkSync(file.path); } catch (_) {}
      return { success: false, message: `File size exceeds ${config.maxMB}MB limit` };
    }

    const ext = file.originalname.split('.').pop().toLowerCase();
    const key = `${folder}/${nanoid()}.${ext}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: createReadStream(file.path),
      ContentType: file.mimetype,
      ACL: 'public-read',
    }));

    try { unlinkSync(file.path); } catch (_) {}

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return { success: true, url, key };

  } catch (error) {
    if (file?.path) try { unlinkSync(file.path); } catch (_) {}
    console.log('Error in uploadToS3::>>', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete a file from S3 by its full URL or key.
 * @param {string} urlOrKey - full S3 URL or just the key
 */
const deleteFromS3 = async (urlOrKey) => {
  try {
    if (!urlOrKey) return { success: false, message: 'URL or key is required' };
    const key = urlOrKey.includes('.amazonaws.com/')
      ? urlOrKey.split('.amazonaws.com/')[1]
      : urlOrKey;

    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    }));
    return { success: true };
  } catch (error) {
    console.log('Error in deleteFromS3::>>', error);
    return { success: false, message: error.message };
  }
};

module.exports = { uploadToS3, deleteFromS3 };
