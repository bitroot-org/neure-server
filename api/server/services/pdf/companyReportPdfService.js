// const puppeteer = require('puppeteer');
// const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
// const db = require("../../../config/db");
// const fs = require('fs');
// const path = require('path');
// const { nanoid } = require('nanoid');
// const handlebars = require('handlebars');

// class CompanyReportPdfService {
//   static async generateWellbeingReport(companyId, startDate, endDate) {
//     try {
//       console.log('Starting well-being report generation for company:', companyId);
      
//       // 1. Get company details
//       const [companies] = await db.query(
//         'SELECT * FROM companies WHERE id = ?',
//         [companyId]
//       );

//       if (!companies || companies.length === 0) {
//         throw new Error(`Company not found with ID: ${companyId}`);
//       }

//       const company = companies[0];
      
//       // 2. Get company metrics
//       const [metrics] = await db.query(
//         `SELECT 
//           psychological_safety_index, 
//           retention_rate, 
//           stress_level, 
//           engagement_score,
//           (SELECT COUNT(*) FROM company_employees WHERE company_id = ? AND is_active = 1) as active_employees,
//           (SELECT COUNT(*) FROM company_employees WHERE company_id = ? AND is_active = 0) as inactive_employees,
//           (SELECT COUNT(DISTINCT department_id) FROM company_departments WHERE company_id = ?) as total_departments,
//           (SELECT MAX(created_at) FROM company_employees WHERE company_id = ? LIMIT 1) as last_employee_joined
//         FROM companies 
//         WHERE id = ?`,
//         [companyId, companyId, companyId, companyId, companyId]
//       );
      
//       // Format the last employee joined date to show only DD/MM/YYYY
//       if (metrics[0] && metrics[0].last_employee_joined) {
//         const date = new Date(metrics[0].last_employee_joined);
//         const day = String(date.getDate()).padStart(2, '0');
//         const month = String(date.getMonth() + 1).padStart(2, '0');
//         const year = date.getFullYear();
//         metrics[0].last_employee_joined = `${day}/${month}/${year}`;
//       }
      
//       // 3. Get trend data
//       const [trends] = await db.query(
//         `SELECT 
//           recorded_date as date,
//           AVG(engagement_score) as avg_engagement_score,
//           AVG(stress_level) as avg_stress_level
//         FROM employee_daily_history
//         WHERE company_id = ? AND DATE(recorded_date) BETWEEN ? AND ?
//         GROUP BY recorded_date
//         ORDER BY recorded_date ASC`,
//         [companyId, startDate, endDate]
//       );
      
//       // 4. Prepare data for HTML template
//       const reportData = {
//         company: company,
//         metrics: metrics[0] || {},
//         trends: trends,
//         startDate: new Date(startDate).toLocaleDateString(),
//         endDate: new Date(endDate).toLocaleDateString(),
//         generatedDate: new Date().toLocaleDateString(),
//         chartData: this.prepareChartData(trends)
//       };
      
//       // 5. Generate HTML from template
//       const html = await this.generateHtml(reportData);
      
//       // 6. Convert HTML to PDF
//       const pdfBuffer = await this.convertHtmlToPdf(html);
      
//       // 7. Upload to S3
//       const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
//       const sanitizedCompanyName = company.company_name.replace(/\s+/g, '_');
//       const pdfPath = `reports/${sanitizedCompanyName}/wellbeing_report_${timestamp}.pdf`;
      
//       await this.uploadToS3(pdfBuffer, pdfPath);
      
//       const pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfPath}`;
      
//       return {
//         status: true,
//         message: 'Well-being report generated successfully',
//         data: {
//           pdfUrl,
//           companyName: company.company_name,
//           reportDate: new Date().toISOString()
//         }
//       };
//     } catch (error) {
//       console.error('Error in generateWellbeingReport:', error);
//       throw new Error(`Error generating well-being report: ${error.message}`);
//     }
//   }
  
//   static prepareChartData(trends) {
//     if (!trends || trends.length === 0) {
//       return JSON.stringify({
//         labels: [],
//         datasets: []
//       });
//     }
    
//     const dates = trends.map(t => new Date(t.date).toLocaleDateString());
//     const engagementScores = trends.map(t => {
//       const score = parseFloat(t.avg_engagement_score);
//       return isNaN(score) ? 0 : score;
//     });
//     const stressLevels = trends.map(t => {
//       const level = parseFloat(t.avg_stress_level);
//       return isNaN(level) ? 0 : level;
//     });
    
//     return JSON.stringify({
//       labels: dates,
//       datasets: [
//         {
//           label: 'Engagement Score',
//           data: engagementScores,
//           borderColor: 'rgb(75, 192, 192)',
//           backgroundColor: 'rgba(75, 192, 192, 0.1)',
//           fill: true
//         },
//         {
//           label: 'Stress Level',
//           data: stressLevels,
//           borderColor: 'rgb(255, 99, 132)',
//           backgroundColor: 'rgba(255, 99, 132, 0.1)',
//           fill: true
//         }
//       ]
//     });
//   }
  
//   static async generateHtml(data) {
//     // Use only the path that's working
//     const templatePath = path.join(__dirname, '../../../templates/wellbeing-report.html');
//     console.log('Looking for template at:', templatePath);
    
//     if (!fs.existsSync(templatePath)) {
//       throw new Error(`Template file not found at ${templatePath}`);
//     }
    
//     const templateContent = fs.readFileSync(templatePath, 'utf8');
    
//     // Compile the template with Handlebars
//     const template = handlebars.compile(templateContent);
    
//     // Return the HTML with data
//     return template(data);
//   }
  
//   static async convertHtmlToPdf(html) {
//     const browser = await puppeteer.launch({
//       headless: 'new',
//       args: ['--no-sandbox', '--disable-setuid-sandbox']
//     });
    
//     try {
//       const page = await browser.newPage();
      
//       // Set viewport for better rendering
//       await page.setViewport({
//         width: 1024,
//         height: 1440,
//         deviceScaleFactor: 1,
//       });
      
//       await page.setContent(html, { 
//         waitUntil: 'networkidle0'
//       });
      
//       const pdfBuffer = await page.pdf({
//         format: 'A4',
//         printBackground: true,
//         preferCSSPageSize: true,
//         margin: {
//           top: '15px',
//           right: '15px',
//           bottom: '15px',
//           left: '15px'
//         }
//       });
      
//       return pdfBuffer;
//     } catch (error) {
//       console.error('Error generating PDF:', error);
//       throw new Error(`PDF generation failed: ${error.message}`);
//     } finally {
//       await browser.close();
//     }
//   }
  
//   static async uploadToS3(pdfBuffer, pdfPath) {
//     try {
//       // Create S3 client with proper configuration
//       const s3Client = new S3Client({
//         region: process.env.AWS_REGION,
//         credentials: {
//           accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//           secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//         }
//       });

//       // Sanitize path to ensure proper formatting
//       const sanitizedPath = pdfPath.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._\/-]/g, '');

//       // Set upload parameters with proper content type and caching
//       const uploadParams = {
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: sanitizedPath,
//         Body: pdfBuffer,
//         ContentType: 'application/pdf',
//         ContentDisposition: `inline; filename="${path.basename(sanitizedPath)}"`,
//         CacheControl: 'max-age=31536000',
//         ACL: 'public-read'
//       };

//       // Use the existing s3Client instance
//       const command = new PutObjectCommand(uploadParams);
//       const response = await s3Client.send(command);
//       console.log('Report PDF uploaded successfully to S3:', sanitizedPath);
      
//       return response.Location || `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${sanitizedPath}`;
//     } catch (error) {
//       console.error('Error in uploadToS3:', error);
//       throw new Error(`Failed to upload PDF to S3: ${error.message}`);
//     }
//   }
// }

// module.exports = CompanyReportPdfService;









const { chromium } = require('playwright');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const db = require("../../../config/db");
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const handlebars = require('handlebars');
const EmailService = require("../email/emailService");

class CompanyReportPdfService {
  static async generateWellbeingReport(companyId, startDate, endDate) {
    try {
      console.log('Starting well-being report generation for company:', companyId);

      // 1. Get company details
      const [companies] = await db.query(
        'SELECT * FROM companies WHERE id = ?',
        [companyId]
      );

      if (!companies || companies.length === 0) {
        throw new Error(`Company not found with ID: ${companyId}`);
      }

      const company = companies[0];

      // 2. Get company metrics
      const [metrics] = await db.query(
        `SELECT 
          psychological_safety_index, 
          retention_rate, 
          stress_level, 
          engagement_score,
          (SELECT COUNT(*) FROM company_employees WHERE company_id = ? AND is_active = 1) as active_employees,
          (SELECT COUNT(*) FROM company_employees WHERE company_id = ? AND is_active = 0) as inactive_employees,
          (SELECT COUNT(DISTINCT department_id) FROM company_departments WHERE company_id = ?) as total_departments,
          (SELECT MAX(created_at) FROM company_employees WHERE company_id = ? LIMIT 1) as last_employee_joined
        FROM companies 
        WHERE id = ?`,
        [companyId, companyId, companyId, companyId, companyId]
      );

      if (metrics[0] && metrics[0].last_employee_joined) {
        const date = new Date(metrics[0].last_employee_joined);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        metrics[0].last_employee_joined = `${day}/${month}/${year}`;
      }

      // 3. Get trend data
      const [trends] = await db.query(
        `SELECT 
          recorded_date as date,
          AVG(engagement_score) as avg_engagement_score,
          AVG(stress_level) as avg_stress_level
        FROM employee_daily_history
        WHERE company_id = ? AND DATE(recorded_date) BETWEEN ? AND ?
        GROUP BY recorded_date
        ORDER BY recorded_date ASC`,
        [companyId, startDate, endDate]
      );

      // 4. Prepare data for HTML template
      const reportData = {
        company,
        metrics: metrics[0] || {},
        trends,
        startDate: new Date(startDate).toLocaleDateString(),
        endDate: new Date(endDate).toLocaleDateString(),
        generatedDate: new Date().toLocaleDateString(),
        chartData: this.prepareChartData(trends)
      };

      // 5. Generate HTML from template
      const html = await this.generateHtml(reportData);

      // 6. Convert HTML to PDF
      const pdfBuffer = await this.convertHtmlToPdf(html);

      // 7. Upload to S3
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
      const sanitizedCompanyName = company.company_name.replace(/\s+/g, '_');
      const pdfPath = `reports/${sanitizedCompanyName}/wellbeing_report_${timestamp}.pdf`;

      await this.uploadToS3(pdfBuffer, pdfPath);

      const pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfPath}`;

      return {
        status: true,
        message: 'Well-being report generated successfully',
        data: {
          pdfUrl,
          companyName: company.company_name,
          reportDate: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error in generateWellbeingReport:', error);
      throw new Error(`Error generating well-being report: ${error.message}`);
    }
  }

  static prepareChartData(trends) {
    if (!trends || trends.length === 0) {
      return JSON.stringify({ labels: [], datasets: [] });
    }

    const dates = trends.map(t => new Date(t.date).toLocaleDateString());
    const engagementScores = trends.map(t => {
      const score = parseFloat(t.avg_engagement_score);
      return isNaN(score) ? 0 : score;
    });
    const stressLevels = trends.map(t => {
      const level = parseFloat(t.avg_stress_level);
      return isNaN(level) ? 0 : level;
    });

    return JSON.stringify({
      labels: dates,
      datasets: [
        { label: 'Engagement Score', data: engagementScores, fill: true },
        { label: 'Stress Level', data: stressLevels, fill: true }
      ]
    });
  }

  static async generateHtml(data) {
    const templatePath = path.join(__dirname, '../../../templates/wellbeing-report.html');
    console.log('Looking for template at:', templatePath);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at ${templatePath}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);
    return template(data);
  }

  static async convertHtmlToPdf(html) {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1024, height: 1440 });
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.emulateMedia({ media: 'print' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
        displayHeaderFooter: true,
        headerTemplate: `<div></div>`,
        footerTemplate: `
          <div style="font-size:0.7rem; width:100%; text-align:center; color:#888;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  static async uploadToS3(pdfBuffer, pdfPath) {
    try {
      const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });

      const sanitizedPath = pdfPath.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._\/\-]/g, '');
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: sanitizedPath,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ContentDisposition: `inline; filename="${path.basename(sanitizedPath)}"`,
        CacheControl: 'max-age=31536000',
        ACL: 'public-read'
      };

      const command = new PutObjectCommand(uploadParams);
      const response = await s3Client.send(command);
      console.log('Report PDF uploaded successfully to S3:', sanitizedPath);

      return response.Location || `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${sanitizedPath}`;
    } catch (error) {
      console.error('Error in uploadToS3:', error);
      throw new Error(`Failed to upload PDF to S3: ${error.message}`);
    }
  }

  static async emailWellbeingReport(companyId, startDate, endDate) {
    try {
      // First generate the report
      const reportResult = await this.generateWellbeingReport(companyId, startDate, endDate);
      
      if (!reportResult.status) {
        throw new Error(`Failed to generate report: ${reportResult.message}`);
      }
      
      // Get company contact person email
      const [companies] = await db.query(
        'SELECT c.*, u.email, u.first_name FROM companies c JOIN users u ON c.contact_person_id = u.user_id WHERE c.id = ?',
        [companyId]
      );
      
      if (!companies || companies.length === 0) {
        throw new Error(`Company not found with ID: ${companyId}`);
      }
      
      const company = companies[0];
      
      if (!company.email) {
        throw new Error('Contact person email not found');
      }
      
      // Format dates for display
      const formattedStartDate = new Date(startDate).toLocaleDateString();
      const formattedEndDate = new Date(endDate).toLocaleDateString();
      
      // Send email with the report URL using the template
      await EmailService.sendWellbeingReportEmail(
        company.first_name,
        company.company_name,
        company.email,
        formattedStartDate,
        formattedEndDate,
        reportResult.data.pdfUrl
      );
      
      return {
        status: true,
        message: 'Well-being report emailed successfully',
        data: {
          sentTo: company.email,
          companyName: company.company_name,
          reportDate: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error in emailWellbeingReport:', error);
      throw new Error(`Error emailing well-being report: ${error.message}`);
    }
  }
}

module.exports = CompanyReportPdfService;
