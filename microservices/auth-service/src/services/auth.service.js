const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');
const { User, AuditLog } = require('../models');
const tokenService = require('./token.service');
const emailService = require('./email.service');

class AuthService {
    async register(userData, req) {
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) {
            throw new Error('Email already exists');
        }

        const password_hash = await argon2.hash(userData.password);
        const verification_token = uuidv4();

        const user = await User.create({
            email: userData.email,
            password_hash,
            role: userData.role || 'CUSTOMER',
            verification_token
        });

        await emailService.sendVerificationEmail(user.email, verification_token);

        await this.logAudit(user.id, 'REGISTER', req);

        return user;
    }

    async login(email, password, req) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            await this.logAudit(null, 'LOGIN_FAILED_NO_USER', req, { email });
            throw new Error('Invalid credentials');
        }

        const isMatch = await argon2.verify(user.password_hash, password);
        if (!isMatch) {
            await this.logAudit(user.id, 'LOGIN_FAILED_BAD_PASSWORD', req);
            throw new Error('Invalid credentials');
        }

        await this.logAudit(user.id, 'LOGIN_SUCCESS', req);

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
}

module.exports = new AuthService();
