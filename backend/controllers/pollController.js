const mongoose = require('mongoose');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const User = require('../models/User');

const CANDIDATE_POPULATE = { path: 'options.candidateId', select: 'name email department bio' };

// Injects a resolved `name` into each option from its populated candidate account,
// so the frontend can keep reading `option.name` regardless of the underlying reference.
const shapePollOptions = (pollObj) => {
  pollObj.options = pollObj.options.map((opt) => ({
    ...opt,
    name: opt.candidateId && opt.candidateId.name ? opt.candidateId.name : 'Unknown Candidate',
  }));
  return pollObj;
};

// @desc    Create a new poll
// @route   POST /api/polls
// @access  Private (Admin only)
const createPoll = async (req, res, next) => {
  try {
    const { title, description, category, options } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Poll title and description are required',
      });
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A poll must contain at least 2 candidates',
      });
    }

    // Sanitize and de-duplicate candidate references
    const seen = new Set();
    const sanitizedOptions = [];
    for (const opt of options) {
      const candidateId = typeof opt === 'string' ? opt : opt.candidateId;
      if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) continue;
      if (seen.has(candidateId.toString())) continue;
      seen.add(candidateId.toString());
      sanitizedOptions.push({
        candidateId,
        description: opt.description ? opt.description.trim() : '',
      });
    }

    if (sanitizedOptions.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least 2 distinct registered candidates',
      });
    }

    // Verify every referenced candidate is a real, currently-registered candidate account
    const candidateUsers = await User.find({
      _id: { $in: sanitizedOptions.map((o) => o.candidateId) },
      role: 'candidate',
    }).select('_id');

    if (candidateUsers.length !== sanitizedOptions.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected candidates could not be found. They must be registered accounts with the "candidate" role.',
      });
    }

    let poll = await Poll.create({
      title: title.trim(),
      description: description.trim(),
      category: category || 'general_poll',
      options: sanitizedOptions,
      createdBy: req.user._id,
      status: 'active',
    });

    poll = await poll.populate(CANDIDATE_POPULATE);

    res.status(201).json({
      success: true,
      message: 'Poll created successfully and is now active',
      poll: shapePollOptions(poll.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all polls (with optional status filter)
// @route   GET /api/polls
// @access  Public / Private
const getPolls = async (req, res, next) => {
  try {
    const { status, category, search, limit } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      const escaped = search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    let pollQuery = Poll.find(query)
      .populate('createdBy', 'name email role')
      .populate(CANDIDATE_POPULATE)
      .sort({ createdAt: -1 });

    if (limit && !isNaN(parseInt(limit, 10))) {
      pollQuery = pollQuery.limit(parseInt(limit, 10));
    }

    const polls = await pollQuery;

    let userVotedMap = new Map();
    if (req.user) {
      const userVotes = await Vote.find({
        userId: req.user._id,
        pollId: { $in: polls.map((p) => p._id) },
      });
      userVotedMap = new Map(
        userVotes.map((v) => [v.pollId.toString(), v.optionId.toString()])
      );
    }

    const shapedPolls = polls.map((poll) => {
      const pollObj = shapePollOptions(poll.toObject());
      const votedOptionId = userVotedMap.get(poll._id.toString());
      pollObj.hasVoted = !!votedOptionId;
      pollObj.userVotedOptionId = votedOptionId || null;
      return pollObj;
    });

    res.status(200).json({
      success: true,
      count: shapedPolls.length,
      polls: shapedPolls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single poll by ID
// @route   GET /api/polls/:id
// @access  Public / Private
const getPollById = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate(CANDIDATE_POPULATE);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    const pollObj = shapePollOptions(poll.toObject());

    // Check if current user has voted
    if (req.user) {
      const userVote = await Vote.findOne({
        pollId: poll._id,
        userId: req.user._id,
      });
      pollObj.hasVoted = !!userVote;
      pollObj.userVotedOptionId = userVote ? userVote.optionId : null;
    }

    res.status(200).json({
      success: true,
      poll: pollObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update poll details (safe updates — title, description, category only)
// @route   PUT /api/polls/:id
// @access  Private (Admin only)
const updatePoll = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    let poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    if (title) poll.title = title.trim();
    if (description) poll.description = description.trim();
    if (category) poll.category = category;

    await poll.save();
    poll = await poll.populate(CANDIDATE_POPULATE);

    res.status(200).json({
      success: true,
      message: 'Poll updated successfully',
      poll: shapePollOptions(poll.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close a poll (renders voting inactive and enables result aggregation)
// @route   PATCH /api/polls/:id/close
// @access  Private (Admin only)
const closePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    if (poll.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Poll is already closed',
      });
    }

    poll.status = 'closed';
    poll.closedAt = new Date();
    await poll.save();

    res.status(200).json({
      success: true,
      message: 'Poll has been closed successfully. Results are now available.',
      poll,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a poll and associated votes
// @route   DELETE /api/polls/:id
// @access  Private (Admin only)
const deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    await Vote.deleteMany({ pollId: poll._id });
    await poll.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Poll and all associated votes have been deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get poll results (CRITICAL: Hidden while active, aggregated only when closed)
// @route   GET /api/polls/:id/results
// @access  Private
const getPollResults = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate(CANDIDATE_POPULATE);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    // CRITICAL REQUIREMENT:
    // Results MUST NOT be revealed while poll is active
    if (poll.status === 'active') {
      return res.status(403).json({
        success: false,
        message: 'Results are available after the poll closes.',
        status: 'active',
      });
    }

    // Perform MongoDB Aggregation
    const pollObjectId = new mongoose.Types.ObjectId(req.params.id);
    const voteAggregation = await Vote.aggregate([
      {
        $match: {
          pollId: pollObjectId,
        },
      },
      {
        $group: {
          _id: '$optionId',
          totalVotes: { $sum: 1 },
        },
      },
    ]);

    const voteCountMap = new Map();
    let totalVotesCast = 0;

    voteAggregation.forEach((item) => {
      const optionIdStr = item._id ? item._id.toString() : '';
      voteCountMap.set(optionIdStr, item.totalVotes);
      totalVotesCast += item.totalVotes;
    });

    // Map through all poll options to include 0-vote options
    const optionResults = poll.options.map((option) => {
      const optionIdStr = option._id.toString();
      const votes = voteCountMap.get(optionIdStr) || 0;
      const percentage =
        totalVotesCast > 0
          ? Number(((votes / totalVotesCast) * 100).toFixed(2))
          : 0;

      return {
        _id: option._id,
        name: option.candidateId && option.candidateId.name ? option.candidateId.name : 'Unknown Candidate',
        description: option.description,
        votes,
        percentage,
      };
    });

    // Sort descending by votes
    optionResults.sort((a, b) => b.votes - a.votes);

    // Determine winner(s) if there are votes
    let winners = [];
    if (totalVotesCast > 0 && optionResults.length > 0) {
      const maxVotes = optionResults[0].votes;
      if (maxVotes > 0) {
        winners = optionResults.filter((opt) => opt.votes === maxVotes);
      }
    }

    res.status(200).json({
      success: true,
      poll: {
        _id: poll._id,
        title: poll.title,
        description: poll.description,
        category: poll.category,
        status: poll.status,
        createdAt: poll.createdAt,
        closedAt: poll.closedAt,
        createdBy: poll.createdBy,
      },
      totalVotes: totalVotesCast,
      results: optionResults,
      winners,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPoll,
  getPolls,
  getPollById,
  updatePoll,
  closePoll,
  deletePoll,
  getPollResults,
};
