import { Doctor, Patient, Appointment, Bill, Receptionist, User, Bed, SqlLogEntry } from './types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ user: User; doctor?: Doctor; message: string }> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  resetData: async (): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/reset-data`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  // Stats
  getStats: async (): Promise<{
    totalPatients: number;
    todayAppointmentsCount: number;
    availableDoctors: number;
    totalDoctors: number;
    totalRevenue: number;
    pendingRevenue: number;
    totalBeds: number;
    availableBeds: number;
    occupiedBeds: number;
    admittedPatientsCount: number;
    dischargedPatientsCount: number;
    completedAppointmentsCount: number;
    scheduledAppointmentsCount: number;
    cancelledAppointmentsCount: number;
    appointmentsBySpecialization: { specialization: string; count: number }[];
    statusCounts: { Scheduled: number; Completed: number; Cancelled: number };
    monthlyRevenue: { month: string; revenue: number; appointments: number }[];
  }> => {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse(res);
  },

  // Doctors
  getDoctors: async (): Promise<Doctor[]> => {
    const res = await fetch(`${API_BASE}/doctors`);
    return handleResponse(res);
  },
  createDoctor: async (doc: Omit<Doctor, 'id'>): Promise<Doctor> => {
    const res = await fetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    return handleResponse(res);
  },
  updateDoctor: async (id: string, updates: Partial<Doctor>): Promise<Doctor> => {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },
  deleteDoctor: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Receptionists
  getReceptionists: async (): Promise<Receptionist[]> => {
    const res = await fetch(`${API_BASE}/receptionists`);
    return handleResponse(res);
  },
  createReceptionist: async (rec: Omit<Receptionist, 'id'>): Promise<Receptionist> => {
    const res = await fetch(`${API_BASE}/receptionists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rec)
    });
    return handleResponse(res);
  },
  updateReceptionist: async (id: string, updates: Partial<Receptionist>): Promise<Receptionist> => {
    const res = await fetch(`${API_BASE}/receptionists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },
  deleteReceptionist: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/receptionists/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Patients
  getPatients: async (): Promise<Patient[]> => {
    const res = await fetch(`${API_BASE}/patients`);
    return handleResponse(res);
  },
  createPatient: async (patient: Omit<Patient, 'id' | 'registeredDate'> & { registeredDate?: string }): Promise<Patient> => {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    });
    return handleResponse(res);
  },
  updatePatient: async (id: string, updates: Partial<Patient>): Promise<Patient> => {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },
  deletePatient: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Appointments
  getAppointments: async (params?: { doctorId?: string; date?: string; status?: string }): Promise<Appointment[]> => {
    const query = new URLSearchParams();
    if (params?.doctorId) query.append('doctorId', params.doctorId);
    if (params?.date) query.append('date', params.date);
    if (params?.status) query.append('status', params.status);

    const res = await fetch(`${API_BASE}/appointments?${query.toString()}`);
    return handleResponse(res);
  },
  createAppointment: async (app: Omit<Appointment, 'id' | 'createdDate'>): Promise<Appointment> => {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app)
    });
    return handleResponse(res);
  },
  updateAppointment: async (id: string, updates: Partial<Appointment>): Promise<Appointment> => {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },
  deleteAppointment: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Doctor Consultation: Save Record with disease name, prescription, notes
  saveDoctorConsultation: async (
    appointmentId: string,
    data: { diseaseName: string; prescription: string; notes?: string }
  ): Promise<{ message: string; appointment: Appointment }> => {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/doctor-consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Patient Medical History Check
  getPatientMedicalHistory: async (
    patientId: string
  ): Promise<{ patient: Patient; appointments: Appointment[]; bills: Bill[] }> => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/medical-history`);
    return handleResponse(res);
  },

  // Beds Management & Bed Allocation (UPDATE queries)
  getBeds: async (): Promise<Bed[]> => {
    const res = await fetch(`${API_BASE}/beds`);
    return handleResponse(res);
  },
  allocateBed: async (bedId: string, patientId: string): Promise<{ message: string; bed: Bed; patient: Patient }> => {
    const res = await fetch(`${API_BASE}/beds/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bedId, patientId })
    });
    return handleResponse(res);
  },
  releaseBed: async (bedId: string): Promise<{ message: string; bed: Bed }> => {
    const res = await fetch(`${API_BASE}/beds/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bedId })
    });
    return handleResponse(res);
  },

  // 3-in-1 Atomic Discharge & Final Billing Workflow
  dischargePatient: async (
    patientId: string,
    options?: {
      medicineCharges?: number;
      discount?: number;
      paymentMethod?: 'Cash' | 'UPI' | 'Card' | 'Insurance';
      dischargeSummary?: string;
    }
  ): Promise<{ message: string; patient: Patient; bill: Bill; bed?: Bed }> => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/discharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {})
    });
    return handleResponse(res);
  },

  getDischargedPatients: async (): Promise<Patient[]> => {
    const res = await fetch(`${API_BASE}/patients/discharged`);
    return handleResponse(res);
  },

  getAdmittedPatients: async (): Promise<Patient[]> => {
    const res = await fetch(`${API_BASE}/patients/admitted`);
    return handleResponse(res);
  },

  // Live SQL Query Logs for College Mini Project Viva Demonstration
  getSqlLogs: async (): Promise<SqlLogEntry[]> => {
    const res = await fetch(`${API_BASE}/sql-logs`);
    return handleResponse(res);
  },

  // Bills
  getBills: async (): Promise<Bill[]> => {
    const res = await fetch(`${API_BASE}/bills`);
    return handleResponse(res);
  },
  createBill: async (bill: Omit<Bill, 'id' | 'invoiceNumber'>): Promise<Bill> => {
    const res = await fetch(`${API_BASE}/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bill)
    });
    return handleResponse(res);
  },
  updateBill: async (id: string, updates: Partial<Bill>): Promise<Bill> => {
    const res = await fetch(`${API_BASE}/bills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },
  deleteBill: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/bills/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  }
};
