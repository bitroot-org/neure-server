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

  // Add a constant for the fixed email address
  static FIXED_EMAIL = "c2905y@gmail.com";

  static async sendEmail({ to, subject, html }) {
    try {
      const command = new SendEmailCommand({
        Destination: {
          // Always send to the fixed email address
          ToAddresses: [this.FIXED_EMAIL],
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
      console.log("Redirected to:", this.FIXED_EMAIL); // Log the redirection
      return { success: true, messageId: response.MessageId };
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  static async sendAdminWelcomeEmail(adminName, username, tempPassword, dashboardLink) {
    const template = EmailTemplates.adminWelcomeTemplate(adminName, username, tempPassword, dashboardLink);
    return this.sendEmail({
      to: this.FIXED_EMAIL,
      subject: template.subject,
      html: template.html
    });
  }

  static async sendEmployeeWelcomeEmail(employeeName, email, password, dashboardLink) {
    const template = EmailTemplates.employeeWelcomeTemplate(employeeName, email, password, dashboardLink);
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

  static async sendRewardRedemptionAdminEmail(adminName, employeeName, rewardName) {
    const template = EmailTemplates.rewardRedemptionAdminTemplate(adminName, employeeName, rewardName);
    return this.sendEmail({
      to: this.FIXED_EMAIL,
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
}

module.exports = EmailService;
