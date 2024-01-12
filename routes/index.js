const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
require('dotenv').config();

router.get("/", (req, res) => {
  res.send("Hello, World!");
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/token', authMiddleware.validateRefreshToken, authController.refreshToken);
router.delete('/logout', authMiddleware.validateRefreshToken, authController.logout);

router.get("/events", async (req, res) => {
  const result = await pool.query("SELECT * FROM events;");
  const events = result.rows;
  res.send({ events });
});

const PORT = process.env.PORT || 6300;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = router;
