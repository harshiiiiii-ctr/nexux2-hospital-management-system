import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Stethoscope, 
  Receipt, 
  Filter, 
  AlertCircle,
  X,
  Sparkles,
  Phone,
  User,
  Activity
} from 'lucide-react';
import { Appointment, Doctor, Patient, AppointmentStatus, Syndrome, SYNDROME_SPECIALIST_MAP } from '../../types';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { DOCTOR_AVATARS } from '../../assets/images';

interface AppointmentsPageProps {
  appointments: Appointment[];
  doctors: Doctor[];
  patients: Patient[];
  onDataChanged: () => void;
  onNavigateToBilling?: (appointmentId: string) => void;
  initialDoctorConsultationApp?: Appointment | null;
  onClearInitialConsultation?: () => void;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({
  appointments,
  doctors,
  patients,
  onDataChanged,
  onNavigateToBilling,
  initialDoctorConsultationApp,
  onClearInitialConsultation
}) => {
  const { user, doctor: currentAuthDoctor } = useAuth();
  const { success, error } = useToast();
  const isDoctor = user?.role === 'doctor';
  const myDoctorId = user?.doctorId;

  // Filter States
  const [filterDateMode, setFilterDateMode] = useState<'All' | 'Today' | 'Upcoming'>('All');
  const [doctorViewScope, setDoctorViewScope] = useState<'mine' | 'all'>('mine');
  const [filterDoctorId, setFilterDoctorId] = useState<string>(
    isDoctor && myDoctorId ? myDoctorId : 'All'
  );
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterSpecialization, setFilterSpecialization] = useState<string>('All');
  const [search, setSearch] = useState('');

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [consultingAppointment, setConsultingAppointment] = useState<Appointment | null>(
    initialDoctorConsultationApp || null
  );

  // Consultation Form state
  const [diseaseName, setDiseaseName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [consultationStatus, setConsultationStatus] = useState<AppointmentStatus>('Completed');
  const [isSavingConsultation, setIsSavingConsultation] = useState(false);

  // Medical History Search State (Doctor Option: Check Medical History SQL SELECT)
  const [historyTargetPatient, setHistoryTargetPatient] = useState<Patient | null>(null);
  const [isHistorySearchModalOpen, setIsHistorySearchModalOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // New Booking State
  const [bookPatientId, setBookPatientId] = useState('');
  const [bookSyndrome, setBookSyndrome] = useState<Syndrome>('Fever');
  const [bookDoctorId, setBookDoctorId] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookTime, setBookTime] = useState('10:00');
  const [bookNotes, setBookNotes] = useState('');
  const [bookErrors, setBookErrors] = useState<Record<string, string>>({});
  const [isBooking, setIsBooking] = useState(false);

  const handlePatientSelectChange = (patId: string) => {
    setBookPatientId(patId);
    const pat = patients.find(p => p.id === patId);
    if (pat) {
      setBookSyndrome(pat.syndrome);
      const rec = SYNDROME_SPECIALIST_MAP[pat.syndrome];
      const matchDoc = doctors.find(d => d.specialization === rec.primarySpecialty);
      if (matchDoc) {
        setBookDoctorId(matchDoc.id);
      }
    }
  };

  const handleOpenConsultation = (app: Appointment) => {
    setConsultingAppointment(app);
    setDiseaseName(app.diseaseName || '');
    setDiagnosis(app.diagnosis || '');
    setPrescription(app.prescription || '');
    setConsultationNotes(app.notes || '');
    setConsultationStatus(app.status === 'Scheduled' ? 'Completed' : app.status);
  };

  const handleOpenMedicalHistory = (patientId: string) => {
    const pat = patients.find(p => p.id === patientId);
    if (pat) {
      setHistoryTargetPatient(pat);
    } else {
      error(`Patient ID ${patientId} not found`);
    }
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultingAppointment) return;

    setIsSavingConsultation(true);
    try {
      await api.updateAppointment(consultingAppointment.id, {
        status: consultationStatus,
        diseaseName: diseaseName.trim(),
        diagnosis: diagnosis.trim(),
        prescription: prescription.trim(),
        notes: consultationNotes.trim()
      });

      success(`SQL UPDATE executed: Record saved! Attached notes, disease '${diseaseName.trim() || 'Clinical'}', and prescribed medicines.`);
      setConsultingAppointment(null);
      if (onClearInitialConsultation) onClearInitialConsultation();
      onDataChanged();
    } catch (err: any) {
      error(err.message || 'Failed to update appointment');
    } finally {
      setIsSavingConsultation(false);
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!bookPatientId) err.patient = 'Please select a patient';
    if (!bookDoctorId) err.doctor = 'Please select a doctor';
    if (!bookDate) err.date = 'Date is required';
    if (!bookTime) err.time = 'Time is required';

    if (Object.keys(err).length > 0) {
      setBookErrors(err);
      return;
    }

    setIsBooking(true);
    try {
      await api.createAppointment({
        patientId: bookPatientId,
        doctorId: bookDoctorId,
        date: bookDate,
        time: bookTime,
        status: 'Scheduled',
        syndrome: bookSyndrome,
        notes: bookNotes.trim()
      });

      success('Appointment successfully scheduled!');
      setIsBookModalOpen(false);
      setBookNotes('');
      setBookPatientId('');
      onDataChanged();
    } catch (err: any) {
      error(err.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const handleQuickStatusChange = async (appId: string, status: AppointmentStatus) => {
    try {
      await api.updateAppointment(appId, { status });
      success(`Appointment marked as ${status}`);
      onDataChanged();
    } catch (err: any) {
      error('Failed to update status');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter((app) => {
    const pat = patients.find(p => p.id === app.patientId);
    const doc = doctors.find(d => d.id === app.doctorId);

    if (isDoctor && myDoctorId && doctorViewScope === 'mine' && app.doctorId !== myDoctorId) {
      return false;
    }

    if (!isDoctor && filterDoctorId !== 'All' && app.doctorId !== filterDoctorId) {
      return false;
    }

    if (filterSpecialization !== 'All' && doc?.specialization !== filterSpecialization) {
      return false;
    }

    if (filterStatus !== 'All' && app.status !== filterStatus) {
      return false;
    }

    if (filterDateMode === 'Today' && app.date !== todayStr) {
      return false;
    }
    if (filterDateMode === 'Upcoming' && app.date < todayStr) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchPat = pat?.name.toLowerCase().includes(q) || pat?.phone.includes(q);
      const matchDoc = doc?.name.toLowerCase().includes(q);
      const matchSyndrome = app.syndrome?.toLowerCase().includes(q);
      if (!matchPat && !matchDoc && !matchSyndrome) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isDoctor ? 'My Clinical Appointments & OPD Queue' : 'Nexus Care Appointments Master'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isDoctor
              ? `Consultation schedule for ${currentAuthDoctor?.name || 'Doctor'} (${currentAuthDoctor?.specialization || 'Clinical'}) • OPD ${currentAuthDoctor?.roomNumber || '101'}`
              : `View, schedule, and coordinate outpatient appointments (${appointments.length} total)`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDoctor && (
            <div className="p-1 bg-slate-100 rounded-2xl flex items-center">
              <button
                onClick={() => setDoctorViewScope('mine')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  doctorViewScope === 'mine'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Consultations ({appointments.filter(a => a.doctorId === myDoctorId).length})
              </button>
              <button
                onClick={() => setDoctorViewScope('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  doctorViewScope === 'all'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Hospital ({appointments.length})
              </button>
            </div>
          )}

          {/* Doctor Option: Check Medical History (SQL SELECT) */}
          <button
            onClick={() => setIsHistorySearchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white text-teal-900 border border-teal-300 hover:bg-teal-50 transition-all cursor-pointer shadow-2xs"
            title="Search past diagnoses and medical records for any Patient ID (SELECT)"
          >
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Check Medical History (SQL SELECT)</span>
          </button>

          <button
            onClick={() => {
              setIsBookModalOpen(true);
              setBookErrors({});
              if (patients.length > 0 && !bookPatientId) {
                handlePatientSelectChange(patients[0].id);
              }
              if (isDoctor && myDoctorId) {
                setBookDoctorId(myDoctorId);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white shadow-md shadow-teal-700/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isDoctor ? 'Add Walk-in Consultation' : 'Book Appointment'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, physician, or syndrome..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            {(['All', 'Today', 'Upcoming'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterDateMode(mode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterDateMode === mode
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'Today' ? "Today's Schedule" : mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {!isDoctor && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600">Doctor:</span>
              <select
                value={filterDoctorId}
                onChange={(e) => setFilterDoctorId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none max-w-[180px] font-medium"
              >
                <option value="All">All Doctors</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">Specialty:</span>
            <select
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none font-medium"
            >
              <option value="All">All Specializations</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Orthopedic">Orthopedic</option>
              <option value="General Physician">General Physician</option>
              <option value="Neurologist">Neurologist</option>
              <option value="Pediatrician">Pediatrician</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments Table with Doctor Portraits */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Patient Information</th>
                <th className="py-3 px-4">Syndrome</th>
                <th className="py-3 px-4">Consultant Doctor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Diagnosis / Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => {
                  const pat = patients.find(p => p.id === app.patientId);
                  const doc = doctors.find(d => d.id === app.doctorId);
                  const isCompleted = app.status === 'Completed';
                  const docAvatar = doc?.avatar || DOCTOR_AVATARS[doc?.id || ''] || DOCTOR_AVATARS.default;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{app.date}</div>
                        <div className="text-[11px] text-teal-700 font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{app.time} HRS</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{pat?.name || 'Patient'}</div>
                        <div className="text-[11px] text-slate-500">
                          {pat?.gender}, {pat?.age} yrs • {pat?.phone}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {app.syndrome}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={docAvatar} 
                            alt={doc?.name} 
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-800">{doc?.name || 'Doctor'}</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {doc?.specialization} • {doc?.roomNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            app.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-cyan-100 text-cyan-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              app.status === 'Completed'
                                ? 'bg-emerald-500'
                                : app.status === 'Cancelled'
                                ? 'bg-rose-500'
                                : 'bg-cyan-500'
                            }`}
                          />
                          {app.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[220px]">
                        {app.diagnosis ? (
                          <div className="text-xs font-semibold text-slate-800 truncate" title={app.diagnosis}>
                            <strong className="text-teal-700">Dx:</strong> {app.diagnosis}
                          </div>
                        ) : app.notes ? (
                          <div className="text-[11px] text-slate-500 truncate" title={app.notes}>
                            {app.notes}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs italic">No clinical notes</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenConsultation(app)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer flex items-center gap-1"
                            title="Open Clinical Consultation Notes"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>{isDoctor ? 'Consult / Prescribe' : 'Details'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenMedicalHistory(app.patientId)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            title="Check Patient Medical History (SQL SELECT)"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {app.status === 'Scheduled' && (
                            <button
                              onClick={() => handleQuickStatusChange(app.id, 'Cancelled')}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Cancel Appointment"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {isCompleted && onNavigateToBilling && (
                            <button
                              onClick={() => onNavigateToBilling(app.id)}
                              className="p-1.5 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                              title="Generate Bill / View Invoice"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2.5 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="font-heading font-bold text-slate-800 text-sm">
                        No consultations found for active filter
                      </div>
                      <p className="text-xs text-slate-500">
                        {isDoctor && doctorViewScope === 'mine'
                          ? "You have no appointments under this filter. Switch to 'All Hospital' or click 'All' dates to see full clinic schedule."
                          : "Try resetting date filters or clearing search text to view appointments."}
                      </p>
                      <button
                        onClick={() => {
                          setFilterDateMode('All');
                          setFilterStatus('All');
                          setFilterDoctorId('All');
                          setFilterSpecialization('All');
                          setSearch('');
                          if (isDoctor) setDoctorViewScope('all');
                        }}
                        className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Show All Appointments ({appointments.length})</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctor Consultation & Prescription Modal */}
      {consultingAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                    Clinical Consultation & Electronic Prescription Desk
                  </h3>
                  <p className="text-xs text-slate-500">
                    Appointment: {consultingAppointment.date} at {consultingAppointment.time} HRS
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setConsultingAppointment(null);
                  if (onClearInitialConsultation) onClearInitialConsultation();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Header Summary */}
            {(() => {
              const pat = patients.find(p => p.id === consultingAppointment.patientId);
              const doc = doctors.find(d => d.id === consultingAppointment.doctorId);
              const docAvatar = doc?.avatar || DOCTOR_AVATARS[doc?.id || ''] || DOCTOR_AVATARS.default;
              return (
                <div className="mb-5 p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Patient</span>
                    <div className="font-bold text-slate-900 text-sm">{pat?.name}</div>
                    <div className="text-slate-500">{pat?.gender}, {pat?.age} yrs</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Syndrome</span>
                    <div className="font-bold text-teal-800 text-sm">{consultingAppointment.syndrome}</div>
                    <div className="text-slate-500 font-mono">{pat?.phone}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Consultant</span>
                    <div className="font-bold text-slate-900">{doc?.name}</div>
                    <div className="text-slate-500">{doc?.specialization}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Consult Fee</span>
                    <div className="font-bold text-slate-900">₹{doc?.consultationFee}</div>
                    <div className="text-slate-500">{doc?.roomNumber}</div>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleSaveConsultation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Appointment Status *
                  </label>
                  <select
                    value={consultationStatus}
                    onChange={(e) => setConsultationStatus(e.target.value as AppointmentStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-bold"
                  >
                    <option value="Completed">Mark as Completed</option>
                    <option value="Scheduled">Keep as Scheduled</option>
                    <option value="Cancelled">Mark as Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Disease Name *
                  </label>
                  <input
                    type="text"
                    value={diseaseName}
                    onChange={(e) => setDiseaseName(e.target.value)}
                    placeholder="e.g. Viral Pyrexia / Angina"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-teal-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Clinical Diagnosis
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Bronchitis / Sinusitis"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Physician's Prescription & Dosage (Rx) *
                </label>
                <textarea
                  rows={4}
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="1. Tab Paracetamol 650mg - 1 TDS after meals&#10;2. Tab Cetirizine 10mg - 1 at bedtime&#10;3. Cough syrup 5ml thrice daily&#10;Advised warm saline gargle."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Clinical Notes / Follow-up Instructions
                </label>
                <textarea
                  rows={2}
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="e.g. Advised complete rest for 3 days. Review after 5 days if fever persists."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* SQL Query Preview for College Project */}
              <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px]">
                <span className="text-slate-400 font-sans block text-[9px] uppercase font-bold">SQL Query Executed on Save Record:</span>
                <code>UPDATE appointments SET status='{consultationStatus}', disease_name='{diseaseName || '<DISEASE>'}', diagnosis='{diagnosis || '<DIAGNOSIS>'}', prescription='{prescription ? prescription.slice(0, 30) + '...' : '<RX>'}', notes='{consultationNotes || '<NOTES>'}' WHERE id='{consultingAppointment.id}';</code>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {consultationStatus === 'Completed' && onNavigateToBilling && (
                  <button
                    type="button"
                    onClick={() => {
                      const appId = consultingAppointment.id;
                      setConsultingAppointment(null);
                      onNavigateToBilling(appId);
                    }}
                    className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Proceed to Generate Invoice</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setConsultingAppointment(null);
                      if (onClearInitialConsultation) onClearInitialConsultation();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingConsultation}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSavingConsultation ? 'Saving...' : 'Save Record (SQL UPDATE Query)'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                Schedule Patient Appointment
              </h3>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Select Patient *
                </label>
                <select
                  value={bookPatientId}
                  onChange={(e) => handlePatientSelectChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender}, {p.age} yrs - {p.syndrome})
                    </option>
                  ))}
                </select>
                {bookErrors.patient && <p className="text-[11px] text-rose-600 mt-1">{bookErrors.patient}</p>}
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-teal-950">Current Syndrome: {bookSyndrome}</span>
                  <span className="font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                    Recommend: {SYNDROME_SPECIALIST_MAP[bookSyndrome]?.primarySpecialty}
                  </span>
                </div>
                <p className="text-[11px] text-teal-800 font-medium">
                  {SYNDROME_SPECIALIST_MAP[bookSyndrome]?.recommendationReason}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Select Consultant Doctor *
                </label>
                <select
                  value={bookDoctorId}
                  onChange={(e) => setBookDoctorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization} • Fee: ₹{d.consultationFee} • {d.availabilityStatus})
                    </option>
                  ))}
                </select>
                {bookErrors.doctor && <p className="text-[11px] text-rose-600 mt-1">{bookErrors.doctor}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  {bookErrors.date && <p className="text-[11px] text-rose-600 mt-1">{bookErrors.date}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Time Slot *
                  </label>
                  <select
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t} HRS</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="e.g. Chief complaint and duration"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBooking}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-70 cursor-pointer"
                >
                  {isBooking ? 'Booking...' : 'Confirm Appointment (SQL INSERT)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCTOR OPTION: Search Patient Medical History Modal (SQL SELECT Query) */}
      {isHistorySearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-base">
                    Check Patient Medical History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fetch past diagnoses, visits & prescriptions (SQL SELECT)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistorySearchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter Patient ID or Search Name:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="e.g. pat-1, Ramesh, Sunita..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* List of matching patients */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {patients
                .filter(p => 
                  p.id.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                  p.name.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                  p.phone.includes(historySearchQuery)
                )
                .slice(0, 5)
                .map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setIsHistorySearchModalOpen(false);
                      setHistoryTargetPatient(p);
                    }}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50/80 hover:border-teal-300 transition-all cursor-pointer text-xs"
                  >
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{p.name}</span>
                      <span className="font-mono text-teal-700">{p.id}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {p.gender}, {p.age} yrs • {p.syndrome} • Blood: {p.bloodGroup || 'O+'}
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px]">
              <span className="text-slate-400 font-sans block text-[9px] uppercase font-bold">SQL SELECT Statement:</span>
              <code>SELECT * FROM appointments a JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = '{historySearchQuery || '<PATIENT_ID>'}' ORDER BY a.date DESC;</code>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsHistorySearchModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR OPTION: Patient Medical History Audit Modal */}
      {historyTargetPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                  Patient Medical Background (SQL SELECT)
                </span>
                <h3 className="font-heading font-extrabold text-slate-900 text-lg mt-1">
                  Electronic Medical History: {historyTargetPatient.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Patient ID: {historyTargetPatient.id} • {historyTargetPatient.gender}, {historyTargetPatient.age} yrs • Blood Group: {historyTargetPatient.bloodGroup || 'O+'}
                </p>
              </div>
              <button
                onClick={() => setHistoryTargetPatient(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of past appointments / diagnoses */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {(() => {
                const pastVisits = appointments.filter(a => a.patientId === historyTargetPatient.id);
                if (pastVisits.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No previous clinical consultation records found for {historyTargetPatient.name}.
                    </div>
                  );
                }

                return pastVisits.map(visit => {
                  const doc = doctors.find(d => d.id === visit.doctorId);
                  return (
                    <div key={visit.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          Visit Date: {visit.date} at {visit.time} HRS
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          visit.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
                        }`}>
                          {visit.status}
                        </span>
                      </div>

                      <div className="text-slate-700">
                        <strong>Attending Doctor:</strong> Dr. {doc?.name || 'Specialist'} ({doc?.specialization})
                      </div>

                      {(visit.diseaseName || visit.syndrome) && (
                        <div className="p-2 rounded-xl bg-white border border-slate-200">
                          <strong className="text-teal-800">Confirmed Disease / Chief Complaint:</strong>{' '}
                          {visit.diseaseName || visit.syndrome}
                        </div>
                      )}

                      {visit.diagnosis && (
                        <div className="p-2 rounded-xl bg-white border border-slate-200">
                          <strong className="text-teal-800">Clinical Diagnosis:</strong> {visit.diagnosis}
                        </div>
                      )}

                      {visit.prescription && (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px] whitespace-pre-line text-emerald-950">
                          <strong className="text-emerald-800 font-sans font-bold">Prescription (Rx):</strong>
                          <br />
                          {visit.prescription}
                        </div>
                      )}

                      {visit.notes && (
                        <div className="text-[11px] text-slate-500 italic">
                          Doctor Notes: {visit.notes}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-slate-500">
                SQL SELECT executed across appointments & doctors tables
              </span>
              <button
                onClick={() => setHistoryTargetPatient(null)}
                className="px-4 py-2 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
