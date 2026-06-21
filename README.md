# SQL Interview Trainer (500 Questions Challenge)

An interactive, high-performance web application designed for learning, testing, and mastering SQL interview questions.

## Features

- **500 SQL Questions Catalog**: Covers Joins, Subqueries & CTEs, Window Functions, Views & Procedures, Triggers, Normalization, and FAANG Mixed Interview challenges.
- **In-Browser SQLite Playground**: Built using WebAssembly `sql.js`, preloaded with 8 relational tables (Employees, Departments, Customers, Orders, Products, etc.) so you can execute queries directly in your browser.
- **Visual DB Schema / ER Explorer**: View the visual layout and data types of the database tables you're querying.
- **Interactive Progress Dashboard**: Tracks completed questions, review lists, bookmarks, and provides topic-specific progress metrics.
- **Admin Control Panel**: Add, edit, or delete questions. Changes persist globally on the server.
- **Backup Support**: Export the full question database as a JSON file and import it anytime.

---

## Technical Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphism theme), JavaScript (ES6).
- **Backend**: Node.js, Express.
- **Database**: JSON-based file storage (`questions.json`) for questions, and in-browser WASM SQLite (`sql.js`) for the sandbox.
- **Security**: JWT-based session tokens for admin verification.

---

## Quick Start

### 1. Install Dependencies
Run the following command in the project directory to install required packages:
```bash
npm install
```

### 2. Start the Server
Start the Express application:
```bash
npm start
```
The server will boot and display:
```
====================================================
  SQL Interview Trainer server running!
  Local URL: http://localhost:3000
  Admin Passcode: sqladmin123
====================================================
```

### 3. Open in Browser
Visit [http://localhost:3000](http://localhost:3000) to start practicing!

---

## Credentials

- **Admin Passcode**: `sqladmin123` (Used in the Admin Center tab to unlock CRUD features).

## Deployment

This app is lightweight and fully ready to deploy:
- **Heroku / Render / Railway**: Connect your repository directly; the server runs on the standard Node start script.
- **Vercel / Netlify**: Can be adapted to Serverless Functions, or deployed as a static frontend app (if adapting server endpoints to local storage instead of server files).
