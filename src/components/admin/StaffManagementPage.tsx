import React, { useState } from 'react';
import { 
  Users, 
  Stethoscope, 
  UserPlus, 
  Clock, 
  Calendar, 
  Phone, 
  Mail, 
  Building, 
  Award, 
  Coffee, 
  LogOut, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Printer, 
  X, 
  Filter, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Doctor, Receptionist, Specialization, AvailabilityStatus, StaffDutyStatus } from '../../types';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { DOCTOR_AVATARS } from '../../assets/images';

interface StaffManagementPageProps {
  doctors: Doctor[];
  receptionists: Receptionist[];
  onDataChanged: () => void;
  initialTab?: 'doctors' | 'receptionists' | 'timing' | 'exits';
  openAddModal?: 'doctor' | 'receptionist' | null;
}

const SPECIALIZATIONS: Specialization[] = [
  'Cardiologist',
  'Dermatologist',
  'Orthopedic',
  'General Physician',
  'Neurologist',
  'Pediatrician'
];

const SHIFT_OPTIONS = ['Morning', 'Evening', 'Night'] as const;

export const StaffManagementPage: React.FC<StaffManagementPageProps> = ({
  doctors,
  receptionists,
  onDataChanged,
  initialTab = 'doctors',
  openAddModal = null
}) => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'doctors' | 'receptionists' | 'timing' | 'exits'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'break' | 'leave' | 'relieved'>('active');

  // Modals state
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(openAddModal === 'doctor');
  const [isAddReceptionistModalOpen, setIsAddReceptionistModalOpen] = useState(openAddModal === 'receptionist');

  React.useEffect(() => {
    if (openAddModal === 'doctor') {
      setIsAddDoctorModalOpen(true);
    } else if (openAddModal === 'receptionist') {
      setIsAddReceptionistModalOpen(true);
    }
  }, [openAddModal]);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editingReceptionist, setEditingReceptionist] = useState<Receptionist | null>(null);
  const [timingModalStaff, setTimingModalStaff] = useState<{ type: 'doctor' | 'receptionist'; data: Doctor | Receptionist } | null>(null);
  const [resignationModalStaff, setResignationModalStaff] = useState<{ type: 'doctor' | 'receptionist'; data: Doctor | Receptionist } | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<{ type: 'doctor' | 'receptionist'; id: string; name: string } | null>(null);
  const [relievingLetterStaff, setRelievingLetterStaff] = useState<{ type: 'doctor' | 'receptionist'; data: Doctor | Receptionist } | null>(null);

  // Doctor Form State
  const [docFormData, setDocFormData] = useState({
    name: '',
    specialization: 'Cardiologist' as Specialization,
    phone: '',
    email: '',
    consultationFee: 600,
    qualifications: 'MBBS, MD',
    experienceYears: 10,
    roomNumber: 'OPD-101',
    shiftTiming: '09:00 - 17:00',
    breakTiming: '13:00 - 14:00 (Lunch Break)',
    avatar: DOCTOR_AVATARS.default
  });

  // Receptionist Form State
  const [recFormData, setRecFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shift: 'Morning' as 'Morning' | 'Evening' | 'Night',
    deskNumber: 'Counter A-1',
    shiftTiming: '08:00 - 14:00',
    breakTiming: '11:30 - 12:00 (Tea & Lunch)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80'
  });

  // Timing update state
  const [timingForm, setTimingForm] = useState({
    shiftTiming: '',
    breakTiming: ''
  });

  // Resignation form state
  const [resignationForm, setResignationForm] = useState({
    relievedDate: new Date().toISOString().split('T')[0],
    resignationReason: 'Relocating to another city',
    customNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active / Filter counts
  const activeDoctors = doctors.filter(d => d.availabilityStatus !== 'Resigned / Relieved');
  const activeReceptionists = receptionists.filter(r => r.dutyStatus !== 'Resigned / Relieved');
  const doctorsOnBreak = doctors.filter(d => d.availabilityStatus === 'On Break').length;
  const receptionistsOnBreak = receptionists.filter(r => r.dutyStatus === 'On Break').length;
  const staffOnBreak = doctorsOnBreak + receptionistsOnBreak;
  const staffOnLeave = doctors.filter(d => d.availabilityStatus === 'On Leave').length + receptionists.filter(r => r.dutyStatus === 'On Leave').length;
  const relievedStaffCount = doctors.filter(d => d.availabilityStatus === 'Resigned / Relieved').length + receptionists.filter(r => r.dutyStatus === 'Resigned / Relieved').length;

  // Filtered lists
  const filteredDoctors = doctors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.specialization.toLowerCase().includes(search.toLowerCase()) || 
                          d.roomNumber.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'active') return d.availabilityStatus !== 'Resigned / Relieved';
    if (statusFilter === 'break') return d.availabilityStatus === 'On Break';
    if (statusFilter === 'leave') return d.availabilityStatus === 'On Leave';
    if (statusFilter === 'relieved') return d.availabilityStatus === 'Resigned / Relieved';
    return true;
  });

  const filteredReceptionists = receptionists.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                          r.deskNumber.toLowerCase().includes(search.toLowerCase()) || 
                          r.email.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'active') return r.dutyStatus !== 'Resigned / Relieved';
    if (statusFilter === 'break') return r.dutyStatus === 'On Break';
    if (statusFilter === 'leave') return r.dutyStatus === 'On Leave';
    if (statusFilter === 'relieved') return r.dutyStatus === 'Resigned / Relieved';
    return true;
  });

  // Handlers
  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFormData.name.trim() || !docFormData.email.trim() || !docFormData.phone.trim()) {
      error('Please complete name, email, and contact phone');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDoctor) {
        await api.updateDoctor(editingDoctor.id, {
          name: docFormData.name.trim(),
          specialization: docFormData.specialization,
          phone: docFormData.phone.trim(),
          email: docFormData.email.trim(),
          consultationFee: Number(docFormData.consultationFee),
          qualifications: docFormData.qualifications.trim(),
          experienceYears: Number(docFormData.experienceYears),
          roomNumber: docFormData.roomNumber.trim(),
          shiftTiming: docFormData.shiftTiming.trim(),
          breakTiming: docFormData.breakTiming.trim(),
          avatar: docFormData.avatar.trim() || DOCTOR_AVATARS.default
        });
        success(`Doctor ${docFormData.name} profile & timings updated`);
        setEditingDoctor(null);
      } else {
        await api.createDoctor({
          name: docFormData.name.trim(),
          specialization: docFormData.specialization,
          phone: docFormData.phone.trim(),
          email: docFormData.email.trim(),
          consultationFee: Number(docFormData.consultationFee),
          availabilityStatus: 'Available',
          qualifications: docFormData.qualifications.trim(),
          experienceYears: Number(docFormData.experienceYears),
          roomNumber: docFormData.roomNumber.trim(),
          shiftTiming: docFormData.shiftTiming.trim() || '09:00 - 17:00',
          breakTiming: docFormData.breakTiming.trim() || '13:00 - 14:00 (Lunch Break)',
          avatar: docFormData.avatar.trim() || DOCTOR_AVATARS.default
        });
        success(`Specialist ${docFormData.name} added to Nexus Care roster`);
        setIsAddDoctorModalOpen(false);
      }
      onDataChanged();
    } catch (err: any) {
      error(err.message || 'Failed to save doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveReceptionist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recFormData.name.trim() || !recFormData.email.trim() || !recFormData.phone.trim()) {
      error('Please complete name, email, and contact phone');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingReceptionist) {
        await api.updateReceptionist(editingReceptionist.id, {
          name: recFormData.name.trim(),
          email: recFormData.email.trim(),
          phone: recFormData.phone.trim(),
          shift: recFormData.shift,
          deskNumber: recFormData.deskNumber.trim(),
          shiftTiming: recFormData.shiftTiming.trim(),
          breakTiming: recFormData.breakTiming.trim(),
          avatar: recFormData.avatar.trim()
        });
        success(`Receptionist ${recFormData.name} record updated`);
        setEditingReceptionist(null);
      } else {
        await api.createReceptionist({
          name: recFormData.name.trim(),
          email: recFormData.email.trim(),
          phone: recFormData.phone.trim(),
          shift: recFormData.shift,
          deskNumber: recFormData.deskNumber.trim(),
          dutyStatus: 'On Duty',
          shiftTiming: recFormData.shiftTiming.trim() || '08:00 - 14:00',
          breakTiming: recFormData.breakTiming.trim() || '11:30 - 12:00 (Tea & Lunch)',
          avatar: recFormData.avatar.trim() || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80'
        });
        success(`Receptionist ${recFormData.name} registered`);
        setIsAddReceptionistModalOpen(false);
      }
      onDataChanged();
    } catch (err: any) {
      error(err.message || 'Failed to save receptionist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTiming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timingModalStaff) return;
    setIsSubmitting(true);
    try {
      if (timingModalStaff.type === 'doctor') {
        await api.updateDoctor(timingModalStaff.data.id, {
          shiftTiming: timingForm.shiftTiming.trim(),
          breakTiming: timingForm.breakTiming.trim()
        });
      } else {
        await api.updateReceptionist(timingModalStaff.data.id, {
          shiftTiming: timingForm.shiftTiming.trim(),
          breakTiming: timingForm.breakTiming.trim()
        });
      }
      success(`Duty shift & break timing updated for ${timingModalStaff.data.name}`);
      setTimingModalStaff(null);
      onDataChanged();
    } catch (err: any) {
      error(err.message || 'Failed to update timings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickBreakToggle = async (type: 'doctor' | 'receptionist', staff: Doctor | Receptionist) => {
    try {
      if (type === 'doctor') {
        const doc = staff as Doctor;
        const newStatus: AvailabilityStatus = doc.availabilityStatus === 'On Break' ? 'Available' : 'On Break';
        await api.updateDoctor(doc.id, { availabilityStatus: newStatus });
        success(`${doc.name} marked as ${newStatus}`);
      } else {
        const rec = staff as Receptionist;
        const newStatus: StaffDutyStatus = rec.dutyStatus === 'On Break' ? 'On Duty' : 'On Break';
        await api.updateReceptionist(rec.id, { dutyStatus: newStatus });
        success(`${rec.name} marked as ${newStatus}`);
      }
      onDataChanged();
    } catch (err: any) {
      error('Failed to update break status');
    }
  };

  const handleProcessResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resignationModalStaff) return;
    setIsSubmitting(true);
    try {
      const fullReason = `${resignationForm.resignationReason}${resignationForm.customNotes ? ` - ${resignationForm.customNotes}` : ''}`;
      if (resignationModalStaff.type === 'doctor') {
        await api.updateDoctor(resignationModalStaff.data.id, {
          availabilityStatus: 'Resigned / Relieved',
          relievedDate: resignationForm.relievedDate,
          resignationReason: fullReason
        });
      } else {
        await api.updateReceptionist(resignationModalStaff.data.id, {
          dutyStatus: 'Resigned / Relieved',
          relievedDate: resignationForm.relievedDate,
          resignationReason: fullReason
        });
      }
      success(`${resignationModalStaff.data.name} marked as Relieved / Left Hospital.`);
      setResignationModalStaff(null);
      onDataChanged();
    } catch (err: any) {
      error(err.message || 'Failed to process relieving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    try {
      if (deletingStaff.type === 'doctor') {
        await api.deleteDoctor(deletingStaff.id);
      } else {
        await api.deleteReceptionist(deletingStaff.id);
      }
      success(`${deletingStaff.name} removed from hospital system`);
      setDeletingStaff(null);
      onDataChanged();
    } catch (err: any) {
      error(err.message || 'Failed to delete record');
    }
  };

  const handleReactivateStaff = async (type: 'doctor' | 'receptionist', staff: Doctor | Receptionist) => {
    try {
      if (type === 'doctor') {
        await api.updateDoctor(staff.id, {
          availabilityStatus: 'Available',
          resignationReason: undefined,
          relievedDate: undefined
        });
      } else {
        await api.updateReceptionist(staff.id, {
          dutyStatus: 'On Duty',
          resignationReason: undefined,
          relievedDate: undefined
        });
      }
      success(`${staff.name} restored to active hospital duty roster`);
      onDataChanged();
    } catch (err: any) {
      error('Failed to reactivate staff');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Hospital Administration & HR Console
            </span>
            <span className="text-xs font-bold text-slate-500">
              National Medical Commission (NMC) Compliant
            </span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Nexus Care Staff & Human Resources Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Administer Doctors & Receptionists, assign OPD shifts, track break intervals, and process hospital leaving / resignations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setDocFormData({
                name: '',
                specialization: 'Cardiologist',
                phone: '',
                email: '',
                consultationFee: 600,
                qualifications: 'MBBS, MD',
                experienceYears: 8,
                roomNumber: 'OPD-105',
                shiftTiming: '09:00 - 17:00',
                breakTiming: '13:00 - 14:00 (Lunch Break)',
                avatar: DOCTOR_AVATARS.default
              });
              setIsAddDoctorModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white shadow-md shadow-teal-700/20 cursor-pointer"
          >
            <Stethoscope className="w-4 h-4" />
            <span>+ Add Doctor</span>
          </button>

          <button
            onClick={() => {
              setRecFormData({
                name: '',
                email: '',
                phone: '',
                shift: 'Morning',
                deskNumber: 'Counter A-2',
                shiftTiming: '08:00 - 14:00',
                breakTiming: '11:30 - 12:00 (Tea & Lunch)',
                avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80'
              });
              setIsAddReceptionistModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white text-teal-800 hover:bg-teal-50 border border-teal-200/90 shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-teal-600" />
            <span>+ Add Receptionist</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-black text-slate-900 text-lg">{activeDoctors.length}</div>
            <div className="text-[11px] text-slate-500 font-semibold">Active Doctors</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-black text-slate-900 text-lg">{activeReceptionists.length}</div>
            <div className="text-[11px] text-slate-500 font-semibold">Front-Desk Staff</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-black text-amber-700 text-lg">{staffOnBreak}</div>
            <div className="text-[11px] text-slate-500 font-semibold">Currently on Break</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-black text-blue-800 text-lg">{staffOnLeave}</div>
            <div className="text-[11px] text-slate-500 font-semibold">On Casual Leave</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-black text-rose-800 text-lg">{relievedStaffCount}</div>
            <div className="text-[11px] text-slate-500 font-semibold">Relieved / Resigned</div>
          </div>
        </div>
      </div>

      {/* Main Module Tabs & Search Filter */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'doctors'
                  ? 'bg-white text-teal-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Specialist Doctors ({doctors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('receptionists')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'receptionists'
                  ? 'bg-white text-teal-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Receptionists ({receptionists.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('timing')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'timing'
                  ? 'bg-white text-teal-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Shift & Break Board</span>
            </button>

            <button
              onClick={() => setActiveTab('exits')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'exits'
                  ? 'bg-white text-teal-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Relieved Staff & Exits ({relievedStaffCount})</span>
            </button>
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto">
            <span className="text-slate-400 text-[11px] mr-1">Filter:</span>
            {(['active', 'break', 'leave', 'relieved', 'all'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s === 'active' ? 'Active Duty' : s === 'relieved' ? 'Left Hospital' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by staff name, department, desk counter, room number, or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* TAB 1: DOCTORS MANAGEMENT */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map((doc) => {
              const isRelieved = doc.availabilityStatus === 'Resigned / Relieved';
              const isOnBreak = doc.availabilityStatus === 'On Break';
              const isAvailable = doc.availabilityStatus === 'Available';

              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-xs ${
                    isRelieved 
                      ? 'border-slate-200/60 bg-slate-50/50 opacity-80' 
                      : isOnBreak
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200/90 hover:border-teal-300'
                  }`}
                >
                  <div>
                    {/* Header with Photo & Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.avatar || DOCTOR_AVATARS[doc.id] || DOCTOR_AVATARS.default}
                          alt={doc.name}
                          className="w-13 h-13 rounded-2xl object-cover ring-2 ring-teal-500/30"
                        />
                        <div>
                          <h4 className="font-heading font-extrabold text-slate-900 text-base leading-tight">
                            {doc.name}
                          </h4>
                          <p className="text-xs font-bold text-teal-700 mt-0.5">
                            {doc.specialization}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isRelieved
                            ? 'bg-rose-100 text-rose-800'
                            : isOnBreak
                            ? 'bg-amber-100 text-amber-800'
                            : isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-cyan-100 text-cyan-800'
                        }`}
                      >
                        {doc.availabilityStatus}
                      </span>
                    </div>

                    {/* Duty Shift & Break Timing Details */}
                    <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> Shift Hours:
                        </span>
                        <strong className="text-slate-800">{doc.shiftTiming || '09:00 - 17:00'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5 text-amber-500" /> Break Interval:
                        </span>
                        <strong className="text-amber-800">{doc.breakTiming || '13:00 - 14:00 (Lunch)'}</strong>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-500">OPD Chamber:</span>
                        <span className="font-bold text-slate-700">{doc.roomNumber}</span>
                      </div>
                    </div>

                    {/* Resignation Notice banner if Relieved */}
                    {isRelieved && (
                      <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1 text-rose-900">
                        <div className="font-bold flex items-center gap-1">
                          <LogOut className="w-3.5 h-3.5 text-rose-600" /> Left Hospital / Relieved
                        </div>
                        <p className="text-[11px] text-rose-800">
                          <strong>Reason:</strong> {doc.resignationReason || 'Resigned'}
                        </p>
                        {doc.relievedDate && (
                          <div className="text-[10px] text-rose-700">Relieved on: {doc.relievedDate}</div>
                        )}
                      </div>
                    )}

                    {/* Contact Details */}
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{doc.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{doc.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {!isRelieved ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          {/* Quick Break Button */}
                          <button
                            onClick={() => handleQuickBreakToggle('doctor', doc)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                              isOnBreak
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                            }`}
                            title="Toggle break timing"
                          >
                            <Coffee className="w-3.5 h-3.5" />
                            <span>{isOnBreak ? 'Resume OPD' : 'Start Break'}</span>
                          </button>

                          {/* Edit Shift/Break Timings */}
                          <button
                            onClick={() => {
                              setTimingModalStaff({ type: 'doctor', data: doc });
                              setTimingForm({
                                shiftTiming: doc.shiftTiming || '09:00 - 17:00',
                                breakTiming: doc.breakTiming || '13:00 - 14:00 (Lunch Break)'
                              });
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 cursor-pointer"
                            title="Edit Shift & Break Timings"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Admin Leaving / Edit actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingDoctor(doc);
                              setDocFormData({
                                name: doc.name,
                                specialization: doc.specialization,
                                phone: doc.phone,
                                email: doc.email,
                                consultationFee: doc.consultationFee,
                                qualifications: doc.qualifications,
                                experienceYears: doc.experienceYears,
                                roomNumber: doc.roomNumber,
                                shiftTiming: doc.shiftTiming || '09:00 - 17:00',
                                breakTiming: doc.breakTiming || '13:00 - 14:00',
                                avatar: doc.avatar || DOCTOR_AVATARS[doc.id] || DOCTOR_AVATARS.default
                              });
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                            title="Edit Doctor Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* When Doctor Wants to Leave */}
                          <button
                            onClick={() => {
                              setResignationModalStaff({ type: 'doctor', data: doc });
                              setResignationForm({
                                relievedDate: new Date().toISOString().split('T')[0],
                                resignationReason: 'Relocating to another city',
                                customNotes: ''
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer flex items-center gap-1"
                            title="Process Doctor Resignation / Hospital Exit"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Leaving Hospital</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Relieved Doctor Options */
                      <div className="w-full flex items-center justify-between">
                        <button
                          onClick={() => setRelievingLetterStaff({ type: 'doctor', data: doc })}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 cursor-pointer flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Relieving Letter</span>
                        </button>

                        <button
                          onClick={() => handleReactivateStaff('doctor', doc)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                        >
                          Re-hire / Rejoin
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: RECEPTIONISTS MANAGEMENT */}
      {activeTab === 'receptionists' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReceptionists.map((rec) => {
              const isRelieved = rec.dutyStatus === 'Resigned / Relieved';
              const isOnBreak = rec.dutyStatus === 'On Break';

              return (
                <div
                  key={rec.id}
                  className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-xs ${
                    isRelieved 
                      ? 'border-slate-200/60 bg-slate-50/50 opacity-80' 
                      : isOnBreak
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200/90 hover:border-teal-300'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={rec.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80'}
                          alt={rec.name}
                          className="w-13 h-13 rounded-2xl object-cover ring-2 ring-teal-500/30"
                        />
                        <div>
                          <h4 className="font-heading font-extrabold text-slate-900 text-base leading-tight">
                            {rec.name}
                          </h4>
                          <p className="text-xs font-bold text-teal-700 mt-0.5">
                            Front-Desk Receptionist ({rec.shift} Shift)
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isRelieved
                            ? 'bg-rose-100 text-rose-800'
                            : isOnBreak
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rec.dutyStatus || 'On Duty'}
                      </span>
                    </div>

                    {/* Shift & Break Info */}
                    <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-teal-600" /> Desk Counter:
                        </span>
                        <strong className="text-slate-800">{rec.deskNumber}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> Shift Hours:
                        </span>
                        <strong className="text-slate-800">{rec.shiftTiming || '08:00 - 14:00'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5 text-amber-500" /> Break Interval:
                        </span>
                        <strong className="text-amber-800">{rec.breakTiming || '11:30 - 12:00'}</strong>
                      </div>
                    </div>

                    {/* Relieved notice */}
                    {isRelieved && (
                      <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1 text-rose-900">
                        <div className="font-bold flex items-center gap-1">
                          <LogOut className="w-3.5 h-3.5 text-rose-600" /> Resigned / Relieved from Hospital
                        </div>
                        <p className="text-[11px] text-rose-800">
                          <strong>Reason:</strong> {rec.resignationReason || 'Resigned'}
                        </p>
                        {rec.relievedDate && (
                          <div className="text-[10px] text-rose-700">Relieved on: {rec.relievedDate}</div>
                        )}
                      </div>
                    )}

                    {/* Contact details */}
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{rec.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{rec.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {!isRelieved ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          {/* Quick Break Button */}
                          <button
                            onClick={() => handleQuickBreakToggle('receptionist', rec)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                              isOnBreak
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                            }`}
                            title="Toggle break timing"
                          >
                            <Coffee className="w-3.5 h-3.5" />
                            <span>{isOnBreak ? 'End Break' : 'Start Break'}</span>
                          </button>

                          {/* Edit Timing */}
                          <button
                            onClick={() => {
                              setTimingModalStaff({ type: 'receptionist', data: rec });
                              setTimingForm({
                                shiftTiming: rec.shiftTiming || '08:00 - 14:00',
                                breakTiming: rec.breakTiming || '11:30 - 12:00 (Tea & Lunch)'
                              });
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 cursor-pointer"
                            title="Edit Shift & Break Timings"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingReceptionist(rec);
                              setRecFormData({
                                name: rec.name,
                                email: rec.email,
                                phone: rec.phone,
                                shift: rec.shift,
                                deskNumber: rec.deskNumber,
                                shiftTiming: rec.shiftTiming || '08:00 - 14:00',
                                breakTiming: rec.breakTiming || '11:30 - 12:00',
                                avatar: rec.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80'
                              });
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                            title="Edit Receptionist"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* When Receptionist Wants to Leave */}
                          <button
                            onClick={() => {
                              setResignationModalStaff({ type: 'receptionist', data: rec });
                              setResignationForm({
                                relievedDate: new Date().toISOString().split('T')[0],
                                resignationReason: 'Higher Studies / Full-time degree',
                                customNotes: ''
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer flex items-center gap-1"
                            title="Process Receptionist Resignation / Hospital Exit"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Leaving Hospital</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between">
                        <button
                          onClick={() => setRelievingLetterStaff({ type: 'receptionist', data: rec })}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 cursor-pointer flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Relieving Letter</span>
                        </button>

                        <button
                          onClick={() => handleReactivateStaff('receptionist', rec)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                        >
                          Re-hire / Rejoin
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SHIFT & BREAK TIMING BOARD */}
      {activeTab === 'timing' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                Hospital Shift Roster & Break Schedule Control
              </h3>
              <p className="text-xs text-slate-500">
                Live monitoring of on-duty consultants and front-desk personnel, active break intervals, and coverage
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {staffOnBreak} staff on break
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {activeDoctors.length + activeReceptionists.length - staffOnBreak} on active duty
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member & Role</th>
                  <th className="py-3 px-4">Room / Counter</th>
                  <th className="py-3 px-4">Shift Timings</th>
                  <th className="py-3 px-4">Designated Break</th>
                  <th className="py-3 px-4">Duty Status</th>
                  <th className="py-3 px-4 text-right">Break & Timing Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Doctors Section */}
                <tr className="bg-teal-50/40">
                  <td colSpan={6} className="py-2 px-4 font-bold text-xs text-teal-900 uppercase tracking-wider">
                    Medical Specialist Faculty
                  </td>
                </tr>
                {activeDoctors.map(doc => {
                  const isOnBreak = doc.availabilityStatus === 'On Break';
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={doc.avatar || DOCTOR_AVATARS[doc.id] || DOCTOR_AVATARS.default}
                            alt={doc.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{doc.name}</div>
                            <div className="text-[11px] text-teal-700">{doc.specialization}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {doc.roomNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {doc.shiftTiming || '09:00 - 17:00'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-xs">
                          {doc.breakTiming || '13:00 - 14:00 (Lunch)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isOnBreak ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {doc.availabilityStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleQuickBreakToggle('doctor', doc)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              isOnBreak
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            }`}
                          >
                            {isOnBreak ? 'Resume Duty' : 'Send on Break'}
                          </button>
                          <button
                            onClick={() => {
                              setTimingModalStaff({ type: 'doctor', data: doc });
                              setTimingForm({
                                shiftTiming: doc.shiftTiming || '09:00 - 17:00',
                                breakTiming: doc.breakTiming || '13:00 - 14:00 (Lunch Break)'
                              });
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                            title="Edit Timings"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Receptionists Section */}
                <tr className="bg-cyan-50/40">
                  <td colSpan={6} className="py-2 px-4 font-bold text-xs text-cyan-900 uppercase tracking-wider">
                    Front-Desk Reception Staff
                  </td>
                </tr>
                {activeReceptionists.map(rec => {
                  const isOnBreak = rec.dutyStatus === 'On Break';
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rec.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80'}
                            alt={rec.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{rec.name}</div>
                            <div className="text-[11px] text-cyan-800">Receptionist ({rec.shift})</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {rec.deskNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {rec.shiftTiming || '08:00 - 14:00'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-xs">
                          {rec.breakTiming || '11:30 - 12:00'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isOnBreak ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {rec.dutyStatus || 'On Duty'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleQuickBreakToggle('receptionist', rec)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              isOnBreak
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            }`}
                          >
                            {isOnBreak ? 'End Break' : 'Send on Break'}
                          </button>
                          <button
                            onClick={() => {
                              setTimingModalStaff({ type: 'receptionist', data: rec });
                              setTimingForm({
                                shiftTiming: rec.shiftTiming || '08:00 - 14:00',
                                breakTiming: rec.breakTiming || '11:30 - 12:00 (Tea & Lunch)'
                              });
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                            title="Edit Timings"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RELIEVED STAFF & RESIGNATION ARCHIVES */}
      {activeTab === 'exits' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                Staff Resignations, Relieving Records & Service Archive
              </h3>
              <p className="text-xs text-slate-500">
                Official institutional record of doctors and receptionists who have completed service or left the hospital
              </p>
            </div>
            <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              {relievedStaffCount} Relieved Records
            </span>
          </div>

          <div className="space-y-4">
            {doctors.filter(d => d.availabilityStatus === 'Resigned / Relieved').map(doc => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={doc.avatar || DOCTOR_AVATARS.default}
                    alt={doc.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-300"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                        Doctor • {doc.specialization}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      <strong>Exit Reason:</strong> {doc.resignationReason || 'Resigned'}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Joined: {doc.joinDate || '2022'} • Relieved Date: {doc.relievedDate || '2026'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setRelievingLetterStaff({ type: 'doctor', data: doc })}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-600" />
                    <span>View Relieving Certificate</span>
                  </button>
                  <button
                    onClick={() => handleReactivateStaff('doctor', doc)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-teal-700 hover:bg-teal-50 border border-teal-200 cursor-pointer"
                  >
                    Reactivate
                  </button>
                </div>
              </div>
            ))}

            {receptionists.filter(r => r.dutyStatus === 'Resigned / Relieved').map(rec => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={rec.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80'}
                    alt={rec.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-300"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{rec.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800">
                        Receptionist ({rec.shift})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      <strong>Exit Reason:</strong> {rec.resignationReason || 'Resigned'}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Desk: {rec.deskNumber} • Relieved Date: {rec.relievedDate || '2026'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setRelievingLetterStaff({ type: 'receptionist', data: rec })}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-600" />
                    <span>View Relieving Certificate</span>
                  </button>
                  <button
                    onClick={() => handleReactivateStaff('receptionist', rec)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-teal-700 hover:bg-teal-50 border border-teal-200 cursor-pointer"
                  >
                    Reactivate
                  </button>
                </div>
              </div>
            ))}

            {relievedStaffCount === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No staff members have left the hospital yet. When a doctor or receptionist resigns, click 'Leaving Hospital' to process their exit record.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT DOCTOR */}
      {(isAddDoctorModalOpen || editingDoctor) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                {editingDoctor ? 'Edit Doctor & Shift Timings' : 'Register New Medical Specialist'}
              </h3>
              <button
                onClick={() => { setIsAddDoctorModalOpen(false); setEditingDoctor(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  required
                  value={docFormData.name}
                  onChange={(e) => setDocFormData({ ...docFormData, name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Specialization *
                  </label>
                  <select
                    value={docFormData.specialization}
                    onChange={(e) => setDocFormData({ ...docFormData, specialization: e.target.value as Specialization })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                  >
                    {SPECIALIZATIONS.map(s => (
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
                    required
                    value={docFormData.consultationFee}
                    onChange={(e) => setDocFormData({ ...docFormData, consultationFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={docFormData.phone}
                    onChange={(e) => setDocFormData({ ...docFormData, phone: e.target.value })}
                    placeholder="+91 98200 11001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={docFormData.email}
                    onChange={(e) => setDocFormData({ ...docFormData, email: e.target.value })}
                    placeholder="doctor@medicare.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shift Hours & Break Timings */}
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-3">
                <div className="font-bold text-xs text-teal-950 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-700" />
                  <span>OPD Duty Hours & Break Interval</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      OPD Shift Hours *
                    </label>
                    <input
                      type="text"
                      required
                      value={docFormData.shiftTiming}
                      onChange={(e) => setDocFormData({ ...docFormData, shiftTiming: e.target.value })}
                      placeholder="e.g. 09:00 - 17:00"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Break Interval *
                    </label>
                    <input
                      type="text"
                      required
                      value={docFormData.breakTiming}
                      onChange={(e) => setDocFormData({ ...docFormData, breakTiming: e.target.value })}
                      placeholder="e.g. 13:00 - 14:00 (Lunch)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    value={docFormData.qualifications}
                    onChange={(e) => setDocFormData({ ...docFormData, qualifications: e.target.value })}
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
                    value={docFormData.roomNumber}
                    onChange={(e) => setDocFormData({ ...docFormData, roomNumber: e.target.value })}
                    placeholder="OPD-101"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddDoctorModalOpen(false); setEditingDoctor(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Register Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT RECEPTIONIST */}
      {(isAddReceptionistModalOpen || editingReceptionist) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                {editingReceptionist ? 'Edit Receptionist Record' : 'Register Front-Desk Receptionist'}
              </h3>
              <button
                onClick={() => { setIsAddReceptionistModalOpen(false); setEditingReceptionist(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReceptionist} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={recFormData.name}
                  onChange={(e) => setRecFormData({ ...recFormData, name: e.target.value })}
                  placeholder="e.g. Priya Verma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Shift *
                  </label>
                  <select
                    value={recFormData.shift}
                    onChange={(e) => setRecFormData({ ...recFormData, shift: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                  >
                    {SHIFT_OPTIONS.map(s => (
                      <option key={s} value={s}>{s} Shift</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Desk Counter Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={recFormData.deskNumber}
                    onChange={(e) => setRecFormData({ ...recFormData, deskNumber: e.target.value })}
                    placeholder="e.g. Counter A-1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={recFormData.phone}
                    onChange={(e) => setRecFormData({ ...recFormData, phone: e.target.value })}
                    placeholder="+91 98765 11223"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={recFormData.email}
                    onChange={(e) => setRecFormData({ ...recFormData, email: e.target.value })}
                    placeholder="reception@medicare.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shift and Break timings */}
              <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 space-y-3">
                <div className="font-bold text-xs text-cyan-950 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Front-Desk Shift Hours & Break Interval</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Duty Hours *
                    </label>
                    <input
                      type="text"
                      required
                      value={recFormData.shiftTiming}
                      onChange={(e) => setRecFormData({ ...recFormData, shiftTiming: e.target.value })}
                      placeholder="e.g. 08:00 - 14:00"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Break Interval *
                    </label>
                    <input
                      type="text"
                      required
                      value={recFormData.breakTiming}
                      onChange={(e) => setRecFormData({ ...recFormData, breakTiming: e.target.value })}
                      placeholder="e.g. 11:30 - 12:00 (Tea)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddReceptionistModalOpen(false); setEditingReceptionist(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingReceptionist ? 'Update Receptionist' : 'Save Receptionist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT SHIFT & BREAK TIMINGS */}
      {timingModalStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 className="font-heading font-extrabold text-slate-900 text-base">
                  Update Shift & Break Timings
                </h3>
              </div>
              <button
                onClick={() => setTimingModalStaff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Adjust work hours and scheduled break duration for <strong className="text-slate-900">{timingModalStaff.data.name}</strong>.
            </p>

            <form onSubmit={handleUpdateTiming} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Duty / OPD Shift Hours *
                </label>
                <input
                  type="text"
                  required
                  value={timingForm.shiftTiming}
                  onChange={(e) => setTimingForm({ ...timingForm, shiftTiming: e.target.value })}
                  placeholder="e.g. 09:00 - 17:00 (Day Shift)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Break Timing & Interval *
                </label>
                <input
                  type="text"
                  required
                  value={timingForm.breakTiming}
                  onChange={(e) => setTimingForm({ ...timingForm, breakTiming: e.target.value })}
                  placeholder="e.g. 13:00 - 14:00 (Lunch Break)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTimingModalStaff(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Timing Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PROCESS RESIGNATION / LEAVING HOSPITAL */}
      {resignationModalStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-rose-700">
                <LogOut className="w-5 h-5" />
                <h3 className="font-heading font-extrabold text-slate-900 text-base">
                  Process Staff Departure / Relieving
                </h3>
              </div>
              <button
                onClick={() => setResignationModalStaff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 mb-4 leading-relaxed">
              You are recording the exit for <strong>{resignationModalStaff.data.name}</strong> ({resignationModalStaff.type === 'doctor' ? 'Specialist Doctor' : 'Front-Desk Receptionist'}). 
              Their record will be transitioned to the <strong>Relieved Staff Archive</strong> with an official leaving reason and relieving date.
            </div>

            <form onSubmit={handleProcessResignation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Relieving / Last Working Date *
                </label>
                <input
                  type="date"
                  required
                  value={resignationForm.relievedDate}
                  onChange={(e) => setResignationForm({ ...resignationForm, relievedDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Leaving *
                </label>
                <select
                  value={resignationForm.resignationReason}
                  onChange={(e) => setResignationForm({ ...resignationForm, resignationReason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                >
                  <option value="Relocating to another city / state">Relocating to another city / state</option>
                  <option value="Higher Medical Studies / Fellowships abroad">Higher Medical Studies / Fellowships abroad</option>
                  <option value="Personal / Family Reasons">Personal / Family Reasons</option>
                  <option value="Superannuation / Retirement">Superannuation / Retirement</option>
                  <option value="Completed Contractual Term">Completed Contractual Term</option>
                  <option value="Joining another healthcare institution">Joining another healthcare institution</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Institutional Exit Remarks & Handover Notes
                </label>
                <textarea
                  rows={2}
                  value={resignationForm.customNotes}
                  onChange={(e) => setResignationForm({ ...resignationForm, customNotes: e.target.value })}
                  placeholder="e.g. All hospital OPD keys returned, no dues pending, patient files handed over to department superintendent."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResignationModalStaff(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Relieving & Exit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PRINTABLE RELIEVING CERTIFICATE */}
      {relievingLetterStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Official Institutional Document
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setRelievingLetterStaff(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Letterhead Area */}
            <div className="border border-slate-200 rounded-2xl p-8 bg-white space-y-6 text-slate-800 font-serif">
              {/* Hospital Header */}
              <div className="text-center pb-4 border-b-2 border-teal-800 space-y-1">
                <h2 className="font-heading font-black text-2xl text-teal-950 tracking-tight">
                  NEXUS CARE MULTISPECIALTY HOSPITAL
                </h2>
                <p className="text-xs text-slate-600 font-sans">
                  Plot 14, Health City, Sector 12, Mumbai, Maharashtra 400053 • Reg. DHS-MH-2026-9811
                </p>
                <p className="text-[11px] text-teal-700 font-bold font-sans">
                  Accredited by National Accreditation Board for Hospitals & Healthcare Providers (NABH)
                </p>
              </div>

              {/* Document Title */}
              <div className="text-center">
                <h3 className="font-heading font-bold text-lg text-slate-900 uppercase tracking-widest underline decoration-teal-600 decoration-2 underline-offset-4">
                  RELIEVING & SERVICE EXPERIENCE CERTIFICATE
                </h3>
                <div className="text-right text-xs text-slate-500 font-sans mt-2">
                  Date: {relievingLetterStaff.data.relievedDate || new Date().toISOString().split('T')[0]}
                </div>
              </div>

              {/* Certificate Body */}
              <div className="text-sm leading-relaxed space-y-4 font-sans text-slate-700">
                <p>
                  <strong>TO WHOMSOEVER IT MAY CONCERN</strong>
                </p>
                <p>
                  This is to certify that <strong>{relievingLetterStaff.data.name}</strong> was an esteemed staff member at Nexus Care Multispecialty Hospital, Mumbai, serving in the capacity of <strong>{relievingLetterStaff.type === 'doctor' ? (relievingLetterStaff.data as Doctor).specialization + ' (Medical Faculty)' : 'Front-Desk Reception Officer'}</strong> from <strong>{relievingLetterStaff.data.joinDate || '2023-01-10'}</strong> to <strong>{relievingLetterStaff.data.relievedDate || '2026-10-14'}</strong>.
                </p>
                <p>
                  During the tenure with our institution, {relievingLetterStaff.data.name} conducted professional responsibilities with high dedication, clinical diligence, and patient care integrity.
                </p>
                <p>
                  Consequent upon receipt of formal resignation dated {(relievingLetterStaff.data.relievedDate || '2026-10-14')}, citing <em>"{relievingLetterStaff.data.resignationReason || 'Personal Career Progression'}"</em>, {relievingLetterStaff.data.name} is hereby officially relieved from all hospital duties and has no outstanding institutional liabilities.
                </p>
                <p>
                  We extend our sincere gratitude for the contribution made to Nexus Care and wish every success in all future professional endeavors.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex items-end justify-between font-sans text-xs">
                <div>
                  <div className="w-32 border-b border-slate-400 mb-1"></div>
                  <div className="font-bold text-slate-800">HR Administrator</div>
                  <div className="text-slate-500 text-[11px]">Human Resources Cell</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-teal-600/60 flex items-center justify-center text-teal-800 text-[9px] font-bold mx-auto mb-1">
                    HOSPITAL SEAL
                  </div>
                  <div className="text-[10px] text-slate-400">Official Seal</div>
                </div>

                <div className="text-right">
                  <div className="w-36 border-b border-slate-400 mb-1 ml-auto"></div>
                  <div className="font-bold text-slate-800">Dr. Alok Nath, MBBS, MD</div>
                  <div className="text-slate-500 text-[11px]">Medical Superintendent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
