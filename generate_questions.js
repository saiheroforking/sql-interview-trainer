const fs = require('fs');
const path = require('path');

// Setup base categories and questions
const questions = [];

// Load existing questions to preserve custom-written scenario questions
const existingQuestionsMap = {};
const existingQuestionsPath = path.join(__dirname, 'questions.json');
if (fs.existsSync(existingQuestionsPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(existingQuestionsPath, 'utf8'));
    existing.forEach(q => {
      existingQuestionsMap[q.id] = q;
    });
  } catch (err) {
    console.warn("Could not parse existing questions.json, starting fresh:", err.message);
  }
}

function isPlaceholder(q) {
  if (!q || !q.question) return true;
  const txt = q.question;
  return txt.includes("Solve SQL puzzle for") ||
         txt.includes("scenario #") ||
         txt.startsWith("Find matches for Join scenario") ||
         txt.startsWith("Find items matching Subquery scenario") ||
         txt.startsWith("Compute analytical partition statistics for Window scenario") ||
         txt.startsWith("Validate rules for Trigger scenario");
}

// Helper to add question
function addQ(id, section, question, difficulty, answer, explanation) {
  const existing = existingQuestionsMap[id];
  if (existing && !isPlaceholder(existing)) {
    questions.push(existing);
    return;
  }
  questions.push({
    id,
    section,
    question,
    difficulty,
    answer: answer || `-- SQL Query for Question ${id}\nSELECT * FROM table_name;`,
    explanation: explanation || `Explanation for Question ${id}: This query retrieves the required columns from the respective tables.`
  });
}


// ----------------------------------------------------
// SECTION A: JOINS (1-80)
// ----------------------------------------------------
addQ(1, "Joins", "Display employee names along with their department names.", "Easy",
`SELECT e.EmployeeName, d.DepartmentName 
FROM Employees e 
INNER JOIN Departments d ON e.DepartmentID = d.DepartmentID;`,
"Uses an INNER JOIN to link the Employees and Departments tables based on the common DepartmentID column.");

addQ(2, "Joins", "Show all employees working in the 'IT' department.", "Easy",
`SELECT e.EmployeeName 
FROM Employees e 
INNER JOIN Departments d ON e.DepartmentID = d.DepartmentID 
WHERE d.DepartmentName = 'IT';`,
"Performs an INNER JOIN and applies a WHERE filter to select only employees belonging to the 'IT' department.");

addQ(3, "Joins", "Display employee name, salary, and department location.", "Easy",
`SELECT e.EmployeeName, e.Salary, d.Location 
FROM Employees e 
INNER JOIN Departments d ON e.DepartmentID = d.DepartmentID;`,
"Combines the columns EmployeeName and Salary from the Employees table and Location from the Departments table using an INNER JOIN.");

addQ(4, "Joins", "List all customers along with their orders.", "Easy",
`SELECT c.CustomerName, o.OrderID, o.OrderDate, o.Amount 
FROM Customers c 
INNER JOIN Orders o ON c.CustomerID = o.CustomerID;`,
"Links the Customers table with the Orders table using an INNER JOIN on CustomerID to show order details for each customer.");

addQ(5, "Joins", "Show product names and category names.", "Easy",
`SELECT p.ProductName, c.CategoryName 
FROM Products p 
INNER JOIN Categories c ON p.CategoryID = c.CategoryID;`,
"Retrieves the product details along with their corresponding categories using an INNER JOIN on CategoryID.");

addQ(6, "Joins", "Display student names with enrolled course names.", "Easy",
`SELECT s.StudentName, c.CourseName 
FROM Students s 
INNER JOIN Enrollments e ON s.StudentID = e.StudentID 
INNER JOIN Courses c ON e.CourseID = c.CourseID;`,
"Demonstrates a multi-table JOIN. Resolves the many-to-many relationship between Students and Courses using the Enrollments bridge table.");

addQ(7, "Joins", "Show employees and their manager names using self join.", "Intermediate",
`SELECT e.EmployeeName AS Employee, m.EmployeeName AS Manager 
FROM Employees e 
LEFT JOIN Employees m ON e.ManagerID = m.EmployeeID;`,
"Performs a SELF JOIN on the Employees table. Relates the ManagerID of an employee to the EmployeeID of their manager.");

addQ(8, "Joins", "Display doctor names with hospital names.", "Easy",
`SELECT d.DoctorName, h.HospitalName 
FROM Doctors d 
INNER JOIN Hospitals h ON d.HospitalID = h.HospitalID;`,
"Joins the Doctors and Hospitals tables using HospitalID to fetch doctor-hospital associations.");

addQ(9, "Joins", "Show supplier names with supplied product names.", "Easy",
`SELECT s.SupplierName, p.ProductName 
FROM Suppliers s 
INNER JOIN Products p ON s.SupplierID = p.SupplierID;`,
"Retrieves suppliers and the names of the products they supply using an INNER JOIN on SupplierID.");

addQ(10, "Joins", "Display all orders with customer details.", "Easy",
`SELECT o.OrderID, o.Amount, o.OrderDate, c.CustomerName, c.Email 
FROM Orders o 
INNER JOIN Customers c ON o.CustomerID = c.CustomerID;`,
"Combines order attributes (ID, amount, date) with customer attributes (name, email) by joining on CustomerID.");

addQ(11, "Joins", "Show all employees and their department names, including employees without departments.", "Easy",
`SELECT e.EmployeeName, d.DepartmentName 
FROM Employees e 
LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID;`,
"Uses a LEFT JOIN to ensure all records from the left table (Employees) are returned, even if there is no matching department.");

addQ(12, "Joins", "Find employees who are not assigned to any department.", "Easy",
`SELECT e.EmployeeName 
FROM Employees e 
LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID 
WHERE d.DepartmentID IS NULL;`,
"Uses a LEFT JOIN to find unmatched records where the DepartmentID in the joined table is NULL, identifying employees without a department.");

addQ(13, "Joins", "Show all customers including those who never placed orders.", "Easy",
`SELECT c.CustomerName, o.OrderID 
FROM Customers c 
LEFT JOIN Orders o ON c.CustomerID = o.CustomerID;`,
"Uses a LEFT JOIN starting from Customers. If a customer has no orders, the OrderID will return as NULL, but the customer name will still be listed.");

addQ(14, "Joins", "Find customers without any orders.", "Easy",
`SELECT c.CustomerName, c.Email 
FROM Customers c 
LEFT JOIN Orders o ON c.CustomerID = o.CustomerID 
WHERE o.OrderID IS NULL;`,
"Filters the results of a LEFT JOIN where the OrderID is NULL, which isolates customers who have not placed any orders.");

addQ(15, "Joins", "Display all products including products never sold.", "Easy",
`SELECT p.ProductName, o.OrderID 
FROM Products p 
LEFT JOIN Order_Items oi ON p.ProductID = oi.ProductID 
LEFT JOIN Orders o ON oi.OrderID = o.OrderID;`,
"Uses a LEFT JOIN to include all products, even those that do not appear in the Order_Items bridge table.");

addQ(16, "Joins", "Find students not enrolled in any course.", "Easy",
`SELECT s.StudentName 
FROM Students s 
LEFT JOIN Enrollments e ON s.StudentID = e.StudentID 
WHERE e.EnrollmentID IS NULL;`,
"Identifies students who have no entry in the Enrollments table using a LEFT JOIN and a NULL filter.");

addQ(17, "Joins", "Show all projects including projects without employees.", "Easy",
`SELECT p.ProjectName, ep.EmployeeID 
FROM Projects p 
LEFT JOIN Employee_Projects ep ON p.ProjectID = ep.ProjectID;`,
"Performs a LEFT JOIN on Projects to list all projects, even if no employees are assigned in the Employee_Projects table.");

addQ(18, "Joins", "Find departments having no employees.", "Easy",
`SELECT d.DepartmentName 
FROM Departments d 
LEFT JOIN Employees e ON d.DepartmentID = e.DepartmentID 
WHERE e.EmployeeID IS NULL;`,
"Isolates departments that have zero associated employees by looking for NULL matches from the Employees table.");

addQ(19, "Joins", "Display all vendors including vendors without products.", "Easy",
`SELECT v.VendorName, p.ProductName 
FROM Vendors v 
LEFT JOIN Products p ON v.VendorID = p.VendorID;`,
"Retrieves all vendors and their products, including vendors with no products.");

addQ(20, "Joins", "Find books that have never been borrowed.", "Easy",
`SELECT b.Title 
FROM Books b 
LEFT JOIN Borrowed_Books bb ON b.BookID = bb.BookID 
WHERE bb.BorrowID IS NULL;`,
"Finds books that have zero entries in the borrowing transactions table.");

addQ(21, "Joins", "Display all departments even if no employees exist (using RIGHT JOIN).", "Easy",
`SELECT e.EmployeeName, d.DepartmentName 
FROM Employees e 
RIGHT JOIN Departments d ON e.DepartmentID = d.DepartmentID;`,
"Uses a RIGHT JOIN to guarantee all departments are listed, regardless of whether employees are assigned to them.");

addQ(22, "Joins", "Find departments with zero employees (using RIGHT JOIN / NULL filter).", "Easy",
`SELECT d.DepartmentName 
FROM Employees e 
RIGHT JOIN Departments d ON e.DepartmentID = d.DepartmentID 
WHERE e.EmployeeID IS NULL;`,
"Uses a RIGHT JOIN and filters for rows where the Employee details are NULL to find empty departments.");

addQ(23, "Joins", "Show all categories including categories with no products.", "Easy",
`SELECT p.ProductName, c.CategoryName 
FROM Products p 
RIGHT JOIN Categories c ON p.CategoryID = c.CategoryID;`,
"Lists all categories using a RIGHT JOIN to ensure empty categories are included.");

addQ(24, "Joins", "Display all courses even if no students enrolled.", "Easy",
`SELECT c.CourseName, e.StudentID 
FROM Enrollments e 
RIGHT JOIN Courses c ON e.CourseID = c.CourseID;`,
"Uses a RIGHT JOIN to fetch all courses, even those with no enrollment entries.");

addQ(25, "Joins", "Show all projects even if nobody is assigned.", "Easy",
`SELECT ep.EmployeeID, p.ProjectName 
FROM Employee_Projects ep 
RIGHT JOIN Projects p ON ep.ProjectID = p.ProjectID;`,
"Retrieves all projects using a RIGHT JOIN, ensuring unassigned projects appear in the result.");

addQ(26, "Joins", "Generate all possible combinations of employees and projects.", "Easy",
`SELECT e.EmployeeName, p.ProjectName 
FROM Employees e 
CROSS JOIN Projects p;`,
"Generates a Cartesian Product. Combines every employee with every project.");

addQ(27, "Joins", "Generate all possible combinations of products and suppliers.", "Easy",
`SELECT p.ProductName, s.SupplierName 
FROM Products p 
CROSS JOIN Suppliers s;`,
"Performs a CROSS JOIN between products and suppliers, generating all permutations.");

addQ(28, "Joins", "Create all possible customer-product combinations.", "Easy",
`SELECT c.CustomerName, p.ProductName 
FROM Customers c 
CROSS JOIN Products p;`,
"Generates all customer-product pairs using a CROSS JOIN.");

addQ(29, "Joins", "Generate all seat allocations for flights.", "Intermediate",
`SELECT f.FlightNumber, s.SeatNumber 
FROM Flights f 
CROSS JOIN Seats s;`,
"Performs a CROSS JOIN to generate every seat allocation for all flights.");

addQ(30, "Joins", "Generate all possible exam schedules.", "Intermediate",
`SELECT c.CourseName, s.SlotName 
FROM Courses c 
CROSS JOIN Exam_Slots s;`,
"Combines all courses with all exam slots using a CROSS JOIN.");

addQ(31, "Joins", "Display employee and manager names (using Self Join).", "Easy",
`SELECT e.EmployeeName AS Employee, m.EmployeeName AS Manager 
FROM Employees e 
INNER JOIN Employees m ON e.ManagerID = m.EmployeeID;`,
"Uses an INNER SELF JOIN to relate employees directly to their managers.");

addQ(32, "Joins", "Find employees reporting directly to CEO (where Manager's Title is 'CEO').", "Intermediate",
`SELECT e.EmployeeName 
FROM Employees e 
INNER JOIN Employees m ON e.ManagerID = m.EmployeeID 
WHERE m.Title = 'CEO';`,
"Joins the employee table with itself and filters for records where the manager's title is 'CEO'.");

addQ(33, "Joins", "Find employees reporting to same manager.", "Intermediate",
`SELECT e1.EmployeeName AS Employee1, e2.EmployeeName AS Employee2, e1.ManagerID 
FROM Employees e1 
INNER JOIN Employees e2 ON e1.ManagerID = e2.ManagerID AND e1.EmployeeID < e2.EmployeeID;`,
"SELF JOIN that matches employees sharing the same ManagerID. The condition e1.EmployeeID < e2.EmployeeID avoids self-pairing and duplicate swapped pairs.");

addQ(34, "Joins", "Find employees working in same department.", "Intermediate",
`SELECT e1.EmployeeName AS Employee1, e2.EmployeeName AS Employee2, e1.DepartmentID 
FROM Employees e1 
INNER JOIN Employees e2 ON e1.DepartmentID = e2.DepartmentID AND e1.EmployeeID < e2.EmployeeID;`,
"Matches employees in the same department, avoiding duplicates with EmployeeID comparison.");

addQ(35, "Joins", "Find employees sharing same salary.", "Intermediate",
`SELECT e1.EmployeeName AS Employee1, e2.EmployeeName AS Employee2, e1.Salary 
FROM Employees e1 
INNER JOIN Employees e2 ON e1.Salary = e2.Salary AND e1.EmployeeID < e2.EmployeeID;`,
"Finds pairs of employees who earn the exact same salary.");

addQ(36, "Joins", "Find duplicate customer names.", "Easy",
`SELECT c1.CustomerID AS ID1, c2.CustomerID AS ID2, c1.CustomerName 
FROM Customers c1 
INNER JOIN Customers c2 ON c1.CustomerName = c2.CustomerName AND c1.CustomerID < c2.CustomerID;`,
"Finds duplicate customer names by checking if two different IDs share the same CustomerName.");

addQ(37, "Joins", "Find products having same price.", "Intermediate",
`SELECT p1.ProductName AS Product1, p2.ProductName AS Product2, p1.Price 
FROM Products p1 
INNER JOIN Products p2 ON p1.Price = p2.Price AND p1.ProductID < p2.ProductID;`,
"Performs a self join to pair products that cost the same.");

addQ(38, "Joins", "Find students sharing same marks.", "Intermediate",
`SELECT s1.StudentName AS Student1, s2.StudentName AS Student2, e1.Marks 
FROM Enrollments e1 
INNER JOIN Enrollments e2 ON e1.Marks = e2.Marks AND e1.StudentID < e2.StudentID
INNER JOIN Students s1 ON e1.StudentID = s1.StudentID
INNER JOIN Students s2 ON e2.StudentID = s2.StudentID;`,
"Self joins enrollments on Marks and joins the Students table to fetch names.");

addQ(39, "Joins", "Find employees hired on same date.", "Intermediate",
`SELECT e1.EmployeeName AS Employee1, e2.EmployeeName AS Employee2, e1.HireDate 
FROM Employees e1 
INNER JOIN Employees e2 ON e1.HireDate = e2.HireDate AND e1.EmployeeID < e2.EmployeeID;`,
"Self joins the employees table on HireDate.");

addQ(40, "Joins", "Find customers from same city.", "Easy",
`SELECT c1.CustomerName AS Customer1, c2.CustomerName AS Customer2, c1.City 
FROM Customers c1 
INNER JOIN Customers c2 ON c1.City = c2.City AND c1.CustomerID < c2.CustomerID;`,
"Finds customers located in the same city.");

// Let's create general structures for remaining Joins 41-80
const joinPrompts = [
  [41, "Find department-wise employee count.", "SELECT d.DepartmentName, COUNT(e.EmployeeID) AS EmployeeCount FROM Departments d LEFT JOIN Employees e ON d.DepartmentID = e.DepartmentID GROUP BY d.DepartmentName;"],
  [42, "Find department-wise total salary.", "SELECT d.DepartmentName, SUM(e.Salary) AS TotalSalary FROM Departments d INNER JOIN Employees e ON d.DepartmentID = e.DepartmentID GROUP BY d.DepartmentName;"],
  [43, "Find department-wise average salary.", "SELECT d.DepartmentName, AVG(e.Salary) AS AverageSalary FROM Departments d INNER JOIN Employees e ON d.DepartmentID = e.DepartmentID GROUP BY d.DepartmentName;"],
  [44, "Find department with maximum employees.", "SELECT d.DepartmentName, COUNT(e.EmployeeID) AS EmployeeCount FROM Departments d INNER JOIN Employees e ON d.DepartmentID = e.DepartmentID GROUP BY d.DepartmentName ORDER BY EmployeeCount DESC LIMIT 1;"],
  [45, "Find department with highest salary expense.", "SELECT d.DepartmentName, SUM(e.Salary) AS TotalSalary FROM Departments d INNER JOIN Employees e ON d.DepartmentID = e.DepartmentID GROUP BY d.DepartmentName ORDER BY TotalSalary DESC LIMIT 1;"],
  [46, "Find department with lowest salary expense.", "SELECT d.DepartmentName, SUM(e.Salary) AS TotalSalary FROM Departments d INNER JOIN Employees e ON d.DepartmentID = e.DepartmentID GROUP BY d.DepartmentName ORDER BY TotalSalary ASC LIMIT 1;"],
  [47, "Find customers with total purchase amount.", "SELECT c.CustomerID, c.CustomerName, SUM(o.Amount) AS TotalPurchase FROM Customers c LEFT JOIN Orders o ON c.CustomerID = o.CustomerID GROUP BY c.CustomerID, c.CustomerName;"],
  [48, "Find top-selling category.", "SELECT c.CategoryName, SUM(oi.Quantity) AS TotalSold FROM Categories c INNER JOIN Products p ON c.CategoryID = p.CategoryID INNER JOIN Order_Items oi ON p.ProductID = oi.ProductID GROUP BY c.CategoryName ORDER BY TotalSold DESC LIMIT 1;"],
  [49, "Find top revenue-generating product.", "SELECT p.ProductName, SUM(oi.Quantity * p.Price) AS Revenue FROM Products p INNER JOIN Order_Items oi ON p.ProductID = oi.ProductID GROUP BY p.ProductName ORDER BY Revenue DESC LIMIT 1;"],
  [50, "Find supplier supplying maximum products.", "SELECT s.SupplierName, COUNT(p.ProductID) AS ProductCount FROM Suppliers s INNER JOIN Products p ON s.SupplierID = p.SupplierID GROUP BY s.SupplierName ORDER BY ProductCount DESC LIMIT 1;"],
  [51, "Find project having maximum employees.", "SELECT p.ProjectName, COUNT(ep.EmployeeID) AS EmployeeCount FROM Projects p INNER JOIN Employee_Projects ep ON p.ProjectID = ep.ProjectID GROUP BY p.ProjectName ORDER BY EmployeeCount DESC LIMIT 1;"],
  [52, "Find project budget utilization percentage.", "SELECT p.ProjectName, p.Budget, SUM(e.Salary) AS SalarySum, (SUM(e.Salary) / p.Budget) * 100 AS UtilizationRate FROM Projects p INNER JOIN Employee_Projects ep ON p.ProjectID = ep.ProjectID INNER JOIN Employees e ON ep.EmployeeID = e.EmployeeID GROUP BY p.ProjectID, p.ProjectName, p.Budget;"],
  [53, "Find branch-wise sales totals.", "SELECT b.BranchName, SUM(o.Amount) AS SalesTotal FROM Branches b INNER JOIN Employees e ON b.BranchID = e.BranchID INNER JOIN Customers c ON e.EmployeeID = c.SalesRepID INNER JOIN Orders o ON c.CustomerID = o.CustomerID GROUP BY b.BranchName;"],
  [54, "Find city-wise customer count.", "SELECT c.City, COUNT(c.CustomerID) AS CustomerCount FROM Customers c GROUP BY c.City;"],
  [55, "Find manager-wise team size.", "SELECT m.EmployeeName AS ManagerName, COUNT(e.EmployeeID) AS TeamSize FROM Employees e INNER JOIN Employees m ON e.ManagerID = m.EmployeeID GROUP BY m.EmployeeName;"],
  [56, "Find employees earning more than department average.", "SELECT e.EmployeeName, e.Salary, d.DepartmentName FROM Employees e INNER JOIN Departments d ON e.DepartmentID = d.DepartmentID WHERE e.Salary > (SELECT AVG(Salary) FROM Employees WHERE DepartmentID = e.DepartmentID);"],
  [57, "Find employees earning less than manager.", "SELECT e.EmployeeName AS Employee, e.Salary AS EmployeeSalary, m.EmployeeName AS Manager, m.Salary AS ManagerSalary FROM Employees e INNER JOIN Employees m ON e.ManagerID = m.EmployeeID WHERE e.Salary < m.Salary;"],
  [58, "Find employees older than manager.", "SELECT e.EmployeeName AS Employee, e.Age AS EmployeeAge, m.EmployeeName AS Manager, m.Age AS ManagerAge FROM Employees e INNER JOIN Employees m ON e.ManagerID = m.EmployeeID WHERE e.Age > m.Age;"],
  [59, "Find customers whose order value exceeds average order value.", "SELECT DISTINCT c.CustomerName FROM Customers c INNER JOIN Orders o ON c.CustomerID = o.CustomerID WHERE o.Amount > (SELECT AVG(Amount) FROM Orders);"],
  [60, "Find products priced above category average.", "SELECT p.ProductName, p.Price, c.CategoryName FROM Products p INNER JOIN Categories c ON p.CategoryID = c.CategoryID WHERE p.Price > (SELECT AVG(Price) FROM Products WHERE CategoryID = p.CategoryID);"],
  [61, "Find departments where average salary exceeds 75000.", "SELECT d.DepartmentName, AVG(e.Salary) AS AvgSalary FROM Departments d INNER JOIN Employees e ON d.DepartmentID = e.DepartmentID GROUP BY d.DepartmentName HAVING AvgSalary > 75000;"],
  [62, "Find projects exceeding allocated budget.", "SELECT p.ProjectName, p.Budget, SUM(e.Salary) AS SalaryCost FROM Projects p INNER JOIN Employee_Projects ep ON p.ProjectID = ep.ProjectID INNER JOIN Employees e ON ep.EmployeeID = e.EmployeeID GROUP BY p.ProjectID, p.ProjectName, p.Budget HAVING SalaryCost > p.Budget;"],
  [63, "Find customers ordering more than 5 times.", "SELECT c.CustomerName, COUNT(o.OrderID) AS OrderCount FROM Customers c INNER JOIN Orders o ON c.CustomerID = o.CustomerID GROUP BY c.CustomerID, c.CustomerName HAVING OrderCount > 5;"],
  [64, "Find employees who joined before their managers.", "SELECT e.EmployeeName AS Employee, e.HireDate AS EmployeeHireDate, m.EmployeeName AS Manager, m.HireDate AS ManagerHireDate FROM Employees e INNER JOIN Employees m ON e.ManagerID = m.EmployeeID WHERE e.HireDate < m.HireDate;"],
  [65, "Find suppliers whose products never sold.", "SELECT s.SupplierName FROM Suppliers s INNER JOIN Products p ON s.SupplierID = p.SupplierID LEFT JOIN Order_Items oi ON p.ProductID = oi.ProductID WHERE oi.OrderItemID IS NULL;"],
  [66, "Display employee, department, project, and location details.", "SELECT e.EmployeeName, d.DepartmentName, p.ProjectName, d.Location FROM Employees e INNER JOIN Departments d ON e.DepartmentID = d.DepartmentID INNER JOIN Employee_Projects ep ON e.EmployeeID = ep.EmployeeID INNER JOIN Projects p ON ep.ProjectID = p.ProjectID;"],
  [67, "Find employees working on multiple projects.", "SELECT e.EmployeeName, COUNT(ep.ProjectID) AS ProjectCount FROM Employees e INNER JOIN Employee_Projects ep ON e.EmployeeID = ep.EmployeeID GROUP BY e.EmployeeID, e.EmployeeName HAVING ProjectCount > 1;"],
  [68, "Find projects involving multiple departments.", "SELECT p.ProjectName, COUNT(DISTINCT e.DepartmentID) AS DeptCount FROM Projects p INNER JOIN Employee_Projects ep ON p.ProjectID = ep.ProjectID INNER JOIN Employees e ON ep.EmployeeID = e.EmployeeID GROUP BY p.ProjectName HAVING DeptCount > 1;"],
  [69, "Find departments working on highest number of projects.", "SELECT d.DepartmentName, COUNT(DISTINCT ep.ProjectID) AS ProjectCount FROM Departments d INNER JOIN Employees e ON d.DepartmentID = e.DepartmentID INNER JOIN Employee_Projects ep ON e.EmployeeID = ep.EmployeeID GROUP BY d.DepartmentName ORDER BY ProjectCount DESC;"],
  [70, "Find locations with highest employee count.", "SELECT d.Location, COUNT(e.EmployeeID) AS EmpCount FROM Departments d INNER JOIN Employees e ON d.DepartmentID = e.DepartmentID GROUP BY d.Location ORDER BY EmpCount DESC;"],
  [71, "Find employees assigned to all projects.", "SELECT e.EmployeeName FROM Employees e INNER JOIN Employee_Projects ep ON e.EmployeeID = ep.EmployeeID GROUP BY e.EmployeeID, e.EmployeeName HAVING COUNT(ep.ProjectID) = (SELECT COUNT(*) FROM Projects);"],
  [72, "Find employees assigned to no projects.", "SELECT e.EmployeeName FROM Employees e LEFT JOIN Employee_Projects ep ON e.EmployeeID = ep.EmployeeID WHERE ep.ProjectID IS NULL;"],
  [73, "Find departments with no active projects.", "SELECT d.DepartmentName FROM Departments d LEFT JOIN (SELECT DISTINCT e.DepartmentID FROM Employees e INNER JOIN Employee_Projects ep ON e.EmployeeID = ep.EmployeeID) active_depts ON d.DepartmentID = active_depts.DepartmentID WHERE active_depts.DepartmentID IS NULL;"],
  [74, "Find locations without departments.", "SELECT DISTINCT l.LocationName FROM Locations l LEFT JOIN Departments d ON l.LocationName = d.Location WHERE d.DepartmentID IS NULL;"],
  [75, "Find projects without assigned employees.", "SELECT p.ProjectName FROM Projects p LEFT JOIN Employee_Projects ep ON p.ProjectID = ep.ProjectID WHERE ep.EmployeeID IS NULL;"],
  [76, "Find customers who purchased products from every category.", "SELECT c.CustomerName FROM Customers c INNER JOIN Orders o ON c.CustomerID = o.CustomerID INNER JOIN Order_Items oi ON o.OrderID = oi.OrderID INNER JOIN Products p ON oi.ProductID = p.ProductID GROUP BY c.CustomerID, c.CustomerName HAVING COUNT(DISTINCT p.CategoryID) = (SELECT COUNT(*) FROM Categories);"],
  [77, "Find customers having transactions in all account types.", "SELECT c.CustomerName FROM Customers c INNER JOIN Accounts a ON c.CustomerID = a.CustomerID INNER JOIN Transactions t ON a.AccountID = t.AccountID GROUP BY c.CustomerID, c.CustomerName HAVING COUNT(DISTINCT a.AccountType) = (SELECT COUNT(DISTINCT AccountType) FROM Accounts);"],
  [78, "Find departments with attendance percentage below company average.", "SELECT d.DepartmentName, (SUM(CASE WHEN att.Status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(att.AttendanceID)) AS DeptAttendance FROM Departments d INNER JOIN Employees e ON d.DepartmentID = e.DepartmentID INNER JOIN Attendance att ON e.EmployeeID = att.EmployeeID GROUP BY d.DepartmentName HAVING DeptAttendance < (SELECT SUM(CASE WHEN Status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) FROM Attendance);"],
  [79, "Find delivery partners who delivered orders from every restaurant.", "SELECT dp.PartnerName FROM Delivery_Partners dp INNER JOIN Orders o ON dp.PartnerID = o.PartnerID GROUP BY dp.PartnerID, dp.PartnerName HAVING COUNT(DISTINCT o.RestaurantID) = (SELECT COUNT(*) FROM Restaurants);"],
  [80, "Find the complete reporting hierarchy from CEO to lowest-level employee using joins (Self Joins up to 4 levels).", "SELECT e1.EmployeeName AS CEO, e2.EmployeeName AS Manager, e3.EmployeeName AS Supervisor, e4.EmployeeName AS Staff FROM Employees e1 LEFT JOIN Employees e2 ON e2.ManagerID = e1.EmployeeID LEFT JOIN Employees e3 ON e3.ManagerID = e2.EmployeeID LEFT JOIN Employees e4 ON e4.ManagerID = e3.EmployeeID WHERE e1.ManagerID IS NULL;"]
];

for (const [id, prompt, sql] of joinPrompts) {
  addQ(id, "Joins", prompt, "Hard", sql, `Demonstrates aggregation, filtering, and multi-table linking using JOIN logic to achieve specific business requirements.`);
}

// ----------------------------------------------------
// SECTION B: SUBQUERIES & CTES (81-160)
// ----------------------------------------------------
addQ(81, "Subqueries & CTEs", "Find the employee with the highest salary.", "Easy",
`SELECT EmployeeName, Salary 
FROM Employees 
WHERE Salary = (SELECT MAX(Salary) FROM Employees);`,
"Uses a scalar subquery to find the maximum salary and matches it in the outer query's WHERE clause.");

addQ(82, "Subqueries & CTEs", "Find the employee with the lowest salary.", "Easy",
`SELECT EmployeeName, Salary 
FROM Employees 
WHERE Salary = (SELECT MIN(Salary) FROM Employees);`,
"Finds the lowest salary using MIN() in a subquery and filters employees based on it.");

addQ(83, "Subqueries & CTEs", "Find employees earning more than the average salary.", "Easy",
`SELECT EmployeeName, Salary 
FROM Employees 
WHERE Salary > (SELECT AVG(Salary) FROM Employees);`,
"Uses a subquery to compute the average company salary, then filters employees with salaries exceeding it.");

addQ(84, "Subqueries & CTEs", "Find employees earning less than the average salary.", "Easy",
`SELECT EmployeeName, Salary 
FROM Employees 
WHERE Salary < (SELECT AVG(Salary) FROM Employees);`,
"Filters employees whose salary is lower than the average computed in the subquery.");

addQ(85, "Subqueries & CTEs", "Find products priced above average price.", "Easy",
`SELECT ProductName, Price 
FROM Products 
WHERE Price > (SELECT AVG(Price) FROM Products);`,
"Computes average product price in a subquery, displaying products above that value.");

addQ(86, "Subqueries & CTEs", "Find products priced below average price.", "Easy",
`SELECT ProductName, Price 
FROM Products 
WHERE Price < (SELECT AVG(Price) FROM Products);`,
"Retrieves products that cost less than the average product price.");

addQ(87, "Subqueries & CTEs", "Find customers whose total purchase amount exceeds average purchase amount.", "Intermediate",
`SELECT CustomerID, SUM(Amount) AS TotalPurchase 
FROM Orders 
GROUP BY CustomerID 
HAVING TotalPurchase > (
    SELECT AVG(CustomerTotal) 
    FROM (SELECT SUM(Amount) AS CustomerTotal FROM Orders GROUP BY CustomerID) AS Sub
);`,
"Calculates average customer spending in a nested subquery and compares each customer's total spending using HAVING.");

addQ(88, "Subqueries & CTEs", "Find students scoring above average marks.", "Easy",
`SELECT StudentID, Marks 
FROM Enrollments 
WHERE Marks > (SELECT AVG(Marks) FROM Enrollments);`,
"Selects students with marks above the class average computed in a subquery.");

addQ(89, "Subqueries & CTEs", "Find employees hired after the latest hire date in the IT department.", "Intermediate",
`SELECT EmployeeName, HireDate 
FROM Employees 
WHERE HireDate > (
    SELECT MAX(e.HireDate) 
    FROM Employees e 
    INNER JOIN Departments d ON e.DepartmentID = d.DepartmentID 
    WHERE d.DepartmentName = 'IT'
);`,
"Uses a subquery to find the latest hire date in IT, then selects employees hired after that date.");

addQ(90, "Subqueries & CTEs", "Find orders having amount greater than average order amount.", "Easy",
`SELECT OrderID, Amount 
FROM Orders 
WHERE Amount > (SELECT AVG(Amount) FROM Orders);`,
"Selects individual orders whose total amount is greater than the standard order average.");

// Single-row subqueries (91-100)
const singleRowPrompts = [
  [91, "Find employees working in the same department as 'John'.", "SELECT EmployeeName FROM Employees WHERE DepartmentID = (SELECT DepartmentID FROM Employees WHERE EmployeeName = 'John') AND EmployeeName != 'John';"],
  [92, "Find employees earning the same salary as 'David'.", "SELECT EmployeeName FROM Employees WHERE Salary = (SELECT Salary FROM Employees WHERE EmployeeName = 'David') AND EmployeeName != 'David';"],
  [93, "Find customers from the same city as customer ID 101.", "SELECT CustomerName, City FROM Customers WHERE City = (SELECT City FROM Customers WHERE CustomerID = 101) AND CustomerID != 101;"],
  [94, "Find products belonging to the same category as Product A.", "SELECT ProductName FROM Products WHERE CategoryID = (SELECT CategoryID FROM Products WHERE ProductName = 'Product A') AND ProductName != 'Product A';"],
  [95, "Find employees reporting to the same manager as Employee X.", "SELECT EmployeeName FROM Employees WHERE ManagerID = (SELECT ManagerID FROM Employees WHERE EmployeeName = 'Employee X') AND EmployeeName != 'Employee X';"],
  [96, "Find projects managed by the same manager as Project Y.", "SELECT ProjectName FROM Projects WHERE ManagerID = (SELECT ManagerID FROM Projects WHERE ProjectName = 'Project Y') AND ProjectName != 'Project Y';"],
  [97, "Find students enrolled in the same course as Student Z.", "SELECT StudentID FROM Enrollments WHERE CourseID = (SELECT CourseID FROM Enrollments WHERE StudentID = 'Student Z') AND StudentID != 'Student Z';"],
  [98, "Find branches located in the same city as Branch 1.", "SELECT BranchName FROM Branches WHERE City = (SELECT City FROM Branches WHERE BranchID = 1) AND BranchID != 1;"],
  [99, "Find suppliers supplying products in the same category as Supplier A.", "SELECT DISTINCT SupplierID FROM Products WHERE CategoryID IN (SELECT CategoryID FROM Products WHERE SupplierID = 'Supplier A') AND SupplierID != 'Supplier A';"],
  [100, "Find employees hired on the same date as Employee 1001.", "SELECT EmployeeName FROM Employees WHERE HireDate = (SELECT HireDate FROM Employees WHERE EmployeeID = 1001) AND EmployeeID != 1001;"]
];
for (const [id, prompt, sql] of singleRowPrompts) {
  addQ(id, "Subqueries & CTEs", prompt, "Easy", sql, "Uses a single-row subquery returning one value to compare in the outer WHERE clause.");
}

// Multi-row subqueries (101-120)
const multiRowPrompts = [
  [101, "Find employees working in departments located in Mumbai.", "SELECT EmployeeName FROM Employees WHERE DepartmentID IN (SELECT DepartmentID FROM Departments WHERE Location = 'Mumbai');"],
  [102, "Find customers who placed orders in 2025.", "SELECT CustomerName FROM Customers WHERE CustomerID IN (SELECT CustomerID FROM Orders WHERE strftime('%Y', OrderDate) = '2025');"],
  [103, "Find products sold in the Electronics category.", "SELECT ProductName FROM Products WHERE CategoryID IN (SELECT CategoryID FROM Categories WHERE CategoryName = 'Electronics');"],
  [104, "Find employees working on active projects.", "SELECT EmployeeName FROM Employees WHERE EmployeeID IN (SELECT EmployeeID FROM Employee_Projects ep INNER JOIN Projects p ON ep.ProjectID = p.ProjectID WHERE p.Status = 'Active');"],
  [105, "Find departments having employees.", "SELECT DepartmentName FROM Departments WHERE DepartmentID IN (SELECT DISTINCT DepartmentID FROM Employees WHERE DepartmentID IS NOT NULL);"],
  [106, "Find departments without employees.", "SELECT DepartmentName FROM Departments WHERE DepartmentID NOT IN (SELECT DISTINCT DepartmentID FROM Employees WHERE DepartmentID IS NOT NULL);"],
  [107, "Find customers who never placed orders.", "SELECT CustomerName FROM Customers WHERE CustomerID NOT IN (SELECT DISTINCT CustomerID FROM Orders);"],
  [108, "Find products never sold.", "SELECT ProductName FROM Products WHERE ProductID NOT IN (SELECT DISTINCT ProductID FROM Order_Items);"],
  [109, "Find suppliers with no products.", "SELECT SupplierName FROM Suppliers WHERE SupplierID NOT IN (SELECT DISTINCT SupplierID FROM Products);"],
  [110, "Find students not enrolled in any course.", "SELECT StudentName FROM Students WHERE StudentID NOT IN (SELECT DISTINCT StudentID FROM Enrollments);"],
  [111, "Find employees earning more than any employee in Sales.", "SELECT EmployeeName, Salary FROM Employees WHERE Salary > ANY (SELECT Salary FROM Employees e INNER JOIN Departments d ON e.DepartmentID = d.DepartmentID WHERE d.DepartmentName = 'Sales');"],
  [112, "Find employees earning more than all employees in Sales.", "SELECT EmployeeName, Salary FROM Employees WHERE Salary > ALL (SELECT Salary FROM Employees e INNER JOIN Departments d ON e.DepartmentID = d.DepartmentID WHERE d.DepartmentName = 'Sales');"],
  [113, "Find products priced higher than all products in Category A.", "SELECT ProductName, Price FROM Products WHERE Price > ALL (SELECT Price FROM Products WHERE CategoryID = 'Category A');"],
  [114, "Find products priced lower than any product in Category B.", "SELECT ProductName, Price FROM Products WHERE Price < ANY (SELECT Price FROM Products WHERE CategoryID = 'Category B');"],
  [115, "Find students scoring higher than all students in Section C.", "SELECT StudentName FROM Students s INNER JOIN Enrollments e ON s.StudentID = e.StudentID WHERE e.Marks > ALL (SELECT Marks FROM Enrollments WHERE Section = 'C');"],
  [116, "Find employees with salary greater than all managers.", "SELECT EmployeeName, Salary FROM Employees WHERE Salary > ALL (SELECT Salary FROM Employees WHERE Title = 'Manager');"],
  [117, "Find branches generating revenue higher than all branches in Pune.", "SELECT BranchName FROM Branches WHERE Revenue > ALL (SELECT Revenue FROM Branches WHERE City = 'Pune');"],
  [118, "Find suppliers delivering faster than all competitors.", "SELECT SupplierName FROM Suppliers WHERE DeliveryDays < ALL (SELECT DeliveryDays FROM Competitors);"],
  [119, "Find customers spending more than all customers in a region.", "SELECT CustomerName FROM Customers c INNER JOIN Orders o ON c.CustomerID = o.CustomerID GROUP BY c.CustomerID, c.CustomerName HAVING SUM(o.Amount) > ALL (SELECT SUM(Amount) FROM Orders o INNER JOIN Customers c2 ON o.CustomerID = c2.CustomerID WHERE c2.Region = 'North' GROUP BY c2.CustomerID);"],
  [120, "Find projects with budget larger than all projects in IT.", "SELECT ProjectName, Budget FROM Projects WHERE Budget > ALL (SELECT Budget FROM Projects p INNER JOIN Departments d ON p.DeptID = d.DepartmentID WHERE d.DepartmentName = 'IT');"]
];
for (const [id, prompt, sql] of multiRowPrompts) {
  addQ(id, "Subqueries & CTEs", prompt, "Intermediate", sql, "Uses IN, NOT IN, ANY, or ALL operator to match outer query rows against a multi-row subquery list.");
}

// Correlated subqueries (121-140)
const correlatedPrompts = [
  [121, "Find employees earning above department average salary.", "SELECT e.EmployeeName, e.Salary, e.DepartmentID FROM Employees e WHERE e.Salary > (SELECT AVG(Salary) FROM Employees WHERE DepartmentID = e.DepartmentID);"],
  [122, "Find employees earning below department average salary.", "SELECT e.EmployeeName, e.Salary, e.DepartmentID FROM Employees e WHERE e.Salary < (SELECT AVG(Salary) FROM Employees WHERE DepartmentID = e.DepartmentID);"],
  [123, "Find highest-paid employee in each department.", "SELECT e.EmployeeName, e.Salary, e.DepartmentID FROM Employees e WHERE e.Salary = (SELECT MAX(Salary) FROM Employees WHERE DepartmentID = e.DepartmentID);"],
  [124, "Find lowest-paid employee in each department.", "SELECT e.EmployeeName, e.Salary, e.DepartmentID FROM Employees e WHERE e.Salary = (SELECT MIN(Salary) FROM Employees WHERE DepartmentID = e.DepartmentID);"],
  [125, "Find customers whose spending exceeds average spending in their city.", "SELECT c.CustomerName, c.City, SUM(o.Amount) AS TotalSpent FROM Customers c INNER JOIN Orders o ON c.CustomerID = o.CustomerID GROUP BY c.CustomerID, c.CustomerName, c.City HAVING TotalSpent > (SELECT AVG(CitySpent) FROM (SELECT c2.City, c2.CustomerID, SUM(o2.Amount) AS CitySpent FROM Customers c2 INNER JOIN Orders o2 ON c2.CustomerID = o2.CustomerID GROUP BY c2.City, c2.CustomerID) AS Sub WHERE Sub.City = c.City);"],
  [126, "Find products priced above average category price.", "SELECT p.ProductName, p.Price, p.CategoryID FROM Products p WHERE p.Price > (SELECT AVG(Price) FROM Products WHERE CategoryID = p.CategoryID);"],
  [127, "Find students scoring above class average.", "SELECT e.StudentID, e.Marks, e.CourseID FROM Enrollments e WHERE e.Marks > (SELECT AVG(Marks) FROM Enrollments WHERE CourseID = e.CourseID);"],
  [128, "Find suppliers supplying more products than average supplier.", "SELECT s.SupplierName, COUNT(p.ProductID) AS ProdCount FROM Suppliers s INNER JOIN Products p ON s.SupplierID = p.SupplierID GROUP BY s.SupplierID, s.SupplierName HAVING ProdCount > (SELECT AVG(SubCount) FROM (SELECT COUNT(ProductID) AS SubCount FROM Products GROUP BY SupplierID) AS Sub);"],
  [129, "Find projects whose cost exceeds department average.", "SELECT p.ProjectName, p.Budget FROM Projects p WHERE p.Budget > (SELECT AVG(Budget) FROM Projects WHERE DeptID = p.DeptID);"],
  [130, "Find branches performing above regional average.", "SELECT b.BranchName, b.Revenue, b.Region FROM Branches b WHERE b.Revenue > (SELECT AVG(Revenue) FROM Branches WHERE Region = b.Region);"],
  [131, "Find customers who have placed orders (using EXISTS).", "SELECT c.CustomerName FROM Customers c WHERE EXISTS (SELECT 1 FROM Orders o WHERE o.CustomerID = c.CustomerID);"],
  [132, "Find customers who have never placed orders (using NOT EXISTS).", "SELECT c.CustomerName FROM Customers c WHERE NOT EXISTS (SELECT 1 FROM Orders o WHERE o.CustomerID = c.CustomerID);"],
  [133, "Find employees assigned to projects (using EXISTS).", "SELECT e.EmployeeName FROM Employees e WHERE EXISTS (SELECT 1 FROM Employee_Projects ep WHERE ep.EmployeeID = e.EmployeeID);"],
  [134, "Find employees not assigned to projects (using NOT EXISTS).", "SELECT e.EmployeeName FROM Employees e WHERE NOT EXISTS (SELECT 1 FROM Employee_Projects ep WHERE ep.EmployeeID = e.EmployeeID);"],
  [135, "Find departments having active employees.", "SELECT d.DepartmentName FROM Departments d WHERE EXISTS (SELECT 1 FROM Employees e WHERE e.DepartmentID = d.DepartmentID AND e.Status = 'Active');"],
  [136, "Find departments without active employees.", "SELECT d.DepartmentName FROM Departments d WHERE NOT EXISTS (SELECT 1 FROM Employees e WHERE e.DepartmentID = d.DepartmentID AND e.Status = 'Active');"],
  [137, "Find products having sales records.", "SELECT p.ProductName FROM Products p WHERE EXISTS (SELECT 1 FROM Order_Items oi WHERE oi.ProductID = p.ProductID);"],
  [138, "Find products without sales records.", "SELECT p.ProductName FROM Products p WHERE NOT EXISTS (SELECT 1 FROM Order_Items oi WHERE oi.ProductID = p.ProductID);"],
  [139, "Find suppliers supplying active products.", "SELECT s.SupplierName FROM Suppliers s WHERE EXISTS (SELECT 1 FROM Products p WHERE p.SupplierID = s.SupplierID AND p.Status = 'Active');"],
  [140, "Find suppliers not supplying active products.", "SELECT s.SupplierName FROM Suppliers s WHERE NOT EXISTS (SELECT 1 FROM Products p WHERE p.SupplierID = s.SupplierID AND p.Status = 'Active');"]
];
for (const [id, prompt, sql] of correlatedPrompts) {
  addQ(id, "Subqueries & CTEs", prompt, "Hard", sql, "Uses a correlated subquery, executing once for each row evaluated in the outer query.");
}

// Nested subqueries & CTEs (141-160)
const nestedPrompts = [
  [141, "Find the second highest salary using nested subqueries.", "SELECT MAX(Salary) FROM Employees WHERE Salary < (SELECT MAX(Salary) FROM Employees);"],
  [142, "Find the third highest salary.", "SELECT MAX(Salary) FROM Employees WHERE Salary < (SELECT MAX(Salary) FROM Employees WHERE Salary < (SELECT MAX(Salary) FROM Employees));"],
  [143, "Find the nth highest salary (dynamic approach using LIMIT/OFFSET).", "SELECT Salary FROM Employees ORDER BY Salary DESC LIMIT 1 OFFSET 4; -- Replace 4 with (N-1)"],
  [144, "Find customers who spent more than average spending of top customers.", "WITH CustomerSpend AS (SELECT CustomerID, SUM(Amount) AS Total FROM Orders GROUP BY CustomerID), TopCustomers AS (SELECT Total FROM CustomerSpend ORDER BY Total DESC LIMIT 5) SELECT CustomerID FROM CustomerSpend WHERE Total > (SELECT AVG(Total) FROM TopCustomers);"],
  [145, "Find departments whose average salary exceeds company average salary.", "SELECT DepartmentID, AVG(Salary) AS DeptAvg FROM Employees GROUP BY DepartmentID HAVING DeptAvg > (SELECT AVG(Salary) FROM Employees);"],
  [146, "Find projects whose cost exceeds average project cost in highest-performing department.", "WITH DeptRevenue AS (SELECT DeptID, SUM(Revenue) AS Revenue FROM Branches GROUP BY DeptID), TopDept AS (SELECT DeptID FROM DeptRevenue ORDER BY Revenue DESC LIMIT 1) SELECT ProjectName, Budget FROM Projects WHERE Budget > (SELECT AVG(Budget) FROM Projects WHERE DeptID = (SELECT DeptID FROM TopDept));"],
  [147, "Find products whose sales exceed average sales in top category.", "WITH CategorySales AS (SELECT CategoryID, SUM(Quantity) AS Sales FROM Products p INNER JOIN Order_Items oi ON p.ProductID = oi.ProductID GROUP BY CategoryID), TopCat AS (SELECT CategoryID FROM CategorySales ORDER BY Sales DESC LIMIT 1) SELECT ProductID, ProductName FROM Products WHERE CategoryID = (SELECT CategoryID FROM TopCat);"],
  [148, "Find employees working in departments with highest average salary.", "SELECT EmployeeName, Salary, DepartmentID FROM Employees WHERE DepartmentID = (SELECT DepartmentID FROM Employees GROUP BY DepartmentID ORDER BY AVG(Salary) DESC LIMIT 1);"],
  [149, "Find branches whose revenue exceeds average revenue of top-performing cities.", "WITH CityRevenue AS (SELECT City, AVG(Revenue) AS AvgRev FROM Branches GROUP BY City) SELECT BranchName, Revenue FROM Branches WHERE Revenue > (SELECT AVG(AvgRev) FROM CityRevenue);"],
  [150, "Find customers purchasing products from top-selling categories.", "WITH TopCategories AS (SELECT CategoryID, COUNT(*) AS SalesCount FROM Products p INNER JOIN Order_Items oi ON p.ProductID = oi.ProductID GROUP BY CategoryID ORDER BY SalesCount DESC LIMIT 3) SELECT DISTINCT c.CustomerName FROM Customers c INNER JOIN Orders o ON c.CustomerID = o.CustomerID INNER JOIN Order_Items oi ON o.OrderID = oi.OrderID INNER JOIN Products p ON oi.ProductID = p.ProductID WHERE p.CategoryID IN (SELECT CategoryID FROM TopCategories);"],
  [151, "Use CTE to find employees earning above average salary.", "WITH AvgSalary AS (SELECT AVG(Salary) AS AvgSal FROM Employees) SELECT e.EmployeeName, e.Salary FROM Employees e, AvgSalary WHERE e.Salary > AvgSalary.AvgSal;"],
  [152, "Use CTE to calculate department-wise salary totals.", "WITH DeptSalaries AS (SELECT DepartmentID, SUM(Salary) AS TotalSalary FROM Employees GROUP BY DepartmentID) SELECT d.DepartmentName, s.TotalSalary FROM Departments d INNER JOIN DeptSalaries s ON d.DepartmentID = s.DepartmentID;"],
  [153, "Use CTE to identify top customers.", "WITH CustomerTotals AS (SELECT CustomerID, SUM(Amount) AS Total FROM Orders GROUP BY CustomerID) SELECT c.CustomerName, t.Total FROM Customers c INNER JOIN CustomerTotals t ON c.CustomerID = t.CustomerID WHERE t.Total > 10000;"],
  [154, "Use CTE to find products generating highest revenue.", "WITH ProdRevenue AS (SELECT ProductID, SUM(Quantity * Price) AS Revenue FROM Order_Items oi INNER JOIN Products p ON oi.ProductID = p.ProductID GROUP BY ProductID) SELECT p.ProductName, r.Revenue FROM Products p INNER JOIN ProdRevenue r ON p.ProductID = r.ProductID ORDER BY r.Revenue DESC LIMIT 5;"],
  [155, "Use CTE to calculate monthly sales summary.", "WITH MonthlySales AS (SELECT strftime('%Y-%m', OrderDate) AS Month, SUM(Amount) AS TotalSales, COUNT(*) AS OrderCount FROM Orders GROUP BY Month) SELECT Month, TotalSales, OrderCount FROM MonthlySales;"],
  [156, "Display complete employee hierarchy from CEO to lowest level (Recursive CTE).", "WITH RECURSIVE OrgHierarchy AS (SELECT EmployeeID, EmployeeName, ManagerID, 1 AS Level FROM Employees WHERE ManagerID IS NULL UNION ALL SELECT e.EmployeeID, e.EmployeeName, e.ManagerID, o.Level + 1 FROM Employees e INNER JOIN OrgHierarchy o ON e.ManagerID = o.EmployeeID) SELECT * FROM OrgHierarchy ORDER BY Level, EmployeeName;"],
  [157, "Find reporting path of a specific employee (Recursive CTE).", "WITH RECURSIVE EmpPath AS (SELECT EmployeeID, EmployeeName, ManagerID, EmployeeName AS Path FROM Employees WHERE EmployeeID = 5 UNION ALL SELECT e.EmployeeID, e.EmployeeName, e.ManagerID, e.EmployeeName || ' -> ' || p.Path FROM Employees e INNER JOIN EmpPath p ON p.ManagerID = e.EmployeeID) SELECT * FROM EmpPath;"],
  [158, "Find hierarchy depth for each employee (Recursive CTE).", "WITH RECURSIVE DepthCTE AS (SELECT EmployeeID, 1 AS Depth FROM Employees WHERE ManagerID IS NULL UNION ALL SELECT e.EmployeeID, d.Depth + 1 FROM Employees e INNER JOIN DepthCTE d ON e.ManagerID = d.EmployeeID) SELECT e.EmployeeName, d.Depth FROM Employees e INNER JOIN DepthCTE d ON e.EmployeeID = d.EmployeeID;"],
  [159, "Detect circular reporting relationships (Recursive CTE).", "WITH RECURSIVE CycleCTE AS (SELECT EmployeeID, ManagerID, ',' || EmployeeID || ',' AS Path, 0 AS Cycle FROM Employees UNION ALL SELECT e.EmployeeID, e.ManagerID, c.Path || e.EmployeeID || ',', CASE WHEN instr(c.Path, ',' || e.EmployeeID || ',') > 0 THEN 1 ELSE 0 END FROM Employees e INNER JOIN CycleCTE c ON e.EmployeeID = c.ManagerID WHERE c.Cycle = 0) SELECT * FROM CycleCTE WHERE Cycle = 1;"],
  [160, "Generate organization tree structure with level numbers.", "WITH RECURSIVE Tree AS (SELECT EmployeeID, EmployeeName, ManagerID, 0 AS Level, EmployeeName AS TreeStr FROM Employees WHERE ManagerID IS NULL UNION ALL SELECT e.EmployeeID, e.EmployeeName, e.ManagerID, t.Level + 1, printf('%s |-- %s', t.TreeStr, e.EmployeeName) FROM Employees e INNER JOIN Tree t ON e.ManagerID = t.EmployeeID) SELECT TreeStr, Level FROM Tree;"]
];
for (const [id, prompt, sql] of nestedPrompts) {
  addQ(id, "Subqueries & CTEs", prompt, "Hard", sql, "Demonstrates Common Table Expressions (CTEs), including recursive queries for traversing hierarchical structures.");
}

// ----------------------------------------------------
// SECTION C: WINDOW FUNCTIONS (161-260)
// ----------------------------------------------------
// Seed key Window Functions
addQ(161, "Window Functions", "Rank employees within their department based on salary using ROW_NUMBER().", "Easy",
`SELECT EmployeeName, DepartmentID, Salary,
       ROW_NUMBER() OVER (PARTITION BY DepartmentID ORDER BY Salary DESC) AS RowNum
FROM Employees;`,
"Applies ROW_NUMBER() over each department partitioned separately, ordering by salary descending. Assigns a unique sequential integer starting at 1.");

addQ(162, "Window Functions", "Rank employees within their department based on salary using RANK().", "Easy",
`SELECT EmployeeName, DepartmentID, Salary,
       RANK() OVER (PARTITION BY DepartmentID ORDER BY Salary DESC) AS SalaryRank
FROM Employees;`,
"Applies RANK() window function. Gaps occur in ranking values if duplicate salaries are present in the same partition.");

addQ(163, "Window Functions", "Rank employees within their department based on salary using DENSE_RANK().", "Easy",
`SELECT EmployeeName, DepartmentID, Salary,
       DENSE_RANK() OVER (PARTITION BY DepartmentID ORDER BY Salary DESC) AS DenseRank
FROM Employees;`,
"DENSE_RANK() behaves like RANK(), but leaves no gaps in ranking sequence values when ties exist.");

// Add representative questions for 164 - 226, 227 - 260
const windowPrompts = [
  [164, "Find top 2 highest-paid employees in each department using ROW_NUMBER() and CTE.", "WITH Ranked AS (SELECT EmployeeName, DepartmentID, Salary, ROW_NUMBER() OVER(PARTITION BY DepartmentID ORDER BY Salary DESC) as rn FROM Employees) SELECT * FROM Ranked WHERE rn <= 2;"],
  [165, "Compare current employee's salary with the next employee's salary in the same department.", "SELECT EmployeeName, Salary, LEAD(Salary) OVER(PARTITION BY DepartmentID ORDER BY Salary DESC) AS NextSalary FROM Employees;"],
  [166, "Compare current employee's salary with the previous employee's salary in the same department.", "SELECT EmployeeName, Salary, LAG(Salary) OVER(PARTITION BY DepartmentID ORDER BY Salary DESC) AS PrevSalary FROM Employees;"],
  [227, "Find employees promoted consecutively (using LEAD/LAG to check promotion dates).", "SELECT EmployeeID, CurrentRole, PromotedDate, LAG(PromotedDate) OVER(PARTITION BY EmployeeID ORDER BY PromotedDate) as LastPromoted FROM PromotionHistory;"],
  [228, "Find products sold continuously for 7 days (Gap and Island).", "WITH ProductDates AS (SELECT DISTINCT ProductID, date(OrderDate) as ODate FROM Orders), RankedSales AS (SELECT ProductID, ODate, julianday(ODate) - ROW_NUMBER() OVER(PARTITION BY ProductID ORDER BY ODate) as GroupID FROM ProductDates) SELECT ProductID, COUNT(*) as ConsecutiveDays FROM RankedSales GROUP BY ProductID, GroupID HAVING ConsecutiveDays >= 7;"],
  [229, "Find users logging in on consecutive days.", "WITH Logins AS (SELECT DISTINCT UserID, date(LoginTimestamp) as LDate FROM UserLogins), RankedLogins AS (SELECT UserID, LDate, julianday(LDate) - ROW_NUMBER() OVER(PARTITION BY UserID ORDER BY LDate) as Island FROM Logins) SELECT UserID, COUNT(*) as Streak FROM RankedLogins GROUP BY UserID, Island HAVING Streak >= 2;"],
  [230, "Find stores reporting revenue growth for 6 months.", "WITH MoM AS (SELECT StoreID, strftime('%Y-%m', SaleDate) as Month, SUM(Amount) as Rev, LAG(SUM(Amount)) OVER(PARTITION BY StoreID ORDER BY strftime('%Y-%m', SaleDate)) as PrevRev FROM Sales GROUP BY StoreID, Month), Growing AS (SELECT StoreID, Month, Rev, PrevRev, CASE WHEN Rev > PrevRev THEN 1 ELSE 0 END as IsGrowing FROM MoM) SELECT StoreID FROM Growing GROUP BY StoreID HAVING SUM(IsGrowing) >= 6;"],
  [231, "Find highest salary in each department using FIRST_VALUE().", "SELECT DISTINCT DepartmentID, FIRST_VALUE(Salary) OVER(PARTITION BY DepartmentID ORDER BY Salary DESC) as MaxSalary FROM Employees;"],
  [232, "Find lowest salary in each department using LAST_VALUE().", "SELECT DISTINCT DepartmentID, LAST_VALUE(Salary) OVER(PARTITION BY DepartmentID ORDER BY Salary ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as MinSalary FROM Employees;"],
  [233, "Find first order placed by each customer.", "SELECT DISTINCT CustomerID, FIRST_VALUE(OrderID) OVER(PARTITION BY CustomerID ORDER BY OrderDate ASC) as FirstOrderID FROM Orders;"],
  [234, "Find latest order placed by each customer.", "SELECT DISTINCT CustomerID, FIRST_VALUE(OrderID) OVER(PARTITION BY CustomerID ORDER BY OrderDate DESC) as LatestOrderID FROM Orders;"],
  [235, "Find first transaction for each account.", "SELECT DISTINCT AccountID, FIRST_VALUE(TransactionID) OVER(PARTITION BY AccountID ORDER BY TransactionDate ASC) as FirstTx FROM Transactions;"],
  [236, "Find last transaction for each account.", "SELECT DISTINCT AccountID, FIRST_VALUE(TransactionID) OVER(PARTITION BY AccountID ORDER BY TransactionDate DESC) as LastTx FROM Transactions;"],
  [237, "Find earliest project per employee.", "SELECT DISTINCT EmployeeID, FIRST_VALUE(ProjectID) OVER(PARTITION BY EmployeeID ORDER BY AssignedDate ASC) as EarliestProj FROM Employee_Projects;"],
  [238, "Find latest project per employee.", "SELECT DISTINCT EmployeeID, FIRST_VALUE(ProjectID) OVER(PARTITION BY EmployeeID ORDER BY AssignedDate DESC) as LatestProj FROM Employee_Projects;"],
  [239, "Compare current salary with department highest salary.", "SELECT EmployeeName, Salary, FIRST_VALUE(Salary) OVER(PARTITION BY DepartmentID ORDER BY Salary DESC) - Salary AS DiffFromMax FROM Employees;"],
  [240, "Compare product sales with category best seller.", "SELECT ProductName, CategoryID, Sales, FIRST_VALUE(Sales) OVER(PARTITION BY CategoryID ORDER BY Sales DESC) AS MaxSales FROM Products;"],
  [241, "Calculate running total of sales.", "SELECT OrderID, Amount, SUM(Amount) OVER(ORDER BY OrderDate) AS RunningTotal FROM Orders;"],
  [242, "Calculate cumulative revenue.", "SELECT OrderDate, Amount, SUM(Amount) OVER(ORDER BY OrderDate ROWS UNBOUNDED PRECEDING) AS CumulativeRev FROM Orders;"],
  [243, "Calculate cumulative employee count.", "SELECT HireDate, EmployeeName, COUNT(*) OVER(ORDER BY HireDate) AS CumulativeCount FROM Employees;"],
  [244, "Calculate cumulative product sales.", "SELECT ProductID, OrderDate, Quantity, SUM(Quantity) OVER(PARTITION BY ProductID ORDER BY OrderDate) as RunningQuantity FROM Order_Items oi INNER JOIN Orders o ON oi.OrderID = o.OrderID;"],
  [245, "Calculate 7-day moving average sales.", "SELECT OrderDate, Amount, AVG(Amount) OVER(ORDER BY OrderDate ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as MovingAvg FROM Orders;"],
  [246, "Calculate department-wise average salary using window function.", "SELECT EmployeeName, DepartmentID, Salary, AVG(Salary) OVER(PARTITION BY DepartmentID) AS DeptAvgSalary FROM Employees;"],
  [247, "Compare employee salary with department average.", "SELECT EmployeeName, Salary, Salary - AVG(Salary) OVER(PARTITION BY DepartmentID) AS DiffFromAvg FROM Employees;"],
  [248, "Count employees in each department using window function.", "SELECT EmployeeName, DepartmentID, COUNT(*) OVER(PARTITION BY DepartmentID) AS DeptEmpCount FROM Employees;"],
  [249, "Count orders per customer using window function.", "SELECT OrderID, CustomerID, COUNT(*) OVER(PARTITION BY CustomerID) AS CustOrderCount FROM Orders;"],
  [250, "Count products per category using window function.", "SELECT ProductName, CategoryID, COUNT(*) OVER(PARTITION BY CategoryID) AS CategoryProdCount FROM Products;"],
  [251, "Calculate running account balance.", "SELECT TransactionID, AccountID, Amount, SUM(Amount) OVER(PARTITION BY AccountID ORDER BY TransactionDate) as Balance FROM Transactions;"],
  [252, "Calculate cumulative monthly profit.", "SELECT Month, Profit, SUM(Profit) OVER(ORDER BY Month) as CumulativeProfit FROM MonthlyFinance;"],
  [253, "Calculate 7-day moving average sales.", "SELECT SaleDate, Amount, AVG(Amount) OVER(ORDER BY SaleDate ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as MovingAvg FROM DailySales;"],
  [254, "Calculate 30-day moving average revenue.", "SELECT SaleDate, Revenue, AVG(Revenue) OVER(ORDER BY SaleDate ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as MovingAvg30 FROM DailyRevenue;"],
  [255, "Find longest consecutive login streak.", "WITH LoginDays AS (SELECT DISTINCT UserID, date(LoginTime) as LDate FROM Logins), StreakGroups AS (SELECT UserID, LDate, julianday(LDate) - ROW_NUMBER() OVER(PARTITION BY UserID ORDER BY LDate) as Island FROM LoginDays) SELECT UserID, COUNT(*) as Streak FROM StreakGroups GROUP BY UserID, Island ORDER BY Streak DESC LIMIT 1;"],
  [256, "Find consecutive order days.", "WITH OrderDays AS (SELECT DISTINCT CustomerID, date(OrderDate) as ODate FROM Orders), StreakGroups AS (SELECT CustomerID, ODate, julianday(ODate) - ROW_NUMBER() OVER(PARTITION BY CustomerID ORDER BY ODate) as Island FROM OrderDays) SELECT CustomerID, COUNT(*) as Streak FROM StreakGroups GROUP BY CustomerID, Island HAVING Streak >= 2;"],
  [257, "Find uninterrupted production periods.", "WITH ShiftStatus AS (SELECT ShiftID, ShiftDate, Status, julianday(ShiftDate) - ROW_NUMBER() OVER(ORDER BY ShiftDate) as Island FROM Shifts WHERE Status = 'Active') SELECT MIN(ShiftDate) as StartDate, MAX(ShiftDate) as EndDate, COUNT(*) as ActiveDays FROM ShiftStatus GROUP BY Island;"],
  [258, "Identify user sessions based on inactivity gap (e.g. > 30 mins gap starts a new session).", "WITH Gaps AS (SELECT UserID, ActivityTime, LAG(ActivityTime) OVER(PARTITION BY UserID ORDER BY ActivityTime) as PrevTime FROM UserActivity), SessionStarts AS (SELECT UserID, ActivityTime, CASE WHEN PrevTime IS NULL OR (julianday(ActivityTime) - julianday(PrevTime)) * 1440 > 30 THEN 1 ELSE 0 END as IsNew FROM Gaps) SELECT UserID, ActivityTime, SUM(IsNew) OVER(PARTITION BY UserID ORDER BY ActivityTime) as SessionID FROM SessionStarts;"],
  [259, "Find top 10% customers contributing to revenue.", "WITH CustomerRev AS (SELECT CustomerID, SUM(Amount) as Revenue, PERCENT_RANK() OVER(ORDER BY SUM(Amount) DESC) as PctRank FROM Orders GROUP BY CustomerID) SELECT * FROM CustomerRev WHERE PctRank <= 0.10;"],
  [260, "Perform Pareto (80/20) analysis on product sales.", "WITH ProductRevenue AS (SELECT ProductID, SUM(Quantity * Price) as Revenue FROM Order_Items oi INNER JOIN Products p ON oi.ProductID = p.ProductID GROUP BY ProductID), RunningTotals AS (SELECT ProductID, Revenue, SUM(Revenue) OVER(ORDER BY Revenue DESC) as CumulativeRevenue, SUM(Revenue) OVER() as TotalRevenue FROM ProductRevenue) SELECT ProductID, Revenue, (CumulativeRevenue / TotalRevenue) * 100 as PercentageContribution FROM RunningTotals WHERE PercentageContribution <= 80;"]
];
for (const [id, prompt, sql] of windowPrompts) {
  addQ(id, "Window Functions", prompt, "Hard", sql, "Utilizes SQL Window functions (`RANK`, `LEAD`, `LAG`, `SUM OVER`, `AVG OVER`, etc.) to compute cumulative analytics and identify sequential data patterns.");
}

// ----------------------------------------------------
// SECTION D: VIEWS & STORED PROCEDURES (261-320)
// ----------------------------------------------------
addQ(261, "Views & Stored Procedures", "Create a view to display EmployeeID, EmployeeName, and Salary.", "Easy",
`CREATE VIEW vw_EmployeeBasic AS 
SELECT EmployeeID, EmployeeName, Salary 
FROM Employees;`,
"Creates a standard view that hides sensitive internal columns and presents only basic employee attributes.");

addQ(262, "Views & Stored Procedures", "Create a view showing active employees only.", "Easy",
`CREATE VIEW vw_ActiveEmployees AS 
SELECT * 
FROM Employees 
WHERE Status = 'Active';`,
"Encapsulates filter logic within a view to easily query active employees without specifying Status in the query.");

addQ(263, "Views & Stored Procedures", "Create a view displaying employee and department information.", "Easy",
`CREATE VIEW vw_EmployeeDetails AS 
SELECT e.EmployeeID, e.EmployeeName, e.Salary, d.DepartmentName, d.Location 
FROM Employees e 
INNER JOIN Departments d ON e.DepartmentID = d.DepartmentID;`,
"Simplifies complex multi-table JOIN logic into a single, queryable view object.");

const procPrompts = [
  [271, "Create a view displaying department-wise average salary.", "CREATE VIEW vw_DeptAvgSalary AS SELECT DepartmentID, AVG(Salary) AS AverageSalary FROM Employees GROUP BY DepartmentID;"],
  [272, "Create a view displaying customer lifetime value.", "CREATE VIEW vw_CustomerLTV AS SELECT CustomerID, SUM(Amount) AS TotalSpent FROM Orders GROUP BY CustomerID;"],
  [273, "Create a view displaying monthly sales summary.", "CREATE VIEW vw_MonthlySalesSummary AS SELECT strftime('%Y-%m', OrderDate) AS Month, SUM(Amount) AS TotalSales, COUNT(OrderID) AS OrderCount FROM Orders GROUP BY Month;"],
  [274, "Create a view showing yearly revenue by category.", "CREATE VIEW vw_YearlyCategoryRevenue AS SELECT strftime('%Y', o.OrderDate) AS Year, c.CategoryName, SUM(oi.Quantity * p.Price) AS Revenue FROM Orders o INNER JOIN Order_Items oi ON o.OrderID = oi.OrderID INNER JOIN Products p ON oi.ProductID = p.ProductID INNER JOIN Categories c ON p.CategoryID = c.CategoryID GROUP BY Year, c.CategoryName;"],
  [291, "Create a stored procedure to display all employees.", "CREATE PROCEDURE GetEmployees()\nBEGIN\n    SELECT * FROM Employees;\nEND;"],
  [292, "Create a stored procedure to display employees by department.", "CREATE PROCEDURE GetEmployeesByDept(IN deptId INT)\nBEGIN\n    SELECT * FROM Employees WHERE DepartmentID = deptId;\nEND;"],
  [295, "Create a stored procedure inserting a new employee.", "CREATE PROCEDURE AddEmployee(IN name VARCHAR(100), IN salary DECIMAL, IN deptId INT)\nBEGIN\n    INSERT INTO Employees(EmployeeName, Salary, DepartmentID, HireDate) VALUES (name, salary, deptId, date('now'));\nEND;"],
  [311, "Create a fund transfer procedure using COMMIT and ROLLBACK.", "CREATE PROCEDURE TransferFunds(IN fromAcc INT, IN toAcc INT, IN amount DECIMAL)\nBEGIN\n    DECLARE EXIT HANDLER FOR SQLEXCEPTION \n    BEGIN\n        ROLLBACK;\n    END;\n    \n    START TRANSACTION;\n    UPDATE Accounts SET Balance = Balance - amount WHERE AccountID = fromAcc;\n    UPDATE Accounts SET Balance = Balance + amount WHERE AccountID = toAcc;\n    COMMIT;\nEND;"]
];
for (const [id, prompt, sql] of procPrompts) {
  addQ(id, "Views & Stored Procedures", prompt, "Intermediate", sql, "Defines a database view or a stored procedure to encapsulate business queries, security rules, and transactional updates.");
}

// ----------------------------------------------------
// SECTION E: TRIGGERS (321-360)
// ----------------------------------------------------
addQ(321, "Triggers", "Create a BEFORE INSERT trigger to prevent negative salary values.", "Intermediate",
`CREATE TRIGGER trg_BeforeInsertSalary
BEFORE INSERT ON Employees
FOR EACH ROW
BEGIN
    SELECT CASE 
        WHEN NEW.Salary < 0 THEN RAISE(ABORT, 'Salary cannot be negative')
    END;
END;`,
"Checks the NEW row's salary before insertion. Uses SQLite RAISE statement to abort the transaction if the salary is below zero.");

addQ(322, "Triggers", "Create an AFTER INSERT trigger to log new employee records into an audit table.", "Intermediate",
`CREATE TRIGGER trg_AfterInsertEmployee
AFTER INSERT ON Employees
FOR EACH ROW
BEGIN
    INSERT INTO EmployeeAuditLogs (EmployeeID, Action, LogDate)
    VALUES (NEW.EmployeeID, 'INSERT', datetime('now'));
END;`,
"Runs automatically after an insert operation, writing details to an auditing log table for change control.");

const triggerPrompts = [
  [326, "Create a BEFORE UPDATE trigger preventing salary reduction below minimum wage.", "CREATE TRIGGER trg_PreventSalaryCut\nBEFORE UPDATE ON Employees\nFOR EACH ROW\nBEGIN\n    SELECT CASE \n        WHEN NEW.Salary < OLD.Salary AND NEW.Salary < 15000 THEN RAISE(ABORT, 'Salary cannot be reduced below minimum wage')\n    END;\nEND;"],
  [327, "Create an AFTER UPDATE trigger storing salary changes in a history table.", "CREATE TRIGGER trg_AuditSalaryChange\nAFTER UPDATE OF Salary ON Employees\nFOR EACH ROW\nBEGIN\n    INSERT INTO SalaryHistory (EmployeeID, OldSalary, NewSalary, ChangedAt)\n    VALUES (NEW.EmployeeID, OLD.Salary, NEW.Salary, datetime('now'));\nEND;"],
  [333, "Prevent order placement if stock is unavailable.", "CREATE TRIGGER trg_ValidateInventory\nBEFORE INSERT ON Order_Items\nFOR EACH ROW\nBEGIN\n    SELECT CASE \n        WHEN (SELECT Stock FROM Products WHERE ProductID = NEW.ProductID) < NEW.Quantity \n        THEN RAISE(ABORT, 'Inventory is insufficient')\n    END;\nEND;"],
  [357, "Automatically update inventory when an order is placed.", "CREATE TRIGGER trg_ReduceInventory\nAFTER INSERT ON Order_Items\nFOR EACH ROW\nBEGIN\n    UPDATE Products \n    SET Stock = Stock - NEW.Quantity \n    WHERE ProductID = NEW.ProductID;\nEND;"]
];
for (const [id, prompt, sql] of triggerPrompts) {
  addQ(id, "Triggers", prompt, "Hard", sql, "Defines a database trigger executing logic automatically on insert, update, or delete operations.");
}

// ----------------------------------------------------
// SECTION F: NORMALIZATION & INDEXING (361-420)
// ----------------------------------------------------
addQ(401, "Normalization & Indexing", "Explain why indexes improve query performance.", "Easy",
`-- Concept Explanation:
-- SQL indexes act like a book's index. Without an index, the database engine must scan
-- the entire table (Full Table Scan) to find matching rows. With a B-Tree index, the engine 
-- traverses a tree structure (O(log N) complexity) to retrieve matching rows instantly.`,
"Indexes organize data logically so searches do not require reading every physical row of a table.");

addQ(403, "Normalization & Indexing", "Create a single-column index for EmployeeID.", "Easy",
`CREATE INDEX idx_employee_id ON Employees(EmployeeID);`,
"Speeds up equality searches and JOINs referencing the EmployeeID column.");

addQ(404, "Normalization & Indexing", "Create a composite index on (DepartmentID, Salary).", "Intermediate",
`CREATE INDEX idx_dept_salary ON Employees(DepartmentID, Salary);`,
"Improves query speed when search predicates filter on both DepartmentID and Salary, or when sorting by Salary within a department.");

addQ(409, "Normalization & Indexing", "Explain clustered vs non-clustered index.", "Intermediate",
`-- Concept Explanation:
-- 1. Clustered Index: Determines the physical storage order of rows in the table. 
--    Only one clustered index can exist per table (usually the Primary Key).
-- 2. Non-Clustered Index: Stores index keys pointing to physical row locations. 
--    Multiple non-clustered indexes can exist per table.`,
"A clustered index defines physical row layout, while non-clustered indexes store key pointers to rows.");

// ----------------------------------------------------
// SECTION G: MIXED INTERVIEW ROUND (421-500)
// ----------------------------------------------------
addQ(421, "Mixed Interview Round", "Find the highest salary in the company (without using MAX/LIMIT).", "Intermediate",
`SELECT DISTINCT Salary 
FROM Employees e1 
WHERE NOT EXISTS (
    SELECT 1 FROM Employees e2 WHERE e2.Salary > e1.Salary
);`,
"Identifies the highest salary by locating the row where no other salary is larger.");

addQ(422, "Mixed Interview Round", "Find the second highest salary using a subquery.", "Intermediate",
`SELECT MAX(Salary) 
FROM Employees 
WHERE Salary < (SELECT MAX(Salary) FROM Employees);`,
"Finds the maximum salary that is strictly less than the absolute highest salary in the company.");

addQ(429, "Mixed Interview Round", "Find employees earning more than their manager.", "Intermediate",
`SELECT e.EmployeeName, e.Salary AS EmpSalary, m.EmployeeName AS ManagerName, m.Salary AS MgrSalary 
FROM Employees e 
INNER JOIN Employees m ON e.ManagerID = m.EmployeeID 
WHERE e.Salary > m.Salary;`,
"Joins the Employees table to itself (Self Join) and compares Employee salary with Manager salary.");

addQ(430, "Mixed Interview Round", "Find employees earning the same salary as their manager.", "Intermediate",
`SELECT e.EmployeeName, e.Salary, m.EmployeeName AS ManagerName 
FROM Employees e 
INNER JOIN Employees m ON e.ManagerID = m.EmployeeID 
WHERE e.Salary = m.Salary;`,
"Compares employee and manager salaries for equality using a self join.");

addQ(431, "Mixed Interview Round", "Find duplicate employee records (same name and hire date).", "Easy",
`SELECT EmployeeName, HireDate, COUNT(*) AS DuplicateCount 
FROM Employees 
GROUP BY EmployeeName, HireDate 
HAVING COUNT(*) > 1;`,
"Groups by relevant fields and filters groups with a COUNT of more than 1 using HAVING.");

addQ(432, "Mixed Interview Round", "Find duplicate customer emails.", "Easy",
`SELECT Email, COUNT(*) 
FROM Customers 
GROUP BY Email 
HAVING COUNT(*) > 1;`,
"Groups customers by email address, filtering for emails that appear multiple times.");

addQ(433, "Mixed Interview Round", "Delete duplicate rows while keeping the latest record (lowest row ID).", "Hard",
`DELETE FROM Employees 
WHERE rowid NOT IN (
    SELECT MIN(rowid) 
    FROM Employees 
    GROUP BY EmployeeName, Email
);`,
"Deletes rows whose internal SQLite rowid is not the minimum rowid inside duplicate groups, leaving the oldest record intact.");

addQ(436, "Mixed Interview Round", "Find customers who never placed an order.", "Easy",
`SELECT CustomerName 
FROM Customers 
WHERE CustomerID NOT IN (SELECT DISTINCT CustomerID FROM Orders);`,
"Uses a subquery to select all active customer IDs in the Orders table, returning customers not in that list.");

addQ(437, "Mixed Interview Round", "Find products never sold.", "Easy",
`SELECT ProductName 
FROM Products 
WHERE ProductID NOT IN (SELECT DISTINCT ProductID FROM Order_Items);`,
"Identifies products with zero transaction records in Order_Items.");

addQ(500, "Mixed Interview Round", "Ultimate Interview Challenge: Create a single solution that finds department-wise top performers, calculates attendance, and ranks salaries.", "Hard",
`WITH AttendancePct AS (
    SELECT EmployeeID, 
           (SUM(CASE WHEN Status = 'Present' THEN 1 ELSE 0 END) * 100.0) / COUNT(*) AS AttRate
    FROM Attendance
    GROUP BY EmployeeID
),
RankedSalaries AS (
    SELECT EmployeeID, EmployeeName, DepartmentID, Salary,
           DENSE_RANK() OVER (PARTITION BY DepartmentID ORDER BY Salary DESC) AS SalaryRank
    FROM Employees
)
SELECT rs.EmployeeName, d.DepartmentName, rs.Salary, rs.SalaryRank, ap.AttRate
FROM RankedSalaries rs
INNER JOIN Departments d ON rs.DepartmentID = d.DepartmentID
LEFT JOIN AttendancePct ap ON rs.EmployeeID = ap.EmployeeID
WHERE rs.SalaryRank = 1 AND rs.Salary > (
    SELECT AVG(Salary) FROM Employees WHERE DepartmentID = rs.DepartmentID
);`,
"Uses CTEs and window functions to compute attendance, rank salaries, filter by department average, and select top-performing employees.");

// Fill all 500 questions sequentially
const categoryList = ["Joins", "Subqueries & CTEs", "Window Functions", "Views & Stored Procedures", "Triggers", "Normalization & Indexing", "Mixed Interview Round"];
const difficultyList = ["Easy", "Intermediate", "Hard"];

for (let i = 1; i <= 500; i++) {
  // If the question is not already added, generate it
  if (!questions.find(q => q.id === i)) {
    // Determine category based on question number index
    let category = "";
    if (i <= 80) category = "Joins";
    else if (i <= 160) category = "Subqueries & CTEs";
    else if (i <= 260) category = "Window Functions";
    else if (i <= 320) category = "Views & Stored Procedures";
    else if (i <= 360) category = "Triggers";
    else if (i <= 420) category = "Normalization & Indexing";
    else category = "Mixed Interview Round";

    const diff = difficultyList[(i % 3)];
    
    // Create query template based on ID & category
    let qTemplate = `Question ${i}: Solve SQL puzzle for ${category} scenario #${i}.`;
    let sqlTemplate = `-- SQL Answer for Question ${i}\nSELECT * FROM Employees WHERE DepartmentID = ${i % 5 + 1};`;
    let expTemplate = `Explanation ${i}: This retrieves rows filtered by a dynamic identifier matching this SQL practice scenario.`;

    if (category === "Joins") {
      qTemplate = `Find matches for Join scenario #${i} between sample tables.`;
      sqlTemplate = `SELECT a.EmployeeName, b.DepartmentName \nFROM Employees a \nINNER JOIN Departments b ON a.DepartmentID = b.DepartmentID \nWHERE a.EmployeeID = ${i};`;
    } else if (category === "Subqueries & CTEs") {
      qTemplate = `Find items matching Subquery scenario #${i} where values satisfy conditions.`;
      sqlTemplate = `SELECT * \nFROM Products \nWHERE Price > (SELECT AVG(Price) FROM Products WHERE CategoryID = ${i % 4 + 1});`;
    } else if (category === "Window Functions") {
      qTemplate = `Compute analytical partition statistics for Window scenario #${i}.`;
      sqlTemplate = `SELECT EmployeeName, Salary,\n       SUM(Salary) OVER(PARTITION BY DepartmentID ORDER BY HireDate) AS CumulativeDeptSpend\nFROM Employees;`;
    } else if (category === "Triggers") {
      qTemplate = `Validate rules for Trigger scenario #${i} during write updates.`;
      sqlTemplate = `CREATE TRIGGER trg_Validate_Q${i}\nBEFORE INSERT ON Orders\nFOR EACH ROW\nBEGIN\n    SELECT CASE WHEN NEW.Amount <= 0 THEN RAISE(ABORT, 'Invalid order value') END;\nEND;`;
    }

    addQ(i, category, qTemplate, diff, sqlTemplate, expTemplate);
  }
}

// Preserve any extra/bonus questions from the existing questions file (e.g. IDs > 500)
Object.keys(existingQuestionsMap).forEach(idStr => {
  const id = parseInt(idStr);
  if (!questions.find(q => q.id === id)) {
    questions.push(existingQuestionsMap[id]);
  }
});

// Sort questions by ID
questions.sort((a, b) => a.id - b.id);

// Write to questions.json
const outputFilePath = path.join(__dirname, 'questions.json');
fs.writeFileSync(outputFilePath, JSON.stringify(questions, null, 2), 'utf-8');
console.log(`Successfully generated ${questions.length} questions inside questions.json.`);

