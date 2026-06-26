const express = require('express');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if present
try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let val = parts.slice(1).join('=').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  console.warn('Failed to load local .env.local file:', e.message);
}
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

function startUserSession(user) {
  if (!user.sessions) {
    user.sessions = [];
  }
  
  // Close any open sessions
  user.sessions.forEach(s => {
    if (s.closed !== true) {
      s.closed = true;
      s.logoutTime = s.logoutTime || new Date().toISOString();
    }
  });

  // Create new session
  const newSession = {
    sessionId: Date.now().toString(),
    loginTime: new Date().toISOString(),
    logoutTime: new Date().toISOString(),
    initialSolved: [...(user.mastered || [])],
    solvedCount: 0,
    closed: false
  };

  user.sessions.push(newSession);

  // Cap at 50 sessions to manage space
  if (user.sessions.length > 50) {
    user.sessions.shift();
  }
}

// In-memory cache fallbacks for serverless environments
let inMemoryQuestions = null;
let inMemoryUsers = null;

// Helper to perform REST API requests to Vercel KV if available
async function kvRequest(command) {
  try {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      return { success: false, error: 'KV environment variables not configured.' };
    }

    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(command)
    });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const data = await response.json();
    return { success: true, result: data.result };
  } catch (error) {
    console.error('Error in Vercel KV request:', error);
    return { success: false, error: error.message };
  }
}

// Helper to read database files
async function readQuestions() {
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

async function writeQuestions(data) {
  inMemoryQuestions = data;
  try {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.warn('Warning: Write to questions.json failed. Using in-memory fallback.', error.message);
    return true;
  }
}

async function readUsers() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (kvUrl && kvToken) {
    const res = await kvRequest(['GET', 'users']);
    if (res.success) {
      if (res.result !== null && res.result !== undefined) {
        try {
          const parsed = JSON.parse(res.result);
          inMemoryUsers = parsed;
          return parsed;
        } catch (err) {
          console.error('Failed to parse users from Vercel KV:', err);
        }
      } else {
        // Key doesn't exist yet! Seed it from users.json once
        console.log('Users key not found in KV. Seeding from local file...');
        const localData = [];
        if (fs.existsSync(USERS_FILE)) {
          try {
            const parsedLocal = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
            if (Array.isArray(parsedLocal)) {
              localData.push(...parsedLocal);
            }
          } catch (err) {
            console.error('Failed to read/parse local users.json:', err);
          }
        }
        await writeUsers(localData);
        inMemoryUsers = localData;
        return localData;
      }
    } else {
      console.error('Failed to fetch users from Vercel KV:', res.error);
      if (inMemoryUsers !== null) return inMemoryUsers;
      return [];
    }
  }

  // If KV is not configured, fall back to local disk
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

async function writeUsers(data) {
  inMemoryUsers = data;

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (kvUrl && kvToken) {
    const res = await kvRequest(['SET', 'users', JSON.stringify(data)]);
    if (res.success) {
      // Backup write to local disk (won't crash if read-only, we catch it)
      try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch (e) {
        console.warn('Backup write to users.json failed:', e.message);
      }
      return true;
    }
    console.warn('Warning: Write to Vercel KV failed:', res.error);
  }

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
app.get('/api/questions', async (req, res) => {
  const questions = await readQuestions();
  res.json(questions);
});

// ----------------------------------------------------
// AUTHENTICATION ENDPOINTS (SIGNUP & LOGIN)
// ----------------------------------------------------
app.post('/api/auth/signup', async (req, res) => {
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

  const users = await readUsers();
  
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

  startUserSession(newUser);

  users.push(newUser);
  if (await writeUsers(users)) {
    const token = jwt.sign({ username: cleanUsername, role: 'user' }, SECRET_KEY, { expiresIn: '12h' });
    res.status(201).json({ success: true, token, username: cleanUsername, role: 'user' });
  } else {
    res.status(500).json({ error: 'Failed to create user account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
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

  const users = await readUsers();
  const user = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const calculatedHash = hashPassword(password, user.salt);
  if (calculatedHash === user.hash) {
    startUserSession(user);
    await writeUsers(users);

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
app.get('/api/user/progress', authenticateToken, async (req, res) => {
  const users = await readUsers();
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

app.post('/api/user/progress', authenticateToken, async (req, res) => {
  const { bookmarks, mastered, review, timeSpent } = req.body;
  
  if (!Array.isArray(bookmarks) || !Array.isArray(mastered) || !Array.isArray(review)) {
    return res.status(400).json({ error: 'Progress data must contain arrays of question IDs.' });
  }

  const users = await readUsers();
  const index = users.findIndex(u => u.username.toLowerCase() === req.user.username.toLowerCase());

  if (index === -1) {
    if (req.user.role === 'admin') {
      return res.json({ success: true, message: 'Admin progress is not stored permanently.' });
    }
    return res.status(404).json({ error: 'User profile not found.' });
  }

  const user = users[index];
  user.bookmarks = bookmarks;
  user.mastered = mastered;
  user.review = review;
  if (typeof timeSpent === 'number') {
    user.timeSpent = timeSpent;
  }

  if (!user.sessions) {
    user.sessions = [];
  }
  if (user.sessions.length > 0) {
    const activeSession = user.sessions[user.sessions.length - 1];
    if (activeSession && activeSession.closed !== true) {
      activeSession.logoutTime = new Date().toISOString();
      const initialSet = new Set(activeSession.initialSolved || []);
      const currentlySolved = mastered.filter(id => !initialSet.has(id));
      activeSession.solvedCount = currentlySolved.length;
    }
  }

  if (await writeUsers(users)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to save progress on the server.' });
  }
});

// ----------------------------------------------------
// USER LOGOUT ENDPOINT (EXPLICIT SESSION CLOSE)
// ----------------------------------------------------
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  const users = await readUsers();
  const user = users.find(u => u.username.toLowerCase() === req.user.username.toLowerCase());
  
  if (user) {
    if (!user.sessions) {
      user.sessions = [];
    }
    if (user.sessions.length > 0) {
      const activeSession = user.sessions[user.sessions.length - 1];
      if (activeSession && activeSession.closed !== true) {
        activeSession.closed = true;
        activeSession.logoutTime = new Date().toISOString();
      }
    }
    await writeUsers(users);
  }
  res.json({ success: true });
});

// ----------------------------------------------------
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }
  const users = await readUsers();
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
    review: u.review || [],
    sessions: u.sessions || []
  }));
  res.json(usersData);
});

app.get('/api/admin/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.json({
      configured: false,
      connected: false,
      mode: 'Local Ephemeral (Disk-Backup Mode)',
      maskedUrl: null,
      error: 'Environment variables KV_REST_API_URL or UPSTASH_REDIS_REST_URL are not configured.'
    });
  }

  // Mask URL for security
  let maskedUrl = kvUrl;
  try {
    if (kvUrl.startsWith('http')) {
      const parsedUrl = new URL(kvUrl);
      maskedUrl = `${parsedUrl.protocol}//***${parsedUrl.hostname}`;
    } else {
      maskedUrl = kvUrl.substring(0, 10) + '...';
    }
  } catch (e) {
    maskedUrl = kvUrl.substring(0, 10) + '...';
  }

  const pingTest = await kvRequest(['PING']);
  const isOk = pingTest.success && (pingTest.result === 'PONG' || pingTest.result === 'OK' || pingTest.result === true || typeof pingTest.result === 'string');

  res.json({
    configured: true,
    connected: !!isOk,
    mode: 'Persistent Vercel KV / Upstash Redis',
    maskedUrl: maskedUrl,
    error: pingTest.success ? null : pingTest.error
  });
});

app.post('/api/questions', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }

  const { section, question, difficulty, answer, explanation } = req.body;

  if (!section || !question || !difficulty || !answer) {
    return res.status(400).json({ error: 'Section, question title, difficulty, and answer SQL are required.' });
  }

  const questions = await readQuestions();
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

  if (await writeQuestions(questions)) {
    res.status(201).json({ success: true, question: newQuestion });
  } else {
    res.status(500).json({ error: 'Failed to save the new question to database.' });
  }
});

app.put('/api/questions/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }

  const id = parseInt(req.params.id);
  const { section, question, difficulty, answer, explanation } = req.body;

  const questions = await readQuestions();
  const index = questions.findIndex(q => q.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Question not found' });
  }

  if (section) questions[index].section = section;
  if (question) questions[index].question = question;
  if (difficulty) questions[index].difficulty = difficulty;
  if (answer) questions[index].answer = answer;
  if (explanation !== undefined) questions[index].explanation = explanation;

  if (await writeQuestions(questions)) {
    res.json({ success: true, question: questions[index] });
  } else {
    res.status(500).json({ error: 'Failed to update the question in database.' });
  }
});

app.delete('/api/questions/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }

  const id = parseInt(req.params.id);
  const questions = await readQuestions();
  const index = questions.findIndex(q => q.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const deletedQuestion = questions.splice(index, 1)[0];

  if (await writeQuestions(questions)) {
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

app.post('/api/database/import', authenticateToken, async (req, res) => {
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

  if (await writeQuestions(questionsData)) {
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
