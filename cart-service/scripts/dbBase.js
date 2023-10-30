const Client = require('pg').Client;

const {
  DB_HOST,
  DB_PORT = '5432',
  DB_NAME,
  DB_USER,
  DB_PASSWORD
} = process.env;

const dbClient = new Client({
  host: DB_HOST,
  port: +DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

const init = () => {
  return dbClient.connect()
    .then(() => dbClient);
}

exports.init = init