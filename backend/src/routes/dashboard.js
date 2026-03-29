const express = require('express');
const { body, validationResult } = require('express-validator');
const dashboardController = require('../controllers/dashboardController');
const { authenticateDashboardToken } = require('../middleware/dashboardAuth');

const router = express.Router();

// --- Auth ---
router.post(
  '/auth/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  dashboardController.login
);

router.post(
  '/auth/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  dashboardController.signup
);

router.get('/auth/me', authenticateDashboardToken, dashboardController.getMe);
router.get('/auth/verify', authenticateDashboardToken, dashboardController.verify);

// --- Analytics ---
router.get('/analytics/overview', authenticateDashboardToken, dashboardController.getOverview);
router.get('/analytics/users-growth', authenticateDashboardToken, dashboardController.getUsersGrowth);
router.get('/analytics/sessions-trend', authenticateDashboardToken, dashboardController.getSessionsTrend);
router.get('/analytics/sport-distribution', authenticateDashboardToken, dashboardController.getSportDistribution);
router.get('/analytics/venue-popularity', authenticateDashboardToken, dashboardController.getVenuePopularity);
router.get('/analytics/session-status', authenticateDashboardToken, dashboardController.getSessionStatus);
router.get('/analytics/recent-sessions', authenticateDashboardToken, dashboardController.getRecentSessions);
router.get('/analytics/participants-stats', authenticateDashboardToken, dashboardController.getParticipantsStats);

// --- Settings ---
router.get('/settings/downloads', authenticateDashboardToken, dashboardController.getDownloads);
router.put(
  '/settings/downloads',
  authenticateDashboardToken,
  [
    body('count').isInt({ min: 0 }).withMessage('Count must be a non-negative integer'),
    body('platform').optional().isIn(['android', 'ios']),
    body('note').optional().isString(),
  ],
  dashboardController.updateDownloads
);

// --- CSV Exports ---
router.get('/export/users-csv', authenticateDashboardToken, dashboardController.exportUsersCsv);
router.get('/export/sessions-csv', authenticateDashboardToken, dashboardController.exportSessionsCsv);
router.get('/export/participants-csv', authenticateDashboardToken, dashboardController.exportParticipantsCsv);

module.exports = router;
