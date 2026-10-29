import React, { useState } from 'react';
import { 
  HeartPulse, 
  ShieldCheck, 
  ExternalLink, 
  PhoneCall, 
  FileText, 
  CheckCircle2, 
  Building2, 
  Clock, 
  MapPin, 
  Mail, 
  AlertCircle 
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { InfoModal } from '../common/InfoModal';

interface FooterProps {
  onSelectTab: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const [modalState, setModalState] = useState<{
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

  const openInfo = (title: string, category: string, content: React.ReactNode) => {
    setModalState({
      isOpen: true,
      title,
      category,
      content
    });
  };

  const handleLinkClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    action();
  };

  return (
    <>
      <footer className="bg-slate-100 border-t border-slate-300/80 text-slate-700 pt-12 pb-8 px-4 sm:px-6 lg:px-12 mt-12 font-sans transition-colors">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* 4 Navigation Columns matching User Screenshot 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            
            {/* Column 1: Site Menu */}
            <div className="space-y-3.5">
              <h4 className="font-heading font-extrabold text-slate-900 text-base tracking-tight">
                Site Menu
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li>
                  <button
                    onClick={() => onSelectTab('billing')}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Health & drug plans
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('dashboard')}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Nexus Care basics
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('doctors')}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Providers & clinical services
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openInfo(
                      'What Nexus Care Covers',
                      'Coverage & Benefits',
                      <div className="space-y-3">
                        <p>Nexus Care provides comprehensive multi-specialty coverage across in-patient, outpatient, and emergency trauma divisions:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li><strong>Specialist OPD Consultations:</strong> Cardiology, Neurology, Orthopedics, Dermatology, Pediatrics, and Internal Medicine.</li>
                          <li><strong>Diagnostic Investigations:</strong> NABL accredited pathology, digital ECG, 2D Echo, hematology, lipid profiling, and biochemical assays.</li>
                          <li><strong>Pharmacy & Prescriptions:</strong> Full-range dispensary with verified generic and branded pharmaceuticals.</li>
                          <li><strong>Insurance & Cashless TPA:</strong> Empanelled with major public and private health insurers and PM-JAY Ayushman Bharat.</li>
                        </ul>
                      </div>
                    )}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    What Nexus Care covers
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openInfo(
                      'Hospital Campus & Department Layout',
                      'Facility Navigation',
                      <div className="space-y-3">
                        <p><strong>Main Hospital Campus Directory:</strong></p>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div>• Ground Floor: Registration Desk, Emergency & Trauma, Radiology</div>
                          <div>• 1st Floor: Cardiology OPD (101-105), Dermatology OPD (106-110)</div>
                          <div>• 2nd Floor: Orthopedics (201-205), General Medicine (206-210)</div>
                          <div>• 3rd Floor: Neurology, Pediatrics, In-patient Daycare Units</div>
                        </div>
                      </div>
                    )}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Site & campus map
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Take Action */}
            <div className="space-y-3.5">
              <h4 className="font-heading font-extrabold text-slate-900 text-base tracking-tight">
                Take Action
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li>
                  <button
                    onClick={() => onSelectTab('billing')}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Find health & drug plans
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('doctors')}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Find care providers & doctors
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('reception')}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Patient registration & triage
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('appointments')}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Book an OPD appointment
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('billing')}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Find insurance & TPA desk
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openInfo(
                      'Emergency Clinical Hotline & Ambulance',
                      'Urgent Assistance',
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-bold">
                          🚨 Emergency Hotline: 108 (Toll-Free, 24/7)
                        </div>
                        <p>Direct Hospital Ambulance Fleet & Trauma Center:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Advanced Cardiac Life Support (ACLS) Ambulance: +91 22 2844 9911</li>
                          <li>Main OPD Reception Desk: +91 22 2844 9900</li>
                          <li>Chief Medical Officer On-Call: +91 98210 00001</li>
                        </ul>
                      </div>
                    )}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer text-rose-600 font-semibold"
                  >
                    Emergency hotline: 108 / 24x7 desk
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('patients')}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Electronic patient records
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openInfo(
                      'Hospital Helpdesk & Language Assistance',
                      'Patient Services',
                      <div className="space-y-2">
                        <p>Our front desk staff provides consultation assistance in <strong>English, Hindi, Marathi, and Gujarati</strong>.</p>
                        <p>To request an interpreter or companion assistance for senior citizens, please contact counter Counter A-1 upon arrival.</p>
                      </div>
                    )}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Talk to healthcare coordinator
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Health Portals & Regulatory */}
            <div className="space-y-3.5">
              <h4 className="font-heading font-extrabold text-slate-900 text-base tracking-tight">
                Health Portals & Regulatory
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li>
                  <a
                    href="https://nha.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>NHA.gov.in (National Health Authority)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://pmjay.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>PM-JAY (Ayushman Bharat)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.mohfw.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>MoHFW.gov.in (Ministry of Health)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.nmc.org.in"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>NMC.org.in (National Medical Commission)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://nabh.co"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>NABH Standards (Hospital Accreditation)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://arogya.maharashtra.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Arogya.Maharashtra.gov.in (DHS)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Helpful Links */}
            <div className="space-y-3.5">
              <h4 className="font-heading font-extrabold text-slate-900 text-base tracking-tight">
                Helpful Links & Compliance
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li>
                  <button
                    onClick={() => openInfo(
                      'Patient Rights & Responsibilities Charter',
                      'Clinical Governance',
                      <div className="space-y-3">
                        <p>Under the Clinical Establishments Act and IMA ethical standards, every patient at Nexus Care is entitled to:</p>
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>Respectful, non-discriminatory care regardless of caste, creed, or economic status.</li>
                          <li>Clear information regarding diagnosis, treatment options, potential side-effects, and estimated costs prior to intervention.</li>
                          <li>Full confidentiality of all medical records, prescription data, and lab findings.</li>
                          <li>Access to second clinical opinion without interruption of urgent care.</li>
                        </ol>
                      </div>
                    )}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Patient Rights & Charter
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openInfo(
                      'Clinical Quality & Safety Standards',
                      'Compliance',
                      <p>Nexus Care adheres strictly to NABH 5th Edition standards, incorporating real-time infection control audits, bi-weekly surgical equipment autoclaving, and bio-medical waste segregation per CPCB guidelines.</p>
                    )}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Clinical safety protocols
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openInfo(
                      'Patient Grievance & Vigilance Officer',
                      'Support',
                      <div className="space-y-2">
                        <p>For inquiries, billing clarifications, or feedback regarding your hospital experience, reach out to our grievance desk:</p>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div><strong>Grievance Officer:</strong> Smt. Priya Verma</div>
                          <div><strong>Email:</strong> grievance@nexuscare.health / admin@medicare.com</div>
                          <div><strong>Direct Telephone:</strong> +91 22 2844 9905 (Ext. 104)</div>
                        </div>
                      </div>
                    )}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Patient grievance cell
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('reports')}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Clinical reports & registry archives
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openInfo(
                      'Downloadable Health Documents & Forms',
                      'Resources',
                      <div className="space-y-2">
                        <p>Standard hospital documents available at OPD reception:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>OPD Registration Form (Form A-1)</li>
                          <li>TPA Cashless Pre-Authorization Request</li>
                          <li>Medical Leave Certificate Request</li>
                          <li>Prescription Record Duplicate Request</li>
                        </ul>
                      </div>
                    )}
                    className="hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
                  >
                    Downloadable forms & records
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Links Row matching User Screenshot 1 */}
          <div className="pt-6 border-t border-slate-300 flex items-center justify-end gap-5">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-teal-600 text-white flex items-center justify-center transition-colors shadow-2xs"
              title="Facebook"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>

            {/* X / Twitter */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-teal-600 text-white flex items-center justify-center transition-colors shadow-2xs"
              title="X"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-2xs"
              title="YouTube"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>

          {/* Legal Links Row matching User Screenshot 1 */}
          <div className="pt-4 border-t border-slate-300 text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <button
              onClick={() => openInfo(
                'About Nexus Care Multispecialty Hospital',
                'Institutional Profile',
                <div className="space-y-2">
                  <p>Nexus Care is a premier 250-bed tertiary multispecialty hospital committed to world-class clinical excellence, advanced diagnostics, and ethical medical care.</p>
                  <p>Equipped with modern modular operating theaters, advanced cardiovascular cath labs, level-3 NICU/ICU, and 24x7 emergency and trauma resuscitation units.</p>
                </div>
              )}
              className="hover:text-teal-800 hover:underline cursor-pointer"
            >
              About Nexus Care
            </button>
            <span className="text-slate-400">|</span>

            <button
              onClick={() => openInfo(
                'Nondiscrimination & Accessibility Statement',
                'Legal & Compliance',
                <p>Nexus Care complies with applicable national civil rights laws and does not discriminate on the basis of race, color, national origin, age, disability, or gender. Free language assistance services and wheelchair accommodations are accessible across all campus wings.</p>
              )}
              className="hover:text-teal-800 hover:underline cursor-pointer"
            >
              Nondiscrimination / Accessibility
            </button>
            <span className="text-slate-400">|</span>

            <button
              onClick={() => openInfo(
                'Patient Privacy & Data Protection Policy',
                'Confidentiality',
                <p>All electronic health records (EHR), diagnostic test results, and physician notes are encrypted under the Digital Information Security in Healthcare Act (DISHA) and HIPAA-aligned security protocols.</p>
              )}
              className="hover:text-teal-800 hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-400">|</span>

            <button
              onClick={() => openInfo(
                'Privacy Settings & Electronic Health Record Access',
                'User Settings',
                <p>Patients may request copies of their digital prescriptions, billing tax invoices, or update their registered contact numbers directly via the Reception Desk.</p>
              )}
              className="hover:text-teal-800 hover:underline cursor-pointer"
            >
              Privacy Setting
            </button>
            <span className="text-slate-400">|</span>

            <button
              onClick={() => openInfo(
                'Linking & Referral Policy',
                'Policy',
                <p>Nexus Care links only to verified national health databases, regulatory portals (NHA, NMC, MoHFW), and recognized medical universities.</p>
              )}
              className="hover:text-teal-800 hover:underline cursor-pointer"
            >
              Linking Policy
            </button>
            <span className="text-slate-400">|</span>

            <button
              onClick={() => openInfo(
                'Using this Clinical Workstation Portal',
                'User Guidelines',
                <p>This portal is intended for authorized staff (Admin, Reception, Doctor) to manage hospital outpatient intake, assign doctors by syndrome, and issue tax invoices.</p>
              )}
              className="hover:text-teal-800 hover:underline cursor-pointer"
            >
              Using this site
            </button>
            <span className="text-slate-400">|</span>

            <button
              onClick={() => openInfo(
                'Plain Language Medical Communication',
                'Transparency',
                <p>All clinical discharge summaries, prescription instructions, and invoice line items are composed in plain, readable terminology for patient safety.</p>
              )}
              className="hover:text-teal-800 hover:underline cursor-pointer"
            >
              Plain Writing
            </button>
          </div>

          {/* Bottom Official Disclaimer Row matching User Screenshot 1 */}
          <div className="pt-6 border-t border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Logo on Left */}
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                NexusCare<span className="text-teal-600 font-normal">.health</span>
              </span>
            </div>

            {/* Official Seal and Hospital Disclaimer on Right */}
            <div className="flex items-center gap-3 text-xs text-slate-500 max-w-lg">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200 shadow-2xs">
                <ShieldCheck className="w-6 h-6 text-teal-700" />
              </div>
              <div className="leading-snug">
                An accredited multispecialty hospital facility licensed by the Directorate of Health Services (DHS).
                <br />
                <span className="text-slate-600 font-medium">Plot 14, Health City, Sector 12, Mumbai, Maharashtra 400053 • Reg. DHS-MH-2026-9811</span>
              </div>
            </div>

          </div>

        </div>
      </footer>

      {/* Information Dialog Modal */}
      <InfoModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        title={modalState.title}
        category={modalState.category}
        content={modalState.content}
      />
    </>
  );
};
