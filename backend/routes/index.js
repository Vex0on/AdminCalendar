const express = require('express');
const pool = require("../db");
const router = express.Router();
const authController = require('../controllers/authController');
const eventController = require('../controllers/eventController')
const userController = require('../controllers/userController')
const slotController = require('../controllers/slotController')
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

// EVENTS
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
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with the provided data.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/users', userController.createUser);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Successfully retrieved users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   firstname:
 *                     type: string
 *                   lastname:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   role:
 *                     type: string
 *       500:
 *         description: Internal Server Error.
 */
router.get('/users', userController.showUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Retrieve a user by their ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstname:
 *                   type: string
 *                 lastname:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 role:
 *                   type: string
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/users/:id', userController.showUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     description: Update the details of an existing user by their ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
router.put('/users/:id', userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     description: Delete a user by their ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to delete
 *     responses:
 *       204:
 *         description: User deleted successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
router.delete('/users/:id', userController.deleteUser);

/**
 * @swagger
 * /slots:
 *   get:
 *     summary: Get all slots
 *     description: Retrieve a list of all available slots.
 *     tags: [Slots]
 *     responses:
 *       200:
 *         description: Successfully retrieved slots.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   slot_date:
 *                     type: string
 *                     format: date
 *                   max_capacity:
 *                     type: integer
 *                   user_ids:
 *                     type: array
 *                     items:
 *                       type: string
 *                   comment:
 *                     type: string
 *       500:
 *         description: Internal Server Error.
 */
router.get('/slots/', slotController.getSlots);

/**
 * @swagger
 * /slots-with-users:
 *   get:
 *     summary: Get all slots with user names instead of ids
 *     description: Retrieve a list of all available slots with usernames.
 *     tags: [Slots]
 *     responses:
 *       200:
 *         description: Successfully retrieved slots.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   slot_date:
 *                     type: string
 *                     format: date
 *                   max_capacity:
 *                     type: integer
 *                   user_ids:
 *                     type: array
 *                     items:
 *                       type: string
 *                   comment:
 *                     type: string
 *       500:
 *         description: Internal Server Error.
 */
router.get('/slots-for-current-month/', slotController.getSlotsForCurrentMonth);

/**
 * @swagger
 * /slots/user/{userId}:
 *   get:
 *     summary: Get slots for a specific user
 *     description: Retrieve all slots that are reserved by a specific user, based on their user ID.
 *     tags: [Slots]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID of the user to find the reserved slots.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved user's slots.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   slot_date:
 *                     type: string
 *                     format: date
 *                   max_capacity:
 *                     type: integer
 *                   user_ids:
 *                     type: array
 *                     items:
 *                       type: string
 *                   comment:
 *                     type: string
 *       404:
 *         description: User has no reserved slots.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/slots/user/:userId', slotController.getSlotsByUserID);

/**
 * @swagger
 * /slots/range:
 *   get:
 *     summary: Get slots in a date range
 *     description: Retrieve all slots within a specified date range.
 *     tags: [Slots]
 *     parameters:
 *       - name: startDate
 *         in: query
 *         required: true
 *         description: Start date of the range.
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         required: true
 *         description: End date of the range.
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Successfully retrieved slots within the date range.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   slot_date:
 *                     type: string
 *                     format: date
 *                   max_capacity:
 *                     type: integer
 *                   user_ids:
 *                     type: array
 *                     items:
 *                       type: string
 *                   comment:
 *                     type: string
 *       400:
 *         description: Invalid date range or missing parameters.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/slots/range', slotController.getSlotsInDateRange);

/**
 * @swagger
* /slots/{slotId}/reserve:
 *   put:
 *     summary: Reserve a slot
 *     description: Allows a user to reserve a slot for a specific date.
 *     tags: [Slots]
 *     parameters:
 *       - name: slotId
 *         in: path
 *         required: true
 *         description: ID of the slot to reserve.
 *         schema:
 *           type: integer
 *       - name: userId
 *         in: query
 *         required: true
 *         description: ID of the user reserving the slot.
 *         schema:
 *           type: integer
 *       - name: comment
 *         in: query
 *         required: false
 *         description: Optional comment for the reservation.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slot reserved successfully.
 *       400:
 *         description: Slot is fully booked or invalid user ID.
 *       500:
 *         description: Internal Server Error.
 */
router.put('/slots/:slotId/reserve', slotController.reserveSlot);

/**
 * @swagger
* /slots/{slotId}/unreserve:
 *   put:
 *     summary: Unreserve a slot
 *     description: Allows a user to cancel their reservation from a slot.
 *     tags: [Slots]
 *     parameters:
 *       - name: slotId
 *         in: path
 *         required: true
 *         description: ID of the slot to unreserve.
 *         schema:
 *           type: integer
 *       - name: userId
 *         in: query
 *         required: true
 *         description: ID of the user removing their reservation.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User removed from the slot successfully.
 *       404:
 *         description: Slot or user not found, or the user is not reserved for this slot.
 *       500:
 *         description: Internal Server Error.
 */
router.put('/slots/:slotId/unreserve', slotController.unreserveSlot);

module.exports = router;
