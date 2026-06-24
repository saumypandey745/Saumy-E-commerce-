const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
        
        if (hasSmtpConfig) {
            console.log('[EmailService] Initializing real SMTP transport...');
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            console.warn('[EmailService] SMTP credentials missing in environment variables. Falling back to Mock console logger.');
            this.transporter = null;
        }
    }

    async sendVerificationEmail(email, token, otpCode) {
        const verificationLink = `http://localhost:3000/verify-email?token=${token}`;
        
        console.log(`[EmailService] Sending verification email to ${email}`);
        console.log(`[EmailService] OTP Code: ${otpCode || 'N/A'}`);
        console.log(`[EmailService] Link: ${verificationLink}`);

        if (this.transporter) {
            try {
                const mailOptions = {
                    from: process.env.SMTP_FROM || '"E-Commerce Enterprise" <noreply@enterprise.com>',
                    to: email,
                    subject: 'Verify Your E-Commerce Enterprise Account',
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2>Welcome to E-Commerce Enterprise!</h2>
                            <p>Thank you for registering. Please use the following 6-digit OTP code to verify your account:</p>
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0; max-width: 200px;">
                                ${otpCode}
                            </div>
                            <p>Or click the link below to verify directly:</p>
                            <p><a href="${verificationLink}" style="color: #2563eb; font-weight: bold;">Verify Account Direct Link</a></p>
                            <p>If you did not request this, please ignore this email.</p>
                        </div>
                    `
                };
                await this.transporter.sendMail(mailOptions);
                console.log(`[EmailService] Real verification email successfully sent to: ${email}`);
                return true;
            } catch (error) {
                console.error(`[EmailService] Failed to send real email to ${email}:`, error);
                return false;
            }
        }
        return true;
    }

    async sendPasswordResetEmail(email, token) {
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;
        
        console.log(`[EmailService] Sending password reset email to ${email}`);
        console.log(`[EmailService] Link: ${resetLink}`);

        if (this.transporter) {
            try {
                const mailOptions = {
                    from: process.env.SMTP_FROM || '"E-Commerce Enterprise" <noreply@enterprise.com>',
                    to: email,
                    subject: 'Reset Your Password',
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2>Password Reset Request</h2>
                            <p>We received a request to reset your password. Click the link below to set a new password:</p>
                            <p><a href="${resetLink}" style="color: #2563eb; font-weight: bold;">Reset Password Link</a></p>
                            <p>If you did not request this, please ignore this email.</p>
                        </div>
                    `
                };
                await this.transporter.sendMail(mailOptions);
                console.log(`[EmailService] Real password reset email successfully sent to: ${email}`);
                return true;
            } catch (error) {
                console.error(`[EmailService] Failed to send real password reset email to ${email}:`, error);
                return false;
            }
        }
        return true;
    }
}

module.exports = new EmailService();
