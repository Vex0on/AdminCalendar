const jwt = require('jsonwebtoken');

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

module.exports = { validateAccessToken, validateRefreshToken };
