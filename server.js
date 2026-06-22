const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'sql-trainer-secret-key-12345';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'sqladmin123';

const QUESTIONS_FILE = path.join(__dirname, 'questions.json');
const USERS_FILE = path.join(__dirname, 'users.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------
// CRYPTO HELPERS FOR AUTH
// ----------------------------------------------------
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// In-memory cache fallbacks for serverless environments
let inMemoryQuestions = null;
let inMemoryUsers = null;

// Helper to read database files
function readQuestions() {
  if (inMemoryQuestions !== null) {
    return inMemoryQuestions;
  }
  try {
    if (!fs.existsSync(QUESTIONS_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
    inMemoryQuestions = data;
    return data;
  } catch (error) {
    console.error('Error reading questions:', error);
    return inMemoryQuestions || [];
  }
}

function writeQuestions(data) {
  inMemoryQuestions = data;
  try {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.warn('Warning: Write to questions.json failed. Using in-memory fallback.', error.message);
    return true;
  }
}

function readUsers() {
  if (inMemoryUsers !== null) {
    return inMemoryUsers;
  }
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    inMemoryUsers = data;
    return data;
  } catch (error) {
    console.error('Error reading users:', error);
    return inMemoryUsers || [];
  }
}

function writeUsers(data) {
  inMemoryUsers = data;
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.warn('Warning: Write to users.json failed. Using in-memory fallback.', error.message);
    return true;
  }
}

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token. Access denied.' });
    }
    req.user = user;
    next();
  });
}

// ----------------------------------------------------
// PUBLIC QUESTIONS API
// ----------------------------------------------------
app.get('/api/questions', (req, res) => {
  const questions = readQuestions();
  res.json(questions);
});

// ----------------------------------------------------
// AUTHENTICATION ENDPOINTS (SIGNUP & LOGIN)
// ----------------------------------------------------
app.post('/api/auth/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const cleanUsername = username.trim();
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const users = readUsers();
  
  // Check if user already exists
  const existingUser = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (existingUser || cleanUsername.toLowerCase() === 'admin') {
    return res.status(400).json({ error: 'Username is already taken.' });
  }

  const salt = generateSalt();
  const hash = hashPassword(password, salt);

  const newUser = {
    username: cleanUsername,
    salt,
    hash,
    role: 'user',
    bookmarks: [],
    mastered: [],
    review: [],
    timeSpent: 0
  };

  users.push(newUser);
  if (writeUsers(users)) {
    const token = jwt.sign({ username: cleanUsername, role: 'user' }, SECRET_KEY, { expiresIn: '12h' });
    res.status(201).json({ success: true, token, username: cleanUsername, role: 'user' });
  } else {
    res.status(500).json({ error: 'Failed to create user account.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const cleanUsername = username.trim();

  // Admin special bypass
  if (cleanUsername.toLowerCase() === 'admin') {
    if (password === ADMIN_PASSCODE) {
      const token = jwt.sign({ username: 'Admin', role: 'admin' }, SECRET_KEY, { expiresIn: '12h' });
      return res.json({ success: true, token, username: 'Admin', role: 'admin' });
    } else {
      return res.status(401).json({ error: 'Incorrect administrator passcode.' });
    }
  }

  const users = readUsers();
  const user = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const calculatedHash = hashPassword(password, user.salt);
  if (calculatedHash === user.hash) {
    const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '12h' });
    res.json({ 
      success: true, 
      token, 
      username: user.username, 
      role: user.role,
      progress: {
        bookmarks: user.bookmarks || [],
        mastered: user.mastered || [],
        review: user.review || [],
        timeSpent: user.timeSpent || 0
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid username or password.' });
  }
});

// ----------------------------------------------------
// USER PROGRESS SYNC
// ----------------------------------------------------
app.get('/api/user/progress', authenticateToken, (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.username.toLowerCase() === req.user.username.toLowerCase());
  
  if (!user) {
    // If it's the admin, progress isn't tracked or stored separately, but let's return empty arrays
    if (req.user.role === 'admin') {
      return res.json({ bookmarks: [], mastered: [], review: [], timeSpent: 0 });
    }
    return res.status(404).json({ error: 'User profile not found.' });
  }

  res.json({
    bookmarks: user.bookmarks || [],
    mastered: user.mastered || [],
    review: user.review || [],
    timeSpent: user.timeSpent || 0
  });
});

app.post('/api/user/progress', authenticateToken, (req, res) => {
  const { bookmarks, mastered, review, timeSpent } = req.body;
  
  if (!Array.isArray(bookmarks) || !Array.isArray(mastered) || !Array.isArray(review)) {
    return res.status(400).json({ error: 'Progress data must contain arrays of question IDs.' });
  }

  const users = readUsers();
  const index = users.findIndex(u => u.username.toLowerCase() === req.user.username.toLowerCase());

  if (index === -1) {
    if (req.user.role === 'admin') {
      return res.json({ success: true, message: 'Admin progress is not stored permanently.' });
    }
    return res.status(404).json({ error: 'User profile not found.' });
  }

  users[index].bookmarks = bookmarks;
  users[index].mastered = mastered;
  users[index].review = review;
  if (typeof timeSpent === 'number') {
    users[index].timeSpent = timeSpent;
  }

  if (writeUsers(users)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to save progress on the server.' });
  }
});

// ----------------------------------------------------
app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }
  const users = readUsers();
  const usersData = users.map(u => ({
    username: u.username,
    role: u.role,
    salt: u.salt,
    hash: u.hash,
    bookmarksCount: (u.bookmarks || []).length,
    masteredCount: (u.mastered || []).length,
    reviewCount: (u.review || []).length,
    timeSpent: u.timeSpent || 0,
    bookmarks: u.bookmarks || [],
    mastered: u.mastered || [],
    review: u.review || []
  }));
  res.json(usersData);
});

app.post('/api/questions', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }

  const { section, question, difficulty, answer, explanation } = req.body;

  if (!section || !question || !difficulty || !answer) {
    return res.status(400).json({ error: 'Section, question title, difficulty, and answer SQL are required.' });
  }

  const questions = readQuestions();
  const maxId = questions.reduce((max, q) => q.id > max ? q.id : max, 0);
  const newId = maxId + 1;

  const newQuestion = {
    id: newId,
    section,
    question,
    difficulty,
    answer,
    explanation: explanation || ''
  };

  questions.push(newQuestion);
  questions.sort((a, b) => a.id - b.id);

  if (writeQuestions(questions)) {
    res.status(201).json({ success: true, question: newQuestion });
  } else {
    res.status(500).json({ error: 'Failed to save the new question to database.' });
  }
});

app.put('/api/questions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }

  const id = parseInt(req.params.id);
  const { section, question, difficulty, answer, explanation } = req.body;

  const questions = readQuestions();
  const index = questions.findIndex(q => q.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Question not found' });
  }

  if (section) questions[index].section = section;
  if (question) questions[index].question = question;
  if (difficulty) questions[index].difficulty = difficulty;
  if (answer) questions[index].answer = answer;
  if (explanation !== undefined) questions[index].explanation = explanation;

  if (writeQuestions(questions)) {
    res.json({ success: true, question: questions[index] });
  } else {
    res.status(500).json({ error: 'Failed to update the question in database.' });
  }
});

app.delete('/api/questions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }

  const id = parseInt(req.params.id);
  const questions = readQuestions();
  const index = questions.findIndex(q => q.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const deletedQuestion = questions.splice(index, 1)[0];

  if (writeQuestions(questions)) {
    res.json({ success: true, message: 'Question deleted successfully', id: deletedQuestion.id });
  } else {
    res.status(500).json({ error: 'Failed to delete the question from database.' });
  }
});

// ----------------------------------------------------
// DATABASE BACKUP ROUTES
// ----------------------------------------------------
app.get('/api/database/export', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=questions_export.json');
  res.sendFile(QUESTIONS_FILE);
});

app.post('/api/database/import', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }
  const { questionsData } = req.body;

  if (!questionsData || !Array.isArray(questionsData)) {
    return res.status(400).json({ error: 'Invalid import format. Expected an array of questions.' });
  }

  for (const q of questionsData) {
    if (!q.id || !q.section || !q.question || !q.difficulty || !q.answer) {
      return res.status(400).json({ 
        error: `Invalid question record structure for ID ${q.id || 'unknown'}.` 
      });
    }
  }

  if (writeQuestions(questionsData)) {
    res.json({ success: true, message: `Successfully imported ${questionsData.length} questions.` });
  } else {
    res.status(500).json({ error: 'Failed to import the database file.' });
  }
});

// Catch-all static router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
if (process.env.NODE_ENV !== 'production' && (!process.env.VERCEL || require.main === module)) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  SQL Interview Trainer server running!`);
    console.log(`  Local URL: http://localhost:${PORT}`);
    console.log(`  Admin Passcode: ${ADMIN_PASSCODE}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
