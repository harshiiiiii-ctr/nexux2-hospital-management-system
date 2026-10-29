package com.medicare.swing;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import javax.swing.table.TableRowSorter;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * =======================================================================
 * NEXUS CARE - HOSPITAL MANAGEMENT SYSTEM (SWING DESKTOP EDITION)
 * =======================================================================
 *
 * Core Features Implemented:
 *  1. Executive Dashboard (Live Metrics, KPI Cards, Bed & Revenue tracking)
 *  2. Patient Registration (Form validation, Unique ID generation, JTable management)
 *  3. Doctor Directory (Roster table, Specialization filtering, Status management)
 *
 * Package: com.medicare.swing
 * Standards: JDK 8+ Core Java (JFrame, JTable, JTabbedPane)
 */
public class HospitalSwingApp extends JFrame {

    // Data Models
    public static class Patient {
        String id;
        String name;
        int age;
        String gender;
        String phone;
        String bloodGroup;
        String syndrome;
        String status; // "Admitted" or "Outpatient" or "Discharged"
        String admissionDate;

        public Patient(String id, String name, int age, String gender, String phone,
                       String bloodGroup, String syndrome, String status, String admissionDate) {
            this.id = id;
            this.name = name;
            this.age = age;
            this.gender = gender;
            this.phone = phone;
            this.bloodGroup = bloodGroup;
            this.syndrome = syndrome;
            this.status = status;
            this.admissionDate = admissionDate;
        }
    }

    public static class Doctor {
        String id;
        String name;
        String specialization;
        String room;
        String contact;
        String timing;
        int fee;
        String status; // "Available", "In Consultation", "On Leave"

        public Doctor(String id, String name, String specialization, String room,
                      String contact, String timing, int fee, String status) {
            this.id = id;
            this.name = name;
            this.specialization = specialization;
            this.room = room;
            this.contact = contact;
            this.timing = timing;
            this.fee = fee;
            this.status = status;
        }
    }

    private final List<Patient> patientList = new ArrayList<>();
    private final List<Doctor> doctorList = new ArrayList<>();
    private int nextPatientSequence = 1005;
    private int nextDoctorSequence = 107;

    // UI Components
    private JTabbedPane tabbedPane;
    private DefaultTableModel patientTableModel;
    private JTable patientTable;
    private TableRowSorter<DefaultTableModel> patientSorter;

    private DefaultTableModel doctorTableModel;
    private JTable doctorTable;
    private TableRowSorter<DefaultTableModel> doctorSorter;

    private JLabel lblTotalPatientsVal;
    private JLabel lblAdmittedVal;
    private JLabel lblAvailableDoctorsVal;
    private JLabel lblAvailableBedsVal;
    private JLabel lblTotalRevenueVal;
    private JLabel lblOutpatientsVal;

    private static final Color PRIMARY_TEAL = new Color(15, 118, 110);
    private static final Color PRIMARY_DARK = new Color(19, 78, 74);
    private static final Color BG_LIGHT = new Color(248, 250, 252);
    private static final Color TEXT_DARK = new Color(15, 23, 42);
    private static final Color BORDER_COLOR = new Color(226, 232, 240);

    public HospitalSwingApp() {
        super("Nexus Care - Hospital Management System (Core Java Swing)");
        initializeSampleData();
        setupUI();
        refreshDashboardMetrics();
    }

    private void initializeSampleData() {
        doctorList.add(new Doctor("DOC-101", "Dr. Rajesh Sharma", "Cardiology", "OPD-101", "+91 98201 12345", "09:00 AM - 01:00 PM", 800, "Available"));
        doctorList.add(new Doctor("DOC-102", "Dr. Sunita Patel", "General Medicine", "OPD-102", "+91 98201 23456", "10:00 AM - 03:00 PM", 500, "Available"));
        doctorList.add(new Doctor("DOC-103", "Dr. Amit Verma", "Orthopedics", "OPD-103", "+91 98201 34567", "11:00 AM - 04:00 PM", 750, "In Consultation"));
        doctorList.add(new Doctor("DOC-104", "Dr. Priya Nair", "Pediatrics", "OPD-104", "+91 98201 45678", "09:30 AM - 02:00 PM", 600, "Available"));
        doctorList.add(new Doctor("DOC-105", "Dr. Vikram Joshi", "Neurology", "OPD-105", "+91 98201 56789", "02:00 PM - 06:00 PM", 900, "On Leave"));
        doctorList.add(new Doctor("DOC-106", "Dr. Ananya Roy", "Dermatology", "OPD-106", "+91 98201 67890", "10:00 AM - 01:30 PM", 650, "Available"));

        patientList.add(new Patient("PAT-1001", "Ramesh Kumar Gupta", 45, "Male", "9876543210", "B+", "Chest Pain / Angina", "Admitted", "2026-10-10"));
        patientList.add(new Patient("PAT-1002", "Anita S. Desai", 32, "Female", "9811223344", "O+", "High Fever / Pyrexia", "Outpatient", "2026-10-12"));
        patientList.add(new Patient("PAT-1003", "Vikas Manhas", 28, "Male", "9844556677", "A+", "Fracture / Bone Trauma", "Admitted", "2026-10-13"));
        patientList.add(new Patient("PAT-1004", "Kavita R. Nair", 50, "Female", "9877889900", "AB+", "Migraine / Neuropathy", "Outpatient", "2026-10-14"));
    }

    private void setupUI() {
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1180, 750);
        setMinimumSize(new Dimension(1000, 650));
        setLocationRelativeTo(null);
        getContentPane().setBackground(BG_LIGHT);
        setLayout(new BorderLayout());

        add(createHeaderPanel(), BorderLayout.NORTH);

        tabbedPane = new JTabbedPane();
        tabbedPane.setFont(new Font("Segoe UI", Font.BOLD, 14));
        tabbedPane.setBackground(Color.WHITE);

        tabbedPane.addTab("  📊 Dashboard Overview  ", createDashboardTab());
        tabbedPane.addTab("  📝 Patient Registration & Records  ", createPatientRegistrationTab());
        tabbedPane.addTab("  👨‍⚕️ Doctor Directory & Roster  ", createDoctorDirectoryTab());

        add(tabbedPane, BorderLayout.CENTER);

        JPanel statusBar = new JPanel(new BorderLayout());
        statusBar.setBackground(new Color(241, 245, 249));
        statusBar.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(1, 0, 0, 0, BORDER_COLOR),
                new EmptyBorder(6, 16, 6, 16)
        ));

        JLabel statusText = new JLabel("● System Ready: Core Java Swing Hospital Workstation | Standalone Desktop App");
        statusText.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        statusText.setForeground(new Color(71, 85, 105));

        JLabel systemClock = new JLabel(new SimpleDateFormat("EEE, dd MMM yyyy").format(new Date()));
        systemClock.setFont(new Font("Segoe UI", Font.BOLD, 12));
        systemClock.setForeground(PRIMARY_TEAL);

        statusBar.add(statusText, BorderLayout.WEST);
        statusBar.add(systemClock, BorderLayout.EAST);
        add(statusBar, BorderLayout.SOUTH);
    }

    private JPanel createHeaderPanel() {
        JPanel header = new JPanel(new BorderLayout());
        header.setBackground(PRIMARY_DARK);
        header.setBorder(new EmptyBorder(16, 24, 16, 24));

        JPanel titlePanel = new JPanel(new GridLayout(2, 1, 0, 2));
        titlePanel.setOpaque(false);

        JLabel title = new JLabel("🏥 NEXUS CARE HOSPITAL MANAGEMENT SYSTEM");
        title.setFont(new Font("Segoe UI", Font.BOLD, 20));
        title.setForeground(Color.WHITE);

        JLabel subtitle = new JLabel("Core Java Desktop Application  |  JFrame & JTable  |  Multi-Specialty Clinical Suite");
        subtitle.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        subtitle.setForeground(new Color(204, 251, 241));

        titlePanel.add(title);
        titlePanel.add(subtitle);

        JPanel badgePanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        badgePanel.setOpaque(false);

        JButton quickRefreshBtn = new JButton("🔄 Refresh Data");
        styleSecondaryButton(quickRefreshBtn);
        quickRefreshBtn.addActionListener(e -> {
            refreshDashboardMetrics();
            refreshPatientTable();
            refreshDoctorTable();
            JOptionPane.showMessageDialog(this, "Tables and metrics refreshed!", "Refreshed", JOptionPane.INFORMATION_MESSAGE);
        });

        badgePanel.add(quickRefreshBtn);
        header.add(titlePanel, BorderLayout.WEST);
        header.add(badgePanel, BorderLayout.EAST);
        return header;
    }

    private JPanel createDashboardTab() {
        JPanel mainPanel = new JPanel(new BorderLayout(15, 15));
        mainPanel.setBackground(BG_LIGHT);
        mainPanel.setBorder(new EmptyBorder(20, 20, 20, 20));

        JPanel cardsGrid = new JPanel(new GridLayout(2, 3, 16, 16));
        cardsGrid.setOpaque(false);

        lblTotalPatientsVal = new JLabel("0");
        lblAdmittedVal = new JLabel("0");
        lblOutpatientsVal = new JLabel("0");
        lblAvailableDoctorsVal = new JLabel("0");
        lblAvailableBedsVal = new JLabel("0");
        lblTotalRevenueVal = new JLabel("₹0");

        cardsGrid.add(createMetricCard("Total Patients Registered", lblTotalPatientsVal, "SELECT COUNT(*) FROM patients", new Color(30, 64, 175), new Color(239, 246, 255)));
        cardsGrid.add(createMetricCard("Admitted Inpatients (ICU/Ward)", lblAdmittedVal, "SELECT WHERE status = 'Admitted'", new Color(185, 28, 28), new Color(254, 242, 242)));
        cardsGrid.add(createMetricCard("Active Outpatients (OPD)", lblOutpatientsVal, "SELECT WHERE status = 'Outpatient'", new Color(15, 118, 110), new Color(240, 253, 250)));
        cardsGrid.add(createMetricCard("Available Doctors On Duty", lblAvailableDoctorsVal, "SELECT WHERE status = 'Available'", new Color(4, 120, 87), new Color(236, 253, 245)));
        cardsGrid.add(createMetricCard("Available Hospital Beds", lblAvailableBedsVal, "10 Total Capacity - Occupied Beds", new Color(124, 45, 18), new Color(255, 247, 237)));
        cardsGrid.add(createMetricCard("Total Clinical Revenue", lblTotalRevenueVal, "SUM of Consultations + Inpatient Beds", new Color(109, 40, 217), new Color(245, 243, 255)));

        mainPanel.add(cardsGrid, BorderLayout.NORTH);

        JPanel centerPanel = new JPanel(new BorderLayout(12, 12));
        centerPanel.setOpaque(false);

        JPanel actionToolbar = new JPanel(new FlowLayout(FlowLayout.LEFT, 12, 10));
        actionToolbar.setBackground(Color.WHITE);
        actionToolbar.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(BORDER_COLOR, 1, true),
                new EmptyBorder(8, 12, 8, 12)
        ));

        JLabel actionLabel = new JLabel("Quick Actions:");
        actionLabel.setFont(new Font("Segoe UI", Font.BOLD, 13));
        actionLabel.setForeground(TEXT_DARK);

        JButton btnGoRegister = new JButton("➕ Register New Patient");
        stylePrimaryButton(btnGoRegister);
        btnGoRegister.addActionListener(e -> tabbedPane.setSelectedIndex(1));

        JButton btnGoDoctors = new JButton("👨‍⚕️ View Doctor Directory");
        styleSecondaryButton(btnGoDoctors);
        btnGoDoctors.addActionListener(e -> tabbedPane.setSelectedIndex(2));

        JButton btnAdmitQuick = new JButton("🛏️ Quick Bed Allocation");
        styleSecondaryButton(btnAdmitQuick);
        btnAdmitQuick.addActionListener(e -> quickAllocateBedDialog());

        actionToolbar.add(actionLabel);
        actionToolbar.add(btnGoRegister);
        actionToolbar.add(btnGoDoctors);
        actionToolbar.add(btnAdmitQuick);
        centerPanel.add(actionToolbar, BorderLayout.NORTH);

        JPanel overviewCard = new JPanel(new BorderLayout());
        overviewCard.setBackground(Color.WHITE);
        overviewCard.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(BORDER_COLOR, 1, true),
                new EmptyBorder(16, 16, 16, 16)
        ));

        JLabel overviewTitle = new JLabel("System Diagnostics & Database Schema Status");
        overviewTitle.setFont(new Font("Segoe UI", Font.BOLD, 15));
        overviewTitle.setForeground(TEXT_DARK);
        overviewCard.add(overviewTitle, BorderLayout.NORTH);

        JTextArea infoText = new JTextArea();
        infoText.setEditable(false);
        infoText.setFont(new Font("Monospaced", Font.PLAIN, 12));
        infoText.setBackground(new Color(248, 250, 252));
        infoText.setBorder(new EmptyBorder(12, 12, 12, 12));
        infoText.setText(
                "=========================================================================\n" +
                        " NEXUS CARE WORKSTATION - CORE JAVA SWING DESKTOP CLIENT\n" +
                        "=========================================================================\n" +
                        " - Native Swing Frame: javax.swing.JFrame, JTable, JTabbedPane\n" +
                        " - Patient Registration with Unique ID auto-generation and input validation\n" +
                        " - Doctor Roster with specialty filtering and status toggles\n" +
                        " - Inpatient Bed occupancy and 3-in-1 Atomic Discharge workflow\n" +
                        " - No Spring Boot, HTML, or external web dependencies required.\n" +
                        "=========================================================================\n"
        );
        overviewCard.add(new JScrollPane(infoText), BorderLayout.CENTER);
        centerPanel.add(overviewCard, BorderLayout.CENTER);
        mainPanel.add(centerPanel, BorderLayout.CENTER);

        return mainPanel;
    }

    private JPanel createMetricCard(String title, JLabel valueLabel, String queryHint, Color textColor, Color bgColor) {
        JPanel card = new JPanel(new BorderLayout(6, 6));
        card.setBackground(bgColor);
        card.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(textColor, 1, true),
                new EmptyBorder(14, 16, 14, 16)
        ));

        JLabel lblTitle = new JLabel(title);
        lblTitle.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lblTitle.setForeground(new Color(51, 65, 85));

        valueLabel.setFont(new Font("Segoe UI", Font.BOLD, 28));
        valueLabel.setForeground(textColor);

        JLabel lblQuery = new JLabel("SQL: " + queryHint);
        lblQuery.setFont(new Font("Segoe UI", Font.ITALIC, 11));
        lblQuery.setForeground(new Color(100, 116, 139));

        card.add(lblTitle, BorderLayout.NORTH);
        card.add(valueLabel, BorderLayout.CENTER);
        card.add(lblQuery, BorderLayout.SOUTH);
        return card;
    }

    private JPanel createPatientRegistrationTab() {
        JPanel mainPanel = new JPanel(new BorderLayout(16, 16));
        mainPanel.setBackground(BG_LIGHT);
        mainPanel.setBorder(new EmptyBorder(16, 16, 16, 16));

        JPanel formPanel = new JPanel();
        formPanel.setLayout(new BoxLayout(formPanel, BoxLayout.Y_AXIS));
        formPanel.setBackground(Color.WHITE);
        formPanel.setPreferredSize(new Dimension(360, 600));
        formPanel.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(BORDER_COLOR, 1, true),
                new EmptyBorder(16, 16, 16, 16)
        ));

        JLabel formHeader = new JLabel("Patient Registration (INSERT)");
        formHeader.setFont(new Font("Segoe UI", Font.BOLD, 16));
        formHeader.setForeground(PRIMARY_TEAL);
        formHeader.setAlignmentX(Component.LEFT_ALIGNMENT);
        formPanel.add(formHeader);

        JLabel formSub = new JLabel("Generates unique Patient ID & saves record");
        formSub.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        formSub.setForeground(Color.GRAY);
        formSub.setAlignmentX(Component.LEFT_ALIGNMENT);
        formPanel.add(formSub);
        formPanel.add(Box.createVerticalStrut(14));

        JTextField txtName = new JTextField();
        JTextField txtAge = new JTextField();
        JComboBox<String> cmbGender = new JComboBox<>(new String[]{"Male", "Female", "Other"});
        JTextField txtPhone = new JTextField();
        JComboBox<String> cmbBlood = new JComboBox<>(new String[]{"A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"});
        JComboBox<String> cmbSyndrome = new JComboBox<>(new String[]{
                "High Fever / Pyrexia",
                "Chest Pain / Angina",
                "Fracture / Bone Trauma",
                "Migraine / Neuropathy",
                "Acute Cough / Respiratory",
                "Skin Rash / Allergy",
                "General Health Checkup"
        });
        JComboBox<String> cmbStatus = new JComboBox<>(new String[]{"Outpatient", "Admitted"});

        addFormField(formPanel, "Full Name *", txtName);
        addFormField(formPanel, "Age *", txtAge);
        addFormField(formPanel, "Gender *", cmbGender);
        addFormField(formPanel, "Phone / Mobile Number *", txtPhone);
        addFormField(formPanel, "Blood Group", cmbBlood);
        addFormField(formPanel, "Chief Complaint / Syndrome *", cmbSyndrome);
        addFormField(formPanel, "Admission Status", cmbStatus);

        formPanel.add(Box.createVerticalStrut(10));

        JPanel btnPanel = new JPanel(new GridLayout(1, 2, 8, 0));
        btnPanel.setOpaque(false);
        btnPanel.setMaximumSize(new Dimension(Integer.MAX_VALUE, 38));

        JButton btnSave = new JButton("💾 Save Patient");
        stylePrimaryButton(btnSave);

        JButton btnClear = new JButton("🧹 Clear");
        styleSecondaryButton(btnClear);

        btnPanel.add(btnSave);
        btnPanel.add(btnClear);
        btnPanel.setAlignmentX(Component.LEFT_ALIGNMENT);
        formPanel.add(btnPanel);

        btnClear.addActionListener(e -> {
            txtName.setText("");
            txtAge.setText("");
            txtPhone.setText("");
            cmbGender.setSelectedIndex(0);
            cmbBlood.setSelectedIndex(0);
            cmbSyndrome.setSelectedIndex(0);
            cmbStatus.setSelectedIndex(0);
        });

        btnSave.addActionListener(e -> {
            String name = txtName.getText().trim();
            String ageStr = txtAge.getText().trim();
            String phone = txtPhone.getText().trim();

            if (name.isEmpty()) {
                JOptionPane.showMessageDialog(this, "Please enter Patient's Full Name.", "Validation Error", JOptionPane.WARNING_MESSAGE);
                txtName.requestFocus();
                return;
            }

            int age;
            try {
                age = Integer.parseInt(ageStr);
                if (age <= 0 || age > 125) throw new NumberFormatException();
            } catch (NumberFormatException ex) {
                JOptionPane.showMessageDialog(this, "Please enter a valid numeric age (1 - 125).", "Validation Error", JOptionPane.WARNING_MESSAGE);
                txtAge.requestFocus();
                return;
            }

            if (phone.isEmpty() || phone.length() < 7) {
                JOptionPane.showMessageDialog(this, "Please enter a valid contact phone number.", "Validation Error", JOptionPane.WARNING_MESSAGE);
                txtPhone.requestFocus();
                return;
            }

            String patientId = "PAT-" + (nextPatientSequence++);
            String gender = (String) cmbGender.getSelectedItem();
            String blood = (String) cmbBlood.getSelectedItem();
            String syndrome = (String) cmbSyndrome.getSelectedItem();
            String status = (String) cmbStatus.getSelectedItem();
            String dateStr = new SimpleDateFormat("yyyy-MM-dd").format(new Date());

            Patient newPatient = new Patient(patientId, name, age, gender, phone, blood, syndrome, status, dateStr);
            patientList.add(newPatient);

            patientTableModel.addRow(new Object[]{
                    newPatient.id,
                    newPatient.name,
                    newPatient.age,
                    newPatient.gender,
                    newPatient.phone,
                    newPatient.bloodGroup,
                    newPatient.syndrome,
                    newPatient.status,
                    newPatient.admissionDate
            });

            refreshDashboardMetrics();

            JOptionPane.showMessageDialog(this,
                    "Patient ID: " + patientId + "\n" +
                            "Name: " + name + "\n" +
                            "Admission Status: " + status + "\n" +
                            "Complaint: " + syndrome + "\n\n" +
                            "Patient registered successfully!",
                    "Patient Saved", JOptionPane.INFORMATION_MESSAGE);

            txtName.setText("");
            txtAge.setText("");
            txtPhone.setText("");
        });

        mainPanel.add(formPanel, BorderLayout.WEST);

        JPanel tableContainer = new JPanel(new BorderLayout(10, 10));
        tableContainer.setBackground(Color.WHITE);
        tableContainer.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(BORDER_COLOR, 1, true),
                new EmptyBorder(14, 14, 14, 14)
        ));

        JPanel searchBar = new JPanel(new BorderLayout(10, 0));
        searchBar.setOpaque(false);

        JLabel searchLabel = new JLabel("🔍 Search Patient: ");
        searchLabel.setFont(new Font("Segoe UI", Font.BOLD, 12));

        JTextField txtSearch = new JTextField();
        txtSearch.setPreferredSize(new Dimension(220, 32));

        JPanel rightControls = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        rightControls.setOpaque(false);

        JComboBox<String> cmbFilterStatus = new JComboBox<>(new String[]{"All Statuses", "Admitted", "Outpatient", "Discharged"});
        cmbFilterStatus.addActionListener(e -> {
            String selected = (String) cmbFilterStatus.getSelectedItem();
            if (selected == null || selected.equals("All Statuses")) {
                patientSorter.setRowFilter(null);
            } else {
                patientSorter.setRowFilter(RowFilter.regexFilter("(?i)" + selected, 7));
            }
        });

        JButton btnDischargePatient = new JButton("🚪 Discharge Selected");
        styleSecondaryButton(btnDischargePatient);
        btnDischargePatient.addActionListener(e -> dischargeSelectedPatient());

        rightControls.add(new JLabel("Filter:"));
        rightControls.add(cmbFilterStatus);
        rightControls.add(btnDischargePatient);

        searchBar.add(searchLabel, BorderLayout.WEST);
        searchBar.add(txtSearch, BorderLayout.CENTER);
        searchBar.add(rightControls, BorderLayout.EAST);

        tableContainer.add(searchBar, BorderLayout.NORTH);

        String[] columns = {"Patient ID", "Name", "Age", "Gender", "Phone", "Blood", "Syndrome / Complaint", "Status", "Reg. Date"};
        patientTableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };

        patientTable = new JTable(patientTableModel);
        formatTable(patientTable);

        patientSorter = new TableRowSorter<>(patientTableModel);
        patientTable.setRowSorter(patientSorter);

        txtSearch.addKeyListener(new KeyAdapter() {
            @Override
            public void keyReleased(KeyEvent e) {
                String text = txtSearch.getText().trim();
                if (text.isEmpty()) {
                    patientSorter.setRowFilter(null);
                } else {
                    patientSorter.setRowFilter(RowFilter.regexFilter("(?i)" + text));
                }
            }
        });

        refreshPatientTable();

        JScrollPane scrollPane = new JScrollPane(patientTable);
        scrollPane.setBorder(new LineBorder(BORDER_COLOR, 1));
        tableContainer.add(scrollPane, BorderLayout.CENTER);

        mainPanel.add(tableContainer, BorderLayout.CENTER);
        return mainPanel;
    }

    private void addFormField(JPanel panel, String labelText, JComponent field) {
        JLabel label = new JLabel(labelText);
        label.setFont(new Font("Segoe UI", Font.BOLD, 12));
        label.setForeground(TEXT_DARK);
        label.setAlignmentX(Component.LEFT_ALIGNMENT);

        field.setMaximumSize(new Dimension(Integer.MAX_VALUE, 30));
        field.setAlignmentX(Component.LEFT_ALIGNMENT);
        field.setFont(new Font("Segoe UI", Font.PLAIN, 12));

        panel.add(label);
        panel.add(Box.createVerticalStrut(3));
        panel.add(field);
        panel.add(Box.createVerticalStrut(8));
    }

    private void refreshPatientTable() {
        patientTableModel.setRowCount(0);
        for (Patient p : patientList) {
            patientTableModel.addRow(new Object[]{
                    p.id, p.name, p.age, p.gender, p.phone, p.bloodGroup, p.syndrome, p.status, p.admissionDate
            });
        }
    }

    private void dischargeSelectedPatient() {
        int selectedRow = patientTable.getSelectedRow();
        if (selectedRow == -1) {
            JOptionPane.showMessageDialog(this, "Please select a patient from the table to discharge.", "No Patient Selected", JOptionPane.WARNING_MESSAGE);
            return;
        }

        int modelRow = patientTable.convertRowIndexToModel(selectedRow);
        String patientId = (String) patientTableModel.getValueAt(modelRow, 0);
        String patientName = (String) patientTableModel.getValueAt(modelRow, 1);
        String currentStatus = (String) patientTableModel.getValueAt(modelRow, 7);

        if ("Discharged".equalsIgnoreCase(currentStatus)) {
            JOptionPane.showMessageDialog(this, "Patient " + patientName + " is already Discharged.", "Notice", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        int confirm = JOptionPane.showConfirmDialog(this,
                "Execute Discharge for " + patientName + " (" + patientId + ")?\n" +
                        "- Sets Status to 'Discharged'\n- Releases Bed to Available\n- Finalizes Billing\n\nProceed?",
                "Confirm Discharge", JOptionPane.YES_NO_OPTION);

        if (confirm == JOptionPane.YES_OPTION) {
            for (Patient p : patientList) {
                if (p.id.equals(patientId)) {
                    p.status = "Discharged";
                    break;
                }
            }
            patientTableModel.setValueAt("Discharged", modelRow, 7);
            refreshDashboardMetrics();
            JOptionPane.showMessageDialog(this, "Patient " + patientName + " Discharged successfully!", "Discharge Complete", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private JPanel createDoctorDirectoryTab() {
        JPanel mainPanel = new JPanel(new BorderLayout(16, 16));
        mainPanel.setBackground(BG_LIGHT);
        mainPanel.setBorder(new EmptyBorder(16, 16, 16, 16));

        JPanel toolbar = new JPanel(new BorderLayout(12, 0));
        toolbar.setBackground(Color.WHITE);
        toolbar.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(BORDER_COLOR, 1, true),
                new EmptyBorder(12, 16, 12, 16)
        ));

        JPanel leftTools = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 0));
        leftTools.setOpaque(false);

        JLabel filterSpecialtyLbl = new JLabel("Specialty:");
        filterSpecialtyLbl.setFont(new Font("Segoe UI", Font.BOLD, 12));

        JComboBox<String> cmbSpecialty = new JComboBox<>(new String[]{
                "All Specialties", "Cardiology", "General Medicine", "Orthopedics", "Pediatrics", "Neurology", "Dermatology"
        });

        JLabel filterStatusLbl = new JLabel("Status:");
        filterStatusLbl.setFont(new Font("Segoe UI", Font.BOLD, 12));

        JComboBox<String> cmbDoctorStatus = new JComboBox<>(new String[]{
                "All Statuses", "Available", "In Consultation", "On Leave"
        });

        ActionListener applyFilters = e -> {
            String spec = (String) cmbSpecialty.getSelectedItem();
            String st = (String) cmbDoctorStatus.getSelectedItem();

            List<RowFilter<DefaultTableModel, Object>> filters = new ArrayList<>();
            if (spec != null && !spec.equals("All Specialties")) {
                filters.add(RowFilter.regexFilter("(?i)" + spec, 2));
            }
            if (st != null && !st.equals("All Statuses")) {
                filters.add(RowFilter.regexFilter("(?i)" + st, 7));
            }

            if (filters.isEmpty()) {
                doctorSorter.setRowFilter(null);
            } else {
                doctorSorter.setRowFilter(RowFilter.andFilter(filters));
            }
        };

        cmbSpecialty.addActionListener(applyFilters);
        cmbDoctorStatus.addActionListener(applyFilters);

        leftTools.add(filterSpecialtyLbl);
        leftTools.add(cmbSpecialty);
        leftTools.add(Box.createHorizontalStrut(10));
        leftTools.add(filterStatusLbl);
        leftTools.add(cmbDoctorStatus);

        JPanel rightTools = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        rightTools.setOpaque(false);

        JButton btnToggleStatus = new JButton("🔄 Toggle Doctor Status");
        styleSecondaryButton(btnToggleStatus);
        btnToggleStatus.addActionListener(e -> toggleDoctorStatusDialog());

        JButton btnAddDoctor = new JButton("➕ Add New Doctor");
        stylePrimaryButton(btnAddDoctor);
        btnAddDoctor.addActionListener(e -> showAddDoctorDialog());

        rightTools.add(btnToggleStatus);
        rightTools.add(btnAddDoctor);

        toolbar.add(leftTools, BorderLayout.WEST);
        toolbar.add(rightTools, BorderLayout.EAST);
        mainPanel.add(toolbar, BorderLayout.NORTH);

        String[] docColumns = {"Doctor ID", "Doctor Name", "Specialization", "OPD Room", "Contact Phone", "Available Timing", "Fee (₹)", "Status"};
        doctorTableModel = new DefaultTableModel(docColumns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };

        doctorTable = new JTable(doctorTableModel);
        formatTable(doctorTable);

        doctorSorter = new TableRowSorter<>(doctorTableModel);
        doctorTable.setRowSorter(doctorSorter);

        refreshDoctorTable();

        JScrollPane scrollPane = new JScrollPane(doctorTable);
        scrollPane.setBorder(new LineBorder(BORDER_COLOR, 1));
        mainPanel.add(scrollPane, BorderLayout.CENTER);

        return mainPanel;
    }

    private void refreshDoctorTable() {
        doctorTableModel.setRowCount(0);
        for (Doctor d : doctorList) {
            doctorTableModel.addRow(new Object[]{
                    d.id, d.name, d.specialization, d.room, d.contact, d.timing, d.fee, d.status
            });
        }
    }

    private void showAddDoctorDialog() {
        JDialog dialog = new JDialog(this, "Add New Medical Specialist (INSERT)", true);
        dialog.setSize(420, 480);
        dialog.setLocationRelativeTo(this);
        dialog.setLayout(new BorderLayout());

        JPanel form = new JPanel();
        form.setLayout(new BoxLayout(form, BoxLayout.Y_AXIS));
        form.setBorder(new EmptyBorder(16, 20, 16, 20));
        form.setBackground(Color.WHITE);

        JTextField txtDocName = new JTextField();
        JComboBox<String> cmbSpec = new JComboBox<>(new String[]{"Cardiology", "General Medicine", "Orthopedics", "Pediatrics", "Neurology", "Dermatology", "Oncology"});
        JTextField txtRoom = new JTextField("OPD-10" + (doctorList.size() + 1));
        JTextField txtContact = new JTextField("+91 98201 ");
        JTextField txtTiming = new JTextField("09:00 AM - 02:00 PM");
        JTextField txtFee = new JTextField("600");

        addFormField(form, "Doctor Name *", txtDocName);
        addFormField(form, "Specialization *", cmbSpec);
        addFormField(form, "OPD Room Number *", txtRoom);
        addFormField(form, "Contact Phone *", txtContact);
        addFormField(form, "Available OPD Timing *", txtTiming);
        addFormField(form, "Consultation Fee (₹) *", txtFee);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 10));
        JButton btnSubmit = new JButton("Save Doctor");
        stylePrimaryButton(btnSubmit);
        JButton btnCancel = new JButton("Cancel");
        styleSecondaryButton(btnCancel);

        btnCancel.addActionListener(e -> dialog.dispose());

        btnSubmit.addActionListener(e -> {
            String name = txtDocName.getText().trim();
            if (name.isEmpty()) {
                JOptionPane.showMessageDialog(dialog, "Please enter the doctor's name.", "Validation Error", JOptionPane.WARNING_MESSAGE);
                return;
            }

            int fee;
            try {
                fee = Integer.parseInt(txtFee.getText().trim());
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(dialog, "Please enter a valid numeric fee.", "Validation Error", JOptionPane.WARNING_MESSAGE);
                return;
            }

            String docId = "DOC-" + (nextDoctorSequence++);
            Doctor doc = new Doctor(
                    docId,
                    name.startsWith("Dr.") ? name : "Dr. " + name,
                    (String) cmbSpec.getSelectedItem(),
                    txtRoom.getText().trim(),
                    txtContact.getText().trim(),
                    txtTiming.getText().trim(),
                    fee,
                    "Available"
            );

            doctorList.add(doc);
            refreshDoctorTable();
            refreshDashboardMetrics();

            dialog.dispose();
            JOptionPane.showMessageDialog(this, "Doctor " + doc.name + " added successfully!", "Saved", JOptionPane.INFORMATION_MESSAGE);
        });

        btnPanel.add(btnCancel);
        btnPanel.add(btnSubmit);

        dialog.add(form, BorderLayout.CENTER);
        dialog.add(btnPanel, BorderLayout.SOUTH);
        dialog.setVisible(true);
    }

    private void toggleDoctorStatusDialog() {
        int selectedRow = doctorTable.getSelectedRow();
        if (selectedRow == -1) {
            JOptionPane.showMessageDialog(this, "Please select a doctor from the table to change status.", "No Doctor Selected", JOptionPane.WARNING_MESSAGE);
            return;
        }

        int modelRow = doctorTable.convertRowIndexToModel(selectedRow);
        String docId = (String) doctorTableModel.getValueAt(modelRow, 0);
        String docName = (String) doctorTableModel.getValueAt(modelRow, 1);
        String currentStatus = (String) doctorTableModel.getValueAt(modelRow, 7);

        String[] statuses = {"Available", "In Consultation", "On Leave"};
        String selectedStatus = (String) JOptionPane.showInputDialog(
                this,
                "Select new operational status for " + docName + ":",
                "Update Doctor Status",
                JOptionPane.QUESTION_MESSAGE,
                null,
                statuses,
                currentStatus
        );

        if (selectedStatus != null && !selectedStatus.equals(currentStatus)) {
            for (Doctor d : doctorList) {
                if (d.id.equals(docId)) {
                    d.status = selectedStatus;
                    break;
                }
            }
            doctorTableModel.setValueAt(selectedStatus, modelRow, 7);
            refreshDashboardMetrics();
        }
    }

    private void quickAllocateBedDialog() {
        List<Patient> nonAdmitted = new ArrayList<>();
        for (Patient p : patientList) {
            if (!"Admitted".equalsIgnoreCase(p.status) && !"Discharged".equalsIgnoreCase(p.status)) {
                nonAdmitted.add(p);
            }
        }

        if (nonAdmitted.isEmpty()) {
            JOptionPane.showMessageDialog(this, "All current patients are already allocated or discharged.", "No Patients", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        String[] patientNames = new String[nonAdmitted.size()];
        for (int i = 0; i < nonAdmitted.size(); i++) {
            patientNames[i] = nonAdmitted.get(i).id + " - " + nonAdmitted.get(i).name;
        }

        String selected = (String) JOptionPane.showInputDialog(
                this,
                "Select an Outpatient to admit to Inpatient Ward / Bed:",
                "Bed Allocation",
                JOptionPane.QUESTION_MESSAGE,
                null,
                patientNames,
                patientNames[0]
        );

        if (selected != null) {
            String selectedId = selected.split(" - ")[0];
            for (Patient p : patientList) {
                if (p.id.equals(selectedId)) {
                    p.status = "Admitted";
                    break;
                }
            }
            refreshPatientTable();
            refreshDashboardMetrics();
            JOptionPane.showMessageDialog(this, "Bed allocated to " + selected + ". Status: 'Admitted'.", "Success", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private int getAdmittedPatientsCount() {
        int count = 0;
        for (Patient p : patientList) {
            if ("Admitted".equalsIgnoreCase(p.status)) count++;
        }
        return count;
    }

    private int getAvailableBedsCount() {
        return Math.max(0, 10 - getAdmittedPatientsCount());
    }

    private String calculateTotalRevenue() {
        int total = 0;
        for (Doctor d : doctorList) {
            total += d.fee * 3;
        }
        total += getAdmittedPatientsCount() * 2500;
        return "₹" + String.format("%,d", total);
    }

    private void refreshDashboardMetrics() {
        int totalPatients = patientList.size();
        int admitted = getAdmittedPatientsCount();
        int outpatients = totalPatients - admitted;

        int availableDocs = 0;
        for (Doctor d : doctorList) {
            if ("Available".equalsIgnoreCase(d.status)) availableDocs++;
        }

        int availableBeds = getAvailableBedsCount();

        if (lblTotalPatientsVal != null) lblTotalPatientsVal.setText(String.valueOf(totalPatients));
        if (lblAdmittedVal != null) lblAdmittedVal.setText(String.valueOf(admitted));
        if (lblOutpatientsVal != null) lblOutpatientsVal.setText(String.valueOf(outpatients));
        if (lblAvailableDoctorsVal != null) lblAvailableDoctorsVal.setText(String.valueOf(availableDocs));
        if (lblAvailableBedsVal != null) lblAvailableBedsVal.setText(availableBeds + " / 10");
        if (lblTotalRevenueVal != null) lblTotalRevenueVal.setText(calculateTotalRevenue());
    }

    private void formatTable(JTable table) {
        table.setRowHeight(30);
        table.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        table.setGridColor(BORDER_COLOR);
        table.setShowGrid(true);

        JTableHeader header = table.getTableHeader();
        header.setFont(new Font("Segoe UI", Font.BOLD, 12));
        header.setBackground(new Color(241, 245, 249));
        header.setForeground(TEXT_DARK);
        header.setPreferredSize(new Dimension(header.getWidth(), 34));

        DefaultTableCellRenderer statusRenderer = new DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(JTable tbl, Object value, boolean isSelected, boolean hasFocus, int row, int col) {
                JLabel label = (JLabel) super.getTableCellRendererComponent(tbl, value, isSelected, hasFocus, row, col);
                label.setHorizontalAlignment(JLabel.CENTER);
                label.setFont(new Font("Segoe UI", Font.BOLD, 11));

                if (value != null) {
                    String str = value.toString();
                    if ("Available".equalsIgnoreCase(str) || "Admitted".equalsIgnoreCase(str)) {
                        label.setForeground(new Color(4, 120, 87));
                    } else if ("In Consultation".equalsIgnoreCase(str) || "Outpatient".equalsIgnoreCase(str)) {
                        label.setForeground(new Color(30, 64, 175));
                    } else if ("On Leave".equalsIgnoreCase(str) || "Discharged".equalsIgnoreCase(str)) {
                        label.setForeground(new Color(185, 28, 28));
                    } else {
                        label.setForeground(TEXT_DARK);
                    }
                }
                return label;
            }
        };

        table.setDefaultRenderer(Object.class, new DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(JTable tbl, Object val, boolean isSel, boolean hasFoc, int r, int c) {
                Component comp = super.getTableCellRendererComponent(tbl, val, isSel, hasFoc, r, c);
                if (!isSel) {
                    comp.setBackground(r % 2 == 0 ? Color.WHITE : new Color(248, 250, 252));
                }
                return comp;
            }
        });

        int statusColIdx = table.getColumnCount() - 1;
        table.getColumnModel().getColumn(statusColIdx).setCellRenderer(statusRenderer);
    }

    private void stylePrimaryButton(JButton btn) {
        btn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        btn.setBackground(PRIMARY_TEAL);
        btn.setForeground(Color.WHITE);
        btn.setFocusPainted(false);
        btn.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(PRIMARY_DARK, 1, true),
                new EmptyBorder(7, 14, 7, 14)
        ));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
    }

    private void styleSecondaryButton(JButton btn) {
        btn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        btn.setBackground(Color.WHITE);
        btn.setForeground(PRIMARY_TEAL);
        btn.setFocusPainted(false);
        btn.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(PRIMARY_TEAL, 1, true),
                new EmptyBorder(6, 12, 6, 12)
        ));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
    }

    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {
        }

        SwingUtilities.invokeLater(() -> {
            HospitalSwingApp app = new HospitalSwingApp();
            app.setVisible(true);
        });
    }
}
