import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Course, Enrollment } from '../types';
import { ChevronLeft, CheckCircle2, PlayCircle, BookOpen, Award, Sparkles, MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

const INITIAL_COURSES: Course[] = [
  {
    id: 'baking-101',
    title: 'Professional Baking & Pastry',
    description: 'Learn to bake local breads, mandazi, and cakes for a commercial bakery business. 7-day intensive training.',
    category: 'Culinary',
    thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
    durationDays: 7,
    skillLevel: 'Beginner',
    modules: [
      { day: 1, title: 'Introduction to Bakery Equipment', videoUrl: 'https://www.youtube.com/embed/Y0n97e7YfMA', content: 'Our lesson today covers the core tools of a Ugandan bakery. We will focus on the traditional deck oven and mechanical mixers...' },
      { day: 2, title: 'Dough Composition & Fermentation', videoUrl: 'https://www.youtube.com/embed/hK2N9O-YVf4', content: 'Understanding yeast activity in a tropical climate. Temperature control is key to consistent bread quality...' },
      { day: 3, title: 'Local Snacks: Mandazi Masterclass', videoUrl: 'https://www.youtube.com/embed/z4G-5S2_1-Y', content: 'The commercial secret to soft, non-oily mandazi. Market research shows these are the highest margin items for starters...' },
      { day: 4, title: 'Pastry Basics: Meat Pies & Sausage Rolls', videoUrl: 'https://www.youtube.com/embed/7X8m-T0PjLo', content: 'Flaky pastry techniques for local snacks.' },
      { day: 5, title: 'Cake Decoration for Commercial Events', videoUrl: 'https://www.youtube.com/embed/G6jWl5I6Hl0', content: 'Introduction to butter frosting and fondant.' },
      { day: 6, title: 'Costing & Pricing Strategies', videoUrl: 'https://www.youtube.com/embed/jZz7_qI0p0A', content: 'How to calculate your margins per batch.' },
      { day: 7, title: 'Final Project: Commercial Batch Production', videoUrl: 'https://www.youtube.com/embed/Y0n97e7YfMA', content: 'Produce a full batch of bread and snacks for local sale evaluation.' }
    ]
  },
  {
    id: 'tailoring-101',
    title: 'Modern Tailoring & Design',
    description: 'Master the sewing machine and domestic fashion design to start your workshop. 7-day intensive.',
    category: 'Fashion',
    thumbnail: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=400',
    durationDays: 7,
    skillLevel: 'Intermediate',
    modules: [
      { day: 1, title: 'Sewing Machine Basics', videoUrl: 'https://www.youtube.com/embed/1Z6S9F9Q2oE', content: 'Identifying parts of the manual and electric machines. Threading and tension control are the first steps.' },
      { day: 2, title: 'Straight Stitching & Repairs', videoUrl: 'https://www.youtube.com/embed/3U9QvI_h5Yc', content: 'Mastering speed control and basic utility stitches.' },
      { day: 3, title: 'Pattern Cutting: Women Skirts', videoUrl: 'https://www.youtube.com/embed/Y0n97e7YfMA', content: 'Drawing patterns on brown paper before cutting fabric.' },
      { day: 4, title: 'African Print Masterclass (Bitenge)', videoUrl: 'https://www.youtube.com/embed/Y0n97e7YfMA', content: 'Aligning motifs in Kitenge fabric.' },
      { day: 5, title: 'Zippers, Buttons & Closures', videoUrl: 'https://www.youtube.com/embed/Y0n97e7YfMA', content: 'Finishing techniques for professional garments.' },
      { day: 6, title: 'Customer Measurements & Fitting', videoUrl: 'https://www.youtube.com/embed/Y0n97e7YfMA', content: 'How to take multi-point measurements correctly.' },
      { day: 7, title: 'Final Project: Complete Gown Production', videoUrl: 'https://www.youtube.com/embed/Y0n97e7YfMA', content: 'Create a complete customized garment.' }
    ]
  }
];

export default function CourseView({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const { user, profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [mentorChat, setMentorChat] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mentorChat]);

  useEffect(() => {
    const c = INITIAL_COURSES.find(item => item.id === courseId);
    if (c) setCourse(c);

    if (!user) return;
    const fetchEnrollment = async () => {
      const q = query(collection(db, 'enrollments'), where('userId', '==', user.uid), where('courseId', '==', courseId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as Enrollment;
        setEnrollment(data);
        const completedCount = Math.floor((data.progress / 100) * (c?.modules.length || 0));
        setCompletedModules(Array.from({ length: completedCount }, (_, i) => i));
        setActiveModuleIndex(completedCount < (c?.modules.length || 0) ? completedCount : 0);
      } else {
        const newEnrollment = {
          userId: user.uid,
          courseId,
          progress: 0,
          completed: false,
          dateEnrolled: new Date().toISOString(),
          currentDay: 1
        };
        const docRef = await addDoc(collection(db, 'enrollments'), newEnrollment);
        setEnrollment({ id: docRef.id, ...newEnrollment });
      }
    };
    fetchEnrollment();

    // Initial mentor greeting
    setMentorChat([{ role: 'model', content: `Hello ${user.displayName}! I am your AI Mentor for this ${c?.title || 'course'}. I can help you with technical questions about the lessons. What shall we start with?` }]);
  }, [courseId, user]);

  const sendToMentor = async () => {
    if (!message.trim() || !course) return;
    const userMsg = message;
    setMessage('');
    setMentorChat(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        config: {
          systemInstruction: `You are a professional Ugandan vocational mentor for a ${course.title} course. Use helpful, encouraging, and local professional language. Your goal is to guide students through a 7-day curriculum. Current module: ${course.modules[activeModuleIndex].title}`
        },
        contents: [...mentorChat.map(m => ({ role: m.role, parts: [{ text: m.content }] })), { role: 'user', parts: [{ text: userMsg }]} ]
      });
      
      setMentorChat(prev => [...prev, { role: 'model', content: response.text || "I'm having a small technical issue. Could you repeat that?" }]);
    } catch (err) {
      setMentorChat(prev => [...prev, { role: 'model', content: "Musawo, I lost connection to the server. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const markModuleComplete = async (index: number) => {
    if (!enrollment || !course || !user) return;
    if (completedModules.includes(index)) return;

    const newCompleted = [...completedModules, index];
    setCompletedModules(newCompleted);
    
    const newProgress = Math.round((newCompleted.length / course.modules.length) * 100);
    const updates: any = { 
      progress: newProgress,
      currentDay: Math.min(course.durationDays, index + 2)
    };
    
    if (newProgress === 100) {
      updates.completed = true;
      updates.dateCompleted = new Date().toISOString();
      
      const certData = {
        userId: user.uid,
        courseId: course.id,
        issueDate: new Date().toISOString(),
        certificateNumber: `UG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };
      await addDoc(collection(db, 'certificates'), certData);
      setShowConfetti(true);
    }

    await updateDoc(doc(db, 'enrollments', enrollment.id), updates);
    setEnrollment(prev => prev ? { ...prev, ...updates } : null);
    
    if (index + 1 < course.modules.length) {
      setActiveModuleIndex(index + 1);
    }
  };

  if (!course) return null;

  return (
    <div className="min-h-screen bg-white fixed inset-0 z-[60] overflow-y-auto">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-10 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm line-clamp-1">{course.title}</h1>
            <div className="text-[10px] uppercase font-bold text-[#5A5A40] tracking-wider">7-Day Training: Day {course.modules[activeModuleIndex]?.day || activeModuleIndex + 1}</div>
          </div>
          <div className="w-10" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-24 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
             <div className="aspect-video bg-black rounded-3xl overflow-hidden relative shadow-2xl">
                {course.modules[activeModuleIndex]?.videoUrl ? (
                  <iframe 
                    src={course.modules[activeModuleIndex].videoUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <img src={course.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="w-20 h-20 text-white cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                  </>
                )}
             </div>

             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-[#5A5A40] text-white flex items-center justify-center rounded-2xl font-bold text-xl">
                      {course.modules[activeModuleIndex]?.day || activeModuleIndex + 1}
                   </div>
                   <h2 className="serif text-3xl font-bold text-[#1a1a1a]">{course.modules[activeModuleIndex].title}</h2>
                </div>
                
                <div className="prose prose-stone max-w-none text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-3xl">
                   <ReactMarkdown>{course.modules[activeModuleIndex].content}</ReactMarkdown>
                </div>
                
                <div className="pt-8">
                   <button 
                     onClick={() => markModuleComplete(activeModuleIndex)}
                     disabled={completedModules.includes(activeModuleIndex)}
                     className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                       completedModules.includes(activeModuleIndex) 
                       ? 'bg-green-100 text-green-700' 
                       : 'bg-[#5A5A40] text-white hover:bg-[#4a4a35]'
                     }`}
                   >
                     {completedModules.includes(activeModuleIndex) ? (
                       <><CheckCircle2 className="w-6 h-6" /> Day Completed</>
                     ) : (
                       'Finish This Day'
                     )}
                   </button>
                </div>
             </div>
          </div>

          {/* Sidebar & Mentorship */}
          <div className="lg:col-span-4 space-y-6">
             <div className="card-soft p-6">
                <h3 className="font-bold text-sm mb-4 uppercase tracking-widest text-gray-500">Day-by-Day Journey</h3>
                <div className="space-y-3">
                   {course.modules.map((m, i) => (
                     <button
                       key={i}
                       disabled={!completedModules.includes(i) && i !== activeModuleIndex && i > Math.max(...completedModules, -1) + 1}
                       onClick={() => setActiveModuleIndex(i)}
                       className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                         activeModuleIndex === i 
                         ? 'border-[#5A5A40] bg-[#5A5A40]/5' 
                         : 'border-transparent hover:bg-black/5 disabled:opacity-30'
                       }`}
                     >
                       <div className={`p-1.5 rounded-full ${completedModules.includes(i) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                         <CheckCircle2 className="w-4 h-4" />
                       </div>
                       <div className="flex-1">
                         <div className="text-xs font-bold text-[#1a1a1a]">{m.title}</div>
                         <div className="text-[10px] text-gray-400">Day {m.day} • {completedModules.includes(i) ? 'Done' : 'Pending'}</div>
                       </div>
                     </button>
                   ))}
                </div>
             </div>

             {/* Mentorship Chat */}
             <div className="card-soft h-[500px] flex flex-col overflow-hidden bg-white border border-black/5">
                <div className="p-4 border-b border-black/5 bg-gray-50 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <h3 className="font-bold text-sm text-[#1a1a1a]">Mentorship Portal</h3>
                </div>
                
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                   {mentorChat.map((chat, i) => (
                     <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                         chat.role === 'user' 
                         ? 'bg-[#5A5A40] text-white rounded-tr-none' 
                         : 'bg-gray-100 text-gray-700 rounded-tl-none'
                       }`}>
                         {chat.content}
                       </div>
                     </div>
                   ))}
                   {isTyping && (
                     <div className="flex justify-start">
                        <div className="p-3 rounded-2xl bg-gray-100 text-gray-400 text-[10px] italic">Mentor is thinking...</div>
                     </div>
                   )}
                </div>

                <div className="p-4 border-t border-black/5 bg-gray-50">
                   <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendToMentor()}
                        placeholder="Ask your mentor..."
                        className="flex-1 bg-white border border-black/10 rounded-full px-4 py-2 text-xs focus:ring-1 ring-[#5A5A40] outline-none"
                      />
                      <button 
                        onClick={sendToMentor}
                        className="p-2 bg-[#5A5A40] text-white rounded-full hover:scale-105 active:scale-95 transition-transform"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-[#5A5A40] text-white flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-8"
            >
              <Sparkles className="w-16 h-16" />
            </motion.div>
            <h2 className="serif text-5xl font-bold mb-4">Hongera!</h2>
            <p className="max-w-md text-xl text-white/80 mb-12">
              Congratulations on completing the <span className="font-bold text-white">{course.title}</span> course. 
              Your certificate has been issued and added to your profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
              <button 
                onClick={() => { setShowConfetti(false); onBack(); }}
                className="w-full py-4 bg-white text-[#5A5A40] rounded-full font-bold shadow-xl"
              >
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
