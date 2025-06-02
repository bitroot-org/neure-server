const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const EmailTemplates = require('./emailTemplates');

class EmailService {
  static sesClient = new SESClient({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // Flag to control email redirection (can be set via environment variable)
  static REDIRECT_EMAILS = process.env.REDIRECT_EMAILS === "true";
  static FIXED_EMAIL = process.env.TEST_EMAIL || "c2905y@gmail.com";

  // Define dashboard URLs as static properties
  static EMPLOYEE_DASHBOARD_URL = "https://main.d20xlhmrfjnx3n.amplifyapp.com/";
  static ADMIN_DASHBOARD_URL = "https://main.d141ack5c21hha.amplifyapp.com/";

  static async sendEmail({ to, subject, html }) {
    try {
      // Determine the recipient based on the redirection flag
      // const recipient = this.REDIRECT_EMAILS ? this.FIXED_EMAIL : to;

      const recipient = to || this.FIXED_EMAIL;
      console.log("Sending email to recipient:", recipient);
      
      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: [recipient],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: html,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: subject,
          },
        },
        Source: process.env.SENDER_EMAIL,
      });

      const response = await this.sesClient.send(command);
      console.log("Email sent successfully:", response.MessageId);
      
      // Log redirection if it's happening
      if (this.REDIRECT_EMAILS && to !== recipient) {
        console.log(`Email redirected: Original recipient (${to}) → ${recipient}`);
      }
      
      return { success: true, messageId: response.MessageId };
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  static async sendAdminWelcomeEmail(adminName, username, tempPassword, adminEmail) {
    const template = EmailTemplates.adminWelcomeTemplate(
      adminName, 
      username, 
      tempPassword, 
      this.ADMIN_DASHBOARD_URL
    );
    return this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html
    });
  }

  static async sendEmployeeWelcomeEmail(employeeName, email, password, dashboardLink = null) {
    const template = EmailTemplates.employeeWelcomeTemplate(
      employeeName, 
      email, 
      password, 
      dashboardLink || this.EMPLOYEE_DASHBOARD_URL
    );
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html
    });
  }

  static async sendEmployeeRewardEmail(employeeName, adminName, email) {
    
    const template = EmailTemplates.employeeRewardTemplate(employeeName, adminName);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html
    });
  }

  static async sendRewardRedemptionAdminEmail(adminName, employeeName, rewardName, adminEmail) {
    const template = EmailTemplates.rewardRedemptionAdminTemplate(adminName, employeeName, rewardName);
    return this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html
    });
  }

  static async sendWellbeingReportEmail(contactName, companyName, email, startDate, endDate, reportUrl) {
    const template = EmailTemplates.wellbeingReportTemplate(contactName, companyName, startDate, endDate, reportUrl);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html
    });
  }

  static async sendAccountDeactivationEmail(employeeName, email, companyName) {
    const template = EmailTemplates.accountDeactivationTemplate(employeeName, companyName);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html
    });
  }

  static async sendWorkshopTicketEmail(employeeName, email, workshopTitle, startTime, hostName, companyName, ticketId, pdfUrl) {
    const template = EmailTemplates.workshopTicketTemplate(employeeName, workshopTitle, startTime, hostName, companyName, ticketId, pdfUrl);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html
    });
  }

  static async sendSuperAdminWelcomeEmail(adminName, username, tempPassword, adminEmail) {
    const template = EmailTemplates.superAdminWelcomeTemplate(
      adminName, 
      username, 
      tempPassword, 
      this.ADMIN_DASHBOARD_URL
    );
    return this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html
    });
  }

  static async sendRewardClaimConfirmationEmail(employeeName, rewardName, employeeEmail) {
    const template = EmailTemplates.rewardClaimConfirmationTemplate(employeeName, rewardName);
    return this.sendEmail({
      to: employeeEmail,
      subject: template.subject,
      html: template.html
    });
  }
}

module.exports = EmailService;
