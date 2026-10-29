import React from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Stethoscope, 
  CalendarCheck, 
  Receipt, 
  BarChart3, 
  Sparkles,
  HeartPulse,
  X,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HOSPITAL_IMAGES } from '../../assets/images';

export type ActiveTab = 
  | 'dashboard'
  | 'reception'
  | 'patients'
  | 'doctors'
  | 'staff'
  | 'appointments'
  | 'billing'
  | 'reports';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const role = user?.role || 'receptionist';

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    allowedRoles: ('admin' | 'receptionist' | 'doctor')[];
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ['admin', 'receptionist', 'doctor']
    },
    {
      id: 'reception',
      label: 'Reception Desk',
      icon: <UserPlus className="w-4 h-4" />,
      allowedRoles: ['admin', 'receptionist'],
      badge: 'Triage'
    },
    {
      id: 'patients',
      label: 'Patient Directory',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['admin', 'receptionist', 'doctor']
    },
    {
      id: 'doctors',
      label: 'Doctor Section & Faculty',
      icon: <Stethoscope className="w-4 h-4" />,
      allowedRoles: ['admin', 'receptionist', 'doctor'],
      badge: '6 On Duty'
    },
    {
      id: 'staff',
      label: 'Staff HR & Duty Roster',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['admin'],
      badge: 'Add • Exit • Breaks'
    },
    {
      id: 'appointments',
      label: role === 'doctor' ? 'My Consultations' : 'Appointments',
      icon: <CalendarCheck className="w-4 h-4" />,
      allowedRoles: ['admin', 'receptionist', 'doctor']
    },
    {
      id: 'billing',
      label: 'Billing & Invoices',
      icon: <Receipt className="w-4 h-4" />,
      allowedRoles: ['admin', 'receptionist']
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      allowedRoles: ['admin', 'receptionist']
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container - Light, attractive, luminous modern aesthetic */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-md text-slate-700 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-200/80 shadow-xs ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-slate-900 tracking-tight text-base">Nexus Care</div>
              <div className="text-[11px] text-teal-600 font-semibold">Clinical Workstation</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hospital Facility Preview Thumbnail */}
        <div className="px-3 pt-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs group">
            <img 
              src={HOSPITAL_IMAGES.exterior} 
              alt="Nexus Care Hospital" 
              className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-2.5 flex flex-col justify-end">
              <div className="flex items-center gap-1.5 text-white text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Nexus Care Main Campus</span>
              </div>
              <span className="text-[10px] text-teal-200">24/7 Multi-Specialty Care</span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Clinical Modules
          </div>

          {navItems
            .filter(item => item.allowedRoles.includes(role))
            .map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25 ring-1 ring-teal-600/20'
                      : 'text-slate-600 hover:bg-teal-50/70 hover:text-teal-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Smart Triage Helper Card */}
        <div className="p-3 mx-3 mb-3 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50/60 border border-teal-200/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Intelligent Triage</span>
          </div>
          <p className="text-[11px] text-teal-800/80 leading-relaxed">
            Auto-matches patient syndromes with certified specialty consultants.
          </p>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="font-medium">Enterprise v2.4</span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure OPD
          </span>
        </div>
      </aside>
    </>
  );
};
