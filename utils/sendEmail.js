    const nodemailer = require('nodemailer');

    /**
     * Sends an email via Mailtrap (or any SMTP provider) using nodemailer.
     * Requires these env vars to be set:
     *   SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD,
     *   SMTP_FROM_NAME, SMTP_FROM_EMAIL
     *
     * @param {Object} options
     * @param {string} options.email   - recipient email address
     * @param {string} options.subject - email subject line
     * @param {string} options.message - HTML content of the email
     */
    const sendEmail = async (options) => {
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        const message = {
            from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            html: options.message,
            attachments: options.attachments || []
        };

        await transporter.sendMail(message);
    };

    module.exports = sendEmail;