import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useBranding } from '../context/BrandingContext';
import { Shield, FileCheck, RefreshCw, Phone, Mail, MapPin, Lock, Server, UserCheck, CheckCircle2 } from 'lucide-react';

export default function LegalPages() {
  const location = useLocation();
  const { branding } = useBranding();

  const isPrivacy = location.pathname.includes('privacy') || location.pathname === '/privacy-policy';
  const isTerms = location.pathname.includes('terms');
  const isRefund = location.pathname.includes('refund');
  const isContact = location.pathname.includes('contact');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Tabs */}
      <div className="flex flex-wrap gap-2.5 bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-sm text-xs font-black">
        <Link
          to="/privacy-policy"
          className={`px-5 py-3 rounded-xl transition-all ${
            isPrivacy ? 'bg-[#0284C7] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms-and-conditions"
          className={`px-5 py-3 rounded-xl transition-all ${
            isTerms ? 'bg-[#0284C7] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Terms & Conditions
        </Link>
        <Link
          to="/refund-policy"
          className={`px-5 py-3 rounded-xl transition-all ${
            isRefund ? 'bg-[#0284C7] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Refund Policy
        </Link>
        <Link
          to="/contact-us"
          className={`px-5 py-3 rounded-xl transition-all ${
            isContact ? 'bg-[#0284C7] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Contact Support
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-slate-200 shadow-md space-y-8 text-slate-800 text-sm font-semibold leading-relaxed">
        
        {isPrivacy && (
          <div className="space-y-6">
            
            {/* Header Badge */}
            <div className="space-y-2 border-b border-slate-200 pb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 border border-sky-300 text-xs font-black text-[#0284C7]">
                <Shield className="w-4 h-4" />
                <span>Student Data Protection & Security</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
              <p className="text-xs font-bold text-slate-500">Last Updated: August 2026 • {branding.appName} Mathematics Portal</p>
            </div>

            {/* Section 1 */}
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0284C7]" /> 1. Information We Collect
              </h3>
              <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                At Sarvottam Diksha, we respect student privacy. When registering or enrolling in our Mathematics courses for Grades 6–12, we collect basic details:
              </p>
              <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-1 font-medium">
                <li><strong>Account Identity:</strong> Student Full Name, Email Address, and Mobile Phone Number.</li>
                <li><strong>Academic Progress:</strong> Test scores, MCQ question timing logs, accuracy rates, and formula notes download history.</li>
                <li><strong>Communication Logs:</strong> Doubt messages sent directly to Manika Maheshwari under the Chats section.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" /> 2. Payment Security & PCI-DSS Compliance
              </h3>
              <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                All financial transactions (UPI, Credit/Debit Cards, NetBanking) are securely processed by <strong>Razorpay</strong> via 256-bit SSL encryption. 
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>Sarvottam Diksha NEVER stores raw credit card numbers, CVVs, UPI PINs, or bank passwords on our servers.</span>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-600" /> 3. Data Usage & Confidentiality
              </h3>
              <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                Your personal details are strictly used for managing course enrollments, delivering test evaluation analytics, and sending batch notifications. We do NOT sell, rent, or trade student personal information to third-party advertisers.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900">4. Contacting Privacy Officer</h3>
              <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                For questions regarding data inspection, profile updates, or account deletion requests, please contact Manika Maheshwari at <strong className="text-slate-900">{branding.contactEmail}</strong> or call <strong className="text-slate-900">{branding.contactPhone}</strong>.
              </p>
            </div>

          </div>
        )}

        {isTerms && (
          <div className="space-y-6">
            <div className="space-y-2 border-b border-slate-200 pb-6">
              <h1 className="text-3xl font-black text-slate-900">Terms & Conditions</h1>
              <p className="text-xs font-bold text-slate-500">Effective Date: August 2026 • {branding.appName}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900">1. Intellectual Property & Copyright</h3>
              <p className="text-slate-700 text-xs sm:text-sm">
                All video lectures, PDF formula handbooks, and chapterwise MCQ questions are the exclusive property of Manika Maheshwari / Sarvottam Diksha. Unauthorized recording, commercial resale, or external sharing is strictly prohibited.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900">2. Student License & Course Validity</h3>
              <p className="text-slate-700 text-xs sm:text-sm">
                Each student account is non-transferable. Enrolled courses remain active for 365 days from the verified payment timestamp.
              </p>
            </div>
          </div>
        )}

        {isRefund && (
          <div className="space-y-6">
            <div className="space-y-2 border-b border-slate-200 pb-6">
              <h1 className="text-3xl font-black text-slate-900">Refund & Cancellation Policy</h1>
              <p className="text-xs font-bold text-slate-500">Effective Date: August 2026 • {branding.appName}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900">1. Digital Course Access Policy</h3>
              <p className="text-slate-700 text-xs sm:text-sm">
                Because digital video lectures, PDF handbooks, and MCQ test series are unlocked immediately upon payment verification, course enrollment fees are non-refundable.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900">2. Accidental Duplicate Transactions</h3>
              <p className="text-slate-700 text-xs sm:text-sm">
                In case of accidental duplicate charges or gateway technical glitches, full refunds will be issued within 7 days upon submitting transaction receipts to support.
              </p>
            </div>
          </div>
        )}

        {isContact && (
          <div className="space-y-6">
            <div className="space-y-2 border-b border-slate-200 pb-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider border border-amber-300">
                ★ 1-ON-1 STUDENT SUPPORT & ADMISSIONS
              </span>
              <h1 className="text-3xl font-black text-slate-900">Contact Manika Maheshwari</h1>
              <p className="text-sm font-bold text-slate-600">Founder & Lead Mathematics Educator • Sarvottam Diksha</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="p-6 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-2 shadow-xs">
                <Mail className="w-6 h-6 text-[#FF6500]" />
                <h4 className="text-base font-black text-slate-900">Email Ma'am Directly</h4>
                <p className="text-sm font-black text-slate-800">{branding.contactEmail || 'manika@sarvottamdiksha.com'}</p>
                <p className="text-xs text-slate-600 font-semibold">For personalized doubt clearing, test evaluations & course inquiries.</p>
              </div>

              <div className="p-6 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-2 shadow-xs">
                <Phone className="w-6 h-6 text-[#0284C7]" />
                <h4 className="text-base font-black text-slate-900">Phone & WhatsApp Support</h4>
                <p className="text-sm font-black text-slate-800">{branding.contactPhone || '+91 98765 43210'}</p>
                <p className="text-xs text-slate-600 font-semibold">Available Mon – Sat: 10:00 AM – 7:00 PM IST.</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
