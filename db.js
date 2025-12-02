const sql = require("mssql");
require("dotenv").config();

const config = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    options: { encrypt: true }
};

async function getPool() {
    return sql.connect(config);
}

module.exports = { getPool, sql };
