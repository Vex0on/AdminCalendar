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

const generateAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    'expiresIn:' :'1h'
  }) 
}

const validateToken = async (token, tokenSecret) => {
  return await jwt.verify(token, tokenSecret,
    (error, payload) => {
      if (error) {
        throw (error)
      }
      return payload;
    })
}

const validateAccessToken = async (req, res, next) => {
  try {
    req.user = await validateToken(req.body['accessToken'], process.env.ACCESS_TOKEN_SECRET)
    next();
  }
  catch (error) {
    res.status(401).
      json({ error: error.message || 'Invalid access token' })
  }
}

const validateRefreshToken = async (req, res, next) => {
  try {
    req.user = await validateToken(req.body['refreshToken'], process.env.REFRESH_TOKEN_SECRET)
    next();
  }
  catch (error) {
    res.status(401).
      json({ error: error.message || 'Invalid refresh token' })
  }
}

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);

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
        const accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '1h',
        });

        const refreshToken = jwt.sign({ username: user.username }, process.env.REFRESH_TOKEN_SECRET);

        await pool.query("INSERT INTO sessions (refresh_token) VALUES ($1)", [refreshToken]);

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
  if (SESSIONS.includes(req.body['refreshToken'])) {
    res.json({ accessToken: generateAccessToken({ username })})
  }
  else {
    res.status(403).json('Forbidden: refresh token is expired')
  }
})

app.delete("/logout", async (req, res) => {
  SESSIONS = SESSIONS.filter((session) => session != req.body['refreshToken']);
  res.sendStatus(204);
})


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
