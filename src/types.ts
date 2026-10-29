export type Role = 'admin' | 'receptionist' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  doctorId?: string; // If role is doctor, links to doctor profile
  phone?: string;
}

export type Specialization = 
  | 'Cardiologist'
  | 'Dermatologist'
  | 'Orthopedic'
  | 'General Physician'
  | 'Neurologist'
  | 'Pediatrician';

export type Syndrome = 
  | 'Fever'
  | 'Chest Pain'
  | 'Fracture'
  | 'Skin Allergy'
  | 'Migraine'
  | 'Diabetes'
  | 'Eye Irritation'
  | 'Stomach Ache';

export type AvailabilityStatus = 
  | 'Available' 
  | 'In Consultation' 
  | 'On Break' 
  | 'On Leave' 
  | 'Resigned / Relieved';

export interface Doctor {
  id: string;
  name: string;
  specialization: Specialization;
  phone: string;
  email: string;
  consultationFee: number;
  availabilityStatus: AvailabilityStatus;
  qualifications: string;
  experienceYears: number;
  roomNumber: string;
  avatar?: string;
  shiftTiming?: string; // e.g. "09:00 - 17:00"
  breakTiming?: string; // e.g. "13:00 - 14:00 (Lunch Break)"
  resignationReason?: string; // e.g. "Relocating to another city", "Higher Medical Studies"
  relievedDate?: string; // YYYY-MM-DD
  joinDate?: string;
}

export type AdmissionStatus = 'Admitted' | 'Outpatient' | 'Discharged';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  address: string;
  syndrome: Syndrome;
  registeredDate: string; // YYYY-MM-DD
  bloodGroup?: string;
  emergencyContact?: string;
  admissionStatus?: AdmissionStatus;
  bedId?: string;
  bedNumber?: string;
  admittedDate?: string;
  dischargedDate?: string;
  dischargeSummary?: string;
  diseaseName?: string;
  totalBilledAmount?: number;
  treatingDoctorId?: string;
  treatingDoctorName?: string;
}

export type BedStatus = 'Available' | 'Occupied' | 'Under Maintenance';
export type WardType = 'General Ward' | 'Semi-Private Room' | 'ICU / Critical Care' | 'Emergency Daycare';

export interface Bed {
  id: string;
  bedNumber: string;
  ward: WardType;
  dailyCharge: number;
  status: BedStatus;
  patientId?: string;
  patientName?: string;
  allocatedDate?: string;
}

export interface SqlLogEntry {
  id: string;
  timestamp: string;
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRANSACTION';
  table: string;
  sql: string;
  params?: any;
  executionTimeMs: number;
  description: string;
}

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  syndrome: Syndrome;
  notes?: string;
  prescription?: string;
  diagnosis?: string;
  diseaseName?: string; // Added for medical diagnosis/prescription
  createdDate: string;
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  appointmentId?: string;
  patientId: string;
  doctorId?: string;
  consultationFee: number;
  medicineCharges: number;
  discount: number;
  totalAmount: number;
  billDate: string;
  paymentStatus: 'Paid' | 'Pending';
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Insurance';
}

export type StaffDutyStatus = 
  | 'On Duty' 
  | 'On Break' 
  | 'Shift Completed' 
  | 'On Leave' 
  | 'Resigned / Relieved';

export interface Receptionist {
  id: string;
  name: string;
  email: string;
  phone: string;
  shift: 'Morning' | 'Evening' | 'Night';
  deskNumber: string;
  dutyStatus?: StaffDutyStatus;
  shiftTiming?: string; // e.g. "08:00 - 14:00"
  breakTiming?: string; // e.g. "11:30 - 12:00 (Tea & Lunch)"
  resignationReason?: string;
  relievedDate?: string;
  joinDate?: string;
  avatar?: string;
}

// Syndrome Recommendation Rules
export const SYNDROME_SPECIALIST_MAP: Record<Syndrome, {
  primarySpecialty: Specialization;
  alternateSpecialty?: Specialization;
  recommendationReason: string;
  commonSymptoms: string;
}> = {
  'Fever': {
    primarySpecialty: 'General Physician',
    alternateSpecialty: 'Pediatrician',
    recommendationReason: 'Viral or bacterial evaluation & systemic management (Pediatrician for child patients)',
    commonSymptoms: 'High temperature, chills, fatigue, body ache'
  },
  'Chest Pain': {
    primarySpecialty: 'Cardiologist',
    alternateSpecialty: 'General Physician',
    recommendationReason: 'Cardiovascular assessment, ECG review & cardiac monitoring',
    commonSymptoms: 'Angina, shortness of breath, palpitation, pressure in chest'
  },
  'Fracture': {
    primarySpecialty: 'Orthopedic',
    recommendationReason: 'Bone trauma evaluation, X-ray review, splinting/cast application',
    commonSymptoms: 'Severe bone pain, swelling, deformity, inability to bear weight'
  },
  'Skin Allergy': {
    primarySpecialty: 'Dermatologist',
    recommendationReason: 'Epidermal diagnosis, topical treatments & allergen screening',
    commonSymptoms: 'Rash, hives, redness, severe itching, skin flare-ups'
  },
  'Migraine': {
    primarySpecialty: 'Neurologist',
    alternateSpecialty: 'General Physician',
    recommendationReason: 'Neurological evaluation, neurovascular migraine management',
    commonSymptoms: 'Unilateral throbbing headache, light sensitivity, nausea'
  },
  'Diabetes': {
    primarySpecialty: 'General Physician',
    recommendationReason: 'Metabolic & glycemic assessment, insulin/medication adjustments',
    commonSymptoms: 'Frequent urination, excessive thirst, fluctuating blood glucose'
  },
  'Eye Irritation': {
    primarySpecialty: 'General Physician',
    recommendationReason: 'Initial ocular screening and systemic infection assessment',
    commonSymptoms: 'Redness, foreign body sensation, dryness, mild discharge'
  },
  'Stomach Ache': {
    primarySpecialty: 'General Physician',
    recommendationReason: 'Abdominal examination, gastrointestinal evaluation',
    commonSymptoms: 'Abdominal cramps, acidity, indigestion, nausea'
  }
};
