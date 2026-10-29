# Nexus Care Hospital Management System (College Java Mini Project)

## Project Overview
This is a comprehensive Java Project demonstrating Object-Oriented Programming (OOP) and Desktop GUI design using **Core Java + Java Swing (`JFrame`, `JTable`)** along with optional **JDBC + MySQL Database** connectivity for university/college submissions, laboratory evaluations, and vivas.

---

## 🖥️ 1. Core Java Swing Desktop Application (`HospitalSwingApp.java`)
A complete, self-contained, native desktop application built with standard Java libraries (`javax.swing.*`, `java.awt.*`). No external frameworks (Spring Boot, HTML, or web servers) required!

### Core Features Included:
1. **📊 Executive Dashboard (`JFrame` Tab 1)**:
   - Live KPI metric cards: Total Patients Registered, Admitted Inpatients, Active Outpatients, Available Doctors, Hospital Bed Capacity (10 Beds), and Total Clinical Revenue.
   - Quick action shortcuts (Direct patient registration, Doctor directory, Bed allocation).
   - Real-time SQL execution mapping console and operational summary reports.
2. **📝 Patient Registration & Records (`JTable` Tab 2)**:
   - Full registration form with fields: Full Name, Age, Gender, Phone, Blood Group, Chief Complaint/Syndrome, and Admission Status.
   - Automatic unique ID generation (`PAT-1001`, `PAT-1002`, etc.) with strict validation.
   - Interactive `JTable` with live multi-column search (`TableRowSorter`) and status filtering.
   - **3-in-1 Discharge Action**: Updates patient to `Discharged`, releases bed to `Available`, and clears billing.
3. **👨‍⚕️ Doctor Directory & Roster (`JTable` Tab 3)**:
   - Multi-specialty doctor roster: Cardiology, Neurology, Orthopedics, Pediatrics, General Medicine, Dermatology.
   - Specialty and operational status filter dropdowns.
   - "Add New Doctor" dialog with automatic ID generation (`DOC-101`, etc.).
   - Interactive doctor status toggle ("Available", "In Consultation", "On Leave").

### How to Compile and Run Swing App:
Open your terminal / command prompt in the `java-hospital-project` directory:
```bash
# Compile with standard JDK compiler:
javac HospitalSwingApp.java

# Run the desktop window:
java HospitalSwingApp
```

---

## 🗄️ 2. Console & JDBC Architecture (`src/com/medicare/`)
- **`com.medicare.swing.HospitalSwingApp`**: Packaged Swing Desktop application.
- **`com.medicare.HospitalManagementSystem`**: CLI Console entry point with multi-role authentication.
- **`com.medicare.modules.AdminModule`**: Staff INSERT/DELETE credentials, operations monitoring, and discharged patient history.
- **`com.medicare.modules.ReceptionistModule`**: Patient INSERT, Appointment booking, Bed allocation UPDATE, and 3-in-1 Atomic Discharge.
- **`com.medicare.modules.DoctorModule`**: Daily schedule SELECT, medical history search by Patient ID, and prescription UPDATE.
- **`com.medicare.db.DBConnection`**: JDBC Connection manager for MySQL (`hospital_db`).

---

## How to Run in Eclipse / IntelliJ / NetBeans
1. Open Eclipse, IntelliJ IDEA, NetBeans, or VS Code.
2. Choose **Open Project** -> Select the `java-hospital-project` folder.
3. Run `HospitalSwingApp.java` directly as a **Java Application**.
4. (Optional for MySQL):
   - Import `schema.sql` into your local MySQL server (`mysql -u root -p < schema.sql`).
   - Add `mysql-connector-j.jar` to project build path.
   - Run `HospitalManagementSystem.java`.

---

## Sample Credentials for Viva Demo
- **Admin**: `admin@medicare.com` / `admin123`
- **Receptionist**: `reception@medicare.com` / `reception123`
- **Doctor**: `alok.nath@medicare.com` / `doctor123`
