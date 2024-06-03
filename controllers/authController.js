const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validationResult } = require('express-validator');

let SESSIONS = [];

async function initializeSessions() {
  try {
    const result = await pool.query('SELECT refresh_token FROM sessions;');
    SESSIONS = result.rows.map((row) => row.refresh_token);
    console.log('Initialized SESSIONS array:', SESSIONS);
  } catch (error) {
    console.error('Error initializing SESSIONS array:', error);
  }
}

initializeSessions();

const generateAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '4h',
    algorithm: 'HS256',
  });
};

const generateRefreshToken = () => {
  return jwt.sign({}, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
};

const generatePasswordResetToken = (user) => {
  return jwt.sign({ userId: user.id }, process.env.PASSWORD_RESET_SECRET, {
    expiresIn: '4h',
    algorithm: 'HS256',
  });
};

const register = async (req, res) => {
  const { email, username, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING *',
      [email, username, hash]
    );

    console.log(result.rows[0]);
    res.json('Successfully registered');
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [identifier]);

    if (result.rows.length === 1) {
      const user = result.rows[0];

      if (await bcrypt.compare(password, user.password)) {
        const accessToken = generateAccessToken({ username: user.username });
        const refreshToken = generateRefreshToken();

        await pool.query('INSERT INTO sessions (refresh_token) VALUES ($1)', [refreshToken]);
        SESSIONS.push(refreshToken);

        res.json({ accessToken, refreshToken });
        return;
      }
    }

    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const refreshToken = (req, res) => {
  const { username } = req.user;
  const accessToken = generateAccessToken({ username });
  res.json({ accessToken });
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;
  console.log('Before removing session, SESSIONS array:', SESSIONS);

  try {
    await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);

    SESSIONS = SESSIONS.filter((session) => session !== refreshToken);

    console.log('After removing session, SESSIONS array:', SESSIONS);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found for the provided email.' });
    }

    const user = userResult.rows[0];
    const resetToken = generatePasswordResetToken(user);

    // TODO: Send an email to the user with the resetToken and instructions

    return res.status(200).json({ message: 'Password reset instructions sent successfully.' });
  } catch (error) {
    console.error('Error during forgot password request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = { register, login, refreshToken, logout, forgotPassword };
