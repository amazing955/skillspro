import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, BookOpen, Clock, Star, X, ChevronDown, Check } from 'lucide-react';

const CATEGORIES = ['Culinary', 'Fashion', 'Technical', 'Business', 'Agriculture'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const DURATIONS = [
  { label: 'Short (< 15 days)', value: 'short', min: 0, max: 15 },
  { label: 'Medium (15-30 days)', value: 'medium', min: 15, max: 30 },
  { label: 'Long (> 30 days)', value: 'long', min: 30, max: 999 }
];

const INITIAL_COURSES: Course[] = [
  {
    id: 'baking-101',
    title: 'Professional Baking & Pastry',
    description: 'Learn to bake local breads, mandazi, and cakes for a commercial bakery business.',
    category: 'Culinary',
    thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
    durationDays: 14,
    skillLevel: 'Beginner',
    modules: [
      { title: 'Introduction to Bakery Equipment', content: 'Learn about ovens, mixers and safety.' },
      { title: 'Dough Composition', content: 'Mastering yeast and fermentation for perfect bread.' },
      { title: 'Local Snacks: Mandazi and Chapati', content: 'Secrets to the best mandazi in town.' }
    ]
  },
  {
    id: 'tailoring-101',
    title: 'Modern Tailoring & Design',
    description: 'Master the sewing machine and domestic fashion design to start your workshop.',
    category: 'Fashion',
    thumbnail: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=400',
    durationDays: 30,
    skillLevel: 'Intermediate',
    modules: [
      { title: 'Sewing Machine Basics', content: 'Maintenance and basic stitches.' },
      { title: 'Pattern Cutting', content: 'Designing for different body shapes.' },
      { title: 'African Print Masterclass', content: 'Working with Kitenge and Kente fabrics.' }
    ]
  },
  {
    id: 'carpentry-101',
    title: 'Furniture Making & Carpentry',
    description: 'Build durable local furniture. From stools to wardrobes and office desks.',
    category: 'Technical',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=400',
    durationDays: 45,
    skillLevel: 'Advanced',
    modules: [
      { title: 'Wood Selection', content: 'Understanding local timber types.' },
      { title: 'Jointing Techniques', content: 'Creating strong, lasting furniture.' },
      { title: 'Finishing and Polishing', content: 'Giving your products a professional look.' }
    ]
  }
];

export default function CourseList({ onSelectCourse }: { onSelectCourse: (id: string) => void }) {
  const [courses] = useState<Course[]>(INITIAL_COURSES); // In a real app, fetch from Firestore
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);

  const toggleFilter = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(c.category);
      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(c.skillLevel);
      
      const matchesDuration = selectedDurations.length === 0 || selectedDurations.some(val => {
        const range = DURATIONS.find(d => d.value === val);
        return range ? (c.durationDays >= range.min && c.durationDays <= range.max) : false;
      });

      return matchesSearch && matchesCategory && matchesLevel && matchesDuration;
    });
  }, [courses, searchTerm, selectedCategories, selectedLevels, selectedDurations]);

  const activeFilterCount = selectedCategories.length + selectedLevels.length + selectedDurations.length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="serif text-3xl font-bold text-[#1a1a1a]">Explore Skills</h2>
          <p className="text-gray-500">Pick a craft and start your journey.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" />
            <input 
              type="text"
              placeholder="Search for skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-black/5 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 w-full md:w-64 transition-all"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
              showFilters || activeFilterCount > 0 
                ? 'bg-[#5A5A40] text-white border-[#5A5A40]' 
                : 'bg-white text-gray-500 border-black/5 hover:border-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 flex items-center justify-center bg-white text-[#5A5A40] rounded-full text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white rounded-3xl border border-black/5 p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Category Filter */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-4">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleFilter(selectedCategories, setSelectedCategories, cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedCategories.includes(cat)
                          ? 'bg-[#5A5A40] text-white'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level Filter */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-4">Skill Level</h4>
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => toggleFilter(selectedLevels, setSelectedLevels, level)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedLevels.includes(level)
                          ? 'bg-[#5A5A40] text-white'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Filter */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-4">Duration</h4>
                <div className="flex flex-col gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d.value}
                      onClick={() => toggleFilter(selectedDurations, setSelectedDurations, d.value)}
                      className="flex items-center justify-between px-4 py-2 rounded-xl bg-gray-50 text-xs font-medium hover:bg-gray-100 transition-all"
                    >
                      <span className={selectedDurations.includes(d.value) ? 'text-[#5A5A40] font-bold' : 'text-gray-500'}>
                        {d.label}
                      </span>
                      {selectedDurations.includes(d.value) && <Check className="w-3 h-3 text-[#5A5A40]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between">
              <button 
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedLevels([]);
                  setSelectedDurations([]);
                }}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear All Filters
              </button>
              <p className="text-xs text-gray-400">
                Found {filteredCourses.length} courses
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredCourses.map((course, i) => (
          <motion.div
            key={course.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={() => onSelectCourse(course.id)}
            className="card-soft overflow-hidden group cursor-pointer h-full flex flex-col"
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">
                  {course.category}
                </div>
                <div className="px-3 py-1 bg-[#5A5A40]/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-white">
                  {course.skillLevel}
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 flex-1 flex flex-col">
              <h3 className="serif text-xl font-bold leading-tight group-hover:text-[#5A5A40] transition-colors line-clamp-2">
                {course.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2">
                {course.description}
              </p>
              <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>4.9</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{course.durationDays} Days</span>
                </div>
              </div>
              <button className="w-full py-2 text-sm font-bold border border-[#5A5A40] text-[#5A5A40] rounded-full group-hover:bg-[#5A5A40] group-hover:text-white transition-all">
                Learn Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">No courses found matching your search.</p>
        </div>
      )}
    </div>
  );
}
