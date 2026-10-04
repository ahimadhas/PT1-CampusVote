const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/jwt');

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      userId: user._id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @desc    Register a new account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      studentId,
      bio,
      requestCandidate,
      candidateManifesto,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Exactly 2 roles: 'admin' and 'student'
    const validRoles = ['admin', 'student'];
    const userRole = role && validRoles.includes(role.toLowerCase()) ? role.toLowerCase() : 'student';

    // If student requested to become candidate upon registration
    const isCandidateRequested =
      userRole === 'student' &&
      (requestCandidate === true || requestCandidate === 'true' || !!candidateManifesto);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: userRole,
      department: department || '',
      studentId: studentId || '',
      bio: bio || '',
      candidateStatus: isCandidateRequested ? 'pending' : 'none',
      candidateManifesto: isCandidateRequested ? (candidateManifesto || bio || '').trim() : '',
      candidateRequestedAt: isCandidateRequested ? new Date() : null,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: isCandidateRequested
        ? 'Account created and candidate application submitted for administrator review.'
        : 'Account created successfully',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials: No account found with this email',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials: Incorrect password',
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student request to become a candidate
// @route   POST /api/auth/request-candidate
// @access  Private (Student)
const requestCandidate = async (req, res, next) => {
  try {
    const { manifesto } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Only registered students can submit candidate requests',
      });
    }

    if (user.candidateStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'You are already an approved election candidate.',
      });
    }

    if (user.candidateStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Your candidate request is already pending review by the administrator.',
      });
    }

    user.candidateStatus = 'pending';
    user.candidateManifesto = (manifesto || user.bio || '').trim();
    user.candidateRequestedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Candidate request submitted successfully. Awaiting administrator approval.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  requestCandidate,
};

