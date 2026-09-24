const express = require('express');
const router = express.Router();

const {
  createPoll,
  getPolls,
  getPollById,
  updatePoll,
  closePoll,
  deletePoll,
  getPollResults,
} = require('../controllers/pollController');

const { castVote, checkMyVote } = require('../controllers/voteController');
const { authenticateUser, optionalAuth } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public/Authenticated Poll routes
router.get('/', optionalAuth, getPolls);
router.get('/:id', optionalAuth, getPollById);
router.get('/:id/results', authenticateUser, getPollResults);

// Student/User Voting routes
router.post('/:id/vote', authenticateUser, castVote);
router.get('/:id/my-vote', authenticateUser, checkMyVote);

// Admin-Only Poll Management routes
router.post('/', authenticateUser, authorizeRoles('admin'), createPoll);
router.put('/:id', authenticateUser, authorizeRoles('admin'), updatePoll);
router.patch('/:id/close', authenticateUser, authorizeRoles('admin'), closePoll);
router.delete('/:id', authenticateUser, authorizeRoles('admin'), deletePoll);

module.exports = router;
