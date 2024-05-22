const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'kapture_product_db',
    waitForConnections: true,
    connectionLimit: 100, // Adjust the connection limit as needed
    queueLimit: 0,
  });

  module.exports = connection;