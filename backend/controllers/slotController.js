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

const getSlotsForCurrentMonth = async (req, res) => {
    try {
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const slotsResult = await pool.query(
            'SELECT * FROM slots WHERE slot_date BETWEEN $1 AND $2',
            [startDate, endDate]
        );
        const slots = slotsResult.rows;

        const allUserIds = [
            ...new Set([
                ...slots.flatMap(slot => slot.user_ids || []),
                ...Object.keys(slots.flatMap(slot => slot.comments || {})).map(Number)
            ])
        ];

        let usersMap = {};
        if (allUserIds.length > 0) {
            const usersResult = await pool.query(
                'SELECT id, username FROM users WHERE id = ANY($1)',
                [allUserIds]
            );
            usersMap = Object.fromEntries(usersResult.rows.map(user => [user.id, user.username]));
        }

        const enrichedSlots = slots.map(slot => {
            const comments = {};
            for (const [userId, comment] of Object.entries(slot.comments || {})) {
                const username = usersMap[userId] || 'Unknown User';
                comments[username] = comment;
            }

            return {
                ...slot,
                users: (slot.user_ids || []).map(userId => ({
                    id: userId,
                    username: usersMap[userId] || 'Unknown User'
                })),
                comments
            };
        });

        res.json(enrichedSlots);
    } catch (error) {
        console.error('Error fetching slots for current month:', error);
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


module.exports = { getSlots, getSlotsByUserID, getSlotsInDateRange, reserveSlot, unreserveSlot, getSlotsForCurrentMonth };
