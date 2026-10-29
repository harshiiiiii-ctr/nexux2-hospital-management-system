package com.medicare.modules;

import com.medicare.db.DBConnection;
import java.sql.*;
import java.time.LocalDate;

/**
 * DoctorModule - Medical Care for College Java Mini Project
 *
 * Implements:
 * 1. View Daily Schedule: SELECT query filtering Appointments table for today's date and doctor's ID.
 * 2. Check Medical History: SELECT query fetching all past diagnoses, prescriptions, and records for a specific Patient ID.
 * 3. Write Prescription/Diagnosis: "Save Record" UPDATE query attaching doctor's notes, disease name, and prescribed medicines to the active appointment.
 */
public class DoctorModule {

    /**
     * 1. View Daily Schedule (SQL SELECT)
     * Filters appointments for today's date and this specific doctor's ID
     */
    public static void viewDailySchedule(Connection conn, String doctorId) {
        String today = LocalDate.now().toString();
        String sql = "SELECT a.id, a.time, a.status, a.syndrome, a.disease_name, p.id AS patient_id, p.name AS patient_name, p.age, p.gender, p.phone " +
                     "FROM appointments a JOIN patients p ON a.patient_id = p.id " +
                     "WHERE a.doctor_id = ? AND a.date = ? " +
                     "ORDER BY a.time ASC;";

        System.out.println("\n==========================================================================================");
        System.out.println("                   DOCTOR DAILY CONSULTATION SCHEDULE (SELECT)                            ");
        System.out.println("==========================================================================================");
        System.out.println("[SQL EXECUTED]: SELECT a.*, p.* FROM appointments a JOIN patients p WHERE doctor_id='" + doctorId + "' AND date='" + today + "';");

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, doctorId);
            pstmt.setString(2, today);

            try (ResultSet rs = pstmt.executeQuery()) {
                System.out.println("------------------------------------------------------------------------------------------");
                System.out.printf("%-10s | %-6s | %-16s | %-8s | %-15s | %-12s\n",
                        "App ID", "Time", "Patient Name", "Gender/Age", "Chief Complaint", "Status");
                System.out.println("------------------------------------------------------------------------------------------");

                int count = 0;
                while (rs.next()) {
                    count++;
                    System.out.printf("%-10s | %-6s | %-16s | %-8s | %-15s | %-12s\n",
                            rs.getString("id"),
                            rs.getString("time"),
                            rs.getString("patient_name"),
                            rs.getString("gender") + "/" + rs.getInt("age"),
                            rs.getString("syndrome"),
                            rs.getString("status"));
                }

                if (count == 0) {
                    System.out.println("No appointments scheduled for today (" + today + ") for Doctor ID: " + doctorId);
                }
                System.out.println("------------------------------------------------------------------------------------------");
                System.out.println("Total Consultations Scheduled for Today: " + count);
            }
        } catch (SQLException e) {
            System.err.println("[ERROR] Failed to fetch doctor daily schedule: " + e.getMessage());
        }
    }

    /**
     * 2. Check Medical History (SQL SELECT)
     * Fetches all previous diagnoses, prescriptions, and past visits for a specific Patient ID
     */
    public static void checkMedicalHistory(Connection conn, String patientId) {
        String patientSql = "SELECT id, name, age, gender, phone, blood_group, syndrome, admission_status FROM patients WHERE id = ?;";
        String historySql = "SELECT a.id, a.date, a.time, a.status, a.syndrome, a.disease_name, a.diagnosis, a.prescription, a.notes, d.name AS doctor_name, d.specialization " +
                            "FROM appointments a JOIN doctors d ON a.doctor_id = d.id " +
                            "WHERE a.patient_id = ? " +
                            "ORDER BY a.date DESC, a.time DESC;";

        System.out.println("\n==========================================================================================");
        System.out.println("                    PATIENT MEDICAL HISTORY AUDIT (SELECT)                                ");
        System.out.println("==========================================================================================");
        System.out.println("[SQL EXECUTED]: SELECT * FROM appointments a JOIN doctors d WHERE a.patient_id='" + patientId + "' ORDER BY a.date DESC;");

        try (PreparedStatement pstmtPatient = conn.prepareStatement(patientSql)) {
            pstmtPatient.setString(1, patientId);
            try (ResultSet rsPat = pstmtPatient.executeQuery()) {
                if (rsPat.next()) {
                    System.out.println("------------------------------------------------------------------------------------------");
                    System.out.println("Patient Name    : " + rsPat.getString("name") + " (ID: " + patientId + ")");
                    System.out.println("Age / Gender    : " + rsPat.getInt("age") + " yrs / " + rsPat.getString("gender"));
                    System.out.println("Blood Group     : " + rsPat.getString("blood_group"));
                    System.out.println("Contact Phone   : " + rsPat.getString("phone"));
                    System.out.println("Admission Status: " + rsPat.getString("admission_status"));
                    System.out.println("------------------------------------------------------------------------------------------");
                } else {
                    System.err.println("[ERROR] Patient ID " + patientId + " not found.");
                    return;
                }
            }

            try (PreparedStatement pstmtHist = conn.prepareStatement(historySql)) {
                pstmtHist.setString(1, patientId);
                try (ResultSet rsHist = pstmtHist.executeQuery()) {
                    int visit = 0;
                    while (rsHist.next()) {
                        visit++;
                        System.out.println("\n--- Visit #" + visit + " on " + rsHist.getString("date") + " (" + rsHist.getString("time") + ") with " + rsHist.getString("doctor_name") + " (" + rsHist.getString("specialization") + ") ---");
                        System.out.println("Complaint / Syndrome : " + rsHist.getString("syndrome"));
                        System.out.println("Confirmed Disease/Dx : " + (rsHist.getString("disease_name") != null ? rsHist.getString("disease_name") : rsHist.getString("diagnosis")));
                        System.out.println("Prescription Details : " + (rsHist.getString("prescription") != null ? rsHist.getString("prescription") : "None"));
                        System.out.println("Doctor Consultation Notes: " + (rsHist.getString("notes") != null ? rsHist.getString("notes") : "Routine visit"));
                    }

                    if (visit == 0) {
                        System.out.println("No prior medical visit records found for this patient.");
                    }
                    System.out.println("------------------------------------------------------------------------------------------");
                }
            }
        } catch (SQLException e) {
            System.err.println("[ERROR] Failed to query patient medical history: " + e.getMessage());
        }
    }

    /**
     * 3. Write Prescription / Diagnosis (SQL UPDATE)
     * "Save Record" runs an UPDATE query attaching notes, disease name, and prescribed medicines to active appointment
     */
    public static boolean saveRecord(Connection conn, String appointmentId, String diseaseName, String prescription, String notes) {
        String updateAppSql = "UPDATE appointments " +
                              "SET disease_name = ?, diagnosis = ?, prescription = ?, notes = ?, status = 'Completed' " +
                              "WHERE id = ?;";

        String updatePatientSql = "UPDATE patients SET disease_name = ? WHERE id = (SELECT patient_id FROM appointments WHERE id = ?);";

        try {
            conn.setAutoCommit(false); // Begin Transaction

            int rows;
            try (PreparedStatement pstmt1 = conn.prepareStatement(updateAppSql)) {
                pstmt1.setString(1, diseaseName);
                pstmt1.setString(2, diseaseName);
                pstmt1.setString(3, prescription);
                pstmt1.setString(4, notes);
                pstmt1.setString(5, appointmentId);
                rows = pstmt1.executeUpdate();
            }

            if (rows == 0) {
                System.err.println("[WARN] Appointment ID " + appointmentId + " not found.");
                conn.rollback();
                return false;
            }

            try (PreparedStatement pstmt2 = conn.prepareStatement(updatePatientSql)) {
                pstmt2.setString(1, diseaseName);
                pstmt2.setString(2, appointmentId);
                pstmt2.executeUpdate();
            }

            conn.commit();

            System.out.println("\n===================================================================");
            System.out.println("     DOCTOR MEDICAL RECORD SAVED & UPDATED (SQL UPDATE)            ");
            System.out.println("===================================================================");
            System.out.println("[SQL EXECUTED]: UPDATE appointments SET disease_name='" + diseaseName + "', status='Completed' WHERE id='" + appointmentId + "';");
            System.out.println("[APPOINTMENT ID] : " + appointmentId);
            System.out.println("[DISEASE NAME]   : " + diseaseName);
            System.out.println("[PRESCRIPTION]   : " + prescription);
            System.out.println("[DOCTOR NOTES]   : " + notes);
            System.out.println("[STATUS]         : Marked as COMPLETED");
            System.out.println("===================================================================");
            return true;
        } catch (SQLException e) {
            try { conn.rollback(); } catch (SQLException ignored) {}
            System.err.println("[ERROR] Failed to save prescription record: " + e.getMessage());
            return false;
        } finally {
            try { conn.setAutoCommit(true); } catch (SQLException ignored) {}
        }
    }
}
