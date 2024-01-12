const express = require("express");
const pool = require("../db");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const helmet = require('helmet');
app.use(helmet());
app.use(express.json());

var router = express.Router();
require('dotenv').config();
let SESSIONS = [];

// Inicjalizacja SESSIONS danymi z bazy danych przy uruchamianiu serwera
async function initializeSessions() {
  try {
    const result = await pool.query("SELECT refresh_token FROM sessions;");
    SESSIONS = result.rows.map(row => row.refresh_token);
    console.log('Initialized SESSIONS array:', SESSIONS);
  } catch (error) {
    console.error('Error initializing SESSIONS array:', error);
  }
}

// Wywołanie funkcji inicjalizującej przy uruchomieniu serwera
initializeSessions();

const generateAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '4h',
    algorithm: 'HS256'
  });
}

const validateToken = async (token, tokenSecret) => {
  return await jwt.verify(token, tokenSecret,
    (error, payload) => {
      if (error) {
        throw (error)
      }
      return payload;
    });
}

const validateAccessToken = async (req, res, next) => {
  try {
    req.user = await validateToken(req.body['accessToken'], process.env.ACCESS_TOKEN_SECRET)
    next();
  }
  catch (error) {
    res.status(401).json({ error: error.message || 'Invalid access token' })
  }
}

const validateRefreshToken = async (req, res, next) => {
  try {
    req.user = await validateToken(req.body['refreshToken'], process.env.REFRESH_TOKEN_SECRET)
    next();
  }
  catch (error) {
    res.status(401).json({ error: error.message || 'Invalid refresh token' })
  }
}

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    const result = await pool.query("INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *", [username, hash]);

    console.log(result.rows[0]);
    res.json("Successfully registered");
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

    if (result.rows.length === 1) {
      const user = result.rows[0];

      if (await bcrypt.compare(password, user.password_hash)) {
        const accessToken = generateAccessToken({ username: user.username });

        const refreshToken = jwt.sign({ username: user.username }, process.env.REFRESH_TOKEN_SECRET, {
          expiresIn: '7d',
          algorithm: 'HS256'
        });

        await pool.query("INSERT INTO sessions (refresh_token) VALUES ($1)", [refreshToken]);
        SESSIONS.push(refreshToken);

        res.json({ accessToken, refreshToken });
        return;
      }
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/token', validateRefreshToken, (req, res) => {
  const { username } = req.user;
  const refreshTokenFromBody = req.body['refreshToken'];
  console.log('Received refreshTokenFromBody:', refreshTokenFromBody);
  console.log('SESSIONS array:', SESSIONS);

  if (SESSIONS.includes(refreshTokenFromBody)) {
    res.json({ accessToken: generateAccessToken({ username }) });
  } else {
    res.status(403).json('Forbidden: refresh token is expired');
  }
});

app.delete("/logout", async (req, res) => {
  const refreshTokenFromBody = req.body['refreshToken'];
  console.log('Before removing session, SESSIONS array:', SESSIONS);

  try {
    await pool.query("DELETE FROM sessions WHERE refresh_token = $1", [refreshTokenFromBody]);

    SESSIONS = SESSIONS.filter((session) => session != refreshTokenFromBody);

    console.log('After removing session, SESSIONS array:', SESSIONS);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/events", async (req, res) => {
  const result = await pool.query("SELECT * FROM events;");
  const events = result.rows;
  res.send({ events });
});

const PORT = process.env.PORT || 6300;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = router;
