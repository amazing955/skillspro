import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { Award, PiggyBank, Landmark, BookOpen, ChevronRight, GraduationCap } from 'lucide-react';

export default function Dashboard({ onTabChange }: { onTabChange: (tab: any) => void }) {
  const { profile } = useAuth();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="serif text-4xl font-bold text-[#1a1a1a] mb-2">
          Jambo, {profile?.displayName?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-gray-500">Welcome back to your skilling journey.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Savings Summary */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="card-soft p-8 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#5A5A40]/10 rounded-2xl">
                <PiggyBank className="w-6 h-6 text-[#5A5A40]" />
              </div>
              <span className="font-bold uppercase tracking-widest text-[10px] text-gray-500">Savings Wallet</span>
            </div>
            <div className="serif text-5xl font-bold text-[#1a1a1a] mb-2">
              UGX {profile?.savingsBalance?.toLocaleString() || '0'}
            </div>
            <button 
              onClick={() => onTabChange('savings')}
              className="flex items-center gap-2 text-[#5A5A40] font-bold text-sm hover:underline"
            >
              Deposit Funds <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <PiggyBank className="absolute -bottom-8 -right-8 w-48 h-48 text-black/5 -rotate-12" />
        </motion.div>

        {/* Next Steps / Quick Actions */}
        <div className="grid grid-cols-1 gap-6">
           <div 
             onClick={() => onTabChange('courses')}
             className="card-soft p-6 flex items-center justify-between cursor-pointer hover:bg-black/[0.02] transition-colors"
           >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a1a]">Continue Learning</h3>
                  <p className="text-xs text-gray-500 underline underline-offset-4 decoration-blue-200">2 courses in progress</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
           </div>

           <div 
             onClick={() => onTabChange('certs')}
             className="card-soft p-6 flex items-center justify-between cursor-pointer hover:bg-black/[0.02] transition-colors"
           >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a1a]">My Certificates</h3>
                  <p className="text-xs text-gray-500">View your earned credentials</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
           </div>
        </div>
      </div>

      {/* Loan Eligibility Card */}
      <div className="card-soft p-8 bg-[#5A5A40] text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Landmark className="w-5 h-5" />
              <span className="uppercase tracking-widest text-[10px] font-bold opacity-80">Startup Capital</span>
            </div>
            <h2 className="serif text-3xl font-bold leading-tight">
              Ready to start your business?
            </h2>
            <p className="text-white/80 max-w-md">
              Apply for a startup loan of up to UGX 5,000,000 when you earn a certificate and reach your savings goal.
            </p>
            <button 
              onClick={() => onTabChange('loans')}
              className="px-8 py-3 bg-white text-[#5A5A40] rounded-full font-bold shadow-lg hover:bg-white/90 transition-colors"
            >
              Loan Eligibility Check
            </button>
          </div>
          <div className="relative w-48 h-48 flex items-center justify-center">
             <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
             <div className="absolute inset-4 bg-white/10 rounded-full animate-pulse delay-75" />
             <GraduationCap className="w-24 h-24 relative z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
