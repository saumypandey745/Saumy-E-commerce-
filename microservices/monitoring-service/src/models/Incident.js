const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    severity: { type: String, enum: ['P0', 'P1', 'P2', 'P3'], required: true },
    status: { type: String, enum: ['OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED'], default: 'OPEN' },
    service: { type: String, required: true }, // e.g., 'api-gateway', 'product-service'
    
    assigned_engineer: { type: String }, // User ID or Name
    root_cause: { type: String },
    resolution_steps: { type: String },
    
    timeline: [{
        timestamp: { type: Date, default: Date.now },
        message: { type: String },
        user_id: { type: String }
    }],
    
    resolved_at: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
