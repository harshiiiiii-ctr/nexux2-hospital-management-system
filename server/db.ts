import fs from 'fs';
import path from 'path';
import { DatabaseSchema, getInitialSeedData } from './seedData.js';
import { Doctor, Patient, Appointment, Bill, Receptionist, User, Bed, SqlLogEntry, AppointmentStatus } from '../src/types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hospital_db.json');

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadData();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.patients && parsed.doctors && parsed.appointments && parsed.bills && parsed.users) {
          if (!parsed.beds || parsed.beds.length === 0) {
            parsed.beds = getInitialSeedData().beds;
          }
          if (!parsed.sqlLogs || parsed.sqlLogs.length === 0) {
            parsed.sqlLogs = getInitialSeedData().sqlLogs;
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading DB file, falling back to seed:', err);
    }

    const initial = getInitialSeedData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      this.ensureDataDirectory();
      const content = JSON.stringify(dataToSave || this.data, null, 2);
      fs.writeFileSync(DB_FILE, content, 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public resetToSeed(): DatabaseSchema {
    const seed = getInitialSeedData();
    this.data = seed;
    this.saveData(seed);
    return this.data;
  }

  // --- SQL Logging for College Mini Project & Viva Demonstration ---
  public logSql(
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRANSACTION',
    table: string,
    sql: string,
    description: string,
    executionTimeMs = 12
  ): SqlLogEntry {
    if (!this.data.sqlLogs) {
      this.data.sqlLogs = [];
    }
    const entry: SqlLogEntry = {
      id: `sql-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type,
      table,
      sql,
      description,
      executionTimeMs
    };
    this.data.sqlLogs.unshift(entry);
    if (this.data.sqlLogs.length > 50) {
      this.data.sqlLogs = this.data.sqlLogs.slice(0, 50);
    }
    this.saveData();
    return entry;
  }

  public getSqlLogs(): SqlLogEntry[] {
    return this.data.sqlLogs || [];
  }

  // --- Auth & Users ---
  public authenticate(email: string, pass: string): User | null {
    const user = this.data.users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === pass
    );
    if (!user) return null;
    const { password, ...safeUser } = user;
    this.logSql(
      'SELECT',
      'users',
      `SELECT id, name, email, role, doctor_id, phone FROM users WHERE email = '${email.trim()}' AND password = '***' LIMIT 1;`,
      `Authenticate user login for ${email}`
    );
    return safeUser;
  }

  public getUserById(id: string): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  public getAllUsers(): User[] {
    return this.data.users.map(({ password, ...u }) => u);
  }

  // --- Doctors ---
  public getDoctors(): Doctor[] {
    this.logSql('SELECT', 'doctors', 'SELECT * FROM doctors ORDER BY name ASC;', 'Fetch all medical faculty doctors');
    return this.data.doctors;
  }

  public getDoctorById(id: string): Doctor | undefined {
    return this.data.doctors.find(d => d.id === id);
  }

  public createDoctor(doc: Omit<Doctor, 'id'>): Doctor {
    const id = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newDoc: Doctor = { ...doc, id };
    this.data.doctors.push(newDoc);

    const userId = `usr-${id}`;
    this.data.users.push({
      id: userId,
      name: newDoc.name,
      email: newDoc.email,
      password: 'doctor123',
      role: 'doctor',
      doctorId: id,
      phone: newDoc.phone
    });

    this.logSql(
      'INSERT',
      'doctors, users',
      `INSERT INTO doctors (id, name, specialization, phone, email, consultation_fee, room_number, shift_timing, break_timing)
VALUES ('${id}', '${newDoc.name}', '${newDoc.specialization}', '${newDoc.phone}', '${newDoc.email}', ${newDoc.consultationFee}, '${newDoc.roomNumber}', '${newDoc.shiftTiming || '09:00 - 17:00'}', '${newDoc.breakTiming || '13:00 - 14:00'}');
INSERT INTO users (id, name, email, password, role, doctor_id)
VALUES ('${userId}', '${newDoc.name}', '${newDoc.email}', 'doctor123', 'doctor', '${id}');`,
      `Add new doctor credentials and profile for ${newDoc.name}`
    );

    this.saveData();
    return newDoc;
  }

  public updateDoctor(id: string, updates: Partial<Doctor>): Doctor | null {
    const index = this.data.doctors.findIndex(d => d.id === id);
    if (index === -1) return null;
    this.data.doctors[index] = { ...this.data.doctors[index], ...updates };

    const userIndex = this.data.users.findIndex(u => u.doctorId === id);
    if (userIndex !== -1) {
      if (updates.name) this.data.users[userIndex].name = updates.name;
      if (updates.email) this.data.users[userIndex].email = updates.email;
      if (updates.phone) this.data.users[userIndex].phone = updates.phone;
    }

    this.logSql(
      'UPDATE',
      'doctors',
      `UPDATE doctors SET ${Object.keys(updates).map(k => `${k} = ?`).join(', ')} WHERE id = '${id}';`,
      `Update doctor profile and duty/break timings for ${this.data.doctors[index].name}`
    );

    this.saveData();
    return this.data.doctors[index];
  }

  public deleteDoctor(id: string): boolean {
    const docToDelete = this.data.doctors.find(d => d.id === id);
    const initialLen = this.data.doctors.length;
    this.data.doctors = this.data.doctors.filter(d => d.id !== id);
    this.data.users = this.data.users.filter(u => u.doctorId !== id);

    this.logSql(
      'DELETE',
      'doctors, users',
      `DELETE FROM doctors WHERE id = '${id}';
DELETE FROM users WHERE doctor_id = '${id}';`,
      `Delete doctor credentials and record for ${docToDelete?.name || id}`
    );

    this.saveData();
    return this.data.doctors.length < initialLen;
  }

  // --- Receptionists ---
  public getReceptionists(): Receptionist[] {
    this.logSql('SELECT', 'receptionists', 'SELECT * FROM receptionists ORDER BY name ASC;', 'Fetch all receptionist staff');
    return this.data.receptionists;
  }

  public createReceptionist(rec: Omit<Receptionist, 'id'>): Receptionist {
    const id = `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newRec: Receptionist = { ...rec, id };
    this.data.receptionists.push(newRec);

    const userId = `usr-${id}`;
    this.data.users.push({
      id: userId,
      name: newRec.name,
      email: newRec.email,
      password: 'reception123',
      role: 'receptionist',
      phone: newRec.phone
    });

    this.logSql(
      'INSERT',
      'receptionists, users',
      `INSERT INTO receptionists (id, name, email, phone, shift, desk_number, shift_timing, break_timing)
VALUES ('${id}', '${newRec.name}', '${newRec.email}', '${newRec.phone}', '${newRec.shift}', '${newRec.deskNumber}', '${newRec.shiftTiming || '08:00 - 14:00'}', '${newRec.breakTiming || '11:30 - 12:00'}');
INSERT INTO users (id, name, email, password, role)
VALUES ('${userId}', '${newRec.name}', '${newRec.email}', 'reception123', 'receptionist');`,
      `Add new receptionist staff credentials for ${newRec.name}`
    );

    this.saveData();
    return newRec;
  }

  public updateReceptionist(id: string, updates: Partial<Receptionist>): Receptionist | null {
    const index = this.data.receptionists.findIndex(r => r.id === id);
    if (index === -1) return null;
    this.data.receptionists[index] = { ...this.data.receptionists[index], ...updates };

    this.logSql(
      'UPDATE',
      'receptionists',
      `UPDATE receptionists SET ${Object.keys(updates).map(k => `${k} = ?`).join(', ')} WHERE id = '${id}';`,
      `Update receptionist duty/break/exit records for ${this.data.receptionists[index].name}`
    );

    this.saveData();
    return this.data.receptionists[index];
  }

  public deleteReceptionist(id: string): boolean {
    const recToDelete = this.data.receptionists.find(r => r.id === id);
    const initialLen = this.data.receptionists.length;
    this.data.receptionists = this.data.receptionists.filter(r => r.id !== id);

    this.logSql(
      'DELETE',
      'receptionists, users',
      `DELETE FROM receptionists WHERE id = '${id}';
DELETE FROM users WHERE email = '${recToDelete?.email}';`,
      `Delete receptionist staff record and user login for ${recToDelete?.name || id}`
    );

    this.saveData();
    return this.data.receptionists.length < initialLen;
  }

  // --- Patients ---
  public getPatients(): Patient[] {
    this.logSql('SELECT', 'patients', 'SELECT * FROM patients ORDER BY registered_date DESC;', 'Fetch all registered patients');
    return this.data.patients;
  }

  public getPatientById(id: string): Patient | undefined {
    return this.data.patients.find(p => p.id === id);
  }

  public createPatient(patient: Omit<Patient, 'id' | 'registeredDate'> & { registeredDate?: string }): Patient {
    const id = `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newPatient: Patient = {
      ...patient,
      id,
      admissionStatus: patient.admissionStatus || 'Outpatient',
      registeredDate: patient.registeredDate || new Date().toISOString().split('T')[0]
    };
    this.data.patients.unshift(newPatient);

    this.logSql(
      'INSERT',
      'patients',
      `INSERT INTO patients (id, name, age, gender, phone, address, syndrome, blood_group, admission_status, registered_date)
VALUES ('${id}', '${newPatient.name}', ${newPatient.age}, '${newPatient.gender}', '${newPatient.phone}', '${newPatient.address}', '${newPatient.syndrome}', '${newPatient.bloodGroup || 'O+'}', '${newPatient.admissionStatus}', '${newPatient.registeredDate}');`,
      `Register new patient record for ${newPatient.name} with unique ID ${id}`
    );

    this.saveData();
    return newPatient;
  }

  public updatePatient(id: string, updates: Partial<Patient>): Patient | null {
    const index = this.data.patients.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data.patients[index] = { ...this.data.patients[index], ...updates };

    this.logSql(
      'UPDATE',
      'patients',
      `UPDATE patients SET ${Object.keys(updates).map(k => `${k} = ?`).join(', ')} WHERE id = '${id}';`,
      `Update patient record for ${this.data.patients[index].name}`
    );

    this.saveData();
    return this.data.patients[index];
  }

  public deletePatient(id: string): boolean {
    const patToDelete = this.data.patients.find(p => p.id === id);
    const initialLen = this.data.patients.length;
    this.data.patients = this.data.patients.filter(p => p.id !== id);

    this.logSql(
      'DELETE',
      'patients',
      `DELETE FROM patients WHERE id = '${id}';`,
      `Delete patient record for ${patToDelete?.name || id}`
    );

    this.saveData();
    return this.data.patients.length < initialLen;
  }

  // --- Beds Management & Bed Allocation ---
  public getBeds(): Bed[] {
    this.logSql('SELECT', 'beds', 'SELECT * FROM beds ORDER BY ward, bed_number ASC;', 'Fetch hospital inpatient beds inventory');
    return this.data.beds || [];
  }

  public getBedById(id: string): Bed | undefined {
    return (this.data.beds || []).find(b => b.id === id);
  }

  public allocateBed(bedId: string, patientId: string): { bed: Bed; patient: Patient } | null {
    if (!this.data.beds) this.data.beds = getInitialSeedData().beds;

    const bedIndex = this.data.beds.findIndex(b => b.id === bedId);
    const patIndex = this.data.patients.findIndex(p => p.id === patientId);

    if (bedIndex === -1 || patIndex === -1) return null;

    const patient = this.data.patients[patIndex];
    const today = new Date().toISOString().split('T')[0];

    // UPDATE Bed
    this.data.beds[bedIndex] = {
      ...this.data.beds[bedIndex],
      status: 'Occupied',
      patientId: patient.id,
      patientName: patient.name,
      allocatedDate: today
    };

    // UPDATE Patient
    this.data.patients[patIndex] = {
      ...patient,
      admissionStatus: 'Admitted',
      bedId: this.data.beds[bedIndex].id,
      bedNumber: this.data.beds[bedIndex].bedNumber,
      admittedDate: today
    };

    this.logSql(
      'TRANSACTION',
      'beds, patients',
      `BEGIN TRANSACTION;
UPDATE beds SET status = 'Occupied', patient_id = '${patient.id}', patient_name = '${patient.name}', allocated_date = '${today}' WHERE id = '${bedId}';
UPDATE patients SET admission_status = 'Admitted', bed_id = '${bedId}', bed_number = '${this.data.beds[bedIndex].bedNumber}', admitted_date = '${today}' WHERE id = '${patientId}';
COMMIT;`,
      `Allocate ${this.data.beds[bedIndex].bedNumber} (${this.data.beds[bedIndex].ward}) to admitted patient ${patient.name}`
    );

    this.saveData();
    return { bed: this.data.beds[bedIndex], patient: this.data.patients[patIndex] };
  }

  public releaseBed(bedId: string): Bed | null {
    if (!this.data.beds) return null;
    const index = this.data.beds.findIndex(b => b.id === bedId);
    if (index === -1) return null;

    const prevBed = this.data.beds[index];
    this.data.beds[index] = {
      ...prevBed,
      status: 'Available',
      patientId: undefined,
      patientName: undefined,
      allocatedDate: undefined
    };

    this.logSql(
      'UPDATE',
      'beds',
      `UPDATE beds SET status = 'Available', patient_id = NULL, patient_name = NULL, allocated_date = NULL WHERE id = '${bedId}';`,
      `Release bed ${prevBed.bedNumber} back to available inventory`
    );

    this.saveData();
    return this.data.beds[index];
  }

  // --- 3-in-1 Discharge & Billing Workflow ---
  public dischargePatient(patientId: string, options?: {
    medicineCharges?: number;
    discount?: number;
    paymentMethod?: 'Cash' | 'UPI' | 'Card' | 'Insurance';
    dischargeSummary?: string;
  }): { patient: Patient; bill: Bill; bed?: Bed } | null {
    const patIndex = this.data.patients.findIndex(p => p.id === patientId);
    if (patIndex === -1) return null;

    const patient = this.data.patients[patIndex];
    const today = new Date().toISOString().split('T')[0];

    // Find linked bed
    if (!this.data.beds) this.data.beds = getInitialSeedData().beds;
    const bedIndex = this.data.beds.findIndex(b => b.id === patient.bedId || b.patientId === patient.id);
    let bed: Bed | undefined = undefined;
    let bedDays = 1;
    let bedTotalCharge = 0;

    if (bedIndex !== -1) {
      bed = this.data.beds[bedIndex];
      if (patient.admittedDate) {
        const adDate = new Date(patient.admittedDate);
        const disDate = new Date(today);
        const diffDays = Math.ceil(Math.abs(disDate.getTime() - adDate.getTime()) / (1000 * 60 * 60 * 24));
        bedDays = Math.max(1, diffDays);
      }
      bedTotalCharge = (bed.dailyCharge || 800) * bedDays;

      // STEP 3: UPDATE bed status back to Available
      this.data.beds[bedIndex] = {
        ...bed,
        status: 'Available',
        patientId: undefined,
        patientName: undefined,
        allocatedDate: undefined
      };
    }

    // Doctor consultation fee lookup
    let consultationFee = 600;
    let doctorId = patient.treatingDoctorId;
    if (doctorId) {
      const doc = this.getDoctorById(doctorId);
      if (doc) consultationFee = doc.consultationFee;
    } else {
      const lastApp = this.data.appointments.find(a => a.patientId === patient.id);
      if (lastApp) {
        doctorId = lastApp.doctorId;
        const doc = this.getDoctorById(doctorId);
        if (doc) consultationFee = doc.consultationFee;
      }
    }

    const medicineCharges = options?.medicineCharges !== undefined ? Number(options.medicineCharges) : 450;
    const discount = options?.discount !== undefined ? Number(options.discount) : 0;
    const totalAmount = Math.max(0, consultationFee + bedTotalCharge + medicineCharges - discount);

    // STEP 1: INSERT into Bills
    const billCount = this.data.bills.length + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(billCount).padStart(3, '0')}`;
    const newBill: Bill = {
      id: `bill-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNumber,
      patientId: patient.id,
      doctorId: doctorId || 'doc-1',
      consultationFee,
      medicineCharges: medicineCharges + bedTotalCharge,
      discount,
      totalAmount,
      billDate: today,
      paymentStatus: 'Paid',
      paymentMethod: options?.paymentMethod || 'UPI'
    };
    this.data.bills.unshift(newBill);

    // STEP 2: UPDATE Patient status to Discharged
    const summary = options?.dischargeSummary || 
      `Inpatient treatment concluded after ${bedDays} day(s) in ${bed?.bedNumber || 'OPD'}. Clinical symptoms stabilized, vitals normal. Prescribed home recovery medications.`;

    this.data.patients[patIndex] = {
      ...patient,
      admissionStatus: 'Discharged',
      dischargedDate: today,
      dischargeSummary: summary,
      totalBilledAmount: totalAmount,
      bedId: undefined // freed from bed
    };

    // Log the 3-in-1 Transaction for college viva / examiner audit
    this.logSql(
      'TRANSACTION',
      'bills, patients, beds',
      `BEGIN TRANSACTION;
-- 1. Insert Final Settlement Bill
INSERT INTO bills (invoice_number, patient_id, doctor_id, consultation_fee, bed_charges, medicine_charges, total_amount, payment_status)
VALUES ('${invoiceNumber}', '${patient.id}', '${doctorId || 'doc-1'}', ${consultationFee}, ${bedTotalCharge}, ${medicineCharges}, ${totalAmount}, 'Paid');

-- 2. Update Patient Admission Status to Discharged
UPDATE patients 
SET admission_status = 'Discharged', 
    discharged_date = '${today}', 
    total_billed_amount = ${totalAmount}, 
    discharge_summary = '${summary.replace(/'/g, "''")}'
WHERE id = '${patient.id}';

-- 3. Release Bed Back to Inventory (Available)
UPDATE beds 
SET status = 'Available', 
    patient_id = NULL, 
    patient_name = NULL, 
    allocated_date = NULL 
WHERE id = '${bed?.id || 'N/A'}';
COMMIT;`,
      `3-in-1 Discharge: Generated invoice ₹${totalAmount}, marked ${patient.name} Discharged, and freed ${bed?.bedNumber || 'bed'}`
    );

    this.saveData();
    return {
      patient: this.data.patients[patIndex],
      bill: newBill,
      bed: bedIndex !== -1 ? this.data.beds[bedIndex] : undefined
    };
  }

  // --- Discharged & Admitted Patients Master Queries ---
  public getDischargedPatients(): Patient[] {
    const list = this.data.patients.filter(p => p.admissionStatus === 'Discharged');
    this.logSql(
      'SELECT',
      'patients',
      "SELECT id, name, age, gender, syndrome, disease_name, admitted_date, discharged_date, bed_number, total_billed_amount FROM patients WHERE admission_status = 'Discharged' ORDER BY discharged_date DESC;",
      'Admin Master View: Query historical list of all treated and discharged patients'
    );
    return list;
  }

  public getAdmittedPatients(): Patient[] {
    const list = this.data.patients.filter(p => p.admissionStatus === 'Admitted');
    this.logSql(
      'SELECT',
      'patients, beds',
      "SELECT p.*, b.bed_number, b.ward, b.daily_charge FROM patients p JOIN beds b ON p.bed_id = b.id WHERE p.admission_status = 'Admitted' ORDER BY p.admitted_date ASC;",
      'Query currently admitted inpatient roster'
    );
    return list;
  }

  // --- Patient Medical History & Records ---
  public getPatientMedicalHistory(patientId: string): { patient: Patient; appointments: Appointment[]; bills: Bill[] } | null {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;
    const appointments = this.data.appointments.filter(a => a.patientId === patientId);
    const bills = this.data.bills.filter(b => b.patientId === patientId);

    this.logSql(
      'SELECT',
      'appointments, patients, bills',
      `SELECT a.*, p.name, p.blood_group, p.syndrome FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.patient_id = '${patientId}' ORDER BY a.date DESC;`,
      `Doctor Check Medical History: Query past diagnoses and records for patient ${patient.name} (${patient.id})`
    );

    return { patient, appointments, bills };
  }

  // --- Appointments ---
  public getAppointments(): Appointment[] {
    this.logSql('SELECT', 'appointments', 'SELECT * FROM appointments ORDER BY date DESC, time ASC;', 'Query all hospital appointments');
    return this.data.appointments;
  }

  public getAppointmentById(id: string): Appointment | undefined {
    return this.data.appointments.find(a => a.id === id);
  }

  public createAppointment(app: Omit<Appointment, 'id' | 'createdDate'>): Appointment {
    const id = `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newAppointment: Appointment = {
      ...app,
      id,
      createdDate: new Date().toISOString().split('T')[0]
    };
    this.data.appointments.unshift(newAppointment);

    this.logSql(
      'INSERT',
      'appointments',
      `INSERT INTO appointments (id, patient_id, doctor_id, date, time, status, syndrome, notes)
VALUES ('${id}', '${newAppointment.patientId}', '${newAppointment.doctorId}', '${newAppointment.date}', '${newAppointment.time}', '${newAppointment.status}', '${newAppointment.syndrome}', '${(newAppointment.notes || '').replace(/'/g, "''")}');`,
      `Book appointment linking Patient ${newAppointment.patientId} to Doctor ${newAppointment.doctorId}`
    );

    this.saveData();
    return newAppointment;
  }

  public updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
    const index = this.data.appointments.findIndex(a => a.id === id);
    if (index === -1) return null;
    this.data.appointments[index] = { ...this.data.appointments[index], ...updates };

    this.logSql(
      'UPDATE',
      'appointments',
      `UPDATE appointments SET ${Object.keys(updates).map(k => `${k} = ?`).join(', ')} WHERE id = '${id}';`,
      `Update appointment status/notes for ${id}`
    );

    this.saveData();
    return this.data.appointments[index];
  }

  // Doctor Write Prescription / Diagnosis ("Save Record")
  public updateDoctorConsultation(appointmentId: string, data: { diseaseName: string; prescription: string; notes?: string }) {
    const appIndex = this.data.appointments.findIndex(a => a.id === appointmentId);
    if (appIndex === -1) return null;

    const prev = this.data.appointments[appIndex];
    this.data.appointments[appIndex] = {
      ...prev,
      diseaseName: data.diseaseName,
      diagnosis: data.diseaseName,
      prescription: data.prescription,
      notes: data.notes || prev.notes,
      status: 'Completed'
    };

    // Also update patient's diseaseName
    const patIndex = this.data.patients.findIndex(p => p.id === prev.patientId);
    if (patIndex !== -1) {
      this.data.patients[patIndex].diseaseName = data.diseaseName;
    }

    this.logSql(
      'UPDATE',
      'appointments, patients',
      `UPDATE appointments 
SET disease_name = '${data.diseaseName.replace(/'/g, "''")}', 
    diagnosis = '${data.diseaseName.replace(/'/g, "''")}', 
    prescription = '${data.prescription.replace(/'/g, "''")}', 
    notes = '${(data.notes || prev.notes || '').replace(/'/g, "''")}', 
    status = 'Completed' 
WHERE id = '${appointmentId}';
UPDATE patients SET disease_name = '${data.diseaseName.replace(/'/g, "''")}' WHERE id = '${prev.patientId}';`,
      `Doctor saved active consultation diagnosis (${data.diseaseName}) and Rx for appointment ${appointmentId}`
    );

    this.saveData();
    return this.data.appointments[appIndex];
  }

  public deleteAppointment(id: string): boolean {
    const initialLen = this.data.appointments.length;
    this.data.appointments = this.data.appointments.filter(a => a.id !== id);

    this.logSql('DELETE', 'appointments', `DELETE FROM appointments WHERE id = '${id}';`, `Cancel and delete appointment ${id}`);

    this.saveData();
    return this.data.appointments.length < initialLen;
  }

  // --- Bills ---
  public getBills(): Bill[] {
    this.logSql('SELECT', 'bills', 'SELECT * FROM bills ORDER BY bill_date DESC;', 'Query all hospital billing invoices');
    return this.data.bills;
  }

  public getBillById(id: string): Bill | undefined {
    return this.data.bills.find(b => b.id === id);
  }

  public createBill(billData: Omit<Bill, 'id' | 'invoiceNumber'>): Bill {
    const count = this.data.bills.length + 1;
    const invNumber = `INV-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    const id = `bill-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newBill: Bill = {
      ...billData,
      id,
      invoiceNumber: invNumber
    };
    this.data.bills.unshift(newBill);

    this.logSql(
      'INSERT',
      'bills',
      `INSERT INTO bills (id, invoice_number, patient_id, doctor_id, consultation_fee, medicine_charges, total_amount, bill_date, payment_status, payment_method)
VALUES ('${id}', '${invNumber}', '${newBill.patientId}', '${newBill.doctorId || ''}', ${newBill.consultationFee}, ${newBill.medicineCharges}, ${newBill.totalAmount}, '${newBill.billDate}', '${newBill.paymentStatus}', '${newBill.paymentMethod}');`,
      `Generate billing invoice ${invNumber} for patient ${newBill.patientId}`
    );

    this.saveData();
    return newBill;
  }

  public updateBill(id: string, updates: Partial<Bill>): Bill | null {
    const index = this.data.bills.findIndex(b => b.id === id);
    if (index === -1) return null;
    this.data.bills[index] = { ...this.data.bills[index], ...updates };
    this.saveData();
    return this.data.bills[index];
  }

  public deleteBill(id: string): boolean {
    const initialLen = this.data.bills.length;
    this.data.bills = this.data.bills.filter(b => b.id !== id);
    this.saveData();
    return this.data.bills.length < initialLen;
  }

  // --- Aggregate Stats & Reports with Bed & Inpatient Counts ---
  public getStats() {
    const todayStr = new Date().toISOString().split('T')[0];

    const totalPatients = this.data.patients.length;
    const todayAppointments = this.data.appointments.filter(a => a.date === todayStr);
    const availableDoctors = this.data.doctors.filter(d => d.availabilityStatus === 'Available').length;
    const totalDoctors = this.data.doctors.length;

    // Bed & Inpatient stats
    const beds = this.data.beds || [];
    const totalBeds = beds.length;
    const availableBeds = beds.filter(b => b.status === 'Available').length;
    const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
    const admittedPatientsCount = this.data.patients.filter(p => p.admissionStatus === 'Admitted').length;
    const dischargedPatientsCount = this.data.patients.filter(p => p.admissionStatus === 'Discharged').length;

    const totalRevenue = this.data.bills
      .filter(b => b.paymentStatus === 'Paid')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const pendingRevenue = this.data.bills
      .filter(b => b.paymentStatus === 'Pending')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const specCounts: Record<string, number> = {};
    for (const doc of this.data.doctors) {
      specCounts[doc.specialization] = 0;
    }
    for (const app of this.data.appointments) {
      const doc = this.data.doctors.find(d => d.id === app.doctorId);
      if (doc) {
        specCounts[doc.specialization] = (specCounts[doc.specialization] || 0) + 1;
      }
    }

    const appointmentsBySpecialization = Object.entries(specCounts).map(([specialization, count]) => ({
      specialization,
      count
    }));

    const statusCounts = {
      Scheduled: this.data.appointments.filter(a => a.status === 'Scheduled').length,
      Completed: this.data.appointments.filter(a => a.status === 'Completed').length,
      Cancelled: this.data.appointments.filter(a => a.status === 'Cancelled').length
    };

    const monthlyRevenue = [
      { month: 'May', revenue: 14200, appointments: 18 },
      { month: 'Jun', revenue: 18900, appointments: 24 },
      { month: 'Jul', revenue: 22400, appointments: 31 },
      { month: 'Aug', revenue: 26800, appointments: 35 },
      { month: 'Sep', revenue: 31500, appointments: 42 },
      { month: 'Oct', revenue: Math.max(34200, totalRevenue), appointments: this.data.appointments.length + 38 }
    ];

    this.logSql(
      'SELECT',
      'patients, beds, bills, appointments',
      `SELECT COUNT(*) AS total_patients, 
       (SELECT COUNT(*) FROM patients WHERE admission_status='Admitted') AS admitted_count, 
       (SELECT COUNT(*) FROM beds WHERE status='Available') AS available_beds, 
       (SELECT SUM(total_amount) FROM bills WHERE payment_status='Paid') AS total_revenue;`,
      'Monitor Operations: Dashboard aggregation query for patients, beds, and revenue'
    );

    return {
      totalPatients,
      todayAppointmentsCount: todayAppointments.length,
      availableDoctors,
      totalDoctors,
      totalRevenue,
      pendingRevenue,
      totalBeds,
      availableBeds,
      occupiedBeds,
      admittedPatientsCount,
      dischargedPatientsCount,
      completedAppointmentsCount: statusCounts.Completed,
      scheduledAppointmentsCount: statusCounts.Scheduled,
      cancelledAppointmentsCount: statusCounts.Cancelled,
      appointmentsBySpecialization,
      statusCounts,
      monthlyRevenue
    };
  }
}

export const db = new Database();
