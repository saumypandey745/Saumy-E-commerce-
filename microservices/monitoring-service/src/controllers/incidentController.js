const Incident = require('../models/Incident');

exports.createIncident = async (req, res) => {
    try {
        const incident = await Incident.create(req.body);
        res.status(201).json({ success: true, incident });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getIncidents = async (req, res) => {
    try {
        const incidents = await Incident.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, incidents });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        if (updateData.status === 'RESOLVED' && !updateData.resolved_at) {
            updateData.resolved_at = new Date();
        }

        const incident = await Incident.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json({ success: true, incident });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.addTimelineEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, user_id } = req.body;
        
        const incident = await Incident.findByIdAndUpdate(
            id,
            { $push: { timeline: { message, user_id } } },
            { new: true }
        );
        res.status(200).json({ success: true, incident });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
