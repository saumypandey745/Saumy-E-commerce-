let twilio;
try {
    twilio = require('twilio');
} catch (e) {
    console.warn('[SmsService] twilio not installed locally. Real SMS disabled.');
}

class SmsService {
    constructor() {
        const hasTwilioConfig = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM;
        
        if (hasTwilioConfig) {
            console.log('[SmsService] Initializing real Twilio SMS client...');
            this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        } else {
            console.warn('[SmsService] Twilio credentials missing in environment variables. Falling back to Mock console logger.');
            this.client = null;
        }
    }

    async sendVerificationOTP(phone, otpCode) {
        console.log(`[SmsService] Sending SMS OTP to ${phone}`);
        console.log(`[SmsService] Message content: Your E-Commerce verification code is: ${otpCode}`);

        if (!phone) {
            console.log('[SmsService] Phone number empty, skipping SMS sending.');
            return false;
        }

        if (this.client) {
            try {
                await this.client.messages.create({
                    body: `Your E-Commerce verification code is: ${otpCode}. It expires in 10 minutes.`,
                    from: process.env.TWILIO_FROM,
                    to: phone
                });
                console.log(`[SmsService] Real SMS OTP successfully sent to: ${phone}`);
                return true;
            } catch (error) {
                console.error(`[SmsService] Failed to send real SMS to ${phone}:`, error);
                return false;
            }
        }
        return true;
    }
}

module.exports = new SmsService();
