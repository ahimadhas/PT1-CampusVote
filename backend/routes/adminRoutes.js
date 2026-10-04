const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getCandidateRequests,
  reviewCandidateRequest,
  updateUserRole,
  deleteUser,
} = require('../controllers/adminController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All admin routes require admin authentication
router.use(authenticateUser, authorizeRoles('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/candidate-requests', getCandidateRequests);
router.patch('/candidate-requests/:id', reviewCandidateRequest);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
