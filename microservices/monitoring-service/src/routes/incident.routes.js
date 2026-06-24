const express = require('express');
const { createIncident, getIncidents, updateIncident, addTimelineEvent } = require('../controllers/incidentController');

const router = express.Router();

router.post('/', createIncident);
router.get('/', getIncidents);
router.patch('/:id', updateIncident);
router.post('/:id/timeline', addTimelineEvent);

module.exports = router;
