/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './lib/AuthContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import SavingsPanel from './components/SavingsPanel';
import LoanPanel from './components/LoanPanel';
import CertificationPanel from './components/CertificationPanel';
import CourseView from './components/CourseView';
import Landing from './components/Landing';
import AdminDashboard from './components/AdminDashboard';

function AppContent() {
  const { user, loading, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'courses' | 'savings' | 'loans' | 'certs' | 'admin'>('info');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f5f5f0]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 border-4 border-[#5A5A40] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  // Auto-switch to admin tab if user is admin
  if (profile?.role === 'admin' && activeTab !== 'admin' && activeTab === 'info') {
    setActiveTab('admin');
  }

  if (selectedCourseId) {
    return <CourseView courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] pb-24">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-4xl mx-auto px-6 pt-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'info' && <Dashboard onTabChange={setActiveTab} />}
            {activeTab === 'courses' && <CourseList onSelectCourse={setSelectedCourseId} />}
            {activeTab === 'savings' && <SavingsPanel />}
            {activeTab === 'loans' && <LoanPanel />}
            {activeTab === 'certs' && <CertificationPanel />}
            {activeTab === 'admin' && profile?.role === 'admin' && <AdminDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

