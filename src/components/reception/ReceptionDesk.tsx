import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Stethoscope, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Phone, 
  User, 
  MapPin, 
  Activity, 
  Zap, 
  FileText,
  BadgeCheck,
  ChevronRight,
  HeartPulse,
  BedDouble,
  LogOut,
  Receipt,
  Printer,
  X,
  Check,
  ShieldCheck,
  Database
} from 'lucide-react';
import { Doctor, Patient, Syndrome, SYNDROME_SPECIALIST_MAP, Specialization, Bed } from '../../types';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { HOSPITAL_IMAGES, DOCTOR_AVATARS } from '../../assets/images';

interface ReceptionDeskProps {
  doctors: Doctor[];
  patients: Patient[];
  onDataChanged: () => void;
  onNavigateToAppointments?: () => void;
  onNavigateToBilling?: (appointmentId: string) => void;
}

const SYNDROMES_LIST: { id: Syndrome; label: string; icon: string; description: string; color: string }[] = [
  { id: 'Fever', label: 'Fever / Pyrexia', icon: '🌡️', description: 'High temp, chills, body ache', color: 'from-amber-500/10 to-orange-500/10 border-amber-300' },
  { id: 'Chest Pain', label: 'Chest Pain / Angina', icon: '🫀', description: 'Sternum tightness, dyspnea, palpitations', color: 'from-rose-500/10 to-red-500/10 border-rose-300' },
  { id: 'Fracture', label: 'Fracture / Trauma', icon: '🦴', description: 'Bone trauma, severe swelling, acute pain', color: 'from-blue-500/10 to-indigo-500/10 border-blue-300' },
  { id: 'Skin Allergy', label: 'Skin Allergy / Rash', icon: '🧴', description: 'Pruritus, erythema, hives, urticaria', color: 'from-emerald-500/10 to-teal-500/10 border-emerald-300' },
  { id: 'Migraine', label: 'Migraine / Headache', icon: '⚡', description: 'Unilateral pulsatile pain, photophobia', color: 'from-purple-500/10 to-violet-500/10 border-purple-300' },
  { id: 'Diabetes', label: 'Diabetes / Glycemic', icon: '🩸', description: 'Polyuria, polydipsia, high blood sugar', color: 'from-cyan-500/10 to-teal-500/10 border-cyan-300' },
  { id: 'Eye Irritation', label: 'Eye Irritation / Redness', icon: '👁️', description: 'Red eyes, foreign sensation, dryness', color: 'from-sky-500/10 to-blue-500/10 border-sky-300' },
  { id: 'Stomach Ache', label: 'Stomach Ache / Acidity', icon: '🩺', description: 'Abdominal spasm, nausea, hyperacidity', color: 'from-yellow-500/10 to-amber-500/10 border-yellow-300' },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

export const ReceptionDesk: React.FC<ReceptionDeskProps> = ({
  doctors,
  patients,
  onDataChanged,
  onNavigateToAppointments,
  onNavigateToBilling
}) => {
  const { success, error, info } = useToast();

  // Reception Desk 3 Main Workspaces
  const [activeWorkspace, setActiveWorkspace] = useState<'intake' | 'bed_allocation' | 'discharge'>('intake');

  // Intake Mode (New Patient vs Registered Patient)
  const [intakeMode, setIntakeMode] = useState<'new_patient' | 'existing_patient'>('new_patient');
  
  // Existing Patient Search
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<Patient | null>(null);

  // New Patient Form
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [selectedSyndrome, setSelectedSyndrome] = useState<Syndrome>('Fever');

  // Appointment Scheduling State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [appointmentTime, setAppointmentTime] = useState<string>('10:30');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingOnlyPatient, setIsSavingOnlyPatient] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Beds State for Bed Allocation
  const [beds, setBeds] = useState<Bed[]>([]);
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [selectedPatientForBed, setSelectedPatientForBed] = useState<string>('');
  const [isAllocatingBed, setIsAllocatingBed] = useState(false);

  // Discharge State
  const [dischargePatientId, setDischargePatientId] = useState<string>('');
  const [dischargeForm, setDischargeForm] = useState({
    medicineCharges: '450',
    discount: '0',
    paymentMethod: 'UPI' as 'Cash' | 'UPI' | 'Card' | 'Insurance',
    dischargeSummary: 'Inpatient recovery completed. Clinical vitals normal, prescribed oral medications.'
  });
  const [isDischarging, setIsDischarging] = useState(false);
  const [printableDischargeSlip, setPrintableDischargeSlip] = useState<Patient | null>(null);

  // Load beds from API
  useEffect(() => {
    loadBeds();
  }, []);

  const loadBeds = async () => {
    try {
      const data = await api.getBeds();
      setBeds(data);
      const availableBed = data.find(b => b.status === 'Available');
      if (availableBed && !selectedBedId) {
        setSelectedBedId(availableBed.id);
      }
    } catch (err) {
      // ignore
    }
  };

  // Compute recommendation
  const syndromeDetails = SYNDROME_SPECIALIST_MAP[selectedSyndrome];
  const isChild = typeof age === 'number' && age <= 14;
  const effectiveRecommendedSpecialty: Specialization = 
    isChild && selectedSyndrome === 'Fever' && syndromeDetails.alternateSpecialty
      ? syndromeDetails.alternateSpecialty
      : syndromeDetails.primarySpecialty;

  // Matching doctors
  const matchingDoctors = doctors.filter(
    d => d.specialization === effectiveRecommendedSpecialty && d.availabilityStatus !== 'Resigned / Relieved'
  );

  useEffect(() => {
    if (matchingDoctors.length > 0) {
      const currentValid = matchingDoctors.some(d => d.id === selectedDoctorId);
      if (!currentValid) {
        setSelectedDoctorId(matchingDoctors[0].id);
      }
    }
  }, [selectedSyndrome, isChild, doctors]);

  const validatePatientParticulars = () => {
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = 'Patient name is required';
    if (age === '' || Number(age) <= 0 || Number(age) > 120) err.age = 'Enter a valid age (1-120)';
    if (!phone.trim() || phone.trim().length < 8) err.phone = 'Enter a valid contact phone number';
    if (!address.trim()) err.address = 'Patient address is required';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // 1. RECEPTIONIST OPTION 1: "Save Patient" button runs SQL INSERT query & generates unique Patient ID
  const handleSavePatientOnly = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validatePatientParticulars()) {
      error('Please fill in valid patient personal particulars');
      return;
    }

    setIsSavingOnlyPatient(true);
    try {
      const newPatient = await api.createPatient({
        name: name.trim(),
        age: Number(age),
        gender,
        phone: phone.trim(),
        address: address.trim(),
        syndrome: selectedSyndrome,
        bloodGroup
      });

      success(`SQL INSERT Success: Patient ${newPatient.name} registered with unique ID: ${newPatient.id}`);
      
      // Auto-populate for bed allocation or appointment
      setSelectedExistingPatient(newPatient);
      setSelectedPatientForBed(newPatient.id);
      setIntakeMode('existing_patient');
      setName('');
      setAge('');
      setPhone('');
      setAddress('');
      onDataChanged();
      loadBeds();
    } catch (err: any) {
      error(err.message || 'Failed to save patient');
    } finally {
      setIsSavingOnlyPatient(false);
    }
  };

  // 2. RECEPTIONIST OPTION 2: "Book Appointment" links Patient ID to Doctor ID and time slot
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    
    let targetPatientId = selectedExistingPatient?.id;
    let targetPatientName = selectedExistingPatient?.name || name;

    if (intakeMode === 'new_patient') {
      if (!name.trim()) err.name = 'Patient name is required';
      if (age === '' || Number(age) <= 0 || Number(age) > 120) err.age = 'Enter valid age';
      if (!phone.trim() || phone.trim().length < 8) err.phone = 'Enter valid phone';
      if (!address.trim()) err.address = 'Address is required';
    } else {
      if (!selectedExistingPatient) err.patient = 'Please select a registered patient';
    }

    if (!selectedDoctorId) err.doctor = 'Please select a consulting doctor';
    if (!appointmentDate) err.date = 'Date is required';
    if (!appointmentTime) err.time = 'Time slot is required';

    if (Object.keys(err).length > 0) {
      setErrors(err);
      error('Please complete required booking fields');
      return;
    }

    setIsSubmitting(true);
    try {
      if (intakeMode === 'new_patient') {
        const newPatient = await api.createPatient({
          name: name.trim(),
          age: Number(age),
          gender,
          phone: phone.trim(),
          address: address.trim(),
          syndrome: selectedSyndrome,
          bloodGroup
        });
        targetPatientId = newPatient.id;
        targetPatientName = newPatient.name;
      }

      const selectedDoc = doctors.find(d => d.id === selectedDoctorId);
      await api.createAppointment({
        patientId: targetPatientId!,
        doctorId: selectedDoctorId,
        date: appointmentDate,
        time: appointmentTime,
        status: 'Scheduled',
        syndrome: selectedSyndrome,
        notes: clinicalNotes.trim() || `Triage: ${selectedSyndrome}. Assigned to Dr. ${selectedDoc?.name} (${selectedDoc?.specialization}).`
      });

      success(`SQL INSERT: Appointment booked! Linked ${targetPatientName} (ID: ${targetPatientId}) to Dr. ${selectedDoc?.name || 'Specialist'} on ${appointmentDate} at ${appointmentTime}`);
      
      setName('');
      setAge('');
      setPhone('');
      setAddress('');
      setClinicalNotes('');
      setSelectedExistingPatient(null);
      setPatientSearch('');
      onDataChanged();

      if (onNavigateToAppointments) {
        setTimeout(() => onNavigateToAppointments(), 1200);
      }
    } catch (err: any) {
      error(err.message || 'Failed to complete appointment booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. RECEPTIONIST OPTION 3: Bed Allocation (UPDATE query changes bed status from Available to Occupied)
  const handleAllocateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedId) {
      error('Please select an available bed');
      return;
    }
    if (!selectedPatientForBed) {
      error('Please select a patient to allocate bed for');
      return;
    }

    setIsAllocatingBed(true);
    try {
      const res = await api.allocateBed(selectedBedId, selectedPatientForBed);
      success(`SQL UPDATE Success: Bed ${res.bed.bedNumber} status changed to 'Occupied' and assigned to ${res.patient.name}!`);
      loadBeds();
      onDataChanged();
      setSelectedPatientForBed('');
    } catch (err: any) {
      error(err.message || 'Failed to allocate bed');
    } finally {
      setIsAllocatingBed(false);
    }
  };

  // 4. RECEPTIONIST OPTION 4: 3-in-1 Discharge & Billing
  const handleExecuteDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargePatientId) {
      error('Please select an admitted patient to discharge');
      return;
    }

    setIsDischarging(true);
    try {
      const res = await api.dischargePatient(dischargePatientId, {
        medicineCharges: Number(dischargeForm.medicineCharges) || 0,
        discount: Number(dischargeForm.discount) || 0,
        paymentMethod: dischargeForm.paymentMethod,
        dischargeSummary: dischargeForm.dischargeSummary
      });

      success(`3-in-1 Atomic Discharge Complete! Bill calculated (₹${res.bill.totalAmount}), Patient ${res.patient.name} marked Discharged, and Bed released back to Available!`);
      loadBeds();
      onDataChanged();
      setPrintableDischargeSlip(res.patient);
      setDischargePatientId('');
    } catch (err: any) {
      error(err.message || 'Failed to process discharge');
    } finally {
      setIsDischarging(false);
    }
  };

  const admittedPatients = patients.filter(p => p.admissionStatus === 'Admitted');
  const availableBeds = beds.filter(b => b.status === 'Available');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone.includes(patientSearch) ||
    p.syndrome.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-700/50 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src={HOSPITAL_IMAGES.lobby} 
            alt="Nexus Care Lobby" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-400/20 text-teal-200 border border-teal-400/30 mb-2">
              <HeartPulse className="w-4 h-4 text-emerald-300" />
              <span>Front Desk Receptionist Operations Console</span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Reception Desk: Registration, Bed Allocation & Discharge
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
              Patient intake with SQL INSERT, OPD appointments linking doctor & time slots, Inpatient bed allocations with SQL UPDATE, and 3-in-1 atomic discharge transactions.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-500/20 text-teal-200 border border-teal-400/30 font-mono">
              {availableBeds.length} Beds Available
            </span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-200 border border-blue-400/30 font-mono">
              {admittedPatients.length} Admitted Inpatients
            </span>
          </div>
        </div>
      </div>

      {/* 3 Main Reception Workspaces Tab Strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveWorkspace('intake')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeWorkspace === 'intake'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-700/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>1. Patient Registration & OPD Booking (INSERT)</span>
        </button>

        <button
          onClick={() => setActiveWorkspace('bed_allocation')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeWorkspace === 'bed_allocation'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-700/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BedDouble className="w-4 h-4 text-blue-500" />
          <span>2. Inpatient Bed Allocation (UPDATE)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            {availableBeds.length} Free
          </span>
        </button>

        <button
          onClick={() => setActiveWorkspace('discharge')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeWorkspace === 'discharge'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-700/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <LogOut className="w-4 h-4 text-purple-400" />
          <span>3. Discharge & Billing (3-in-1 Transaction)</span>
          {admittedPatients.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950">
              {admittedPatients.length} Inpatients
            </span>
          )}
        </button>
      </div>

      {/* WORKSPACE 1: PATIENT REGISTRATION & OPD APPOINTMENTS */}
      {activeWorkspace === 'intake' && (
        <form onSubmit={handleBookAppointment} className="space-y-6">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Intake Mode:</span>
              <button
                type="button"
                onClick={() => { setIntakeMode('new_patient'); setErrors({}); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  intakeMode === 'new_patient'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                + New Patient Intake
              </button>
              <button
                type="button"
                onClick={() => { setIntakeMode('existing_patient'); setErrors({}); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  intakeMode === 'existing_patient'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Existing Registered Patient
              </button>
            </div>

            <div className="text-[11px] font-mono text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
              SQL: <code>INSERT INTO patients ...; INSERT INTO appointments ...;</code>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Patient Details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-slate-900 text-base">
                        {intakeMode === 'new_patient' ? 'Patient Personal Particulars' : 'Select Registered Patient'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {intakeMode === 'new_patient' ? 'Demographic details (generates unique Patient ID)' : 'Search by name, phone or Patient ID'}
                      </p>
                    </div>
                  </div>

                  {/* STANDALONE SAVE PATIENT BUTTON (SQL INSERT) */}
                  {intakeMode === 'new_patient' && (
                    <button
                      type="button"
                      onClick={handleSavePatientOnly}
                      disabled={isSavingOnlyPatient}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Save patient without booking an appointment immediately"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isSavingOnlyPatient ? 'Saving...' : 'Save Patient (SQL INSERT)'}</span>
                    </button>
                  )}
                </div>

                {intakeMode === 'existing_patient' ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        placeholder="Search patient name, phone, or PAT-xxx..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {filteredPatients.length > 0 && (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {filteredPatients.map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedExistingPatient(p);
                              setSelectedSyndrome(p.syndrome);
                            }}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all text-xs ${
                              selectedExistingPatient?.id === p.id
                                ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-200'
                                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex justify-between font-bold text-slate-900">
                              <span>{p.name}</span>
                              <span className="font-mono text-teal-700">{p.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex justify-between mt-0.5">
                              <span>{p.gender}, {p.age} yrs • {p.phone}</span>
                              <span className="font-semibold text-teal-800">{p.syndrome}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedExistingPatient && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-xs">
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Selected: {selectedExistingPatient.name}</span>
                        </div>
                        <div className="text-slate-600 text-[11px] mt-1 font-mono">
                          ID: {selectedExistingPatient.id} • Phone: {selectedExistingPatient.phone}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                      />
                      {errors.name && <span className="text-[10px] text-rose-500 font-bold">{errors.name}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Age *</label>
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="45"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                        />
                        {errors.age && <span className="text-[10px] text-rose-500 font-bold">{errors.age}</span>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-500 font-medium"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-teal-500"
                        />
                        {errors.phone && <span className="text-[10px] text-rose-500 font-bold">{errors.phone}</span>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                        >
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address *</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Andheri West, Mumbai"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                      />
                      {errors.address && <span className="text-[10px] text-rose-500 font-bold">{errors.address}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Clinical Symptoms & Triage */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-slate-900 text-base">
                      Clinical Syndrome & Chief Complaint
                    </h3>
                    <p className="text-[11px] text-slate-500">Automated triage matches with certified Indian specialists</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {SYNDROMES_LIST.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setSelectedSyndrome(s.id)}
                      className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-2 ${
                        selectedSyndrome === s.id
                          ? 'border-teal-500 bg-teal-50/70 shadow-xs ring-2 ring-teal-200'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base">{s.icon}</span>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{s.label}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{s.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Doctor Recommendation & Slot Booking (Step 3 & 4) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-slate-900 text-base">
                        Recommended Specialist Consultation
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Assigned specialty: <strong className="text-teal-700">{effectiveRecommendedSpecialty}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800">
                    OPD Queuing
                  </span>
                </div>

                {/* Matching Doctor Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchingDoctors.length > 0 ? (
                    matchingDoctors.map((doc) => {
                      const isSelected = selectedDoctorId === doc.id;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoctorId(doc.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-200 shadow-xs'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <img
                            src={doc.avatar || DOCTOR_AVATARS[doc.id] || DOCTOR_AVATARS.default}
                            alt={doc.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div className="flex-1">
                            <div className="font-bold text-slate-900 text-xs">{doc.name}</div>
                            <div className="text-[11px] text-slate-500">{doc.qualifications}</div>
                            <div className="text-[11px] font-bold text-teal-800 mt-0.5">
                              Room: {doc.roomNumber} • Fee: ₹{doc.consultationFee}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                      No specialist on immediate OPD shift for {effectiveRecommendedSpecialty}. Please choose from all doctors below.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Or select any consultant doctor from full roster:
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization} • Room: {d.roomNumber} • Fee: ₹{d.consultationFee})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 4: Time Slot & Submit */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Date *</label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">OPD Time Slot *</label>
                      <select
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                      >
                        {TIME_SLOTS.map(t => (
                          <option key={t} value={t}>{t} HRS</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Triage & Clinical Notes</label>
                    <input
                      type="text"
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="e.g. Complaining of high fever with chills; BP 120/80"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* BOOK APPOINTMENT SUBMIT BUTTON (SQL INSERT) */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-700/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Executing SQL INSERT...' : 'Confirm Registration & Book OPD Appointment (SQL INSERT)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* WORKSPACE 2: INPATIENT BED ALLOCATION (SQL UPDATE) */}
      {activeWorkspace === 'bed_allocation' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Ward Administration
                </span>
                <span className="text-xs text-slate-400 font-semibold font-mono">
                  UPDATE beds SET status='Occupied'
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-slate-900 text-lg mt-1">
                Inpatient Bed Allocation & Admission
              </h3>
              <p className="text-xs text-slate-500">
                Assign an available hospital bed to an incoming or admitted patient. Runs SQL UPDATE on Beds table.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {availableBeds.length} Available Beds
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {beds.filter(b => b.status === 'Occupied').length} Occupied
              </span>
            </div>
          </div>

          <form onSubmit={handleAllocateBed} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Patient Needing Inpatient Bed *
                </label>
                <select
                  value={selectedPatientForBed}
                  onChange={(e) => setSelectedPatientForBed(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Registered Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id} • {p.gender}, {p.age} yrs • {p.syndrome} • Status: {p.admissionStatus || 'Outpatient'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Available Hospital Bed *
                </label>
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Available Bed --</option>
                  {availableBeds.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} ({b.ward} • ₹{b.dailyCharge}/day)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bed Inventory Cards Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Hospital Bed Inventory & Real-Time Status:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {beds.map(b => {
                  const isAvailable = b.status === 'Available';
                  const isSelected = selectedBedId === b.id;

                  return (
                    <div
                      key={b.id}
                      onClick={() => isAvailable && setSelectedBedId(b.id)}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isAvailable
                          ? isSelected
                            ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-300 cursor-pointer shadow-xs'
                            : 'border-slate-200 bg-white hover:border-blue-300 cursor-pointer'
                          : 'border-slate-200 bg-slate-50 opacity-75 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">{b.bedNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 font-semibold">{b.ward}</div>
                      <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                        <span>₹{b.dailyCharge}/day</span>
                        {b.patientName && <span className="font-bold text-blue-900">Patient: {b.patientName}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs space-y-1">
              <span className="text-slate-400 font-sans block text-[10px] uppercase font-bold">SQL Query Executed on Bed Allocation:</span>
              <code>UPDATE beds SET status = 'Occupied', patient_id = '{selectedPatientForBed || '<PATIENT_ID>'}', allocated_date = CURDATE() WHERE id = '{selectedBedId || '<BED_ID>'}';</code>
              <br />
              <code>UPDATE patients SET admission_status = 'Admitted', bed_id = '{selectedBedId || '<BED_ID>'}', admitted_date = CURDATE() WHERE id = '{selectedPatientForBed || '<PATIENT_ID>'}';</code>
            </div>

            <button
              type="submit"
              disabled={isAllocatingBed || !selectedBedId || !selectedPatientForBed}
              className="py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-md shadow-blue-700/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isAllocatingBed ? 'Allocating Bed...' : 'Allocate Bed (SQL UPDATE)'}</span>
            </button>
          </form>
        </div>
      )}

      {/* WORKSPACE 3: 3-IN-1 DISCHARGE & FINAL BILLING */}
      {activeWorkspace === 'discharge' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Atomic Transaction Workflow
                </span>
                <span className="text-xs text-slate-400 font-semibold font-mono">
                  BEGIN TRANSACTION; ... COMMIT;
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-slate-900 text-lg mt-1">
                Discharge & Billing: 3-in-1 Atomic Action Desk
              </h3>
              <p className="text-xs text-slate-500">
                1) Calculate total bill (Bed charge × days + doctor consultation + medicines), 2) Update patient status to "Discharged", 3) Release bed back to "Available".
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 font-mono">
              {admittedPatients.length} Patients Ready for Discharge
            </span>
          </div>

          {/* Admitted Patients List for Discharge */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-700">
              Select Admitted Patient to Discharge:
            </label>

            {admittedPatients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {admittedPatients.map(p => {
                  const isSelected = dischargePatientId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setDischargePatientId(p.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50/80 ring-2 ring-purple-300 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                        <span className="font-mono text-xs font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md">
                          {p.bedNumber || 'Bed Assigned'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex justify-between">
                        <span>{p.gender}, {p.age} yrs • ID: {p.id}</span>
                        <span>Admitted: {p.admittedDate || 'Today'}</span>
                      </div>
                      <div className="text-xs font-semibold text-teal-800 mt-1.5">
                        Clinical Diagnosis: {p.diseaseName || p.syndrome}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                No patients are currently admitted in beds. You can admit a patient using the "Inpatient Bed Allocation" tab above.
              </div>
            )}

            {dischargePatientId && (
              <form onSubmit={handleExecuteDischarge} className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-4 mt-4">
                <h4 className="font-heading font-extrabold text-purple-950 text-sm">
                  Settlement Details for Selected Patient
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Medicine Charges (₹)</label>
                    <input
                      type="number"
                      value={dischargeForm.medicineCharges}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, medicineCharges: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Discount (₹)</label>
                    <input
                      type="number"
                      value={dischargeForm.discount}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, discount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={dischargeForm.paymentMethod}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, paymentMethod: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                    >
                      <option value="UPI">UPI / Digital</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Debit / Credit Card</option>
                      <option value="Insurance">TPA Insurance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discharge Summary & Prescription</label>
                  <textarea
                    rows={2}
                    value={dischargeForm.dischargeSummary}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeSummary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] font-mono text-purple-800">
                    Executes: <strong>INSERT INTO bills</strong> + <strong>UPDATE patients</strong> + <strong>UPDATE beds</strong>
                  </div>
                  <button
                    type="submit"
                    disabled={isDischarging}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-600/25 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isDischarging ? 'Executing 3-in-1 Transaction...' : 'Discharge Patient & Release Bed (3-in-1)'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE DISCHARGE SLIP MODAL */}
      {printableDischargeSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                Official Hospital Clearance Certificate
              </span>
              <button
                onClick={() => setPrintableDischargeSlip(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-4 text-xs font-sans">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="font-heading font-extrabold text-slate-900 text-lg">NEXUS CARE HOSPITAL</h3>
                <p className="text-[11px] text-slate-500">Tertiary Healthcare, Research & Inpatient Center • Mumbai</p>
                <p className="text-[10px] font-bold text-teal-700 font-mono mt-0.5">DISCHARGE SUMMARY & BILL CLEARANCE</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><strong>Patient Name:</strong> {printableDischargeSlip.name}</div>
                <div><strong>Patient ID:</strong> {printableDischargeSlip.id}</div>
                <div><strong>Age / Gender:</strong> {printableDischargeSlip.age} yrs / {printableDischargeSlip.gender}</div>
                <div><strong>Blood Group:</strong> {printableDischargeSlip.bloodGroup || 'O+'}</div>
                <div><strong>Admitted Date:</strong> {printableDischargeSlip.admittedDate || 'Prior'}</div>
                <div><strong>Discharged Date:</strong> {printableDischargeSlip.dischargedDate || new Date().toISOString().split('T')[0]}</div>
                <div><strong>Bed / Ward:</strong> {printableDischargeSlip.bedNumber || 'Inpatient Bed'} (Released)</div>
                <div><strong>Total Settlement:</strong> ₹{printableDischargeSlip.totalBilledAmount ? printableDischargeSlip.totalBilledAmount.toLocaleString('en-IN') : 'Settled'} (PAID)</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px]">
                <strong className="text-purple-800 block mb-0.5">Clinical Discharge Summary:</strong>
                <p className="text-slate-600 leading-relaxed italic">
                  "{printableDischargeSlip.dischargeSummary || 'Patient treated successfully and cleared for discharge. Advised complete recovery rest and oral prescriptions.'}"
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPrintableDischargeSlip(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
