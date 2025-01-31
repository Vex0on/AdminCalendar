const pool = require('../db');

const getSlots = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM slots');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getSlotsByUserID = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM slots WHERE $1 = ANY(user_ids)',
            [userId] 
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const getSlotsInDateRange = async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        const result = await pool.query(
            'SELECT * FROM slots WHERE slot_date BETWEEN $1 AND $2',
            [startDate, endDate]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getSlotsForMonth = async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({ error: 'Year and month are required' });
    }

    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const slotsResult = await pool.query(
            'SELECT * FROM slots WHERE slot_date BETWEEN $1 AND $2',
            [startDate, endDate]
        );
        const slots = slotsResult.rows;

        const allUserIds = [...new Set(slots.flatMap(slot => slot.user_ids || []))];

        let usersMap = {};
        if (allUserIds.length > 0) {
            const usersResult = await pool.query(
                'SELECT id, username FROM users WHERE id = ANY($1)',
                [allUserIds]
            );
            usersMap = Object.fromEntries(usersResult.rows.map(user => [user.id, user.username]));
        }

        const enrichedSlots = slots.map(slot => ({
            ...slot,
            users: (slot.user_ids || []).map(userId => ({
                id: userId,
                username: usersMap[userId] || 'Unknown User'
            }))
        }));

        res.json(enrichedSlots);
    } catch (error) {
        console.error('Error fetching slots for month:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const reserveSlot = async (req, res) => {
    const { slotId } = req.params;
    const { userId, comment } = req.query;

    try {
        const slotResult = await pool.query(
            'SELECT * FROM slots WHERE id = $1',
            [slotId]
        );

        if (slotResult.rows.length === 0) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        const slot = slotResult.rows[0];

        if (slot.user_ids.length >= slot.max_capacity) {
            return res.status(400).json({ error: 'Slot is fully booked' });
        }

        const updatedUserIds = [...slot.user_ids, userId];

        const comments = slot.comments || {};
        comments[userId] = comment || null;

        await pool.query(
            'UPDATE slots SET user_ids = $1, comments = $2 WHERE id = $3',
            [updatedUserIds, comments, slotId]
        );

        res.status(200).json({ message: 'Slot reserved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const unreserveSlot = async (req, res) => {
    const { slotId } = req.params;
    const { userId } = req.query;

    try {
        const slotResult = await pool.query(
            'SELECT * FROM slots WHERE id = $1',
            [slotId]
        );

        if (slotResult.rows.length === 0) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        const slot = slotResult.rows[0];

        if (!slot.user_ids.includes(userId)) {
            return res.status(404).json({ error: 'User not found in this slot' });
        }

        const updatedUserIds = slot.user_ids.filter(id => id !== userId);

        const comments = slot.comments || {};
        delete comments[userId];

        await pool.query(
            'UPDATE slots SET user_ids = $1, comments = $2 WHERE id = $3',
            [updatedUserIds, comments, slotId]
        );

        res.status(200).json({ message: 'User unreserved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const addEventToSlot = async (req, res) => {
    const { slotId, eventId } = req.params;

    try {
        const slotResult = await pool.query('SELECT events FROM slots WHERE id = $1', [slotId]);

        if (slotResult.rows.length === 0) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);

        if (eventResult.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        let existingEvents = slotResult.rows[0].events;
        existingEvents = Array.isArray(existingEvents) ? existingEvents : [];

        if (existingEvents.some(event => event.id === parseInt(eventId))) {
            return res.status(400).json({ error: 'Event already assigned to this slot' });
        }

        const updatedEvents = [...existingEvents, eventResult.rows[0]];

        await pool.query('UPDATE slots SET events = $1 WHERE id = $2', [JSON.stringify(updatedEvents), slotId]);

        res.status(200).json({ message: 'Event added to slot successfully', events: updatedEvents });
    } catch (error) {
        console.error('Error adding event to slot:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const removeEventFromSlot = async (req, res) => {
    const { slotId, eventId } = req.params;

    try {
        const slotResult = await pool.query('SELECT * FROM slots WHERE id = $1', [slotId]);

        if (slotResult.rows.length === 0) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        const slot = slotResult.rows[0];

        let events = slot.events || [];

        const updatedEvents = events.filter(event => event.id !== parseInt(eventId)); 

        await pool.query(
            'UPDATE slots SET events = $1 WHERE id = $2',
            [JSON.stringify(updatedEvents), slotId]
        );

        res.status(200).json({ message: 'Event removed successfully' });
    } catch (error) {
        console.error('Error removing event from slot:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const editSlot = async (req, res) => {
    const { slotId } = req.params;
    const { userIds, events, comments } = req.body;

    try {
        const slotResult = await pool.query('SELECT * FROM slots WHERE id = $1', [slotId]);

        if (slotResult.rows.length === 0) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        const slot = slotResult.rows[0];

        const updatedUserIds = userIds || slot.user_ids;
        let updatedEvents = slot.events || [];
        
        if (events && events.length > 0) {
            const eventIds = events.map(event => event.id);
            const eventResults = await pool.query(
                'SELECT * FROM events WHERE id = ANY($1)',
                [eventIds]
            );

            updatedEvents = eventResults.rows.map(event => ({
                id: event.id,
                description: event.description,
            }));
        }

        const updatedComments = comments || slot.comments;

        await pool.query(
            'UPDATE slots SET user_ids = $1, events = $2, comments = $3 WHERE id = $4',
            [updatedUserIds, JSON.stringify(updatedEvents), updatedComments, slotId]
        );

        res.status(200).json({
            message: 'Slot successfully updated',
            updatedSlot: {
                id: slotId,
                user_ids: updatedUserIds,
                events: updatedEvents,
                comments: updatedComments
            }
        });
    } catch (error) {
        console.error('Error updating slot:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports = { getSlots, getSlotsByUserID, getSlotsInDateRange, reserveSlot, unreserveSlot, getSlotsForMonth, addEventToSlot, removeEventFromSlot, editSlot };
