/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { loadCandidates } from "@/lib/csv";
import { useATSStore } from "@/store/useATSStore";
import { runMCP } from "@/lib/mcp";
import StreamingText from "@/components/StreamingText";
import CleanSearchBox from "@/components/CleanSearchBox";

interface TimelineStep {
  id: number;
  title: string;
  status: 'pending' | 'active' | 'complete';
  data?: any;
  completedAt?: number;
}

interface Candidate {
  id: string;
  full_name: string;
  title: string;
  location: string;
  years_experience: string;
  skills: string;
  desired_salary_usd?: string;
  availability_weeks?: string;
  willing_to_relocate?: string;
  work_preference?: string;
  summary?: string;
  [key: string]: any;
}

// Simplified Floating Orbs Component
const FloatingOrbs = () => {
  return (
    <div className="floating-orbs">
      <div className="orb"></div>
      <div className="orb"></div>
      <div className="orb"></div>
    </div>
  );
};

// Optimized Particle Burst Component
const ParticleBurst = ({ trigger, x, y }: { trigger: boolean; x: number; y: number }) => {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([]);
  
  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({length: 6}, (_, i) => ({
        id: Date.now() + i,
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60
      }));
      setParticles(prev => [...prev, ...newParticles]);
      
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 3000);
    }
  }, [trigger, x, y]);

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="particle"
          style={{ left: particle.x, top: particle.y }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [0, 1, 0], opacity: [1, 1, 0] }}
          transition={{ duration: 3, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

export default function HomePage() {
  const {
    setCandidates,
    message,
    setMessage,
    summary,
    ranked,
    filtered,
    plan,
    loading,
  } = useATSStore();

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(false);
  const [particlePos, setParticlePos] = useState({ x: 0, y: 0 });
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([
    { id: 1, title: "🧠 Think: Analyzing query...", status: 'pending' },
    { id: 2, title: "🎯 Act 1: Filtering candidates...", status: 'pending' },
    { id: 3, title: "🏆 Act 2: Ranking results...", status: 'pending' },
    { id: 4, title: "💬 Speak: Generating summary...", status: 'pending' },
  ]);

  // Helper function to safely render JSON data
  const renderJsonData = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return 'Data unavailable';
    }
  };

  useEffect(() => {
    async function load() {
      const data = await loadCandidates();
      setCandidates(data);
    }
    load();
  }, [setCandidates]);

  useEffect(() => {
    setShowAllCandidates(false);
  }, [ranked]);

  // Optimized timeline updates with reduced particle effects
  useEffect(() => {
    setTimelineSteps(prev => {
      const newSteps = [...prev];
      
      if (loading) {
        newSteps.forEach((step, i) => {
          step.status = i === 0 ? 'active' : 'pending';
        });
      } else if (plan) {
        // Step 1: Filter plan ready
        newSteps[0].status = 'complete';
        newSteps[0].data = plan;
        newSteps[0].title = "🧠 Think: Filter plan ready";
        
        if (filtered.length > 0) {
          setTimeout(() => {
            setTimelineSteps(steps => {
              const updated = [...steps];
              updated[1].status = 'complete';
              updated[1].title = `🎯 Act 1: ${filtered.length} rows matched`;
              return updated;
            });
            // Reduced particle burst
            setParticlePos({ x: 200, y: 300 });
            setParticleTrigger(prev => !prev);
          }, 300);
          
          if (ranked.length > 0) {
            setTimeout(() => {
              setTimelineSteps(steps => {
                const updated = [...steps];
                updated[2].status = 'complete';
                updated[2].title = `🏆 Act 2: Ranking plan ready`;
                updated[2].data = { primary: 'years_experience' };
                return updated;
              });
            }, 600);
            
            setTimeout(() => {
              setTimelineSteps(steps => {
                const updated = [...steps];
                updated[3].status = 'complete';
                updated[3].title = "💬 Speak: Ranked IDs ready";
                updated[3].data = ranked.slice(0, 10).map(c => c.id);
                return updated;
              });
            }, 900);
          } else {
            newSteps[2].status = 'active';
          }
        } else {
          setTimeout(() => {
            setTimelineSteps(steps => {
              const updated = [...steps];
              updated[1].status = 'complete';
              updated[1].title = `🎯 Act 1: 0 rows matched`;
              return updated;
            });
          }, 300);
        }
      }
      
      return newSteps;
    });
  }, [loading, plan, filtered, ranked]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    setShowAllCandidates(false);
    setTimelineSteps([
      { id: 1, title: "🧠 Think: Analyzing query...", status: 'pending' },
      { id: 2, title: "🎯 Act 1: Filtering candidates...", status: 'pending' },
      { id: 3, title: "🏆 Act 2: Ranking results...", status: 'pending' },
      { id: 4, title: "💬 Speak: Generating summary...", status: 'pending' },
    ]);
    
    await runMCP(message);
  };

  const candidatesToShow = showAllCandidates ? ranked : ranked.slice(0, 5);
  const hasMoreCandidates = ranked.length > 5;

  const formatSalary = (salary?: string) => {
    if (!salary) return null;
    const num = parseInt(salary);
    return `$${(num / 1000).toFixed(0)}k`;
  };

  const getExperienceLevel = (years: string) => {
    const num = parseInt(years);
    if (num <= 2) return { label: 'Junior', color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' };
    if (num <= 5) return { label: 'Mid-level', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' };
    if (num <= 10) return { label: 'Senior', color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' };
    return { label: 'Expert', color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' };
  };

  return (
    <div className="min-h-screen dark-bg relative overflow-hidden">
      {/* Floating Orbs Background */}
      <FloatingOrbs />
      
      {/* Particle Burst System */}
      <ParticleBurst trigger={particleTrigger} x={particlePos.x} y={particlePos.y} />
      
      <div className="flex min-h-screen relative z-20">
        {/* Collapsible Timeline Sidebar with Toggle */}
        <motion.div 
          className="glass-dark border-r border-white/10 overflow-hidden custom-scrollbar relative"
          animate={{ 
            width: isTimelineCollapsed ? 60 : 320,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }
          }}
          initial={{ width: 320 }}
        >
          {/* Toggle Button */}
          <motion.button
            onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
            className="absolute top-4 right-3 z-10 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg 
              className="w-4 h-4 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              animate={{ rotate: isTimelineCollapsed ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </motion.svg>
          </motion.button>

          <motion.div 
            className="p-6"
            animate={{ 
              opacity: isTimelineCollapsed ? 0 : 1,
              x: isTimelineCollapsed ? -20 : 0
            }}
            transition={{ 
              opacity: { duration: 0.2, delay: isTimelineCollapsed ? 0 : 0.3 },
              x: { type: "spring", stiffness: 400, damping: 25 }
            }}
          >
            <motion.div 
              className="mb-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-white mb-2 glow-text">
                MCP Timeline
              </h2>
              <p className="text-sm text-gray-300">
                Watch the ATS think in real-time
              </p>
              {loading && (
                <div className="progress-bar mt-3"></div>
              )}
            </motion.div>
            
            <div className="space-y-4">
              {timelineSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { delay: index * 0.1 }
                  }}
                  className={`timeline-step ${
                    step.status === 'complete' ? 'complete' : 
                    step.status === 'active' ? 'active animate-pulse-glow' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className={`w-4 h-4 rounded-full ${
                        step.status === 'complete' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' :
                        step.status === 'active' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-gray-500'
                      }`}
                      animate={step.status === 'active' ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <div className="text-sm font-medium text-white">
                      {step.title}
                    </div>
                  </div>

                  <AnimatePresence>
                    {step.data && step.status === 'complete' && (
                      <motion.div 
                        className="mt-4 text-xs text-gray-300 font-mono glass-card p-4 rounded-lg border border-white/10"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 100 }}
                      >
                        <pre className="whitespace-pre-wrap overflow-x-auto">
                          {renderJsonData(step.data)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Collapsed State Icon */}
          <AnimatePresence>
            {isTimelineCollapsed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.2 }}
                className="absolute top-20 left-1/2 transform -translate-x-1/2"
              >
                <div className="flex flex-col items-center space-y-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="text-2xl"
                  >
                    🧠
                  </motion.div>
                  <div className="w-px h-8 bg-gradient-to-b from-blue-500 to-purple-500"></div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-lg"
                  >
                    ⚡
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <motion.div 
            className="glass-dark border-b border-white/10 px-8 py-6"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
          >
            <div className="max-w-4xl mx-auto">
              <motion.div 
                className="text-center mb-8"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              >
                <motion.h1 
                  className="text-5xl font-bold gradient-text mb-3"
                  animate={{ 
                    filter: ["drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))", 
                            "drop-shadow(0 0 12px rgba(139, 92, 246, 0.6))", 
                            "drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))"]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  🤖 ATS-Lite
                </motion.h1>
                <p className="text-lg text-gray-300">
                  Watch the ATS think in real-time as it analyzes, filters, and ranks candidates
                </p>
              </motion.div>

              {/* Search Box */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <CleanSearchBox
                  value={message}
                  onChange={setMessage}
                  onSubmit={handleSubmit}
                  loading={loading}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Results Area - Optimized for smooth scrolling */}
          <div className="flex-1 px-8 py-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* AI Summary - FIXED with bright white text for maximum visibility */}
              <AnimatePresence>
                {summary && (
                  <motion.div 
                    className="glass-card p-6 rounded-2xl border border-white/10 relative z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-2xl">🎯</span>
                      <h3 className="text-xl font-semibold text-white">AI Summary</h3>
                    </div>
                    {/* Enhanced typewriter animation handled by StreamingText component */}
                    <div>
                      <StreamingText text={summary} speed={40} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Candidates List - WITH Show Top 5 button restored */}
              <AnimatePresence>
                {candidatesToShow.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white">
                        Top Candidates
                        <span className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
                          {ranked.length} found
                        </span>
                      </h3>
                      
                      {/* RESTORED Show Top 5 button */}
                      {hasMoreCandidates && (
                        <motion.button
                          onClick={() => setShowAllCandidates(!showAllCandidates)}
                          className="btn-premium px-6 py-3 text-sm font-semibold"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {showAllCandidates ? 'Show Top 5' : `Show All ${ranked.length}`}
                        </motion.button>
                      )}
                    </div>

                    {/* Ultra-optimized candidate list - no complex animations */}
                    <div className="space-y-4">
                      {candidatesToShow.map((candidate, index) => {
                        const skills = candidate.skills?.split(';').filter(Boolean) || [];
                        const topSkills = skills.slice(0, 4);
                        const remainingSkills = skills.length - 4;
                        const experienceLevel = getExperienceLevel(candidate.years_experience);

                        return (
                          <div
                            key={candidate.id}
                            className="candidate-card cursor-pointer"
                            onClick={() => setSelectedCandidate(candidate)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  <h4 className="text-xl font-bold text-white">
                                    {candidate.full_name}
                                  </h4>
                                  <span className="text-sm font-bold text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                                    #{index + 1}
                                  </span>
                                </div>
                                
                                <p className="text-blue-400 font-semibold mb-3 text-lg">{candidate.title}</p>
                                
                                <div className="flex items-center space-x-6 text-sm text-gray-300 mb-4">
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <span>{candidate.location}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{candidate.years_experience} years</span>
                                  </div>
                                  {(candidate as any).desired_salary_usd && (
                                    <div className="flex items-center space-x-2 text-emerald-400">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                      </svg>
                                      <span className="font-bold">{formatSalary((candidate as any).desired_salary_usd)}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {topSkills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded-lg text-sm border border-gray-600/50"
                                    >
                                      {skill.trim()}
                                    </span>
                                  ))}
                                  {remainingSkills > 0 && (
                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm border border-purple-500/30">
                                      +{remainingSkills} more
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end space-y-3">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${experienceLevel.color}`}>
                                  {experienceLevel.label}
                                </span>
                                {candidate.availability_weeks && parseInt(candidate.availability_weeks) === 0 && (
                                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30">
                                    Available now
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No Results */}
              {!loading && ranked.length === 0 && plan && (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  <motion.div 
                    className="text-6xl mb-6"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    🔍
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-3 glow-text">
                    No candidates found
                  </h3>
                  <p className="text-gray-300 mb-6 text-lg">
                    Try adjusting your search criteria or explore different keywords.
                  </p>
                  <motion.button
                    onClick={() => setMessage('')}
                    className="btn-premium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start New Search
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* INSTANT Modal - Zero lag */}
      <AnimatePresence>
        {selectedCandidate && (
          <div
            className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCandidate(null)}
          >
            <div
              className="modal-content p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedCandidate.full_name}
                  </h2>
                  <p className="text-xl text-blue-400 font-semibold">
                    {selectedCandidate.title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-3 hover:bg-white/10 rounded-xl transition-colors border border-white/20"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="glass-card p-6 rounded-xl border border-white/10">
                <h3 className="font-bold text-white mb-4 text-lg">Full Details</h3>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                  {renderJsonData(selectedCandidate)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
