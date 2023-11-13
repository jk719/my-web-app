const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Pool } = require('pg');
require('dotenv').config();

// Database pool configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Express app initialization
const app = express();

// Middlewares
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'my_secret',
    resave: false,
    saveUninitialized: true
}));

// Routes
// Home route redirecting to login
app.get('/', (req, res) => res.redirect('/login'));

// Login route
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (user.rows.length > 0) {
            // Successful login
            req.session.userId = user.rows[0].id; // Save user id in session
            res.send('Login successful!');
        } else {
            // User not found
            res.send('Invalid username or password');
        }
    } catch (err) {
        console.error(err);
        res.send('Login failed, try again');
    }
});

// Signup route
app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.send('Signup failed, username might be taken');
    }
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Error handling for database connection
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
