const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const JWT_SECRET =
  process.env.JWT_SECRET || 'campus_vote_super_secret_jwt_key_2026_secure';

module.exports = { JWT_SECRET };
