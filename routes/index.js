const express = require("express");
const pool = require("../db");
const app = express();
var router = express.Router();

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/events", async (req, res) => {
  const result = await pool.query("SELECT * FROM events;");
  const events = result.rows;
  res.send({ events });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = router;
