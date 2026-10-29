import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  IndianRupee, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PieChart, 
  FileSpreadsheet, 
  Sparkles,
  Stethoscope,
  Building
} from 'lucide-react';
import { Doctor, Patient, Appointment, Bill } from '../../types';
import { DOCTOR_AVATARS } from '../../assets/images';

interface ReportsPageProps {
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
  } | null;
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  bills: Bill[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  stats,
  doctors,
  patients,
  appointments,
  bills
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr);

  const totalFeeCollected = bills.reduce((acc, b) => acc + b.consultationFee, 0);
  const totalMedsCollected = bills.reduce((acc, b) => acc + b.medicineCharges, 0);

  const syndromeCounts: Record<string, number> = {};
  for (const p of patients) {
    syndromeCounts[p.syndrome] = (syndromeCounts[p.syndrome] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Nexus Care Analytics & Administrative Audits
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Key operational metrics, department workload distribution, and financial proceeds
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span>Real-time Clinical Metrics</span>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Patients
          </span>
          <div className="font-heading text-3xl font-black text-slate-900 mt-2">
            {stats?.totalPatients || patients.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">100% indexed in registry</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Today's Consultations
          </span>
          <div className="font-heading text-3xl font-black text-teal-700 mt-2">
            {todayAppointments.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {todayAppointments.filter(a => a.status === 'Completed').length} completed today
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Completed Encounters
          </span>
          <div className="font-heading text-3xl font-black text-emerald-700 mt-2">
            {stats?.completedAppointmentsCount || appointments.filter(a => a.status === 'Completed').length}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {appointments.filter(a => a.status === 'Scheduled').length} upcoming in queue
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Revenue
          </span>
          <div className="font-heading text-3xl font-black text-purple-700 mt-2">
            ₹{(stats?.totalRevenue || bills.reduce((acc, b) => acc + b.totalAmount, 0)).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            OPD & Dispensary Settlements
          </div>
        </div>
      </div>

      {/* Department Breakdown & Financial Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Specialization Breakdown */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-extrabold text-slate-900 text-base">
                Appointments Grouped by Specialization
              </h3>
              <p className="text-xs text-slate-500">
                Departmental caseload and clinical demand distribution
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-teal-600" />
          </div>

          <div className="space-y-4">
            {stats?.appointmentsBySpecialization?.map((item) => {
              const totalApps = Math.max(1, appointments.length);
              const percentage = Math.round((item.count / totalApps) * 100);

              return (
                <div key={item.specialization} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {item.specialization}
                    </span>
                    <span className="font-mono text-slate-600 font-medium">
                      {item.count} appointments ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 rounded-full"
                      style={{ width: `${Math.max(10, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Channels */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-extrabold text-slate-900 text-base">
                  Financial Revenue Channels
                </h3>
                <p className="text-xs text-slate-500">
                  Income channels split between consultations and pharmacy
                </p>
              </div>
              <IndianRupee className="w-5 h-5 text-purple-600" />
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                  <span>Specialist OPD Consultation Fees</span>
                  <span className="font-mono text-base font-black">₹{totalFeeCollected.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[11px] text-purple-700/80 mt-1">
                  Direct proceeds from OPD physician consultations
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100">
                <div className="flex items-center justify-between text-xs font-bold text-teal-950">
                  <span>Nexus Pharmacy Dispensary</span>
                  <span className="font-mono text-base font-black">₹{totalMedsCollected.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[11px] text-teal-700/80 mt-1">
                  Prescription medicine dispensary sales
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Hospital Billing Efficiency</span>
            <span className="text-emerald-700 font-extrabold">98.4% Real-time Clearance</span>
          </div>
        </div>
      </div>

      {/* Syndrome Prevalence in Registered Patients */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-extrabold text-slate-900 text-base">
              Patient Syndrome Prevalence & Chief Complaints
            </h3>
            <p className="text-xs text-slate-500">
              Categorization breakdown across registered patients
            </p>
          </div>
          <Activity className="w-5 h-5 text-teal-600" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(syndromeCounts).map(([syndrome, count]) => (
            <div key={syndrome} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
              <span className="text-xs font-bold text-slate-600">{syndrome}</span>
              <div className="font-heading text-2xl font-black text-slate-900 mt-1">{count}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                {Math.round((count / Math.max(1, patients.length)) * 100)}% of patients
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
