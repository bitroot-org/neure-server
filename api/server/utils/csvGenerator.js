const csv = require('fast-csv');
const { Readable } = require('stream');
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require("../../config/s3Client");

class CsvGenerator {
  static async generateCsv(data, headers, options = {}) {
    try {
      const {
        filename,
        s3Path = 'reports/csv',
        expiresIn = 3600, // 1 hour default
        sanitizeFilename = true
      } = options;

      // Generate CSV content in memory
      let csvContent = '';
      await new Promise((resolve, reject) => {
        csv.write(data, { headers })
          .on('error', reject)
          .pipe(new Readable())
          .on('data', chunk => csvContent += chunk)
          .on('end', resolve);
      });

      // Generate filename if not provided
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
      let finalFilename = filename || `export_${timestamp}.csv`;
      
      if (sanitizeFilename) {
        finalFilename = finalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
      }

      // Construct S3 path
      const fullS3Path = `${s3Path.replace(/\/$/, '')}/${finalFilename}`;

      // Upload to S3
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fullS3Path,
        Body: csvContent,
        ContentType: 'text/csv',
        ContentDisposition: `attachment; filename="${finalFilename}"`,
      };

      const uploadCommand = new PutObjectCommand(uploadParams);
      await s3Client.send(uploadCommand);

      // Generate signed URL
      const getObjectParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fullS3Path
      };
      const getCommand = new GetObjectCommand(getObjectParams);
      const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn });

      return {
        success: true,
        url: signedUrl,
        filename: finalFilename,
        expiresIn
      };
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw new Error(`Failed to generate CSV: ${error.message}`);
    }
  }
}

module.exports = CsvGenerator;