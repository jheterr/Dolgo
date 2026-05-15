# QA Test Checklist - The Last Muster

This document outlines the core functional tests that must be performed to ensure the system is production-ready.

## 1. Authentication & Security
- [ ] **Admin Login:** Access `thelastmuster@gmail.com` and verify redirection to the Admin Dashboard.
- [ ] **Staff Login:** Access `belle.staff@randomplay.com` and verify access to operational tools.
- [ ] **Customer Login:** Access a member account and verify the personalized landing/reservation page.
- [ ] **Logout:** Ensure session is cleared and user is redirected to the login page.
- [ ] **Registration:** Create a new customer account and verify it appears in the Admin "Users Management" list.

## 2. Analytics & Reporting (Admin Only)
- [ ] **Metric Accuracy:** Verify "Since Establishment" and "Weekly Summary" cards show non-zero data.
- [ ] **Charts:** Ensure "Customer Traffic" and "Income Overview" charts render correctly.
- [ ] **Table Sorting:** Click table headers (Date, Amount, Status) to verify ascending/descending sorts.
- [ ] **Table Search:** Use the search bar to filter by customer name or door location.
- [ ] **Export CSV:** Click the button, configure filters in the modal, and verify the downloaded file contains correct data.
- [ ] **Export PDF:** Click the button, configure filters, and verify the print preview is clean (no sidebar/buttons).

## 3. Seat Management (Admin & Staff)
- [ ] **Floor Plan View:** Verify the interactive map shows seats as "Available" or "Taken".
- [ ] **Assign Seat:** Select an available seat, choose a customer from the dropdown, and confirm.
- [ ] **Session Tracking:** Verify the seat color changes and the customer's name appears on the seat.
- [ ] **End Session:** Select a "Taken" seat, click "End Session," and verify the seat returns to "Available" status.

## 4. Door Management
- [ ] **Access Logs:** Verify that door entry/exit events are recorded with the correct timestamp.
- [ ] **Real-time Monitoring:** Ensure new logs appear correctly without manually refreshing the whole page if possible.

## 5. Reservations & User Management
- [ ] **Create Reservation:** As a customer, book a specific time/date and verify it appears in the system.
- [ ] **Member List:** Check if the Admin can view and distinguish between Members and Walk-ins.
- [ ] **Staff List:** Ensure all staff members are listed and editable.

## 6. UI & Responsive Design
- [ ] **Sidebar Navigation:** Verify all links lead to the correct pages.
- [ ] **Mobile View:** Open the dashboard on a mobile screen and check the "Hamburger Menu" and stackable grid layouts.
- [ ] **Glassmorphism Effects:** Ensure the premium aesthetic (blur, gradients) is consistent across pages.

---
**Note:** Report any console errors (F12) or layout breaks immediately to the development team.
