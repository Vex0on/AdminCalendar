const express = require('express');
const pool = require("../db");
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const swaggerSpec = require('../swaggerConfig')
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

/**
 * @swagger
 * /docs:
 *   get:
 *     summary: Get Swagger documentation
 *     description: Retrieve the Swagger documentation for the API.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successfully retrieved Swagger documentation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schema'
 */

// ... (kontynuacja komentarzy dla poszczególnych endpointów)
router.get("/docs", (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

router.use('/docs-ui', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Moje API Docs', swaggerOptions: { theme: 'dark' } }));


/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user with a unique username and password.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully registered.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/register', authController.register);


/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in
 *     description: Log in with a registered username and password.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in with access and refresh tokens.
 *       401:
 *         description: Invalid credentials.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /token:
 *   post:
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access token.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully refreshed access token.
 *       401:
 *         description: Invalid or expired refresh token.
 *       500:
 *         description: Internal Server Error.
 */

router.post('/token', authMiddleware.validateRefreshToken, authController.refreshToken);

/**
 * @swagger
 * /logout:
 *   delete:
 *     summary: Log out
 *     description: Log out and invalidate the provided refresh token.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       204:
 *         description: Successfully logged out.
 *       500:
 *         description: Internal Server Error.
 */
router.delete('/logout', authMiddleware.validateRefreshToken, authController.logout);

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve a list of all events.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved events.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/events", async (req, res) => {
  const result = await pool.query("SELECT * FROM events;");
  const events = result.rows;
  res.send({ events });
});

module.exports = router;
