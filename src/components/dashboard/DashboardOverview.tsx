import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Stethoscope, 
  IndianRupee, 
  TrendingUp, 
  Activity, 
  Clock, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  Building, 
  UserPlus, 
  Receipt, 
  HeartPulse, 
  Award, 
  ChevronRight, 
  ShieldCheck, 
  FileCheck2, 
  PhoneCall, 
  Check,
  Mail,
  Phone,
  CalendarCheck,
  FileText,
  Coffee,
  LogOut,
  Printer,
  UserCheck,
  X,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Doctor, Patient, Appointment, Bill, Specialization, AvailabilityStatus, Receptionist, StaffDutyStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api';
import { HOSPITAL_IMAGES, DOCTOR_AVATARS } from '../../assets/images';

interface DashboardOverviewProps {
  stats: {
    totalPatients: number;
    todayAppointmentsCount: number;
    availableDoctors: number;
    totalDoctors: number;
    totalRevenue: number;
    pendingRevenue: number;
    completedAppointmentsCount: number;
    scheduledAppointmentsCount: number;
    cancelledAppointmentsCount: number;
    appointmentsBySpecialization: { specialization: string; count: number }[];
    statusCounts: { Scheduled: number; Completed: number; Cancelled: number };
    monthlyRevenue: { month: string; revenue: number; appointments: number }[];
    availableBeds?: number;
    admittedPatients?: number;
  } | null;
  doctors: Doctor[];
  receptionists?: Receptionist[];
  patients: Patient[];
  appointments: Appointment[];
  bills: Bill[];
  onNavigateTab: (tab: any) => void;
  onOpenDoctorConsultation?: (appointment: Appointment) => void;
  onBookDoctor?: (doctor: Doctor) => void;
  onDataChanged?: () => void;
  onNavigateToStaff?: (tab: 'doctors' | 'receptionists' | 'timing' | 'exits', openModal?: 'doctor' | 'receptionist') => void;
  onOpenJavaModal?: () => void;
  onNavigateToDischargedPatients?: () => void;
}

const DEPARTMENTS: (Specialization | 'All')[] = [
  'All',
  'Cardiologist',
  'Dermatologist',
  'Orthopedic',
  'General Physician',
  'Neurologist',
  'Pediatrician'
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  doctors,
  receptionists = [],
  patients,
  appointments,
  bills,
  onNavigateTab,
  onOpenDoctorConsultation,
  onBookDoctor,
  onDataChanged,
  onNavigateToStaff,
  onOpenJavaModal,
  onNavigateToDischargedPatients
}) => {
  const { user, doctor } = useAuth();
  const { success, error } = useToast();
  const role = user?.role || 'receptionist';
  const isAdmin = role === 'admin';
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDept, setSelectedDept] = useState<string>('All');

  // Admin Modals on Dashboard
  const [timingModalStaff, setTimingModalStaff] = useState<{ type: 'doctor' | 'receptionist'; data: Doctor | Receptionist } | null>(null);
  const [resignationModalStaff, setResignationModalStaff] = useState<{ type: 'doctor' | 'receptionist'; data: Doctor | Receptionist } | null>(null);
  const [relievingLetterStaff, setRelievingLetterStaff] = useState<{ type: 'doctor' | 'receptionist'; data: Doctor | Receptionist } | null>(null);

  const [timingForm, setTimingForm] = useState({
    shiftTiming: '09:00 - 17:00',
    breakTiming: '13:00 - 14:00 (Lunch Break)'
  });

  const [resignationForm, setResignationForm] = useState({
    relievedDate: new Date().toISOString().split('T')[0],
    resignationReason: 'Relocating to another city',
    customNotes: ''
  });

  const todayAppointments = appointments.filter(a => a.date === todayStr);

  const doctorAppointments = role === 'doctor' && user?.doctorId
    ? appointments.filter(a => a.doctorId === user.doctorId)
    : appointments;

  const doctorTodayAppointments = doctorAppointments.filter(a => a.date === todayStr);

  const maxRevenue = Math.max(
    ...(stats?.monthlyRevenue?.map(m => m.revenue) || [40000])
  );

  const filteredDoctors = doctors.filter(doc => {
    if (selectedDept === 'All') return true;
    return doc.specialization === selectedDept;
  });

  // Admin Counts
  const activeDoctors = doctors.filter(d => d.availabilityStatus !== 'Resigned / Relieved');
  const activeReceptionists = receptionists.filter(r => r.dutyStatus !== 'Resigned / Relieved');
  const doctorsOnBreak = doctors.filter(d => d.availabilityStatus === 'On Break');
  const receptionistsOnBreak = receptionists.filter(r => r.dutyStatus === 'On Break');
  const staffOnBreakCount = doctorsOnBreak.length + receptionistsOnBreak.length;
  const relievedDoctorsCount = doctors.filter(d => d.availabilityStatus === 'Resigned / Relieved').length;
  const relievedReceptionistsCount = receptionists.filter(r => r.dutyStatus === 'Resigned / Relieved').length;
  const totalRelievedCount = relievedDoctorsCount + relievedReceptionistsCount;

  const handleQuickDoctorStatus = async (doc: Doctor, newStatus: AvailabilityStatus) => {
    try {
      await api.updateDoctor(doc.id, { availabilityStatus: newStatus });
      success(`${doc.name} marked as ${newStatus}`);
      doc.availabilityStatus = newStatus;
      onDataChanged?.();
    } catch (err: any) {
      error('Failed to update doctor status');
    }
  };

  const handleQuickBreakToggle = async (type: 'doctor' | 'receptionist', staff: Doctor | Receptionist) => {
    try {
      if (type === 'doctor') {
        const doc = staff as Doctor;
        const newStatus: AvailabilityStatus = doc.availabilityStatus === 'On Break' ? 'Available' : 'On Break';
        await api.updateDoctor(doc.id, { availabilityStatus: newStatus });
        success(`${doc.name} ${newStatus === 'On Break' ? 'sent on break interval' : 'resumed OPD consultations'}`);
      } else {
        const rec = staff as Receptionist;
        const newStatus: StaffDutyStatus = rec.dutyStatus === 'On Break' ? 'On Duty' : 'On Break';
        await api.updateReceptionist(rec.id, { dutyStatus: newStatus });
        success(`${rec.name} ${newStatus === 'On Break' ? 'sent on break interval' : 'resumed front desk duty'}`);
      }
      onDataChanged?.();
    } catch (err: any) {
      error('Failed to update break status');
    }
  };

  const handleSaveTiming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timingModalStaff) return;
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
      success(`Updated shift & break timings for ${timingModalStaff.data.name}`);
      setTimingModalStaff(null);
      onDataChanged?.();
    } catch (err: any) {
      error('Failed to update shift and break timings');
    }
  };

  const handleProcessResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resignationModalStaff) return;
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
      const resignedData = {
        ...resignationModalStaff.data,
        relievedDate: resignationForm.relievedDate,
        resignationReason: fullReason
      };
      const resignedType = resignationModalStaff.type;
      setResignationModalStaff(null);
      onDataChanged?.();
      setRelievingLetterStaff({ type: resignedType, data: resignedData as any });
    } catch (err: any) {
      error(err.message || 'Failed to process hospital exit');
    }
  };

  return (
    <div className="space-y-7">
      {/* 1. Grand Trustable Hospital Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-teal-100 bg-white">
        {/* Big Hospital Facility Picture */}
        <div className="absolute inset-0 z-0">
          <img 
            src={HOSPITAL_IMAGES.exterior} 
            alt="Nexus Care Multispecialty Hospital Campus" 
            className="w-full h-full object-cover object-center filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-950/95 via-teal-950/85 to-slate-900/60" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 md:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            {/* Trust Accreditations Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>NABH Accredited Hospital</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/25 text-cyan-200 border border-cyan-400/30 backdrop-blur-md">
                <FileCheck2 className="w-3.5 h-3.5 text-cyan-300" />
                <span>NABL Certified Diagnostic Labs</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/25 text-amber-200 border border-amber-400/30 backdrop-blur-md">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>ISO 9001:2015 Quality Care</span>
              </span>
            </div>

            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              Nexus Care Multispecialty Hospital & Research Centre
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-2.5 leading-relaxed font-medium">
              {role === 'doctor'
                ? `Welcome Dr. ${doctor?.name || user?.name}! You have ${doctorTodayAppointments.length} consultation(s) scheduled in your OPD queue today. Patient electronic medical records are synchronized.`
                : role === 'admin'
                ? `Hospital Administrative Command: Managing ${activeDoctors.length} specialist doctors, ${activeReceptionists.length} front-desk receptionists, and 6 specialized clinical departments under strict National Medical Commission (NMC) protocols.`
                : 'Welcome to the clinical workstation! Register incoming patients, match chief complaints with certified Indian medical specialists, and manage OPD queues seamlessly.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-teal-200/90 pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-teal-300" /> Main Campus Wing (250 Beds)
              </span>
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-300" /> Emergency Hotline: 108 / +91 22 2844 9900
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-300" /> 24x7 Critical Care Response
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap md:flex-col items-stretch gap-2.5 shrink-0">
            {role === 'admin' ? (
              <>
                <button
                  onClick={() => onNavigateToStaff ? onNavigateToStaff('doctors', 'doctor') : onNavigateTab('staff')}
                  className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white shadow-lg shadow-teal-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>+ Add Specialist Doctor</span>
                </button>
                <button
                  onClick={() => onNavigateToStaff ? onNavigateToStaff('receptionists', 'receptionist') : onNavigateTab('staff')}
                  className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-white text-teal-950 hover:bg-teal-50 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span>+ Add Receptionist</span>
                </button>
                <button
                  onClick={() => onNavigateToStaff ? onNavigateToStaff('timing') : onNavigateTab('staff')}
                  className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>Shifts & Breaks Board</span>
                </button>
              </>
            ) : role === 'receptionist' ? (
              <>
                <button
                  onClick={() => onNavigateTab('reception')}
                  className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-teal-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Patient Intake & Triage</span>
                </button>
                <button
                  onClick={() => onNavigateTab('appointments')}
                  className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>View OPD Schedule</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigateTab('appointments')}
                className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>My Appointments Queue</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Official Medical Director's Trust & Quality Assurance Note */}
      <div className="bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/70 rounded-3xl p-6 sm:p-7 border border-teal-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Dr. Alok Nath Portrait */}
            <div className="relative shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&q=80" 
                alt="Dr. Alok Nath - Medical Superintendent"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-3 ring-teal-500/30 shadow-md"
              />
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-full border border-teal-300/60">
                  Medical Director's Quality Assurance Note
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Reg. DHS-MH-2026-9811
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-slate-900 text-lg sm:text-xl">
                Dr. Alok Nath, MBBS, MD (Internal Med), FICP
              </h3>
              <p className="text-xs font-semibold text-teal-700">
                Medical Superintendent & Head of Clinical Governance • Nexus Care
              </p>
              <p className="text-xs text-slate-600 mt-2 max-w-3xl leading-relaxed italic">
                “At Nexus Care, our clinical protocol is founded upon compassionate care, evidence-based Indian Medical Council (NMC) guidelines, and zero diagnostic delay. Every patient record, specialist assignment, and electronic prescription is reviewed under multi-tier quality checks to guarantee safety, clinical accuracy, and patient dignity.”
              </p>
            </div>
          </div>

          {/* Official Verification Seal Stamp */}
          <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-teal-600/50 bg-white/80 text-teal-900 text-center shadow-2xs">
            <ShieldCheck className="w-6 h-6 text-teal-600 mb-1" />
            <span className="text-[11px] font-extrabold font-heading tracking-wide">CLINICALLY VERIFIED</span>
            <span className="text-[9px] text-slate-500 font-mono">AUDIT ID: NC-2026-QA</span>
          </div>
        </div>

        {/* 4 Trust Metrics Strip */}
        <div className="mt-5 pt-4 border-t border-teal-100/90 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white/90 p-3 rounded-2xl border border-teal-100 shadow-2xs">
            <div className="font-heading text-lg font-black text-teal-800">99.4%</div>
            <div className="text-[11px] text-slate-500 font-semibold">Patient Trust Rating</div>
          </div>
          <div className="bg-white/90 p-3 rounded-2xl border border-teal-100 shadow-2xs">
            <div className="font-heading text-lg font-black text-emerald-700">&lt;10 Mins</div>
            <div className="text-[11px] text-slate-500 font-semibold">Average Triage Time</div>
          </div>
          <div className="bg-white/90 p-3 rounded-2xl border border-teal-100 shadow-2xs">
            <div className="font-heading text-lg font-black text-cyan-800">100% Certified</div>
            <div className="text-[11px] text-slate-500 font-semibold">NMC Registered Faculty</div>
          </div>
          <div className="bg-white/90 p-3 rounded-2xl border border-teal-100 shadow-2xs">
            <div className="font-heading text-lg font-black text-purple-800">Zero-Error</div>
            <div className="text-[11px] text-slate-500 font-semibold">Electronic Rx Protocol</div>
          </div>
        </div>
      </div>

      {/* SPECIAL: ADMIN HOSPITAL OPERATIONS & STAFF ADMINISTRATION CENTER (FOR ADMIN USER) */}
      {isAdmin && (
        <div className="bg-gradient-to-br from-white via-teal-50/40 to-emerald-50/50 rounded-3xl p-5 sm:p-7 border-2 border-teal-300 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-teal-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-300">
                  Hospital Administration & HR Console
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Medical Superintendent Desk
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-slate-900 text-lg sm:text-xl mt-1">
                Doctors & Receptionists Duty Roster, Timings & Resignations
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Add doctors and receptionists, assign shift timings, send staff on break, and process official hospital leaving / resignation clearances.
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5" />
                <span>{staffOnBreakCount} Staff on Break</span>
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                <LogOut className="w-3.5 h-3.5" />
                <span>{totalRelievedCount} Left Hospital</span>
              </span>
              {onOpenJavaModal && (
                <button
                  onClick={onOpenJavaModal}
                  className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500 text-white hover:bg-amber-600 shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>🎓 Java & SQL Viva Hub</span>
                </button>
              )}
            </div>
          </div>

          {/* ADMIN MONITOR OPERATIONS (SQL SELECT QUERIES) WIDGET */}
          <div className="p-4 rounded-2xl bg-white border border-teal-200 shadow-2xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                  Monitor Operations (SQL SELECT)
                </span>
                <span className="text-xs font-bold text-slate-800">
                  Hospital Real-Time Administrative Oversight
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                SELECT total_admitted, available_beds, total_revenue
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <div className="text-lg font-black text-blue-900 font-heading">
                  {patients.filter(p => p.admissionStatus === 'Admitted').length}
                </div>
                <div className="text-[11px] font-bold text-blue-800">Admitted Patients</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">SELECT COUNT(*) Admitted</div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-lg font-black text-emerald-900 font-heading">
                  {stats?.availableBeds ?? 4}
                </div>
                <div className="text-[11px] font-bold text-emerald-800">Available Beds</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">SELECT COUNT(*) Beds</div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
                <div className="text-lg font-black text-purple-900 font-heading">
                  ₹{(stats?.totalRevenue || bills.reduce((acc, b) => acc + (b.paymentStatus === 'Paid' ? b.totalAmount : 0), 0)).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] font-bold text-purple-800">Total Hospital Revenue</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">SELECT SUM(total_amount)</div>
              </div>

              <div 
                onClick={() => onNavigateToDischargedPatients ? onNavigateToDischargedPatients() : onNavigateTab('patients')}
                className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-50 border border-purple-300 hover:border-purple-500 transition-all cursor-pointer group"
              >
                <div className="text-lg font-black text-purple-900 font-heading group-hover:scale-105 transition-transform">
                  {patients.filter(p => p.admissionStatus === 'Discharged').length}
                </div>
                <div className="text-[11px] font-bold text-purple-900 flex items-center justify-center gap-1">
                  <span>Discharged Patients</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
                <div className="text-[9px] text-purple-700 font-mono mt-0.5">Click for Master View</div>
              </div>
            </div>
          </div>

          {/* 4 Admin Fast-Track Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Add Doctor */}
            <div 
              onClick={() => onNavigateToStaff ? onNavigateToStaff('doctors', 'doctor') : onNavigateTab('staff')}
              className="bg-white rounded-2xl p-4 border border-teal-200 hover:border-teal-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                  + Add Specialist (INSERT)
                </span>
              </div>
              <h4 className="font-heading font-bold text-slate-900 text-sm mt-3">
                Register New Doctor
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                SQL INSERT into doctors & users credentials tables.
              </p>
            </div>

            {/* Card 2: Add Receptionist */}
            <div 
              onClick={() => onNavigateToStaff ? onNavigateToStaff('receptionists', 'receptionist') : onNavigateTab('staff')}
              className="bg-white rounded-2xl p-4 border border-cyan-200 hover:border-cyan-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md">
                  + Add Receptionist (INSERT)
                </span>
              </div>
              <h4 className="font-heading font-bold text-slate-900 text-sm mt-3">
                Register Front-Desk Staff
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                SQL INSERT for receptionist login and counter assignment.
              </p>
            </div>

            {/* Card 3: View Discharged Patients Master View */}
            <div 
              onClick={() => onNavigateToDischargedPatients ? onNavigateToDischargedPatients() : onNavigateTab('patients')}
              className="bg-white rounded-2xl p-4 border border-purple-200 hover:border-purple-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md">
                  Master View (SELECT)
                </span>
              </div>
              <h4 className="font-heading font-bold text-slate-900 text-sm mt-3">
                View Discharged Patients
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Master SELECT history of all treated, billed, and discharged cases.
              </p>
            </div>

            {/* Card 4: Process Resignations / Exits */}
            <div 
              onClick={() => onNavigateToStaff ? onNavigateToStaff('exits') : onNavigateTab('staff')}
              className="bg-white rounded-2xl p-4 border border-rose-200 hover:border-rose-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md">
                  {totalRelievedCount} Relieved (DELETE)
                </span>
              </div>
              <h4 className="font-heading font-bold text-slate-900 text-sm mt-3">
                Staff Offboarding & Relieving
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Process resignations, execute SQL DELETE, and print relieving certificates.
              </p>
            </div>
          </div>

          {/* Live Staff Shift, Break & Exit Table on Dashboard */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Live Hospital Duty & Break Roster (Doctors & Receptionists)</span>
              </h4>
              <button
                onClick={() => onNavigateTab('staff')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Staff HR Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Staff Member</th>
                    <th className="py-2.5 px-3">Role & Dept</th>
                    <th className="py-2.5 px-3">Room / Counter</th>
                    <th className="py-2.5 px-3">Shift Hours</th>
                    <th className="py-2.5 px-3">Break Interval</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Admin Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Top On-duty Doctors */}
                  {doctors.slice(0, 4).map(doc => {
                    const isOnBreak = doc.availabilityStatus === 'On Break';
                    const isRelieved = doc.availabilityStatus === 'Resigned / Relieved';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={doc.avatar || DOCTOR_AVATARS[doc.id] || DOCTOR_AVATARS.default}
                              alt={doc.name}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <span className="font-bold text-slate-900">{doc.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-teal-700">
                          Dr. ({doc.specialization})
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {doc.roomNumber}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800">
                          {doc.shiftTiming || '09:00 - 17:00'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[10px]">
                            {doc.breakTiming || '13:00 - 14:00 (Lunch)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isRelieved
                              ? 'bg-rose-100 text-rose-800'
                              : isOnBreak
                              ? 'bg-amber-100 text-amber-800'
                              : doc.availabilityStatus === 'Available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-cyan-100 text-cyan-800'
                          }`}>
                            {doc.availabilityStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {!isRelieved ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleQuickBreakToggle('doctor', doc)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                  isOnBreak
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                }`}
                                title="Toggle break status"
                              >
                                {isOnBreak ? 'End Break' : 'Start Break'}
                              </button>

                              <button
                                onClick={() => {
                                  setTimingModalStaff({ type: 'doctor', data: doc });
                                  setTimingForm({
                                    shiftTiming: doc.shiftTiming || '09:00 - 17:00',
                                    breakTiming: doc.breakTiming || '13:00 - 14:00 (Lunch Break)'
                                  });
                                }}
                                className="p-1 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                                title="Edit Timings"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setResignationModalStaff({ type: 'doctor', data: doc });
                                  setResignationForm({
                                    relievedDate: new Date().toISOString().split('T')[0],
                                    resignationReason: 'Relocating to another city',
                                    customNotes: ''
                                  });
                                }}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer flex items-center gap-0.5"
                                title="When Doctor Wants to Leave Hospital"
                              >
                                <LogOut className="w-3 h-3 text-rose-600" />
                                <span>Leaving</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRelievingLetterStaff({ type: 'doctor', data: doc })}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 cursor-pointer"
                            >
                              Relieving Letter
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Top Receptionists */}
                  {receptionists.slice(0, 2).map(rec => {
                    const isOnBreak = rec.dutyStatus === 'On Break';
                    const isRelieved = rec.dutyStatus === 'Resigned / Relieved';

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={rec.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80'}
                              alt={rec.name}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <span className="font-bold text-slate-900">{rec.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-cyan-800">
                          Receptionist ({rec.shift})
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {rec.deskNumber}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800">
                          {rec.shiftTiming || '08:00 - 14:00'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[10px]">
                            {rec.breakTiming || '11:30 - 12:00'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isRelieved
                              ? 'bg-rose-100 text-rose-800'
                              : isOnBreak
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {rec.dutyStatus || 'On Duty'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {!isRelieved ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleQuickBreakToggle('receptionist', rec)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                  isOnBreak
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                }`}
                                title="Toggle break status"
                              >
                                {isOnBreak ? 'End Break' : 'Start Break'}
                              </button>

                              <button
                                onClick={() => {
                                  setTimingModalStaff({ type: 'receptionist', data: rec });
                                  setTimingForm({
                                    shiftTiming: rec.shiftTiming || '08:00 - 14:00',
                                    breakTiming: rec.breakTiming || '11:30 - 12:00 (Tea & Lunch)'
                                  });
                                }}
                                className="p-1 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                                title="Edit Timings"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setResignationModalStaff({ type: 'receptionist', data: rec });
                                  setResignationForm({
                                    relievedDate: new Date().toISOString().split('T')[0],
                                    resignationReason: 'Higher Studies / Full-time degree',
                                    customNotes: ''
                                  });
                                }}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer flex items-center gap-0.5"
                                title="When Receptionist Wants to Leave Hospital"
                              >
                                <LogOut className="w-3 h-3 text-rose-600" />
                                <span>Leaving</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRelievingLetterStaff({ type: 'receptionist', data: rec })}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 cursor-pointer"
                            >
                              Relieving Letter
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SPECIAL: Doctor's Dedicated Workstation & Patient Queue (If Logged In As Doctor) */}
      {role === 'doctor' && (
        <div className="bg-gradient-to-br from-teal-50 via-emerald-50/60 to-white rounded-3xl p-5 sm:p-7 border-2 border-teal-300 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-teal-200">
            <div className="flex items-center gap-3.5">
              <img
                src={doctor?.avatar || DOCTOR_AVATARS[doctor?.id || 'doc-1'] || DOCTOR_AVATARS.default}
                alt={doctor?.name || user?.name}
                className="w-14 h-14 rounded-2xl object-cover ring-3 ring-teal-500/40 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                    Doctor's Active Clinical Suite
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    OPD Chamber {doctor?.roomNumber || 'OPD-101'}
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-slate-900 text-lg sm:text-xl">
                  {doctor?.name || user?.name}
                </h3>
                <p className="text-xs text-teal-800 font-medium">
                  {doctor?.specialization || 'Clinical Specialist'} • {doctor?.qualifications || 'MBBS, MD'} • Fee: ₹{doctor?.consultationFee || 800}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-bold text-slate-600">Duty Status:</span>
              <select
                value={doctor?.availabilityStatus || 'Available'}
                onChange={(e) => doctor && handleQuickDoctorStatus(doctor, e.target.value as AvailabilityStatus)}
                className="text-xs font-bold py-1.5 px-3 rounded-xl border border-teal-300 bg-white text-teal-900 cursor-pointer shadow-2xs"
              >
                <option value="Available">Available for OPD</option>
                <option value="In Consultation">In Consultation</option>
                <option value="On Break">On Break</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-teal-600" />
                <span>My Patient Consultation Queue ({doctorAppointments.length} total assigned)</span>
              </h4>
              <button
                onClick={() => onNavigateTab('appointments')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Appointment Desk</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {doctorAppointments.slice(0, 6).map((app) => {
                const pat = patients.find(p => p.id === app.patientId);
                const isCompleted = app.status === 'Completed';

                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl bg-white border border-teal-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {app.date} • {app.time} HRS
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <h5 className="font-bold text-slate-900 text-sm">{pat?.name || 'Patient'}</h5>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {pat?.gender}, {pat?.age} yrs • {pat?.phone}
                        </p>
                      </div>

                      <div className="mt-2 p-2 rounded-xl bg-teal-50 text-[11px] text-teal-900 font-medium">
                        <strong>Chief Complaint:</strong> {app.syndrome}
                        {app.notes && <div className="text-slate-600 text-[10px] mt-0.5 line-clamp-1">{app.notes}</div>}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {app.diagnosis ? 'Dx: ' + app.diagnosis.slice(0, 20) + '...' : 'Pending consult'}
                      </span>
                      <button
                        onClick={() => onOpenDoctorConsultation && onOpenDoctorConsultation(app)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>{isCompleted ? 'Review Rx' : 'Consult Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Stat 1: Total Patients */}
        <div 
          onClick={() => onNavigateTab('patients')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Patients
            </span>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats?.totalPatients || patients.length}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Active
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">Verified Electronic Health Records</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Stat 2: Today's Appointments */}
        <div 
          onClick={() => onNavigateTab('appointments')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-cyan-300 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Today's Appointments
            </span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats?.todayAppointmentsCount || todayAppointments.length}
            </span>
            <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full">
              {todayAppointments.filter(a => a.status === 'Completed').length} done
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {todayAppointments.filter(a => a.status === 'Scheduled').length} upcoming in queue
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Stat 3: Available Doctors */}
        <div 
          onClick={() => onNavigateTab('doctors')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Specialists On Duty
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats?.availableDoctors || activeDoctors.filter(d => d.availabilityStatus === 'Available').length}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              / {stats?.totalDoctors || doctors.length} total
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">Active in outpatient wings</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Stat 4: Total Revenue */}
        <div 
          onClick={() => onNavigateTab('billing')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ₹{(stats?.totalRevenue || bills.reduce((acc, b) => acc + (b.paymentStatus === 'Paid' ? b.totalAmount : 0), 0)).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            ₹{(stats?.pendingRevenue || bills.reduce((acc, b) => acc + (b.paymentStatus === 'Pending' ? b.totalAmount : 0), 0)).toLocaleString('en-IN')} pending clearance
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* 4. DOCTOR SECTION & SPECIALIST FACULTY CARDS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Outpatient Department
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                NMC Board-Certified Consultants
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-slate-900 text-lg sm:text-xl mt-1">
              Nexus Care Specialist Faculty & OPD Rosters
            </h3>
            <p className="text-xs text-slate-500">
              Explore consultant profiles, active chamber assignments, shift hours, and instant OPD booking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('doctors')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors self-start sm:self-center cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Full Doctor Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedDept === dept
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {dept === 'All' ? 'All Specialists (6)' : dept}
            </button>
          ))}
        </div>

        {/* Doctor Cards Grid */}
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
                className={`rounded-3xl p-5 border transition-all flex flex-col justify-between group ${
                  isRelieved
                    ? 'border-slate-200/60 bg-slate-50/50 opacity-80'
                    : isOnBreak
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200/90 hover:border-teal-300 hover:shadow-md bg-gradient-to-b from-white via-slate-50/30 to-white'
                }`}
              >
                <div>
                  {/* Portrait & Title */}
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
                        <h4 className="font-heading font-extrabold text-slate-900 text-base leading-tight group-hover:text-teal-900 transition-colors">
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

                  {/* Relieved notice if left hospital */}
                  {isRelieved && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                      <strong>Left Hospital:</strong> {doc.resignationReason || 'Resigned'}
                      {doc.relievedDate && <div className="text-[10px] text-rose-700">Relieved: {doc.relievedDate}</div>}
                    </div>
                  )}

                  {/* Doctor Info Details */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{doc.qualifications}</span>
                      <span className="text-slate-400">• {doc.experienceYears} yrs exp</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Chamber: <strong className="text-slate-800">{doc.roomNumber}</strong></span>
                    </div>

                    {/* Shift & Break Timings */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> Shift:
                        </span>
                        <strong className="text-slate-800 font-mono">{doc.shiftTiming || '09:00 - 17:00'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Coffee className="w-3.5 h-3.5 text-amber-500" /> Break:
                        </span>
                        <strong className="text-amber-800">{doc.breakTiming || '13:00 - 14:00 (Lunch)'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-mono">{doc.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Fee, Admin Controls or Quick Book */}
                <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Consultation Fee</div>
                      <div className="font-heading text-lg font-black text-slate-900">
                        ₹{doc.consultationFee}
                      </div>
                    </div>

                    {/* Right action button */}
                    {!isRelieved ? (
                      <button
                        onClick={() => {
                          if (onBookDoctor) {
                            onBookDoctor(doc);
                          } else {
                            onNavigateTab('appointments');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Slot</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                        Relieved
                      </span>
                    )}
                  </div>

                  {/* Admin Fast Actions on Card */}
                  {isAdmin && !isRelieved && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => handleQuickBreakToggle('doctor', doc)}
                        className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                          isOnBreak
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {isOnBreak ? 'Resume OPD' : 'Start Break'}
                      </button>

                      <button
                        onClick={() => {
                          setResignationModalStaff({ type: 'doctor', data: doc });
                          setResignationForm({
                            relievedDate: new Date().toISOString().split('T')[0],
                            resignationReason: 'Relocating to another city',
                            customNotes: ''
                          });
                        }}
                        className="px-2 py-1 rounded-lg font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Leaving</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Hospital Facilities Showcase Cards */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-extrabold text-slate-900 text-base sm:text-lg">
              Nexus Care Clinical Wings & State-of-the-Art Infrastructure
            </h3>
            <p className="text-xs text-slate-500">
              Modern patient examination chambers, certified diagnostic laboratories, and emergency suites
            </p>
          </div>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80">
            6 Specialized Departments
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
            <img
              src={HOSPITAL_IMAGES.consultation}
              alt="Nexus Care Consultation Rooms"
              className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent p-3.5 flex flex-col justify-end text-white">
              <span className="text-xs font-bold font-heading">Specialist OPD Suites</span>
              <span className="text-[11px] text-teal-200">Cardiology, Neurology, Orthopedics</span>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
            <img
              src={HOSPITAL_IMAGES.laboratory}
              alt="Nexus Care Clinical Lab"
              className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent p-3.5 flex flex-col justify-end text-white">
              <span className="text-xs font-bold font-heading">NABL Pathology & Diagnostic Labs</span>
              <span className="text-[11px] text-cyan-200">Blood panels, Glycemic, Allergy screening</span>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
            <img
              src={HOSPITAL_IMAGES.inpatient}
              alt="Nexus Care Recovery Wing"
              className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent p-3.5 flex flex-col justify-end text-white">
              <span className="text-xs font-bold font-heading">Emergency & Daycare Wing</span>
              <span className="text-[11px] text-emerald-200">Post-trauma care and vital monitoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Appointments by Department / Specialization */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-extrabold text-slate-900 text-sm sm:text-base">
                Appointments by Specialization
              </h3>
              <p className="text-xs text-slate-500">
                Patient caseload distribution across clinical departments
              </p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/80">
              Department OPDs
            </span>
          </div>

          <div className="space-y-3.5">
            {stats?.appointmentsBySpecialization?.map((item) => {
              const totalApps = Math.max(1, appointments.length);
              const percentage = Math.round((item.count / totalApps) * 100);

              return (
                <div key={item.specialization} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      {item.specialization}
                    </span>
                    <span className="text-slate-500 font-mono font-medium">
                      {item.count} appts ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(8, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Monthly Revenue */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-extrabold text-slate-900 text-sm sm:text-base">
                Monthly Billing Proceeds
              </h3>
              <p className="text-xs text-slate-500">
                Revenue progression across the current fiscal cycle
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              FY 2026
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
            {stats?.monthlyRevenue?.map((m) => {
              const heightPct = Math.round((m.revenue / maxRevenue) * 100);

              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[11px] font-mono font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">
                    ₹{(m.revenue / 1000).toFixed(0)}k
                  </div>
                  <div className="w-full bg-slate-100 rounded-2xl h-28 flex items-end p-1">
                    <div
                      className="w-full bg-gradient-to-t from-teal-600 to-emerald-400 rounded-xl group-hover:from-teal-500 group-hover:to-emerald-300 transition-all duration-300 shadow-2xs"
                      style={{ height: `${Math.max(12, heightPct)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. Recent Appointments Queue Snapshot */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-extrabold text-slate-900 text-sm sm:text-base">
              Today's Consultation Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Real-time outpatient consultation flow for {todayStr}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('appointments')}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Full Appointments Table</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Specialist Doctor</th>
                  <th className="py-2.5 px-3">Syndrome</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayAppointments.slice(0, 5).map((app) => {
                  const pat = patients.find(p => p.id === app.patientId);
                  const doc = doctors.find(d => d.id === app.doctorId);
                  const isCompleted = app.status === 'Completed';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {app.time} HRS
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {pat?.name}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800">{doc?.name}</span>
                        <span className="text-[11px] text-teal-700 block">{doc?.specialization}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-medium text-[11px]">
                          {app.syndrome}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'Scheduled'
                              ? 'bg-cyan-100 text-cyan-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            if (role === 'doctor' && onOpenDoctorConsultation) {
                              onOpenDoctorConsultation(app);
                            } else {
                              onNavigateTab('appointments');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-teal-700 hover:bg-teal-50 border border-teal-200/80 cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No consultations booked for today yet.
          </div>
        )}
      </div>

      {/* DASHBOARD EDIT TIMING MODAL */}
      {timingModalStaff && (
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
                  <p className="text-xs text-slate-500">{timingModalStaff.data.name}</p>
                </div>
              </div>
              <button
                onClick={() => setTimingModalStaff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTiming} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Duty Shift Hours
                </label>
                <input
                  type="text"
                  value={timingForm.shiftTiming}
                  onChange={(e) => setTimingForm({ ...timingForm, shiftTiming: e.target.value })}
                  placeholder="09:00 - 17:00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Designated Break Interval
                </label>
                <input
                  type="text"
                  value={timingForm.breakTiming}
                  onChange={(e) => setTimingForm({ ...timingForm, breakTiming: e.target.value })}
                  placeholder="13:00 - 14:00 (Lunch Break)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTimingModalStaff(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  Save Shift & Break
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD RESIGNATION / LEAVING HOSPITAL MODAL */}
      {resignationModalStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                    Process Hospital Exit / Resignation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Relieving clearance for {resignationModalStaff.data.name} ({resignationModalStaff.type})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResignationModalStaff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessResignation} className="space-y-4">
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
                  <option value="Health / Medical Leave of Absence">Health / Medical Leave of Absence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Handover Notes
                </label>
                <textarea
                  rows={2}
                  value={resignationForm.customNotes}
                  onChange={(e) => setResignationForm({ ...resignationForm, customNotes: e.target.value })}
                  placeholder="e.g. Returned ID badge and keys; duties reassigned."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Confirm Hospital Exit & Relieve</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RELIEVING CERTIFICATE MODAL */}
      {relievingLetterStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Official Document
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  REF: NC/HR/REL/{relievingLetterStaff.data.id.toUpperCase()}-2026
                </span>
              </div>
              <button
                onClick={() => setRelievingLetterStaff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  <div>Date: <strong>{relievingLetterStaff.data.relievedDate || new Date().toISOString().split('T')[0]}</strong></div>
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
                  This is to certify that <strong>{relievingLetterStaff.data.name}</strong> was employed with <strong>Nexus Care Multispecialty Hospital</strong> as <strong>{relievingLetterStaff.type === 'doctor' ? `Consultant ${(relievingLetterStaff.data as Doctor).specialization}` : `Front-Desk Receptionist (${(relievingLetterStaff.data as Receptionist).shift} Shift)`}</strong>.
                </p>
                <p>
                  During the tenure of service, {relievingLetterStaff.data.name} performed all assigned duties with exceptional dedication, clinical diligence, and integrity.
                </p>
                <p>
                  <strong>{relievingLetterStaff.data.name}</strong> has been officially relieved of all hospital duties on <strong>{relievingLetterStaff.data.relievedDate || 'Effective Immediately'}</strong>. All organizational clearances have been completed satisfactorily.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-800">Reason for Relieving as per Hospital Records:</div>
                  <div className="text-slate-600 mt-0.5">{relievingLetterStaff.data.resignationReason || 'Resigned on personal grounds'}</div>
                </div>
                <p>
                  We wish {relievingLetterStaff.data.name} the very best in all future medical and professional endeavors.
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
                onClick={() => setRelievingLetterStaff(null)}
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
    </div>
  );
};
