const Venue = require('../models/Venue');

/**
 * GET /api/venues
 * List all active venues with their available sports
 */
const listVenues = async (req, res) => {
  try {
    const venues = await Venue.findAllWithSports();
    res.json({ venues });
  } catch (err) {
    console.error('List venues error:', err);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
};

/**
 * GET /api/venues/:id
 * Get single venue with detailed field information
 */
const getVenue = async (req, res) => {
  try {
    const venueId = parseInt(req.params.id);
    const venue = await Venue.findByIdWithFields(venueId);

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json({ venue });
  } catch (err) {
    console.error('Get venue error:', err);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
};

module.exports = {
  listVenues,
  getVenue,
};
