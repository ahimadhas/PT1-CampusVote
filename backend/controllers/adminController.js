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
      totalCandidates,
      totalPolls,
      activePolls,
      closedPolls,
      totalVotes,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'candidate' }),
      Poll.countDocuments(),
      Poll.countDocuments({ status: 'active' }),
      Poll.countDocuments({ status: 'closed' }),
      Vote.countDocuments(),
    ]);

    const recentPolls = await Poll.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .select('name email role department createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          students: totalStudents,
          candidates: totalCandidates,
        },
        polls: {
          total: totalPolls,
          active: activePolls,
          closed: closedPolls,
          totalVotes,
        },
      },
      recentPolls,
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list (with optional role / search filter)
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      const escaped = search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
      ];
    }

    const users = await User.find(query)
      .select('name email role department studentId createdAt')
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
        message: 'Invalid role provided. Valid roles are: admin, student, candidate',
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

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
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
  updateUserRole,
  deleteUser,
};
