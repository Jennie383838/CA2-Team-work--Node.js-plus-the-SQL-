const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const app = express();
const PORT = 3000;

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Session setup
app.use(session({
    secret: 'supersecretkey', 
    resave: false,
    saveUninitialized: false
}));

// Flash messages
app.use(flash());

// Database connection
const db = mysql.createConnection({
  host: 'imenyd.h.filess.io',
  user: 'CA2WORK_alphabetit',
  password: '2ae71eba142fb00ac9124e3b8be7dee0de37f6ae',
  database: 'CA2WORK_alphabetit',
  port: 61002
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database.');
});
// Set up view engine
app.set('view engine', 'ejs');
//  enable static files
app.use(express.static('public'));
// enable form processing
app.use(express.urlencoded({
    extended: false
}));
// Middleware
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } 
    req.flash('error', 'Please log in to view this resource');
    res.redirect('/login');
};

const checkAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    } 
    req.flash('error', 'Access denied');
    res.redirect('/login');
};

const validateRegistration = (req, res, next) => {
    const { username, email, password, address, contact, role } = req.body;

    if (!username || !email || !password || !address || !contact || !role) {
        return res.status(400).send('All fields are required.');
    }
    
    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 characters');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next();
};

// Routes
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
  res.render('login', { messages: req.flash('error') });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/login');
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND password = SHA1(?)';
    db.query(sql, [email, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            req.session.user = results[0]; 
            req.flash('success', 'Login successful!');
            if (req.session.user.role === 'user') {
                res.redirect('/shopping');
            } else {
                res.redirect('/inventory');
            }
        } else {
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    });
});

app.get('/register', (req, res) => {
    res.render('register', { 
        messages: req.flash('error'), 
        formData: req.flash('formData')[0] 
    });
});

app.post('/register', validateRegistration, (req, res) => {
    const { username, email, password, address, contact, role } = req.body;

    const sql = 'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)';
    db.query(sql, [username, email, password, address, contact, role], (err, result) => {
        if (err) throw err;
        
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});