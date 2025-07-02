const nodemailer = require("nodemailer");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

/**
 * Send an email using Gmail SMTP
 * @param {string} to Who the email is being sent to.
 * @param {string} cc Who to include in the CC of the email.
 * @param {string} subject The subject line of the email.
 * @param {string} body The main content of the email.
 * @param {string} bcc Who to include in the BCC of the email.
 * @param {string} [attachmentPath] Optional path to an attachment.
 * @returns {Promise<string>} Returns "Success" on successful send
 */
function sendEmail(to, cc, bcc, subject, body, attachmentPath) {
  return new Promise(async function (resolve, reject) {
    try {
      const transporter = nodemailer.createTransporter({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER || "johngaynordev@gmail.com",
          pass: process.env.GMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.GMAIL_USER || "johngaynordev@gmail.com",
        to: to,
        cc: cc,
        bcc: bcc,
        subject:
          process.env.NODE_ENV === "development" ? "TEST: " + subject : subject,
        text:
          process.env.NODE_ENV === "development"
            ? `Test Environment Email
To: ${to}
CC: ${cc}
BCC: ${bcc}

${body}`
            : body,
        attachments: attachmentPath
          ? [
              {
                filename: path.basename(attachmentPath),
                path: attachmentPath,
                contentType: "application/pdf",
              },
            ]
          : [],
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully: ${info.messageId}`);
      resolve("Success");
    } catch (error) {
      console.error("Email sending failed:", error);
      reject(error);
    }
  });
}

module.exports = { sendEmail };
