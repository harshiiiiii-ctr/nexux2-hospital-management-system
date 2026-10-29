import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { InfoModal } from './components/common/InfoModal';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ReceptionDesk } from './components/reception/ReceptionDesk';
import { PatientsPage } from './components/patients/PatientsPage';
import { DoctorsPage } from './components/doctors/DoctorsPage';
import { AppointmentsPage } from './components/appointments/AppointmentsPage';
import { BillingPage } from './components/billing/BillingPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { StaffManagementPage } from './components/admin/StaffManagementPage';
import { JavaMiniProjectModal } from './components/common/JavaMiniProjectModal';
import { JavaSwingDesktopApp } from './components/swing/JavaSwingDesktopApp';
import { Doctor, Patient, Appointment, Bill, Receptionist } from './types';
import { api } from './api';

function MainApp() {
  const { user, isLoading: authLoading } = useAuth();
  const { error } = useToast();

  // Core Java Swing Desktop App Mode (Active by default for college mini-project)
  const [isSwingMode, setIsSwingMode] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Cross-component workflow state
  const [billingTargetAppId, setBillingTargetAppId] = useState<string | null>(null);
  const [doctorConsultationTargetApp, setDoctorConsultationTargetApp] = useState<Appointment | null>(null);

  // Global Info Modal for Header & Footer links
  const [infoModal, setInfoModal] = useState<{
    isOpen: boolean;
    title: string;
    category: string;
    content: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    category: '',
    content: null
  });

  // Global hospital data
  const [stats, setStats] = useState<any>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const loadData = useCallback(async () => {
    setIsFetchingData(true);
    try {
      const [statsData, docsData, recsData, patsData, appsData, billsData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getDoctors().catch(() => []),
        api.getReceptionists().catch(() => []),
        api.getPatients().catch(() => []),
        api.getAppointments().catch(() => []),
        api.getBills().catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      setDoctors(docsData);
      setReceptionists(recsData);
      setPatients(patsData);
      setAppointments(appsData);
      setBills(billsData);
    } catch (err: any) {
      console.error('Failed to load hospital data', err);
      error('Failed to load latest hospital records');
    } finally {
      setIsFetchingData(false);
    }
  }, [error]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Adjust active tab if user role changes and they don't have permission for active tab
  useEffect(() => {
    if (user) {
      if (user.role === 'doctor' && (activeTab === 'reception' || activeTab === 'billing' || activeTab === 'reports')) {
        setActiveTab('appointments');
      }
    }
  }, [user, activeTab]);

  const [staffInitialTab, setStaffInitialTab] = useState<'doctors' | 'receptionists' | 'timing' | 'exits'>('doctors');
  const [staffOpenAddModal, setStaffOpenAddModal] = useState<'doctor' | 'receptionist' | null>(null);
  const [isJavaModalOpen, setIsJavaModalOpen] = useState(false);
  const [patientsInitialTab, setPatientsInitialTab] = useState<'all' | 'admitted' | 'discharged'>('all');

  const handleNavigateToBilling = (appId: string) => {
    setBillingTargetAppId(appId);
    setActiveTab('billing');
  };

  const handleOpenDoctorConsultation = (app: Appointment) => {
    setDoctorConsultationTargetApp(app);
    setActiveTab('appointments');
  };

  const handleNavigateToStaff = (tab: 'doctors' | 'receptionists' | 'timing' | 'exits', openModal?: 'doctor' | 'receptionist') => {
    setStaffInitialTab(tab);
    setStaffOpenAddModal(openModal || null);
    setActiveTab('staff');
  };

  const handleNavigateToDischargedPatients = () => {
    setPatientsInitialTab('discharged');
    setActiveTab('patients');
  };

  const handleOpenInfo = (title: string, category: string, content: React.ReactNode) => {
    setInfoModal({
      isOpen: true,
      title,
      category,
      content
    });
  };

  // Render Core Java Swing Desktop App (Active by default for college evaluation)
  if (isSwingMode) {
    return (
      <JavaSwingDesktopApp
        onSwitchToWebPortal={() => setIsSwingMode(false)}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <span className="font-heading text-sm font-bold tracking-wide text-slate-700">
            Loading Nexus Care Workstation...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSwitchToSwing={() => setIsSwingMode(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onRefreshData={loadData}
        onSelectTab={setActiveTab}
        onOpenInfo={handleOpenInfo}
        onSwitchToSwing={() => setIsSwingMode(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area - Scrollable with Content + Bottom Footer */}
        <main className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                stats={stats}
                doctors={doctors}
                receptionists={receptionists}
                patients={patients}
                appointments={appointments}
                bills={bills}
                onNavigateTab={setActiveTab}
                onOpenDoctorConsultation={handleOpenDoctorConsultation}
                onBookDoctor={() => setActiveTab('appointments')}
                onDataChanged={loadData}
                onNavigateToStaff={handleNavigateToStaff}
                onOpenJavaModal={() => setIsJavaModalOpen(true)}
                onNavigateToDischargedPatients={handleNavigateToDischargedPatients}
              />
            )}

            {activeTab === 'reception' && (
              <ReceptionDesk
                doctors={doctors}
                patients={patients}
                onDataChanged={loadData}
                onNavigateToAppointments={() => setActiveTab('appointments')}
                onNavigateToBilling={handleNavigateToBilling}
              />
            )}

            {activeTab === 'patients' && (
              <PatientsPage
                patients={patients}
                appointments={appointments}
                doctors={doctors}
                onDataChanged={loadData}
                initialTab={patientsInitialTab}
              />
            )}

            {activeTab === 'doctors' && (
              <DoctorsPage
                doctors={doctors}
                onDataChanged={loadData}
                onBookAppointmentWithDoctor={() => setActiveTab('appointments')}
                onNavigateToStaff={handleNavigateToStaff}
              />
            )}

            {activeTab === 'staff' && (
              <StaffManagementPage
                doctors={doctors}
                receptionists={receptionists}
                onDataChanged={loadData}
                initialTab={staffInitialTab}
                openAddModal={staffOpenAddModal}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsPage
                appointments={appointments}
                doctors={doctors}
                patients={patients}
                onDataChanged={loadData}
                onNavigateToBilling={handleNavigateToBilling}
                initialDoctorConsultationApp={doctorConsultationTargetApp}
                onClearInitialConsultation={() => setDoctorConsultationTargetApp(null)}
              />
            )}

            {activeTab === 'billing' && (
              <BillingPage
                bills={bills}
                appointments={appointments}
                doctors={doctors}
                patients={patients}
                onDataChanged={loadData}
                initialAppointmentId={billingTargetAppId}
                onClearInitialAppointmentId={() => setBillingTargetAppId(null)}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsPage
                stats={stats}
                doctors={doctors}
                patients={patients}
                appointments={appointments}
                bills={bills}
              />
            )}
          </div>

          {/* Comprehensive Medicare-style Footer matching User Screenshot 1 */}
          <Footer onSelectTab={setActiveTab} />
        </main>
      </div>

      {/* Global Information Modal */}
      <InfoModal
        isOpen={infoModal.isOpen}
        onClose={() => setInfoModal(prev => ({ ...prev, isOpen: false }))}
        title={infoModal.title}
        category={infoModal.category}
        content={infoModal.content}
      />

      {/* College Java Mini Project & SQL Viva Hub Modal */}
      <JavaMiniProjectModal
        isOpen={isJavaModalOpen}
        onClose={() => setIsJavaModalOpen(false)}
      />

      {/* Floating Return to Core Java Swing Desktop Button */}
      <button
        onClick={() => setIsSwingMode(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-800 to-slate-900 hover:from-teal-700 hover:to-slate-800 text-white rounded-full shadow-2xl border-2 border-teal-400 font-bold text-xs transition-all hover:scale-105 cursor-pointer"
        title="Switch to Core Java Desktop Application (JFrame & JTable)"
      >
        <span className="text-base">☕</span>
        <span>Open Core Java Swing Desktop View</span>
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
