const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const { nanoid } = require('nanoid');
const db = require("../../../config/db");


class WorkshopPdfService {
  static async generateEmployeeWorkshopPdfs(workshopId, companyId) {
    try {
      console.log('Starting PDF generation with workshopId:', workshopId, 'companyId:', companyId);
      
      // 1. Get workshop details
      const [workshops] = await db.query(
        `SELECT w.*, ws.start_time, ws.end_time
         FROM workshops w 
         JOIN workshop_schedules ws ON w.id = ws.workshop_id 
         WHERE w.id = ?`,
        [workshopId]
      );

      if (!workshops || workshops.length === 0) {
        throw new Error(`Workshop not found with ID: ${workshopId}`);
      }

      const workshop = workshops[0];
      console.log('Workshop details:', workshop);

      // 2. Get company details
      const [companies] = await db.query(
        'SELECT * FROM companies WHERE id = ?',
        [companyId]
      );

      if (!companies || companies.length === 0) {
        throw new Error(`Company not found with ID: ${companyId}`);
      }

      const company = companies[0];
      console.log('Company details:', company);

      // 3. Get all employees from the company
      const [employees] = await db.query(
        `SELECT u.* FROM users u 
         JOIN company_employees ce ON u.user_id = ce.user_id 
         WHERE ce.company_id = ? AND ce.is_active = 1`,
        [companyId]
      );

      if (!employees || employees.length === 0) {
        throw new Error(`No active employees found for company ID: ${companyId}`);
      }

      console.log(`Found ${employees.length} employees`);

      // 4. Generate PDF for each employee
      const results = await Promise.all(
        employees.map(employee => this.generateSinglePdf(workshop, company, employee))
      );

      return {
        status: true,
        message: 'PDFs generated successfully',
        data: results
      };
    } catch (error) {
      console.error('Error in generateEmployeeWorkshopPdfs:', error);
      throw new Error(`Error generating PDFs: ${error.message}`);
    }
  }

  static generateTicketCode(workshopId, userId) {
    // Convert workshopId and userId to base36 (alphanumeric) and take last 3 characters
    const workshopPart = workshopId.toString(36).slice(-3).toUpperCase();
    const userPart = userId.toString(36).slice(-3).toUpperCase();
    
    // Generate 4 random alphanumeric characters
    const randomPart = nanoid(4).toUpperCase();
    
    // Combine all parts with a separator
    return `NEU${workshopPart}${userPart}${randomPart}`;
  }

  static async generateSinglePdf(workshop, company, employee) {
    try {
      console.log('Starting PDF generation for employee:', employee.first_name);
      
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
      const ticketId = this.generateTicketCode(workshop.id, employee.user_id);
      console.log('Generated ticket ID:', ticketId);

      // Generate QR code with structured data
      const qrCodeData = JSON.stringify({
        ticket: ticketId,
        workshop: workshop.id,
        employee: employee.user_id,
        company: company.id,
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

      // Store ticket information in database
      const ticketData = {
        workshop_id: workshop.id,
        user_id: employee.user_id,
        ticket_code: ticketId,
        pdf_url: pdfUrl,
        company_id: company.id
      };

      console.log('Inserting ticket data:', ticketData);

      await db.query(
        `INSERT INTO workshop_tickets 
          (workshop_id, user_id, company_id, ticket_code, pdf_url) 
         VALUES (?, ?, ?, ?, ?)`,
        [ticketData.workshop_id, ticketData.user_id, ticketData.company_id, ticketData.ticket_code, ticketData.pdf_url]
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
