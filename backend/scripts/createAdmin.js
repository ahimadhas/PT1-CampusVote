const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

dotenv.config();

// Accepts real operator-supplied credentials via CLI flags or env vars.
// Usage: node scripts/createAdmin.js --name "Jane Doe" --email jane@university.edu --password "a-real-password"
// Or:    ADMIN_NAME="Jane Doe" ADMIN_EMAIL=jane@university.edu ADMIN_PASSWORD=a-real-password node scripts/createAdmin.js
const parseArgs = () => {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i += 1;
    }
  }
  return args;
};

const createAdmin = async () => {
  const args = parseArgs();
  const name = args.name || process.env.ADMIN_NAME;
  const email = args.email || process.env.ADMIN_EMAIL;
  const password = args.password || process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error(
      'Usage: node scripts/createAdmin.js --name "Full Name" --email admin@university.edu --password "your-password"\n' +
      '(or set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD environment variables)'
    );
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Password must be at least 6 characters in length.');
    process.exit(1);
  }

  try {
    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      console.error(`An account with email "${normalizedEmail}" already exists.`);
      await disconnectDB();
      process.exit(1);
    }

    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'admin',
    });

    console.log(`Admin account created successfully: ${admin.email}`);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin account:', error.message);
    process.exit(1);
  }
};

createAdmin();
