const pool = require('../db');

const showEvents = async (req, res) => {
  const result = await pool.query("SELECT * FROM events;");
  const events = result.rows;
  res.send({ events })
};

const createEvent = async (req, res) => {
  const { type, urgency, game, description, dateStart, dateEnd, partner } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO events (type, urgency, game, description, dateStart, dateEnd, partner) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [type, urgency, game, description, dateStart, dateEnd, partner]
    );
    const event = result.rows[0];
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { type, urgency, game, description, dateStart, dateEnd, partner } = req.body;

  if (!dateStart || !dateEnd) {
    return res.status(400).json({ error: 'dateStart and dateEnd are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE events SET type = $1, urgency = $2, game = $3, description = $4, dateStart = $5, dateEnd = $6, partner = $7 WHERE id = $8 RETURNING *',
      [type, urgency, game, description, dateStart, dateEnd, partner, id]
    );

    const event = result.rows[0];
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    const event = result.rows[0];
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = { createEvent, showEvents, updateEvent, deleteEvent };