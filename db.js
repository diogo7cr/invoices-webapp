const sql = require("mssql"); 
require("dotenv").config();

const config = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    options: { 
        encrypt: true, 
        trustServerCertificate: true // evita erros de certificado local/Azure
    }
};

let pool;

async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

module.exports = { getPool, sql };
