import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Certificate } from '../types';
import { Award, Download, Share2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export default function CertificationPanel() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchCerts = async () => {
      const q = query(collection(db, 'certificates'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setCerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Certificate)));
      setLoading(false);
    };
    fetchCerts();
  }, [user]);

  if (loading) return <div>Loading certifications...</div>;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="serif text-3xl font-bold text-[#1a1a1a]">My Certifications</h2>
        <p className="text-gray-500">Official proof of your professional local skills.</p>
      </header>

      {certs.length === 0 ? (
        <div className="card-soft p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-10 h-10 text-gray-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg">No certificates yet</h3>
            <p className="text-gray-400 max-w-sm mx-auto text-sm">
              Complete your first course to earn a shareable certificate and unlock loan eligibility.
            </p>
          </div>
          <button className="btn-outline">Go to Courses</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certs.map((cert) => (
            <motion.div 
              key={cert.id}
              whileHover={{ y: -5 }}
              className="card-soft overflow-hidden"
            >
              <div className="h-2 bg-[#5A5A40]" />
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                   <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
                      <Award className="w-8 h-8 text-amber-600" />
                   </div>
                   <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Cert ID</div>
                      <div className="text-xs font-mono font-bold text-[#5A5A40]">{cert.certificateNumber}</div>
                   </div>
                </div>
                
                <h3 className="serif text-2xl font-bold text-[#1a1a1a] mb-2">Technical Skill Certification</h3>
                <p className="text-sm text-gray-500 mb-6">Issued on {new Date(cert.issueDate).toLocaleDateString()}</p>
                
                <div className="pt-6 border-top border-black/5 flex items-center gap-4">
                   <button className="flex-1 btn-olive py-2 text-sm flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Download PDF
                   </button>
                   <button className="p-2 border border-black/5 rounded-full hover:bg-black/5 transition-colors">
                      <Share2 className="w-4 h-4 text-gray-400" />
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
