const { RefreshToken, AuditLog } = require('../models');
const tokenService = require('../services/token.service');

exports.getDevices = async (req, res, next) => {
    try {
        const tokens = await RefreshToken.findAll({
            where: { user_id: req.user.id, is_revoked: false },
            attributes: ['token', 'device_info', 'ip_address', 'created_at', 'expires_at']
        });

        res.status(200).json({ success: true, devices: tokens });
    } catch (error) {
        next(error);
    }
};

exports.revokeDevice = async (req, res, next) => {
    try {
        const { tokenId } = req.params;
        const token = await RefreshToken.findOne({ where: { token: tokenId, user_id: req.user.id }});
        
        if (!token) {
             return res.status(404).json({ success: false, message: 'Device/Token not found' });
        }

        await tokenService.revokeRefreshToken(tokenId);
        res.status(200).json({ success: true, message: 'Device revoked successfully' });
    } catch (error) {
        next(error);
    }
};

exports.getAuditLogs = async (req, res, next) => {
    try {
        const logs = await AuditLog.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: 50
        });

        res.status(200).json({ success: true, logs });
    } catch (error) {
        next(error);
    }
};
