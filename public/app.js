// ==========================================================================
// SQL INTERVIEW TRAINER - CORE FRONTEND ENGINE WITH LANDING PAGE & BLUR REVEALS
// ==========================================================================

// Global state
let state = {
  questions: [],
  filteredQuestions: [],
  currentPage: 1,
  pageSize: 20,
  bookmarks: JSON.parse(localStorage.getItem('sql_bookmarks')) || [],
  mastered: JSON.parse(localStorage.getItem('sql_mastered')) || [],
  review: JSON.parse(localStorage.getItem('sql_review')) || [],
  token: localStorage.getItem('admin_token') || null, // Stores JWT token
  username: localStorage.getItem('user_name') || null,
  role: localStorage.getItem('user_role') || 'guest', // 'guest', 'user', 'admin'
  revealedSolutions: [], // List of question IDs whose solutions are revealed by the user
  activeTab: 'trainer-tab',
  activeQuestionID: null, // Current practicing question ID in SQL Sandbox
  db: null // SQLite Wasm database connection object
};

// Relational Schema Definition
const schemaMeta = {
  Employees: [
    { name: 'EmployeeID', type: 'INTEGER', key: true },
    { name: 'EmployeeName', type: 'VARCHAR(100)', key: false },
    { name: 'first_name', type: 'VARCHAR(50)', key: false },
    { name: 'last_name', type: 'VARCHAR(50)', key: false },
    { name: 'DepartmentID', type: 'INTEGER', key: false },
    { name: 'ManagerID', type: 'INTEGER', key: false },
    { name: 'Salary', type: 'DECIMAL(10,2)', key: false },
    { name: 'Age', type: 'INTEGER', key: false },
    { name: 'Title', type: 'VARCHAR(50)', key: false },
    { name: 'HireDate', type: 'DATE', key: false },
    { name: 'Status', type: 'VARCHAR(20)', key: false }
  ],
  Departments: [
    { name: 'DepartmentID', type: 'INTEGER', key: true },
    { name: 'DepartmentName', type: 'VARCHAR(50)', key: false },
    { name: 'Location', type: 'VARCHAR(100)', key: false }
  ],
  Customers: [
    { name: 'CustomerID', type: 'INTEGER', key: true },
    { name: 'CustomerName', type: 'VARCHAR(100)', key: false },
    { name: 'Email', type: 'VARCHAR(100)', key: false },
    { name: 'City', type: 'VARCHAR(50)', key: false },
    { name: 'Region', type: 'VARCHAR(50)', key: false },
    { name: 'SalesRepID', type: 'INTEGER', key: false },
    { name: 'status', type: 'VARCHAR(20)', key: false },
    { name: 'register_date', type: 'DATE', key: false }
  ],
  Orders: [
    { name: 'OrderID', type: 'INTEGER', key: true },
    { name: 'CustomerID', type: 'INTEGER', key: false },
    { name: 'OrderDate', type: 'DATE', key: false },
    { name: 'Amount', type: 'DECIMAL(10,2)', key: false },
    { name: 'total_amount', type: 'DECIMAL(10,2)', key: false },
    { name: 'order_amount', type: 'DECIMAL(10,2)', key: false },
    { name: 'PartnerID', type: 'INTEGER', key: false },
    { name: 'RestaurantID', type: 'INTEGER', key: false }
  ],
  Products: [
    { name: 'ProductID', type: 'INTEGER', key: true },
    { name: 'ProductName', type: 'VARCHAR(100)', key: false },
    { name: 'CategoryID', type: 'INTEGER', key: false },
    { name: 'Price', type: 'DECIMAL(10,2)', key: false },
    { name: 'Stock', type: 'INTEGER', key: false },
    { name: 'stock_quantity', type: 'INTEGER', key: false },
    { name: 'Status', type: 'VARCHAR(20)', key: false },
    { name: 'SupplierID', type: 'INTEGER', key: false },
    { name: 'VendorID', type: 'INTEGER', key: false }
  ],
  Categories: [
    { name: 'CategoryID', type: 'INTEGER', key: true },
    { name: 'CategoryName', type: 'VARCHAR(50)', key: false }
  ],
  Projects: [
    { name: 'ProjectID', type: 'INTEGER', key: true },
    { name: 'ProjectName', type: 'VARCHAR(100)', key: false },
    { name: 'Budget', type: 'DECIMAL(15,2)', key: false },
    { name: 'Status', type: 'VARCHAR(20)', key: false },
    { name: 'DeptID', type: 'INTEGER', key: false }
  ],
  Employee_Projects: [
    { name: 'EmployeeID', type: 'INTEGER', key: true },
    { name: 'ProjectID', type: 'INTEGER', key: true },
    { name: 'AssignedDate', type: 'DATE', key: false }
  ],
  Attendance: [
    { name: 'AttendanceID', type: 'INTEGER', key: true },
    { name: 'EmployeeID', type: 'INTEGER', key: false },
    { name: 'Status', type: 'VARCHAR(10)', key: false },
    { name: 'AttendanceDate', type: 'DATE', key: false }
  ],
  Suppliers: [
    { name: 'SupplierID', type: 'INTEGER', key: true },
    { name: 'SupplierName', type: 'VARCHAR(100)', key: false },
    { name: 'DeliveryDays', type: 'INTEGER', key: false }
  ],
  order_items: [
    { name: 'order_id', type: 'INTEGER', key: false },
    { name: 'product_id', type: 'INTEGER', key: false },
    { name: 'product_name', type: 'VARCHAR(100)', key: false },
    { name: 'quantity', type: 'INTEGER', key: false },
    { name: 'unit_price', type: 'DECIMAL(10,2)', key: false }
  ],
  product_reviews: [
    { name: 'product_id', type: 'INTEGER', key: false },
    { name: 'rating', type: 'INTEGER', key: false }
  ],
  users: [
    { name: 'id', type: 'INTEGER', key: true },
    { name: 'username', type: 'VARCHAR(50)', key: false },
    { name: 'email', type: 'VARCHAR(100)', key: false }
  ]
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  
  // Render schema reference synchronously on load so sidebar tables/columns are always visible
  renderPlaygroundSchema();
  
  initDatabase();
  fetchQuestions();
  initFilters();
  initLandingAuthUI();
  initUserCenterAuthUI();
  initAdmin();
  initVisualizations();
  initActiveQuestionWidgetEvents();
  initTheoryTab();
  
  // Set initial workspace view based on login state
  if (state.token) {
    toggleWorkspaceView(true);
    updateAuthView(true);
    syncCloudProgress();
  } else {
    toggleWorkspaceView(false);
    updateAuthView(false);
  }
  updateProgressUI();
});

// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-triangle-exclamation';
  if (type === 'warning') icon = 'fa-triangle-exclamation';
  
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-out reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Toggles visibility between Landing Page and App Dashboard Workspace
function toggleWorkspaceView(isLoggedIn) {
  const landingPage = document.getElementById('landing-page');
  const workspace = document.getElementById('app-workspace');
  
  if (isLoggedIn) {
    landingPage.style.display = 'none';
    workspace.classList.remove('hidden');
    workspace.style.display = 'grid';
  } else {
    workspace.classList.add('hidden');
    workspace.style.display = 'none';
    landingPage.style.display = 'flex';
  }
}

// ----------------------------------------------------
// TAB SYSTEM ROUTING
// ----------------------------------------------------
function initTabs() {
  const buttons = document.querySelectorAll('.nav-btn');
  const tabs = document.querySelectorAll('.tab-content');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      buttons.forEach(b => b.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
      state.activeTab = targetTab;
      
      if (targetTab === 'analytics-tab') {
        renderAnalytics();
      } else if (targetTab === 'theory-tab') {
        renderTheoryList();
      }
    });
  });

  document.getElementById('sidebar-user-card').addEventListener('click', () => {
    switchTab('admin-tab');
  });
}

function switchTab(tabId) {
  const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  if (btn) btn.click();
}

// ----------------------------------------------------
// DATABASE & SQLITE ENGINE
// ----------------------------------------------------
async function initDatabase() {
  const statusIndicator = document.getElementById('query-status');
  try {
    statusIndicator.textContent = 'Loading Engine...';
    statusIndicator.className = 'status-indicator info';
    
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
    
    state.db = new SQL.Database();
    statusIndicator.textContent = 'Seeding Data...';
    
    seedSQLiteDatabase();
    
    statusIndicator.textContent = 'Sandbox Active';
    statusIndicator.className = 'status-indicator success';
    
    renderPlaygroundSchema();
  } catch (error) {
    console.error('Failed to load SQLite WASM engine:', error);
    statusIndicator.textContent = 'Engine Offline';
    statusIndicator.className = 'status-indicator error';
    showToast('Failed to initialize in-browser SQL Sandbox.', 'error');
  }
}

function seedSQLiteDatabase() {
  const db = state.db;
  if (!db) return;
  
  db.run(`
    CREATE TABLE Departments (
      DepartmentID INTEGER PRIMARY KEY,
      DepartmentName VARCHAR(50),
      Location VARCHAR(100)
    );
    
    CREATE TABLE Employees (
      EmployeeID INTEGER PRIMARY KEY,
      EmployeeName VARCHAR(100),
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      DepartmentID INTEGER,
      ManagerID INTEGER,
      Salary DECIMAL(10,2),
      Age INTEGER,
      Title VARCHAR(50),
      HireDate DATE,
      Status VARCHAR(20),
      FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
    );
    
    CREATE TABLE Customers (
      CustomerID INTEGER PRIMARY KEY,
      CustomerName VARCHAR(100),
      Email VARCHAR(100),
      City VARCHAR(50),
      Region VARCHAR(50),
      SalesRepID INTEGER,
      status VARCHAR(20),
      register_date DATE,
      FOREIGN KEY (SalesRepID) REFERENCES Employees(EmployeeID)
    );
    
    CREATE TABLE Categories (
      CategoryID INTEGER PRIMARY KEY,
      CategoryName VARCHAR(50)
    );
    
    CREATE TABLE Products (
      ProductID INTEGER PRIMARY KEY,
      ProductName VARCHAR(100),
      CategoryID INTEGER,
      Price DECIMAL(10,2),
      Stock INTEGER,
      stock_quantity INTEGER,
      Status VARCHAR(20),
      SupplierID INTEGER,
      VendorID INTEGER,
      FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
    );
    
    CREATE TABLE Orders (
      OrderID INTEGER PRIMARY KEY,
      CustomerID INTEGER,
      OrderDate DATE,
      Amount DECIMAL(10,2),
      total_amount DECIMAL(10,2),
      order_amount DECIMAL(10,2),
      PartnerID INTEGER,
      RestaurantID INTEGER,
      FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
    );
    
    CREATE TABLE Projects (
      ProjectID INTEGER PRIMARY KEY,
      ProjectName VARCHAR(100),
      Budget DECIMAL(15,2),
      Status VARCHAR(20),
      DeptID INTEGER
    );
    
    CREATE TABLE Employee_Projects (
      EmployeeID INTEGER,
      ProjectID INTEGER,
      AssignedDate DATE,
      PRIMARY KEY (EmployeeID, ProjectID),
      FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
      FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)
    );
    
    CREATE TABLE Attendance (
      AttendanceID INTEGER PRIMARY KEY AUTOINCREMENT,
      EmployeeID INTEGER,
      Status VARCHAR(10),
      AttendanceDate DATE,
      FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID)
    );

    CREATE TABLE Suppliers (
      SupplierID INTEGER PRIMARY KEY,
      SupplierName VARCHAR(100),
      DeliveryDays INTEGER
    );

    CREATE TABLE order_items (
      order_id INTEGER,
      product_id INTEGER,
      product_name VARCHAR(100),
      quantity INTEGER,
      unit_price DECIMAL(10,2)
    );

    CREATE TABLE product_reviews (
      product_id INTEGER,
      rating INTEGER
    );

    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50),
      email VARCHAR(100)
    );
  `);
  
  db.run(`
    INSERT INTO Departments VALUES 
    (1, 'IT', 'Mumbai'),
    (2, 'Sales', 'Pune'),
    (3, 'HR', 'Delhi'),
    (4, 'Finance', 'Mumbai'),
    (5, 'Marketing', 'Bangalore');
    
    INSERT INTO Employees VALUES 
    (1, 'John Doe', 'John', 'Doe', 1, NULL, 95000.00, 42, 'Director', '2018-01-15', 'Active'),
    (2, 'David Smith', 'David', 'Smith', 1, 1, 80000.00, 31, 'Manager', '2020-03-10', 'Active'),
    (3, 'Sarah Connor', 'Sarah', 'Connor', 2, NULL, 75000.00, 35, 'Sales Head', '2019-06-01', 'Active'),
    (4, 'Michael Scott', 'Michael', 'Scott', 2, 3, 55000.00, 45, 'SalesRep', '2021-11-20', 'Active'),
    (5, 'Pam Beesly', 'Pam', 'Beesly', 3, NULL, 48000.00, 29, 'HR Coordinator', '2020-08-15', 'Active'),
    (6, 'Angela Martin', 'Angela', 'Martin', 4, NULL, 68000.00, 38, 'Senior Accountant', '2017-05-12', 'Active'),
    (7, 'Jim Halpert', 'Jim', 'Halpert', 2, 3, 62000.00, 32, 'SalesRep', '2020-02-14', 'Active'),
    (8, 'Ryan Howard', 'Ryan', 'Howard', 5, NULL, 40000.00, 26, 'Temp', '2022-09-01', 'Inactive'),
    (9, 'Kelly Kapoor', 'Kelly', 'Kapoor', 5, 8, 45000.00, 28, 'Customer Relations', '2021-04-10', 'Active');
    
    INSERT INTO Customers VALUES 
    (101, 'Acme Corp', 'contact@acme.com', 'Mumbai', 'West', 4, 'Active', '2025-05-15'),
    (102, 'Stark Industries', 'info@stark.com', 'Pune', 'West', 4, 'Active', '2025-06-01'),
    (103, 'Wayne Enterprises', 'bruce@wayne.com', 'Delhi', 'North', 7, 'Active', '2025-06-10'),
    (104, 'Oscorp Industries', 'norman@oscorp.com', 'Bangalore', 'South', 7, 'Inactive', '2025-04-20'),
    (105, 'Tyrell Corp', 'replicant@tyrell.com', 'Mumbai', 'West', 3, 'Active', '2025-06-18');
    
    INSERT INTO Categories VALUES 
    (10, 'Electronics'),
    (20, 'Office Supplies'),
    (30, 'Furniture'),
    (40, 'Software');
    
    INSERT INTO Products VALUES 
    (501, 'ThinkPad Laptop', 10, 85000.00, 25, 25, 'Active', 1001, 201),
    (502, 'Ergonomic Chair', 30, 15000.00, 10, 10, 'Active', 1002, 202),
    (503, 'Wireless Mouse', 10, 1200.00, 150, 150, 'Active', 1001, 201),
    (504, 'MS Office License', 40, 8000.00, 999, 999, 'Active', 1003, 203),
    (505, 'Standing Desk', 30, 22000.00, 5, 5, 'Active', 1002, 202),
    (506, 'Old Monitor', 10, 5000.00, 0, 0, 'Discontinued', 1001, 201);
    
    INSERT INTO Orders VALUES 
    (1001, 101, '2025-01-10', 85000.00, 85000.00, 85000.00, 50, 10),
    (1002, 101, '2025-01-15', 2400.00, 2400.00, 2400.00, 50, 10),
    (1003, 102, '2025-02-01', 15000.00, 15000.00, 15000.00, 51, 11),
    (1004, 103, '2025-02-18', 22000.00, 22000.00, 22000.00, 52, 12),
    (1005, 104, '2025-03-05', 93000.00, 93000.00, 93000.00, 50, 10),
    (1006, 101, '2025-03-12', 1200.00, 1200.00, 1200.00, 51, 10);
    
    INSERT INTO Projects VALUES 
    (301, 'Project Alpha', 250000.00, 'Active', 1),
    (302, 'Project Beta', 120000.00, 'Active', 2),
    (303, 'Project Gamma', 80000.00, 'Planning', 1),
    (304, 'Unstaffed Initiative', 50000.00, 'On Hold', 5);
    
    INSERT INTO Employee_Projects VALUES 
    (1, 301, '2024-12-01'),
    (2, 301, '2025-01-10'),
    (4, 302, '2025-02-01'),
    (7, 302, '2025-02-01'),
    (3, 302, '2025-02-15');
    
    INSERT INTO Attendance (EmployeeID, Status, AttendanceDate) VALUES 
    (1, 'Present', '2026-06-01'), (2, 'Present', '2026-06-01'), (3, 'Present', '2026-06-01'), (4, 'Absent', '2026-06-01'), (5, 'Present', '2026-06-01'),
    (1, 'Present', '2026-06-02'), (2, 'Present', '2026-06-02'), (3, 'Present', '2026-06-02'), (4, 'Present', '2026-06-02'), (5, 'Present', '2026-06-02'),
    (1, 'Present', '2026-06-03'), (2, 'Absent', '2026-06-03'), (3, 'Present', '2026-06-03'), (4, 'Present', '2026-06-03'), (5, 'Absent', '2026-06-03');

    INSERT INTO Suppliers VALUES
    (1001, 'TechDistributors Inc', 3),
    (1002, 'ComfortFurniture Co', 7),
    (1003, 'SoftwareStore Ltd', 1);

    INSERT INTO order_items VALUES
    (1001, 501, 'ThinkPad Laptop', 2, 85000.00),
    (1002, 503, 'Wireless Mouse', 5, 1200.00),
    (1003, 502, 'Ergonomic Chair', 1, 15000.00),
    (1004, 505, 'Standing Desk', 1, 22000.00),
    (1005, 501, 'ThinkPad Laptop', 1, 85000.00),
    (1005, 503, 'Wireless Mouse', 2, 1200.00),
    (1006, 503, 'Wireless Mouse', 1, 1200.00);

    INSERT INTO product_reviews VALUES
    (501, 5), (501, 4),
    (502, 5),
    (503, 3), (503, 4),
    (504, 5),
    (505, 4);

    INSERT INTO users (username, email) VALUES 
    ('kanna', 'kanna@example.com'),
    ('adarsh', 'adarsh@example.com'),
    ('rahul', 'rahul@example.com'),
    ('amit', 'amit@example.com'),
    ('john_dup', 'kanna@example.com'),
    ('dave_dup', 'adarsh@example.com'),
    ('sarah', 'sarah@example.com');
  `);
}

// ----------------------------------------------------
// FETCH & FILTER SYSTEM
// ----------------------------------------------------
async function fetchQuestions() {
  const container = document.getElementById('questions-container');
  try {
    const response = await fetch('/api/questions');
    if (!response.ok) throw new Error('API request failed');
    
    state.questions = await response.json();
    applyFilters();
  } catch (error) {
    console.error('Error fetching questions:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation text-danger"></i>
        <p>Failed to connect to the backend server. Make sure the Node server is running at localhost:3000.</p>
        <button class="btn btn-primary" onclick="fetchQuestions()"><i class="fa-solid fa-arrows-rotate"></i> Retry Connection</button>
      </div>
    `;
  }
}

function initFilters() {
  const searchInput = document.getElementById('search-input');
  const sectionFilter = document.getElementById('filter-section');
  const difficultyFilter = document.getElementById('filter-difficulty');
  const statusFilter = document.getElementById('filter-status');
  const collapseBtn = document.getElementById('collapse-all-btn');

  searchInput.addEventListener('input', () => {
    state.currentPage = 1;
    applyFilters();
  });
  
  sectionFilter.addEventListener('change', () => {
    state.currentPage = 1;
    applyFilters();
  });
  
  difficultyFilter.addEventListener('change', () => {
    state.currentPage = 1;
    applyFilters();
  });
  
  statusFilter.addEventListener('change', () => {
    state.currentPage = 1;
    applyFilters();
  });

  collapseBtn.addEventListener('click', () => {
    const openCards = document.querySelectorAll('.question-card.open');
    openCards.forEach(card => card.classList.remove('open'));
    showToast('All question cards collapsed.', 'info');
  });

  // Sandbox buttons
  document.getElementById('btn-run-query').addEventListener('click', runSandboxQuery);
  document.getElementById('sql-query-editor').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runSandboxQuery();
    }
  });

  document.getElementById('btn-load-sample').addEventListener('click', () => {
    if (confirm('Reset SQLite database? All custom modifications will be lost.')) {
      seedSQLiteDatabase();
      runSandboxQuery();
      showToast('SQLite tables reset to initial seeded data.', 'success');
    }
  });
}

function applyFilters() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const section = document.getElementById('filter-section').value;
  const difficulty = document.getElementById('filter-difficulty').value;
  const status = document.getElementById('filter-status').value;

  state.filteredQuestions = state.questions.filter(q => {
    const matchQuery = q.question.toLowerCase().includes(query) || 
                       q.id.toString() === query ||
                       q.answer.toLowerCase().includes(query) ||
                       (q.explanation && q.explanation.toLowerCase().includes(query));
    
    const matchSection = (section === 'all') || (q.section === section);
    const matchDiff = (difficulty === 'all') || (q.difficulty === difficulty);
    
    let matchStatus = true;
    if (status === 'mastered') matchStatus = state.mastered.includes(q.id);
    else if (status === 'review') matchStatus = state.review.includes(q.id);
    else if (status === 'bookmarked') matchStatus = state.bookmarks.includes(q.id);
    else if (status === 'unattempted') {
      matchStatus = !state.mastered.includes(q.id) && !state.review.includes(q.id);
    }

    return matchQuery && matchSection && matchDiff && matchStatus;
  });

  document.getElementById('results-count-text').textContent = `Showing ${state.filteredQuestions.length} of ${state.questions.length} questions`;
  renderQuestionList();
}

// ----------------------------------------------------
// RENDER QUESTIONS WITH CLICK-TO-REVEAL SOLUTION
// ----------------------------------------------------
function renderQuestionList() {
  const container = document.getElementById('questions-container');
  const pagination = document.getElementById('pagination-controls');
  
  // If not authenticated, we don't display anything (controlled by toggleWorkspaceView anyway, but double check)
  if (state.role === 'guest' || !state.token) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-lock" style="font-size: 3rem; color: var(--color-primary);"></i>
        <p>Please Login or Create a Free Account to unlock all 500 questions.</p>
        <button class="btn btn-primary" onclick="switchTab('admin-tab')">Go to Account Center</button>
      </div>
    `;
    pagination.innerHTML = '';
    return;
  }

  if (state.filteredQuestions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-folder-open"></i>
        <p>No questions match your filter settings.</p>
      </div>
    `;
    pagination.innerHTML = '';
    return;
  }

  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = Math.min(startIndex + state.pageSize, state.filteredQuestions.length);
  const paginatedList = state.filteredQuestions.slice(startIndex, endIndex);

  container.innerHTML = '';
  
  paginatedList.forEach(q => {
    const isBookmarked = state.bookmarks.includes(q.id);
    const isMastered = state.mastered.includes(q.id);
    const isReview = state.review.includes(q.id);
    const isRevealed = state.revealedSolutions.includes(q.id);

    const card = document.createElement('div');
    card.className = 'question-card';
    card.id = `q-card-${q.id}`;
    
    // Panel content changes based on click-to-reveal state
    let answerHtml = '';
    if (isRevealed) {
      answerHtml = `
        <div class="panel-section-title">
          <span>SQL SOLUTION</span>
          <div class="code-actions-row">
            <button class="copy-code-btn" onclick="copyAnswerText(${q.id})"><i class="fa-solid fa-copy"></i> Copy Query</button>
            <button class="run-in-sandbox-btn" onclick="triggerSolveRedirect(${q.id})"><i class="fa-solid fa-terminal"></i> Solve in Sandbox</button>
          </div>
        </div>
        <div class="code-block-wrapper">
          <pre><code id="code-content-${q.id}">${escapeHTML(q.answer)}</code></pre>
        </div>
        
        <div class="panel-section-title">EXPLANATION</div>
        <div class="explanation-box">
          ${escapeHTML(q.explanation || 'No detailed explanation.')}
        </div>
      `;
    } else {
      answerHtml = `
        <div class="solution-lock-container">
          <div class="lock-title">
            <i class="fa-solid fa-eye-slash"></i>
            <span>SQL Answer Hidden</span>
          </div>
          <p class="lock-desc">Write your solution query inside the interactive SQL sandbox first before checking the revealed answer.</p>
          <div style="display:flex; gap:10px; margin-top:5px;">
            <button class="btn btn-secondary btn-sm" onclick="triggerSolveRedirect(${q.id})">
              <i class="fa-solid fa-terminal"></i> Try Solving in Sandbox
            </button>
            <button class="btn btn-primary btn-sm" onclick="revealQuestionSolution(${q.id})">
              <i class="fa-solid fa-eye"></i> Reveal SQL Answer
            </button>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="question-header-row">
        <div class="question-summary-left" onclick="toggleCard(${q.id})">
          <span class="question-id">${q.id}</span>
          <h3 class="question-title">${escapeHTML(q.question)}</h3>
          <div class="badges-group">
            <span class="badge badge-difficulty ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
            <span class="badge badge-section">${q.section}</span>
          </div>
        </div>
        <div class="action-icons-right">
          <button class="card-action-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${q.id}, this)" title="Bookmark Question">
            <i class="fa-solid fa-bookmark"></i>
          </button>
          <button class="card-action-btn ${isMastered ? 'mastered' : ''}" onclick="toggleMastered(${q.id}, this)" title="Mark as Mastered">
            <i class="fa-solid fa-circle-check"></i>
          </button>
          <button class="card-action-btn ${isReview ? 'text-warning' : ''}" onclick="toggleReview(${q.id}, this)" title="Mark for Review">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </button>
          <span class="chevron-icon" onclick="toggleCard(${q.id})"><i class="fa-solid fa-chevron-down"></i></span>
        </div>
      </div>
      
      <div class="question-body-panel">
        <div class="panel-content">
          <div id="q-card-body-content-${q.id}">
            ${answerHtml}
          </div>
          
          ${state.role === 'admin' ? `
            <div class="admin-q-controls">
              <button class="btn btn-secondary btn-sm" onclick="editQuestionAdmin(${q.id})">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteQuestionAdmin(${q.id})">
                <i class="fa-solid fa-trash-can"></i> Delete
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  renderPaginationControls();
}

// Triggers solution display on the card dynamically without reloading the full list!
window.revealQuestionSolution = function(id) {
  const q = state.questions.find(item => item.id === id);
  if (!q) return;

  state.revealedSolutions.push(id);
  
  const bodyContent = document.getElementById(`q-card-body-content-${id}`);
  if (bodyContent) {
    bodyContent.innerHTML = `
      <div class="panel-section-title">
        <span>SQL SOLUTION</span>
        <div class="code-actions-row">
          <button class="copy-code-btn" onclick="copyAnswerText(${q.id})"><i class="fa-solid fa-copy"></i> Copy Query</button>
          <button class="run-in-sandbox-btn" onclick="triggerSolveRedirect(${q.id})"><i class="fa-solid fa-terminal"></i> Solve in Sandbox</button>
        </div>
      </div>
      <div class="code-block-wrapper">
        <pre><code id="code-content-${q.id}">${escapeHTML(q.answer)}</code></pre>
      </div>
      
      <div class="panel-section-title">EXPLANATION</div>
      <div class="explanation-box">
        ${escapeHTML(q.explanation || 'No detailed explanation.')}
      </div>
    `;
    
    // Recalculate heights for accordion transition
    const card = document.getElementById(`q-card-${id}`);
    const panel = card.querySelector('.question-body-panel');
    panel.style.maxHeight = panel.scrollHeight + 'px';
    
    showToast(`SQL Solution revealed for Question #${id}`, 'success');
  }
};

function renderPaginationControls() {
  const pagination = document.getElementById('pagination-controls');
  const totalPages = Math.ceil(state.filteredQuestions.length / state.pageSize);
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = `
    <button class="pag-btn" ${state.currentPage === 1 ? 'disabled' : ''} onclick="changePage(${state.currentPage - 1})">
      <i class="fa-solid fa-chevron-left"></i> Prev
    </button>
  `;

  const maxButtons = 5;
  let startPage = Math.max(1, state.currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="pag-btn ${state.currentPage === i ? 'active' : ''}" onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="pag-btn" ${state.currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${state.currentPage + 1})">
      Next <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;
  pagination.innerHTML = html;
}

function changePage(pageNum) {
  state.currentPage = pageNum;
  renderQuestionList();
  document.getElementById('trainer-tab').scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleCard(id) {
  const card = document.getElementById(`q-card-${id}`);
  if (!card) return;
  
  const isOpen = card.classList.contains('open');
  const openCards = document.querySelectorAll('.question-card.open');
  openCards.forEach(c => {
    if (c.id !== `q-card-${id}`) {
      c.classList.remove('open');
      c.querySelector('.question-body-panel').style.maxHeight = '0px';
    }
  });

  const panel = card.querySelector('.question-body-panel');
  if (isOpen) {
    card.classList.remove('open');
    panel.style.maxHeight = '0px';
  } else {
    card.classList.add('open');
    panel.style.maxHeight = panel.scrollHeight + 'px';
  }
}

// ----------------------------------------------------
// BOOKMARKS, MASTERY & CLOUD SYNC
// ----------------------------------------------------
function toggleBookmark(id, btnElement) {
  const idx = state.bookmarks.indexOf(id);
  if (idx > -1) {
    state.bookmarks.splice(idx, 1);
    btnElement.classList.remove('bookmarked');
    showToast(`Removed Question #${id} from bookmarks.`, 'info');
  } else {
    state.bookmarks.push(id);
    btnElement.classList.add('bookmarked');
    showToast(`Question #${id} added to bookmarks.`, 'success');
  }
  localStorage.setItem('sql_bookmarks', JSON.stringify(state.bookmarks));
  updateProgressUI();
  triggerProgressUpload();
}

function toggleMastered(id, btnElement) {
  const idx = state.mastered.indexOf(id);
  if (idx > -1) {
    state.mastered.splice(idx, 1);
    btnElement.classList.remove('mastered');
    showToast(`Question #${id} unmarked from Mastered.`, 'info');
  } else {
    state.mastered.push(id);
    btnElement.classList.add('mastered');
    
    const revIdx = state.review.indexOf(id);
    if (revIdx > -1) {
      state.review.splice(revIdx, 1);
      const revBtn = btnElement.parentElement.querySelector('button[title="Mark for Review"]');
      if (revBtn) revBtn.classList.remove('text-warning');
    }
    showToast(`Question #${id} marked as Mastered!`, 'success');
  }
  localStorage.setItem('sql_mastered', JSON.stringify(state.mastered));
  localStorage.setItem('sql_review', JSON.stringify(state.review));
  updateProgressUI();
  triggerProgressUpload();
}

function toggleReview(id, btnElement) {
  const idx = state.review.indexOf(id);
  if (idx > -1) {
    state.review.splice(idx, 1);
    btnElement.classList.remove('text-warning');
    showToast(`Question #${id} removed from review list.`, 'info');
  } else {
    state.review.push(id);
    btnElement.classList.add('text-warning');
    
    const mastIdx = state.mastered.indexOf(id);
    if (mastIdx > -1) {
      state.mastered.splice(mastIdx, 1);
      const mastBtn = btnElement.parentElement.querySelector('button[title="Mark as Mastered"]');
      if (mastBtn) mastBtn.classList.remove('mastered');
    }
    showToast(`Question #${id} marked for review.`, 'warning');
  }
  localStorage.setItem('sql_review', JSON.stringify(state.review));
  localStorage.setItem('sql_mastered', JSON.stringify(state.mastered));
  updateProgressUI();
  triggerProgressUpload();
}

function updateProgressUI() {
  const totalQuestions = state.questions.length || 500;
  const masteredCount = state.mastered.length;
  const reviewCount = state.review.length;
  
  const percent = totalQuestions > 0 ? Math.round((masteredCount / totalQuestions) * 100) : 0;
  
  document.getElementById('mastered-count-badge').textContent = masteredCount;
  document.getElementById('review-count-badge').textContent = reviewCount;
  document.getElementById('progress-percent').textContent = `${percent}%`;
  document.getElementById('progress-fill-bar').style.width = `${percent}%`;
  document.getElementById('admin-total-questions').textContent = totalQuestions;
}

async function triggerProgressUpload() {
  if (state.role === 'guest' || !state.token) return;

  const payload = {
    bookmarks: state.bookmarks,
    mastered: state.mastered,
    review: state.review
  };

  try {
    const res = await fetch('/api/user/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        showToast('Session expired or profile not found. Logging out...', 'warning');
        window.logoutUserAction(false);
      } else {
        console.warn('Sync failed.');
      }
    }
  } catch (err) {
    console.error('Progress sync error:', err);
  }
}

async function syncCloudProgress() {
  if (!state.token) return;

  const syncIndicator = document.getElementById('sync-status-indicator');
  if (syncIndicator) {
    syncIndicator.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing progress...';
    syncIndicator.style.color = 'var(--text-muted)';
  }

  try {
    const res = await fetch('/api/user/progress', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      
      const mergedBookmarks = [...new Set([...state.bookmarks, ...(data.bookmarks || [])])];
      const mergedMastered = [...new Set([...state.mastered, ...(data.mastered || [])])];
      const mergedReview = [...new Set([...state.review, ...(data.review || [])])];

      state.bookmarks = mergedBookmarks;
      state.mastered = mergedMastered;
      state.review = mergedReview;

      localStorage.setItem('sql_bookmarks', JSON.stringify(state.bookmarks));
      localStorage.setItem('sql_mastered', JSON.stringify(state.mastered));
      localStorage.setItem('sql_review', JSON.stringify(state.review));

      updateProgressUI();
      triggerProgressUpload();

      if (syncIndicator) {
        syncIndicator.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Connected & Synced';
        syncIndicator.style.color = 'var(--success)';
      }
    } else {
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        showToast('Session expired or profile not found. Logging out...', 'warning');
        window.logoutUserAction(false);
        return;
      }
      if (syncIndicator) {
        syncIndicator.innerHTML = '<i class="fa-solid fa-cloud-slash"></i> Sync Failed';
        syncIndicator.style.color = 'var(--danger)';
      }
    }
  } catch (err) {
    console.error('Sync failed:', err);
    if (syncIndicator) {
      syncIndicator.innerHTML = '<i class="fa-solid fa-cloud-slash"></i> Offline';
      syncIndicator.style.color = 'var(--danger)';
    }
  }
}

// ----------------------------------------------------
// SOLVE REDIRECT & PRACTICE WIDGET EVENTS
// ----------------------------------------------------
function triggerSolveRedirect(questionId) {
  const q = state.questions.find(item => item.id === questionId);
  if (!q) return;

  state.activeQuestionID = questionId;

  const editor = document.getElementById('sql-query-editor');
  editor.value = `-- Practice Question #${q.id}: ${q.question}\n-- Write your SQL query below and run it:\n\n`;

  document.getElementById('widget-q-id').textContent = `Q${q.id}`;
  document.getElementById('widget-q-diff').className = `badge badge-difficulty ${q.difficulty.toLowerCase()}`;
  document.getElementById('widget-q-diff').textContent = q.difficulty;
  document.getElementById('widget-q-section').textContent = q.section;
  document.getElementById('widget-q-text').textContent = q.question;

  document.getElementById('active-question-widget').classList.add('visible');
  
  // Set solved status badge in playground active question widget
  const solvedBadge = document.getElementById('widget-q-status-badge');
  if (solvedBadge) {
    if (state.mastered.includes(questionId)) {
      solvedBadge.classList.remove('hidden');
    } else {
      solvedBadge.classList.add('hidden');
    }
  }
  switchTab('playground-tab');
  
  // Clear any existing suggestions highlights
  const cards = document.querySelectorAll('.schema-ref-card');
  cards.forEach(c => {
    c.classList.remove('highlighted-table');
    c.classList.remove('open');
  });

  // Extract referenced tables from the query solution
  const referencedTables = [];
  Object.keys(schemaMeta).forEach(tblName => {
    const regex = new RegExp('\\b' + tblName + '\\b', 'i');
    if (q.answer.match(regex)) {
      referencedTables.push(tblName);
    }
  });

  // Highlight and expand suggest tables
  referencedTables.forEach(tblName => {
    const card = document.getElementById(`schema-card-${tblName}`);
    if (card) {
      card.classList.add('highlighted-table');
      card.classList.add('open');
    }
  });

  document.getElementById('query-results-table').innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-play-circle text-accent"></i>
      <p>Write your solution query above and click "Run Query". You are practicing Question #${q.id}.</p>
    </div>
  `;
  
  editor.focus();
  showToast(`Question #${q.id} loaded. Suggested tables highlighted in reference panel.`, 'success');
}

function initActiveQuestionWidgetEvents() {
  document.getElementById('btn-clear-active-widget').addEventListener('click', () => {
    state.activeQuestionID = null;
    document.getElementById('active-question-widget').classList.remove('visible');
    
    // Clear suggestion highlights on cancel
    const cards = document.querySelectorAll('.schema-ref-card');
    cards.forEach(c => {
      c.classList.remove('highlighted-table');
      c.classList.remove('open');
    });

    showToast('Active question practice closed.', 'info');
  });

  document.getElementById('widget-q-go-back').addEventListener('click', () => {
    if (state.activeQuestionID) {
      navigateToQuestion(state.activeQuestionID);
    }
  });

  document.getElementById('widget-q-view-ans').addEventListener('click', () => {
    if (!state.activeQuestionID) return;
    const q = state.questions.find(item => item.id === state.activeQuestionID);
    if (q) {
      alert(`SQL Query Solution for Q#${q.id}:\n\n${q.answer}\n\nExplanation: ${q.explanation || ''}`);
    }
  });

  document.getElementById('widget-q-test-ans').addEventListener('click', () => {
    if (!state.activeQuestionID) return;
    const q = state.questions.find(item => item.id === state.activeQuestionID);
    if (q) {
      const editor = document.getElementById('sql-query-editor');
      editor.value = `-- Query solution for Question #${q.id}\n` + q.answer;
      editor.focus();
      showToast('Solution query pasted into console editor.', 'success');
    }
  });
}

// ----------------------------------------------------
// SQL PLAYGROUND RENDERING
// ----------------------------------------------------
// Static mock data for previewing table records when the SQLite engine is offline/loading
const staticMockData = {
  Departments: {
    columns: ['DepartmentID', 'DepartmentName', 'Location'],
    values: [
      [1, 'IT', 'Mumbai'],
      [2, 'Sales', 'Pune'],
      [3, 'HR', 'Delhi'],
      [4, 'Finance', 'Mumbai'],
      [5, 'Marketing', 'Bangalore']
    ]
  },
  Employees: {
    columns: ['EmployeeID', 'EmployeeName', 'DepartmentID', 'ManagerID', 'Salary', 'Age', 'Title', 'HireDate', 'Status'],
    values: [
      [1, 'John Doe', 1, null, 95000.00, 42, 'Director', '2018-01-15', 'Active'],
      [2, 'David Smith', 1, 1, 80000.00, 31, 'Manager', '2020-03-10', 'Active'],
      [3, 'Sarah Connor', 2, null, 75000.00, 35, 'Sales Head', '2019-06-01', 'Active'],
      [4, 'Michael Scott', 2, 3, 55000.00, 45, 'SalesRep', '2021-11-20', 'Active'],
      [5, 'Pam Beesly', 3, null, 48000.00, 29, 'HR Coordinator', '2020-08-15', 'Active']
    ]
  },
  Customers: {
    columns: ['CustomerID', 'CustomerName', 'Email', 'City', 'Region', 'SalesRepID'],
    values: [
      [101, 'Acme Corp', 'contact@acme.com', 'Mumbai', 'West', 4],
      [102, 'Stark Industries', 'info@stark.com', 'Pune', 'West', 4],
      [103, 'Wayne Enterprises', 'bruce@wayne.com', 'Delhi', 'North', 7]
    ]
  },
  Orders: {
    columns: ['OrderID', 'CustomerID', 'OrderDate', 'Amount', 'PartnerID', 'RestaurantID'],
    values: [
      [1001, 101, '2025-01-10', 85000.00, 50, 10],
      [1002, 101, '2025-01-15', 2400.00, 50, 10],
      [1003, 102, '2025-02-01', 15000.00, 51, 11]
    ]
  },
  Products: {
    columns: ['ProductID', 'ProductName', 'CategoryID', 'Price', 'Stock', 'Status', 'SupplierID'],
    values: [
      [501, 'ThinkPad Laptop', 10, 85000.00, 25, 'Active', 1001],
      [502, 'Ergonomic Chair', 30, 15000.00, 10, 'Active', 1002],
      [503, 'Wireless Mouse', 10, 1200.00, 150, 'Active', 1001]
    ]
  },
  Categories: {
    columns: ['CategoryID', 'CategoryName'],
    values: [
      [10, 'Electronics'],
      [20, 'Office Supplies'],
      [30, 'Furniture']
    ]
  },
  Projects: {
    columns: ['ProjectID', 'ProjectName', 'Budget', 'Status', 'DeptID'],
    values: [
      [301, 'Project Alpha', 250000.00, 'Active', 1],
      [302, 'Project Beta', 120000.00, 'Active', 2],
      [303, 'Project Gamma', 80000.00, 'Planning', 1]
    ]
  },
  Employee_Projects: {
    columns: ['EmployeeID', 'ProjectID', 'AssignedDate'],
    values: [
      [1, 301, '2024-12-01'],
      [2, 301, '2025-01-10'],
      [4, 302, '2025-02-01']
    ]
  },
  Attendance: {
    columns: ['AttendanceID', 'EmployeeID', 'Status', 'AttendanceDate'],
    values: [
      [1, 1, 'Present', '2026-06-01'],
      [2, 2, 'Present', '2026-06-01'],
      [3, 3, 'Present', '2026-06-01']
    ]
  },
  Suppliers: {
    columns: ['SupplierID', 'SupplierName', 'DeliveryDays'],
    values: [
      [1001, 'TechDistributors Inc', 3],
      [1002, 'ComfortFurniture Co', 7],
      [1003, 'SoftwareStore Ltd', 1]
    ]
  }
};

function renderPlaygroundSchema() {
  const list = document.getElementById('playground-schema-list');
  if (!list) return;
  list.innerHTML = '';
  
  Object.keys(schemaMeta).forEach(tblName => {
    const card = document.createElement('div');
    card.className = 'schema-ref-card';
    card.id = `schema-card-${tblName}`;
    
    let columnsHtml = '';
    schemaMeta[tblName].forEach(col => {
      columnsHtml += `
        <div class="col-def">
          <span>${col.key ? '<i class="fa-solid fa-key text-warning"></i> ' : ''}${col.name}</span>
          <span class="col-type">${col.type}</span>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="schema-ref-header" onclick="toggleSchemaCard('${tblName}')">
        <span><i class="fa-solid fa-table"></i> ${tblName}</span>
        <i class="fa-solid fa-chevron-down"></i>
      </div>
      <div class="schema-ref-columns">
        ${columnsHtml}
        <div class="schema-card-actions" style="margin-top: 8px; display: flex; flex-direction: column; gap: 5px;">
          <button class="btn btn-secondary btn-sm btn-block" onclick="loadSqlTemplate('${tblName}')">
            <i class="fa-solid fa-code"></i> Select Query Template
          </button>
          <button class="btn btn-secondary btn-sm btn-block" onclick="previewTableRecords('${tblName}')">
            <i class="fa-solid fa-table"></i> Preview Sample Data
          </button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function toggleSchemaCard(tblName) {
  const card = document.getElementById('schema-card-' + tblName);
  if (card) card.classList.toggle('open');
}

function loadSqlTemplate(tblName) {
  const editor = document.getElementById('sql-query-editor');
  editor.value = `SELECT * FROM ${tblName} LIMIT 10;`;
  editor.focus();
  showToast(`Loaded SELECT template for table: ${tblName}`, 'info');
}

window.previewTableRecords = function(tblName) {
  const editor = document.getElementById('sql-query-editor');
  
  if (state.db) {
    editor.value = `SELECT * FROM ${tblName};`;
    runSandboxQuery();
    showToast(`Running SELECT query to preview ${tblName} records`, 'info');
  } else {
    renderOfflineMockPreview(tblName);
  }
};

function renderOfflineMockPreview(tblName) {
  const outputContainer = document.getElementById('query-results-table');
  const statusIndicator = document.getElementById('query-status');
  
  const mock = staticMockData[tblName];
  if (!mock) {
    outputContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation text-danger"></i>
        <p>No preview data available for table ${tblName}.</p>
      </div>
    `;
    return;
  }
  
  statusIndicator.textContent = 'Offline Preview';
  statusIndicator.className = 'status-indicator warning';
  
  let tableHtml = `
    <div style="margin-bottom: 10px; padding: 8px; border-radius: 4px; background: rgba(245, 158, 11, 0.1); border: 1px solid var(--warning); color: var(--warning); font-size: 0.85rem;">
      <i class="fa-solid fa-circle-info"></i> Showing offline mock data preview. SQL engine is loading/offline.
    </div>
    <table class="playground-table">
      <thead>
        <tr>
  `;
  
  mock.columns.forEach(col => {
    tableHtml += `<th>${escapeHTML(col)}</th>`;
  });
  tableHtml += `</tr></thead><tbody>`;
  
  mock.values.forEach(row => {
    tableHtml += `<tr>`;
    row.forEach(val => {
      tableHtml += `<td>${val === null ? '<span class="text-dark">NULL</span>' : escapeHTML(val.toString())}</td>`;
    });
    tableHtml += `</tr>`;
  });
  tableHtml += `</tbody></table>`;
  
  outputContainer.innerHTML = tableHtml;
  showToast(`Loaded offline sample preview for table: ${tblName}`, 'warning');
}

function verifyQueryCorrectness(userQuery, referenceQuery) {
  if (!state.db) return false;
  try {
    const userRes = state.db.exec(userQuery);
    const refRes = state.db.exec(referenceQuery);
    
    if (userRes.length === 0 && refRes.length === 0) return true;
    if (userRes.length === 0 || refRes.length === 0) return false;
    
    const userCols = userRes[0].columns.map(c => c.toLowerCase());
    const refCols = refRes[0].columns.map(c => c.toLowerCase());
    
    // Check columns count
    if (userCols.length !== refCols.length) return false;
    
    const userValues = userRes[0].values;
    const refValues = refRes[0].values;
    
    // Check row count
    if (userValues.length !== refValues.length) return false;
    
    // Compare stringified row values sorted to ignore row order differences
    const stringifyRow = row => row.map(v => v === null ? 'NULL' : v.toString()).join('|');
    const userRowsStr = userValues.map(stringifyRow).sort();
    const refRowsStr = refValues.map(stringifyRow).sort();
    
    for (let i = 0; i < userRowsStr.length; i++) {
      if (userRowsStr[i] !== refRowsStr[i]) return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

function runSandboxQuery() {
  const editor = document.getElementById('sql-query-editor');
  const outputContainer = document.getElementById('query-results-table');
  const statusIndicator = document.getElementById('query-status');
  
  const query = editor.value.trim();
  
  if (!query) {
    outputContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-circle-exclamation text-warning"></i>
        <p>Your query editor is empty. Type in a query to execute.</p>
      </div>
    `;
    return;
  }

  if (!state.db) {
    outputContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation text-danger"></i>
        <p>SQLite engine offline.</p>
      </div>
    `;
    return;
  }

  try {
    statusIndicator.textContent = 'Executing...';
    statusIndicator.className = 'status-indicator info';
    
    const results = state.db.exec(query);
    
    if (results.length === 0) {
      statusIndicator.textContent = 'Success (Empty)';
      statusIndicator.className = 'status-indicator success';
      outputContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-circle-check text-success"></i>
          <p>Query executed successfully, but returned 0 rows.</p>
        </div>
      `;
    } else {
      statusIndicator.textContent = 'Success';
      statusIndicator.className = 'status-indicator success';
      
      const columns = results[0].columns;
      const values = results[0].values;
      
      let tableHtml = `<table class="playground-table"><thead><tr>`;
      columns.forEach(col => {
        tableHtml += `<th>${escapeHTML(col)}</th>`;
      });
      tableHtml += `</tr></thead><tbody>`;
      
      values.forEach(row => {
        tableHtml += `<tr>`;
        row.forEach(val => {
          tableHtml += `<td>${val === null ? '<span class="text-dark">NULL</span>' : escapeHTML(val.toString())}</td>`;
        });
        tableHtml += `</tr>`;
      });
      tableHtml += `</tbody></table>`;
      
      outputContainer.innerHTML = tableHtml;
    }

    // Auto-check solution correctness
    if (state.activeQuestionID) {
      const q = state.questions.find(item => item.id === state.activeQuestionID);
      if (q) {
        const isCorrect = verifyQueryCorrectness(query, q.answer);
        if (isCorrect) {
          if (!state.mastered.includes(state.activeQuestionID)) {
            state.mastered.push(state.activeQuestionID);
            localStorage.setItem('sql_mastered', JSON.stringify(state.mastered));
            
            // Remove from review
            const revIdx = state.review.indexOf(state.activeQuestionID);
            if (revIdx > -1) {
              state.review.splice(revIdx, 1);
              localStorage.setItem('sql_review', JSON.stringify(state.review));
            }
            
            updateProgressUI();
            triggerProgressUpload();
            applyFilters(); // Re-render card checkmarks in Trainer Q&A tab
          }
          
          const solvedBadge = document.getElementById('widget-q-status-badge');
          if (solvedBadge) {
            solvedBadge.classList.remove('hidden');
          }
          showToast(`Correct Answer! Question #${state.activeQuestionID} solved.`, 'success');
        }
      }
    }
  } catch (error) {
    statusIndicator.textContent = 'Error';
    statusIndicator.className = 'status-indicator error';
    
    outputContainer.innerHTML = `
      <div class="empty-state" style="justify-content: flex-start; text-align: left; padding: 1.5rem; border: 1px dashed var(--danger); border-radius: 6px; background-color: rgba(220, 38, 38, 0.05);">
        <h4 style="color: var(--danger); font-size: 0.95rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-circle-xmark"></i> SQL Syntax Error</h4>
        <pre class="code-font" style="font-size: 0.8rem; color: #fca5a5; white-space: pre-wrap; word-break: break-all;">${escapeHTML(error.message)}</pre>
      </div>
    `;
  }
}

// ----------------------------------------------------
// DATABASE SCHEMA VISUALIZATIONS
// ----------------------------------------------------
function initVisualizations() {
  const container = document.getElementById('er-tables-grid');
  container.innerHTML = '';
  
  Object.keys(schemaMeta).forEach(tblName => {
    const card = document.createElement('div');
    card.className = 'er-table-card';
    
    let colsHtml = '';
    schemaMeta[tblName].forEach(col => {
      colsHtml += `
        <div class="er-column">
          <span class="er-column-name">
            ${col.key ? '<i class="fa-solid fa-key"></i>' : '<span style="width: 10px; display:inline-block;"></span>'}
            ${col.name}
          </span>
          <span class="er-column-type">${col.type}</span>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="er-table-header">
        <i class="fa-solid fa-table"></i>
        <span>${tblName}</span>
      </div>
      <div class="er-table-body">
        ${colsHtml}
      </div>
    `;
    container.appendChild(card);
  });
}

// ----------------------------------------------------
// MY ANALYTICS VIEW
// ----------------------------------------------------
function renderAnalytics() {
  const totalCount = state.questions.length || 500;
  const masteredCount = state.mastered.length;
  
  document.getElementById('analytics-mastered').textContent = `${masteredCount} / ${totalCount}`;
  const masteredPct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
  document.getElementById('analytics-mastered-pct').textContent = `${masteredPct}% Complete`;
  document.getElementById('analytics-review').textContent = state.review.length;
  document.getElementById('analytics-bookmarks').textContent = state.bookmarks.length;

  const topics = [
    { name: 'Joins (1-80)', range: [1, 80] },
    { name: 'Subqueries & CTEs (81-160)', range: [81, 160] },
    { name: 'Window Functions (161-260)', range: [161, 260] },
    { name: 'Views & Stored Procedures (261-320)', range: [261, 320] },
    { name: 'Triggers (321-360)', range: [321, 360] },
    { name: 'Indexing & Normalization (361-420)', range: [361, 420] },
    { name: 'Mixed Interview Round (421-505)', range: [421, 505] }
  ];

  const progressList = document.getElementById('analytics-topic-progress');
  progressList.innerHTML = '';

  topics.forEach(topic => {
    const rangeQuestions = state.questions.filter(q => q.id >= topic.range[0] && q.id <= topic.range[1]);
    const rangeCount = rangeQuestions.length;
    const rangeMastered = rangeQuestions.filter(q => state.mastered.includes(q.id)).length;
    const rangePct = rangeCount > 0 ? Math.round((rangeMastered / rangeCount) * 100) : 0;

    const row = document.createElement('div');
    row.className = 'progress-item-bar';
    row.innerHTML = `
      <div class="progress-item-lbls">
        <span>${topic.name}</span>
        <strong>${rangeMastered} / ${rangeCount} (${rangePct}%)</strong>
      </div>
      <div class="progress-bar-wide">
        <div class="progress-bar-fill-violet" style="width: ${rangePct}%;"></div>
      </div>
    `;
    progressList.appendChild(row);
  });

  const bookmarkList = document.getElementById('analytics-bookmarked-list');
  if (state.bookmarks.length === 0) {
    bookmarkList.innerHTML = `<p class="empty-msg">No bookmarks saved yet.</p>`;
    return;
  }

  bookmarkList.innerHTML = '';
  state.bookmarks.forEach(id => {
    const q = state.questions.find(item => item.id === id);
    if (!q) return;

    const row = document.createElement('div');
    row.className = 'bookmarked-item-row';
    row.innerHTML = `
      <span class="bookmark-link-text" onclick="navigateToQuestion(${id})">#${id}: ${escapeHTML(q.question)}</span>
      <button class="card-action-btn bookmarked" onclick="removeBookmarkFromAnalytics(${id})" title="Remove Bookmark">
        <i class="fa-solid fa-bookmark"></i>
      </button>
    `;
    bookmarkList.appendChild(row);
  });
}

function navigateToQuestion(id) {
  const q = state.questions.find(item => item.id === id);
  if (!q) return;

  document.getElementById('search-input').value = '';
  document.getElementById('filter-section').value = 'all';
  document.getElementById('filter-difficulty').value = 'all';
  document.getElementById('filter-status').value = 'all';
  
  applyFilters();

  const index = state.filteredQuestions.findIndex(item => item.id === id);
  if (index === -1) return;

  const page = Math.floor(index / state.pageSize) + 1;
  changePage(page);
  switchTab('trainer-tab');

  setTimeout(() => {
    const card = document.getElementById(`q-card-${id}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!card.classList.contains('open')) {
        toggleCard(id);
      }
      card.style.borderColor = 'var(--color-secondary)';
      card.style.boxShadow = 'var(--shadow-glow-cyan)';
      setTimeout(() => {
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }, 3000);
    }
  }, 300);
}

function removeBookmarkFromAnalytics(id) {
  const idx = state.bookmarks.indexOf(id);
  if (idx > -1) {
    state.bookmarks.splice(idx, 1);
    localStorage.setItem('sql_bookmarks', JSON.stringify(state.bookmarks));
    renderAnalytics();
    updateProgressUI();
    triggerProgressUpload();
    showToast(`Removed Question #${id} from bookmarks.`, 'info');
  }
}

// ----------------------------------------------------
// LANDING PAGE AUTHENTICATION CONTROLS
// ----------------------------------------------------
function initLandingAuthUI() {
  const btnTabLogin = document.getElementById('landing-tab-login');
  const btnTabSignup = document.getElementById('landing-tab-signup');
  const loginView = document.getElementById('landing-login-view');
  const signupView = document.getElementById('landing-signup-view');

  btnTabLogin.addEventListener('click', () => {
    btnTabLogin.classList.add('active');
    btnTabSignup.classList.remove('active');
    loginView.classList.remove('hidden');
    signupView.classList.add('hidden');
  });

  btnTabSignup.addEventListener('click', () => {
    btnTabSignup.classList.add('active');
    btnTabLogin.classList.remove('active');
    signupView.classList.remove('hidden');
    loginView.classList.add('hidden');
  });

  // Login submission
  const loginForm = document.getElementById('landing-login-form');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('l-username').value;
    const password = document.getElementById('l-password').value;
    const errorText = document.getElementById('l-error-msg');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        loginSuccess(data);
      } else {
        errorText.textContent = data.error || 'Authentication failed.';
        errorText.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      errorText.textContent = 'Server communication error.';
      errorText.classList.remove('hidden');
    }
  });

  // Signup submission
  const signupForm = document.getElementById('landing-signup-form');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('s-username').value;
    const password = document.getElementById('s-password').value;
    const confirm = document.getElementById('s-confirm').value;
    const errorText = document.getElementById('s-error-msg');

    if (password !== confirm) {
      errorText.textContent = 'Passwords do not match.';
      errorText.classList.remove('hidden');
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        showToast('Registration successful!', 'success');
        loginSuccess(data);
        triggerProgressUpload(); // Save any local guest progress
      } else {
        errorText.textContent = data.error || 'Registration failed.';
        errorText.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      errorText.textContent = 'Server communication error.';
      errorText.classList.remove('hidden');
    }
  });
}

function loginSuccess(data) {
  state.token = data.token;
  state.username = data.username;
  state.role = data.role;
  
  localStorage.setItem('admin_token', data.token);
  localStorage.setItem('user_name', data.username);
  localStorage.setItem('user_role', data.role);

  if (data.progress) {
    state.bookmarks = data.progress.bookmarks || [];
    state.mastered = data.progress.mastered || [];
    state.review = data.progress.review || [];
    localStorage.setItem('sql_bookmarks', JSON.stringify(state.bookmarks));
    localStorage.setItem('sql_mastered', JSON.stringify(state.mastered));
    localStorage.setItem('sql_review', JSON.stringify(state.review));
  }

  showToast(`Welcome back, ${data.username}! Access granted.`, 'success');
  
  toggleWorkspaceView(true);
  updateAuthView(true);
  syncCloudProgress();
  applyFilters(); // Load questions
  updateProgressUI();
}

// ----------------------------------------------------
// CORE ACCOUNT CENTER AUTH ACTIONS (LOGOUT & MANUAL SYNC)
// ----------------------------------------------------
window.logoutUserAction = function(showMsg = true) {
  state.token = null;
  state.username = null;
  state.role = 'guest';
  state.revealedSolutions = []; // Reset revealed logs
  
  localStorage.removeItem('admin_token');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_role');
  
  // Reset local progress
  state.bookmarks = [];
  state.mastered = [];
  state.review = [];
  localStorage.removeItem('sql_bookmarks');
  localStorage.removeItem('sql_mastered');
  localStorage.removeItem('sql_review');

  toggleWorkspaceView(false);
  updateAuthView(false);
  updateProgressUI();

  if (showMsg) {
    showToast('Logged out. Profile closed.', 'info');
  }
};

function initUserCenterAuthUI() {
  const logoutBtn = document.getElementById('user-logout');
  logoutBtn.addEventListener('click', () => {
    window.logoutUserAction(true);
  });

  document.getElementById('btn-force-sync').addEventListener('click', () => {
    syncCloudProgress();
  });
}

function updateAuthView(isAuthenticated) {
  const profileBox = document.getElementById('user-profile-box');
  const logoutBtn = document.getElementById('user-logout');
  
  const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
  const sidebarUsername = document.getElementById('sidebar-username');
  const sidebarRole = document.getElementById('sidebar-role');

  const profileName = document.getElementById('profile-title-name');
  const profileRole = document.getElementById('profile-role-badge');
  const adminConsole = document.getElementById('admin-only-dashboard');

  if (isAuthenticated && state.username) {
    profileBox.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');

    profileName.textContent = state.username;
    sidebarUsername.textContent = state.username;

    if (state.role === 'admin') {
      profileRole.textContent = 'Admin Mode';
      profileRole.style.color = 'var(--color-primary)';
      sidebarRole.textContent = 'Admin Mode';
      sidebarRole.style.color = 'var(--color-primary)';
      sidebarUserAvatar.style.background = 'linear-gradient(135deg, var(--color-accent), var(--danger))';
      adminConsole.classList.remove('hidden');
      setTimeout(fillAdminDBStats, 500);
    } else {
      profileRole.textContent = 'Student Mode';
      profileRole.style.color = 'var(--color-secondary)';
      sidebarRole.textContent = 'Student Mode';
      sidebarRole.style.color = 'var(--color-secondary)';
      sidebarUserAvatar.style.background = 'linear-gradient(135deg, var(--color-primary), var(--color-accent))';
      adminConsole.classList.add('hidden');
    }
  } else {
    profileBox.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    adminConsole.classList.add('hidden');

    sidebarUsername.textContent = 'Guest User';
    sidebarRole.textContent = 'Student Mode';
    sidebarRole.style.color = 'var(--color-secondary)';
    sidebarUserAvatar.style.background = 'linear-gradient(135deg, #4b5563, #6b7280)';
  }
}

// ----------------------------------------------------
// ADMINISTRATIVE OPERATIONS
// ----------------------------------------------------
function initAdmin() {
  const qForm = document.getElementById('question-admin-form');
  qForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idVal = document.getElementById('form-question-id').value;
    
    const payload = {
      section: document.getElementById('form-section').value,
      difficulty: document.getElementById('form-difficulty').value,
      question: document.getElementById('form-question').value,
      answer: document.getElementById('form-answer').value,
      explanation: document.getElementById('form-explanation').value
    };

    const isEdit = idVal !== '';
    const url = isEdit ? `/api/questions/${idVal}` : '/api/questions';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        showToast(isEdit ? `Question #${idVal} updated!` : 'Question created successfully!', 'success');
        qForm.reset();
        document.getElementById('form-question-id').value = '';
        document.getElementById('form-action-title').textContent = 'Create New SQL Question';
        document.getElementById('btn-cancel-edit').classList.add('hidden');
        fetchQuestions();
      } else {
        showToast(data.error || 'Operation failed', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Error communicating with database.', 'error');
    }
  });

  document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    qForm.reset();
    document.getElementById('form-question-id').value = '';
    document.getElementById('form-action-title').textContent = 'Create New SQL Question';
    document.getElementById('btn-cancel-edit').classList.add('hidden');
    showToast('Edit cancelled.', 'info');
  });

  document.getElementById('btn-export-db').addEventListener('click', () => {
    if (!state.token) return;
    
    fetch('/api/database/export', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions_export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Questions exported.', 'success');
    })
    .catch(err => {
      console.error(err);
      showToast('Export failed.', 'error');
    });
  });

  document.getElementById('btn-import-db').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const questionsData = JSON.parse(event.target.result);
        
        if (!confirm(`Overwriting database with ${questionsData.length} records. Continue?`)) {
          return;
        }

        const response = await fetch('/api/database/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
          },
          body: JSON.stringify({ questionsData })
        });

        const data = await response.json();

        if (response.ok) {
          showToast(data.message, 'success');
          fetchQuestions();
        } else {
          showToast(data.error || 'Import failed', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Invalid JSON file format.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('btn-reset-db').addEventListener('click', async () => {
    if (confirm('RE-SEED DATABASE? This resets all 500 questions and deletes customizations.')) {
      showToast('Running re-seeding script on backend...', 'info');
      try {
        const response = await fetch('/api/database/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
          },
          body: JSON.stringify({ questionsData: state.questions }) 
        });
        
        if (response.ok) {
          showToast('Database reset successful.', 'success');
          fetchQuestions();
        } else {
          showToast('Failed to reset database.', 'error');
        }
      } catch (err) {
        console.error(err);
      }
    }
  });
}

function fillAdminDBStats() {
  const joins = state.questions.filter(q => q.section === 'Joins').length;
  const subqueries = state.questions.filter(q => q.section === 'Subqueries & CTEs').length;
  const window = state.questions.filter(q => q.section === 'Window Functions').length;
  const views = state.questions.filter(q => q.section === 'Views & Stored Procedures').length;
  const triggers = state.questions.filter(q => q.section === 'Triggers').length;

  document.getElementById('admin-count-joins').textContent = joins;
  document.getElementById('admin-count-subqueries').textContent = subqueries;
  document.getElementById('admin-count-window').textContent = window;
  document.getElementById('admin-count-views').textContent = views;
  document.getElementById('admin-count-triggers').textContent = triggers;
}

window.editQuestionAdmin = function(id) {
  const q = state.questions.find(item => item.id === id);
  if (!q) return;

  document.getElementById('form-question-id').value = q.id;
  document.getElementById('form-section').value = q.section;
  document.getElementById('form-difficulty').value = q.difficulty;
  document.getElementById('form-question').value = q.question;
  document.getElementById('form-answer').value = q.answer;
  document.getElementById('form-explanation').value = q.explanation || '';

  document.getElementById('form-action-title').textContent = `Edit SQL Question #${q.id}`;
  document.getElementById('btn-cancel-edit').classList.remove('hidden');
  
  switchTab('admin-tab');
  document.getElementById('admin-tab').scrollTo({ top: 0, behavior: 'smooth' });
  showToast(`Question #${q.id} loaded.`, 'info');
};

window.deleteQuestionAdmin = async function(id) {
  if (!confirm(`Permanently delete Question #${id}?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/questions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      showToast(`Question #${id} deleted.`, 'success');
      fetchQuestions();
    } else {
      showToast(data.error || 'Delete failed', 'error');
    }
  } catch (error) {
    console.error(error);
    showToast('Server error.', 'error');
  }
};

window.copyAnswerText = function(id) {
  const codeEl = document.getElementById(`code-content-${id}`);
  if (!codeEl) return;
  
  navigator.clipboard.writeText(codeEl.textContent)
    .then(() => {
      showToast(`SQL query for Question #${id} copied!`, 'success');
    })
    .catch(() => {
      showToast('Failed to copy.', 'error');
    });
};

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// INTERVIEW THEORY GUIDE - ACCORDION CONTROLLER & DATA
// ==========================================================================

const theoryData = [
  {
    category: "General SQL",
    question: "What is SQL, and why is it essential?",
    answer: "SQL (Structured Query Language) is the standard domain-specific language used for managing, querying, and manipulating relational databases. It allows users to perform CRUD operations (Create, Read, Update, Delete) on data. SQL is essential because it provides a standardized, declarative interface to interact with databases, ensuring highly optimized data retrieval, storage, and transactional safety."
  },
  {
    category: "General SQL",
    question: "Differentiate between SQL and NoSQL databases.",
    answer: "**SQL Databases**:\n- Relational structure storing data in structured tables (rows and columns).\n- Employs strict, predefined schemas.\n- Scales vertically (increasing server hardware capacity).\n- Enforces ACID properties to guarantee transactional reliability.\n- Best suited for complex query relationships.\n\n**NoSQL Databases**:\n- Non-relational structure utilizing documents (JSON), key-value pairs, graphs, or columns.\n- Employs dynamic, flexible schemas.\n- Scales horizontally (adding more servers/nodes).\n- Emphasizes BASE properties (Eventually Consistent).\n- Best suited for unstructured or semi-structured high-throughput data."
  },
  {
    category: "General SQL",
    question: "What is the difference between DBMS and RDBMS?",
    answer: "- **DBMS (Database Management System)**: A software package that stores data in files. It does not enforce relationships between records programmatically, does not prevent duplicates systematically, and generally supports single users with basic transactional safety.\n- **RDBMS (Relational Database Management System)**: A more advanced DBMS that organizes data in tabular forms (tables containing columns and rows) and programmatically enforces relationships through Primary and Foreign Keys. It supports concurrent users, data integrity constraints, and strict transactional consistency (ACID)."
  },
  {
    category: "General SQL",
    question: "What is a database table?",
    answer: "A table is a database object containing related records structured in a format of vertical columns (fields/attributes) and horizontal rows (records/tuples)."
  },
  {
    category: "General SQL",
    question: "What is a row and a column in SQL?",
    answer: "- **Row (Record/Tuple)**: Represents a single, complete occurrence or instance of an entity in a database table (e.g. details of employee #102).\n- **Column (Field/Attribute)**: Represents a specific property or parameter associated with the entity (e.g. EmployeeName, Salary, DateOfBirth)."
  },
  {
    category: "General SQL",
    question: "What are data types in SQL and what are some common examples?",
    answer: "Data types define what kind of values a specific column can hold. Examples include:\n- `INTEGER` / `INT`: Whole numbers.\n- `VARCHAR(N)`: Variable-length character string up to length N.\n- `CHAR(N)`: Fixed-length character string padded with spaces to length N.\n- `DATE` / `DATETIME`: Dates and timestamps.\n- `FLOAT` / `DECIMAL(P,S)`: Fractional/decimal numbers with defined precision and scale."
  },
  {
    category: "General SQL",
    question: "What is the difference between VARCHAR and CHAR data types?",
    answer: "- `CHAR(N)` represents a **fixed-length** character string. If a value shorter than N is stored, it is automatically padded with trailing spaces. It offers faster read/write speeds because record offsets are constant. It is recommended for static size inputs (e.g. state abbreviations 'NY', country codes 'USA').\n- `VARCHAR(N)` represents a **variable-length** character string. It dynamically shrinks to consume only the space of the actual characters stored (plus 1-2 bytes for length prefix). It is space-efficient but slightly slower."
  },
  {
    category: "General SQL",
    question: "What is the difference between INT and FLOAT data types?",
    answer: "- `INT` stores positive or negative whole numbers without any decimal parts (integers). Ideal for counters, IDs, and discrete variables.\n- `FLOAT` stores floating-point numbers containing fractional/decimal components. It uses approximate binary representation, ideal for continuous measurements and scientific calculations."
  },
  {
    category: "General SQL",
    question: "What is the DATE data type?",
    answer: "The `DATE` data type stores calendar dates, usually in the standard format `YYYY-MM-DD`. RDBMS engines allow date calculations, intervals, and extraction of individual components (year, month, day) from columns of this type."
  },
  {
    category: "General SQL",
    question: "What is the difference between NULL and 0?",
    answer: "- `NULL` represents the **complete absence of a value** or an unknown, missing data state. It is a placeholder, not a value.\n- `0` is a **specific numerical value** (zero). Operations involving `NULL` result in `NULL` (e.g., `5 + NULL = NULL`), whereas operations involving `0` behave mathematically."
  },
  {
    category: "General SQL",
    question: "What is database metadata?",
    answer: "Metadata is **data about data**. It describes the configuration, structures, table descriptions, schemas, indexes, and constraint properties of the database itself, typically exposed through tables in the `INFORMATION_SCHEMA` catalog."
  },
  {
    category: "General SQL",
    question: "What are the different types of SQL commands?",
    answer: "SQL commands are categorized into four core groups:\n- **DDL (Data Definition Language)**: Defines and alters structures (e.g., `CREATE`, `ALTER`, `DROP`, `TRUNCATE`).\n- **DML (Data Manipulation Language)**: Performs query operations on data (e.g., `SELECT`, `INSERT`, `UPDATE`, `DELETE`).\n- **DCL (Data Control Language)**: Controls permissions and access controls (e.g., `GRANT`, `REVOKE`).\n- **TCL (Transaction Control Language)**: Manages transactional workflows (e.g., `COMMIT`, `ROLLBACK`, `SAVEPOINT`)."
  },
  {
    category: "General SQL",
    question: "What is case sensitivity in SQL?",
    answer: "Standard SQL commands and keywords (e.g. `SELECT`, `FROM`) are **case-insensitive**. However, case sensitivity of table/column names depends heavily on the OS and DBMS (MySQL is case-sensitive on Linux, SQLite is case-insensitive). String literal comparisons (e.g. `WHERE name = 'Alice'`) are case-sensitive by default under many configurations unless case-insensitive collations are explicitly used."
  },
  {
    category: "General SQL",
    question: "What is the difference between SQL and MySQL?",
    answer: "- **SQL (Structured Query Language)**: The standardized, universal language used to define and query relational databases.\n- **MySQL**: A specific, commercial open-source Relational Database Management System (RDBMS) software application that compiles and runs SQL queries."
  },
  {
    category: "General SQL",
    question: "What is the purpose of the SQL COUNT() function?",
    answer: "The `COUNT()` aggregate function calculates and returns the number of rows matching the query's filter criteria. When run as `COUNT(column_name)`, it counts only non-null values. `COUNT(*)` counts all rows in the group, including nulls."
  },
  {
    category: "Relational Concepts",
    question: "What is a primary key, and why is it important?",
    answer: "A **Primary Key** is a column or set of columns that uniquely identifies each record in a table. It cannot contain duplicate values and strictly cannot contain `NULL` values. It enforces entity integrity, speeds up record searches, and forms the target reference for establishing relationships via Foreign Keys."
  },
  {
    category: "Relational Concepts",
    question: "What is a foreign key, and how does it relate to a primary key?",
    answer: "A **Foreign Key** is a column (or set of columns) in one table that references the Primary Key of another table. It establishes a link between tables and enforces referential integrity by preventing invalid inserts that do not match primary records, and blocking orphaned records."
  },
  {
    category: "Relational Concepts",
    question: "Define database normalization and its benefits.",
    answer: "Normalization is the systematic process of structuring database schemas to minimize data redundancy and prevent data anomalies (Insert, Update, Delete anomalies). It involves organizing fields and tables to ensure dependencies are logical. Key benefits include decreased storage requirements, improved data integrity, and easier database schema maintenance."
  },
  {
    category: "Relational Concepts",
    question: "Explain the types of normalization (1NF, 2NF, 3NF).",
    answer: "- **First Normal Form (1NF)**: Every table cell must contain atomic (indivisible) values, and there must be no repeating groups or multi-valued columns.\n- **Second Normal Form (2NF)**: Must be in 1NF, and all non-key columns must depend entirely on the primary key (no partial dependencies on composite keys).\n- **Third Normal Form (3NF)**: Must be in 2NF, and no non-key column can depend transitively on another non-key column (no transitive dependencies)."
  },
  {
    category: "Relational Concepts",
    question: "Explain denormalization and when it might be useful.",
    answer: "Denormalization is the intentional introduction of data redundancy and duplicated columns into a database schema. It is used in read-heavy applications (OLAP systems or data warehouses) to eliminate complex, performance-heavy multi-table JOINs, speeding up data retrieval queries at the cost of additional write overhead and storage."
  },
  {
    category: "Relational Concepts",
    question: "Describe the differences between candidate key, primary key, and super key.",
    answer: "- **Super Key**: A column or combination of columns that uniquely identifies a row in a table (may contain extra columns).\n- **Candidate Key**: A minimal super key, meaning it has no redundant columns. Any candidate key can uniquely identify rows.\n- **Primary Key**: The specific candidate key chosen by the database designer to act as the primary, unique identifier for the table."
  },
  {
    category: "Relational Concepts",
    question: "What are database constraints and what are their types?",
    answer: "Constraints are rules applied to columns in a table to restrict the types of data that can be inserted, maintaining data accuracy and reliability. Common types are:\n- `NOT NULL`: Prevents NULL inserts.\n- `UNIQUE`: Rejects duplicate values.\n- `PRIMARY KEY`: Unique identifier constraint (UNIQUE + NOT NULL).\n- `FOREIGN KEY`: Establishes reference integrity.\n- `CHECK`: Validates if a boolean condition is satisfied.\n- `DEFAULT`: Inserts a default value if none is specified."
  },
  {
    category: "Relational Concepts",
    question: "What is a composite key?",
    answer: "A composite key is a primary key composed of **two or more columns**. It is used when a single column alone is insufficient to uniquely identify a record (e.g. combining `StudentID` and `CourseID` to identify a unique course enrollment)."
  },
  {
    category: "Relational Concepts",
    question: "Can NULL be part of a PRIMARY KEY?",
    answer: "**No**. A primary key strictly prohibits `NULL` values. This ensures that every row in the table can always be uniquely identified, maintaining entity integrity."
  },
  {
    category: "Relational Concepts",
    question: "Can NULL be part of a UNIQUE key?",
    answer: "**Yes**. A unique constraint allows storing `NULL` values because `NULL` represents an unknown state, and database engines do not treat one `NULL` as equal to another `NULL`. However, some databases only allow one `NULL` per column, while others allow multiple."
  },
  {
    category: "Relational Concepts",
    question: "What is an alternate key?",
    answer: "An alternate key is any candidate key in a table that was **not chosen** as the primary key. It can uniquely identify records but acts as a secondary key."
  },
  {
    category: "Relational Concepts",
    question: "What is a surrogate key?",
    answer: "A surrogate key is an artificial, system-generated primary key (e.g., an auto-incrementing integer ID) with no real-world business meaning. It is used to simplify joins and guarantee uniqueness."
  },
  {
    category: "Relational Concepts",
    question: "What is a natural key?",
    answer: "A natural key is a primary key that consists of real-world attributes possessing an inherent, unique business meaning (e.g., email address, Social Security Number)."
  },
  {
    category: "Relational Concepts",
    question: "What is data integrity and what are its types?",
    answer: "Data integrity represents the accuracy and consistency of data in a relational database. Types include:\n- **Entity Integrity**: Enforced by Primary Keys (no duplicates/nulls).\n- **Referential Integrity**: Enforced by Foreign Keys (links must remain valid).\n- **Domain Integrity**: Enforced by data types, defaults, and CHECK constraints (valid ranges)."
  },
  {
    category: "Relational Concepts",
    question: "Can a table exist without a primary key?",
    answer: "**Yes**, a table can be created without a primary key. However, this violates relational theory best practices, slows down queries, and makes it difficult to uniquely target rows for updates or deletions."
  },
  {
    category: "Relational Concepts",
    question: "Explain the concept of a database view.",
    answer: "A view is a virtual table that is created from a SELECT query. It does not store physical records on disk. Instead, it dynamically queries the underlying base tables in real time whenever it is referenced, serving as a layer of security, abstraction, or query simplification."
  },
  {
    category: "Relational Concepts",
    question: "What is the difference between a table and a view?",
    answer: "- **Table**: A physical structure containing actual records stored on disk, consuming storage space.\n- **View**: A virtual structure representing a saved SELECT query definition; it does not consume storage space for records."
  },
  {
    category: "Relational Concepts",
    question: "What is a database schema?",
    answer: "A schema is the blueprint or structural definition of the database. It outlines tables, views, columns, relationships, constraints, indexes, and primary keys."
  },
  {
    category: "Joins & Unions",
    question: "Describe the differences between INNER JOIN, LEFT JOIN, and RIGHT JOIN.",
    answer: "- **INNER JOIN**: Returns only rows that have matching values in both tables.\n- **LEFT JOIN**: Returns all rows from the left table, and the matched rows from the right table. Unmatched elements on the right are represented as `NULL` values.\n- **RIGHT JOIN**: Returns all rows from the right table, and the matched rows from the left table. Unmatched elements on the left are represented as `NULL` values."
  },
  {
    category: "Joins & Unions",
    question: "What is a self-join, and when would you use it?",
    answer: "A self-join is a join operation where a table is joined with itself. It is useful for querying hierarchical data inside a single table (e.g. employee-manager hierarchies, where the manager's ID is stored as a foreign key referencing the employee ID in the same table)."
  },
  {
    category: "Joins & Unions",
    question: "Explain the difference between UNION and UNION ALL.",
    answer: "- **UNION**: Merges the result sets of multiple queries into a single output, and **removes duplicate rows** through a distinct sorting pass (which is slower).\n- **UNION ALL**: Merges the result sets but **retains duplicate rows** directly without sorting, making it significantly faster."
  },
  {
    category: "Joins & Unions",
    question: "Explain the difference between the UNION and JOIN operations.",
    answer: "- **JOIN** merges fields horizontally from different tables based on matching key values.\n- **UNION** combines query outputs vertically, stacking rows on top of each other. The queries must have the same column count and matching data types."
  },
  {
    category: "Joins & Unions",
    question: "What is the difference between a left outer join and a right outer join?",
    answer: "The difference lies solely in table ordering. A `LEFT JOIN` preserves all rows of the table written on the left side of the keyword, whereas a `RIGHT JOIN` preserves all rows of the table written on the right side. `A LEFT JOIN B` is equivalent to `B RIGHT JOIN A`."
  },
  {
    category: "Joins & Unions",
    question: "What is a natural join, and when would you use it?",
    answer: "A natural join implicitly joins two tables based on **all columns that share identical names** in both tables. It does not require an `ON` clause. It is generally avoided in production since changing column names in one table will silently break the query logic."
  },
  {
    category: "Queries & Logic",
    question: "What is a subquery, and how is it different from a JOIN?",
    answer: "- **Subquery**: A nested query written inside an outer query's SELECT, WHERE, or FROM clauses. It returns intermediate data.\n- **JOIN**: A relational operation that combines tables horizontally. JOINs are preferred over subqueries by modern SQL optimizers because they can construct more efficient query execution paths."
  },
  {
    category: "Queries & Logic",
    question: "What is the difference between GROUP BY and HAVING clauses?",
    answer: "- **GROUP BY** aggregates records into summary rows based on identical values in specified columns.\n- **HAVING** is a filter applied *after* aggregation, evaluating aggregate functions (e.g. `HAVING SUM(salary) > 5000`). `WHERE` is used to filter individual rows *before* grouping is executed."
  },
  {
    category: "Queries & Logic",
    question: "What is a correlated subquery, and when would you use one?",
    answer: "A correlated subquery is a nested query that references one or more columns from the outer query. It executes repeatedly—once for every row processed by the outer query. It is useful for row-by-row comparisons (e.g. finding employees earning more than their department's average salary)."
  },
  {
    category: "Queries & Logic",
    question: "How does the EXISTS clause work, and when would you use it?",
    answer: "The `EXISTS` clause evaluates to `TRUE` if a subquery returns at least one row, and `FALSE` if it returns empty. It short-circuits as soon as a match is found. It is highly efficient for checking matching records without retrieving them."
  },
  {
    category: "Queries & Logic",
    question: "What is the purpose of the SQL CASE statement?",
    answer: "The `CASE` statement implements conditional logic (if-then-else) inside SQL queries. It returns specific values based on whether defined criteria are met. It can be used in SELECT, ORDER BY, and aggregate statements."
  },
  {
    category: "Queries & Logic",
    question: "What are CTEs (Common Table Expressions), and how are they used?",
    answer: "A Common Table Expression (CTE) is a temporary result set defined using the `WITH` keyword. It simplifies queries by replacing complex nested subqueries with modular, readable blocks. CTEs can also be recursive, which is ideal for traversing tree hierarchies."
  },
  {
    category: "Queries & Logic",
    question: "How do you perform data paging in SQL?",
    answer: "Paging is done using limits and offsets:\n- MySQL / SQLite / PostgreSQL: Use `LIMIT N OFFSET M` to fetch N rows starting after row M.\n- SQL Server: Use `OFFSET M ROWS FETCH NEXT N ROWS ONLY`."
  },
  {
    category: "Queries & Logic",
    question: "Explain the concept of SQL cursors.",
    answer: "A cursor is a database object used to iterate through a SELECT query's result set **one row at a time**. It is used in stored procedures for row-by-row operations. Cursors are slow and resource-heavy compared to standard set-based queries."
  },
  {
    category: "Transactions & Performance",
    question: "Explain ACID properties in the context of SQL databases.",
    answer: "ACID properties guarantee database transaction reliability:\n- **Atomicity**: The transaction is an indivisible unit; either all operations succeed or all are rolled back.\n- **Consistency**: The transaction transitions the database between valid states, maintaining constraints.\n- **Isolation**: Concurrent transactions execute independently without interference.\n- **Durability**: Committed changes survive crashes and hardware failures."
  },
  {
    category: "Transactions & Performance",
    question: "Explain the concept of database transactions.",
    answer: "A transaction is a logical unit of database processing containing one or more SQL statements. It ensures data consistency by committing all changes together on success (`COMMIT`) or undoing them on failure (`ROLLBACK`)."
  },
  {
    category: "Transactions & Performance",
    question: "What is COMMIT, ROLLBACK, and SAVEPOINT?",
    answer: "- **COMMIT**: Permanently commits transaction modifications to disk.\n- **ROLLBACK**: Restores the database to its state before the transaction began.\n- **SAVEPOINT**: Sets a marker inside the transaction, enabling partial rollback to that point if an error occurs."
  },
  {
    category: "Transactions & Performance",
    question: "What is auto-commit in databases?",
    answer: "Auto-commit is a setting where every individual SQL command is immediately treated as a single transaction and written permanently to disk without requiring a manual `COMMIT` command."
  },
  {
    category: "Transactions & Performance",
    question: "How do you optimize a slow-performing SQL query?",
    answer: "Optimization methods include:\n- Generating and inspecting query execution plans (`EXPLAIN`).\n- Creating non-clustered indexes on columns used in WHERE, JOIN, and ORDER BY.\n- Eliminating `SELECT *` in favor of specific column listings.\n- Avoiding functions on indexed columns in filter conditions.\n- Replacing nested subqueries with equivalent JOINs."
  },
  {
    category: "Transactions & Performance",
    question: "What is an index, and why is it important?",
    answer: "An index is a database search structure (typically a B-Tree) created on table columns to speed up query retrieval. It allows the database engine to find records quickly without scanning the entire table (table scans)."
  },
  {
    category: "Transactions & Performance",
    question: "What is a clustered index and a non-clustered index?",
    answer: "- **Clustered Index**: Sorting index that dictates the physical storage order of data rows on disk. A table can have only one clustered index.\n- **Non-Clustered Index**: A separate index structure containing key values and pointers (Row IDs) back to the table's physical rows. A table can have multiple non-clustered indexes."
  },
  {
    category: "Transactions & Performance",
    question: "How can you prevent and handle deadlocks in a database?",
    answer: "Deadlocks occur when transactions lock resources needed by each other, causing a freeze. Prevention:\n- Access resources in the exact same logical order in all application code.\n- Keep transactions as short and simple as possible.\n- Use appropriate lock isolation levels.\n- Implement timeouts and automatic retry loops."
  },
  {
    category: "Transactions & Performance",
    question: "What is the difference between DELETE, TRUNCATE, and DROP?",
    answer: "- **DELETE**: DML command that deletes rows based on a `WHERE` condition. It logs each deletion (supporting rollback) and triggers delete triggers.\n- **TRUNCATE**: DDL command that removes all rows from a table. It deallocates table data pages, bypassing individual logs and triggers (making it extremely fast).\n- **DROP**: DDL command that completely deletes the table structure, data, and constraints from the database."
  },
  {
    category: "Transactions & Performance",
    question: "Is TRUNCATE faster than DELETE? Why?",
    answer: "**Yes**. `TRUNCATE` is a DDL operation that directly deallocates data pages of the table rather than deleting rows one by one. It does not write detailed row-by-row transaction logs and does not fire delete triggers."
  },
  {
    category: "Transactions & Performance",
    question: "Can we rollback a TRUNCATE command?",
    answer: "In standard SQL and databases like SQL Server or PostgreSQL, `TRUNCATE` **can be rolled back** if it is executed within an active transaction block. However, in MySQL, `TRUNCATE` triggers an implicit commit (DDL operation) and **cannot be rolled back**."
  },
  {
    category: "Security & Tricky Scenarios",
    question: "How does the SQL injection attack work, and how can you prevent it?",
    answer: "SQL Injection (SQLi) is an exploit where malicious SQL syntax is inserted into input fields and concatenated directly into dynamic SQL queries, altering execution paths. Prevention:\n- Use **Parameterized Queries** (Prepared Statements).\n- Implement input validation and HTML sanitization.\n- Restrict database permissions using least privilege principles."
  },
  {
    category: "Security & Tricky Scenarios",
    question: "What is a database trigger, and how is it used?",
    answer: "A trigger is a database code block that automatically runs when an INSERT, UPDATE, or DELETE operation occurs. It is used for auditing changes, enforcing business rules, and keeping tables in sync."
  },
  {
    category: "Security & Tricky Scenarios",
    question: "What happens if you insert a duplicate PRIMARY KEY?",
    answer: "The database system rejects the query and throws a **Constraint Violation Error** (specifically, a unique key violation), ensuring data integrity."
  },
  {
    category: "Security & Tricky Scenarios",
    question: "Can NULL be compared using the equals (=) operator?",
    answer: "**No**. Comparing `NULL` using `= NULL` or `<> NULL` always evaluates to `UNKNOWN` (neither True nor False). To check if a column or value is null, you must use the special operators `IS NULL` and `IS NOT NULL`."
  },
  {
    category: "Security & Tricky Scenarios",
    question: "Can we use a WHERE clause with a TRUNCATE statement?",
    answer: "**No**. `TRUNCATE` is a DDL statement that operates on the entire table structure to deallocate all data pages at once. It does not support filters, so a `WHERE` clause is syntax-invalid."
  },
  {
    category: "Security & Tricky Scenarios",
    question: "What happens when a foreign key constraint is violated?",
    answer: "If you try to insert a child row with a non-existent parent key, or delete a parent row that has matching children, the database system will reject the operation and throw a **Foreign Key Constraint Violation Error**, blocking the change unless cascade options (`ON DELETE CASCADE`) are set."
  }
];

function initTheoryTab() {
  const searchInput = document.getElementById('theory-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderTheoryList(e.target.value);
    });
  }
}

function renderTheoryList(query = '') {
  const container = document.getElementById('theory-questions-container');
  if (!container) return;
  
  const cleanQuery = query.toLowerCase().trim();
  
  // Filter questions
  const filtered = theoryData.filter(item => {
    return item.category.toLowerCase().includes(cleanQuery) ||
           item.question.toLowerCase().includes(cleanQuery) ||
           item.answer.toLowerCase().includes(cleanQuery);
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-results" style="text-align: center; padding: 3rem; color: var(--text-muted);">
        <i class="fa-solid fa-face-meh" style="font-size: 3rem; margin-bottom: 1rem; color: var(--color-primary); display: block; margin-left: auto; margin-right: auto;"></i>
        <p>No theory questions found matching "${escapeHTML(query)}"</p>
      </div>
    `;
    return;
  }
  
  // Group by category
  const groups = {};
  filtered.forEach(item => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
  });
  
  let html = '';
  
  // Render groups
  for (const [category, items] of Object.entries(groups)) {
    html += `
      <div class="theory-category-section" style="margin-bottom: 1.5rem;">
        <h3 class="theory-category-title" style="font-size: 1.1rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-light); padding-bottom: 0.4rem;">
          <i class="fa-solid fa-folder-open" style="font-size: 0.95rem;"></i> ${category}
          <span style="font-size: 0.75rem; font-weight: 500; background: var(--bg-card); color: var(--text-muted); padding: 2px 8px; border-radius: 12px; border: 1px solid var(--border-light);">${items.length}</span>
        </h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
    `;
    
    items.forEach(item => {
      const globalIndex = theoryData.indexOf(item);
      const formattedAnswer = formatAnswerText(item.answer);
      
      html += `
        <div class="theory-card" id="theory-card-${globalIndex}">
          <div class="theory-card-header" onclick="toggleTheoryCard(${globalIndex})">
            <span class="theory-card-question">
              ${escapeHTML(item.question)}
            </span>
            <i class="fa-solid fa-chevron-down theory-card-chevron"></i>
          </div>
          <div class="theory-card-body" id="theory-card-body-${globalIndex}">
            <div class="theory-card-content">
              ${formattedAnswer}
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

window.toggleTheoryCard = function(index) {
  const card = document.getElementById(`theory-card-${index}`);
  const body = document.getElementById(`theory-card-body-${index}`);
  const chevron = card.querySelector('.theory-card-chevron');
  
  if (!card || !body || !chevron) return;
  
  const isExpanded = card.classList.contains('expanded');
  
  if (isExpanded) {
    card.classList.remove('expanded');
    body.style.maxHeight = '0';
    body.style.opacity = '0';
    chevron.style.transform = 'rotate(0deg)';
    chevron.style.color = 'var(--text-muted)';
  } else {
    card.classList.add('expanded');
    // Compute actual height of content
    const contentHeight = body.firstElementChild.offsetHeight;
    body.style.maxHeight = `${contentHeight + 20}px`; // Add safety padding
    body.style.opacity = '1';
    chevron.style.transform = 'rotate(180deg)';
    chevron.style.color = 'var(--color-primary)';
  }
};

function formatAnswerText(text) {
  if (!text) return '';
  let escaped = escapeHTML(text);
  
  // Replace bullet points starting with - or * at start of line or after newline
  escaped = escaped.replace(/(?:^|\r?\n)\s*[-*]\s+(.+)/g, (match, p1) => {
    return `\n<li style="margin-left: 1.5rem; list-style-type: disc; margin-top: 0.25rem;">${p1}</li>`;
  });
  
  // Replace bold formatting **text** with <strong>text</strong>
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace inline code formatting `code` with styled <code>code</code>
  escaped = escaped.replace(/`(.*?)`/g, '<code class="theory-inline-code">$1</code>');
  
  const lines = escaped.split('\n');
  let insideList = false;
  let result = '';
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('<li')) {
      if (!insideList) {
        result += '<ul style="margin-bottom: 0.8rem; margin-top: 0.4rem;">';
        insideList = true;
      }
      result += line;
    } else {
      if (insideList) {
        result += '</ul>';
        insideList = false;
      }
      if (trimmed.length > 0) {
        // If it looks like a query or sql command block, format as code
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('CREATE') || trimmed.startsWith('INSERT') || trimmed.startsWith('UPDATE') || trimmed.startsWith('DELETE') || trimmed.startsWith('UNION') || trimmed.startsWith('WITH')) {
          result += `<pre class="theory-code-block">${trimmed}</pre>`;
        } else {
          result += `<p style="margin-bottom: 0.8rem;">${line}</p>`;
        }
      }
    }
  });
  
  if (insideList) {
    result += '</ul>';
  }
  
  return result;
}

