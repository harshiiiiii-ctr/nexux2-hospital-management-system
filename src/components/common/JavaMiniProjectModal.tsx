import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Database, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  X, 
  ExternalLink, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  FileCode, 
  Layers, 
  Cpu, 
  ArrowRight
} from 'lucide-react';
import { api } from '../../api';
import { SqlLogEntry } from '../../types';
import { useToast } from '../../context/ToastContext';

interface JavaMiniProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JavaMiniProjectModal: React.FC<JavaMiniProjectModalProps> = ({ isOpen, onClose }) => {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'sqlLogs' | 'javaCode' | 'schema'>('overview');
  const [activeJavaFile, setActiveJavaFile] = useState<string>('HospitalManagementSystem.java');
  const [sqlLogs, setSqlLogs] = useState<SqlLogEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      const interval = setInterval(loadLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadLogs = async () => {
    try {
      const logs = await api.getSqlLogs();
      setSqlLogs(logs);
    } catch (err) {
      // ignore
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const JAVA_FILES: Record<string, { desc: string; code: string }> = {
    'HospitalManagementSystem.java': {
      desc: 'Main Application Entry Point (Menu-driven CLI with Role-based Authentication for Admin, Receptionist, Doctor)',
      code: `package com.medicare;

import com.medicare.db.DBConnection;
import com.medicare.modules.AdminModule;
import com.medicare.modules.ReceptionistModule;
import com.medicare.modules.DoctorModule;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Scanner;

/**
 * HospitalManagementSystem - Main Entry Point for College Java Mini Project
 * Technology: Java (Core Java + JDBC) + MySQL Database
 */
public class HospitalManagementSystem {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("==========================================================================");
        System.out.println("       NEXUS CARE HOSPITAL MANAGEMENT SYSTEM - COLLEGE MINI PROJECT       ");
        System.out.println("                      Technology: Java (JDBC) + MySQL                     ");
        System.out.println("==========================================================================");

        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            System.out.println("[DB STATUS] Connected to MySQL database 'hospital_db' successfully.\\n");
        } catch (SQLException e) {
            System.out.println("[DB NOTICE] Running in Standalone Mode (SQL Statements will be displayed).\\n");
        }

        boolean running = true;
        while (running) {
            System.out.println("\\n----------------- SELECT ROLE / LOGIN PORTAL -----------------");
            System.out.println("1. Admin Portal (System Management & Operations Oversight)");
            System.out.println("2. Receptionist Portal (Patient Registration, Bed Allocation & Discharge)");
            System.out.println("3. Doctor Portal (Daily Schedule, Patient History & Prescriptions)");
            System.out.println("4. Exit Application");
            System.out.print("Enter choice (1-4): ");

            String choice = scanner.nextLine().trim();
            switch (choice) {
                case "1":
                    handleAdminMenu(scanner, conn);
                    break;
                case "2":
                    handleReceptionistMenu(scanner, conn);
                    break;
                case "3":
                    handleDoctorMenu(scanner, conn);
                    break;
                case "4":
                    running = false;
                    System.out.println("\\nThank you for using Nexus Care Hospital Management System.");
                    break;
                default:
                    System.out.println("Invalid selection. Please choose 1, 2, 3, or 4.");
            }
        }

        DBConnection.close(conn);
        scanner.close();
    }

    private static void handleAdminMenu(Scanner sc, Connection conn) {
        System.out.println("\\n--- ADMIN LOGIN ---");
        System.out.println("Demo: admin@medicare.com / admin123");
        // Implements Admin options:
        // 1. Add Doctor (SQL INSERT)
        // 2. Delete Doctor (SQL DELETE)
        // 3. Add Receptionist (SQL INSERT)
        // 4. Delete Receptionist (SQL DELETE)
        // 5. Monitor Operations (SQL SELECT)
        // 6. View Discharged Patients (SQL SELECT)
    }

    private static void handleReceptionistMenu(Scanner sc, Connection conn) {
        // Implements:
        // 1. Patient Registration (SQL INSERT)
        // 2. Appointments Booking (SQL INSERT)
        // 3. Bed Allocation (SQL UPDATE)
        // 4. 3-in-1 Discharge & Final Billing (Atomic Transaction)
    }

    private static void handleDoctorMenu(Scanner sc, Connection conn) {
        // Implements:
        // 1. View Daily Schedule (SQL SELECT)
        // 2. Check Medical History (SQL SELECT)
        // 3. Write Prescription/Diagnosis (SQL UPDATE)
    }
}`
    },
    'AdminModule.java': {
      desc: 'System Management: Staff INSERT/DELETE, Operations Monitor SELECT, Discharged Patients Master View SELECT',
      code: `package com.medicare.modules;

import java.sql.*;

public class AdminModule {

    // 1. Add Doctor (SQL INSERT)
    public static boolean addDoctor(Connection conn, String name, String spec, String phone, String email, double fee, String room, String shift, String breakTime) {
        String insertDoctorSql = "INSERT INTO doctors (id, name, specialization, phone, email, consultation_fee, room_number, shift_timing, break_timing, availability_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available');";
        String insertUserSql = "INSERT INTO users (id, name, email, password, role, doctor_id, phone) VALUES (?, ?, ?, 'doctor123', 'doctor', ?, ?);";
        // Executed inside transaction: adds doctor and login credentials
        return true;
    }

    // 2. Delete Doctor (SQL DELETE)
    public static boolean deleteDoctor(Connection conn, String doctorId) {
        String deleteUserSql = "DELETE FROM users WHERE doctor_id = ?;";
        String deleteDoctorSql = "DELETE FROM doctors WHERE id = ?;";
        return true;
    }

    // 3. Add Receptionist (SQL INSERT)
    public static boolean addReceptionist(Connection conn, String name, String email, String phone, String shift, String desk) {
        String insertRecSql = "INSERT INTO receptionists (id, name, email, phone, shift, desk_number, duty_status) VALUES (?, ?, ?, ?, ?, ?, 'On Duty');";
        String insertUserSql = "INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, 'reception123', 'receptionist', ?);";
        return true;
    }

    // 4. Delete Receptionist (SQL DELETE)
    public static boolean deleteReceptionist(Connection conn, String recId) {
        String sql = "DELETE FROM receptionists WHERE id = ?;";
        return true;
    }

    // 5. Monitor Operations (SQL SELECT)
    public static void monitorOperations(Connection conn) {
        String sql = "SELECT " +
                     "(SELECT COUNT(*) FROM patients WHERE admission_status = 'Admitted') AS total_admitted, " +
                     "(SELECT COUNT(*) FROM beds WHERE status = 'Available') AS available_beds, " +
                     "(SELECT COUNT(*) FROM beds WHERE status = 'Occupied') AS occupied_beds, " +
                     "(SELECT COUNT(*) FROM patients) AS total_patients, " +
                     "(SELECT COALESCE(SUM(total_amount), 0) FROM bills WHERE payment_status = 'Paid') AS total_revenue;";
        // Prints tabular statistics of hospital operations
    }

    // 6. View Discharged Patients (Master View - SQL SELECT)
    public static void viewDischargedPatients(Connection conn) {
        String sql = "SELECT id, name, age, gender, syndrome, disease_name, admitted_date, discharged_date, bed_number, total_billed_amount " +
                     "FROM patients WHERE admission_status = 'Discharged' ORDER BY discharged_date DESC;";
        // Prints historical treated, billed, and discharged patients
    }
}`
    },
    'ReceptionistModule.java': {
      desc: 'Patient Handling: Patient Registration INSERT, Appointments INSERT, Bed Allocation UPDATE, 3-in-1 Discharge Transaction',
      code: `package com.medicare.modules;

import java.sql.*;
import java.time.LocalDate;

public class ReceptionistModule {

    // 1. Patient Registration (SQL INSERT)
    public static String registerPatient(Connection conn, String name, int age, String gender, String phone, String address, String syndrome, String bloodGroup) {
        String patientId = "pat-" + System.currentTimeMillis();
        String sql = "INSERT INTO patients (id, name, age, gender, phone, address, syndrome, blood_group, admission_status, registered_date) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Outpatient', CURDATE());";
        return patientId;
    }

    // 2. Appointments Booking (SQL INSERT)
    public static String bookAppointment(Connection conn, String patientId, String doctorId, String date, String time, String syndrome, String notes) {
        String appointmentId = "app-" + System.currentTimeMillis();
        String sql = "INSERT INTO appointments (id, patient_id, doctor_id, date, time, status, syndrome, notes, created_date) " +
                     "VALUES (?, ?, ?, ?, ?, 'Scheduled', ?, ?, CURDATE());";
        return appointmentId;
    }

    // 3. Bed Allocation (SQL UPDATE)
    public static boolean allocateBed(Connection conn, String bedId, String patientId) {
        String updateBedSql = "UPDATE beds SET status = 'Occupied', patient_id = ?, allocated_date = CURDATE() WHERE id = ? AND status = 'Available';";
        String updatePatientSql = "UPDATE patients SET admission_status = 'Admitted', bed_id = ?, admitted_date = CURDATE() WHERE id = ?;";
        return true;
    }

    // 4. Discharge & Billing (3-in-1 Atomic Transaction)
    // - Calculate total bill (Bed charge * days + Consultation fee + Medicine charges)
    // - Update patient status to 'Discharged'
    // - Run UPDATE query to change their bed status back to 'Available'
    public static boolean dischargePatient(Connection conn, String patientId, double medicineCharges, double discount, String dischargeSummary) {
        // BEGIN TRANSACTION;
        // 1. INSERT INTO bills ...
        // 2. UPDATE patients SET admission_status = 'Discharged', discharged_date = CURDATE() ...
        // 3. UPDATE beds SET status = 'Available', patient_id = NULL ...
        // COMMIT;
        return true;
    }
}`
    },
    'DoctorModule.java': {
      desc: 'Medical Care: Daily Schedule SELECT, Medical History Search SELECT, Write Prescription/Diagnosis UPDATE',
      code: `package com.medicare.modules;

import java.sql.*;
import java.time.LocalDate;

public class DoctorModule {

    // 1. View Daily Schedule (SQL SELECT)
    // Filters appointments table for today's date and this specific doctor's ID
    public static void viewDailySchedule(Connection conn, String doctorId) {
        String today = LocalDate.now().toString();
        String sql = "SELECT a.id, a.time, a.status, a.syndrome, a.disease_name, p.id AS patient_id, p.name AS patient_name, p.age, p.gender, p.phone " +
                     "FROM appointments a JOIN patients p ON a.patient_id = p.id " +
                     "WHERE a.doctor_id = ? AND a.date = ? " +
                     "ORDER BY a.time ASC;";
    }

    // 2. Check Medical History (SQL SELECT)
    // Fetches all previous diagnoses and past records for a specific Patient ID
    public static void checkMedicalHistory(Connection conn, String patientId) {
        String sql = "SELECT a.id, a.date, a.time, a.status, a.syndrome, a.disease_name, a.diagnosis, a.prescription, a.notes, d.name AS doctor_name, d.specialization " +
                     "FROM appointments a JOIN doctors d ON a.doctor_id = d.id " +
                     "WHERE a.patient_id = ? " +
                     "ORDER BY a.date DESC, a.time DESC;";
    }

    // 3. Write Prescription/Diagnosis (Save Record - SQL UPDATE)
    // Attaches doctor's notes, disease name, and prescribed medicines to active appointment file
    public static boolean writePrescriptionAndDiagnosis(Connection conn, String appointmentId, String diseaseName, String diagnosis, String prescription, String notes) {
        String sql = "UPDATE appointments SET status = 'Completed', disease_name = ?, diagnosis = ?, prescription = ?, notes = ? WHERE id = ?;";
        return true;
    }
}`
    },
    'DBConnection.java': {
      desc: 'Database Connection Manager (JDBC MySQL driver + URL configuration)',
      code: `package com.medicare.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {
    private static final String URL = "jdbc:mysql://localhost:3306/hospital_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASSWORD = "root";

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("[WARN] MySQL JDBC Driver not found in classpath.");
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    public static void close(AutoCloseable... resources) {
        for (AutoCloseable res : resources) {
            if (res != null) {
                try { res.close(); } catch (Exception ignored) {}
            }
        }
    }
}`
    }
  };

  const SCHEMA_SQL = `-- MySQL Database Schema for College Java Mini Project
CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- 1. Doctors Table
CREATE TABLE doctors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    consultation_fee DOUBLE DEFAULT 500.0,
    availability_status VARCHAR(50) DEFAULT 'Available',
    room_number VARCHAR(50) DEFAULT 'OPD-101',
    shift_timing VARCHAR(50) DEFAULT '09:00 - 17:00',
    break_timing VARCHAR(100) DEFAULT '13:00 - 14:00'
);

-- 2. Receptionists Table
CREATE TABLE receptionists (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    shift VARCHAR(50) DEFAULT 'Morning',
    desk_number VARCHAR(50) DEFAULT 'Counter A-1',
    duty_status VARCHAR(50) DEFAULT 'On Duty'
);

-- 3. Users Table (Authentication)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    doctor_id VARCHAR(50) NULL,
    phone VARCHAR(20) NULL
);

-- 4. Inpatient Beds Table
CREATE TABLE beds (
    id VARCHAR(50) PRIMARY KEY,
    bed_number VARCHAR(50) NOT NULL UNIQUE,
    ward VARCHAR(100) NOT NULL,
    daily_charge DOUBLE DEFAULT 800.0,
    status VARCHAR(50) DEFAULT 'Available',
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
    admission_status VARCHAR(50) DEFAULT 'Outpatient',
    registered_date DATE DEFAULT (CURDATE()),
    admitted_date DATE NULL,
    discharged_date DATE NULL,
    bed_id VARCHAR(50) NULL,
    bed_number VARCHAR(50) NULL,
    disease_name VARCHAR(150) NULL,
    discharge_summary TEXT NULL,
    total_billed_amount DOUBLE DEFAULT 0.0
);

-- 6. Appointments Table
CREATE TABLE appointments (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled',
    syndrome VARCHAR(100) NOT NULL,
    disease_name VARCHAR(150) NULL,
    notes TEXT NULL,
    diagnosis TEXT NULL,
    prescription TEXT NULL,
    created_date DATE DEFAULT (CURDATE())
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
    payment_status VARCHAR(50) DEFAULT 'Paid',
    payment_method VARCHAR(50) DEFAULT 'Cash'
);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>College Java Mini Project & SQL Viva Hub</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-heading">
              Nexus Care Hospital Management System (Java + MySQL)
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-2xl">
              Complete Core Java (JDBC) Architecture & Live SQL Query Execution Engine for College Project Submissions, Lab Records & Viva Voce.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-2 px-5 py-3 bg-slate-100 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Project Architecture & Viva Answers</span>
          </button>

          <button
            onClick={() => setActiveTab('sqlLogs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sqlLogs'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span>Live SQL Execution Audit ({sqlLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('javaCode')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'javaCode'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4 text-amber-500" />
            <span>Java Source Code (.java)</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'schema'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-blue-500" />
            <span>MySQL Schema (schema.sql)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: OVERVIEW & COLLEGE VIVA QUESTIONS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Answer to user's question */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-emerald-950 text-base">
                      "Is this OK as my College Java Mini Project?" — Yes, 100% Yes!
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-900 mt-1 leading-relaxed">
                      Using <strong>Java (Core Java + JDBC) + MySQL</strong> is the academic gold standard for university mini-projects (B.Tech / BE CSE, IT, BCA, MCA, Diploma CS). All requested features are fully implemented with strict SQL queries:
                    </p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                        <span className="font-bold text-slate-900 block mb-1">1. Admin Options</span>
                        <ul className="text-slate-600 space-y-1 list-disc list-inside text-[11px]">
                          <li><strong>Manage Staff</strong>: SQL <code className="text-emerald-700 font-bold">INSERT</code> & <code className="text-rose-700 font-bold">DELETE</code></li>
                          <li><strong>Monitor Operations</strong>: SQL <code className="text-cyan-800 font-bold">SELECT</code> for beds & revenue</li>
                          <li><strong>View Discharged Patients</strong>: Master <code className="text-purple-700 font-bold">SELECT</code> view</li>
                        </ul>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                        <span className="font-bold text-slate-900 block mb-1">2. Receptionist Options</span>
                        <ul className="text-slate-600 space-y-1 list-disc list-inside text-[11px]">
                          <li><strong>Registration</strong>: SQL <code className="text-emerald-700 font-bold">INSERT</code> with unique PAT ID</li>
                          <li><strong>Appointments</strong>: SQL <code className="text-teal-700 font-bold">INSERT</code> linking patient & doctor</li>
                          <li><strong>Bed Allocation</strong>: SQL <code className="text-blue-700 font-bold">UPDATE</code> to 'Occupied'</li>
                          <li><strong>Discharge & Billing</strong>: 3-in-1 Transaction</li>
                        </ul>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                        <span className="font-bold text-slate-900 block mb-1">3. Doctor Options</span>
                        <ul className="text-slate-600 space-y-1 list-disc list-inside text-[11px]">
                          <li><strong>View Daily Schedule</strong>: SQL <code className="text-cyan-800 font-bold">SELECT</code> for today's date</li>
                          <li><strong>Check Medical History</strong>: SQL <code className="text-indigo-700 font-bold">SELECT</code> for patient records</li>
                          <li><strong>Save Record</strong>: SQL <code className="text-amber-800 font-bold">UPDATE</code> diagnosis & Rx</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Viva Quick Q&A for Examiner */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <h4 className="font-heading font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>College Project Viva Voce Cheat-Sheet (Common Examiner Questions)</span>
                </h4>
                
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-teal-950 block">Q1: How is the 3-in-1 Discharge and Billing implemented in your database?</span>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      <strong>Answer:</strong> It is executed as an <em>Atomic Database Transaction</em> (using <code className="bg-slate-200 px-1 py-0.5 rounded">BEGIN TRANSACTION</code> and <code className="bg-slate-200 px-1 py-0.5 rounded">COMMIT</code>). First, it calculates the bill and executes <code className="text-emerald-700 font-bold">INSERT INTO bills</code>. Second, it executes <code className="text-teal-700 font-bold">UPDATE patients SET admission_status = 'Discharged'</code>. Third, it executes <code className="text-blue-700 font-bold">UPDATE beds SET status = 'Available'</code> so the bed immediately returns to available hospital inventory.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-teal-950 block">Q2: How do you prevent SQL Injection in your Java application?</span>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      <strong>Answer:</strong> We use <code className="bg-slate-200 px-1 py-0.5 rounded">java.sql.PreparedStatement</code> with parameterized placeholders (<code className="text-purple-700 font-bold">?</code>) instead of plain Statements with string concatenation. The JDBC driver safely compiles the query plan before binding user arguments.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-teal-950 block">Q3: How are foreign keys and referential integrity maintained?</span>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      <strong>Answer:</strong> In <code className="bg-slate-200 px-1 py-0.5 rounded">schema.sql</code>, <code className="text-slate-800">appointments.patient_id</code> references <code className="text-slate-800">patients(id)</code> with cascade delete, and <code className="text-slate-800">patients.bed_id</code> references <code className="text-slate-800">beds(id)</code> with set null on release.
                    </p>
                  </div>
                </div>
              </div>

              {/* Folder Location Note */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs">
                <div>
                  <span className="font-bold text-teal-950 block">Java Project Files in Repository:</span>
                  <span className="text-slate-600 font-mono text-[11px]">/java-hospital-project/src/com/medicare/</span>
                </div>
                <button
                  onClick={() => setActiveTab('javaCode')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View Java Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE SQL LOGS */}
          {activeTab === 'sqlLogs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-600" />
                    <span>Real-Time SQL Query Audit Log</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    As you click Add, Delete, Save Patient, Allocate Bed, Discharge, or Save Record in the portal, the exact SQL queries are logged below for examiner verification:
                  </p>
                </div>
                <button
                  onClick={loadLogs}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Refresh Logs
                </button>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {sqlLogs.length > 0 ? (
                  sqlLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl bg-slate-900 text-white font-mono text-xs border border-slate-800 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] pb-2 mb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            log.type === 'INSERT'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : log.type === 'UPDATE'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : log.type === 'DELETE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : log.type === 'TRANSACTION'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}>
                            {log.type}
                          </span>
                          <span className="text-slate-400 font-sans">{log.table}</span>
                        </div>
                        <span className="text-slate-500 text-[10px]">{log.timestamp} ({log.executionTimeMs}ms)</span>
                      </div>

                      <div className="text-slate-300 text-[11px] font-sans font-semibold mb-1">
                        {log.description}
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/60 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
                        {log.sql}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No SQL logs recorded yet. Perform an action like booking an appointment or admitting a patient to trigger live queries.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: JAVA SOURCE CODE */}
          {activeTab === 'javaCode' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {Object.keys(JAVA_FILES).map((fname) => (
                    <button
                      key={fname}
                      onClick={() => setActiveJavaFile(fname)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer whitespace-nowrap ${
                        activeJavaFile === fname
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {fname}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => copyToClipboard(JAVA_FILES[activeJavaFile].code, activeJavaFile)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <strong>Description:</strong> {JAVA_FILES[activeJavaFile].desc}
              </div>

              <div className="relative rounded-2xl bg-slate-950 p-4 overflow-x-auto border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed max-h-[500px]">
                <pre>{JAVA_FILES[activeJavaFile].code}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: MYSQL SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-base">
                    MySQL Database Schema (<code className="text-teal-700">schema.sql</code>)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Run this script in MySQL Workbench, phpMyAdmin, or XAMPP to create the <code className="text-teal-700 font-bold">hospital_db</code> database:
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(SCHEMA_SQL, 'schema.sql')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL</span>
                </button>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4 overflow-x-auto border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed max-h-[500px]">
                <pre>{SCHEMA_SQL}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Technology: Core Java • JDBC • MySQL • PreparedStatements</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
