const express = require('express');
const venueController = require('../controllers/venueController');

const router = express.Router();

// GET /api/venues - List all active venues with their sports
router.get('/', venueController.listVenues);

// GET /api/venues/:id - Get single venue with field details
router.get('/:id', venueController.getVenue);

module.exports = router;
