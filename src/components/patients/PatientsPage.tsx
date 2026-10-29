import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Phone, 
  MapPin, 
  Calendar, 
  Activity, 
  X, 
  FileText, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building,
  LogOut,
  Printer,
  Sparkles,
  Receipt,
  BedDouble,
  Clock,
  ShieldCheck,
  Check,
  ChevronRight,
  Database
} from 'lucide-react';
import { Patient, Syndrome, Appointment, Doctor, Bed } from '../../types';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { DOCTOR_AVATARS } from '../../assets/images';

interface PatientsPageProps {
  patients: Patient[];
  appointments: Appointment[];
  doctors: Doctor[];
  onDataChanged: () => void;
  initialTab?: 'all' | 'admitted' | 'discharged';
}

const SYNDROMES_LIST: Syndrome[] = [
  'Fever',
  'Chest Pain',
  'Fracture',
  'Skin Allergy',
  'Migraine',
  'Diabetes',
  'Eye Irritation',
  'Stomach Ache'
];

export const PatientsPage: React.FC<PatientsPageProps> = ({
  patients,
  appointments,
  doctors,
  onDataChanged,
  initialTab = 'all'
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const canEdit = user?.role === 'admin' || user?.role === 'receptionist';
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'all' | 'admitted' | 'discharged'>(initialTab);
  const [search, setSearch] = useState('');
  const [filterSyndrome, setFilterSyndrome] = useState<string>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewHistoryPatient, setViewHistoryPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  
  // 3-in-1 Discharge & Billing Modal state
  const [dischargeTargetPatient, setDischargeTargetPatient] = useState<Patient | null>(null);
  const [dischargeForm, setDischargeForm] = useState({
    medicineCharges: '450',
    discount: '0',
    paymentMethod: 'UPI' as 'Cash' | 'UPI' | 'Card' | 'Insurance',
    dischargeSummary: ''
  });
  const [isDischarging, setIsDischarging] = useState(false);

  // Printable Discharge Summary Slip
  const [printableDischargePatient, setPrintableDischargePatient] = useState<Patient | null>(null);

  // Form states for new/edit patient
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    address: '',
    syndrome: 'Fever' as Syndrome,
    bloodGroup: 'O+'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Segregated patient lists
  const admittedPatients = patients.filter(p => p.admissionStatus === 'Admitted');
  const dischargedPatients = patients.filter(p => p.admissionStatus === 'Discharged');

  // Filter patients based on active tab and search
  const currentList = activeTab === 'admitted' 
    ? admittedPatients 
    : activeTab === 'discharged' 
    ? dischargedPatients 
    : patients;

  const filteredPatients = currentList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      (p.diseaseName && p.diseaseName.toLowerCase().includes(search.toLowerCase())) ||
      (p.bedNumber && p.bedNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesSyndrome =
      filterSyndrome === 'All' || p.syndrome === filterSyndrome;

    return matchesSearch && matchesSyndrome;
  });

  const validateForm = () => {
    const err: Record<string, string> = {};
    if (!formData.name.trim()) err.name = 'Patient name is required';
    if (!formData.age || Number(formData.age) <= 0 || Number(formData.age) > 120) {
      err.age = 'Valid age (1-120) required';
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      err.phone = 'Valid contact phone required';
    }
    if (!formData.address.trim()) err.address = 'Address is required';

    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      age: '',
      gender: 'Male',
      phone: '',
      address: '',
      syndrome: 'Fever',
      bloodGroup: 'O+'
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setEditingPatient(p);
    setFormData({
      name: p.name,
      age: String(p.age),
      gender: p.gender,
      phone: p.phone,
      address: p.address,
      syndrome: p.syndrome,
      bloodGroup: p.bloodGroup || 'O+'
    });
    setFormErrors({});
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      error('Please fix validation errors');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPatient) {
        await api.updatePatient(editingPatient.id, {
          name: formData.name.trim(),
          age: Number(formData.age),
          gender: formData.gender,
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          syndrome: formData.syndrome,
          bloodGroup: formData.bloodGroup
        });
        success(`SQL UPDATE executed: Patient profile updated for ${formData.name}`);
        setEditingPatient(null);
      } else {
        const newPat = await api.createPatient({
          name: formData.name.trim(),
          age: Number(formData.age),
          gender: formData.gender,
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          syndrome: formData.syndrome,
          bloodGroup: formData.bloodGroup
        });
        success(`SQL INSERT executed: Registered new patient with ID ${newPat.id}!`);
        setIsAddModalOpen(false);
      }
      onDataChanged();
    } catch (err: any) {
      error(err.message || 'Failed to save patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!deletingPatient) return;
    try {
      await api.deletePatient(deletingPatient.id);
      success(`SQL DELETE executed: Patient ${deletingPatient.name} (${deletingPatient.id}) removed`);
      setDeletingPatient(null);
      onDataChanged();
    } catch (err: any) {
      error(err.message || 'Failed to delete patient');
    }
  };

  // Open 3-in-1 Discharge Modal
  const handleOpenDischarge = (p: Patient) => {
    setDischargeTargetPatient(p);
    setDischargeForm({
      medicineCharges: '450',
      discount: '0',
      paymentMethod: 'UPI',
      dischargeSummary: `Inpatient therapy concluded in ${p.bedNumber || 'General Ward'}. Clinical parameters stabilized and patient advised home oral medications.`
    });
  };

  // Execute 3-in-1 Atomic Discharge
  const handleExecuteDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargeTargetPatient) return;

    setIsDischarging(true);
    try {
      const res = await api.dischargePatient(dischargeTargetPatient.id, {
        medicineCharges: Number(dischargeForm.medicineCharges) || 0,
        discount: Number(dischargeForm.discount) || 0,
        paymentMethod: dischargeForm.paymentMethod,
        dischargeSummary: dischargeForm.dischargeSummary
      });

      success(`3-in-1 Transaction Success: ${res.patient.name} discharged, invoice generated, and bed released!`);
      setDischargeTargetPatient(null);
      onDataChanged();
      // Offer printable summary
      setPrintableDischargePatient(res.patient);
    } catch (err: any) {
      error(err.message || 'Failed to process discharge');
    } finally {
      setIsDischarging(false);
    }
  };

  const patientHistoryAppointments = viewHistoryPatient
    ? appointments.filter(a => a.patientId === viewHistoryPatient.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-1.5">
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>Master Patient Records & Inpatient Roster</span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Patient Directory & Master Clinical Archive
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {patients.length} registered patients • {admittedPatients.length} admitted inpatients • {dischargedPatients.length} historical discharged cases
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white shadow-md shadow-teal-700/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register New Patient (SQL INSERT)</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Registered Patients ({patients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('admitted')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'admitted'
              ? 'bg-blue-700 text-white shadow-sm shadow-blue-700/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BedDouble className="w-4 h-4 text-blue-500" />
          <span>Admitted Inpatients & Beds ({admittedPatients.length})</span>
          {admittedPatients.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950">
              Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('discharged')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'discharged'
              ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>Discharged Patients Master View (SQL SELECT) ({dischargedPatients.length})</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
            Admin Master
          </span>
        </button>
      </div>

      {/* MASTER VIEW BANNER (FOR DISCHARGED PATIENTS VIEW) */}
      {activeTab === 'discharged' && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-purple-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-400/20 text-purple-200 border border-purple-400/30 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                <span>Admin Master Oversight View</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black font-heading tracking-tight">
                Historical Archive of Treated, Billed & Discharged Inpatients
              </h3>
              <p className="text-xs text-purple-200/90 mt-1 max-w-2xl leading-relaxed">
                Full administrative oversight of treated patients who completed clinical therapy, had beds released back to inventory, and settled final bills.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/40 text-[11px] font-mono text-purple-300">
              <span className="text-slate-400 font-sans block text-[10px] font-bold uppercase mb-0.5">Underlying SQL SELECT Query:</span>
              <code>SELECT id, name, age, syndrome, admitted_date, discharged_date, total_billed_amount FROM patients WHERE admission_status = 'Discharged' ORDER BY discharged_date DESC;</code>
            </div>
          </div>
        </div>
      )}

      {/* ADMITTED INPATIENTS BANNER */}
      {activeTab === 'admitted' && (
        <div className="bg-gradient-to-r from-blue-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-blue-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-400/20 text-blue-200 border border-blue-400/30 mb-2">
                <BedDouble className="w-3.5 h-3.5 text-blue-300" />
                <span>Inpatient Ward & Bed Allocations</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black font-heading tracking-tight">
                Currently Admitted Patients ({admittedPatients.length} Active Inpatients)
              </h3>
              <p className="text-xs text-blue-200/90 mt-1 max-w-2xl leading-relaxed">
                Patients occupying hospital beds. Click <strong>"Discharge & Settle Bill"</strong> to execute the 3-in-1 atomic action: calculate bill, mark patient Discharged, and release bed back to Available.
              </p>
            </div>
            
            <div className="p-3 rounded-2xl bg-black/40 border border-blue-500/40 text-[11px] font-mono text-cyan-300">
              <span className="text-slate-400 font-sans block text-[10px] font-bold uppercase mb-0.5">Underlying SQL SELECT Query:</span>
              <code>SELECT p.*, b.bed_number, b.ward FROM patients p JOIN beds b ON p.bed_id = b.id WHERE p.admission_status = 'Admitted';</code>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab === 'discharged' ? 'discharged patients by diagnosis, name...' : 'by name, phone number, address, bed...'}`}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 shrink-0">Syndrome:</span>
          <select
            value={filterSyndrome}
            onChange={(e) => setFilterSyndrome(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          >
            <option value="All">All Syndromes</option>
            {SYNDROMES_LIST.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient ID & Name</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Contact Phone</th>
                {activeTab === 'discharged' ? (
                  <>
                    <th className="py-3 px-4">Diagnosis / Disease</th>
                    <th className="py-3 px-4">Admit → Discharge</th>
                    <th className="py-3 px-4">Bed Allocated</th>
                    <th className="py-3 px-4">Total Bill (Paid)</th>
                  </>
                ) : activeTab === 'admitted' ? (
                  <>
                    <th className="py-3 px-4">Bed & Ward</th>
                    <th className="py-3 px-4">Admitted Date</th>
                    <th className="py-3 px-4">Clinical Syndrome</th>
                    <th className="py-3 px-4">Status</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Syndrome Category</th>
                    <th className="py-3 px-4">Admission Status</th>
                  </>
                )}
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => {
                  const isAdmitted = p.admissionStatus === 'Admitted';
                  const isDischarged = p.admissionStatus === 'Discharged';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-teal-700 font-mono font-bold">{p.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {p.gender}, <span className="font-bold">{p.age} yrs</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {p.phone}
                      </td>

                      {/* DISCHARGED VIEW COLUMNS */}
                      {activeTab === 'discharged' && (
                        <>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-purple-900 block">
                              {p.diseaseName || p.syndrome}
                            </span>
                            {p.dischargeSummary && (
                              <span className="text-[10px] text-slate-500 line-clamp-1 italic max-w-xs" title={p.dischargeSummary}>
                                {p.dischargeSummary}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                            <div>Admit: {p.admittedDate || 'Prior'}</div>
                            <div className="text-purple-700 font-bold">Discharged: {p.dischargedDate || 'Recent'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-100 text-slate-800">
                              {p.bedNumber || 'OPD Daycare'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700 font-mono">
                            ₹{p.totalBilledAmount ? p.totalBilledAmount.toLocaleString('en-IN') : 'Settled'}
                            <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                              Paid
                            </span>
                          </td>
                        </>
                      )}

                      {/* ADMITTED VIEW COLUMNS */}
                      {activeTab === 'admitted' && (
                        <>
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">
                              <BedDouble className="w-3.5 h-3.5 text-blue-600" />
                              <span>{p.bedNumber || 'Bed Assigned'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            {p.admittedDate || 'Today'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              {p.syndrome}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Occupying Bed
                            </span>
                          </td>
                        </>
                      )}

                      {/* ALL VIEW COLUMNS */}
                      {activeTab === 'all' && (
                        <>
                          <td className="py-3.5 px-4 text-slate-600 max-w-[180px] truncate" title={p.address}>
                            {p.address}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              {p.syndrome}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isAdmitted
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isDischarged
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {p.admissionStatus || 'Outpatient'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 3-in-1 Discharge Button for Admitted Patients */}
                          {isAdmitted && canEdit && (
                            <button
                              onClick={() => handleOpenDischarge(p)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs cursor-pointer flex items-center gap-1"
                              title="Calculate bill, update status to Discharged, and free bed"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Discharge (3-in-1)</span>
                            </button>
                          )}

                          {/* Print Discharge Slip for Discharged Patients */}
                          {isDischarged && (
                            <button
                              onClick={() => setPrintableDischargePatient(p)}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 cursor-pointer flex items-center gap-1"
                              title="Print Discharge Slip"
                            >
                              <Printer className="w-3.5 h-3.5 text-purple-600" />
                              <span>Discharge Slip</span>
                            </button>
                          )}

                          <button
                            onClick={() => setViewHistoryPatient(p)}
                            className="p-1.5 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            title="Check Medical History (SELECT)"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Patient (UPDATE)"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingPatient(p)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Patient (DELETE)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No patients match your search criteria in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-IN-1 DISCHARGE & FINAL BILLING MODAL */}
      {dischargeTargetPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-base">
                    3-in-1 Inpatient Discharge & Settlement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atomic Transaction: Calculate Bill + UPDATE Patient + Release Bed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDischargeTargetPatient(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient & Bed Summary Card */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{dischargeTargetPatient.name} ({dischargeTargetPatient.id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Bed:</span>
                <span className="font-bold text-blue-700">{dischargeTargetPatient.bedNumber || 'Assigned Inpatient Bed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission Date:</span>
                <span className="font-mono text-slate-800">{dischargeTargetPatient.admittedDate || 'Admitted'}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleExecuteDischarge} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pharmacy & Medicine Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={dischargeForm.medicineCharges}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, medicineCharges: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Special Concession / Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={dischargeForm.discount}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, discount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Settlement Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {(['UPI', 'Cash', 'Card', 'Insurance'] as const).map(mode => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setDischargeForm({ ...dischargeForm, paymentMethod: mode })}
                      className={`py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                        dischargeForm.paymentMethod === mode
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Discharge Summary & Doctor Instructions
                </label>
                <textarea
                  rows={2}
                  value={dischargeForm.dischargeSummary}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Viva Query Preview */}
              <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px] space-y-1">
                <span className="text-slate-400 font-sans block text-[9px] uppercase font-bold">SQL Queries Executed in Atomic Transaction:</span>
                <div>1. INSERT INTO bills (patient_id, total_amount, payment_status) VALUES (...);</div>
                <div>2. UPDATE patients SET admission_status='Discharged', discharged_date=CURDATE() WHERE id=?;</div>
                <div>3. UPDATE beds SET status='Available', patient_id=NULL WHERE id=?;</div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDischargeTargetPatient(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDischarging}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isDischarging ? 'Processing 3-in-1 Transaction...' : 'Confirm 3-in-1 Discharge'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE DISCHARGE SLIP MODAL */}
      {printableDischargePatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                Official Hospital Clearance Certificate
              </span>
              <button
                onClick={() => setPrintableDischargePatient(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Paper */}
            <div className="p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-4 text-xs font-sans">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="font-heading font-extrabold text-slate-900 text-lg">NEXUS CARE HOSPITAL</h3>
                <p className="text-[11px] text-slate-500">Tertiary Healthcare, Research & Inpatient Center • Mumbai</p>
                <p className="text-[10px] font-bold text-teal-700 font-mono mt-0.5">DISCHARGE SUMMARY & BILL CLEARANCE</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><strong>Patient Name:</strong> {printableDischargePatient.name}</div>
                <div><strong>Patient ID:</strong> {printableDischargePatient.id}</div>
                <div><strong>Age / Gender:</strong> {printableDischargePatient.age} yrs / {printableDischargePatient.gender}</div>
                <div><strong>Blood Group:</strong> {printableDischargePatient.bloodGroup || 'O+'}</div>
                <div><strong>Admitted Date:</strong> {printableDischargePatient.admittedDate || 'Prior'}</div>
                <div><strong>Discharged Date:</strong> {printableDischargePatient.dischargedDate || new Date().toISOString().split('T')[0]}</div>
                <div><strong>Bed / Ward:</strong> {printableDischargePatient.bedNumber || 'Inpatient Bed'} (Released)</div>
                <div><strong>Total Settlement:</strong> ₹{printableDischargePatient.totalBilledAmount ? printableDischargePatient.totalBilledAmount.toLocaleString('en-IN') : 'Settled'} (PAID)</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px]">
                <strong className="text-purple-800 block mb-0.5">Clinical Discharge Summary:</strong>
                <p className="text-slate-600 leading-relaxed italic">
                  "{printableDischargePatient.dischargeSummary || 'Patient treated successfully and cleared for discharge. Advised complete recovery rest and oral prescriptions.'}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <div>Medical Superintendent Desk: Dr. Alok Nath (MD)</div>
                <div className="font-bold text-emerald-700">STATUS: BED CLEARED & BILL SETTLED</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPrintableDischargePatient(null)}
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

      {/* Add / Edit Patient Modal (SQL INSERT / UPDATE) */}
      {(isAddModalOpen || editingPatient) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-extrabold text-slate-900 text-base">
                {editingPatient ? 'Edit Patient Profile (SQL UPDATE)' : 'Register New Patient (SQL INSERT)'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingPatient(null); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                />
                {formErrors.name && <span className="text-[10px] text-rose-500 font-bold">{formErrors.name}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="45"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                  {formErrors.age && <span className="text-[10px] text-rose-500 font-bold">{formErrors.age}</span>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-500"
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
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-teal-500"
                  />
                  {formErrors.phone && <span className="text-[10px] text-rose-500 font-bold">{formErrors.phone}</span>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Syndrome / Chief Complaint</label>
                <select
                  value={formData.syndrome}
                  onChange={(e) => setFormData({ ...formData, syndrome: e.target.value as Syndrome })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold text-teal-900"
                >
                  {SYNDROMES_LIST.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address *</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Andheri West, Mumbai"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                />
                {formErrors.address && <span className="text-[10px] text-rose-500 font-bold">{formErrors.address}</span>}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingPatient(null); }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : editingPatient ? 'Update Patient' : 'Save Patient (SQL INSERT)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Medical Consultations History Modal (SELECT Query) */}
      {viewHistoryPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Medical Consultations History: {viewHistoryPatient.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Patient ID: {viewHistoryPatient.id} • Blood: {viewHistoryPatient.bloodGroup || 'O+'}
                </p>
              </div>
              <button
                onClick={() => setViewHistoryPatient(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {patientHistoryAppointments.length > 0 ? (
                patientHistoryAppointments.map((app) => {
                  const doc = doctors.find(d => d.id === app.doctorId);
                  const docAvatar = doc?.avatar || DOCTOR_AVATARS[doc?.id || ''] || DOCTOR_AVATARS.default;
                  return (
                    <div key={app.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          {app.date} at {app.time} HRS
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          app.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-800">
                        <img 
                          src={docAvatar} 
                          alt={doc?.name} 
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span><strong>Consultant:</strong> {doc?.name} ({doc?.specialization})</span>
                      </div>

                      {app.diagnosis && (
                        <div className="text-xs text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                          <strong className="text-teal-700">Diagnosis:</strong> {app.diagnosis}
                        </div>
                      )}

                      {app.prescription && (
                        <div className="text-xs text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 font-mono whitespace-pre-line">
                          <strong className="text-emerald-700 font-sans font-bold">Prescription:</strong>
                          <br />
                          {app.prescription}
                        </div>
                      )}

                      {app.notes && (
                        <div className="text-xs text-slate-500 italic">
                          Notes: {app.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No previous consultation records found for this patient.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setViewHistoryPatient(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (SQL DELETE) */}
      {deletingPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-base">Delete Patient Record (SQL DELETE)</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete patient <strong className="text-slate-900">{deletingPatient.name}</strong> (ID: {deletingPatient.id})? This will execute <code className="text-rose-600 font-bold">DELETE FROM patients WHERE id = '{deletingPatient.id}'</code>.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingPatient(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePatient}
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
