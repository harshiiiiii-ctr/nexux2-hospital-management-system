import fs from 'fs';
import path from 'path';
import { Doctor, Patient, Appointment, Bill, Receptionist, User, Bed, SqlLogEntry } from '../src/types.js';

export interface DatabaseSchema {
  users: (User & { password: string })[];
  doctors: Doctor[];
  receptionists: Receptionist[];
  patients: Patient[];
  appointments: Appointment[];
  bills: Bill[];
  beds: Bed[];
  sqlLogs: SqlLogEntry[];
}

export function getInitialSeedData(): DatabaseSchema {
  // Use current local date for "Today"
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const doctors: Doctor[] = [
    {
      id: 'doc-1',
      name: 'Dr. Rajesh Sharma',
      specialization: 'Cardiologist',
      phone: '+91 98200 11001',
      email: 'doctor@medicare.com',
      consultationFee: 800,
      availabilityStatus: 'Available',
      qualifications: 'MBBS, MD (Cardiology), DM',
      experienceYears: 14,
      roomNumber: 'OPD-101',
      shiftTiming: '09:00 - 17:00',
      breakTiming: '13:00 - 14:00 (Lunch Break)',
      joinDate: '2022-04-10',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'doc-2',
      name: 'Dr. Sunita Kulkarni',
      specialization: 'Dermatologist',
      phone: '+91 98200 22002',
      email: 'sunita@medicare.com',
      consultationFee: 600,
      availabilityStatus: 'Available',
      qualifications: 'MBBS, DVD, MD (Dermatology)',
      experienceYears: 11,
      roomNumber: 'OPD-104',
      shiftTiming: '10:00 - 18:00',
      breakTiming: '13:30 - 14:30 (Lunch Break)',
      joinDate: '2023-01-15',
      avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'doc-3',
      name: 'Dr. Amit Patel',
      specialization: 'Orthopedic',
      phone: '+91 98200 33003',
      email: 'amit@medicare.com',
      consultationFee: 750,
      availabilityStatus: 'Available',
      qualifications: 'MBBS, MS (Orthopedics), MCh',
      experienceYears: 16,
      roomNumber: 'OPD-108',
      shiftTiming: '08:30 - 16:30',
      breakTiming: '13:00 - 14:00 (Lunch Break)',
      joinDate: '2021-08-01',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'doc-4',
      name: 'Dr. Ramesh Gupta',
      specialization: 'General Physician',
      phone: '+91 98200 44004',
      email: 'ramesh@medicare.com',
      consultationFee: 500,
      availabilityStatus: 'Available',
      qualifications: 'MBBS, MD (Internal Medicine)',
      experienceYears: 20,
      roomNumber: 'OPD-201',
      shiftTiming: '09:00 - 17:00',
      breakTiming: '13:00 - 14:00 (Lunch Break)',
      joinDate: '2020-02-15',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'doc-5',
      name: 'Dr. Neha Kapoor',
      specialization: 'Neurologist',
      phone: '+91 98200 55005',
      email: 'neha@medicare.com',
      consultationFee: 900,
      availabilityStatus: 'In Consultation',
      qualifications: 'MBBS, MD, DM (Neurology)',
      experienceYears: 12,
      roomNumber: 'OPD-205',
      shiftTiming: '11:00 - 19:00',
      breakTiming: '14:30 - 15:30 (Clinical Break)',
      joinDate: '2023-06-20',
      avatar: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'doc-6',
      name: 'Dr. Vikram Joshi',
      specialization: 'Pediatrician',
      phone: '+91 98200 66006',
      email: 'vikram@medicare.com',
      consultationFee: 550,
      availabilityStatus: 'Available',
      qualifications: 'MBBS, DCH, MD (Pediatrics)',
      experienceYears: 9,
      roomNumber: 'OPD-210',
      shiftTiming: '09:30 - 17:30',
      breakTiming: '13:00 - 13:45 (Lunch Break)',
      joinDate: '2024-02-01',
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'doc-7',
      name: 'Dr. K. S. Rao (Former Faculty)',
      specialization: 'General Physician',
      phone: '+91 98200 77007',
      email: 'ksrao@medicare.com',
      consultationFee: 500,
      availabilityStatus: 'Resigned / Relieved',
      qualifications: 'MBBS, MD, FICP',
      experienceYears: 24,
      roomNumber: 'OPD-202 (Former)',
      shiftTiming: 'Completed',
      breakTiming: 'N/A',
      joinDate: '2019-03-01',
      relievedDate: '2026-08-31',
      resignationReason: 'Relocated to London for NHS Medical Consultancy',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80'
    }
  ];

  const receptionists: Receptionist[] = [
    {
      id: 'rec-1',
      name: 'Priya Verma',
      email: 'reception@medicare.com',
      phone: '+91 98765 11223',
      shift: 'Morning',
      deskNumber: 'Counter A-1',
      dutyStatus: 'On Duty',
      shiftTiming: '08:00 - 14:00',
      breakTiming: '11:30 - 12:00 (Tea & Lunch)',
      joinDate: '2023-05-10',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'rec-2',
      name: 'Anjali Desai',
      email: 'anjali@medicare.com',
      phone: '+91 98765 33445',
      shift: 'Evening',
      deskNumber: 'Counter B-2',
      dutyStatus: 'On Duty',
      shiftTiming: '14:00 - 20:00',
      breakTiming: '17:00 - 17:30 (Tea Break)',
      joinDate: '2024-01-20',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'rec-3',
      name: 'Karan Mehra (Relieved Staff)',
      email: 'karan@medicare.com',
      phone: '+91 98765 44556',
      shift: 'Night',
      deskNumber: 'Counter C-1 (Former)',
      dutyStatus: 'Resigned / Relieved',
      shiftTiming: 'Completed',
      breakTiming: 'N/A',
      joinDate: '2023-02-01',
      relievedDate: '2026-07-15',
      resignationReason: 'Pursuing Full-Time Healthcare MBA at TISS Mumbai',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80'
    }
  ];

  const users: (User & { password: string })[] = [
    {
      id: 'usr-admin',
      name: 'Dr. Alok Nath (Superintendent)',
      email: 'admin@medicare.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 98210 00001'
    },
    {
      id: 'usr-rec-1',
      name: 'Priya Verma',
      email: 'reception@medicare.com',
      password: 'reception123',
      role: 'receptionist',
      phone: '+91 98765 11223'
    },
    {
      id: 'usr-rec-2',
      name: 'Anjali Desai',
      email: 'anjali@medicare.com',
      password: 'reception123',
      role: 'receptionist',
      phone: '+91 98765 33445'
    },
    {
      id: 'usr-doc-1',
      name: 'Dr. Rajesh Sharma',
      email: 'doctor@medicare.com',
      password: 'doctor123',
      role: 'doctor',
      doctorId: 'doc-1',
      phone: '+91 98200 11001'
    },
    {
      id: 'usr-doc-2',
      name: 'Dr. Sunita Kulkarni',
      email: 'sunita@medicare.com',
      password: 'doctor123',
      role: 'doctor',
      doctorId: 'doc-2',
      phone: '+91 98200 22002'
    },
    {
      id: 'usr-doc-3',
      name: 'Dr. Amit Patel',
      email: 'amit@medicare.com',
      password: 'doctor123',
      role: 'doctor',
      doctorId: 'doc-3',
      phone: '+91 98200 33003'
    },
    {
      id: 'usr-doc-4',
      name: 'Dr. Ramesh Gupta',
      email: 'ramesh@medicare.com',
      password: 'doctor123',
      role: 'doctor',
      doctorId: 'doc-4',
      phone: '+91 98200 44004'
    },
    {
      id: 'usr-doc-5',
      name: 'Dr. Neha Kapoor',
      email: 'neha@medicare.com',
      password: 'doctor123',
      role: 'doctor',
      doctorId: 'doc-5',
      phone: '+91 98200 55005'
    },
    {
      id: 'usr-doc-6',
      name: 'Dr. Vikram Joshi',
      email: 'vikram@medicare.com',
      password: 'doctor123',
      role: 'doctor',
      doctorId: 'doc-6',
      phone: '+91 98200 66006'
    }
  ];

  const patients: Patient[] = [
    {
      id: 'pat-1',
      name: 'Aarav Mehta',
      age: 28,
      gender: 'Male',
      phone: '+91 98201 23456',
      address: '12 Park Street, Andheri West, Mumbai',
      syndrome: 'Fever',
      registeredDate: twoDaysAgoStr,
      bloodGroup: 'O+',
      admissionStatus: 'Outpatient'
    },
    {
      id: 'pat-2',
      name: 'Sunita Roy',
      age: 52,
      gender: 'Female',
      phone: '+91 98312 34567',
      address: '45 Lake Gardens, Kolkata',
      syndrome: 'Chest Pain',
      registeredDate: twoDaysAgoStr,
      bloodGroup: 'B+',
      admissionStatus: 'Admitted',
      bedId: 'bed-1',
      bedNumber: 'BED-101',
      admittedDate: yesterdayStr,
      diseaseName: 'Coronary Artery Ischemia',
      treatingDoctorId: 'doc-1',
      treatingDoctorName: 'Dr. Rajesh Sharma'
    },
    {
      id: 'pat-3',
      name: 'Rohan Sen',
      age: 19,
      gender: 'Male',
      phone: '+91 98450 45678',
      address: '88 MG Road, Indiranagar, Bengaluru',
      syndrome: 'Fracture',
      registeredDate: yesterdayStr,
      bloodGroup: 'A+',
      admissionStatus: 'Outpatient'
    },
    {
      id: 'pat-4',
      name: 'Meera Nair',
      age: 34,
      gender: 'Female',
      phone: '+91 98199 56789',
      address: '23 Palm Grove, Marine Drive, Kochi',
      syndrome: 'Skin Allergy',
      registeredDate: yesterdayStr,
      bloodGroup: 'AB+',
      admissionStatus: 'Outpatient'
    },
    {
      id: 'pat-5',
      name: 'Arjun Deshmukh',
      age: 45,
      gender: 'Male',
      phone: '+91 98220 67890',
      address: '17 Shivaji Nagar, Pune',
      syndrome: 'Diabetes',
      registeredDate: yesterdayStr,
      bloodGroup: 'O+',
      admissionStatus: 'Admitted',
      bedId: 'bed-5',
      bedNumber: 'ICU-201',
      admittedDate: twoDaysAgoStr,
      diseaseName: 'Diabetic Ketoacidosis (DKA)',
      treatingDoctorId: 'doc-5',
      treatingDoctorName: 'Dr. Neha Kapoor'
    },
    {
      id: 'pat-6',
      name: 'Kavita Iyer',
      age: 38,
      gender: 'Female',
      phone: '+91 98410 78901',
      address: '72 Besant Nagar, Chennai',
      syndrome: 'Migraine',
      registeredDate: yesterdayStr,
      bloodGroup: 'B-',
      admissionStatus: 'Discharged',
      admittedDate: '2026-10-06',
      dischargedDate: yesterdayStr,
      diseaseName: 'Intractable Migraine Cephalea',
      dischargeSummary: 'Migraine acute attack stabilized. IV analgesics and hydration administered. Discharged in hemodynamically stable condition.',
      totalBilledAmount: 3200,
      bedNumber: 'BED-102',
      treatingDoctorId: 'doc-5',
      treatingDoctorName: 'Dr. Neha Kapoor'
    },
    {
      id: 'pat-7',
      name: 'Ananya Pillai',
      age: 7,
      gender: 'Female',
      phone: '+91 98765 89012',
      address: '31 Jawahar Nagar, Thiruvananthapuram',
      syndrome: 'Fever',
      registeredDate: twoDaysAgoStr,
      bloodGroup: 'O+',
      admissionStatus: 'Outpatient'
    },
    {
      id: 'pat-8',
      name: 'Deepak Verma',
      age: 61,
      gender: 'Male',
      phone: '+91 98111 90123',
      address: '55 Greater Kailash I, New Delhi',
      syndrome: 'Chest Pain',
      registeredDate: todayStr,
      bloodGroup: 'A+',
      admissionStatus: 'Discharged',
      admittedDate: '2026-10-04',
      dischargedDate: twoDaysAgoStr,
      diseaseName: 'Unstable Angina Pectoris',
      dischargeSummary: 'ECG serial review done. Troponin normalized. Patient advised oral nitrates and cardiology follow-up.',
      totalBilledAmount: 8400,
      bedNumber: 'ICU-201',
      treatingDoctorId: 'doc-1',
      treatingDoctorName: 'Dr. Rajesh Sharma'
    },
    {
      id: 'pat-9',
      name: 'Pooja Chawla',
      age: 29,
      gender: 'Female',
      phone: '+91 98333 01234',
      address: '64 Model Town, Ludhiana',
      syndrome: 'Skin Allergy',
      registeredDate: twoDaysAgoStr,
      bloodGroup: 'B+'
    },
    {
      id: 'pat-10',
      name: 'Manish Patil',
      age: 42,
      gender: 'Male',
      phone: '+91 98234 12345',
      address: '9 Panchavati, Nashik',
      syndrome: 'Fracture',
      registeredDate: yesterdayStr,
      bloodGroup: 'O-'
    },
    {
      id: 'pat-11',
      name: 'Sneha Kulkarni',
      age: 56,
      gender: 'Female',
      phone: '+91 98670 23456',
      address: '104 Kothrud, Pune',
      syndrome: 'Diabetes',
      registeredDate: todayStr,
      bloodGroup: 'A+'
    },
    {
      id: 'pat-12',
      name: 'Rahul Saxena',
      age: 33,
      gender: 'Male',
      phone: '+91 98101 34567',
      address: '28 Civil Lines, Jaipur',
      syndrome: 'Migraine',
      registeredDate: todayStr,
      bloodGroup: 'B+'
    }
  ];

  const appointments: Appointment[] = [
    {
      id: 'app-1',
      patientId: 'pat-2',
      doctorId: 'doc-1',
      date: todayStr,
      time: '10:00',
      status: 'Completed',
      syndrome: 'Chest Pain',
      notes: 'Patient reported retrosternal tightness on exertion. BP 142/90 mmHg.',
      diagnosis: 'Stable Angina, Mild Hypertension',
      prescription: '1. Tab Sorbitrate 5mg (SOS sublingual)\n2. Tab Atorvastatin 20mg (1 OD night)\n3. Tab Telmisartan 40mg (1 OD morning)\nFollow-up with 2D Echocardiogram in 7 days.',
      createdDate: yesterdayStr
    },
    {
      id: 'app-2',
      patientId: 'pat-1',
      doctorId: 'doc-4',
      date: todayStr,
      time: '10:30',
      status: 'Completed',
      syndrome: 'Fever',
      notes: '3 days acute viral pyrexia with myalgia and mild throat irritation.',
      diagnosis: 'Acute Viral Pharyngitis & Pyrexia',
      prescription: '1. Tab Paracetamol 650mg (1 TDS after meals)\n2. Tab Cetirizine 10mg (1 HS)\n3. ORS hydration 2 packets/day\nSteam inhalation twice daily.',
      createdDate: yesterdayStr
    },
    {
      id: 'app-3',
      patientId: 'pat-3',
      doctorId: 'doc-3',
      date: todayStr,
      time: '11:15',
      status: 'Scheduled',
      syndrome: 'Fracture',
      notes: 'Fell while playing sports, severe swelling and tenderness in right distal radius.',
      createdDate: todayStr
    },
    {
      id: 'app-4',
      patientId: 'pat-4',
      doctorId: 'doc-2',
      date: todayStr,
      time: '11:45',
      status: 'Scheduled',
      syndrome: 'Skin Allergy',
      notes: 'Erythematous pruritic lesions on both forearms after chemical cleanser exposure.',
      createdDate: todayStr
    },
    {
      id: 'app-5',
      patientId: 'pat-5',
      doctorId: 'doc-4',
      date: todayStr,
      time: '14:00',
      status: 'Scheduled',
      syndrome: 'Diabetes',
      notes: 'Fasting glucose elevated (188 mg/dL). Review diet and oral hypoglycemic dosage.',
      createdDate: todayStr
    },
    {
      id: 'app-6',
      patientId: 'pat-6',
      doctorId: 'doc-5',
      date: todayStr,
      time: '14:30',
      status: 'Scheduled',
      syndrome: 'Migraine',
      notes: 'Pulsatile hemicranial headache with photophobia lasting >18 hours.',
      createdDate: todayStr
    },
    {
      id: 'app-7',
      patientId: 'pat-7',
      doctorId: 'doc-6',
      date: yesterdayStr,
      time: '16:00',
      status: 'Completed',
      syndrome: 'Fever',
      notes: '7-year-old with low-grade pyrexia and spasmodic nocturnal cough.',
      diagnosis: 'Pediatric Upper Respiratory Tract Infection',
      prescription: '1. Syp Paracetamol 250mg/5ml (5ml TDS)\n2. Syp Ascoril-LS (2.5ml BD for 3 days)\nLukewarm water sponge if temp > 100 F.',
      createdDate: twoDaysAgoStr
    },
    {
      id: 'app-8',
      patientId: 'pat-8',
      doctorId: 'doc-1',
      date: todayStr,
      time: '15:30',
      status: 'Scheduled',
      syndrome: 'Chest Pain',
      notes: 'Post-PTCA routine cardiac check-up and lipid panel analysis.',
      createdDate: yesterdayStr
    },
    {
      id: 'app-9',
      patientId: 'pat-9',
      doctorId: 'doc-2',
      date: twoDaysAgoStr,
      time: '17:00',
      status: 'Completed',
      syndrome: 'Skin Allergy',
      notes: 'Generalized urticarial wheals following seafood dinner.',
      diagnosis: 'Acute Allergic Urticaria',
      prescription: '1. Tab Bilastine 20mg (1 OD in morning empty stomach)\n2. Calamine lotion topically (TDS)\nStrict seafood avoidance for 4 weeks.',
      createdDate: twoDaysAgoStr
    },
    {
      id: 'app-10',
      patientId: 'pat-10',
      doctorId: 'doc-3',
      date: yesterdayStr,
      time: '15:00',
      status: 'Cancelled',
      syndrome: 'Fracture',
      notes: 'Patient called to reschedule due to emergency travel.',
      createdDate: twoDaysAgoStr
    }
  ];

  const bills: Bill[] = [
    {
      id: 'bill-1',
      invoiceNumber: 'INV-2026-001',
      appointmentId: 'app-1',
      patientId: 'pat-2',
      doctorId: 'doc-1',
      consultationFee: 800,
      medicineCharges: 450,
      discount: 0,
      totalAmount: 1250,
      billDate: todayStr,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI'
    },
    {
      id: 'bill-2',
      invoiceNumber: 'INV-2026-002',
      appointmentId: 'app-2',
      patientId: 'pat-1',
      doctorId: 'doc-4',
      consultationFee: 500,
      medicineCharges: 220,
      discount: 20,
      totalAmount: 700,
      billDate: todayStr,
      paymentStatus: 'Paid',
      paymentMethod: 'Cash'
    },
    {
      id: 'bill-3',
      invoiceNumber: 'INV-2026-003',
      appointmentId: 'app-7',
      patientId: 'pat-7',
      doctorId: 'doc-6',
      consultationFee: 550,
      medicineCharges: 310,
      discount: 0,
      totalAmount: 860,
      billDate: yesterdayStr,
      paymentStatus: 'Paid',
      paymentMethod: 'Card'
    },
    {
      id: 'bill-4',
      invoiceNumber: 'INV-2026-004',
      appointmentId: 'app-9',
      patientId: 'pat-9',
      doctorId: 'doc-2',
      consultationFee: 600,
      medicineCharges: 280,
      discount: 0,
      totalAmount: 880,
      billDate: twoDaysAgoStr,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI'
    }
  ];

  const beds: Bed[] = [
    { id: 'bed-1', bedNumber: 'BED-101', ward: 'General Ward', dailyCharge: 800, status: 'Occupied', patientId: 'pat-2', patientName: 'Sunita Roy', allocatedDate: yesterdayStr },
    { id: 'bed-2', bedNumber: 'BED-102', ward: 'General Ward', dailyCharge: 800, status: 'Available' },
    { id: 'bed-3', bedNumber: 'BED-103', ward: 'General Ward', dailyCharge: 800, status: 'Available' },
    { id: 'bed-4', bedNumber: 'BED-104', ward: 'General Ward', dailyCharge: 800, status: 'Available' },
    { id: 'bed-5', bedNumber: 'ICU-201', ward: 'ICU / Critical Care', dailyCharge: 3500, status: 'Occupied', patientId: 'pat-5', patientName: 'Arjun Deshmukh', allocatedDate: twoDaysAgoStr },
    { id: 'bed-6', bedNumber: 'ICU-202', ward: 'ICU / Critical Care', dailyCharge: 3500, status: 'Available' },
    { id: 'bed-7', bedNumber: 'ICU-203', ward: 'ICU / Critical Care', dailyCharge: 3500, status: 'Available' },
    { id: 'bed-8', bedNumber: 'SP-301', ward: 'Semi-Private Room', dailyCharge: 1800, status: 'Available' },
    { id: 'bed-9', bedNumber: 'SP-302', ward: 'Semi-Private Room', dailyCharge: 1800, status: 'Available' },
    { id: 'bed-10', bedNumber: 'SP-303', ward: 'Semi-Private Room', dailyCharge: 1800, status: 'Available' },
    { id: 'bed-11', bedNumber: 'EMG-01', ward: 'Emergency Daycare', dailyCharge: 1200, status: 'Available' },
    { id: 'bed-12', bedNumber: 'EMG-02', ward: 'Emergency Daycare', dailyCharge: 1200, status: 'Available' },
  ];

  const sqlLogs: SqlLogEntry[] = [
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type: 'SELECT',
      table: 'patients, beds',
      sql: "SELECT COUNT(*) AS total_admitted, (SELECT COUNT(*) FROM beds WHERE status='Available') AS available_beds FROM patients WHERE admission_status = 'Admitted';",
      executionTimeMs: 12,
      description: 'Fetch hospital inpatient occupancy and bed availability'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString('en-US', { hour12: false }),
      type: 'SELECT',
      table: 'appointments',
      sql: `SELECT a.*, p.name AS patient_name, d.name AS doctor_name FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id WHERE a.date = '${todayStr}' ORDER BY a.time ASC;`,
      executionTimeMs: 18,
      description: "Load today's appointment consultation schedule"
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString('en-US', { hour12: false }),
      type: 'UPDATE',
      table: 'beds',
      sql: "UPDATE beds SET status = 'Occupied', patient_id = 'pat-2', allocated_date = '2026-10-13' WHERE id = 'bed-1';",
      executionTimeMs: 15,
      description: 'Allocate General Ward Bed-101 to admitted cardiac patient'
    }
  ];

  return {
    users,
    doctors,
    receptionists,
    patients,
    appointments,
    bills,
    beds,
    sqlLogs
  };
}
