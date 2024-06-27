const pool = require('../db');

const createUser = async (req, res) => {
  const { username, email, password, firstname, lastname, phone, role = 'ROLE_USER' } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (username, email, password, firstname, lastname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [username, email, password, firstname, lastname, phone, role]
    );
    const user = result.rows[0];
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const showUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users;');
    const users = result.rows;
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const showUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, firstname, lastname, phone, role } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2, password = $3, firstname = $4, lastname = $5, phone = $6, role = $7 WHERE id = $8 RETURNING *',
      [username, email, password, firstname, lastname, phone, role, id]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { createUser, showUsers, showUserById, updateUser, deleteUser };
