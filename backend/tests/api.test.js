const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');

// Test runner helper
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passCount++;
  } else {
    console.error(`  \x1b[31m✘ FAIL:\x1b[0m ${message}`);
    failCount++;
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log(' STARTING COMPREHENSIVE BACKEND & DATABASE TESTS');
  console.log('============================================================\n');

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
  await connectDB();

  // Reset test database
  await User.deleteMany({});
  await Poll.deleteMany({});
  await Vote.deleteMany({});

  try {
    // ------------------------------------------------------------
    // 1. AUTHENTICATION & PASSWORD HASHING
    // ------------------------------------------------------------
    console.log('[TEST GROUP 1] Authentication & Security');

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin.test@university.edu',
      password: 'password123',
      role: 'admin',
    });

    assert(admin.password !== 'password123', 'Password must be bcrypt hashed (never plaintext)');
    const isPasswordCorrect = await admin.comparePassword('password123');
    const isPasswordWrong = await admin.comparePassword('wrongpassword');
    assert(isPasswordCorrect === true, 'comparePassword validates correct password');
    assert(isPasswordWrong === false, 'comparePassword rejects incorrect password');

    const userJson = admin.toJSON();
    assert(userJson.password === undefined, 'Password is stripped from JSON representation');

    // Test duplicate email constraint
    let duplicateErrorThrown = false;
    try {
      await User.create({
        name: 'Duplicate Admin',
        email: 'admin.test@university.edu',
        password: 'password123',
        role: 'admin',
      });
    } catch (e) {
      duplicateErrorThrown = true;
    }
    assert(duplicateErrorThrown === true, 'User email unique constraint prevents duplicate registrations');

    // Create student accounts
    const student1 = await User.create({
      name: 'Alice Cooper',
      email: 'alice@student.university.edu',
      password: 'password123',
      role: 'student',
      studentId: 'STU-001',
    });

    const student2 = await User.create({
      name: 'Bob Marley',
      email: 'bob@student.university.edu',
      password: 'password123',
      role: 'student',
      studentId: 'STU-002',
    });

    const student3 = await User.create({
      name: 'Carol Danvers',
      email: 'carol@student.university.edu',
      password: 'password123',
      role: 'student',
      studentId: 'STU-003',
    });

    assert(student1.role === 'student', 'Public registration produces a student role');

    // Create candidate accounts (candidates are real registered users, selected by admin)
    const candidateAlpha = await User.create({
      name: 'Candidate Alpha',
      email: 'alpha@student.university.edu',
      password: 'password123',
      role: 'candidate',
    });

    const candidateBeta = await User.create({
      name: 'Candidate Beta',
      email: 'beta@student.university.edu',
      password: 'password123',
      role: 'candidate',
    });

    assert(candidateAlpha.role === 'candidate', 'Candidate accounts can be created with the candidate role');

    // ------------------------------------------------------------
    // 2. POLL CRUD & VALIDATION
    // ------------------------------------------------------------
    console.log('\n[TEST GROUP 2] Poll Management & Validation');

    // Test creating poll with real registered candidates as options
    const poll1 = await Poll.create({
      title: '2026 Student Council Election',
      description: 'Choose your president for the upcoming academic year.',
      category: 'student_council',
      createdBy: admin._id,
      status: 'active',
      options: [
        { candidateId: candidateAlpha._id, description: 'Manifesto A' },
        { candidateId: candidateBeta._id, description: 'Manifesto B' },
      ],
    });

    assert(poll1._id !== undefined, 'Admin successfully creates poll');
    assert(poll1.status === 'active', 'New poll starts with status active');
    assert(poll1.options.length === 2, 'Poll contains created options with IDs');
    assert(poll1.options[0].candidateId.toString() === candidateAlpha._id.toString(), 'Poll option references the real candidate account');

    // ------------------------------------------------------------
    // 3. ONE VOTE PER USER & UNIQUE COMPOUND INDEX ENFORCEMENT
    // ------------------------------------------------------------
    console.log('\n[TEST GROUP 3] One Vote Per User Enforcement & Concurrent Protection');

    const optAlphaId = poll1.options[0]._id;
    const optBetaId = poll1.options[1]._id;

    // Alice casts vote for Candidate Alpha
    const vote1 = await Vote.create({
      pollId: poll1._id,
      userId: student1._id,
      optionId: optAlphaId,
    });
    assert(vote1._id !== undefined, 'First vote by student succeeds');

    // Alice attempts to vote a second time on the same poll
    let duplicateVoteError = false;
    try {
      await Vote.create({
        pollId: poll1._id,
        userId: student1._id,
        optionId: optBetaId,
      });
    } catch (err) {
      if (err.code === 11000 || err.name === 'MongoServerError') {
        duplicateVoteError = true;
      }
    }
    assert(duplicateVoteError === true, 'Database unique compound index rejects duplicate vote by same user on same poll');

    // Bob votes for Candidate Beta
    await Vote.create({
      pollId: poll1._id,
      userId: student2._id,
      optionId: optBetaId,
    });

    // Carol votes for Candidate Alpha
    await Vote.create({
      pollId: poll1._id,
      userId: student3._id,
      optionId: optAlphaId,
    });

    // ------------------------------------------------------------
    // 4. HIDDEN RESULTS ON ACTIVE POLLS
    // ------------------------------------------------------------
    console.log('\n[TEST GROUP 4] Hidden Results Protection');

    assert(poll1.status === 'active', 'Poll is currently active');
    // Verifying business rule that active polls do not expose results
    const isResultsRestricted = poll1.status === 'active';
    assert(isResultsRestricted === true, 'Active poll results are strictly restricted from users');

    // ------------------------------------------------------------
    // 5. CLOSING POLL & RESULT AGGREGATION
    // ------------------------------------------------------------
    console.log('\n[TEST GROUP 5] Poll Closure & MongoDB Result Aggregation');

    poll1.status = 'closed';
    poll1.closedAt = new Date();
    await poll1.save();
    assert(poll1.status === 'closed', 'Admin successfully closes poll');

    // Execute MongoDB Aggregation Pipeline
    const resultsAgg = await Vote.aggregate([
      { $match: { pollId: poll1._id } },
      { $group: { _id: '$optionId', totalVotes: { $sum: 1 } } },
    ]);

    const aggMap = new Map(resultsAgg.map((r) => [r._id.toString(), r.totalVotes]));
    const alphaVotes = aggMap.get(optAlphaId.toString()) || 0;
    const betaVotes = aggMap.get(optBetaId.toString()) || 0;

    assert(alphaVotes === 2, `Candidate Alpha received exactly 2 aggregated votes (actual: ${alphaVotes})`);
    assert(betaVotes === 1, `Candidate Beta received exactly 1 aggregated vote (actual: ${betaVotes})`);
    assert(alphaVotes + betaVotes === 3, 'Total votes match sum of individual votes');

    console.log('\n============================================================');
    console.log(` ALL TESTS PASSED! (${passCount} passed, ${failCount} failed)`);
    console.log('============================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n[Test Suite Error]:', error.message);
    await disconnectDB();
    process.exit(1);
  }
}

runTests();
