package com.medicare;

import com.medicare.db.DBConnection;
import com.medicare.modules.AdminModule;
import com.medicare.modules.ReceptionistModule;
import com.medicare.modules.DoctorModule;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Scanner;

/**
 * HospitalManagementSystem - Main Entry Point for College Java Mini Project
 *
 * Implements:
 * 1. Admin Options (Manage Staff INSERT/DELETE, Monitor Operations SELECT, View Discharged Patients SELECT)
 * 2. Receptionist Options (Patient Registration INSERT, Appointments INSERT, Bed Allocation UPDATE, Discharge & Billing 3-in-1)
 * 3. Doctor Options (Daily Schedule SELECT, Check Medical History SELECT, Write Prescription/Diagnosis UPDATE)
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
            System.out.println("[DB STATUS] Connected to MySQL database 'hospital_db' successfully.\n");
        } catch (SQLException e) {
            System.out.println("[DB NOTICE] Running in Standalone Demonstration Mode (SQL Statements will be displayed).\n");
        }

        boolean running = true;
        while (running) {
            System.out.println("\n----------------- SELECT ROLE / LOGIN PORTAL -----------------");
            System.out.println("1. Admin Portal (System Management & Oversight)");
            System.out.println("2. Receptionist Portal (Patient Registration, Beds & Discharge)");
            System.out.println("3. Doctor Portal (Consultations, History & Prescriptions)");
            System.out.println("4. Exit Application");
            System.out.print("Enter your choice (1-4): ");

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
                    System.out.println("\nThank you for using Nexus Care Hospital Management System. Good luck with your college project!");
                    break;
                default:
                    System.out.println("Invalid selection. Please choose 1, 2, 3, or 4.");
            }
        }

        DBConnection.close(conn);
        scanner.close();
    }

    private static void handleAdminMenu(Scanner sc, Connection conn) {
        System.out.println("\n--- ADMIN LOGIN ---");
        System.out.println("Demo Credentials: admin@medicare.com / admin123");
        System.out.print("Enter Email: ");
        String email = sc.nextLine().trim();
        System.out.print("Enter Password: ");
        String pass = sc.nextLine().trim();

        if (!email.equals("admin@medicare.com") && !pass.equals("admin123")) {
            System.out.println("[AUTH] Authenticated as Administrator.");
        }

        boolean inAdmin = true;
        while (inAdmin) {
            System.out.println("\n================== ADMIN SYSTEM MANAGEMENT ==================");
            System.out.println("1. Add Doctor (SQL INSERT - Profile & Credentials)");
            System.out.println("2. Delete Doctor (SQL DELETE - Offboarding)");
            System.out.println("3. Add Receptionist (SQL INSERT - Front Desk Staff)");
            System.out.println("4. Delete Receptionist (SQL DELETE - Staff Removal)");
            System.out.println("5. Monitor Operations (SQL SELECT - Inpatients, Beds & Revenue)");
            System.out.println("6. View Discharged Patients Master View (SQL SELECT - Treated History)");
            System.out.println("7. Back to Role Selection");
            System.out.print("Select an option (1-7): ");

            String option = sc.nextLine().trim();
            switch (option) {
                case "1":
                    System.out.print("Doctor Full Name: ");
                    String docName = sc.nextLine().trim();
                    System.out.print("Specialization (Cardiologist/Dermatologist/Orthopedic/General Physician/Neurologist): ");
                    String spec = sc.nextLine().trim();
                    System.out.print("Contact Phone: ");
                    String docPhone = sc.nextLine().trim();
                    System.out.print("Official Email: ");
                    String docEmail = sc.nextLine().trim();
                    System.out.print("Consultation Fee (Rs): ");
                    double fee = Double.parseDouble(sc.nextLine().trim());
                    System.out.print("OPD Room/Chamber (e.g. OPD-105): ");
                    String room = sc.nextLine().trim();
                    System.out.print("Shift Timing (e.g. 09:00 - 17:00): ");
                    String shift = sc.nextLine().trim();
                    System.out.print("Break Timing (e.g. 13:00 - 14:00 Lunch): ");
                    String breakTime = sc.nextLine().trim();

                    if (conn != null) {
                        AdminModule.addDoctor(conn, docName, spec, docPhone, docEmail, fee, room, shift, breakTime);
                    } else {
                        System.out.println("\n[SQL SIMULATION]: INSERT INTO doctors VALUES ('doc-new', '" + docName + "', '" + spec + "', " + fee + ");");
                        System.out.println("[SQL SIMULATION]: INSERT INTO users VALUES ('usr-new', '" + docName + "', '" + docEmail + "', 'doctor123', 'doctor');");
                    }
                    break;

                case "2":
                    System.out.print("Enter Doctor ID to delete (e.g. doc-1): ");
                    String delDocId = sc.nextLine().trim();
                    if (conn != null) {
                        AdminModule.deleteDoctor(conn, delDocId);
                    } else {
                        System.out.println("[SQL SIMULATION]: DELETE FROM doctors WHERE id = '" + delDocId + "';");
                        System.out.println("[SQL SIMULATION]: DELETE FROM users WHERE doctor_id = '" + delDocId + "';");
                    }
                    break;

                case "3":
                    System.out.print("Receptionist Full Name: ");
                    String recName = sc.nextLine().trim();
                    System.out.print("Email: ");
                    String recEmail = sc.nextLine().trim();
                    System.out.print("Phone: ");
                    String recPhone = sc.nextLine().trim();
                    System.out.print("Shift (Morning/Evening/Night): ");
                    String recShift = sc.nextLine().trim();
                    System.out.print("Desk Counter (e.g. Counter A-1): ");
                    String recDesk = sc.nextLine().trim();

                    if (conn != null) {
                        AdminModule.addReceptionist(conn, recName, recEmail, recPhone, recShift, recDesk);
                    } else {
                        System.out.println("\n[SQL SIMULATION]: INSERT INTO receptionists VALUES ('rec-new', '" + recName + "', '" + recEmail + "', '" + recShift + "');");
                        System.out.println("[SQL SIMULATION]: INSERT INTO users VALUES ('usr-new', '" + recName + "', '" + recEmail + "', 'reception123', 'receptionist');");
                    }
                    break;

                case "4":
                    System.out.print("Enter Receptionist ID to delete (e.g. rec-1): ");
                    String delRecId = sc.nextLine().trim();
                    if (conn != null) {
                        AdminModule.deleteReceptionist(conn, delRecId);
                    } else {
                        System.out.println("[SQL SIMULATION]: DELETE FROM receptionists WHERE id = '" + delRecId + "';");
                    }
                    break;

                case "5":
                    if (conn != null) {
                        AdminModule.monitorOperations(conn);
                    } else {
                        System.out.println("\n[SQL SIMULATION]: SELECT (SELECT COUNT(*) FROM patients WHERE admission_status='Admitted') AS admitted, (SELECT COUNT(*) FROM beds WHERE status='Available') AS available_beds;");
                        System.out.println("Hospital Operations Overview: Admitted Inpatients: 2 | Available Beds: 10 | Revenue: Rs. 148,200.00");
                    }
                    break;

                case "6":
                    if (conn != null) {
                        AdminModule.viewDischargedPatients(conn);
                    } else {
                        System.out.println("\n[SQL SIMULATION]: SELECT * FROM patients WHERE admission_status = 'Discharged' ORDER BY discharged_date DESC;");
                        System.out.println("Discharged: Kavita Iyer (pat-6) | Admitted: 2026-10-06 | Discharged: 2026-10-13 | Disease: Intractable Migraine | Billed: Rs. 3,200.00");
                        System.out.println("Discharged: Deepak Verma (pat-8) | Admitted: 2026-10-04 | Discharged: 2026-10-12 | Disease: Unstable Angina | Billed: Rs. 8,400.00");
                    }
                    break;

                case "7":
                    inAdmin = false;
                    break;

                default:
                    System.out.println("Invalid option.");
            }
        }
    }

    private static void handleReceptionistMenu(Scanner sc, Connection conn) {
        System.out.println("\n--- RECEPTIONIST LOGIN ---");
        System.out.println("Demo Credentials: reception@medicare.com / reception123");

        boolean inRec = true;
        while (inRec) {
            System.out.println("\n============== RECEPTIONIST PATIENT HANDLING ==============");
            System.out.println("1. Register New Patient (SQL INSERT - Generate Unique Patient ID)");
            System.out.println("2. Book Appointment (SQL INSERT - Link Patient ID & Doctor ID)");
            System.out.println("3. Bed Allocation (SQL UPDATE - Bed 'Available' -> 'Occupied')");
            System.out.println("4. Discharge & Billing (3-in-1 Transaction: Bill + Discharged + Free Bed)");
            System.out.println("5. Back to Role Selection");
            System.out.print("Select an option (1-5): ");

            String option = sc.nextLine().trim();
            switch (option) {
                case "1":
                    System.out.print("Patient Full Name: ");
                    String pName = sc.nextLine().trim();
                    System.out.print("Age: ");
                    int age = Integer.parseInt(sc.nextLine().trim());
                    System.out.print("Gender (Male/Female/Other): ");
                    String gender = sc.nextLine().trim();
                    System.out.print("Contact Phone: ");
                    String phone = sc.nextLine().trim();
                    System.out.print("Residential Address: ");
                    String address = sc.nextLine().trim();
                    System.out.print("Chief Complaint / Syndrome (Fever/Chest Pain/Fracture/Skin Allergy/Migraine/Diabetes): ");
                    String syndrome = sc.nextLine().trim();
                    System.out.print("Blood Group: ");
                    String bg = sc.nextLine().trim();

                    if (conn != null) {
                        ReceptionistModule.registerPatient(conn, pName, age, gender, phone, address, syndrome, bg);
                    } else {
                        String mockId = "pat-" + System.currentTimeMillis();
                        System.out.println("\n[SQL SIMULATION]: INSERT INTO patients VALUES ('" + mockId + "', '" + pName + "', " + age + ", '" + syndrome + "');");
                        System.out.println("[SUCCESS] Generated Patient ID: " + mockId);
                    }
                    break;

                case "2":
                    System.out.print("Enter Patient ID (e.g. pat-1): ");
                    String pId = sc.nextLine().trim();
                    System.out.print("Enter Doctor ID (e.g. doc-1): ");
                    String dId = sc.nextLine().trim();
                    System.out.print("Date (YYYY-MM-DD): ");
                    String appDate = sc.nextLine().trim();
                    System.out.print("Time Slot (e.g. 10:30): ");
                    String appTime = sc.nextLine().trim();
                    System.out.print("Syndrome: ");
                    String syn = sc.nextLine().trim();

                    if (conn != null) {
                        ReceptionistModule.bookAppointment(conn, pId, dId, appDate, appTime, syn, "Scheduled at reception desk");
                    } else {
                        System.out.println("\n[SQL SIMULATION]: INSERT INTO appointments VALUES ('app-new', '" + pId + "', '" + dId + "', '" + appDate + "', '" + appTime + "', 'Scheduled');");
                        System.out.println("[SUCCESS] Linked Patient " + pId + " to Doctor " + dId);
                    }
                    break;

                case "3":
                    System.out.print("Enter Bed ID to allocate (e.g. bed-2, bed-3, bed-6): ");
                    String bedId = sc.nextLine().trim();
                    System.out.print("Enter Patient ID to admit (e.g. pat-3): ");
                    String admitPatId = sc.nextLine().trim();

                    if (conn != null) {
                        ReceptionistModule.allocateBed(conn, bedId, admitPatId);
                    } else {
                        System.out.println("\n[SQL SIMULATION]: UPDATE beds SET status='Occupied', patient_id='" + admitPatId + "' WHERE id='" + bedId + "';");
                        System.out.println("[SQL SIMULATION]: UPDATE patients SET admission_status='Admitted', bed_id='" + bedId + "' WHERE id='" + admitPatId + "';");
                    }
                    break;

                case "4":
                    System.out.print("Enter Patient ID to Discharge (e.g. pat-2): ");
                    String disPatId = sc.nextLine().trim();
                    System.out.print("Medicine Charges (Rs): ");
                    double medCharges = Double.parseDouble(sc.nextLine().trim());
                    System.out.print("Discount (Rs): ");
                    double disc = Double.parseDouble(sc.nextLine().trim());
                    System.out.print("Clinical Discharge Summary: ");
                    String disSummary = sc.nextLine().trim();

                    if (conn != null) {
                        ReceptionistModule.dischargePatient(conn, disPatId, medCharges, disc, disSummary);
                    } else {
                        System.out.println("\n[3-IN-1 TRANSACTION SIMULATION]:");
                        System.out.println("  1. INSERT INTO bills (invoice_no, patient_id, total_amount) VALUES ('INV-2026-099', '" + disPatId + "', 2450.00);");
                        System.out.println("  2. UPDATE patients SET admission_status='Discharged', discharged_date=CURDATE() WHERE id='" + disPatId + "';");
                        System.out.println("  3. UPDATE beds SET status='Available', patient_id=NULL WHERE patient_id='" + disPatId + "';");
                        System.out.println("[SUCCESS] Patient " + disPatId + " Discharged and Bed released to Available.");
                    }
                    break;

                case "5":
                    inRec = false;
                    break;

                default:
                    System.out.println("Invalid option.");
            }
        }
    }

    private static void handleDoctorMenu(Scanner sc, Connection conn) {
        System.out.println("\n--- DOCTOR LOGIN ---");
        System.out.println("Demo Doctor: Dr. Rajesh Sharma (ID: doc-1) / doctor@medicare.com / doctor123");
        System.out.print("Enter Doctor ID (default: doc-1): ");
        String docId = sc.nextLine().trim();
        if (docId.isEmpty()) docId = "doc-1";

        boolean inDoc = true;
        while (inDoc) {
            System.out.println("\n============== DOCTOR MEDICAL CARE CLINICAL SUITE ==============");
            System.out.println("1. View Daily Consultation Schedule (SQL SELECT - Today's Appts for this Doctor)");
            System.out.println("2. Check Patient Medical History (SQL SELECT - Past Diagnoses & Records)");
            System.out.println("3. Write Prescription & Diagnosis (SQL UPDATE - 'Save Record' to active appt)");
            System.out.println("4. Back to Role Selection");
            System.out.print("Select an option (1-4): ");

            String option = sc.nextLine().trim();
            switch (option) {
                case "1":
                    if (conn != null) {
                        DoctorModule.viewDailySchedule(conn, docId);
                    } else {
                        System.out.println("\n[SQL SIMULATION]: SELECT * FROM appointments WHERE doctor_id='" + docId + "' AND date=CURDATE();");
                        System.out.println("Scheduled Consultations Today: 2 patients waiting in OPD queue.");
                    }
                    break;

                case "2":
                    System.out.print("Enter Patient ID to check medical background (e.g. pat-2, pat-6): ");
                    String patId = sc.nextLine().trim();
                    if (conn != null) {
                        DoctorModule.checkMedicalHistory(conn, patId);
                    } else {
                        System.out.println("\n[SQL SIMULATION]: SELECT * FROM appointments WHERE patient_id='" + patId + "' ORDER BY date DESC;");
                        System.out.println("Patient History: Sunita Roy (pat-2) | Prior Visit: Chest Pain | Diagnosis: Angina Pectoris | Rx: Tab Sorbitrate 5mg");
                    }
                    break;

                case "3":
                    System.out.print("Enter Active Appointment ID (e.g. app-1): ");
                    String appId = sc.nextLine().trim();
                    System.out.print("Confirmed Disease / Diagnosis Name: ");
                    String disease = sc.nextLine().trim();
                    System.out.print("Prescription (Medicines, Dosage, Days): ");
                    String rx = sc.nextLine().trim();
                    System.out.print("Clinical Examination & Consultation Notes: ");
                    String notes = sc.nextLine().trim();

                    if (conn != null) {
                        DoctorModule.saveRecord(conn, appId, disease, rx, notes);
                    } else {
                        System.out.println("\n[SQL SIMULATION]: UPDATE appointments SET disease_name='" + disease + "', prescription='" + rx + "', notes='" + notes + "', status='Completed' WHERE id='" + appId + "';");
                        System.out.println("[SQL SIMULATION]: UPDATE patients SET disease_name='" + disease + "' WHERE id=(SELECT patient_id FROM appointments WHERE id='" + appId + "');");
                        System.out.println("[SUCCESS] Consultation record saved and appointment marked Completed.");
                    }
                    break;

                case "4":
                    inDoc = false;
                    break;

                default:
                    System.out.println("Invalid option.");
            }
        }
    }
}
