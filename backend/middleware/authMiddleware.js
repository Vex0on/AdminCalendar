const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const pool = require('../db');

const validateToken = async (token, tokenSecret) => {
  return await jwt.verify(token, tokenSecret, (error, payload) => {
    if (error) {
      throw error;
    }
    return payload;
  });
}

const validateAccessToken = async (req, res, next) => {
  try {
    req.user = await validateToken(req.body['accessToken'], process.env.ACCESS_TOKEN_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: error.message || 'Invalid access token' });
  }
}

const validateRefreshToken = async (req, res, next) => {
  try {
    req.user = await validateToken(req.body['refreshToken'], process.env.REFRESH_TOKEN_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: error.message || 'Invalid refresh token' });
  }
}

const ValidateRegistrationRules = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('username').isString().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('password').isString().isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
  validate,
];

const ValidateLoginRules = [
  body('identifier').isString().isLength({ min: 1 }),
  body('password').isString().isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
  validate,
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const formattedErrors = errors.array().map(error => {
    return { [error.param]: error.msg };
  });

  return res.status(422).json({ errors: formattedErrors });
}


module.exports = { validateAccessToken, validateRefreshToken, ValidateRegistrationRules, ValidateLoginRules };
