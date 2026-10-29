package com.medicare.modules;

import com.medicare.db.DBConnection;
import java.sql.*;
import java.time.LocalDate;

/**
 * ReceptionistModule - Patient Handling for College Java Mini Project
 *
 * Implements:
 * 1. Registration: SQL INSERT query to add a new person to Patients table and generate a unique Patient ID.
 * 2. Appointments: SQL INSERT query linking Patient ID to Doctor ID and a time slot.
 * 3. Bed Allocation: SQL UPDATE query changing a bed's status from "Available" to "Occupied" and assigning it to patient.
 * 4. Discharge & Billing (3-in-1 Transaction):
 *    - Calculate total bill (Bed charge * days + Consultation fee + Medicine charges)
 *    - Update patient status to "Discharged"
 *    - Run UPDATE query to change their bed status back to "Available"
 */
public class ReceptionistModule {

    /**
     * 1. Patient Registration (SQL INSERT)
     * Adds a new person to Patients table with unique ID
     */
    public static String registerPatient(Connection conn, String name, int age, String gender, String phone, String address, String syndrome, String bloodGroup) {
        String patientId = "pat-" + System.currentTimeMillis();
        String today = LocalDate.now().toString();

        String sql = "INSERT INTO patients (id, name, age, gender, phone, address, syndrome, blood_group, admission_status, registered_date) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Outpatient', ?);";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, patientId);
            pstmt.setString(2, name);
            pstmt.setInt(3, age);
            pstmt.setString(4, gender);
            pstmt.setString(5, phone);
            pstmt.setString(6, address);
            pstmt.setString(7, syndrome);
            pstmt.setString(8, bloodGroup);
            pstmt.setString(9, today);

            int rows = pstmt.executeUpdate();
            if (rows > 0) {
                System.out.println("\n[SUCCESS] SQL INSERT executed: Patient registered with unique Patient ID: " + patientId);
                System.out.println("[RECORD]: Name: " + name + " | Age: " + age + " | Syndrome: " + syndrome + " | Date: " + today);
                return patientId;
            }
        } catch (SQLException e) {
            System.err.println("[ERROR] Failed to register patient: " + e.getMessage());
        }
        return null;
    }

    /**
     * 2. Appointments Booking (SQL INSERT)
     * Links Patient ID to Doctor ID and a specific date/time slot
     */
    public static String bookAppointment(Connection conn, String patientId, String doctorId, String date, String time, String syndrome, String notes) {
        String appointmentId = "app-" + System.currentTimeMillis();
        String sql = "INSERT INTO appointments (id, patient_id, doctor_id, date, time, status, syndrome, notes, created_date) " +
                     "VALUES (?, ?, ?, ?, ?, 'Scheduled', ?, ?, CURDATE());";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, appointmentId);
            pstmt.setString(2, patientId);
            pstmt.setString(3, doctorId);
            pstmt.setString(4, date);
            pstmt.setString(5, time);
            pstmt.setString(6, syndrome);
            pstmt.setString(7, notes);

            int rows = pstmt.executeUpdate();
            if (rows > 0) {
                System.out.println("\n[SUCCESS] SQL INSERT executed: Appointment booked!");
                System.out.println("[APPOINTMENT LINK]: App ID: " + appointmentId + " -> Patient: " + patientId + " linked to Doctor: " + doctorId + " at " + date + " " + time);
                return appointmentId;
            }
        } catch (SQLException e) {
            System.err.println("[ERROR] Failed to book appointment: " + e.getMessage());
        }
        return null;
    }

    /**
     * 3. Bed Allocation (SQL UPDATE)
     * Changes bed's status from 'Available' to 'Occupied' and assigns it to the admitted patient
     */
    public static boolean allocateBed(Connection conn, String bedId, String patientId) {
        String updateBedSql = "UPDATE beds SET status = 'Occupied', patient_id = ?, allocated_date = CURDATE() WHERE id = ? AND status = 'Available';";
        String updatePatientSql = "UPDATE patients SET admission_status = 'Admitted', bed_id = ?, admitted_date = CURDATE() WHERE id = ?;";

        try {
            conn.setAutoCommit(false); // Begin Transaction

            int bedUpdated;
            try (PreparedStatement pstmt1 = conn.prepareStatement(updateBedSql)) {
                pstmt1.setString(1, patientId);
                pstmt1.setString(2, bedId);
                bedUpdated = pstmt1.executeUpdate();
            }

            if (bedUpdated == 0) {
                System.out.println("[WARN] Bed " + bedId + " is not available or does not exist.");
                conn.rollback();
                return false;
            }

            try (PreparedStatement pstmt2 = conn.prepareStatement(updatePatientSql)) {
                pstmt2.setString(1, bedId);
                pstmt2.setString(2, patientId);
                pstmt2.executeUpdate();
            }

            conn.commit();
            System.out.println("\n[SUCCESS] SQL UPDATE executed: Bed " + bedId + " status changed to 'Occupied' and assigned to Patient " + patientId);
            return true;
        } catch (SQLException e) {
            try { conn.rollback(); } catch (SQLException ignored) {}
            System.err.println("[ERROR] Bed allocation failed: " + e.getMessage());
            return false;
        } finally {
            try { conn.setAutoCommit(true); } catch (SQLException ignored) {}
        }
    }

    /**
     * 4. Discharge & Billing (3-in-1 Transaction)
     * Does three things atomically:
     * 1) Calculates the total bill and inserts final Bill record
     * 2) Updates the patient's status to "Discharged" with discharge date and total amount
     * 3) Runs an UPDATE query to change their bed status back to "Available"
     */
    public static boolean dischargePatient(Connection conn, String patientId, double medicineCharges, double discount, String dischargeSummary) {
        String findPatientAndBedSql = "SELECT p.name, p.bed_id, p.admitted_date, b.daily_charge, b.bed_number, b.ward " +
                                      "FROM patients p LEFT JOIN beds b ON p.bed_id = b.id WHERE p.id = ?;";

        String insertBillSql = "INSERT INTO bills (id, invoice_number, patient_id, consultation_fee, medicine_charges, total_amount, bill_date, payment_status, payment_method) " +
                               "VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'Paid', 'Cash');";

        String updatePatientSql = "UPDATE patients SET admission_status = 'Discharged', discharged_date = CURDATE(), discharge_summary = ?, total_billed_amount = ? WHERE id = ?;";

        String updateBedSql = "UPDATE beds SET status = 'Available', patient_id = NULL, allocated_date = NULL WHERE id = ?;";

        try {
            conn.setAutoCommit(false); // Atomic Transaction

            String bedId = null;
            String bedNumber = "OPD";
            double dailyCharge = 800.0;
            int days = 1;

            try (PreparedStatement pstmt = conn.prepareStatement(findPatientAndBedSql)) {
                pstmt.setString(1, patientId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        bedId = rs.getString("bed_id");
                        if (rs.getString("bed_number") != null) bedNumber = rs.getString("bed_number");
                        if (rs.getDouble("daily_charge") > 0) dailyCharge = rs.getDouble("daily_charge");
                    } else {
                        System.err.println("[ERROR] Patient ID " + patientId + " not found.");
                        conn.rollback();
                        return false;
                    }
                }
            }

            // Calculate billing amounts
            double consultationFee = 600.0;
            double bedCharges = dailyCharge * days;
            double totalAmount = (consultationFee + bedCharges + medicineCharges) - discount;
            String billId = "bill-" + System.currentTimeMillis();
            String invoiceNo = "INV-" + LocalDate.now().getYear() + "-" + (int)(Math.random() * 900 + 100);

            // Step 1: Insert Bill
            try (PreparedStatement pstmtBill = conn.prepareStatement(insertBillSql)) {
                pstmtBill.setString(1, billId);
                pstmtBill.setString(2, invoiceNo);
                pstmtBill.setString(3, patientId);
                pstmtBill.setDouble(4, consultationFee);
                pstmtBill.setDouble(5, medicineCharges + bedCharges);
                pstmtBill.setDouble(6, totalAmount);
                pstmtBill.executeUpdate();
            }

            // Step 2: Update Patient Status to 'Discharged'
            try (PreparedStatement pstmtPat = conn.prepareStatement(updatePatientSql)) {
                pstmtPat.setString(1, dischargeSummary);
                pstmtPat.setDouble(2, totalAmount);
                pstmtPat.setString(3, patientId);
                pstmtPat.executeUpdate();
            }

            // Step 3: Update Bed Status Back to 'Available'
            if (bedId != null) {
                try (PreparedStatement pstmtBed = conn.prepareStatement(updateBedSql)) {
                    pstmtBed.setString(1, bedId);
                    pstmtBed.executeUpdate();
                }
            }

            conn.commit(); // Commit all 3 operations simultaneously

            System.out.println("\n===================================================================");
            System.out.println("   DISCHARGE & BILLING 3-IN-1 TRANSACTION COMPLETED SUCCESSFULLY   ");
            System.out.println("===================================================================");
            System.out.printf("[1] BILL GENERATED : Invoice %s | Total Amount: Rs. %.2f (PAID)\n", invoiceNo, totalAmount);
            System.out.printf("[2] PATIENT UPDATED: Patient %s status -> 'Discharged'\n", patientId);
            System.out.printf("[3] BED RELEASED   : Bed %s (%s) status -> 'Available'\n", bedNumber, bedId != null ? bedId : "N/A");
            System.out.println("===================================================================");
            return true;
        } catch (SQLException e) {
            try { conn.rollback(); } catch (SQLException ignored) {}
            System.err.println("[ERROR] 3-in-1 Discharge transaction failed: " + e.getMessage());
            return false;
        } finally {
            try { conn.setAutoCommit(true); } catch (SQLException ignored) {}
        }
    }
}
