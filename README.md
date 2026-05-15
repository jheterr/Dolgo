# MustBerryFi
### Coworking Space Facility and Event Management System
An enterprise-grade facility management system for coworking hubs and shared spaces

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

Overview
MustBerryFi streamlines workspace booking, scheduling, and administration through an intuitive interface designed for multi-user environments. Specifically built for The Last Muster coworking hub, MustBerryFi provides real-time seat availability tracking, automated door access logging, and comprehensive management tools.

Core Use Cases
Facility Administrators – Manage user permissions, approved registrations, and system-wide analytics
Staff Members – Process payments, assign walk-in seats, and monitor facility security
Customers – Browse the interactive floor plan, reserve seats, and manage memberships

Key Advantages
Prevent Double-Bookings – Real-time conflict detection for seat reservations
Automate Operations – Digital approval workflows reduce manual administrative overhead
Data-Driven Decisions – Comprehensive analytics on revenue and facility utilization
Facility Security – Integrated door access logging with RFID support

Quick Start
Get MustBerryFi running in 5 minutes:

# 1. Clone and navigate
git clone https://github.com/USER/MustBerryFi.git
cd Dolgo

# 2. Install dependencies
npm install

# 3. Setup database
# Create a MySQL database named 'dolgo_db'
# Import cleaned_dolgo_db.sql into your database

# 4. Start the application
node app.js
# OR
npm start
# Access at http://localhost:3000


Default Credentials:

### Administrator
- **Email:** `thelastmuster@gmail.com`
- **Password:** `admin1234`

### Staff Accounts
- **Belle**: `belle.staff@randomplay.com` / `belle1234`
- **Wise**: `wise.staff@randomplay.com` / `wise1234`

### Customer Accounts
- **Anby Demara**: `anby@neweridu.com` / `anby1234`
- **Nicole Demara**: `nicole@neweridu.com` / `nicole1234`
- **Billy Kid**: `billy@neweridu.com` / `billy1234`
- **Jane Doe**: `jane@neweridu.com` / `jane1234`
- **Ellen Joe**: `ellen@neweridu.com` / `ellen1234`


Screenshots
Dashboard Overview
The admin dashboard provides real-time insights with:
System metrics and usage analytics
Active session tracking
Revenue breakdown
User activity logs

Facility Booking Interface
Interactive digital floor plan
Real-time seat status visualization
Dynamic pricing calculation
Booking confirmation workflow

Door Management
Facility access logs
Manual lock override controls
RFID method tracking
Timestamped security events

Key Features
Reservation Management
Real-time availability checking with interactive floor plan
Automatic conflict detection for date and time slots
Support for both members and walk-in customers
Flexible payment options (GCash and Cashier)
Automatic session timers and seat status updates

Facility Management
Dynamic floor plan layout rendering
Real-time seat status monitoring (Available, Taken, Reserved, Idle)
Door access control and magnetic lock integration
Detailed facility usage logging

User Management
Three role-based access levels (Admin, Staff, Customer)
Granular registration approval workflow
Account status management (Active, Pending, Suspended)
Profile and device MAC address management

Billing & Pricing
Integrated cost calculation for seat rentals
Support for multiple payment methods
Revenue tracking and income breakdown analytics
Payment verification workflow for staff

Admin Dashboard
Unified command center for facility oversight
User administration and status control
System-wide activity logging
Exportable reports and data visualization

Requirements
System Requirements
Node.js 14.0 or newer
MySQL 8.0 or newer
NPM (latest version)

Required Node.js Packages
express – Web framework
ejs – Template engine
mysql2 – Database driver
bcrypt – Password hashing
express-session – Session management

Installation
1. Clone the Repository
git clone https://github.com/haportugal-dev/Dolgo.git
cd Dolgo

2. Install Dependencies
npm install

3. Configure Database
Ensure your MySQL server is running and create the database:
mysql -u root -p -e "CREATE DATABASE dolgo_db;"

Import the schema:
mysql -u root -p dolgo_db < cleaned_dolgo_db.sql

4. Update Configuration
Update the database connection details in db.js:
host: 'localhost',
user: 'root',
password: 'your_password',
database: 'dolgo_db'

5. Start Server
node app.js
# OR
npm start
Access the application at http://localhost:3000


Configuration
Database Setup
Configure your database connection in db.js:
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'dolgo_db'
});

User Roles & Permissions
Role Access Level Primary Functions
Admin Full System administration, user approval, revenue analytics
Staff High Payment processing, walk-in assignment, door control
Customer Medium Seat booking, membership management, profile updates

API Documentation
Base URL
http://localhost:3000/api

Core Endpoints
Facilities
GET /api/layout # Get current floor plan and statuses
GET /api/availability # Check seat availability for specific times

Bookings
POST /customer/reserve # Create new seat reservation
POST /api/session/start # Start an active session (Staff)

Database Schema
Core Tables
users – User accounts and authentication
floor_elements – Individual seat and furniture data
floor_plans – Global workspace layouts
reservations – Booking and payment records
active_sessions – Real-time usage tracking
door_access_logs – Security and entry logs

Security
The application implements industry-standard security practices:
Authentication – Secure login with role-based redirection
Authorization – Protected routes via authentication middleware
Input Validation – Server-side validation for all forms
Password Security – Bcrypt hashing for all user credentials
Session Security – Secure express-session management

Project Structure
Dolgo/
├── bin/ # Server execution scripts
├── middleware/ # Auth and permission filters
├── public/ # Static assets (CSS, JS, Images)
├── routes/ # Role-based route handlers
├── views/ # EJS template engine files
│ ├── admin/ # Administrator views
│ ├── staff/ # Staff member views
│ ├── customer/ # Customer/Member views
│ ├── partials/ # Reusable UI components
│ └── layouts/ # Main page wrappers
├── app.js # Application configuration
├── server.js # HTTP server entry point
├── db.js # Database connection pool
├── package.json # Project dependencies
└── cleaned_dolgo_db.sql # Database schema

## Development Team
**Team Dolgo:**
* **Frongoso, Nonito V. Jr.**
* **Libed, Menard L.**
* **Parpan, Jheter T.**
* **Portugal, Harold Rey C.**
* **Prades, Andrei P.**

## License
This project is licensed under the MIT License.