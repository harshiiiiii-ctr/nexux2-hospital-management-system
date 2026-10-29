-- =======================================================================
-- NEXUS CARE HOSPITAL MANAGEMENT SYSTEM - COLLEGE MINI PROJECT
-- Technology Stack: Java (Core Java + JDBC) + MySQL Database
-- =======================================================================

CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- 1. Doctors Table
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS beds;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS receptionists;
DROP TABLE IF EXISTS doctors;

CREATE TABLE doctors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    consultation_fee DOUBLE DEFAULT 500.0,
    availability_status VARCHAR(50) DEFAULT 'Available',
    qualifications VARCHAR(100) DEFAULT 'MBBS, MD',
    experience_years INT DEFAULT 5,
    room_number VARCHAR(50) DEFAULT 'OPD-101',
    shift_timing VARCHAR(50) DEFAULT '09:00 - 17:00',
    break_timing VARCHAR(100) DEFAULT '13:00 - 14:00 (Lunch Break)',
    join_date DATE DEFAULT (CURDATE()),
    resignation_reason VARCHAR(255) NULL,
    relieved_date DATE NULL
);

-- 2. Receptionists Table
CREATE TABLE receptionists (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    shift VARCHAR(50) DEFAULT 'Morning',
    desk_number VARCHAR(50) DEFAULT 'Counter A-1',
    duty_status VARCHAR(50) DEFAULT 'On Duty',
    shift_timing VARCHAR(50) DEFAULT '08:00 - 14:00',
    break_timing VARCHAR(100) DEFAULT '11:30 - 12:00 (Tea & Lunch)',
    join_date DATE DEFAULT (CURDATE()),
    resignation_reason VARCHAR(255) NULL,
    relieved_date DATE NULL
);

-- 3. Users Table (Authentication Credentials)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'admin', 'doctor', 'receptionist'
    doctor_id VARCHAR(50) NULL,
    phone VARCHAR(20) NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

-- 4. Inpatient Beds Table
CREATE TABLE beds (
    id VARCHAR(50) PRIMARY KEY,
    bed_number VARCHAR(50) NOT NULL UNIQUE,
    ward VARCHAR(100) NOT NULL, -- 'General Ward A', 'ICU - Intensive Care', 'Semi-Private Wing', 'Deluxe Private Suite'
    daily_charge DOUBLE DEFAULT 800.0,
    status VARCHAR(50) DEFAULT 'Available', -- 'Available', 'Occupied', 'Maintenance'
    patient_id VARCHAR(50) NULL,
    patient_name VARCHAR(100) NULL,
    allocated_date DATE NULL
);

-- 5. Patients Table
CREATE TABLE patients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    syndrome VARCHAR(100) NOT NULL,
    blood_group VARCHAR(10) DEFAULT 'O+',
    admission_status VARCHAR(50) DEFAULT 'Outpatient', -- 'Outpatient', 'Admitted', 'Discharged'
    registered_date DATE DEFAULT (CURDATE()),
    admitted_date DATE NULL,
    discharged_date DATE NULL,
    bed_id VARCHAR(50) NULL,
    bed_number VARCHAR(50) NULL,
    treating_doctor_id VARCHAR(50) NULL,
    disease_name VARCHAR(150) NULL,
    discharge_summary TEXT NULL,
    total_billed_amount DOUBLE DEFAULT 0.0,
    FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL,
    FOREIGN KEY (treating_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

-- 6. Appointments Table
CREATE TABLE appointments (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled', -- 'Scheduled', 'Completed', 'Cancelled'
    syndrome VARCHAR(100) NOT NULL,
    disease_name VARCHAR(150) NULL,
    notes TEXT NULL,
    diagnosis TEXT NULL,
    prescription TEXT NULL,
    created_date DATE DEFAULT (CURDATE()),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- 7. Bills Table
CREATE TABLE bills (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    appointment_id VARCHAR(50) NULL,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    consultation_fee DOUBLE DEFAULT 500.0,
    medicine_charges DOUBLE DEFAULT 0.0,
    discount DOUBLE DEFAULT 0.0,
    total_amount DOUBLE NOT NULL,
    bill_date DATE DEFAULT (CURDATE()),
    payment_status VARCHAR(50) DEFAULT 'Paid', -- 'Paid', 'Pending'
    payment_method VARCHAR(50) DEFAULT 'Cash', -- 'Cash', 'UPI', 'Card', 'Insurance'
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- =======================================================================
-- SAMPLE DATA SEEDING
-- =======================================================================

-- Seed Doctors
INSERT INTO doctors (id, name, specialization, phone, email, consultation_fee, availability_status, qualifications, experience_years, room_number, shift_timing, break_timing) VALUES
('doc-1', 'Dr. Alok Nath', 'General Physician', '+91 98201 12345', 'alok.nath@medicare.com', 800, 'Available', 'MBBS, MD (Medicine)', 18, 'OPD-101', '08:00 - 14:00', '11:30 - 12:00 (Tea Break)'),
('doc-2', 'Dr. Priya Sharma', 'Cardiologist', '+91 98202 23456', 'priya.sharma@medicare.com', 1200, 'Available', 'MBBS, MD, DM (Cardio)', 14, 'OPD-203', '09:00 - 15:00', '13:00 - 13:45 (Lunch Break)'),
('doc-3', 'Dr. Rajesh Iyer', 'Orthopedic', '+91 98203 34567', 'rajesh.iyer@medicare.com', 900, 'Available', 'MBBS, MS (Ortho)', 12, 'OPD-105', '10:00 - 18:00', '14:00 - 15:00 (Lunch Break)'),
('doc-4', 'Dr. Ananya Roy', 'Dermatologist', '+91 98204 45678', 'ananya.roy@medicare.com', 750, 'Available', 'MBBS, MD (Derm)', 8, 'OPD-108', '09:30 - 16:30', '13:30 - 14:15 (Lunch Break)'),
('doc-5', 'Dr. Vikram Patel', 'Neurologist', '+91 98205 56789', 'vikram.patel@medicare.com', 1500, 'Available', 'MBBS, DM (Neuro)', 16, 'OPD-302', '11:00 - 19:00', '15:00 - 15:45 (Lunch Break)');

-- Seed Receptionists
INSERT INTO receptionists (id, name, email, phone, shift, desk_number, duty_status, shift_timing, break_timing) VALUES
('rec-1', 'Priya Deshmukh', 'priya.reception@medicare.com', '+91 98206 11223', 'Morning', 'Counter A-1', 'On Duty', '08:00 - 14:00', '11:30 - 12:00 (Tea & Lunch)'),
('rec-2', 'Rohan Verma', 'rohan.reception@medicare.com', '+91 98207 22334', 'Evening', 'Counter B-2', 'On Duty', '14:00 - 20:00', '17:00 - 17:30 (Snack Break)');

-- Seed Users (Login Credentials)
INSERT INTO users (id, name, email, password, role, doctor_id, phone) VALUES
('usr-admin', 'Dr. Alok Nath (Admin)', 'admin@medicare.com', 'admin123', 'admin', 'doc-1', '+91 98201 12345'),
('usr-rec1', 'Priya Deshmukh', 'reception@medicare.com', 'reception123', 'receptionist', NULL, '+91 98206 11223'),
('usr-doc1', 'Dr. Alok Nath', 'alok.nath@medicare.com', 'doctor123', 'doctor', 'doc-1', '+91 98201 12345'),
('usr-doc2', 'Dr. Priya Sharma', 'priya.sharma@medicare.com', 'doctor123', 'doctor', 'doc-2', '+91 98202 23456'),
('usr-doc3', 'Dr. Rajesh Iyer', 'rajesh.iyer@medicare.com', 'doctor123', 'doctor', 'doc-3', '+91 98203 34567');

-- Seed Inpatient Beds
INSERT INTO beds (id, bed_number, ward, daily_charge, status, patient_id, patient_name, allocated_date) VALUES
('bed-101', 'Bed 101-A', 'General Ward A', 600.0, 'Occupied', 'pat-2', 'Sunita Rao', CURDATE()),
('bed-102', 'Bed 102-B', 'General Ward A', 600.0, 'Available', NULL, NULL, NULL),
('bed-201', 'ICU-Bed 01', 'ICU - Intensive Care', 3500.0, 'Occupied', 'pat-4', 'Anita Desai', CURDATE()),
('bed-202', 'ICU-Bed 02', 'ICU - Intensive Care', 3500.0, 'Available', NULL, NULL, NULL),
('bed-301', 'Semi-Pvt 301', 'Semi-Private Wing', 1500.0, 'Available', NULL, NULL, NULL),
('bed-401', 'Deluxe Suite 401', 'Deluxe Private Suite', 2800.0, 'Available', NULL, NULL, NULL);

-- Seed Patients
INSERT INTO patients (id, name, age, gender, phone, address, syndrome, blood_group, admission_status, registered_date, admitted_date, discharged_date, bed_id, bed_number, disease_name, discharge_summary, total_billed_amount) VALUES
('pat-1', 'Ramesh Kumar', 45, 'Male', '+91 98765 43210', 'Andheri West, Mumbai', 'Fever', 'B+', 'Outpatient', CURDATE(), NULL, NULL, NULL, NULL, 'Viral Pyrexia', NULL, 0.0),
('pat-2', 'Sunita Rao', 52, 'Female', '+91 98765 43211', 'Borivali East, Mumbai', 'Chest Pain', 'O+', 'Admitted', CURDATE(), CURDATE(), NULL, 'bed-101', 'Bed 101-A', 'Stable Angina Pectoris', NULL, 0.0),
('pat-3', 'Vikram Malhotra', 28, 'Male', '+91 98765 43212', 'Kandivali, Mumbai', 'Fracture', 'A+', 'Discharged', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, 'Bed 104-D', 'Right Tibia Hairline Fracture', 'Cast immobilization completed, bone aligned nicely. Discharged with pain relief analgesics and follow-up in 2 weeks.', 4850.0),
('pat-4', 'Anita Desai', 39, 'Female', '+91 98765 43213', 'Thane West, Mumbai', 'Migraine', 'AB+', 'Admitted', CURDATE(), CURDATE(), NULL, 'bed-201', 'ICU-Bed 01', 'Acute Migraine with Aura', NULL, 0.0),
('pat-5', 'Suresh Gupta', 63, 'Male', '+91 98765 43214', 'Vashi, Navi Mumbai', 'Diabetes', 'O-', 'Discharged', DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 8 DAY), DATE_SUB(CURDATE(), INTERVAL 4 DAY), NULL, 'Semi-Pvt 303', 'Type 2 Diabetes Mellitus with Ketoacidosis Risk', 'Insulin titration successful, glycemic levels normalized at 118 mg/dL fasting. Discharged on oral Metformin and dietary counseling.', 7400.0);

-- Seed Appointments
INSERT INTO appointments (id, patient_id, doctor_id, date, time, status, syndrome, disease_name, diagnosis, prescription, notes) VALUES
('app-1', 'pat-1', 'doc-1', CURDATE(), '10:00', 'Scheduled', 'Fever', 'Viral Pyrexia', NULL, NULL, 'High body temperature for 2 days with chills.'),
('app-2', 'pat-2', 'doc-2', CURDATE(), '11:00', 'Completed', 'Chest Pain', 'Stable Angina', 'Mild exertional discomfort, ECG shows normal sinus rhythm.', '1. Tab Sorbitrate 5mg SOS&#10;2. Tab Aspirin 75mg daily&#10;3. Tab Atorvastatin 20mg bedtime', 'Admitted to Ward A for 24-hour cardiac enzyme monitoring.'),
('app-3', 'pat-4', 'doc-5', CURDATE(), '14:30', 'Scheduled', 'Migraine', 'Acute Migraine', NULL, NULL, 'Severe throbbing temporal headache with nausea.');

-- Seed Bills
INSERT INTO bills (id, invoice_number, appointment_id, patient_id, doctor_id, consultation_fee, medicine_charges, discount, total_amount, bill_date, payment_status, payment_method) VALUES
('bill-1', 'INV-2026-001', 'app-2', 'pat-2', 'doc-2', 1200.0, 650.0, 100.0, 1750.0, CURDATE(), 'Paid', 'UPI'),
('bill-2', 'INV-2026-002', NULL, 'pat-3', 'doc-3', 900.0, 3950.0, 0.0, 4850.0, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Paid', 'Card'),
('bill-3', 'INV-2026-003', NULL, 'pat-5', 'doc-1', 800.0, 6600.0, 0.0, 7400.0, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'Paid', 'Cash');

-- =======================================================================
-- KEY SQL QUERIES REQUIRED FOR COLLEGE PROJECT VIVA DEMONSTRATION:
-- =======================================================================

-- 1. Admin Options:
-- Manage Staff:
-- INSERT INTO doctors (id, name, specialization, phone, email, consultation_fee, room_number, shift_timing, break_timing) VALUES ('doc-101', 'Dr. Sanjay Sen', 'Cardiologist', '+91 99999 11111', 'sanjay@medicare.com', 1000, 'OPD-201', '09:00 - 17:00', '13:00 - 14:00');
-- INSERT INTO users (id, name, email, password, role, doctor_id) VALUES ('usr-doc-101', 'Dr. Sanjay Sen', 'sanjay@medicare.com', 'doctor123', 'doctor', 'doc-101');
-- DELETE FROM users WHERE doctor_id = 'doc-101';
-- DELETE FROM doctors WHERE id = 'doc-101';

-- Monitor Operations:
-- SELECT (SELECT COUNT(*) FROM patients WHERE admission_status = 'Admitted') AS total_admitted, (SELECT COUNT(*) FROM beds WHERE status = 'Available') AS available_beds, (SELECT COALESCE(SUM(total_amount), 0) FROM bills WHERE payment_status = 'Paid') AS total_revenue;

-- View Discharged Patients Master View:
-- SELECT id, name, age, gender, syndrome, disease_name, admitted_date, discharged_date, bed_number, total_billed_amount FROM patients WHERE admission_status = 'Discharged' ORDER BY discharged_date DESC;

-- 2. Receptionist Options:
-- Registration:
-- INSERT INTO patients (id, name, age, gender, phone, address, syndrome, blood_group, admission_status, registered_date) VALUES ('pat-999', 'Neha Sharma', 26, 'Female', '+91 98888 77777', 'Bandra West', 'Fever', 'B+', 'Outpatient', CURDATE());

-- Appointments:
-- INSERT INTO appointments (id, patient_id, doctor_id, date, time, status, syndrome, notes, created_date) VALUES ('app-999', 'pat-999', 'doc-1', CURDATE(), '11:30', 'Scheduled', 'Fever', 'Fever and body pain', CURDATE());

-- Bed Allocation:
-- UPDATE beds SET status = 'Occupied', patient_id = 'pat-999', allocated_date = CURDATE() WHERE id = 'bed-102';
-- UPDATE patients SET admission_status = 'Admitted', bed_id = 'bed-102', admitted_date = CURDATE() WHERE id = 'pat-999';

-- Discharge & Billing 3-in-1 Transaction:
-- BEGIN;
-- INSERT INTO bills (id, invoice_number, patient_id, consultation_fee, medicine_charges, total_amount, bill_date, payment_status) VALUES ('bill-999', 'INV-2026-999', 'pat-999', 600, 1500, 2100, CURDATE(), 'Paid');
-- UPDATE patients SET admission_status = 'Discharged', discharged_date = CURDATE(), total_billed_amount = 2100 WHERE id = 'pat-999';
-- UPDATE beds SET status = 'Available', patient_id = NULL, allocated_date = NULL WHERE id = 'bed-102';
-- COMMIT;

-- 3. Doctor Options:
-- View Daily Schedule:
-- SELECT a.*, p.name, p.age, p.gender, p.phone FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.doctor_id = 'doc-1' AND a.date = CURDATE() ORDER BY a.time ASC;

-- Check Medical History:
-- SELECT * FROM appointments a JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = 'pat-1' ORDER BY a.date DESC;

-- Write Prescription/Diagnosis:
-- UPDATE appointments SET status = 'Completed', disease_name = 'Acute Bronchitis', diagnosis = 'Chest congestion with wheezing', prescription = '1. Azithromycin 500mg OD\n2. Levocetirizine 5mg HS', notes = 'Drink warm water' WHERE id = 'app-1';
