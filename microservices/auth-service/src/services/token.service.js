const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { RefreshToken } = require('../models');

// CRIT-01: Fail fast — signing tokens with a fallback/guessable secret is a CVSS 10.0 vulnerability
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET is not set. Token service cannot start safely.');
    process.exit(1);
}

class TokenService {
    generateAccessToken(user) {
        return jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '15m' } // Short-lived access token
        );
    }

    async generateRefreshToken(user, req) {
        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const ip_address = req.ip || req.connection.remoteAddress;
        const device_info = req.headers['user-agent'] || 'Unknown Device';

        await RefreshToken.create({
            token,
            user_id: user.id,
            device_info,
            ip_address,
            expires_at: expiresAt
        });

        return token;
    }

    async verifyRefreshToken(token) {
        const refreshToken = await RefreshToken.findOne({ where: { token, is_revoked: false } });
        if (!refreshToken) {
            throw new Error('Invalid or revoked refresh token');
        }

        if (new Date() > refreshToken.expires_at) {
            throw new Error('Refresh token expired');
        }

        return refreshToken;
    }

    async revokeRefreshToken(token) {
        await RefreshToken.update({ is_revoked: true }, { where: { token } });
    }
    
    async revokeAllUserTokens(userId) {
        await RefreshToken.update({ is_revoked: true }, { where: { user_id: userId } });
    }
}

module.exports = new TokenService();
