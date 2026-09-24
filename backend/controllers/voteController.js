const Poll = require('../models/Poll');
const Vote = require('../models/Vote');

// @desc    Cast a vote in an active poll
// @route   POST /api/polls/:id/vote
// @access  Private (Authenticated Students)
const castVote = async (req, res, next) => {
  try {
    const { optionId } = req.body;
    const pollId = req.params.id;
    const userId = req.user._id;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a candidate/option to cast your vote',
      });
    }

    // 1. Verify poll existence
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    // 2. Verify poll is currently active
    if (poll.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Voting is closed for this poll. No further votes can be accepted.',
      });
    }

    // 3. Verify optionId is a valid option in this poll
    const validOption = poll.options.find(
      (opt) => opt._id.toString() === optionId.toString()
    );
    if (!validOption) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option selected. The selected candidate does not exist in this poll.',
      });
    }

    // 4. Backend check: Has user already voted?
    const existingVote = await Vote.findOne({ pollId, userId });
    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll. One student = exactly one vote.',
      });
    }

    // 5. Create vote record (Backed by MongoDB unique compound index { pollId: 1, userId: 1 })
    try {
      const vote = await Vote.create({
        pollId,
        userId,
        optionId,
      });

      return res.status(201).json({
        success: true,
        message: 'Your vote has been recorded successfully.',
        voteId: vote._id,
      });
    } catch (err) {
      // Catch MongoDB 11000 duplicate key error in case of concurrent requests
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate vote detected. You have already cast a vote in this poll.',
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Check if current user has voted in a poll
// @route   GET /api/polls/:id/my-vote
// @access  Private
const checkMyVote = async (req, res, next) => {
  try {
    const pollId = req.params.id;
    const userId = req.user._id;

    const vote = await Vote.findOne({ pollId, userId });

    res.status(200).json({
      success: true,
      hasVoted: !!vote,
      optionId: vote ? vote.optionId : null,
      votedAt: vote ? vote.createdAt : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  castVote,
  checkMyVote,
};
