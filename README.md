# SQL Interview Trainer (500 Questions Challenge)

An interactive, high-performance web application designed for learning, testing, and mastering SQL interview questions. Featuring an in-browser SQLite WebAssembly database playground, an interactive progress dashboard, and an administrative control suite.

---

## 🚀 Key Core Features

*   **500 SQL Questions Catalog**: Hand-picked interview challenges covering Joins, Subqueries & CTEs, Window Functions, Views & Procedures, Triggers, Normalization, and FAANG Mixed Interview rounds.
*   **In-Browser SQLite Playground**: Powered by `sql.js` (WebAssembly), pre-seeded with 8 relational tables (Employees, Departments, Customers, Orders, Products, etc.) so you can execute queries directly in your browser.
*   **Visual DB Schema Explorer**: Interactive ER Diagram explorer showing column names, keys, data types, and sample data.
*   **Progress Dashboard**: Tracks solved questions, bookmarks, active review lists, and provides detailed analytics with visual progress bars.
*   **Admin Console & CRUD**: Authentication-controlled management dashboard for adding, editing, or deleting questions from the catalog, along with database backups (JSON import/export).
*   **Detailed Session Tracking**: Logs user session login/logout timestamps, active practice time, and problem-solving velocity.

---

## ✨ Advanced Enhancements

### 1. Case-Insensitive Validation Engine
*   **Database-Level Case-Insensitivity**: Table seeding dynamically appends `COLLATE NOCASE` to all text columns (`VARCHAR`, `TEXT`, `CHAR`). String literal comparisons inside user queries (e.g. `WHERE Location = 'mumbai'`) match case-insensitively.
*   **Dynamic Comparison**: Compares output result sets case-insensitively and ignores row order differences, ensuring matching results even if headers or cell values differ in case.

### 2. Cloud Sync & Persistent Accounts
*   **Vercel KV / Upstash Redis**: Migrated local database fallbacks to cloud KV storage for permanent user profile registration.
*   **Local .env.local Loading**: Server dynamically loads local configurations from `.env.local` to facilitate local development with persistent databases.
*   **Diagnostics Warning Banner**: Shows Vercel KV connection health. Displays a warning banner if connection is missing or localEphemeral mode is active.

### 3. Registered Accounts Inspection Modal
*   **Historical Timeline**: Displays detailed user details, active bookmarks, and a historical table of practice sessions (Session Start, End, Duration, Solved Count).

### 4. Spacing, Alignment & Select Inputs
*   **Modern Glassmorphism Theme**: Fully structured grid layout for the admin panel, responsive layouts for tablets and mobile devices, and custom select dropdown inputs with clean SVG arrow icons.

---

## 📊 Database Schema Structure

The in-browser sandbox database is pre-seeded with the following schemas:

*   **Departments**: `DepartmentID (PK)`, `DepartmentName`, `Location`
*   **Employees**: `EmployeeID (PK)`, `EmployeeName`, `first_name`, `last_name`, `DepartmentID (FK)`, `ManagerID`, `Salary`, `Age`, `Title`, `HireDate`, `Status`, `BranchID`
*   **Customers**: `CustomerID (PK)`, `CustomerName`, `Email`, `City`, `Region`, `SalesRepID (FK)`, `status`, `register_date`
*   **Categories**: `CategoryID (PK)`, `CategoryName`
*   **Products**: `ProductID (PK)`, `ProductName`, `CategoryID (FK)`, `Price`, `Stock`, `stock_quantity`, `Status`, `SupplierID`, `VendorID`
*   **Orders**: `OrderID (PK)`, `CustomerID (FK)`, `OrderDate`, `Amount`, `total_amount`, `order_amount`, `PartnerID`, `RestaurantID`
*   **Projects**: `ProjectID (PK)`, `ProjectName`, `Budget`, `Status`, `DeptID`
*   **Employee_Projects**: `EmployeeID (PK, FK)`, `ProjectID (PK, FK)`, `AssignedDate`
*   **Attendance**: `AttendanceID (PK)`, `EmployeeID (FK)`, `Status`, `AttendanceDate`
*   **Suppliers**: `SupplierID (PK)`, `SupplierName`, `DeliveryDays`
*   **Vendors**: `VendorID (PK)`, `VendorName`

---

## 🛠️ Quick Start & Local Setup

### 1. Install Packages
```bash
npm install
```

### 2. Configure Local Database (Optional)
To use persistent storage locally, create a `.env.local` file in the root directory and add your Upstash Redis / Vercel KV credentials:
```env
KV_REST_API_URL="https://your-upstash-instance.upstash.io"
KV_REST_API_TOKEN="your_token_here"
```
*If left unconfigured, the app falls back to Local Ephemeral Mode (using local files for backup).*

### 3. Launch Development Server
To launch with Vercel environment variables injected:
```bash
npx vercel dev --listen 3000 --yes
```
Or start using node directly:
```bash
npm start
```

### 4. Access Platform
Open [http://localhost:3000](http://localhost:3000) in your web browser. 
*   **Admin Passcode**: `sqladmin123` (Use inside the Account Center tab to unlock Admin privileges).
