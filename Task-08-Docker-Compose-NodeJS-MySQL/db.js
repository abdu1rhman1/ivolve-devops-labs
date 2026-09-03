const mysql = require("mysql2/promise");
require("dotenv").config();

const maxRetries = 10;
const waitTime = 3000; 

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initializeDatabase() {
  let connected = false;
  let retries = 0;
  let rootConn;

  while (!connected && retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1}: Connecting to MySQL...`);
      rootConn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      });
      connected = true;
    } catch (err) {
      console.error(`Connection failed, retrying in ${waitTime / 1000}s...`);
      retries++;
      await wait(waitTime);
    }
  }

  if (!connected) {
    throw new Error("Could not connect to MySQL after multiple attempts");
  }

  await rootConn.query("CREATE DATABASE IF NOT EXISTS ivolve");

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      price DECIMAL(10,2),
      image TEXT
    )
  `);

  const [rows] = await db.query("SELECT COUNT(*) AS count FROM products");
  if (rows[0].count === 0) {
    await db.query(`
      INSERT INTO products (name, price, image) VALUES
      ('Red Shirt', 29.99, 'https://via.placeholder.com/200x150/ff4444/fff?text=Red+Shirt'),
      ('Blue Jeans', 49.99, 'https://via.placeholder.com/200x150/4444ff/fff?text=Blue+Jeans'),
      ('Green Hat', 19.99, 'https://via.placeholder.com/200x150/44ff44/fff?text=Green+Hat')
    `);
  }

  return db;
}

module.exports = initializeDatabase;

