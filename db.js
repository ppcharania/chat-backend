const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfaouccaoqamcbhphdml:prathamesh0901@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect()
  .then(() => console.log('Connected to Supabase PostgreSQL'))
  .catch((err) => console.error('Connection error:', err));

module.exports = client;