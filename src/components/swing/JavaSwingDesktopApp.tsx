import React, { useState, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { 
  Coffee, 
  Download, 
  Copy, 
  Check, 
  Search, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Layers, 
  Database, 
  Maximize2,
  Minus,
  X,
  Stethoscope,
  Bed,
  TrendingUp,
  LogOut,
  LogIn,
  UserCheck,
  Shield,
  ChevronDown,
  Globe,
  Lock,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api';
import { Doctor, Patient, SqlLogEntry, Specialization, Syndrome, AdmissionStatus, AvailabilityStatus } from '../../types';

interface JavaProjectFile {
  name: string;
  path: string;
  content: string;
  category: string;
}

interface JavaSwingDesktopAppProps {
  onSwitchToWebPortal?: () => void;
}

export const JavaSwingDesktopApp: React.FC<JavaSwingDesktopAppProps> = ({ onSwitchToWebPortal }) => {
  const { success, error, info } = useToast();
  const { user, doctor, quickLogin, logout, login } = useAuth();

  // Active Swing Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'doctors' | 'sourceCode'>('dashboard');

  // Menu bar dropdown state
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Role Switcher & Login Modal States
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Core Data States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [sqlLogs, setSqlLogs] = useState<SqlLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Patient Registration Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientGender, setNewPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientBlood, setNewPatientBlood] = useState('B+');
  const [newPatientAddress, setNewPatientAddress] = useState('Civil Lines, City Center');
  const [newPatientSyndrome, setNewPatientSyndrome] = useState<Syndrome>('Chest Pain');
  const [newPatientStatus, setNewPatientStatus] = useState<AdmissionStatus>('Outpatient');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState<'All' | AdmissionStatus>('All');

  // Doctor Directory States
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState<string>('All');
  const [doctorStatusFilter, setDoctorStatusFilter] = useState<string>('All');
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpec, setNewDoctorSpec] = useState<Specialization>('Cardiologist');
  const [newDoctorRoom, setNewDoctorRoom] = useState('OPD-107');
  const [newDoctorPhone, setNewDoctorPhone] = useState('+91 98201 78901');
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorTiming, setNewDoctorTiming] = useState('09:00 - 17:00');
  const [newDoctorFee, setNewDoctorFee] = useState('700');

  // Java Source Code Files State
  const [javaFiles, setJavaFiles] = useState<JavaProjectFile[]>([]);
  const [selectedJavaFileName, setSelectedJavaFileName] = useState<string>('HospitalSwingApp.java');
  const [copiedFile, setCopiedFile] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Load Data
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [statsData, docsData, patsData, logsData, filesData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getDoctors().catch(() => []),
        api.getPatients().catch(() => []),
        api.getSqlLogs().catch(() => []),
        api.getJavaProjectFiles().catch(() => [])
      ]);

      setStats(statsData);
      setDoctors(docsData);
      setPatients(patsData);
      setSqlLogs(logsData);
      
      // Deduplicate files by name and path to prevent any duplicate React keys
      const uniqueFiles = (filesData || []).filter(
        (file: JavaProjectFile, idx: number, arr: JavaProjectFile[]) =>
          idx === arr.findIndex((f) => f.path === file.path || f.name === file.name)
      );
      setJavaFiles(uniqueFiles);
    } catch (err: any) {
      error(err.message || 'Failed to load hospital data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtered Patients for JTable
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch = 
        p.id.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.phone.includes(patientSearch) ||
        (p.syndrome && p.syndrome.toLowerCase().includes(patientSearch.toLowerCase()));

      const patientStatus = p.admissionStatus || 'Outpatient';
      const matchesStatus = 
        patientStatusFilter === 'All' ? true : patientStatus === patientStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, patientSearch, patientStatusFilter]);

  // Filtered Doctors for JTable
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch = 
        doc.id.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        doc.phone.includes(doctorSearch);

      const matchesSpec = 
        doctorSpecialtyFilter === 'All' ? true : doc.specialization === doctorSpecialtyFilter;

      const matchesStatus = 
        doctorStatusFilter === 'All' ? true : doc.availabilityStatus === doctorStatusFilter;

      return matchesSearch && matchesSpec && matchesStatus;
    });
  }, [doctors, doctorSearch, doctorSpecialtyFilter, doctorStatusFilter]);

  // Handle Register Patient
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientPhone.trim()) {
      error('Please enter patient name and contact phone number');
      return;
    }

    try {
      const created = await api.createPatient({
        name: newPatientName.trim(),
        age: parseInt(newPatientAge) || 30,
        gender: newPatientGender,
        phone: newPatientPhone.trim(),
        bloodGroup: newPatientBlood,
        address: newPatientAddress.trim() || 'General District',
        syndrome: newPatientSyndrome,
        admissionStatus: newPatientStatus
      });

      setPatients((prev) => [created, ...prev]);
      success(`Patient ${created.name} (${created.id}) registered successfully in JTable!`);

      // Reset form
      setNewPatientName('');
      setNewPatientAge('');
      setNewPatientPhone('');

      // Refresh stats & logs
      api.getStats().then(setStats).catch(() => {});
      api.getSqlLogs().then(setSqlLogs).catch(() => {});
    } catch (err: any) {
      error(err.message || 'Failed to register patient');
    }
  };

  // Handle Discharge Patient (3-in-1 Atomic Discharge)
  const handleDischargePatient = async (patientId: string) => {
    try {
      await api.dischargePatient(patientId);
      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, admissionStatus: 'Discharged' } : p))
      );
      success(`Patient ${patientId} marked as Discharged. Bed released to Available!`);
      api.getStats().then(setStats).catch(() => {});
      api.getSqlLogs().then(setSqlLogs).catch(() => {});
    } catch (err: any) {
      error(err.message || 'Failed to discharge patient');
    }
  };

  // Handle Delete Patient
  const handleDeletePatient = async (patientId: string) => {
    if (!confirm(`Are you sure you want to remove patient ${patientId} from the database?`)) return;
    try {
      await api.deletePatient(patientId);
      setPatients((prev) => prev.filter((p) => p.id !== patientId));
      success(`Patient ${patientId} removed from JTable model`);
      api.getStats().then(setStats).catch(() => {});
      api.getSqlLogs().then(setSqlLogs).catch(() => {});
    } catch (err: any) {
      error(err.message || 'Failed to delete patient');
    }
  };

  // Handle Add Doctor
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName.trim()) {
      error('Doctor name is required');
      return;
    }

    try {
      const created = await api.createDoctor({
        name: newDoctorName.trim(),
        specialization: newDoctorSpec,
        roomNumber: newDoctorRoom.trim() || 'OPD-101',
        phone: newDoctorPhone.trim(),
        email: newDoctorEmail.trim() || `${newDoctorName.toLowerCase().replace(/[^a-z]/g, '')}@medicare.com`,
        consultationFee: parseInt(newDoctorFee) || 500,
        availabilityStatus: 'Available',
        qualifications: 'MBBS, MD',
        experienceYears: 8,
        shiftTiming: newDoctorTiming.trim() || '09:00 - 17:00'
      });

      setDoctors((prev) => [...prev, created]);
      setIsAddDoctorModalOpen(false);
      setNewDoctorName('');
      success(`Dr. ${created.name} added to Doctor Directory JTable!`);
      api.getStats().then(setStats).catch(() => {});
      api.getSqlLogs().then(setSqlLogs).catch(() => {});
    } catch (err: any) {
      error(err.message || 'Failed to add doctor');
    }
  };

  // Handle Toggle Doctor Status
  const handleToggleDoctorStatus = async (doctor: Doctor) => {
    const nextStatus: AvailabilityStatus = 
      doctor.availabilityStatus === 'Available' 
        ? 'In Consultation' 
        : doctor.availabilityStatus === 'In Consultation' 
        ? 'On Leave' 
        : 'Available';

    try {
      const updated = await api.updateDoctor(doctor.id, { availabilityStatus: nextStatus });
      setDoctors((prev) => prev.map((d) => (d.id === doctor.id ? updated : d)));
      info(`Dr. ${doctor.name} status updated to: ${nextStatus}`);
      api.getStats().then(setStats).catch(() => {});
    } catch (err: any) {
      error(err.message || 'Failed to update doctor status');
    }
  };

  // Handle 1-Click ZIP Download of Pure Java Project
  const handleDownloadJavaZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();

      if (javaFiles.length === 0) {
        const files = await api.getJavaProjectFiles();
        files.forEach((f) => zip.file(f.path, f.content));
      } else {
        javaFiles.forEach((f) => zip.file(f.path, f.content));
      }

      // Generate zip blob
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'HospitalManagementSystem-CoreJava-Swing-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      success('Pure Java Project (.ZIP) downloaded successfully! Ready for your college lab evaluation.');
    } catch (err: any) {
      error(err.message || 'Failed to generate project zip');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Copy Active Java Code
  const handleCopyCode = () => {
    const activeFile = javaFiles.find((f) => f.name === selectedJavaFileName);
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
      setCopiedFile(true);
      success(`Copied ${activeFile.name} to clipboard!`);
      setTimeout(() => setCopiedFile(false), 2000);
    }
  };

  // Auth & Role Handlers for Java Swing Desktop Workstation
  const handleSwingLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      setIsLoginDialogOpen(false);
      setLoginEmail('');
      setLoginPassword('');
      success('Logged in successfully to Swing Desktop Workstation!');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSwingQuickRole = async (role: 'admin' | 'doctor' | 'receptionist') => {
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await quickLogin(role);
      setIsLoginDialogOpen(false);
      setIsRoleDropdownOpen(false);
      success(`Switched active role to: ${role.toUpperCase()}`);
    } catch (err: any) {
      setLoginError(err.message || 'Quick login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSwingLogout = () => {
    logout();
    info('Logged out of workstation session');
    setIsRoleDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-text">
      {/* Top Banner Explaining Architecture & College Viva Suitability */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 border-b border-teal-800/40 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-teal-300">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold tracking-wide">Core Java Desktop Environment:</span>
          <span className="text-slate-300 hidden sm:inline">
            Running <strong>HospitalSwingApp.java</strong> (JFrame & JTable) with zero web framework dependencies.
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadJavaZip}
            disabled={isDownloadingZip}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium shadow transition-all cursor-pointer text-xs"
            title="Download pure .java files, schema.sql, and README.md without any web files"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingZip ? 'Creating ZIP...' : 'Download Java Project (.ZIP)'}</span>
          </button>

          {onSwitchToWebPortal && (
            <button
              onClick={onSwitchToWebPortal}
              className="flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white border border-sky-400/60 rounded font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-105"
              title="Switch to full responsive hospital Web Portal view"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 Switch to Web View</span>
            </button>
          )}
        </div>
      </div>

      {/* Main OS Desktop Canvas */}
      <div className="flex-1 p-3 sm:p-5 flex items-center justify-center bg-slate-950/90 overflow-auto">
        {/* JFrame Window Decorator */}
        <div className="w-full max-w-7xl bg-slate-50 text-slate-800 rounded-lg shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col min-h-[780px]">
          
          {/* OS Window Header Bar */}
          <div className="bg-slate-800 text-slate-200 px-3 py-2 flex items-center justify-between border-b border-slate-700 select-none">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                ☕
              </div>
              <span className="text-xs font-mono font-semibold text-slate-200 truncate">
                JFrame: HospitalSwingApp.java — Nexus Care Hospital Management System [Core Java Swing]
              </span>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => info('Window Minimized to Taskbar (Swing Desktop)')} 
                className="w-5 h-5 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition cursor-pointer"
                title="Minimize"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button 
                onClick={() => info('Window in Maximized Workstation State')} 
                className="w-5 h-5 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition cursor-pointer"
                title="Maximize"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button 
                onClick={() => info('Exit action would invoke System.exit(0) in local Java execution.')} 
                className="w-5 h-5 rounded flex items-center justify-center bg-red-800/80 hover:bg-red-600 text-white text-xs transition cursor-pointer"
                title="Close (System.exit)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Swing JMenuBar */}
          <div className="bg-slate-200 border-b border-slate-300 px-3 py-1 flex items-center gap-1 text-xs text-slate-700 font-medium select-none">
            <div className="relative">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                className={`px-2 py-0.5 rounded hover:bg-slate-300 transition-colors ${activeMenu === 'file' ? 'bg-slate-300' : ''}`}
              >
                File
              </button>
              {activeMenu === 'file' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded shadow-lg border border-slate-300 py-1 z-50 text-slate-800">
                  <button 
                    onClick={() => { setActiveTab('patients'); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-teal-50 flex items-center justify-between"
                  >
                    <span>New Patient Registration</span>
                    <span className="text-[10px] text-slate-400">Ctrl+N</span>
                  </button>
                  <button 
                    onClick={() => { handleDownloadJavaZip(); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-teal-50 flex items-center justify-between"
                  >
                    <span>Export Java Project (.zip)</span>
                    <span className="text-[10px] text-slate-400">Ctrl+S</span>
                  </button>
                  <div className="border-t border-slate-200 my-1" />
                  <button 
                    onClick={() => { setIsRoleDropdownOpen(true); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-teal-50 flex items-center justify-between"
                  >
                    <span>Change Active Role...</span>
                    <span className="text-[10px] text-slate-400">Ctrl+R</span>
                  </button>
                  {user ? (
                    <button 
                      onClick={() => { handleSwingLogout(); setActiveMenu(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center justify-between"
                    >
                      <span>Log Out Session</span>
                      <span className="text-[10px] text-slate-400">Ctrl+L</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setIsLoginDialogOpen(true); setActiveMenu(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-teal-50 text-teal-700 font-semibold flex items-center justify-between"
                    >
                      <span>Log In to Workstation...</span>
                      <span className="text-[10px] text-slate-400">Ctrl+L</span>
                    </button>
                  )}
                  {onSwitchToWebPortal && (
                    <button 
                      onClick={() => { onSwitchToWebPortal(); setActiveMenu(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-sky-50 text-sky-800 font-semibold flex items-center justify-between"
                    >
                      <span>Switch to Web View (Web Portal)</span>
                      <span className="text-[10px] text-slate-400">Alt+W</span>
                    </button>
                  )}
                  <div className="border-t border-slate-200 my-1" />
                  <button 
                    onClick={() => { 
                      if (onSwitchToWebPortal) {
                        onSwitchToWebPortal();
                      } else {
                        info('Swing App Session Active');
                      }
                      setActiveMenu(null); 
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center justify-between"
                  >
                    <span>Exit (System.exit)</span>
                    <span className="text-[10px] text-slate-400">Alt+F4</span>
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                className={`px-2 py-0.5 rounded hover:bg-slate-300 transition-colors ${activeMenu === 'view' ? 'bg-slate-300' : ''}`}
              >
                View
              </button>
              {activeMenu === 'view' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded shadow-lg border border-slate-300 py-1 z-50 text-slate-800">
                  <button 
                    onClick={() => { setActiveTab('dashboard'); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-teal-50"
                  >
                    Dashboard Overview
                  </button>
                  <button 
                    onClick={() => { setActiveTab('patients'); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-teal-50"
                  >
                    Patient Records (JTable)
                  </button>
                  <button 
                    onClick={() => { setActiveTab('doctors'); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-teal-50"
                  >
                    Doctor Directory (JTable)
                  </button>
                  <button 
                    onClick={() => { setActiveTab('sourceCode'); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-teal-50 font-semibold text-teal-700"
                  >
                    Java Source Code & Submission
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
                className={`px-2 py-0.5 rounded hover:bg-slate-300 transition-colors ${activeMenu === 'tools' ? 'bg-slate-300' : ''}`}
              >
                Tools
              </button>
              {activeMenu === 'tools' && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded shadow-lg border border-slate-300 py-1 z-50 text-slate-800">
                  <button 
                    onClick={async () => {
                      await api.resetData();
                      loadInitialData();
                      success('Database and in-memory models reset to initial sample state');
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-teal-50"
                  >
                    Reset Initial Sample Data
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('sourceCode');
                      setSelectedJavaFileName('schema.sql');
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-teal-50"
                  >
                    View MySQL Schema (schema.sql)
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('sourceCode');
                      setSelectedJavaFileName('README.md');
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-teal-50"
                  >
                    Viva Questions & Run Guide
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
                className={`px-2 py-0.5 rounded hover:bg-slate-300 transition-colors ${activeMenu === 'help' ? 'bg-slate-300' : ''}`}
              >
                Help
              </button>
              {activeMenu === 'help' && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded shadow-lg border border-slate-300 py-1 z-50 text-slate-800">
                  <div className="px-3 py-2 text-xs text-slate-600 bg-slate-50 border-b border-slate-200">
                    <strong>College Mini Project Info</strong><br />
                    Core Java (JDK 8+) + Swing GUI<br />
                    No Spring Boot / No HTML
                  </div>
                  <button 
                    onClick={() => {
                      alert("NEXUS CARE HOSPITAL MANAGEMENT SYSTEM\nBuilt using Core Java & Java Swing Framework.\n\nComponents:\n- JFrame (Main Window)\n- JTabbedPane (Navigation Tabs)\n- JTable & DefaultTableModel (Data Grids)\n- TableRowSorter (Search & Filter)\n- JOptionPane (Alerts & Dialogs)\n\nReady for viva submission!");
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-teal-50 text-xs"
                  >
                    About Swing Architecture
                  </button>
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Look & Feel: Metal / System Swing</span>
              <span>|</span>
              <span className="text-teal-700 font-semibold">JDK 17 Compatible</span>
            </div>
          </div>

          {/* Swing Application Header Banner (Hospital Header in HospitalSwingApp.java) */}
          <div className="bg-[#134e4a] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-teal-800 shadow-sm">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>🏥 NEXUS CARE HOSPITAL MANAGEMENT SYSTEM</span>
              </h1>
              <p className="text-xs text-teal-200 font-medium">
                Core Java Desktop Application | JFrame & JTable | Multi-Specialty Clinical Suite
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Interactive Role Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-teal-300/80 bg-teal-900/90 hover:bg-teal-800 text-xs font-semibold text-teal-100 shadow-sm transition-all cursor-pointer hover:border-teal-200"
                  title="Click to switch active role: Admin, Doctor, or Receptionist"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-teal-300 text-[10px] uppercase tracking-wider font-bold">Role:</span>
                  <span className="text-white font-bold capitalize">
                    {user?.role === 'admin' 
                      ? 'Administrator' 
                      : user?.role === 'doctor' 
                      ? (doctor?.name ? `Dr. ${doctor.name}` : 'Specialist Doctor') 
                      : user?.role === 'receptionist'
                      ? 'Receptionist'
                      : 'Select Role / Log In'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-teal-200 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isRoleDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-1.5 w-72 bg-white rounded-lg shadow-2xl border border-slate-300 py-1.5 z-50 text-slate-800 animate-in fade-in select-none"
                    onMouseLeave={() => setIsRoleDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Change Active User Role</span>
                      <span className="text-[10px] text-teal-700 font-semibold">1-Click Switch</span>
                    </div>

                    {/* Admin */}
                    <button
                      onClick={() => handleSwingQuickRole('admin')}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        user?.role === 'admin' ? 'bg-violet-50/80 text-violet-950 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">Hospital Administrator</div>
                          <div className="text-[10px] text-slate-500">Full system access, staff, JTables & reports</div>
                        </div>
                      </div>
                      {user?.role === 'admin' && <Check className="w-4 h-4 text-violet-600" />}
                    </button>

                    {/* Doctor */}
                    <button
                      onClick={() => handleSwingQuickRole('doctor')}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        user?.role === 'doctor' ? 'bg-emerald-50/80 text-emerald-950 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">Specialist Doctor</div>
                          <div className="text-[10px] text-slate-500">Consultations, clinical notes & prescriptions</div>
                        </div>
                      </div>
                      {user?.role === 'doctor' && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>

                    {/* Receptionist */}
                    <button
                      onClick={() => handleSwingQuickRole('receptionist')}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        user?.role === 'receptionist' ? 'bg-teal-50/80 text-teal-950 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">Front Desk Receptionist</div>
                          <div className="text-[10px] text-slate-500">Patient intake, token queue & appointments</div>
                        </div>
                      </div>
                      {user?.role === 'receptionist' && <Check className="w-4 h-4 text-teal-600" />}
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    {/* Log in / Log out button inside dropdown */}
                    {user ? (
                      <button
                        onClick={handleSwingLogout}
                        className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out of Workstation Session</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => { setIsRoleDropdownOpen(false); setIsLoginDialogOpen(true); }}
                        className="w-full text-left px-3.5 py-2 text-xs text-teal-700 hover:bg-teal-50 flex items-center gap-2 transition-colors cursor-pointer font-medium"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Log In with Credentials...</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Log Out or Log In button */}
              {user ? (
                <button
                  onClick={handleSwingLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 border border-rose-400/60 rounded-md text-xs font-semibold text-rose-100 transition cursor-pointer shadow-xs"
                  title="Log out of current user session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginDialogOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 rounded-md text-xs font-bold text-white transition cursor-pointer shadow-xs"
                  title="Log in to hospital workstation"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
              )}

              {/* Prominent Option to Switch to Web View */}
              {onSwitchToWebPortal && (
                <button
                  onClick={onSwitchToWebPortal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-md text-xs font-bold shadow-md transition-all cursor-pointer border border-sky-400/60 hover:scale-102"
                  title="Switch to full modern Web Portal view"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🌐 Web View</span>
                </button>
              )}

              {/* Refresh Data button */}
              <button
                onClick={() => {
                  loadInitialData();
                  success('All JTable models and dashboard metrics refreshed!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-xs font-semibold text-white transition cursor-pointer"
                title="Reload patient, doctor, and live metric tables"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh Data</span>
              </button>
            </div>
          </div>

          {/* JTabbedPane Navigation Tabs */}
          <div className="bg-slate-200/90 border-b border-slate-300 px-4 flex items-end gap-1 pt-2 select-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 font-semibold text-xs rounded-t border-t border-x transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-50 border-slate-300 text-teal-800 shadow-sm relative z-10 -mb-[1px]'
                  : 'bg-slate-300/80 hover:bg-slate-200 text-slate-600 border-transparent'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              <span>📊 Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`px-4 py-2 font-semibold text-xs rounded-t border-t border-x transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'patients'
                  ? 'bg-slate-50 border-slate-300 text-teal-800 shadow-sm relative z-10 -mb-[1px]'
                  : 'bg-slate-300/80 hover:bg-slate-200 text-slate-600 border-transparent'
              }`}
            >
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>📝 Patient Registration & Records (JTable)</span>
              <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-full text-[10px]">
                {patients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-4 py-2 font-semibold text-xs rounded-t border-t border-x transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'doctors'
                  ? 'bg-slate-50 border-slate-300 text-teal-800 shadow-sm relative z-10 -mb-[1px]'
                  : 'bg-slate-300/80 hover:bg-slate-200 text-slate-600 border-transparent'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>👨‍⚕️ Doctor Directory & Roster (JTable)</span>
              <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-full text-[10px]">
                {doctors.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sourceCode')}
              className={`px-4 py-2 font-semibold text-xs rounded-t border-t border-x transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'sourceCode'
                  ? 'bg-slate-50 border-slate-300 text-indigo-900 shadow-sm relative z-10 -mb-[1px]'
                  : 'bg-indigo-100/70 hover:bg-indigo-100 text-indigo-700 border-transparent'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold">☕ Core Java Code & Submission Hub</span>
              <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                Runnable .java
              </span>
            </button>
          </div>

          {/* TAB CONTENT CONTAINER */}
          <div className="flex-1 bg-slate-50 p-4 sm:p-6 overflow-auto">
            {/* ============================================================== */}
            {/* TAB 1: DASHBOARD OVERVIEW                                      */}
            {/* ============================================================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* KPI Cards Grid (Matches HospitalSwingApp.java KPI Panel) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3.5 bg-white rounded border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Total Patients
                    </span>
                    <div className="text-2xl font-bold text-teal-700 mt-1">
                      {stats?.totalPatients || patients.length}
                    </div>
                    <span className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                      ● Active Registrations
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Admitted Inpatients
                    </span>
                    <div className="text-2xl font-bold text-blue-700 mt-1">
                      {patients.filter((p) => (p.admissionStatus || 'Outpatient') === 'Admitted').length}
                    </div>
                    <span className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                      ● Occupying Beds
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Available Doctors
                    </span>
                    <div className="text-2xl font-bold text-emerald-700 mt-1">
                      {doctors.filter((d) => d.availabilityStatus === 'Available').length} / {doctors.length}
                    </div>
                    <span className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                      ● Ready for OPD
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Available Beds
                    </span>
                    <div className="text-2xl font-bold text-amber-700 mt-1">
                      {stats?.availableBeds !== undefined ? stats.availableBeds : 6} / 10
                    </div>
                    <span className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      ● General & ICU Ward
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Total Revenue
                    </span>
                    <div className="text-2xl font-bold text-slate-800 mt-1">
                      ₹{stats?.totalRevenue ? stats.totalRevenue.toLocaleString() : '84,500'}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">
                      Billed & Collected
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Outpatients
                    </span>
                    <div className="text-2xl font-bold text-indigo-700 mt-1">
                      {patients.filter((p) => (p.admissionStatus || 'Outpatient') === 'Outpatient').length}
                    </div>
                    <span className="text-[10px] text-indigo-600 mt-1">
                      Day Consultations
                    </span>
                  </div>
                </div>

                {/* Operations & Quick Actions (Bordered Panels like Swing TitledBorder) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Quick Actions & Bed Status */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Swing-Styled Titled Border Panel for Bed Status */}
                    <div className="bg-white rounded border border-slate-300 p-4 shadow-sm">
                      <div className="text-xs font-bold text-teal-900 border-b border-slate-200 pb-2 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Bed className="w-4 h-4 text-teal-700" />
                          <span>HOSPITAL BED OCCUPANCY STATUS (10 CLINICAL BEDS)</span>
                        </span>
                        <span className="text-[11px] font-normal text-slate-500">
                          Ward A & ICU Wards
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {[
                          { bed: 'BED-101', type: 'ICU', status: 'Occupied', patient: 'Ramesh K. Gupta' },
                          { bed: 'BED-102', type: 'ICU', status: 'Available', patient: null },
                          { bed: 'BED-103', type: 'General', status: 'Occupied', patient: 'Vikas Manhas' },
                          { bed: 'BED-104', type: 'General', status: 'Available', patient: null },
                          { bed: 'BED-105', type: 'General', status: 'Available', patient: null },
                          { bed: 'BED-106', type: 'General', status: 'Occupied', patient: 'Pooja Verma' },
                          { bed: 'BED-107', type: 'Private', status: 'Available', patient: null },
                          { bed: 'BED-108', type: 'Private', status: 'Available', patient: null },
                          { bed: 'BED-109', type: 'Private', status: 'Occupied', patient: 'Suresh Patil' },
                          { bed: 'BED-110', type: 'Emergency', status: 'Available', patient: null }
                        ].map((b) => (
                          <div
                            key={b.bed}
                            className={`p-2.5 rounded border text-xs flex flex-col justify-between ${
                              b.status === 'Occupied'
                                ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                                : 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{b.bed}</span>
                              <span className="text-[10px] font-normal uppercase opacity-75">{b.type}</span>
                            </div>
                            <div className="mt-2 text-[11px]">
                              {b.status === 'Occupied' ? (
                                <span className="font-semibold text-amber-800">Occupied: {b.patient}</span>
                              ) : (
                                <span className="font-semibold text-emerald-700">● Available</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Navigation Buttons */}
                    <div className="bg-white rounded border border-slate-300 p-4 shadow-sm flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-slate-700 uppercase">
                        Workstation Shortcuts:
                      </span>
                      <button
                        onClick={() => setActiveTab('patients')}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded text-xs font-semibold shadow transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Register Inpatient / Outpatient</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('doctors')}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-semibold shadow transition cursor-pointer flex items-center gap-1"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Open Doctor Directory</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('sourceCode')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded text-xs font-semibold shadow transition cursor-pointer flex items-center gap-1"
                      >
                        <Coffee className="w-3.5 h-3.5" />
                        <span>Inspect HospitalSwingApp.java</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Live SQL Queries Executed (Ideal for College Viva Evaluation) */}
                  <div className="bg-slate-900 text-slate-200 rounded border border-slate-800 p-4 shadow-sm flex flex-col">
                    <div className="text-xs font-bold text-teal-400 border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-teal-400" />
                        <span>LIVE SQL LOGS (VIVA DEMONSTRATION)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">JDBC Sync</span>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-2">
                      When buttons are pressed in the Swing GUI, corresponding SQL statements are executed:
                    </p>

                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] font-mono text-[11px] pr-1">
                      {sqlLogs.slice(-6).map((log) => (
                        <div key={log.id} className="p-2 rounded bg-slate-950/80 border border-slate-800">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                            <span className="px-1 py-0.2 bg-teal-900/60 text-teal-300 rounded font-sans font-semibold">
                              {log.type}
                            </span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-emerald-400 text-[10px] break-all">
                            {log.sql}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: PATIENT REGISTRATION & RECORDS (JTABLE)                 */}
            {/* ============================================================== */}
            {activeTab === 'patients' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Swing Form with TitledBorder */}
                <div className="bg-white rounded border border-slate-300 p-4 shadow-sm">
                  <div className="text-xs font-bold text-teal-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-teal-700" />
                    <span>NEW PATIENT REGISTRATION FORM (Swing Form)</span>
                  </div>

                  <form onSubmit={handleRegisterPatient} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Patient ID (Auto-Generated by Sequence)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`PAT-${1000 + patients.length + 1}`}
                        className="w-full bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-600 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Full Patient Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={newPatientName}
                        onChange={(e) => setNewPatientName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Age (Years)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 42"
                          value={newPatientAge}
                          onChange={(e) => setNewPatientAge(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Gender
                        </label>
                        <select
                          value={newPatientGender}
                          onChange={(e: any) => setNewPatientGender(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-teal-600"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Contact Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="10-digit Mobile"
                          value={newPatientPhone}
                          onChange={(e) => setNewPatientPhone(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Blood Group
                        </label>
                        <select
                          value={newPatientBlood}
                          onChange={(e) => setNewPatientBlood(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-teal-600 font-semibold"
                        >
                          {['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'].map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Chief Complaint / Syndrome
                      </label>
                      <select
                        value={newPatientSyndrome}
                        onChange={(e: any) => setNewPatientSyndrome(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-teal-600"
                      >
                        <option value="Chest Pain">Chest Pain (Cardiology)</option>
                        <option value="Fever">Fever (General Medicine)</option>
                        <option value="Fracture">Fracture (Orthopedic)</option>
                        <option value="Migraine">Migraine (Neurology)</option>
                        <option value="Skin Allergy">Skin Allergy (Dermatology)</option>
                        <option value="Diabetes">Diabetes (Endocrinology)</option>
                        <option value="Stomach Ache">Stomach Ache (Gastroenterology)</option>
                        <option value="Eye Irritation">Eye Irritation (Ophthalmology)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Residential Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Civil Lines, City"
                        value={newPatientAddress}
                        onChange={(e) => setNewPatientAddress(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Admission Status
                      </label>
                      <select
                        value={newPatientStatus}
                        onChange={(e: any) => setNewPatientStatus(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-teal-600"
                      >
                        <option value="Outpatient">Outpatient (OPD Consultation)</option>
                        <option value="Admitted">Admitted (Inpatient Bed)</option>
                      </select>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded font-semibold shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Register Patient</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPatientName('');
                          setNewPatientAge('');
                          setNewPatientPhone('');
                        }}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium transition cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Side: JTable of Registered Patients */}
                <div className="lg:col-span-2 bg-white rounded border border-slate-300 p-4 shadow-sm flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-3">
                    <div className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-teal-700" />
                      <span>REGISTERED PATIENTS DATABASE (javax.swing.JTable)</span>
                    </div>

                    {/* Table Filters (TableRowSorter) */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter JTable rows..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          className="pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                        />
                      </div>

                      <select
                        value={patientStatusFilter}
                        onChange={(e: any) => setPatientStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Admitted">Admitted</option>
                        <option value="Outpatient">Outpatient</option>
                        <option value="Discharged">Discharged</option>
                      </select>
                    </div>
                  </div>

                  {/* Swing JTable Container */}
                  <div className="flex-1 border border-slate-300 rounded overflow-x-auto min-h-[420px]">
                    <table className="w-full text-left text-xs border-collapse">
                      {/* Swing JTableHeader */}
                      <thead>
                        <tr className="bg-gradient-to-b from-slate-200 to-slate-300 text-slate-800 border-b border-slate-400 font-semibold select-none">
                          <th className="p-2 border-r border-slate-300">ID</th>
                          <th className="p-2 border-r border-slate-300">Patient Name</th>
                          <th className="p-2 border-r border-slate-300">Age / Sex</th>
                          <th className="p-2 border-r border-slate-300">Contact</th>
                          <th className="p-2 border-r border-slate-300">Blood</th>
                          <th className="p-2 border-r border-slate-300">Chief Complaint</th>
                          <th className="p-2 border-r border-slate-300">Status</th>
                          <th className="p-2 border-r border-slate-300">Admission Date</th>
                          <th className="p-2 text-center">Actions</th>
                        </tr>
                      </thead>

                      {/* Swing Table Model Rows */}
                      <tbody className="divide-y divide-slate-200 font-sans">
                        {filteredPatients.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-400">
                              No records match current search filter in JTable model.
                            </td>
                          </tr>
                        ) : (
                          filteredPatients.map((p, idx) => {
                            const status = p.admissionStatus || 'Outpatient';
                            return (
                              <tr
                                key={p.id}
                                className={`hover:bg-teal-50/60 transition-colors ${
                                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                                }`}
                              >
                                <td className="p-2 font-mono font-bold text-teal-800 border-r border-slate-200">
                                  {p.id}
                                </td>
                                <td className="p-2 font-medium text-slate-900 border-r border-slate-200">
                                  {p.name}
                                </td>
                                <td className="p-2 text-slate-600 border-r border-slate-200">
                                  {p.age} yrs / {p.gender}
                                </td>
                                <td className="p-2 font-mono text-slate-600 border-r border-slate-200">
                                  {p.phone}
                                </td>
                                <td className="p-2 text-slate-800 font-semibold border-r border-slate-200">
                                  {p.bloodGroup || 'O+'}
                                </td>
                                <td className="p-2 text-slate-700 border-r border-slate-200">
                                  {p.syndrome || 'General Checkup'}
                                </td>
                                <td className="p-2 border-r border-slate-200">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      status === 'Admitted'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : status === 'Discharged'
                                        ? 'bg-slate-200 text-slate-700 border border-slate-300'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    }`}
                                  >
                                    {status}
                                  </span>
                                </td>
                                <td className="p-2 text-slate-500 border-r border-slate-200 font-mono text-[11px]">
                                  {p.admittedDate || p.registeredDate || '2026-10-14'}
                                </td>
                                <td className="p-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {status === 'Admitted' && (
                                      <button
                                        onClick={() => handleDischargePatient(p.id)}
                                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold transition cursor-pointer"
                                        title="3-in-1 Atomic Discharge: updates patient, frees bed, marks cleared"
                                      >
                                        Discharge
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeletePatient(p.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                                      title="Delete Patient Record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* JTable Model Status Bar */}
                  <div className="mt-2 text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-200 pt-2">
                    <span>
                      Total Records in JTable: <strong>{patients.length}</strong> | Showing: <strong>{filteredPatients.length}</strong>
                    </span>
                    <span>Class: javax.swing.table.DefaultTableModel</span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: DOCTOR DIRECTORY & ROSTER (JTABLE)                      */}
            {/* ============================================================== */}
            {activeTab === 'doctors' && (
              <div className="bg-white rounded border border-slate-300 p-4 shadow-sm flex flex-col space-y-4">
                {/* Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-700" />
                    <span>HOSPITAL CLINICAL ROSTER & DIRECTORY (JTable)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search doctor or phone..."
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                        className="pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    <select
                      value={doctorSpecialtyFilter}
                      onChange={(e) => setDoctorSpecialtyFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="All">All Specializations</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="General Physician">General Physician</option>
                      <option value="Orthopedic">Orthopedic</option>
                      <option value="Pediatrician">Pediatrician</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="Dermatologist">Dermatologist</option>
                    </select>

                    <select
                      value={doctorStatusFilter}
                      onChange={(e) => setDoctorStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Available">Available</option>
                      <option value="In Consultation">In Consultation</option>
                      <option value="On Leave">On Leave</option>
                    </select>

                    <button
                      onClick={() => setIsAddDoctorModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-teal-700 hover:bg-teal-600 text-white rounded font-semibold shadow transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Doctor</span>
                    </button>
                  </div>
                </div>

                {/* Doctor JTable */}
                <div className="border border-slate-300 rounded overflow-x-auto min-h-[460px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-b from-slate-200 to-slate-300 text-slate-800 border-b border-slate-400 font-semibold select-none">
                        <th className="p-2.5 border-r border-slate-300">Doctor ID</th>
                        <th className="p-2.5 border-r border-slate-300">Doctor Name</th>
                        <th className="p-2.5 border-r border-slate-300">Specialization</th>
                        <th className="p-2.5 border-r border-slate-300">OPD Room</th>
                        <th className="p-2.5 border-r border-slate-300">Contact</th>
                        <th className="p-2.5 border-r border-slate-300">Timings</th>
                        <th className="p-2.5 border-r border-slate-300">Fee (₹)</th>
                        <th className="p-2.5 border-r border-slate-300">Operational Status</th>
                        <th className="p-2.5 text-center">Status Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            No doctors found matching the selected filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredDoctors.map((doc, idx) => (
                          <tr
                            key={doc.id}
                            className={`hover:bg-teal-50/60 transition-colors ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                            }`}
                          >
                            <td className="p-2.5 font-mono font-bold text-teal-800 border-r border-slate-200">
                              {doc.id}
                            </td>
                            <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">
                              {doc.name}
                            </td>
                            <td className="p-2.5 text-slate-700 font-medium border-r border-slate-200">
                              {doc.specialization}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 border-r border-slate-200">
                              {doc.roomNumber || 'OPD-101'}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 border-r border-slate-200">
                              {doc.phone}
                            </td>
                            <td className="p-2.5 text-slate-600 border-r border-slate-200">
                              {doc.shiftTiming || '09:00 - 17:00'}
                            </td>
                            <td className="p-2.5 font-semibold text-slate-800 border-r border-slate-200">
                              ₹{doc.consultationFee}
                            </td>
                            <td className="p-2.5 border-r border-slate-200">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  doc.availabilityStatus === 'Available'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : doc.availabilityStatus === 'In Consultation'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}
                              >
                                {doc.availabilityStatus}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleToggleDoctorStatus(doc)}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-semibold transition cursor-pointer"
                                title="Click to cycle status: Available -> In Consultation -> On Leave"
                              >
                                Toggle Status
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-200 pt-2">
                  <span>
                    Total Doctors in Directory: <strong>{doctors.length}</strong> | Filtered: <strong>{filteredDoctors.length}</strong>
                  </span>
                  <span>Component: javax.swing.JTable | Model: DefaultTableModel</span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: CORE JAVA SOURCE CODE & SUBMISSION HUB                  */}
            {/* ============================================================== */}
            {activeTab === 'sourceCode' && (
              <div className="space-y-4">
                {/* College Evaluation Callout Banner */}
                <div className="p-4 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded border border-teal-700/60 shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
                      <Coffee className="w-4 h-4 text-amber-400" />
                      <span>Pure Core Java Mini Project Files (Zero Web Dependencies)</span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-3xl">
                      The standalone file <strong>HospitalSwingApp.java</strong> (1,118 lines) contains the entire executable desktop application using <strong>JFrame</strong>, <strong>JTable</strong>, and standard Java libraries. It requires no Spring Boot, no HTML, and no Node.js.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadJavaZip}
                      disabled={isDownloadingZip}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow text-xs transition cursor-pointer flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isDownloadingZip ? 'Zipping...' : 'Download Java Project (.ZIP)'}</span>
                    </button>
                  </div>
                </div>

                {/* Compilation Instructions */}
                <div className="p-3 bg-slate-900 text-slate-200 rounded border border-slate-800 font-mono text-xs">
                  <span className="text-teal-400 font-sans font-bold text-[11px] block mb-1">
                    HOW TO COMPILE & RUN ON YOUR LOCAL MACHINE (COMMAND PROMPT / TERMINAL):
                  </span>
                  <div className="space-y-1 text-emerald-400">
                    <p># 1. Compile the Java Swing Application:</p>
                    <p className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-100">
                      javac HospitalSwingApp.java
                    </p>
                    <p># 2. Run the Desktop Window:</p>
                    <p className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-100">
                      java HospitalSwingApp
                    </p>
                  </div>
                </div>

                {/* File Selector Tabs */}
                <div className="bg-white rounded border border-slate-300 overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-slate-100 border-b border-slate-300 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {javaFiles.map((file) => (
                        <button
                          key={file.path || file.name}
                          onClick={() => setSelectedJavaFileName(file.name)}
                          className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap ${
                            selectedJavaFileName === file.name
                              ? 'bg-teal-700 text-white font-bold shadow-sm'
                              : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {file.name}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition cursor-pointer"
                    >
                      {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFile ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>

                  {/* Code Block */}
                  <div className="bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-[550px] leading-relaxed">
                    <pre>{currentFileContent}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Swing Status Bar (HospitalSwingApp.java bottom status bar) */}
          <div className="bg-slate-200 border-t border-slate-300 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-slate-600 font-sans">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>● System Ready: Core Java Swing Hospital Workstation | Local Database Synced | Active OPD Hours</span>
            </div>
            <div className="font-mono text-teal-800 font-bold">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Doctor Modal Dialog (Simulating Swing JDialog) */}
      {isAddDoctorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-300 overflow-hidden text-slate-800">
            {/* Dialog Title */}
            <div className="bg-slate-800 text-slate-100 px-4 py-2.5 flex items-center justify-between select-none">
              <span className="text-xs font-bold font-mono">
                JDialog: Add New Doctor to Roster
              </span>
              <button 
                onClick={() => setIsAddDoctorModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Doctor Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Alok Nath"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Specialization
                  </label>
                  <select
                    value={newDoctorSpec}
                    onChange={(e: any) => setNewDoctorSpec(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-teal-600"
                  >
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Orthopedic">Orthopedic</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    OPD Room No.
                  </label>
                  <input
                    type="text"
                    value={newDoctorRoom}
                    onChange={(e) => setNewDoctorRoom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={newDoctorPhone}
                    onChange={(e) => setNewDoctorPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={newDoctorFee}
                    onChange={(e) => setNewDoctorFee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Available Timings
                </label>
                <input
                  type="text"
                  value={newDoctorTiming}
                  onChange={(e) => setNewDoctorTiming(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDoctorModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded font-semibold shadow transition cursor-pointer"
                >
                  Save to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Java Swing JDialog: User Authentication & Role Login */}
      {isLoginDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-teal-800 w-full max-w-lg overflow-hidden flex flex-col text-slate-800">
            {/* JDialog Title Bar */}
            <div className="bg-slate-800 text-slate-200 px-3 py-2 flex items-center justify-between border-b border-slate-700 select-none">
              <div className="flex items-center gap-2">
                <span className="text-teal-400">☕</span>
                <span className="text-xs font-bold font-mono">
                  JDialog: Hospital Staff Authentication & Role Selection [Modal]
                </span>
              </div>
              <button 
                onClick={() => setIsLoginDialogOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
                title="Close Dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>🔐 Select Hospital Staff Role or Sign In</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Choose a predefined institutional role or enter your credentials to access the workstation.
                </p>
              </div>

              {/* 1-Click Role Login Cards */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Quick 1-Click Role Authentication
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSwingQuickRole('admin')}
                    disabled={isLoggingIn}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer hover:shadow-sm ${
                      user?.role === 'admin'
                        ? 'border-violet-500 bg-violet-50/80 ring-2 ring-violet-400'
                        : 'border-violet-200 bg-violet-50/40 hover:bg-violet-100/70'
                    }`}
                  >
                    <div className="w-7 h-7 rounded bg-violet-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-900 text-xs">Admin</div>
                    <div className="text-[10px] text-slate-500">Full System</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwingQuickRole('doctor')}
                    disabled={isLoggingIn}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer hover:shadow-sm ${
                      user?.role === 'doctor'
                        ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400'
                        : 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/70'
                    }`}
                  >
                    <div className="w-7 h-7 rounded bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-900 text-xs">Doctor</div>
                    <div className="text-[10px] text-slate-500">Consultations</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwingQuickRole('receptionist')}
                    disabled={isLoggingIn}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer hover:shadow-sm ${
                      user?.role === 'receptionist'
                        ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-400'
                        : 'border-teal-200 bg-teal-50/40 hover:bg-teal-100/70'
                    }`}
                  >
                    <div className="w-7 h-7 rounded bg-teal-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-900 text-xs">Receptionist</div>
                    <div className="text-[10px] text-slate-500">OPD & Intake</div>
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-semibold uppercase">Or Enter Credentials (JTextField)</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Manual Form */}
              <form onSubmit={handleSwingLogin} className="space-y-3">
                {loginError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Username / Email (JTextField)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="e.g. admin@medicare.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-teal-600 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Password (JPasswordField)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-teal-600 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {onSwitchToWebPortal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginDialogOpen(false);
                        onSwitchToWebPortal();
                      }}
                      className="text-xs text-sky-700 hover:text-sky-900 font-medium underline cursor-pointer"
                    >
                      Switch to Web Portal View
                    </button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsLoginDialogOpen(false)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition font-medium cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="px-4 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded font-semibold shadow transition cursor-pointer text-xs"
                    >
                      {isLoggingIn ? 'Authenticating...' : 'Sign In (JButton)'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
