import React, { useState, useEffect } from 'react';
import logoImg from '../../assets/logo.png';
import { X, ShieldCheck, QrCode, CreditCard, Landmark, Wallet, Clock, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RazorpayModal({ isOpen, onClose, amount = 524, courseTitle = "ABHYAAS Class 11 (26-27)", user, onSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState('UPI_QR'); // UPI_QR, CARDS, NETBANKING, WALLET
  const [processing, setProcessing] = useState(false);
  const [timer, setTimer] = useState(712); // 11 mins 52 secs

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSimulatePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      if (onSuccess) {
        onSuccess({
          paymentId: `pay_rzp_${Date.now()}`,
          orderId: `order_rzp_${Date.now()}`,
          signature: 'verified_razorpay_signature'
        });
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      
      {/* Exact Image 3 Replica Modal Container */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 min-h-[580px] border border-slate-200 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT PANEL: Razorpay Teal Gradient Sidebar (Exact Image 3 Match) */}
        <div className="md:col-span-5 bg-gradient-to-b from-[#0284C7] via-[#0369A1] to-[#0F172A] text-white p-6 sm:p-8 flex flex-col justify-between space-y-6">
          
          <div className="space-y-6">
            {/* Header Brand Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md flex items-center justify-center">
                <img src={logoImg} alt="Sarvottam Diksha" className="max-h-full w-auto object-contain" />
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">Sarvottam Diksha</h3>
                <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Razorpay Trusted Business
                </span>
              </div>
            </div>

            {/* Price Summary Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-sky-100 uppercase tracking-wider block">Price Summary</span>
              <div className="text-3xl font-black text-white">₹{amount}.00</div>
              <span className="text-[11px] text-sky-200 font-medium block truncate pt-1">{courseTitle}</span>
            </div>

            {/* Contact Details Pill */}
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold text-white">
              <span className="truncate">Using as {user?.phone || '+91 91080 65494'}</span>
              <ChevronRight className="w-4 h-4 text-sky-200 shrink-0" />
            </div>

            {/* Offers Banner Pill */}
            <div className="bg-emerald-500/20 border border-emerald-400/30 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-200 flex items-center justify-between">
              <span>Offers on UPI, Card and...</span>
              <ChevronRight className="w-4 h-4 text-emerald-300" />
            </div>
          </div>

          {/* Bottom Illustration & Razorpay Footer */}
          <div className="space-y-2 text-center pt-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-sky-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Encrypted & Safe Payment</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold block">Secured by Razorpay</span>
          </div>

        </div>

        {/* RIGHT PANEL: Payment Options & QR Code (Exact Image 3 Match) */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 flex flex-col justify-between space-y-6">
          
          <div className="space-y-6">
            
            {/* Header */}
            <div>
              <h3 className="text-xl font-black text-slate-900">Payment Options</h3>
              <p className="text-xs font-bold text-slate-500">Select your preferred payment method below.</p>
            </div>

            {/* Cashback Offer Pill */}
            <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-[#0284C7]">
              <span>🎉 Win up to ₹100 cashback on every UPI payment</span>
              <span className="bg-white text-[#0284C7] px-2 py-0.5 rounded-full text-[10px] border border-sky-200">+3 View all</span>
            </div>

            {/* Payment Method Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              
              {/* Payment Methods Left Tabs */}
              <div className="sm:col-span-5 space-y-2">
                <button
                  onClick={() => setSelectedMethod('UPI_QR')}
                  className={`w-full p-3 rounded-xl text-xs font-extrabold text-left flex items-center justify-between transition-all ${
                    selectedMethod === 'UPI_QR' ? 'bg-sky-100 text-[#0284C7] border-2 border-[#0284C7]' : 'bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><QrCode className="w-4 h-4" /> UPI / QR</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-black">5 Offers</span>
                </button>

                <button
                  onClick={() => setSelectedMethod('CARDS')}
                  className={`w-full p-3 rounded-xl text-xs font-extrabold text-left flex items-center justify-between transition-all ${
                    selectedMethod === 'CARDS' ? 'bg-sky-100 text-[#0284C7] border-2 border-[#0284C7]' : 'bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Cards</span>
                  <span className="text-[9px] text-slate-500 font-bold">Save 1.5%</span>
                </button>

                <button
                  onClick={() => setSelectedMethod('NETBANKING')}
                  className={`w-full p-3 rounded-xl text-xs font-extrabold text-left flex items-center justify-between transition-all ${
                    selectedMethod === 'NETBANKING' ? 'bg-sky-100 text-[#0284C7] border-2 border-[#0284C7]' : 'bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><Landmark className="w-4 h-4" /> Netbanking</span>
                </button>

                <button
                  onClick={() => setSelectedMethod('WALLET')}
                  className={`w-full p-3 rounded-xl text-xs font-extrabold text-left flex items-center justify-between transition-all ${
                    selectedMethod === 'WALLET' ? 'bg-sky-100 text-[#0284C7] border-2 border-[#0284C7]' : 'bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><Wallet className="w-4 h-4" /> Wallet / PayLater</span>
                </button>
              </div>

              {/* Interactive Selected Payment Method Details Right Pane */}
              <div className="sm:col-span-7 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between">
                
                {selectedMethod === 'UPI_QR' && (
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-between text-xs font-black text-slate-800">
                      <span>Scan UPI QR Code</span>
                      <span className="text-amber-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatTimer(timer)}</span>
                    </div>

                    {/* QR Code Graphic Box */}
                    <div className="bg-white p-4 rounded-xl border border-slate-300 inline-block shadow-sm">
                      <div className="w-36 h-36 bg-slate-900 text-white rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
                        {/* Simulating scannable QR code */}
                        <div className="grid grid-cols-4 gap-1 w-full h-full p-1 opacity-90">
                          {Array.from({ length: 16 }).map((_, idx) => (
                            <div key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-900'} rounded-xs`}></div>
                          ))}
                        </div>
                        <div className="absolute bg-white p-1 rounded-md shadow-md">
                          <img src={logoImg} alt="Logo" className="h-5 w-auto" />
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] font-bold text-slate-600">Scan using Google Pay, PhonePe, Paytm, or BHIM UPI app</p>
                  </div>
                )}

                {selectedMethod === 'CARDS' && (
                  <div className="space-y-3 text-xs font-bold">
                    <span className="text-slate-800 block">Credit / Debit Card Details</span>
                    <input type="text" placeholder="Card Number (4000 1234 5678 9010)" className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="MM/YY" className="bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900" />
                      <input type="password" placeholder="CVV" className="bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900" />
                    </div>
                  </div>
                )}

                {selectedMethod === 'NETBANKING' && (
                  <div className="space-y-2 text-xs font-bold">
                    <span className="text-slate-800 block">Select Netbanking Bank</span>
                    <select className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900">
                      <option>SBI - State Bank of India</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                {selectedMethod === 'WALLET' && (
                  <div className="space-y-2 text-xs font-bold">
                    <span className="text-slate-800 block">Select Wallet or PayLater Provider</span>
                    <select className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900">
                      <option>Paytm Wallet</option>
                      <option>PhonePe Wallet</option>
                      <option>Mobikwik</option>
                      <option>LazyPay (Pay Later)</option>
                    </select>
                  </div>
                )}

                {/* Confirm & Pay Button */}
                <button
                  onClick={handleSimulatePayment}
                  disabled={processing}
                  className="w-full py-3.5 rounded-xl font-black text-xs text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {processing ? 'Verifying Gateway Signature...' : `Pay ₹${amount}.00 & Unlock Course`}
                </button>

              </div>

            </div>

          </div>

          <p className="text-[10px] text-slate-400 text-center font-bold">
            By proceeding, I agree to Razorpay's Privacy Notice • Edit Preferences
          </p>

        </div>

      </div>
    </div>
  );
}
