package com.medicare.modules;

import com.medicare.db.DBConnection;
import java.sql.*;
import java.util.Scanner;

/**
 * AdminModule - System Management for College Java Mini Project
 *
 * Implements:
 * 1. Manage Staff: SQL INSERT queries to create new Doctor & Receptionist login credentials.
 *    SQL DELETE queries to remove staff when they leave.
 * 2. Monitor Operations: SQL SELECT queries to fetch hospital stats (Total Admitted, Available Beds, Total Revenue).
 * 3. View Discharged Patients: Master SELECT query showing history of all treated, billed, and discharged patients.
 */
public class AdminModule {

    /**
     * Add Doctor (SQL INSERT)
     * Creates doctor profile and credentials in users table
     */
    public static boolean addDoctor(Connection conn, String name, String specialization, String phone, String email, double fee, String room, String shift, String breakTime) {
        String insertDoctorSql = "INSERT INTO doctors (id, name, specialization, phone, email, consultation_fee, room_number, shift_timing, break_timing, availability_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available');";
        String insertUserSql = "INSERT INTO users (id, name, email, password, role, doctor_id, phone) VALUES (?, ?, ?, 'doctor123', 'doctor', ?, ?);";

        String docId = "doc-" + System.currentTimeMillis();
        String userId = "usr-" + docId;

        try {
            conn.setAutoCommit(false); // Begin Transaction

            try (PreparedStatement pstmt1 = conn.prepareStatement(insertDoctorSql)) {
                pstmt1.setString(1, docId);
                pstmt1.setString(2, name);
                pstmt1.setString(3, specialization);
                pstmt1.setString(4, phone);
                pstmt1.setString(5, email);
                pstmt1.setDouble(6, fee);
                pstmt1.setString(7, room);
                pstmt1.setString(8, shift);
                pstmt1.setString(9, breakTime);
                pstmt1.executeUpdate();
            }

            try (PreparedStatement pstmt2 = conn.prepareStatement(insertUserSql)) {
                pstmt2.setString(1, userId);
                pstmt2.setString(2, name);
                pstmt2.setString(3, email);
                pstmt2.setString(4, docId);
                pstmt2.setString(5, phone);
                pstmt2.executeUpdate();
            }

            conn.commit();
            System.out.println("\n[SUCCESS] SQL INSERT executed: Doctor & User credentials created for " + name + " (ID: " + docId + ")");
            System.out.println("[INFO] Default Login -> Email: " + email + " | Password: doctor123");
            return true;
        } catch (SQLException e) {
            try { conn.rollback(); } catch (SQLException ignored) {}
            System.err.println("[ERROR] Failed to add doctor: " + e.getMessage());
            return false;
        } finally {
            try { conn.setAutoCommit(true); } catch (SQLException ignored) {}
        }
    }

    /**
     * Delete Doctor (SQL DELETE)
     */
    public static boolean deleteDoctor(Connection conn, String doctorId) {
        String deleteUserSql = "DELETE FROM users WHERE doctor_id = ?;";
        String deleteDoctorSql = "DELETE FROM doctors WHERE id = ?;";

        try {
            conn.setAutoCommit(false);
            try (PreparedStatement pstmt1 = conn.prepareStatement(deleteUserSql)) {
                pstmt1.setString(1, doctorId);
                pstmt1.executeUpdate();
            }
            try (PreparedStatement pstmt2 = conn.prepareStatement(deleteDoctorSql)) {
                pstmt2.setString(1, doctorId);
                int rows = pstmt2.executeUpdate();
                conn.commit();
                if (rows > 0) {
                    System.out.println("\n[SUCCESS] SQL DELETE executed: Doctor " + doctorId + " removed from system.");
                    return true;
                } else {
                    System.out.println("[WARN] Doctor ID " + doctorId + " not found.");
                    return false;
                }
            }
        } catch (SQLException e) {
            try { conn.rollback(); } catch (SQLException ignored) {}
            System.err.println("[ERROR] Failed to delete doctor: " + e.getMessage());
            return false;
        } finally {
            try { conn.setAutoCommit(true); } catch (SQLException ignored) {}
        }
    }

    /**
     * Add Receptionist (SQL INSERT)
     */
    public static boolean addReceptionist(Connection conn, String name, String email, String phone, String shift, String desk) {
        String recId = "rec-" + System.currentTimeMillis();
        String userId = "usr-" + recId;

        String insertRecSql = "INSERT INTO receptionists (id, name, email, phone, shift, desk_number, duty_status) VALUES (?, ?, ?, ?, ?, ?, 'On Duty');";
        String insertUserSql = "INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, 'reception123', 'receptionist', ?);";

        try {
            conn.setAutoCommit(false);
            try (PreparedStatement pstmt1 = conn.prepareStatement(insertRecSql)) {
                pstmt1.setString(1, recId);
                pstmt1.setString(2, name);
                pstmt1.setString(3, email);
                pstmt1.setString(4, phone);
                pstmt1.setString(5, shift);
                pstmt1.setString(6, desk);
                pstmt1.executeUpdate();
            }
            try (PreparedStatement pstmt2 = conn.prepareStatement(insertUserSql)) {
                pstmt2.setString(1, userId);
                pstmt2.setString(2, name);
                pstmt2.setString(3, email);
                pstmt2.setString(4, phone);
                pstmt2.executeUpdate();
            }
            conn.commit();
            System.out.println("\n[SUCCESS] SQL INSERT executed: Receptionist " + name + " registered (ID: " + recId + ")");
            System.out.println("[INFO] Default Login -> Email: " + email + " | Password: reception123");
            return true;
        } catch (SQLException e) {
            try { conn.rollback(); } catch (SQLException ignored) {}
            System.err.println("[ERROR] Failed to add receptionist: " + e.getMessage());
            return false;
        } finally {
            try { conn.setAutoCommit(true); } catch (SQLException ignored) {}
        }
    }

    /**
     * Delete Receptionist (SQL DELETE)
     */
    public static boolean deleteReceptionist(Connection conn, String recId) {
        String sql = "DELETE FROM receptionists WHERE id = ?;";
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, recId);
            int rows = pstmt.executeUpdate();
            if (rows > 0) {
                System.out.println("\n[SUCCESS] SQL DELETE executed: Receptionist " + recId + " removed.");
                return true;
            }
            System.out.println("[WARN] Receptionist ID not found.");
            return false;
        } catch (SQLException e) {
            System.err.println("[ERROR] " + e.getMessage());
            return false;
        }
    }

    /**
     * Monitor Operations (SQL SELECT)
     * Fetches overall hospital data: total admitted patients, available beds, total revenue
     */
    public static void monitorOperations(Connection conn) {
        String sql = "SELECT " +
                     "(SELECT COUNT(*) FROM patients WHERE admission_status = 'Admitted') AS total_admitted, " +
                     "(SELECT COUNT(*) FROM beds WHERE status = 'Available') AS available_beds, " +
                     "(SELECT COUNT(*) FROM beds WHERE status = 'Occupied') AS occupied_beds, " +
                     "(SELECT COUNT(*) FROM patients) AS total_patients, " +
                     "(SELECT COALESCE(SUM(total_amount), 0) FROM bills WHERE payment_status = 'Paid') AS total_revenue;";

        System.out.println("\n=======================================================");
        System.out.println("   NEXUS CARE HOSPITAL - OPERATIONS MONITOR (SELECT)   ");
        System.out.println("=======================================================");
        System.out.println("[SQL EXECUTED]: " + sql);

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                System.out.println("-------------------------------------------------------");
                System.out.printf("Total Admitted Inpatients: %d\n", rs.getInt("total_admitted"));
                System.out.printf("Available Beds in Ward   : %d\n", rs.getInt("available_beds"));
                System.out.printf("Occupied Beds in Ward    : %d\n", rs.getInt("occupied_beds"));
                System.out.printf("Total Registered Patients: %d\n", rs.getInt("total_patients"));
                System.out.printf("Total Hospital Revenue   : Rs. %.2f\n", rs.getDouble("total_revenue"));
                System.out.println("-------------------------------------------------------");
            }
        } catch (SQLException e) {
            System.err.println("[ERROR] Failed to fetch operations stats: " + e.getMessage());
        }
    }

    /**
     * View Discharged Patients (Master View - SQL SELECT)
     * Shows a history of all patients who have been treated, billed, and discharged
     */
    public static void viewDischargedPatients(Connection conn) {
        String sql = "SELECT id, name, age, gender, syndrome, disease_name, admitted_date, discharged_date, bed_number, total_billed_amount " +
                     "FROM patients WHERE admission_status = 'Discharged' ORDER BY discharged_date DESC;";

        System.out.println("\n==========================================================================================");
        System.out.println("                  MASTER VIEW: DISCHARGED PATIENT ARCHIVE (SELECT)                        ");
        System.out.println("==========================================================================================");
        System.out.println("[SQL EXECUTED]: " + sql);

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            System.out.println("------------------------------------------------------------------------------------------");
            System.out.printf("%-10s | %-18s | %-4s | %-15s | %-12s | %-12s | %-8s | %-10s\n",
                    "Patient ID", "Patient Name", "Age", "Diagnosis/Disease", "Admit Date", "Discharge", "Bed", "Bill (Rs)");
            System.out.println("------------------------------------------------------------------------------------------");

            int count = 0;
            while (rs.next()) {
                count++;
                System.out.printf("%-10s | %-18s | %-4d | %-15s | %-12s | %-12s | %-8s | Rs. %-8.2f\n",
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getInt("age"),
                        rs.getString("disease_name") != null ? rs.getString("disease_name") : rs.getString("syndrome"),
                        rs.getString("admitted_date") != null ? rs.getString("admitted_date") : "N/A",
                        rs.getString("discharged_date") != null ? rs.getString("discharged_date") : "N/A",
                        rs.getString("bed_number") != null ? rs.getString("bed_number") : "OPD",
                        rs.getDouble("total_billed_amount"));
            }

            if (count == 0) {
                System.out.println("No discharged patient records found in database.");
            }
            System.out.println("------------------------------------------------------------------------------------------");
            System.out.println("Total Historical Discharged Patients: " + count);
        } catch (SQLException e) {
            System.err.println("[ERROR] Failed to fetch discharged patients: " + e.getMessage());
        }
    }
}
