import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Plus, 
  Printer, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  Building2, 
  HeartPulse, 
  X, 
  FileText,
  CreditCard,
  QrCode
} from 'lucide-react';
import { Bill, Appointment, Doctor, Patient } from '../../types';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { DOCTOR_AVATARS } from '../../assets/images';

interface BillingPageProps {
  bills: Bill[];
  appointments: Appointment[];
  doctors: Doctor[];
  patients: Patient[];
  onDataChanged: () => void;
  initialAppointmentId?: string | null;
  onClearInitialAppointmentId?: () => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({
  bills,
  appointments,
  doctors,
  patients,
  onDataChanged,
  initialAppointmentId,
  onClearInitialAppointmentId
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('All');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(Boolean(initialAppointmentId));
  const [activeInvoiceBill, setActiveInvoiceBill] = useState<Bill | null>(null);

  // Form State for Bill Creation
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    initialAppointmentId || ''
  );
  const [consultationFee, setConsultationFee] = useState<number>(500);
  const [medicineCharges, setMedicineCharges] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Insurance'>('UPI');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (selectedAppointmentId) {
      const app = appointments.find(a => a.id === selectedAppointmentId);
      if (app) {
        const doc = doctors.find(d => d.id === app.doctorId);
        if (doc) {
          setConsultationFee(doc.consultationFee);
        }
      }
    }
  }, [selectedAppointmentId, appointments, doctors]);

  React.useEffect(() => {
    if (initialAppointmentId) {
      setSelectedAppointmentId(initialAppointmentId);
      setIsGenerateModalOpen(true);
      if (onClearInitialAppointmentId) onClearInitialAppointmentId();
    }
  }, [initialAppointmentId]);

  const handleOpenGenerate = () => {
    const completedWithoutBill = appointments.find(
      a => a.status === 'Completed' && !bills.some(b => b.appointmentId === a.id)
    );
    if (completedWithoutBill) {
      setSelectedAppointmentId(completedWithoutBill.id);
    } else if (appointments.length > 0) {
      setSelectedAppointmentId(appointments[0].id);
    }
    setMedicineCharges(0);
    setDiscount(0);
    setPaymentStatus('Paid');
    setIsGenerateModalOpen(true);
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentId) {
      error('Please select an appointment');
      return;
    }

    const app = appointments.find(a => a.id === selectedAppointmentId);
    if (!app) {
      error('Appointment not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBill = await api.createBill({
        appointmentId: app.id,
        patientId: app.patientId,
        doctorId: app.doctorId,
        consultationFee: Number(consultationFee),
        medicineCharges: Number(medicineCharges),
        discount: Number(discount),
        totalAmount: Math.max(0, Number(consultationFee) + Number(medicineCharges) - Number(discount)),
        billDate,
        paymentStatus,
        paymentMethod
      });

      success(`Invoice ${newBill.invoiceNumber} created successfully!`);
      setIsGenerateModalOpen(false);
      onDataChanged();
      setActiveInvoiceBill(newBill);
    } catch (err: any) {
      error(err.message || 'Failed to generate bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredBills = bills.filter((b) => {
    const pat = patients.find(p => p.id === b.patientId);
    const doc = doctors.find(d => d.id === b.doctorId);

    const matchesSearch =
      b.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      pat?.name.toLowerCase().includes(search.toLowerCase()) ||
      doc?.name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterPayment === 'All' || b.paymentStatus === filterPayment;

    return matchesSearch && matchesStatus;
  });

  const totalCalculated = Math.max(0, Number(consultationFee) + Number(medicineCharges) - Number(discount));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Nexus Care Billing & Tax Invoices
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Generate OPD bills, calculate pharmacy dispensations, issue receipts and manage transaction records
          </p>
        </div>

        <button
          onClick={handleOpenGenerate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white shadow-md shadow-teal-700/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number (e.g. INV-2026-001) or patient name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-600 shrink-0">Payment:</span>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          >
            <option value="All">All Invoices</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Consultant Doctor</th>
                <th className="py-3 px-4 text-right">Consultation</th>
                <th className="py-3 px-4 text-right">Pharmacy</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length > 0 ? (
                filteredBills.map((b) => {
                  const pat = patients.find(p => p.id === b.patientId);
                  const doc = doctors.find(d => d.id === b.doctorId);
                  const docAvatar = doc?.avatar || DOCTOR_AVATARS[doc?.id || ''] || DOCTOR_AVATARS.default;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                        {b.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {b.billDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{pat?.name || 'Patient'}</div>
                        <div className="text-[11px] text-slate-500">{pat?.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <img 
                            src={docAvatar} 
                            alt={doc?.name} 
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-800">{doc?.name || 'Doctor'}</div>
                            <div className="text-[11px] text-slate-500">{doc?.specialization}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        ₹{b.consultationFee}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        ₹{b.medicineCharges}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        ₹{b.totalAmount}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            b.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              b.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {b.paymentStatus} ({b.paymentMethod})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveInvoiceBill(b)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No bills found. Click "Generate New Invoice" to create a bill.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Bill Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                Generate Nexus Care OPD Invoice
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Select Completed Appointment *
                </label>
                <select
                  value={selectedAppointmentId}
                  onChange={(e) => setSelectedAppointmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                >
                  <option value="">-- Choose Appointment --</option>
                  {appointments.map((app) => {
                    const pat = patients.find(p => p.id === app.patientId);
                    const doc = doctors.find(d => d.id === app.doctorId);
                    const alreadyBilled = bills.some(b => b.appointmentId === app.id);
                    return (
                      <option key={app.id} value={app.id}>
                        {app.date} • {pat?.name} with {doc?.name} ({app.status}) {alreadyBilled ? '[Billed]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Consultation Fee (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Medicine Charges (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={medicineCharges}
                    onChange={(e) => setMedicineCharges(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Bill Date *
                  </label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-bold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash Counter</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Insurance">TPA Insurance</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-teal-900 uppercase font-bold">Net Total Amount:</span>
                  <div className="font-heading text-xl font-black text-slate-900">
                    ₹{totalCalculated.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-xs text-slate-600 text-right">
                  <div>Consultation: ₹{consultationFee}</div>
                  <div>Pharmacy: +₹{medicineCharges}</div>
                  {discount > 0 && <div className="text-emerald-600">Discount: -₹{discount}</div>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? 'Generating...' : 'Confirm & Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {activeInvoiceBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 print:shadow-none print:border-none print:w-full print:max-w-none">
            {/* Header controls (hidden in print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
                Nexus Care Tax Invoice & OPD Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setActiveInvoiceBill(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="space-y-6 text-slate-900" id="printable-receipt">
              {/* Hospital Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md">
                    <HeartPulse className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="font-heading text-xl font-black tracking-tight text-slate-900">
                      NEXUS CARE MULTISPECIALTY HOSPITAL
                    </h1>
                    <p className="text-xs text-slate-600">
                      Main Campus Plot 14, Health City, Mumbai - 400053
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Accreditation: NABH-HOSP-2026 • Emergency: 108 • Desk: +91 22 2844 9900
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                    {activeInvoiceBill.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Date: <strong className="text-slate-800">{activeInvoiceBill.billDate}</strong>
                  </div>
                </div>
              </div>

              {/* Patient & Doctor Particulars */}
              {(() => {
                const pat = patients.find(p => p.id === activeInvoiceBill.patientId);
                const doc = doctors.find(d => d.id === activeInvoiceBill.doctorId);
                return (
                  <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                        Patient Particulars
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{pat?.name}</div>
                      <div className="text-slate-600">
                        {pat?.gender}, {pat?.age} Years • Blood: {pat?.bloodGroup || 'O+'}
                      </div>
                      <div className="text-slate-600 font-mono">Contact: {pat?.phone}</div>
                      <div className="text-slate-500 truncate">{pat?.address}</div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                        Consultant Physician & OPD
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{doc?.name}</div>
                      <div className="text-teal-700 font-semibold">{doc?.specialization}</div>
                      <div className="text-slate-600">{doc?.qualifications}</div>
                      <div className="text-slate-500">Room: {doc?.roomNumber}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Description of Medical Service</th>
                      <th className="py-2.5 px-3 text-right">Department</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-3 font-mono">01</td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        Specialist OPD Consultation & Clinical Examination
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">OPD Clinical</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        ₹{activeInvoiceBill.consultationFee.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-mono">02</td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        Pharmacy Dispensary & Prescribed Medicines
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">Nexus Pharmacy</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        ₹{activeInvoiceBill.medicineCharges.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 text-xs">
                    {activeInvoiceBill.discount > 0 && (
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right font-semibold text-slate-600">
                          Institutional Discount:
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">
                          -₹{activeInvoiceBill.discount.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-slate-200">
                      <td colSpan={3} className="py-2.5 px-3 text-right font-extrabold text-slate-900 text-sm">
                        Total Amount Paid:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-teal-800 text-base">
                        ₹{activeInvoiceBill.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Mode & Stamp */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Payment Verified: <strong className="text-emerald-700">{activeInvoiceBill.paymentStatus}</strong> via {activeInvoiceBill.paymentMethod}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Official tax invoice generated by Nexus Care Electronic Health System.
                  </p>
                </div>

                <div className="border-2 border-dashed border-teal-600/60 rounded-2xl px-4 py-2 text-center text-teal-900 font-bold text-[10px] uppercase tracking-wider rotate-[-2deg]">
                  Nexus Care Accounts<br />
                  <span className="text-[9px] text-slate-500">PAID & SETTLED</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-xs text-slate-500">
                <div>
                  <div className="w-40 border-b border-slate-400 mb-1" />
                  <span>Authorized Reception Desk</span>
                </div>
                <div className="text-right">
                  <div className="w-40 border-b border-slate-400 ml-auto mb-1" />
                  <span>Medical Director / Accounts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
