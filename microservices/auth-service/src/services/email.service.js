/**
 * Mock Email Service
 * In a real application, this would use AWS SES, SendGrid, or nodemailer.
 */
class EmailService {
    async sendVerificationEmail(email, token) {
        console.log(`[EMAIL_SERVICE] Sending verification email to ${email}`);
        console.log(`[EMAIL_SERVICE] Link: http://localhost:3000/verify-email?token=${token}`);
        return true;
    }

    async sendPasswordResetEmail(email, token) {
        console.log(`[EMAIL_SERVICE] Sending password reset email to ${email}`);
        console.log(`[EMAIL_SERVICE] Link: http://localhost:3000/reset-password?token=${token}`);
        return true;
    }
}

module.exports = new EmailService();
