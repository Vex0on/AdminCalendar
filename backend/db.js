require ('dotenv').config();
const { Pool }  = require ('pg');


const {
PG_HOST,
PG_PORT,
PG_DATABASE,
PG_USER,
PG_PASSWORD
} = process.env

const pool = new Pool({
    host: PG_HOST,
    port: PG_PORT,
    database: PG_DATABASE,
    user: PG_USER,
    password: PG_PASSWORD
});

console.log('DB Config:', {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD
});


module.exports = pool;