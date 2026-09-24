const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema(
  {
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// CRITICAL REQUIREMENT: Database-level unique compound index
// Guarantees ONE USER + ONE POLL = EXACTLY ONE VOTE even under race conditions
VoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);
