const express = require('express');
const pool = require("../db");
const router = express.Router();
const authController = require('../controllers/authController');
const eventController = require('../controllers/eventController')
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
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully registered.
 *       422:
 *         description: Unprocessable Entity - Validation error.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/register', authMiddleware.ValidateRegistrationRules, authController.register);


/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in
 *     description: Log in with a registered username or email and password.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
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
router.post('/login', authMiddleware.ValidateLoginRules, authController.login);

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
 * /forgot-password:
 *   post:
 *     summary: Request to reset password
 *     description: Request to reset password for the given email address.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset instructions sent successfully.
 *       404:
 *         description: User not found for the provided email.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/forgot-password', authController.forgotPassword);

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
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved events.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/events', eventController.showEvents);

// CREATE Event
/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event with the provided details.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               urgency:
 *                 type: int
 *               game:
 *                 type: string
 *               description:
 *                 type: string
 *               dateStart:
 *                 type: string
 *                 format: date
 *               dateEnd:
 *                 type: string
 *                 format: date
 *               partner:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Event created successfully.
 *       500:
 *         description: Internal Server Error.
 */
router.post("/events", eventController.createEvent);

// UPDATE Event
/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event by ID
 *     description: Update the details of an existing event by its ID.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the event to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               urgency:
 *                 type: int
 *               game:
 *                 type: string
 *               description:
 *                 type: string
 *               dateStart:
 *                 type: string
 *                 format: date
 *               dateEnd:
 *                 type: string
 *                 format: date
 *               partner:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Event updated successfully.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Internal Server Error.
 */
router.put('/events/:id', eventController.updateEvent);

// DELETE Event
/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event by ID
 *     description: Delete an event by its ID.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the event to delete
 *     responses:
 *       204:
 *         description: Event deleted successfully.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Internal Server Error.
 */
router.delete('/events/:id', eventController.deleteEvent);


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved users.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/users", async (req, res) => {
  const result = await pool.query("SELECT email, username FROM users;");
  const users = result.rows;
  res.send({ users });
})

module.exports = router;
