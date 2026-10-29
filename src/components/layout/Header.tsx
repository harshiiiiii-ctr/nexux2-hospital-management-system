import React, { useState } from 'react';
import { 
  Building2, 
  LogOut, 
  RotateCcw, 
  UserCheck, 
  Shield, 
  Stethoscope, 
  ChevronDown, 
  Sparkles, 
  HeartPulse, 
  Menu,
  ShieldCheck,
  FileText,
  PhoneCall,
  Activity,
  Award,
  Calendar,
  Users,
  Receipt,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  onToggleSidebar: () => void;
  onRefreshData?: () => void;
  onSelectTab?: (tab: ActiveTab) => void;
  onOpenInfo?: (title: string, category: string, content: React.ReactNode) => void;
  onSwitchToSwing?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  onRefreshData,
  onSelectTab,
  onOpenInfo,
  onSwitchToSwing
}) => {
  const { user, doctor, logout, quickLogin } = useAuth();
  const { success, error, info } = useToast();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Nav Dropdowns state matching User Screenshot 2
  const [activeNavDropdown, setActiveNavDropdown] = useState<'basics' | 'healthPlans' | 'providers' | null>(null);

  const handleResetData = async () => {
    if (!window.confirm('Reset all hospital records to default clinical sample data?')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetData();
      success('Database successfully reset to default sample dataset!');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      error(err.message || 'Failed to reset database');
    } finally {
      setIsResetting(false);
    }
  };

  const handleRoleSwitch = async (role: 'admin' | 'receptionist' | 'doctor') => {
    setIsRoleDropdownOpen(false);
    try {
      await quickLogin(role);
      info(`Switched active view to ${role.toUpperCase()}`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      error('Failed to switch role');
    }
  };

  const navigateTo = (tab: ActiveTab) => {
    setActiveNavDropdown(null);
    if (onSelectTab) onSelectTab(tab);
  };

  const showModal = (title: string, category: string, content: React.ReactNode) => {
    setActiveNavDropdown(null);
    if (onOpenInfo) {
      onOpenInfo(title, category, content);
    }
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
            <Shield className="w-3.5 h-3.5 text-violet-600" /> Admin
          </span>
        );
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> {doctor?.specialization || 'Doctor'}
          </span>
        );
      case 'receptionist':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <UserCheck className="w-3.5 h-3.5 text-teal-600" /> Receptionist
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-teal-100/90 shadow-xs transition-shadow">
      {/* Top Header Bar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 lg:hidden transition-colors cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                  Nexus Care
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
                  Hospital System
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Multi-Specialty Medical Centre & Clinical Workstation
              </p>
            </div>
          </div>
        </div>

        {/* Center / Navigation Dropdowns (Exactly matching User Screenshot 2) */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-semibold text-teal-900">
          
          {/* Dropdown 1: Basics ∨ */}
          <div className="relative">
            <button
              onClick={() => setActiveNavDropdown(activeNavDropdown === 'basics' ? null : 'basics')}
              className={`flex items-center gap-1 py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeNavDropdown === 'basics'
                  ? 'bg-teal-50 text-teal-700 shadow-2xs'
                  : 'text-teal-900 hover:text-teal-700 hover:bg-slate-50'
              }`}
            >
              <span>Basics</span>
              <ChevronDown className={`w-4 h-4 text-teal-700 transition-transform ${activeNavDropdown === 'basics' ? 'rotate-180' : ''}`} />
            </button>

            {activeNavDropdown === 'basics' && (
              <div 
                className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setActiveNavDropdown(null)}
              >
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Hospital Basics
                </div>
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>Hospital Overview & Wings</span>
                </button>
                <button
                  onClick={() => navigateTo('reception')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Clinical Triage Protocol</span>
                </button>
                <button
                  onClick={() => showModal(
                    'Patient Rights & Ethical Charter',
                    'Clinical Governance',
                    <div className="space-y-2">
                      <p>Every patient at Nexus Care is entitled to respectful care, complete medical transparency, informed consent, and protected electronic health records.</p>
                      <p>NABH Quality Reference: Core Standard CQI.3</p>
                    </div>
                  )}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Patient Rights & Responsibilities</span>
                </button>
                <button
                  onClick={() => showModal(
                    '24/7 Emergency & Critical Care',
                    'Trauma Division',
                    <div className="space-y-2">
                      <p className="font-bold text-rose-700">Dial 108 for Emergency Trauma Dispatch</p>
                      <p>Nexus Care Level-3 trauma unit is equipped with continuous vitals monitoring, oxygen resuscitation, and immediate cardiac catheterization support.</p>
                    </div>
                  )}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors font-medium"
                >
                  <PhoneCall className="w-4 h-4 text-rose-600" />
                  <span>Emergency Hotline: 108</span>
                </button>
              </div>
            )}
          </div>

          {/* Dropdown 2: Health & Drug Plans ∨ */}
          <div className="relative">
            <button
              onClick={() => setActiveNavDropdown(activeNavDropdown === 'healthPlans' ? null : 'healthPlans')}
              className={`flex items-center gap-1 py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeNavDropdown === 'healthPlans'
                  ? 'bg-teal-50 text-teal-700 shadow-2xs'
                  : 'text-teal-900 hover:text-teal-700 hover:bg-slate-50'
              }`}
            >
              <span>Health & Drug Plans</span>
              <ChevronDown className={`w-4 h-4 text-teal-700 transition-transform ${activeNavDropdown === 'healthPlans' ? 'rotate-180' : ''}`} />
            </button>

            {activeNavDropdown === 'healthPlans' && (
              <div 
                className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setActiveNavDropdown(null)}
              >
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Clinical Services & Pharmacy
                </div>
                <button
                  onClick={() => navigateTo('doctors')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>6 Multi-Specialty OPD Clinics</span>
                </button>
                <button
                  onClick={() => navigateTo('billing')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Receipt className="w-4 h-4 text-teal-600" />
                  <span>Pharmacy Dispensary & Tax Invoices</span>
                </button>
                <button
                  onClick={() => showModal(
                    'Cashless Insurance & PM-JAY Ayushman Bharat',
                    'Healthcare Plans',
                    <div className="space-y-2">
                      <p>Nexus Care is empaneled with National Health Authority (PM-JAY Ayushman Bharat) and all major Third Party Administrators (TPAs).</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Instant e-card eligibility verification</li>
                        <li>Cashless hospitalization pre-authorizations</li>
                        <li>Standardized tariff schedule</li>
                      </ul>
                    </div>
                  )}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span>Ayushman Bharat (PM-JAY) & TPA</span>
                </button>
                <button
                  onClick={() => showModal(
                    'NABL Certified Diagnostic Lab Panels',
                    'Pathology & Radiology',
                    <p>Comprehensive preventive health packages: Master Cardiac Profile, Diabetic Glycemic Check, Lipid Profile, and Complete Hemogram available at OPD Lab Counter B-1.</p>
                  )}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Preventive Diagnostic Health Packages</span>
                </button>
              </div>
            )}
          </div>

          {/* Dropdown 3: Providers & Services ∨ */}
          <div className="relative">
            <button
              onClick={() => setActiveNavDropdown(activeNavDropdown === 'providers' ? null : 'providers')}
              className={`flex items-center gap-1 py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeNavDropdown === 'providers'
                  ? 'bg-teal-50 text-teal-700 shadow-2xs'
                  : 'text-teal-900 hover:text-teal-700 hover:bg-slate-50'
              }`}
            >
              <span>Providers & Services</span>
              <ChevronDown className={`w-4 h-4 text-teal-700 transition-transform ${activeNavDropdown === 'providers' ? 'rotate-180' : ''}`} />
            </button>

            {activeNavDropdown === 'providers' && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setActiveNavDropdown(null)}
              >
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Medical Faculty & Scheduling
                </div>
                <button
                  onClick={() => navigateTo('doctors')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>Find Board-Certified Doctors</span>
                </button>
                <button
                  onClick={() => navigateTo('reception')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Patient Intake & Syndrome Triage</span>
                </button>
                <button
                  onClick={() => navigateTo('appointments')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  <span>Schedule OPD Appointment</span>
                </button>
                <button
                  onClick={() => navigateTo('patients')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Electronic Medical Health Records</span>
                </button>
                <button
                  onClick={() => navigateTo('reports')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  <span>Clinical Governance Reports</span>
                </button>
              </div>
            )}
          </div>

        </nav>

        {/* Right Actions: Java Swing Mode, Quick Switcher, Reset Demo, User Profile, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Switch to Core Java Swing Desktop App Button */}
          {onSwitchToSwing && (
            <button
              onClick={onSwitchToSwing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300 transition-colors shadow-2xs cursor-pointer"
              title="Switch to Core Java Desktop Application (JFrame & JTable)"
            >
              <span className="text-sm">☕</span>
              <span className="hidden sm:inline">Java Swing View</span>
            </button>
          )}

          {/* Quick Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-teal-50/80 text-slate-700 hover:text-teal-900 border border-slate-200/90 hover:border-teal-200 transition-all cursor-pointer shadow-2xs"
              title="Quickly switch between Admin, Receptionist, and Doctor roles"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Role:</span>
              <span className="capitalize font-bold text-teal-700">{user?.role}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setIsRoleDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select User Role
                </div>
                <button
                  onClick={() => handleRoleSwitch('admin')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    user?.role === 'admin' ? 'bg-violet-50 text-violet-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-violet-600" />
                    Admin
                  </span>
                  <span className="text-[10px] text-slate-400">admin@medicare.com</span>
                </button>
                <button
                  onClick={() => handleRoleSwitch('receptionist')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    user?.role === 'receptionist' ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-teal-600" />
                    Receptionist
                  </span>
                  <span className="text-[10px] text-slate-400">reception@medicare.com</span>
                </button>
                <button
                  onClick={() => handleRoleSwitch('doctor')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    user?.role === 'doctor' ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    Doctor
                  </span>
                  <span className="text-[10px] text-slate-400">doctor@medicare.com</span>
                </button>
              </div>
            )}
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-teal-900 bg-white hover:bg-teal-50/50 border border-slate-200/90 hover:border-teal-200 transition-colors shadow-2xs cursor-pointer"
            title="Reset database to fresh clinical records"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Reset Demo Data</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[130px]">
                {user?.name || 'User'}
              </span>
              {getRoleBadge()}
            </div>
            {doctor?.avatar ? (
              <img
                src={doctor.avatar}
                alt={doctor.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-teal-500/30 shadow-2xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                {user?.name ? user.name[0] : 'U'}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-Header Dropdowns Bar for Tablets / Smaller Laptops */}
      <div className="xl:hidden border-t border-teal-50 px-4 py-2 flex items-center gap-4 text-xs font-semibold text-teal-900 overflow-x-auto scrollbar-none">
        <button
          onClick={() => navigateTo('dashboard')}
          className="hover:text-teal-700 shrink-0"
        >
          Basics
        </button>
        <span className="text-slate-300">•</span>
        <button
          onClick={() => navigateTo('doctors')}
          className="hover:text-teal-700 shrink-0"
        >
          Health & Drug Plans
        </button>
        <span className="text-slate-300">•</span>
        <button
          onClick={() => navigateTo('appointments')}
          className="hover:text-teal-700 shrink-0"
        >
          Providers & Services
        </button>
      </div>
    </header>
  );
};
