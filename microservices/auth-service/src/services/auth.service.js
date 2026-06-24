const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');
const { User, AuditLog } = require('../models');
const tokenService = require('./token.service');
const emailService = require('./email.service');
const smsService = require('./sms.service');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

const { Op } = require('sequelize');

class AuthService {
    async register(userData, req) {
        // Check both email and phone uniqueness
        const emailCheck = await User.findOne({ where: { email: userData.email } });
        if (emailCheck) {
            throw new Error('Email already exists');
        }

        if (userData.phone) {
            const phoneCheck = await User.findOne({ where: { phone: userData.phone } });
            if (phoneCheck) {
                throw new Error('Phone number already exists');
            }
        }

        const password_hash = await argon2.hash(userData.password);
        const verification_token = uuidv4();
        const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        const user = await User.create({
            email: userData.email,
            phone: userData.phone || null,
            full_name: userData.full_name || null,
            password_hash,
            role: userData.role || 'CUSTOMER',
            verification_token,
            otp_code,
            otp_expires,
            is_verified: false
        });

        await smsService.sendVerificationOTP(user.phone, otp_code);
        await emailService.sendVerificationEmail(user.email, verification_token, otp_code);

        await this.logAudit(user.id, 'REGISTER', req);

        return user;
    }

    async login(emailOrPhone, password, req) {
        console.log(`[AuthService] Login attempt for identifier: ${emailOrPhone}`);
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: emailOrPhone },
                    { phone: emailOrPhone }
                ]
            }
        });

        if (!user) {
            console.warn(`[AuthService] Login failed: User matching identifier '${emailOrPhone}' not found in database.`);
            await this.logAudit(null, 'LOGIN_FAILED_NO_USER', req, { emailOrPhone });
            throw new Error('Invalid credentials');
        }

        console.log(`[AuthService] User found. ID: ${user.id}, Role: ${user.role}, IsVerified: ${user.is_verified}`);

        // Check if account is locked
        if (user.lock_until && user.lock_until > new Date()) {
            const timeRemaining = Math.ceil((user.lock_until - new Date()) / 1000 / 60);
            console.warn(`[AuthService] Login blocked: User account for '${user.email}' is currently locked. Time remaining: ${timeRemaining} minutes.`);
            await this.logAudit(user.id, 'LOGIN_FAILED_LOCKED', req);
            throw new Error(`Account locked. Please try again after ${timeRemaining} minutes.`);
        }

        console.log(`[AuthService] Verifying password with argon2 for user: ${user.email}`);
        const isMatch = await argon2.verify(user.password_hash, password);
        if (!isMatch) {
            console.warn(`[AuthService] Login failed: Incorrect password provided for user: ${user.email}`);
            // Increment failed attempts
            user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
            console.log(`[AuthService] Failed attempts count for '${user.email}': ${user.failed_login_attempts}/5`);
            if (user.failed_login_attempts >= 5) {
                user.lock_until = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
                user.failed_login_attempts = 0; // Reset count on lock
                await user.save();
                await this.logAudit(user.id, 'ACCOUNT_LOCKED', req);
                console.warn(`[AuthService] Security lock triggered: Account '${user.email}' locked for 15 minutes due to 5 consecutive login failures.`);
                throw new Error('Account locked due to 5 consecutive failed attempts. Locked for 15 minutes.');
            }
            await user.save();
            await this.logAudit(user.id, 'LOGIN_FAILED_BAD_PASSWORD', req);
            throw new Error('Invalid credentials');
        }

        // Reset failed login attempts on success
        user.failed_login_attempts = 0;
        user.lock_until = null;
        await user.save();

        console.log(`[AuthService] Login verified successfully. Resetting failed attempts for: ${user.email}`);
        await this.logAudit(user.id, 'LOGIN_SUCCESS', req);

        return user;
    }

    async googleLogin(idToken, role, req) {
        console.log(`[AuthService] Google Login attempt`);
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new Error('Invalid Google token');
        }

        const email = payload.email;
        const name = payload.name;

        let user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`[AuthService] Registering new Google user: ${email}`);
            const password_hash = await argon2.hash(uuidv4() + uuidv4());
            user = await User.create({
                email,
                full_name: name || null,
                password_hash,
                role: role || 'CUSTOMER',
                is_verified: true
            });
            await this.logAudit(user.id, 'REGISTER_GOOGLE', req);
        } else {
            console.log(`[AuthService] Existing user found for Google login: ${email}`);
            if (role === 'SELLER' && user.role !== 'SELLER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
                console.log(`[AuthService] Upgrading existing user ${email} to SELLER role`);
                user.role = 'SELLER';
                await user.save();
            }
            if (user.lock_until && user.lock_until > new Date()) {
                const timeRemaining = Math.ceil((user.lock_until - new Date()) / 1000 / 60);
                throw new Error(`Account locked. Please try again after ${timeRemaining} minutes.`);
            }
            if (!user.is_verified) {
                user.is_verified = true;
                await user.save();
            }
        }

        user.failed_login_attempts = 0;
        user.lock_until = null;
        await user.save();

        await this.logAudit(user.id, 'LOGIN_SUCCESS_GOOGLE', req);
        return user;
    }

    async refreshAuthToken(refreshTokenString, req) {
        const refreshTokenDoc = await tokenService.verifyRefreshToken(refreshTokenString);
        const user = await User.findByPk(refreshTokenDoc.user_id);
        if (!user) throw new Error('User not found');

        // Rotate Refresh Token
        await tokenService.revokeRefreshToken(refreshTokenString);
        const newRefreshToken = await tokenService.generateRefreshToken(user, req);
        const newAccessToken = tokenService.generateAccessToken(user);

        return { newAccessToken, newRefreshToken, user };
    }

    async logAudit(userId, action, req, extraDetails = {}) {
        await AuditLog.create({
            user_id: userId,
            action,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent'] || 'Unknown',
            details: extraDetails
        });
    }

    async verifyEmail(token) {
        const user = await User.findOne({ where: { verification_token: token } });
        if (!user) throw new Error('Invalid or expired verification token');

        user.is_verified = true;
        user.verification_token = null;
        await user.save();
        return true;
    }

    async verifyOTP(emailOrPhone, otp) {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: emailOrPhone },
                    { phone: emailOrPhone }
                ],
                otp_code: otp,
                otp_expires: { [Op.gt]: new Date() }
            }
        });
        if (!user) throw new Error('Invalid or expired OTP code');

        user.is_verified = true;
        user.otp_code = null;
        user.otp_expires = null;
        await user.save();
        return true;
    }
}

module.exports = new AuthService();
