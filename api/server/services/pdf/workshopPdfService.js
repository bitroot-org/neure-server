const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const { nanoid } = require('nanoid');
const db = require("../../../config/db");


class WorkshopPdfService {
  static async generateEmployeeWorkshopPdfs(workshop_id, company_id, schedule_id) {
    try {
      console.log('Generating PDFs for workshop:', workshop_id, 'company:', company_id, 'schedule:', schedule_id);
      
      // Get workshop details
      const [workshopResults] = await db.query(
        'SELECT * FROM workshops WHERE id = ?',
        [workshop_id]
      );
      
      if (workshopResults.length === 0) {
        throw new Error(`Workshop not found with ID: ${workshop_id}`);
      }
      
      // Get company details
      const [companyResults] = await db.query(
        'SELECT * FROM companies WHERE id = ?',
        [company_id]
      );
      
      if (companyResults.length === 0) {
        throw new Error(`Company not found with ID: ${company_id}`);
      }

      // Get schedule details
      const [scheduleResults] = await db.query(
        'SELECT * FROM workshop_schedules WHERE id = ?',
        [schedule_id]
      );
      
      if (scheduleResults.length === 0) {
        throw new Error(`Schedule not found with ID: ${schedule_id}`);
      }
      
      // Add schedule_id to workshop object for use in PDF generation
      const workshop = {
        ...workshopResults[0],
        schedule_id: schedule_id
      };
      
      const company = companyResults[0];
      
      // Get all active employees in the company
      const [employees] = await db.query(
        `SELECT ce.user_id, u.first_name, u.last_name, u.email 
         FROM company_employees ce
         JOIN users u ON ce.user_id = u.user_id
         WHERE ce.company_id = ? AND ce.is_active = 1
         AND u.role_id NOT IN (1, 2)`,
        [company_id]
      );
      
      if (employees.length === 0) {
        return {
          status: true,
          code: 200,
          message: 'No active employees found for this company',
          data: []
        };
      }
      
      console.log(`Found ${employees.length} employees to generate PDFs for`);
      
      // Generate PDFs for each employee
      const pdfPromises = employees.map(employee => 
        this.generateSinglePdf(workshop, company, employee, schedule_id)
      );
      
      const pdfResults = await Promise.all(pdfPromises);
      
      return {
        status: true,
        code: 200,
        message: `Generated ${pdfResults.length} PDFs successfully`,
        data: pdfResults
      };
    } catch (error) {
      console.error('Error in generateEmployeeWorkshopPdfs:', error);
      throw error;
    }
  }

  static generateTicketCode(workshopId, userId, scheduleId) {
    // Convert workshopId, userId and scheduleId to base36 (alphanumeric) and take last characters
    const workshopPart = workshopId.toString(36).slice(-2).toUpperCase();
    const userPart = userId.toString(36).slice(-2).toUpperCase();
    const schedulePart = scheduleId.toString(36).slice(-2).toUpperCase();
    
    // Generate 4 random alphanumeric characters
    const randomPart = nanoid(4).toUpperCase();
    
    // Combine all parts with a separator
    return `NEU${workshopPart}${userPart}${schedulePart}${randomPart}`;
  }

  static async generateSinglePdf(workshop, company, employee, schedule_id) {
    try {
      console.log('Generating PDF for employee:', employee.user_id, 'for workshop:', workshop.id, 'schedule:', schedule_id);

      if (!workshop?.id) {
        throw new Error('Invalid workshop data: missing workshop ID');
      }

      if (!company?.company_name) {
        throw new Error('Invalid company data: missing company name');
      }

      if (!employee?.user_id) {
        throw new Error('Invalid employee data: missing user ID');
      }

      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        console.log('PDF document generation completed');
      });

      // Generate structured ticket ID
      const ticketId = this.generateTicketCode(workshop.id, employee.user_id, schedule_id);
      console.log('Generated ticket ID:', ticketId);

      // Generate QR code with structured data
      const qrCodeData = JSON.stringify({
        ticket: ticketId,
        workshop: workshop.id,
        employee: employee.user_id,
        company: company.id,
        schedule: schedule_id,
        timestamp: new Date().toISOString()
      });
      
      const qrCodeImage = await QRCode.toBuffer(qrCodeData);
      console.log('QR code generated successfully');

      // Create PDF content
      doc.fontSize(16).text(`Hi ${employee.first_name},`);
      doc.fontSize(12).text("You're all set for the upcoming workshop! Below are your workshop details.");
      doc.fontSize(24).text(workshop.title);
      
      // Add workshop details
      const startTime = new Date(workshop.start_time).toLocaleString();
      doc.fontSize(14).text(`Date & Time: ${startTime}`);
      doc.text(`Hosted by: ${workshop.host_name}`);
      doc.text(`Company: ${company.company_name}`);
      doc.text(`Ticket ID: ${ticketId}`);

      // Add QR code
      doc.image(qrCodeImage, { width: 200 });
      doc.text('Show this QR code or Ticket ID to check-in');

      // Add footer
      doc.fontSize(10).text('Need Help?');
      doc.text('If you have any questions, reach out to us at support@neure.in');
      doc.text('— Team Neure');

      // Finalize the PDF
      await new Promise((resolve) => {
        doc.end();
        doc.on('end', resolve);
      });

      const pdfBuffer = Buffer.concat(chunks);
      console.log('PDF Buffer size:', pdfBuffer.length);

      // Upload to S3
      const pdfPath = `workshops/${company.company_name}/${workshop.title}/${employee.first_name}_${employee.last_name}_${ticketId}.pdf`;
      console.log('Uploading to S3 path:', pdfPath);

      await this.uploadToS3(pdfBuffer, pdfPath);
      console.log('S3 upload completed successfully');

      const pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfPath}`;
      console.log('Generated PDF URL:', pdfUrl);

      // Store ticket information in database with schedule_id
      const ticketData = {
        workshop_id: workshop.id,
        user_id: employee.user_id,
        ticket_code: ticketId,
        pdf_url: pdfUrl,
        company_id: company.id,
        schedule_id: schedule_id
      };

      console.log('Inserting ticket data:', ticketData);

      await db.query(
        `INSERT INTO workshop_tickets 
          (workshop_id, user_id, company_id, ticket_code, pdf_url, schedule_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ticketData.workshop_id, ticketData.user_id, ticketData.company_id, 
         ticketData.ticket_code, ticketData.pdf_url, ticketData.schedule_id]
      );

      return {
        employeeId: employee.user_id,
        ticketId,
        pdfUrl
      };
    } catch (error) {
      console.error('Error in generateSinglePdf:', error);
      throw error;
    }
  }

  static async uploadToS3(pdfBuffer, pdfPath) {
    try {
      console.log('Initializing S3 client');
      const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });

      console.log('Preparing upload parameters');
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: pdfPath,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ACL: 'public-read'
      };

      console.log('Sending upload command to S3');
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      console.log('Upload completed successfully');
    } catch (error) {
      console.error('Error in uploadToS3:', error);
      throw error;
    }
  }

  static constructPdfUrl(pdfPath) {
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfPath}`;
  }

  static getPdfPath(company, workshop, employee) {
    if (!company || !company.company_name) {
      throw new Error('Invalid company data in getPdfPath');
    }
    if (!workshop || !workshop.title) {
      throw new Error('Invalid workshop data in getPdfPath');
    }
    if (!employee || !employee.first_name || !employee.last_name) {
      throw new Error('Invalid employee data in getPdfPath');
    }

    return `workshops/${company.company_name}/${workshop.title}/${employee.first_name}_${employee.last_name}.pdf`;
  }
}

module.exports = WorkshopPdfService;
