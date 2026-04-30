import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { SavingsTransaction } from '../types';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownLeft, Wallet, History, Plus } from 'lucide-react';

export default function SavingsPanel() {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(profile?.phoneNumber || '');
  const [depositStep, setDepositStep] = useState<'input' | 'waiting' | 'success'>('input');

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      const q = query(
        collection(db, 'savings'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavingsTransaction)));
      setLoading(false);
    };
    fetchTransactions();
  }, [user]);

  const startDeposit = () => {
    if (!amount || !phone) {
      alert("Please enter both amount and phone number.");
      return;
    }
    setDepositStep('waiting');
  };

  const handleDeposit = async () => {
    if (!user || !amount) return;
    const numAmount = parseInt(amount);
    
    // 1. Add Transaction
    const trans = {
      userId: user.uid,
      amount: numAmount,
      type: 'deposit',
      timestamp: new Date().toISOString(),
      description: `M-Money Deposit from ${phone} to 0700355037`
    };
    await addDoc(collection(db, 'savings'), trans);

    // 2. Update User Balance
    await updateDoc(doc(db, 'users', user.uid), {
      savingsBalance: increment(numAmount)
    });

    setDepositStep('success');
    
    // Auto-refresh after 2 seconds
    setTimeout(() => {
      setAmount('');
      setShowDepositModal(false);
      setDepositStep('input');
      window.location.reload(); 
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="serif text-3xl font-bold text-[#1a1a1a]">Savings Unit</h2>
          <p className="text-gray-500">Every shilling saved is a step closer to your business.</p>
        </div>
        <button 
          onClick={() => setShowDepositModal(true)}
          className="btn-olive flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Deposit
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="card-soft p-6 bg-gradient-to-br from-[#5A5A40] to-[#3d3d2c] text-white">
            <Wallet className="w-10 h-10 mb-4 opacity-50" />
            <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Total Balance</div>
            <div className="serif text-3xl font-bold">UGX {profile?.savingsBalance?.toLocaleString() || '0'}</div>
          </div>
          
          <div className="card-soft p-6">
             <h4 className="font-bold text-sm mb-4">Savings Goal</h4>
             <div className="h-2 w-full bg-gray-100 rounded-full mb-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '45%' }}
                  className="h-full bg-green-500" 
                />
             </div>
             <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                <span>UGX 0</span>
                <span className="text-gray-900">45% to Loan Goal</span>
                <span>UGX 5M</span>
             </div>
          </div>
        </div>

        <div className="md:col-span-2 card-soft p-6">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-[#1a1a1a]">Recent Activity</h3>
          </div>
          
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No transactions yet. Start saving today!</div>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 border-b border-black/5 last:border-0 hover:bg-black/[0.01] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${t.type === 'deposit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {t.type === 'deposit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{t.description}</div>
                      <div className="text-[10px] text-gray-400">{new Date(t.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={`font-bold ${t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'deposit' ? '+' : '-'} {t.amount.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showDepositModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl"
           >
              {depositStep === 'input' && (
                <>
                  <h3 className="serif text-2xl font-bold mb-2">Deposit Funds</h3>
                  <p className="text-xs text-gray-500 mb-6 uppercase tracking-widest font-bold">Target Merchant: 0700355037</p>
                  
                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+256..."
                        className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-black/5 focus:outline-none focus:ring-1 ring-[#5A5A40] text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Amount (UGX)</label>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 50000"
                        className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-black/5 focus:outline-none focus:ring-1 ring-[#5A5A40] text-xl font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowDepositModal(false)}
                      className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={startDeposit}
                      className="flex-1 btn-olive py-3"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {depositStep === 'waiting' && (
                <div className="text-center py-4">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                    <History className="w-10 h-10 text-amber-600" />
                  </div>
                  <h3 className="serif text-2xl font-bold mb-2">Awaiting PIN</h3>
                  <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    A USSD prompt has been sent to <span className="font-bold text-black">{phone}</span>. Please enter your Mobile Money PIN on your device to confirm.
                  </p>
                  
                  <button 
                    onClick={handleDeposit}
                    className="w-full btn-olive py-4 rounded-full shadow-lg hover:shadow-xl transition-all"
                  >
                    Simulate PIN Entered
                  </button>
                  <p className="mt-4 text-[10px] uppercase font-bold text-gray-300">Sending to 0700355037</p>
                </div>
              )}

              {depositStep === 'success' && (
                <div className="text-center py-8">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Plus className="w-10 h-10" />
                  </motion.div>
                  <h3 className="serif text-2xl font-bold mb-2">Payment Verified</h3>
                  <p className="text-sm text-gray-500 mb-2">UGX {parseInt(amount).toLocaleString()} added to your balance.</p>
                  <div className="text-[10px] font-bold text-gray-400">Merchant Ref: 0700355037-SAV</div>
                </div>
              )}
           </motion.div>
        </div>
      )}
    </div>
  );
}
