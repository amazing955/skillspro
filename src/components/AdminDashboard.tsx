import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, LoanRequest, Course, Enrollment } from '../types';
import { Users, Landmark, BookOpen, CheckCircle, XCircle, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'users' | 'loans' | 'courses'>('loans');

  useEffect(() => {
    const fetchData = async () => {
      const [userSnap, loanSnap, courseSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'loanRequests')),
        getDocs(collection(db, 'courses'))
      ]);

      setUsers(userSnap.docs.map(d => d.data() as UserProfile));
      setLoans(loanSnap.docs.map(d => ({ id: d.id, ...d.data() } as LoanRequest)));
      setCourses(courseSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleLoanAction = async (loanId: string, status: 'approved' | 'rejected') => {
    await updateDoc(doc(db, 'loanRequests', loanId), { status });
    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status } : l));
  };

  const handleVerifyUser = async (uid: string) => {
    await updateDoc(doc(db, 'users', uid), { idVerified: true });
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, idVerified: true } : u));
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading system data...</div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="serif text-4xl font-bold text-[#1a1a1a]">System Monitoring</h1>
          <p className="text-gray-500">UgandaSkilling Hub Management Portal</p>
        </div>
      </header>

      <div className="flex gap-4 border-b border-black/5 pb-4">
        {[
          { id: 'loans', label: 'Loan Requests', icon: Landmark, count: loans.filter(l => l.status === 'pending').length },
          { id: 'users', label: 'Users', icon: Users, count: users.length },
          { id: 'courses', label: 'Courses', icon: BookOpen, count: courses.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${
              activeView === tab.id ? 'bg-[#5A5A40] text-white' : 'text-gray-500 hover:bg-black/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">{tab.count}</span>}
          </button>
        ))}
      </div>

      <motion.div
        key={activeView}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        {activeView === 'loans' && (
          <div className="grid grid-cols-1 gap-4">
            {loans.length === 0 ? (
              <p className="text-center py-12 text-gray-400 italic">No loan applications to review.</p>
            ) : (
              loans.map(loan => (
                <div key={loan.id} className="card-soft p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">UGX {loan.amount.toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        loan.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                        loan.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{loan.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 italic">"{loan.purpose}"</p>
                    <div className="flex flex-wrap gap-4 pt-2">
                       <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                          <Users className="w-3 h-3" /> UID: {loan.userId.slice(0, 8)}...
                       </div>
                       <div className="text-[10px] font-bold text-[#5A5A40] uppercase">
                          Contact: {loan.phoneNumber}
                       </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                       <a href={loan.idFrontImageUrl} target="_blank" className="text-xs text-blue-600 underline">View ID Front</a>
                       <a href={loan.idBackImageUrl} target="_blank" className="text-xs text-blue-600 underline">View ID Back</a>
                    </div>
                  </div>

                  {loan.status === 'pending' && (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleLoanAction(loan.id, 'rejected')}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                      >
                        <XCircle className="w-8 h-8" />
                      </button>
                      <button 
                        onClick={() => handleLoanAction(loan.id, 'approved')}
                        className="p-3 text-green-600 hover:bg-green-50 rounded-2xl transition-colors"
                      >
                        <CheckCircle className="w-8 h-8" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeView === 'users' && (
          <div className="card-soft overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-black/5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">ID Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {users.map(user => (
                  <tr key={user.uid} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-[#1a1a1a]">{user.displayName}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-[#5A5A40]">
                      UGX {user.savingsBalance?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {user.phoneNumber || 'Not provided'}
                    </td>
                    <td className="px-6 py-4">
                      {user.idVerified ? (
                        <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                          <CheckCircle className="w-4 h-4" /> Verified
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleVerifyUser(user.uid)}
                          className="text-xs px-3 py-1 border border-[#5A5A40] text-[#5A5A40] rounded-full hover:bg-[#5A5A40] hover:text-white transition-colors"
                        >
                          Verify Manually
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
