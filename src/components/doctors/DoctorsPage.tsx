import React, { useState } from 'react';
import { 
  Stethoscope, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  IndianRupee, 
  Award, 
  Clock, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  Building,
  RotateCcw,
  Calendar,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Coffee,
  LogOut,
  Printer,
  Users,
  ChevronRight,
  FileText
} from 'lucide-react';
import { Doctor, Specialization, AvailabilityStatus } from '../../types';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { DOCTOR_AVATARS } from '../../assets/images';

interface DoctorsPageProps {
  doctors: Doctor[];
  onDataChanged: () => void;
  onBookAppointmentWithDoctor?: (doctor: Doctor) => void;
  onNavigateToStaff?: (tab: 'doctors' | 'receptionists' | 'timing' | 'exits') => void;
}

const SPECIALIZATIONS: Specialization[] = [
  'Cardiologist',
  'Dermatologist',
  'Orthopedic',
  'General Physician',
  'Neurologist',
  'Pediatrician'
];

export const DoctorsPage: React.FC<DoctorsPageProps> = ({ 
  doctors, 
  onDataChanged,
  onBookAppointmentWithDoctor,
  onNavigateToStaff
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [filterSpec, setFilterSpec] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);

  // Admin Leaving Hospital & Timing Modals
  const [resignationModalDoctor, setResignationModalDoctor] = useState<Doctor | null>(null);
  const [relievingLetterDoctor, setRelievingLetterDoctor] = useState<Doctor | null>(null);
  const [timingModalDoctor, setTimingModalDoctor] = useState<Doctor | null>(null);

  // Resignation Form State
  const [resignationForm, setResignationForm] = useState({
    relievedDate: new Date().toISOString().split('T')[0],
    resignationReason: 'Relocating to another city',
    customNotes: ''
  });

  // Timing Form State
  const [timingForm, setTimingForm] = useState({
    shiftTiming: '09:00 - 17:00',
    breakTiming: '13:00 - 14:00 (Lunch Break)'
  });

  // Doctor Form State
  const [formData, setFormData] = useState({
    name: '',
    specialization: 'Cardiologist' as Specialization,
    phone: '',
    email: '',
    consultationFee: 600,
    availabilityStatus: 'Available' as AvailabilityStatus,
    qualifications: 'MBBS, MD',
    experienceYears: 10,
    roomNumber: 'OPD-101',
    shiftTiming: '09:00 - 17:00',
    breakTiming: '13:00 - 14:00 (Lunch Break)',
    avatar: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredDoctors = (doctors || []).filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(search.toLowerCase()) ||
      doc.email.toLowerCase().includes(search.toLowerCase()) ||
      doc.roomNumber.toLowerCase().includes(search.toLowerCase());

    const matchesSpec = filterSpec === 'All' || doc.specialization === filterSpec;
    const matchesStatus = filterStatus === 'All' || doc.availabilityStatus === filterStatus;
    return matchesSearch && matchesSpec && matchesStatus;
  });

  const availableCount = (doctors || []).filter(d => d.availabilityStatus === 'Available').length;
  const inConsultCount = (doctors || []).filter(d => d.availabilityStatus === 'In Consultation').length;
  const onBreakCount = (doctors || []).filter(d => d.availabilityStatus === 'On Break').length;
  const onLeaveCount = (doctors || []).filter(d => d.availabilityStatus === 'On Leave').length;
  const relievedCount = (doctors || []).filter(d => d.availabilityStatus === 'Resigned / Relieved').length;

  const validateForm = () => {
    const err: Record<string, string> = {};
    if (!formData.name.trim()) err.name = 'Doctor name is required';
    if (!formData.phone.trim()) err.phone = 'Phone number is required';
    if (!formData.email.trim() || !formData.email.includes('@')) err.email = 'Valid email required';
    if (!formData.consultationFee || formData.consultationFee <= 0) err.fee = 'Fee must be greater than 0';

    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      specialization: 'Cardiologist',
      phone: '',
      email: '',
      consultationFee: 600,
      availabilityStatus: 'Available',
      qualifications: 'MBBS, MD',
      experienceYears: 10,
      roomNumber: `OPD-${101 + (doctors?.length || 0)}`,
      shiftTiming: '09:00 - 17:00',
      breakTiming: '13:00 - 14:00 (Lunch Break)',
      avatar: DOCTOR_AVATARS.default
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormData({
      name: doc.name,
      specialization: doc.specialization,
      phone: doc.phone,
      email: doc.email,
      consultationFee: doc.consultationFee,
      availabilityStatus: doc.availabilityStatus,
      qualifications: doc.qualifications,
      experienceYears: doc.experienceYears,
      roomNumber: doc.roomNumber,
      shiftTiming: doc.shiftTiming || '09:00 - 17:00',
      breakTiming: doc.breakTiming || '13:00 - 14:00 (Lunch Break)',
      avatar: doc.avatar || DOCTOR_AVATARS[doc.id] || DOCTOR_AVATARS.default
    });
    setFormErrors({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const avatarToSave = formData.avatar.trim() || DOCTOR_AVATARS[editingDoctor?.id || ''] || DOCTOR_AVATARS.default;
      if (editingDoctor) {
        await api.updateDoctor(editingDoctor.id, {
          name: formData.name.trim(),
          specialization: formData.specialization,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          consultationFee: Number(formData.consultationFee),
          availabilityStatus: formData.availabilityStatus,
          qualifications: formData.qualifications.trim(),
          experienceYears: Number(formData.experienceYears),
          roomNumber: formData.roomNumber.trim(),
          shiftTiming: formData.shiftTiming.trim() || '09:00 - 17:00',
          breakTiming: formData.breakTiming.trim() || '13:00 - 14:00 (Lunch Break)',
          avatar: avatarToSave
        });
        success(`Doctor ${formData.name} profile updated successfully`);
        setEditingDoctor(null);
      } else {
        await api.createDoctor({
          name: formData.name.trim(),
          specialization: formData.specialization,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          consultationFee: Number(formData.consultationFee),
          availabilityStatus: 'Available',
          qualifications: formData.qualifications.trim() || 'MBBS, MD',
          experienceYears: Number(formData.experienceYears) || 5,
          roomNumber: formData.roomNumber.trim() || 'OPD-107',
          shiftTiming: formData.shiftTiming.trim() || '09:00 - 17:00',
          breakTiming: formData.breakTiming.trim() || '13:00 - 14:00 (Lunch Break)',
          avatar: avatarToSave
        });
        success(`Doctor ${formData.name} added to Nexus Care roster`);
        setIsAddModalOpen(false);
      }
      onDataChanged();
    } catch (err: any) {
      error(err.message || 'Failed to save doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusToggle = async (doc: Doctor, newStatus: AvailabilityStatus) => {
    try {
      await api.updateDoctor(doc.id, { availabilityStatus: newStatus });
      success(`${doc.name} marked as ${newStatus}`);
      onDataChanged();
    } catch (err: any) {
      error('Failed to update status');
    }
  };

  // Quick Break Toggle for Doctors
  const handleQuickBreakToggle = async (doc: Doctor) => {
    try {
      const newStatus: AvailabilityStatus = doc.availabilityStatus === 'On Break' ? 'Available' : 'On Break';
      await api.updateDoctor(doc.id, { availabilityStatus: newStatus });
      success(`${doc.name} ${newStatus === 'On Break' ? 'sent on break interval' : 'resumed OPD consultations'}`);
      onDataChanged();
    } catch (err: any) {
      error('Failed to toggle break status');
    }
  };

  // Shift & Break Timing update handler
  const handleSaveTiming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timingModalDoctor) return;
    setIsSubmitting(true);
    try {
      await api.updateDoctor(timingModalDoctor.id, {
        shiftTiming: timingForm.shiftTiming.trim(),
        breakTiming: timingForm.breakTiming.trim()
      });
      success(`Updated shift & break timings for ${timingModalDoctor.name}`);
      setTimingModalDoctor(null);
      onDataChanged();
    } catch (err: any) {
      error('Failed to update doctor timings');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resignation / Leaving Hospital handler
  const handleProcessResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resignationModalDoctor) return;
    setIsSubmitting(true);
    try {
      const fullReason = `${resignationForm.resignationReason}${resignationForm.customNotes ? ` - ${resignationForm.customNotes}` : ''}`;
      await api.updateDoctor(resignationModalDoctor.id, {
        availabilityStatus: 'Resigned / Relieved',
        relievedDate: resignationForm.relievedDate,
        resignationReason: fullReason
      });
      success(`${resignationModalDoctor.name} marked as Relieved / Left Hospital.`);
      const resignedDoc = { 
        ...resignationModalDoctor, 
        availabilityStatus: 'Resigned / Relieved' as AvailabilityStatus,
        relievedDate: resignationForm.relievedDate,
        resignationReason: fullReason
      };
      setResignationModalDoctor(null);
      onDataChanged();
      // Show relieving letter modal so admin can print it
      setRelievingLetterDoctor(resignedDoc);
    } catch (err: any) {
      error(err.message || 'Failed to process hospital exit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reactivate / Rejoin Hospital
  const handleReactivateDoctor = async (doc: Doctor) => {
    try {
      await api.updateDoctor(doc.id, {
        availabilityStatus: 'Available',
        relievedDate: undefined,
        resignationReason: undefined
      });
      success(`${doc.name} restored to active hospital duty roster`);
      onDataChanged();
    } catch (err: any) {
      error('Failed to reactivate doctor');
    }
  };

  const handleDelete = async () => {
    if (!deletingDoctor) return;
    try {
      await api.deleteDoctor(deletingDoctor.id);
      success(`${deletingDoctor.name} removed from roster`);
      setDeletingDoctor(null);
      onDataChanged();
    } catch (err: any) {
      error(err.message || 'Failed to delete doctor');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterSpec('All');
    setFilterStatus('All');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Doctor Section & Medical Faculty
            </span>
            <span className="text-xs font-bold text-slate-500">
              National Medical Commission (NMC) Certified
            </span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Nexus Care Specialist Medical Faculty & Doctors
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Administer Doctors & Receptionists: configure shift hours, break intervals, or process hospital departures ({(doctors || []).length} registered physicians)
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white shadow-md shadow-teal-700/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Specialist Doctor</span>
            </button>

            {onNavigateToStaff && (
              <button
                onClick={() => onNavigateToStaff('receptionists')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white text-teal-800 hover:bg-teal-50 border border-teal-200/90 shadow-2xs cursor-pointer"
                title="Manage Front-Desk Receptionists"
              >
                <Users className="w-4 h-4 text-teal-600" />
                <span>Manage Receptionists</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Admin Operations Banner for Clear Visibility */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50/70 to-teal-50 rounded-2xl p-4 border border-teal-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-teal-950 flex items-center gap-1.5">
                <span>Admin HR Controls Active</span>
                <span className="text-[10px] bg-teal-200/70 text-teal-900 px-2 py-0.2 rounded-full font-bold">
                  Doctor & Staff Management
                </span>
              </div>
              <p className="text-[11px] text-teal-800/90 mt-0.5">
                Every doctor card below features 1-click <strong>"Start Break / Resume OPD"</strong>, <strong>"Shift & Break Timings"</strong>, and <strong>"Leaving Hospital"</strong> to handle resignations with official relieving certificates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToStaff && (
              <>
                <button
                  onClick={() => onNavigateToStaff('receptionists')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-teal-800 hover:bg-teal-100/60 border border-teal-300/80 cursor-pointer flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5 text-teal-600" />
                  <span>Receptionists Roster</span>
                </button>
                <button
                  onClick={() => onNavigateToStaff('timing')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-amber-800 hover:bg-amber-50 border border-amber-300/80 cursor-pointer flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Shift & Break Board</span>
                </button>
                <button
                  onClick={() => onNavigateToStaff('exits')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-rose-800 hover:bg-rose-50 border border-rose-300/80 cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Exits Archive ({relievedCount})</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-black text-slate-900 text-lg">{(doctors || []).length}</div>
            <div className="text-[11px] text-slate-500 font-semibold">Total Specialists</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-black text-emerald-700 text-lg">{availableCount}</div>
            <div className="text-[11px] text-slate-500 font-semibold">Available on Duty</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-black text-amber-700 text-lg">{onBreakCount}</div>
            <div className="text-[11px] text-slate-500 font-semibold">On Break</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-black text-purple-700 text-lg">{inConsultCount}</div>
            <div className="text-[11px] text-slate-500 font-semibold">In Consultation</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-black text-rose-800 text-lg">{relievedCount}</div>
            <div className="text-[11px] text-slate-500 font-semibold">Relieved / Resigned</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by physician name, specialty, chamber, or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 shrink-0">Department:</span>
            <select
              value={filterSpec}
              onChange={(e) => setFilterSpec(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="All">All Departments (6)</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 shrink-0">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="In Consultation">In Consultation</option>
              <option value="On Break">On Break</option>
              <option value="On Leave">On Leave</option>
              <option value="Resigned / Relieved">Resigned / Relieved</option>
            </select>
          </div>

          {(search || filterSpec !== 'All' || filterStatus !== 'All') && (
            <button
              onClick={handleResetFilters}
              className="p-2 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Doctors Grid with Real Photos & Luminous Theme */}
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => {
            const isAvailable = doc.availabilityStatus === 'Available';
            const isInConsultation = doc.availabilityStatus === 'In Consultation';
            const isOnBreak = doc.availabilityStatus === 'On Break';
            const isRelieved = doc.availabilityStatus === 'Resigned / Relieved';
            const avatarUrl = doc.avatar || DOCTOR_AVATARS[doc.id] || DOCTOR_AVATARS.default;

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between group relative overflow-hidden shadow-xs ${
                  isRelieved
                    ? 'border-slate-200/60 bg-slate-50/50 opacity-85'
                    : isOnBreak
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200/90 hover:border-teal-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Doctor Portrait & Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={avatarUrl}
                          alt={doc.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-500/30 shadow-xs group-hover:scale-105 transition-transform"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white ${
                            isRelieved
                              ? 'bg-rose-500'
                              : isAvailable
                              ? 'bg-emerald-500'
                              : isOnBreak
                              ? 'bg-amber-500'
                              : isInConsultation
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-heading font-extrabold text-slate-900 text-base leading-tight group-hover:text-teal-900 transition-colors">
                          {doc.name}
                        </h3>
                        <p className="text-xs font-bold text-teal-700 mt-0.5">
                          {doc.specialization}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isRelieved
                          ? 'bg-rose-100 text-rose-800'
                          : isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : isOnBreak
                          ? 'bg-amber-100 text-amber-800'
                          : isInConsultation
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {doc.availabilityStatus}
                    </span>
                  </div>

                  {/* Resignation Notice Banner if Relieved */}
                  {isRelieved && (
                    <div className="mt-3.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1 text-rose-900">
                      <div className="font-bold flex items-center gap-1.5 text-rose-800">
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Resigned / Relieved from Hospital</span>
                      </div>
                      <p className="text-[11px] text-rose-800">
                        <strong>Reason:</strong> {doc.resignationReason || 'Resigned'}
                      </p>
                      {doc.relievedDate && (
                        <div className="text-[10px] text-rose-700">Relieved Effective: {doc.relievedDate}</div>
                      )}
                    </div>
                  )}

                  {/* Details */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{doc.qualifications}</span>
                      <span className="text-slate-400">• {doc.experienceYears} yrs experience</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>OPD Chamber: <strong className="text-slate-800">{doc.roomNumber}</strong></span>
                    </div>

                    {/* Shift & Break Timings Card */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> Shift Hours:
                        </span>
                        <strong className="text-slate-800 font-mono">{doc.shiftTiming || '09:00 - 17:00'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Coffee className="w-3.5 h-3.5 text-amber-500" /> Break Interval:
                        </span>
                        <strong className="text-amber-800">{doc.breakTiming || '13:00 - 14:00 (Lunch)'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-mono">{doc.phone}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.email}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Fee, Duty Selector, and Admin Operations */}
                <div className="mt-5 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Consultation Fee</div>
                      <div className="font-heading text-lg font-black text-slate-900">
                        ₹{doc.consultationFee}
                      </div>
                    </div>

                    {/* Duty toggle */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={doc.availabilityStatus}
                        onChange={(e) => handleQuickStatusToggle(doc, e.target.value as AvailabilityStatus)}
                        className="text-[11px] font-bold py-1 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer hover:bg-slate-100"
                        title="Change Doctor Availability"
                      >
                        <option value="Available">Available</option>
                        <option value="In Consultation">In Consultation</option>
                        <option value="On Break">On Break</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Resigned / Relieved">Resigned / Relieved</option>
                      </select>

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(doc)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                            title="Edit Doctor Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingDoctor(doc)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete Doctor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ADMIN ACTION STRIP: Break Toggle, Timings, and When Doctor Wants to Leave */}
                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-100">
                      {!isRelieved ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {/* Quick Break Toggle Button */}
                            <button
                              onClick={() => handleQuickBreakToggle(doc)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                isOnBreak
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                              }`}
                              title="Toggle break interval"
                            >
                              <Coffee className="w-3.5 h-3.5" />
                              <span>{isOnBreak ? 'Resume OPD' : 'Start Break'}</span>
                            </button>

                            {/* Edit Shift & Break Timings */}
                            <button
                              onClick={() => {
                                setTimingModalDoctor(doc);
                                setTimingForm({
                                  shiftTiming: doc.shiftTiming || '09:00 - 17:00',
                                  breakTiming: doc.breakTiming || '13:00 - 14:00 (Lunch Break)'
                                });
                              }}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center gap-1"
                              title="Edit Shift & Break Timings"
                            >
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                              <span>Timings</span>
                            </button>
                          </div>

                          {/* When Doctor Wants to Leave Hospital */}
                          <button
                            onClick={() => {
                              setResignationModalDoctor(doc);
                              setResignationForm({
                                relievedDate: new Date().toISOString().split('T')[0],
                                resignationReason: 'Relocating to another city',
                                customNotes: ''
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer flex items-center gap-1"
                            title="Process Doctor Resignation / Exit Clearance"
                          >
                            <LogOut className="w-3.5 h-3.5 text-rose-600" />
                            <span>Leaving Hospital</span>
                          </button>
                        </div>
                      ) : (
                        /* Relieved doctor actions */
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => setRelievingLetterDoctor(doc)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 cursor-pointer flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Relieving Certificate</span>
                          </button>

                          <button
                            onClick={() => handleReactivateDoctor(doc)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                          >
                            Re-hire / Rejoin
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Action: Book Appointment with Doctor */}
                  {!isRelieved && onBookAppointmentWithDoctor && (
                    <button
                      onClick={() => onBookAppointmentWithDoctor(doc)}
                      className="w-full py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>Book Appointment with {doc.name.split(' ')[0]} {doc.name.split(' ')[1]}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-lg">
              No doctors found matching your filter
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              We couldn't find any specialist matching "{search}" or the selected department filter.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {(isAddModalOpen || editingDoctor) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                {editingDoctor ? 'Edit Doctor Profile' : 'Add New Medical Specialist'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingDoctor(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Doctor Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    formErrors.name ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-rose-600 mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Specialization *
                  </label>
                  <select
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value as Specialization })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                  >
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Consultation Fee (₹) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                      formErrors.fee ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.fee && <p className="text-[11px] text-rose-600 mt-1">{formErrors.fee}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98200 11001"
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                      formErrors.phone ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="doctor@medicare.com"
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                      formErrors.email ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.email && <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>}
                </div>
              </div>

              {/* Shift Hours & Break Intervals */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-600" /> Shift Timings
                  </label>
                  <input
                    type="text"
                    value={formData.shiftTiming}
                    onChange={(e) => setFormData({ ...formData, shiftTiming: e.target.value })}
                    placeholder="09:00 - 17:00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                    <Coffee className="w-3.5 h-3.5 text-amber-500" /> Break Interval
                  </label>
                  <input
                    type="text"
                    value={formData.breakTiming}
                    onChange={(e) => setFormData({ ...formData, breakTiming: e.target.value })}
                    placeholder="13:00 - 14:00 (Lunch Break)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    placeholder="MBBS, MD, DM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    OPD Chamber
                  </label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="OPD-101"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Photo Avatar URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingDoctor(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Save Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SHIFT & BREAK TIMINGS MODAL */}
      {timingModalDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-base">
                    Update Shift & Break Timings
                  </h3>
                  <p className="text-xs text-slate-500">{timingModalDoctor.name} ({timingModalDoctor.specialization})</p>
                </div>
              </div>
              <button
                onClick={() => setTimingModalDoctor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTiming} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  OPD Shift Hours
                </label>
                <input
                  type="text"
                  value={timingForm.shiftTiming}
                  onChange={(e) => setTimingForm({ ...timingForm, shiftTiming: e.target.value })}
                  placeholder="e.g. 09:00 - 17:00 or 08:00 - 14:00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">Quick Presets:</span>
                  {['09:00 - 17:00', '08:00 - 14:00', '14:00 - 20:00'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTimingForm(prev => ({ ...prev, shiftTiming: preset }))}
                      className="text-[10px] bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 px-2 py-0.5 rounded-md font-semibold cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Designated Break Interval
                </label>
                <input
                  type="text"
                  value={timingForm.breakTiming}
                  onChange={(e) => setTimingForm({ ...timingForm, breakTiming: e.target.value })}
                  placeholder="e.g. 13:00 - 14:00 (Lunch Break)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">Quick Presets:</span>
                  {['13:00 - 14:00 (Lunch)', '11:30 - 12:00 (Tea)', '16:00 - 16:30 (Tea)'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTimingForm(prev => ({ ...prev, breakTiming: preset }))}
                      className="text-[10px] bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 px-2 py-0.5 rounded-md font-semibold cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTimingModalDoctor(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Shift & Break'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHEN DOCTOR WANTS TO LEAVE HOSPITAL: RESIGNATION / RELIEVING MODAL */}
      {resignationModalDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                    Process Doctor Hospital Exit
                  </h3>
                  <p className="text-xs text-slate-500">
                    Resignation, handover & relieving clearance for {resignationModalDoctor.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResignationModalDoctor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessResignation} className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <img
                  src={resignationModalDoctor.avatar || DOCTOR_AVATARS[resignationModalDoctor.id] || DOCTOR_AVATARS.default}
                  alt={resignationModalDoctor.name}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 text-sm">{resignationModalDoctor.name}</div>
                  <div className="text-teal-700 font-semibold">{resignationModalDoctor.specialization} • {resignationModalDoctor.qualifications}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{resignationModalDoctor.roomNumber} • {resignationModalDoctor.email}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Effective Relieving Date *
                </label>
                <input
                  type="date"
                  value={resignationForm.relievedDate}
                  onChange={(e) => setResignationForm({ ...resignationForm, relievedDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Leaving Hospital *
                </label>
                <select
                  value={resignationForm.resignationReason}
                  onChange={(e) => setResignationForm({ ...resignationForm, resignationReason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                >
                  <option value="Relocating to another city">Relocating to another city</option>
                  <option value="Higher Medical Studies / Fellowship Abroad">Higher Medical Studies / Fellowship Abroad</option>
                  <option value="Starting Private Clinical Practice">Starting Private Clinical Practice</option>
                  <option value="Personal / Family Reasons">Personal / Family Reasons</option>
                  <option value="Contract Period Completed">Contract Period Completed</option>
                  <option value="Joining Government Medical College">Joining Government Medical College</option>
                  <option value="Health / Medical Leave of Absence">Health / Medical Leave of Absence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Exit Handover & Patient Queue Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={resignationForm.customNotes}
                  onChange={(e) => setResignationForm({ ...resignationForm, customNotes: e.target.value })}
                  placeholder="e.g. OPD patient records handed over to Dr. Ananya Iyer. Hospital ID returned."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Confirming this exit will mark {resignationModalDoctor.name} as <strong>"Resigned / Relieved"</strong>. The doctor will no longer appear on active booking lists. You can generate the official NMC Experience & Relieving Certificate immediately.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResignationModalDoctor(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 disabled:opacity-70 cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Processing...' : 'Confirm Hospital Exit & Relieve'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL RELIEVING LETTER MODAL */}
      {relievingLetterDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Official Document
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  REF: NC/HR/REL/{relievingLetterDoctor.id.toUpperCase()}-2026
                </span>
              </div>
              <button
                onClick={() => setRelievingLetterDoctor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Letterhead Certificate */}
            <div className="border-2 border-slate-200 rounded-2xl p-6 sm:p-8 bg-slate-50/50 space-y-6 text-slate-800 text-xs sm:text-sm">
              <div className="flex items-center justify-between border-b border-slate-300 pb-4">
                <div>
                  <h2 className="font-heading font-black text-xl text-teal-900 tracking-tight">
                    Nexus Care Multispecialty Hospital
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Main Campus, Sector 14, Navi Mumbai, Maharashtra - 400703
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    NABH Accredited • Reg. No. DHS-MH-2026-9811
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <div>Date: <strong>{relievingLetterDoctor.relievedDate || new Date().toISOString().split('T')[0]}</strong></div>
                  <div>Place: Navi Mumbai</div>
                </div>
              </div>

              <div className="text-center py-2">
                <h3 className="font-heading font-extrabold text-base uppercase tracking-wider text-slate-900 border-b border-slate-300 inline-block pb-0.5">
                  Service Relieving & Experience Certificate
                </h3>
              </div>

              <div className="space-y-3 leading-relaxed text-slate-700">
                <p>
                  This is to certify that <strong>{relievingLetterDoctor.name}</strong> was employed with <strong>Nexus Care Multispecialty Hospital</strong> as a <strong>Consultant {relievingLetterDoctor.specialization}</strong>.
                </p>
                <p>
                  During the tenure of service with our hospital, {relievingLetterDoctor.name} discharged all clinical duties, OPD consultations at <strong>{relievingLetterDoctor.roomNumber}</strong>, patient care, and emergency responsibilities with high dedication and professional competence.
                </p>
                <p>
                  <strong>{relievingLetterDoctor.name}</strong> has been officially relieved of all hospital duties on <strong>{relievingLetterDoctor.relievedDate || 'Effective Immediately'}</strong> following resignation tender. All department handover procedures, clinical records, and hospital clearances have been settled satisfactorily.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-800">Reason for Relieving as per Hospital Records:</div>
                  <div className="text-slate-600 mt-0.5">{relievingLetterDoctor.resignationReason || 'Resigned on personal grounds'}</div>
                </div>
                <p>
                  We appreciate the valuable medical services rendered to our patients and wish {relievingLetterDoctor.name} all success in future endeavors.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-300 flex items-end justify-between">
                <div>
                  <div className="w-20 h-10 border-b border-dashed border-slate-400 flex items-center justify-center text-teal-800 italic font-serif text-sm">
                    Alok Nath
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-1">Dr. Alok Nath, MBBS, MD</div>
                  <div className="text-[10px] text-slate-500">Medical Superintendent & HR Director</div>
                  <div className="text-[9px] text-slate-400">Nexus Care Hospital & Research Centre</div>
                </div>

                <div className="text-center p-2.5 rounded-xl border border-teal-600/40 bg-teal-50/50 text-[10px] text-teal-900 font-bold">
                  <div>OFFICIAL NMC HOSPITAL SEAL</div>
                  <div className="font-mono text-[9px] text-teal-700">AUTHENTICATED</div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setRelievingLetterDoctor(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Relieving Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-base">Remove Doctor</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong className="text-slate-900">{deletingDoctor.name}</strong> from the Nexus Care roster?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingDoctor(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
