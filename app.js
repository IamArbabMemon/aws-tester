require('dotenv').config();               // pulls in .env
const express = require('express');
const { Pool } = require('pg');

const app  = express();
// const pool = new Pool({                   // 1‑pool for the whole app
//   host    : process.env.DB_HOST,
//   port    : process.env.DB_PORT,
//   user    : process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

app.use(express.json());                  // parse application/json

app.get("/users",async(req,res)=>{
    return res.json("I am on");
})

app.post('/users', async (req, res) => {
  const { username, email, phone, password, gender } = req.body;

  // quick‑n‑dirty input check (replace with Zod/Joi if you like)
  if (!username || !email || !password || gender === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO users (username, email, phone, password, gender)
    VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), $5)
    RETURNING id, username, email, phone, gender, created_at;
  `;

  try {
    const { rows } = await pool.query(sql, [
      username,
      email,
      phone ?? null,
      password,
      gender,
    ]);
    res.status(201).json(rows[0]);        // respond with the newly‑created row
  } catch (err) {
    console.error(err);
    // handle “duplicate key value violates unique constraint”
    if (err.code === '23505') {
      return res.status(409).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API ready on :${PORT}`));


// 54.159.128.164