const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const QRCode = require('qrcode');
const { nanoid } = require('nanoid');
const db = require("../../../config/db");
const EmailService = require("../email/emailService");
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer');

class WorkshopPdfService {
  // static async generateEmployeeWorkshopPdfs(workshopIdOrData, companyIdOrData, employeesOrScheduleId, schedule_id = null) {
  //   try {

  //     console.log('Starting PDF generation with data:', {
  //       workshopIdOrData,
  //       companyIdOrData,
  //       employeesOrScheduleId,
  //       schedule_id
  //     });

  //     // Check if first parameter is a workshop object or just an ID
  //     if (typeof workshopIdOrData === 'object' && workshopIdOrData !== null) {
  //       // New implementation with full data objects
  //       return this.generateEmployeeWorkshopPdfsWithData(
  //         workshopIdOrData, 
  //         companyIdOrData, 
  //         employeesOrScheduleId, 
  //         schedule_id
  //       );
  //     } else {
  //       // Legacy implementation with IDs
  //       const workshop_id = workshopIdOrData;
  //       const company_id = companyIdOrData;
  //       schedule_id = employeesOrScheduleId; // In old signature, third param is schedule_id
        
  //       console.log('Generating PDFs for workshop:', workshop_id, 'company:', company_id, 'schedule:', schedule_id);
        
  //       // Get workshop details
  //       const [workshopResults] = await db.query(
  //         'SELECT * FROM workshops WHERE id = ?',
  //         [workshop_id]
  //       );
        
  //       if (workshopResults.length === 0) {
  //         throw new Error(`Workshop not found with ID: ${workshop_id}`);
  //       }
        
  //       // Get company details
  //       const [companyResults] = await db.query(
  //         'SELECT * FROM companies WHERE id = ?',
  //         [company_id]
  //       );
        
  //       if (companyResults.length === 0) {
  //         throw new Error(`Company not found with ID: ${company_id}`);
  //       }

  //       // Get schedule details
  //       const [scheduleResults] = await db.query(
  //         'SELECT * FROM workshop_schedules WHERE id = ?',
  //         [schedule_id]
  //       );
        
  //       if (scheduleResults.length === 0) {
  //         throw new Error(`Schedule not found with ID: ${schedule_id}`);
  //       }
        
  //       // Add schedule_id to workshop object for use in PDF generation
  //       const workshop = {
  //         ...workshopResults[0],
  //         schedule_id: schedule_id,
  //         start_time: scheduleResults[0].start_time,
  //         end_time: scheduleResults[0].end_time,
  //         host_name: scheduleResults[0].host_name
  //       };
        
  //       const company = companyResults[0];
        
  //       // Get all active employees in the company
  //       const [employees] = await db.query(
  //         `SELECT ce.user_id, u.first_name, u.last_name, u.email 
  //          FROM company_employees ce
  //          JOIN users u ON ce.user_id = u.user_id
  //          WHERE ce.company_id = ? AND ce.is_active = 1
  //          AND u.role_id NOT IN (1, 2)`,
  //         [company_id]
  //       );
        
  //       return this.generateEmployeeWorkshopPdfsWithData(workshop, company, employees, schedule_id);
  //     }
  //   } catch (error) {
  //     console.error('Error in generateEmployeeWorkshopPdfs:', error);
  //     throw error;
  //   }
  // }

  // static async generateEmployeeWorkshopPdfsWithData(workshopData, companyData, employees, schedule_id) {
  //   try {
  //     if (employees.length === 0) {
  //       return {
  //         status: true,
  //         code: 200,
  //         message: 'No active employees found for this company',
  //         data: []
  //       };
  //     }
      
  //     console.log(`Found ${employees.length} employees to generate PDFs for`);
      
  //     // Generate PDFs for each employee
  //     const pdfPromises = employees.map(employee => 
  //       this.generateSinglePdf(workshopData, companyData, employee, schedule_id)
  //     );
      
  //     const pdfResults = await Promise.all(pdfPromises);
      
  //     // Send emails in the background after returning the response
  //     setTimeout(() => {
  //       this.sendWorkshopTicketEmails(workshopData, companyData, employees, pdfResults)
  //         .catch(error => console.error('Error sending workshop ticket emails:', error));
  //     }, 0);
      
  //     return {
  //       status: true,
  //       code: 200,
  //       message: `Generated ${pdfResults.length} PDFs successfully`,
  //       data: pdfResults
  //     };
  //   } catch (error) {
  //     console.error('Error in generateEmployeeWorkshopPdfsWithData:', error);
  //     throw error;
  //   }
  // }


  // static async generateSinglePdf(workshop, company, employee, schedule_id) {
  //   try {
  //     console.log(`Generating PDF for employee ${employee.first_name} ${employee.last_name} (ID: ${employee.user_id})`);
      
  //     // Generate structured ticket ID
  //     const ticketId = this.generateTicketCode(workshop.id, employee.user_id, schedule_id);
  //     console.log('Generated ticket ID:', ticketId);

  //     // Generate QR code with structured data
  //     const qrCodeData = JSON.stringify({
  //       ticket: ticketId,
  //       workshop: workshop.id,
  //       employee: employee.user_id,
  //       company: company.id,
  //       schedule: schedule_id,
  //       timestamp: new Date().toISOString()
  //     });
      
  //     const qrCodeBase64 = await QRCode.toDataURL(qrCodeData);
  //     console.log('QR code generated successfully');

  //     // Format start time
  //     const startTime = typeof workshop.start_time === 'string' 
  //       ? workshop.start_time 
  //       : new Date(workshop.start_time).toLocaleString();

  //     // Prepare data for template
  //     const templateData = {
  //       firstName: employee.first_name,
  //       workshopTitle: workshop.title,
  //       startTime,
  //       hostName: workshop.host_name,
  //       companyName: company.company_name,
  //       ticketId,
  //       qrCode: qrCodeBase64
  //     };

  //     // Generate HTML from template
  //     const html = await this.generateTicketHtml(templateData);
      
  //     // Convert HTML to PDF
  //     const pdfBuffer = await this.convertHtmlToPdf(html);
  //     console.log('PDF Buffer size:', pdfBuffer.length);

  //     // Upload to S3
  //     const pdfPath = `workshops/${company.company_name}/${workshop.title}/${employee.first_name}_${employee.last_name}_${ticketId}.pdf`;
  //     console.log('Uploading to S3 path:', pdfPath);

  //     await this.uploadToS3(pdfBuffer, pdfPath);
  //     console.log('S3 upload completed successfully');

  //     const pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfPath}`;
  //     console.log('Generated PDF URL:', pdfUrl);

  //     // Store ticket information in database with schedule_id
  //     const ticketData = {
  //       workshop_id: workshop.id,
  //       user_id: employee.user_id,
  //       ticket_code: ticketId,
  //       pdf_url: pdfUrl,
  //       company_id: company.id,
  //       schedule_id: schedule_id
  //     };

  //     console.log('Inserting ticket data:', ticketData);

  //     await db.query(
  //       `INSERT INTO workshop_tickets 
  //         (workshop_id, user_id, company_id, ticket_code, pdf_url, schedule_id) 
  //        VALUES (?, ?, ?, ?, ?, ?)`,
  //       [ticketData.workshop_id, ticketData.user_id, ticketData.company_id, 
  //        ticketData.ticket_code, ticketData.pdf_url, ticketData.schedule_id]
  //     );

  //     return {
  //       employeeId: employee.user_id,
  //       ticketId,
  //       pdfUrl
  //     };
  //   } catch (error) {
  //     console.error('Error in generateSinglePdf:', error);
  //     throw error;
  //   }
  // }

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
  
  static async generateTicketHtml(data) {
    const templatePath = path.join(__dirname, '../../../templates/workshop-ticket.html');
    
    // Create template if it doesn't exist (first time)
    if (!fs.existsSync(templatePath)) {
      const templateContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Workshop Ticket</title>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
            }
            .ticket-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #0066cc, #0052a3);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              padding: 20px;
            }
            .workshop-title {
              font-size: 24px;
              font-weight: bold;
              margin: 15px 0;
              color: #0066cc;
            }
            .details {
              margin: 20px 0;
              line-height: 1.6;
            }
            .qr-code {
              text-align: center;
              margin: 20px 0;
            }
            .qr-code img {
              max-width: 200px;
            }
            .ticket-id {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin: 10px 0;
              color: #0066cc;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="header">
              <h1>Workshop Ticket</h1>
            </div>
            <div class="content">
              <p>Hi {{firstName}},</p>
              <p>You're all set for the upcoming workshop! Below are your workshop details.</p>
              
              <div class="workshop-title">{{workshopTitle}}</div>
              
              <div class="details">
                <p><strong>Date & Time:</strong> {{startTime}}</p>
                <p><strong>Hosted by:</strong> {{hostName}}</p>
                <p><strong>Company:</strong> {{companyName}}</p>
              </div>
              
              <div class="ticket-id">Ticket ID: {{ticketId}}</div>
              
              <div class="qr-code">
                <img src="{{qrCode}}" alt="QR Code">
                <p>Show this QR code or Ticket ID to check-in</p>
              </div>
            </div>
            <div class="footer">
              <p>This ticket was generated by Neure.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      fs.writeFileSync(templatePath, templateContent);
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);
    return template(data);
  }

  static async convertHtmlToPdf(html) {
    try {
      console.log('Using html-pdf for workshop ticket generation...');
      const htmlPdf = require('html-pdf');
      
      return new Promise((resolve, reject) => {
        const options = {
          format: 'A4',
          border: {
            top: '1cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm'
          },
          // Prevent page breaks
          pageBreak: { mode: 'avoid-all' },
          // Faster rendering
          timeout: 30000,
          // Better rendering quality
          quality: '100',
          // Enable background colors and images
          printBackground: true
        };
        
        htmlPdf.create(html, options).toBuffer((err, buffer) => {
          if (err) {
            console.error('Error in html-pdf conversion:', err);
            reject(err);
          } else {
            console.log('Workshop ticket PDF generated successfully, size:', buffer.length);
            resolve(buffer);
          }
        });
      });
    } catch (error) {
      console.error('Error generating PDF with html-pdf:', error);
      throw new Error(`Workshop ticket PDF generation failed: ${error.message}`);
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

  // New method to send emails in the background
  static async sendWorkshopTicketEmails(workshop, company, employees, pdfResults) {
    try {
      console.log(`Starting to send ${pdfResults.length} workshop ticket emails...`);
      
      // Create a map of user_id to pdfUrl for quick lookup
      const ticketMap = pdfResults.reduce((map, result) => {
        map[result.employeeId] = {
          ticketId: result.ticketId,
          pdfUrl: result.pdfUrl
        };
        return map;
      }, {});
      
      // Format the start time for display
      const formattedStartTime = new Date(workshop.start_time).toLocaleString();
      
      // Send emails to each employee
      const emailPromises = employees.map(employee => {
        const ticketInfo = ticketMap[employee.user_id];
        if (!ticketInfo) return Promise.resolve(); // Skip if no ticket info
        
        return EmailService.sendWorkshopTicketEmail(
          employee.first_name,
          employee.email,
          workshop.title,
          formattedStartTime,
          workshop.host_name,
          company.company_name,
          ticketInfo.ticketId,
          ticketInfo.pdfUrl
        );
      });
      
      await Promise.all(emailPromises);
      console.log(`Successfully sent ${emailPromises.length} workshop ticket emails`);
    } catch (error) {
      console.error('Error sending workshop ticket emails:', error);
      // Log error but don't throw since this is running in the background
    }
  }

  static async generateTicketsForWorkshop(workshopData, companyData, employees, scheduleId) {
    try {
      console.log(`Generating tickets for ${employees.length} employees`);
      
      const ticketPromises = employees.map(async (employee) => {
        // Generate structured ticket ID
        const ticketId = this.generateTicketCode(workshopData.id, employee.user_id, scheduleId);
        
        // Insert ticket into database
        await db.query(
          `INSERT INTO workshop_tickets 
           (workshop_id, user_id, company_id, schedule_id, ticket_code, is_attended, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, FALSE, NOW(), NOW())`,
          [workshopData.id, employee.user_id, companyData.id, scheduleId, ticketId]
        );
        
        return {
          employeeId: employee.user_id,
          ticketId
        };
      });
      
      const ticketResults = await Promise.all(ticketPromises);
      
      // Generate PDFs in the background
      setTimeout(() => {
        this.generatePdfsForWorkshopTickets(workshopData, companyData, employees, scheduleId, ticketResults)
          .catch(error => console.error('Error generating PDFs for workshop tickets:', error));
      }, 0);
      
      return ticketResults;
    } catch (error) {
      console.error('Error in generateTicketsForWorkshop:', error);
      throw error;
    }
  }

  static async generatePdfsForWorkshopTickets(workshopData, companyData, employees, scheduleId, ticketResults) {
    try {
      console.log(`Starting background PDF generation for ${employees.length} employees`);
      
      // Create a map for quick ticket lookup
      const ticketMap = ticketResults.reduce((map, result) => {
        map[result.employeeId] = result.ticketId;
        return map;
      }, {});
      
      // Generate PDFs for each employee
      const pdfPromises = employees.map(async (employee) => {
        try {
          const ticketId = ticketMap[employee.user_id];
          if (!ticketId) return null;
          
          console.log(`Starting PDF generation for employee ${employee.first_name} ${employee.last_name} with ticket ${ticketId}`);
          return await this.generateSinglePdfWithTicket(workshopData, companyData, employee, scheduleId, ticketId);
        } catch (error) {
          console.error(`Error generating PDF for employee ${employee.user_id}:`, error);
          return null;
        }
      });
      
      const pdfResults = (await Promise.all(pdfPromises)).filter(Boolean);
      console.log(`Successfully generated ${pdfResults.length} PDFs out of ${employees.length} employees`);
      
      if (pdfResults.length > 0) {
        // Send emails with tickets
        await this.sendWorkshopTicketEmails(workshopData, companyData, employees, pdfResults);
      } else {
        console.error('No PDFs were successfully generated');
      }
      
      console.log(`Completed background generation of ${pdfResults.length} PDFs`);
      return pdfResults;
    } catch (error) {
      console.error('Error in generatePdfsForWorkshopTickets:', error);
      // Don't throw since this is running in background
    }
  }

  static async generateSinglePdfWithTicket(workshop, company, employee, scheduleId, ticketId) {
    try {
      console.log(`Generating PDF for employee ${employee.first_name} ${employee.last_name} (ID: ${employee.user_id})`);
      
      // Generate QR code with structured data
      const qrCodeData = JSON.stringify({
        ticket: ticketId,
        workshop: workshop.id,
        employee: employee.user_id,
        company: company.id,
        schedule: scheduleId,
        timestamp: new Date().toISOString()
      });
      
      console.log('Generating QR code...');
      const qrCodeBase64 = await QRCode.toDataURL(qrCodeData);
      console.log('QR code generated successfully');
      
      // Format start time
      const startTime = typeof workshop.start_time === 'string' 
        ? workshop.start_time 
        : new Date(workshop.start_time).toLocaleString();

      // Prepare data for template
      const templateData = {
        firstName: employee.first_name,
        workshopTitle: workshop.title,
        startTime,
        hostName: workshop.host_name || 'Workshop Host',
        companyName: company.company_name,
        ticketId,
        qrCode: qrCodeBase64
      };

      console.log('Generating HTML from template...');
      // Generate HTML from template
      const html = await this.generateTicketHtml(templateData);
      
      console.log('Converting HTML to PDF...');
      // Convert HTML to PDF using html-pdf instead of puppeteer
      const pdfBuffer = await this.convertHtmlToPdf(html);
      console.log('PDF generated successfully, size:', pdfBuffer.length);

      // Upload to S3
      const pdfPath = `workshops/${company.company_name.replace(/[^a-zA-Z0-9]/g, '_')}/${workshop.title.replace(/[^a-zA-Z0-9]/g, '_')}/${employee.first_name}_${employee.last_name}_${ticketId}.pdf`;
      console.log('Uploading to S3 path:', pdfPath);
      
      await this.uploadToS3(pdfBuffer, pdfPath);
      console.log('S3 upload completed successfully');

      const pdfUrl = this.constructPdfUrl(pdfPath);
      console.log('Generated PDF URL:', pdfUrl);
      
      // Update PDF URL in database
      await db.query(
        `UPDATE workshop_tickets 
         SET pdf_url = ? 
         WHERE workshop_id = ? AND user_id = ? AND schedule_id = ?`,
        [pdfUrl, workshop.id, employee.user_id, scheduleId]
      );
      console.log('Database updated with PDF URL');

      return {
        employeeId: employee.user_id,
        ticketId,
        pdfUrl
      };
    } catch (error) {
      console.error('Error in generateSinglePdfWithTicket:', error);
      return null;
    }
  }
}

module.exports = WorkshopPdfService;
