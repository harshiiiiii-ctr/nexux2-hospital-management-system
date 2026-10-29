import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// API Routes

// 1. Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.authenticate(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. Please check your email and password.' });
  }

  // Also include linked doctor info if doctor
  let doctorInfo = null;
  if (user.role === 'doctor' && user.doctorId) {
    doctorInfo = db.getDoctorById(user.doctorId) || null;
  }

  return res.json({
    user,
    doctor: doctorInfo,
    message: 'Login successful'
  });
});

app.post('/api/reset-data', (req, res) => {
  db.resetToSeed();
  return res.json({ message: 'Database reset to initial sample data successfully' });
});

// 2. Stats & Analytics
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch statistics' });
  }
});

// 3. Doctors
app.get('/api/doctors', (req, res) => {
  res.json(db.getDoctors());
});

app.post('/api/doctors', (req, res) => {
  const { name, specialization, phone, email, consultationFee, roomNumber } = req.body;
  if (!name || !specialization || !phone || !email) {
    return res.status(400).json({ error: 'Name, specialization, phone, and email are required' });
  }

  const newDoc = db.createDoctor({
    name,
    specialization,
    phone,
    email,
    consultationFee: Number(consultationFee) || 500,
    availabilityStatus: req.body.availabilityStatus || 'Available',
    qualifications: req.body.qualifications || 'MBBS, MD',
    experienceYears: Number(req.body.experienceYears) || 5,
    roomNumber: roomNumber || 'OPD-101',
    shiftTiming: req.body.shiftTiming || '09:00 - 17:00',
    breakTiming: req.body.breakTiming || '13:00 - 14:00 (Lunch Break)',
    avatar: req.body.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&q=80',
    joinDate: req.body.joinDate || new Date().toISOString().split('T')[0],
    resignationReason: req.body.resignationReason,
    relievedDate: req.body.relievedDate
  });
  res.status(201).json(newDoc);
});

app.put('/api/doctors/:id', (req, res) => {
  const updated = db.updateDoctor(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Doctor not found' });
  }
  res.json(updated);
});

app.delete('/api/doctors/:id', (req, res) => {
  const success = db.deleteDoctor(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Doctor not found' });
  }
  res.json({ message: 'Doctor deleted successfully' });
});

// 4. Receptionists
app.get('/api/receptionists', (req, res) => {
  res.json(db.getReceptionists());
});

app.post('/api/receptionists', (req, res) => {
  const { name, email, phone, shift, deskNumber } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  const newRec = db.createReceptionist({
    name,
    email,
    phone,
    shift: shift || 'Morning',
    deskNumber: deskNumber || 'Counter A-1',
    dutyStatus: req.body.dutyStatus || 'On Duty',
    shiftTiming: req.body.shiftTiming || '08:00 - 14:00',
    breakTiming: req.body.breakTiming || '11:30 - 12:00 (Tea & Lunch)',
    avatar: req.body.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
    joinDate: req.body.joinDate || new Date().toISOString().split('T')[0],
    resignationReason: req.body.resignationReason,
    relievedDate: req.body.relievedDate
  });
  res.status(201).json(newRec);
});

app.put('/api/receptionists/:id', (req, res) => {
  const updated = db.updateReceptionist(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Receptionist not found' });
  }
  res.json(updated);
});

app.delete('/api/receptionists/:id', (req, res) => {
  const success = db.deleteReceptionist(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Receptionist not found' });
  }
  res.json({ message: 'Receptionist deleted successfully' });
});

// 5. Patients
app.get('/api/patients', (req, res) => {
  res.json(db.getPatients());
});

app.post('/api/patients', (req, res) => {
  const { name, age, gender, phone, address, syndrome } = req.body;
  if (!name || age === undefined || !gender || !phone || !syndrome) {
    return res.status(400).json({ error: 'Name, age, gender, phone, and syndrome are required' });
  }

  const newPat = db.createPatient({
    name,
    age: Number(age),
    gender,
    phone,
    address: address || 'Not provided',
    syndrome,
    bloodGroup: req.body.bloodGroup || 'O+',
    emergencyContact: req.body.emergencyContact || phone
  });
  res.status(201).json(newPat);
});

app.put('/api/patients/:id', (req, res) => {
  const updated = db.updatePatient(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(updated);
});

app.delete('/api/patients/:id', (req, res) => {
  const success = db.deletePatient(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json({ message: 'Patient removed successfully' });
});

// 6. Appointments
app.get('/api/appointments', (req, res) => {
  let appointments = db.getAppointments();
  const { doctorId, date, status } = req.query;

  if (doctorId) {
    appointments = appointments.filter(a => a.doctorId === doctorId);
  }
  if (date) {
    appointments = appointments.filter(a => a.date === date);
  }
  if (status) {
    appointments = appointments.filter(a => a.status === status);
  }

  res.json(appointments);
});

app.post('/api/appointments', (req, res) => {
  const { patientId, doctorId, date, time, syndrome } = req.body;
  if (!patientId || !doctorId || !date || !time) {
    return res.status(400).json({ error: 'Patient, Doctor, Date, and Time are required' });
  }

  const newApp = db.createAppointment({
    patientId,
    doctorId,
    date,
    time,
    status: req.body.status || 'Scheduled',
    syndrome: syndrome || 'Fever',
    notes: req.body.notes || '',
    diagnosis: req.body.diagnosis || '',
    prescription: req.body.prescription || ''
  });
  res.status(201).json(newApp);
});

app.put('/api/appointments/:id', (req, res) => {
  const updated = db.updateAppointment(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json(updated);
});

app.delete('/api/appointments/:id', (req, res) => {
  const success = db.deleteAppointment(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json({ message: 'Appointment deleted successfully' });
});

// 7. Bills
app.get('/api/bills', (req, res) => {
  res.json(db.getBills());
});

app.post('/api/bills', (req, res) => {
  const { appointmentId, patientId, doctorId, consultationFee, medicineCharges } = req.body;
  if (!appointmentId || !patientId || !doctorId) {
    return res.status(400).json({ error: 'Appointment, Patient, and Doctor are required' });
  }

  const cFee = Number(consultationFee) || 0;
  const mFee = Number(medicineCharges) || 0;
  const discount = Number(req.body.discount) || 0;
  const total = Math.max(0, cFee + mFee - discount);

  const newBill = db.createBill({
    appointmentId,
    patientId,
    doctorId,
    consultationFee: cFee,
    medicineCharges: mFee,
    discount,
    totalAmount: total,
    billDate: req.body.billDate || new Date().toISOString().split('T')[0],
    paymentStatus: req.body.paymentStatus || 'Paid',
    paymentMethod: req.body.paymentMethod || 'Cash'
  });

  res.status(201).json(newBill);
});

app.put('/api/bills/:id', (req, res) => {
  const updated = db.updateBill(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Bill not found' });
  }
  res.json(updated);
});

app.delete('/api/bills/:id', (req, res) => {
  const success = db.deleteBill(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Bill not found' });
  }
  res.json({ message: 'Bill removed successfully' });
});

// 8. Inpatient Beds Management & Allocation (UPDATE queries)
app.get('/api/beds', (req, res) => {
  res.json(db.getBeds());
});

app.post('/api/beds/allocate', (req, res) => {
  const { bedId, patientId } = req.body;
  if (!bedId || !patientId) {
    return res.status(400).json({ error: 'bedId and patientId are required' });
  }
  const result = db.allocateBed(bedId, patientId);
  if (!result) {
    return res.status(400).json({ error: 'Failed to allocate bed. Check bed and patient existence.' });
  }
  res.json({ message: 'Bed allocated successfully', ...result });
});

app.post('/api/beds/release', (req, res) => {
  const { bedId } = req.body;
  if (!bedId) {
    return res.status(400).json({ error: 'bedId is required' });
  }
  const result = db.releaseBed(bedId);
  if (!result) {
    return res.status(404).json({ error: 'Bed not found' });
  }
  res.json({ message: 'Bed released successfully', bed: result });
});

// 9. Inpatient Admission & 3-in-1 Discharge Workflow (Atomic Transaction: Calculate Bill + UPDATE Patient + UPDATE Bed)
app.post('/api/patients/:id/discharge', (req, res) => {
  const patientId = req.params.id;
  const { medicineCharges, discount, paymentMethod, dischargeSummary } = req.body;
  const result = db.dischargePatient(patientId, {
    medicineCharges,
    discount,
    paymentMethod,
    dischargeSummary
  });
  if (!result) {
    return res.status(404).json({ error: 'Patient not found or unable to discharge' });
  }
  res.json({
    message: 'Patient successfully discharged, final bill generated, and bed released back to inventory',
    ...result
  });
});

app.get('/api/patients/discharged', (req, res) => {
  res.json(db.getDischargedPatients());
});

app.get('/api/patients/admitted', (req, res) => {
  res.json(db.getAdmittedPatients());
});

app.get('/api/patients/:id/medical-history', (req, res) => {
  const history = db.getPatientMedicalHistory(req.params.id);
  if (!history) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(history);
});

// 10. Doctor Consultation: Write Prescription & Diagnosis ("Save Record" UPDATE query)
app.post('/api/appointments/:id/doctor-consultation', (req, res) => {
  const { diseaseName, prescription, notes } = req.body;
  if (!diseaseName || !prescription) {
    return res.status(400).json({ error: 'diseaseName and prescription are required' });
  }
  const updated = db.updateDoctorConsultation(req.params.id, {
    diseaseName,
    prescription,
    notes
  });
  if (!updated) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json({
    message: 'Doctor consultation record, diagnosis, and prescription saved successfully',
    appointment: updated
  });
});

// 11. Live SQL Query Logs for College Mini Project Viva Demonstration
app.get('/api/sql-logs', (req, res) => {
  res.json(db.getSqlLogs());
});

// Vite middleware or Static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexus Care Hospital Management System server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
