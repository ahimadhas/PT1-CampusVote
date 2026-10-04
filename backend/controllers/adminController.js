const User = require('../models/User');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');

// @desc    Get comprehensive system statistics for Admin Dashboard
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalStudents,
      totalApprovedCandidates,
      pendingCandidateRequests,
      totalPolls,
      activePolls,
      closedPolls,
      draftPolls,
      totalVotes,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ candidateStatus: 'approved' }),
      User.countDocuments({ candidateStatus: 'pending' }),
      Poll.countDocuments(),
      Poll.countDocuments({ status: 'active' }),
      Poll.countDocuments({ status: 'closed' }),
      Poll.countDocuments({ status: 'draft' }),
      Vote.countDocuments(),
    ]);

    const recentPolls = await Poll.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .select('name email role department candidateStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const pendingRequests = await User.find({ candidateStatus: 'pending' })
      .select('name email department studentId candidateManifesto candidateRequestedAt')
      .sort({ candidateRequestedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          students: totalStudents,
          candidates: totalApprovedCandidates,
          pendingCandidates: pendingCandidateRequests,
        },
        polls: {
          total: totalPolls,
          active: activePolls,
          closed: closedPolls,
          draft: draftPolls,
          totalVotes,
        },
      },
      recentPolls,
      recentUsers,
      pendingRequests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list (with optional role / candidateStatus / search filter)
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, candidateStatus, search } = req.query;
    const query = {};

    if (role && role !== 'all') {
      if (role === 'candidate') {
        query.candidateStatus = 'approved';
      } else {
        query.role = role;
      }
    }

    if (candidateStatus && candidateStatus !== 'all') {
      query.candidateStatus = candidateStatus;
    }

    if (search) {
      const escaped = search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
        { studentId: searchRegex },
      ];
    }

    const users = await User.find(query)
      .select('name email role department studentId bio candidateStatus candidateManifesto candidateRequestedAt candidateReviewedAt createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get candidate requests
// @route   GET /api/admin/candidate-requests
// @access  Private (Admin only)
const getCandidateRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { role: 'student' };

    if (status && status !== 'all') {
      query.candidateStatus = status;
    } else {
      // By default return users with non-none status or pending
      query.candidateStatus = { $in: ['pending', 'approved', 'rejected'] };
    }

    const requests = await User.find(query)
      .select('name email department studentId bio candidateStatus candidateManifesto candidateRequestedAt candidateReviewedAt createdAt')
      .sort({ candidateRequestedAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject candidate request
// @route   PATCH /api/admin/candidate-requests/:id
// @access  Private (Admin only)
const reviewCandidateRequest = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be "approved" or "rejected".',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.candidateStatus = status;
    user.candidateReviewedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: `Candidate request ${status} successfully for ${user.name}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role or status
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'student', 'candidate'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided. Valid roles are: admin, student',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (req.user._id.toString() === user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot remove their own admin role.',
      });
    }

    if (role === 'candidate') {
      user.role = 'student';
      user.candidateStatus = 'approved';
    } else {
      user.role = role;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `User updated successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot delete their own account',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Clean up user's votes
    await Vote.deleteMany({ userId: user._id });
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User account and associated records deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getCandidateRequests,
  reviewCandidateRequest,
  updateUserRole,
  deleteUser,
};
