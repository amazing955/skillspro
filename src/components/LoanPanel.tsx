import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { LoanRequest, Certificate } from '../types';
import { Landmark, ShieldCheck, ShieldAlert, FileText, Send, Phone, Camera, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoanPanel() {
  const { user, profile } = useAuth();
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [phone, setPhone] = useState(profile?.phoneNumber || '');
  const [securityDetails, setSecurityDetails] = useState('');
  const [idFront, setIdFront] = useState('https://images.unsplash.com/photo-1621348160394-211bc0a5a3a0?auto=format&fit=crop&q=80&w=400');
  const [idBack, setIdBack] = useState('https://images.unsplash.com/photo-1621348160394-211bc0a5a3a0?auto=format&fit=crop&q=80&w=400');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const loanQ = query(collection(db, 'loanRequests'), where('userId', '==', user.uid));
      const certQ = query(collection(db, 'certificates'), where('userId', '==', user.uid));
      
      const [loanSnap, certSnap] = await Promise.all([getDocs(loanQ), getDocs(certQ)]);
      
      setLoans(loanSnap.docs.map(d => ({ id: d.id, ...d.data() } as LoanRequest)));
      setCerts(certSnap.docs.map(d => ({ id: d.id, ...d.data() } as Certificate)));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const canApply = certs.length > 0 && (profile?.savingsBalance || 0) >= 100000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canApply) return;

    // Update profile phone if not set
    if (!profile?.phoneNumber) {
       await updateDoc(doc(db, 'users', user.uid), { phoneNumber: phone });
    }

    await addDoc(collection(db, 'loanRequests'), {
      userId: user.uid,
      amount: parseInt(amount),
      purpose,
      status: 'pending',
      createdAt: new Date().toISOString(),
      certificateId: certs[0]?.id,
      phoneNumber: phone,
      idFrontImageUrl: idFront,
      idBackImageUrl: idBack,
      securityDetails
    });

    alert("Loan application submitted successfully for review.");
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="serif text-3xl font-bold text-[#1a1a1a]">Startup Capital</h2>
        <p className="text-gray-500">Government-backed loans for verified local skilled workers.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="card-soft p-8 space-y-6">
            <h3 className="font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Eligibility Checklist
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#5A5A40]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Skill Certificate</span>
                </div>
                {certs.length > 0 ? <ShieldCheck className="w-5 h-5 text-green-500" /> : <ShieldAlert className="w-5 h-5 text-gray-300" />}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Landmark className="w-5 h-5 text-[#5A5A40]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Min. Savings (100k)</span>
                </div>
                {(profile?.savingsBalance || 0) >= 100000 ? <ShieldCheck className="w-5 h-5 text-green-500" /> : <ShieldAlert className="w-5 h-5 text-gray-300" />}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-[#5A5A40]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">National ID Upload</span>
                </div>
                <ShieldCheck className="w-5 h-5 text-green-500" />
              </div>
            </div>

            {!canApply && (
              <div className="p-4 bg-amber-50 rounded-2xl flex gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-relaxed">
                  Locked: You must finish Day 7 of your course and meet the savings threshold to unlock this fund.
                </p>
              </div>
            )}
          </div>

          <div className="card-soft p-8">
            <h3 className="font-bold mb-4 uppercase text-[10px] tracking-widest text-gray-400">Application History</h3>
            <div className="space-y-4">
              {loans.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No current applications.</p>
              ) : (
                loans.map(loan => (
                  <div key={loan.id} className="p-4 border border-black/5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">UGX {loan.amount.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-400">Ref: {loan.id.slice(0, 8).toUpperCase()}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      loan.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      loan.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {loan.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={`card-soft p-8 ${!canApply && 'opacity-50 pointer-events-none grayscale'}`}>
           <h3 className="serif text-2xl font-bold mb-6">Investment Application</h3>
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Capital Required</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="UGX 2,500,000"
                    max={5000000}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-black/5 outline-none focus:ring-1 ring-[#5A5A40]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+256..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl border border-black/5 outline-none focus:ring-1 ring-[#5A5A40]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">National ID Verification</label>
                <div className="grid grid-cols-2 gap-4 mt-1">
                   <div className="aspect-[3/2] bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-200 transition-colors">
                      <Camera className="w-6 h-6 text-gray-400" />
                      <span className="text-[9px] font-bold uppercase text-gray-400">Front Side</span>
                   </div>
                   <div className="aspect-[3/2] bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-200 transition-colors">
                      <Camera className="w-6 h-6 text-gray-400" />
                      <span className="text-[9px] font-bold uppercase text-gray-400">Back Side</span>
                   </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Collateral / Security Details</label>
                <div className="relative">
                   <Lock className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                   <textarea 
                    value={securityDetails}
                    onChange={(e) => setSecurityDetails(e.target.value)}
                    placeholder="E.g. Motorbike logbook, Land agreement, or Guarantor details..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl border border-black/5 resize-none outline-none focus:ring-1 ring-[#5A5A40]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Business Expansion Plan</label>
                <textarea 
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Describe your equipment needs..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-black/5 resize-none outline-none focus:ring-1 ring-[#5A5A40]"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={!canApply}
                className="w-full btn-olive py-4 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:shadow-none"
              >
                <Send className="w-4 h-4" /> Submit for Verification
              </button>
           </form>
        </div>
      </div>
    </div>
  );
}
