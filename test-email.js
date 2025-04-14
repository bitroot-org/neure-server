const { SESClient, SendEmailCommand, GetSendQuotaCommand, ListVerifiedEmailAddressesCommand } = require("@aws-sdk/client-ses");
require('dotenv').config();

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function checkSESConfiguration() {
  try {
    // Check sending quota
    const quotaCommand = new GetSendQuotaCommand({});
    const quotaResponse = await sesClient.send(quotaCommand);
    console.log("\nSES Quota Information:");
    console.log("Max 24 Hour Send:", quotaResponse.Max24HourSend);
    console.log("Max Send Rate:", quotaResponse.MaxSendRate);
    console.log("Sent Last 24 Hours:", quotaResponse.SentLast24Hours);

    // Check verified email addresses
    const verifiedEmailsCommand = new ListVerifiedEmailAddressesCommand({});
    const verifiedEmailsResponse = await sesClient.send(verifiedEmailsCommand);
    console.log("\nVerified Email Addresses:");
    console.log(verifiedEmailsResponse.VerifiedEmailAddresses);

    // Check if sender and recipient are verified
    const senderVerified = verifiedEmailsResponse.VerifiedEmailAddresses.includes(process.env.SENDER_EMAIL);
    const recipientVerified = verifiedEmailsResponse.VerifiedEmailAddresses.includes("praveensonesha2003@gmail.com");

    console.log("\nVerification Status:");
    console.log("Sender Email Verified:", senderVerified);
    console.log("Recipient Email Verified:", recipientVerified);

    if (!senderVerified) {
      console.error("\nWarning: Sender email is not verified!");
      console.log("Please verify your sender email in AWS SES console:");
      console.log(`https://${process.env.AWS_REGION}.console.aws.amazon.com/ses/home`);
    }

    if (!recipientVerified && quotaResponse.Max24HourSend < 50000) {
      console.error("\nWarning: Account is in sandbox mode and recipient email is not verified!");
      console.log("Please verify the recipient email or request production access.");
    }

    return { senderVerified, recipientVerified, inSandbox: quotaResponse.Max24HourSend < 50000 };
  } catch (error) {
    console.error("Error checking SES configuration:", error);
    return null;
  }
}

// Function to test the SES email service
async function testSESEmail() {
  console.log("Starting AWS SES email service test...");

  // Check SES configuration first
  const configCheck = await checkSESConfiguration();
  if (!configCheck) {
    console.error("Failed to check SES configuration. Aborting test.");
    return;
  }

  // Verify environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("Error: AWS credentials not found in environment variables");
    return;
  }

  if (!process.env.SENDER_EMAIL) {
    console.error("Error: SENDER_EMAIL not found in environment variables");
    return;
  }

  // Log environment variables (masked for security)
  console.log("Environment Variables:");
  console.log("AWS_REGION:", process.env.AWS_REGION);
  console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "****" + process.env.AWS_ACCESS_KEY_ID.slice(-4) : "Not Set");
  console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "********" : "Not Set");
  console.log("SENDER_EMAIL:", process.env.SENDER_EMAIL);

  try {
    // Create SendEmailCommand
    const sendEmailCommand = new SendEmailCommand({
      Destination: {
        ToAddresses: ["praveensonesha2003@gmail.com"], // Replace with recipient email
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
              <h1>Test Email from AWS SES</h1>
              <p>This is a test email sent using AWS SES SDK.</p>
              <p>If you received this email, your SES configuration is working correctly!</p>
              <p>Time sent: ${new Date().toISOString()}</p>
              <p>MessageId: ${Date.now()}</p>
              <p>Regards,<br>Team Neure</p>
            `,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `Test Email from AWS SES (${new Date().toLocaleTimeString()})`,
        },
      },
      Source: process.env.SENDER_EMAIL,
    });

    console.log("\nSending email...");
    const response = await sesClient.send(sendEmailCommand);
    console.log("Email sent successfully!", {
      messageId: response.MessageId,
      requestId: response.$metadata.requestId,
      status: response.$metadata.httpStatusCode,
      timestamp: new Date().toISOString()
    });

    console.log("\nNext steps if email not received:");
    console.log("1. Check your spam folder");
    console.log("2. Wait a few minutes as email delivery might be delayed");
    console.log("3. Verify the recipient email address in AWS SES if in sandbox mode");
    console.log(`4. Check AWS SES console for bounces: https://${process.env.AWS_REGION}.console.aws.amazon.com/ses/home`);

  } catch (error) {
    console.error("Error sending email:", {
      message: error.message,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode
    });
  }
}

// Execute the test
testSESEmail();