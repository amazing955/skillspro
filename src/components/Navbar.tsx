import { motion } from 'motion/react';
import { Home, BookOpen, PiggyBank, Landmark, Award, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

interface NavbarProps {
  activeTab: 'info' | 'courses' | 'savings' | 'loans' | 'certs' | 'admin';
  setActiveTab: (tab: any) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { logout, profile } = useAuth();

  const tabs = [
    { id: 'info', icon: Home, label: 'Hub' },
    { id: 'courses', icon: BookOpen, label: 'Skills' },
    { id: 'savings', icon: PiggyBank, label: 'Savings' },
    { id: 'loans', icon: Landmark, label: 'Loans' },
    { id: 'certs', icon: Award, label: 'Certs' }
  ];

  if (profile?.role === 'admin') {
    tabs.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#f5f5f0]/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#5A5A40] rounded-full flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="serif font-bold text-xl hidden sm:inline">SkillingHub</span>
        </div>

        <nav className="flex items-center gap-1 sm:gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 py-2 rounded-full transition-colors ${
                activeTab === tab.id ? 'text-[#5A5A40]' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="flex flex-col items-center gap-0.5">
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">{tab.label}</span>
              </div>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-[#5A5A40]/10 rounded-full -z-10"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <div className="text-sm font-bold text-[#1a1a1a]">{profile?.displayName || 'User'}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">{profile?.role || 'student'}</div>
          </div>
          <button 
            onClick={logout}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

import { GraduationCap } from 'lucide-react';
