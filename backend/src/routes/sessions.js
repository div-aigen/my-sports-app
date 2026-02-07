const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const sessionController = require('../controllers/sessionController');
const participantController = require('../controllers/participantController');

const router = express.Router();

// GET /api/sessions
router.get('/', sessionController.listSessions);

// GET /api/sessions/:id
router.get('/:id', sessionController.getSession);

// POST /api/sessions
router.post(
  '/',
  authenticateToken,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('location_address').notEmpty().withMessage('Location is required'),
    body('scheduled_date').isISO8601().withMessage('Valid date required'),
    body('scheduled_time').matches(/^\d{2}:\d{2}$/).withMessage('Valid time required (HH:MM)'),
    body('scheduled_end_time').optional().matches(/^\d{2}:\d{2}$/).withMessage('Valid end time required (HH:MM)'),
    body('total_cost').isFloat({ gt: 0 }).withMessage('Total cost must be greater than 0'),
    body('max_participants').optional().isInt({ min: 2, max: 50 }).withMessage('Max participants must be between 2 and 50'),
  ],
  sessionController.createSession
);

// PUT /api/sessions/:id
router.put(
  '/:id',
  authenticateToken,
  [
    body('title').optional().notEmpty(),
    body('location_address').optional().notEmpty(),
    body('scheduled_date').optional().isISO8601(),
    body('scheduled_time').optional().matches(/^\d{2}:\d{2}$/),
    body('scheduled_end_time').optional().matches(/^\d{2}:\d{2}$/),
    body('total_cost').optional().isFloat({ gt: 0 }),
  ],
  sessionController.updateSession
);

// DELETE /api/sessions/:id
router.delete('/:id', authenticateToken, sessionController.cancelSession);

// POST /api/sessions/:id/join
router.post('/:id/join', authenticateToken, participantController.joinSession);

// DELETE /api/sessions/:id/leave
router.delete('/:id/leave', authenticateToken, participantController.leaveSession);

// GET /api/sessions/:id/participants
router.get('/:id/participants', participantController.getParticipants);

module.exports = router;
