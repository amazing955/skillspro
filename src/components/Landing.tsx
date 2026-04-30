import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { GraduationCap, Landmark, PiggyBank, Award } from 'lucide-react';

export default function Landing() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center px-6 py-12 text-center text-[#1a1a1a]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-[#5A5A40] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <GraduationCap className="w-12 h-12 text-white" />
        </div>
        <h1 className="serif text-5xl md:text-7xl font-bold tracking-tight mb-4">
          UgandaSkilling <span className="text-[#5A5A40]">Hub</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
          Unlock your potential. Learn baking, tailoring, and technical skills. Save for your future and access startup capital.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl w-full">
        {[
          { icon: Award, label: 'Certificates' },
          { icon: PiggyBank, label: 'Savings' },
          { icon: Landmark, label: 'Micro-Loans' },
          { icon: GraduationCap, label: 'Expert Skills' }
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="card-soft p-6 flex flex-col items-center gap-3"
          >
            <item.icon className="w-8 h-8 text-[#5A5A40]" />
            <span className="font-medium text-sm">{item.label}</span>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={signIn}
        className="btn-olive px-12 py-4 text-xl shadow-lg flex items-center gap-3"
      >
        Get Started Today
      </motion.button>

      <p className="mt-8 text-sm text-gray-400">
        Empowering every Ugandan with local tools and financial freedom.
      </p>
    </div>
  );
}
