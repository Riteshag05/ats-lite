'use client';

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadCandidates } from "@/lib/csv";
import { useATSStore } from "@/store/useATSStore";
import { runMCP } from "@/lib/mcp";
import StreamingText from "@/components/StreamingText";

interface TimelineStep {
  id: number;
  title: string;
  status: 'pending' | 'active' | 'complete';
  data?: unknown;
  completedAt?: number; // Track when step completed for stagger
}

interface Candidate {
  id: string;
  full_name: string;
  title: string;
  location: string;
  years_experience: string;
  skills: string;
}

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
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([
    { id: 1, title: "🧠 Think: Analyzing query...", status: 'pending' },
    { id: 2, title: "🎯 Act 1: Filtering candidates...", status: 'pending' },
    { id: 3, title: "🏆 Act 2: Ranking results...", status: 'pending' },
    { id: 4, title: "💬 Speak: Generating summary...", status: 'pending' },
  ]);

  useEffect(() => {
    async function load() {
      const data = await loadCandidates();
      setCandidates(data);
    }
    load();
  }, [setCandidates]);

  // Reset showAllCandidates when new search is performed
  useEffect(() => {
    setShowAllCandidates(false);
  }, [ranked]);

  // Update timeline with staggered completion animations
  useEffect(() => {
    setTimelineSteps(prev => {
      const newSteps = [...prev];
      const currentTime = Date.now();
      
      if (loading) {
        // Reset all steps and start with first one active
        newSteps.forEach((step, i) => {
          step.status = i === 0 ? 'active' : 'pending';
          step.completedAt = undefined;
        });
      } else if (plan) {
        // Step 1: Think complete
        newSteps[0].status = 'complete';
        newSteps[0].data = plan;
        newSteps[0].completedAt = currentTime;
        
        if (filtered.length > 0) {
          // Step 2: Filter complete (with delay)
          setTimeout(() => {
            setTimelineSteps(steps => {
              const updated = [...steps];
              updated[1].status = 'complete';
              updated[1].title = `🎯 Act 1: Found ${filtered.length} matches`;
              updated[1].completedAt = Date.now();
              return updated;
            });
          }, 300);
          
          if (ranked.length > 0) {
            // Step 3: Rank complete (with delay)
            setTimeout(() => {
              setTimelineSteps(steps => {
                const updated = [...steps];
                updated[2].status = 'complete';
                updated[2].title = `🏆 Act 2: Ranked ${ranked.length} candidates`;
                updated[2].completedAt = Date.now();
                return updated;
              });
            }, 600);
            
            if (summary) {
              // Step 4: Speak complete (with delay)
              setTimeout(() => {
                setTimelineSteps(steps => {
                  const updated = [...steps];
                  updated[3].status = 'complete';
                  updated[3].title = "💬 Speak: Summary ready";
                  updated[3].completedAt = Date.now();
                  return updated;
                });
              }, 900);
            } else {
              newSteps[3].status = 'active';
            }
          } else {
            newSteps[2].status = 'active';
          }
        } else {
          // No matches found
          setTimeout(() => {
            setTimelineSteps(steps => {
              const updated = [...steps];
              updated[1].status = 'complete';
              updated[1].title = `🎯 Act 1: No matches found`;
              updated[2].status = 'pending';
              updated[3].status = 'pending';
              return updated;
            });
          }, 300);
        }
      }
      
      return newSteps;
    });
  }, [loading, plan, filtered, ranked, summary]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    // Reset timeline and view state
    setShowAllCandidates(false);
    setTimelineSteps([
      { id: 1, title: "🧠 Think: Analyzing query...", status: 'pending' },
      { id: 2, title: "🎯 Act 1: Filtering candidates...", status: 'pending' },
      { id: 3, title: "🏆 Act 2: Ranking results...", status: 'pending' },
      { id: 4, title: "💬 Speak: Generating summary...", status: 'pending' },
    ]);
    
    await runMCP(message);
  };

  // Determine how many candidates to show
  const candidatesToShow = showAllCandidates ? ranked : ranked.slice(0, 5);
  const hasMoreCandidates = ranked.length > 5;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Timeline Sidebar with improved stagger animations */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-6 text-gray-900">MCP Timeline</h2>
        
        <div className="space-y-4">
          {timelineSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: step.status !== 'pending' ? 1 : 0.5, 
                x: 0 
              }}
              transition={{ 
                delay: step.completedAt ? 0 : index * 0.2,
                duration: 0.3,
                ease: "easeOut"
              }}
              className={`p-3 rounded-lg border-l-4 transition-all duration-300 ${
                step.status === 'complete' 
                  ? 'border-green-500 bg-green-50' 
                  : step.status === 'active'
                  ? 'border-blue-500 bg-blue-50 animate-pulse'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="text-sm font-medium text-gray-900">
                {step.title}
              </div>
              
              <AnimatePresence>
                {step.data && step.status === 'complete' ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="mt-2 text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded overflow-x-auto"
                  >
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(step.data, null, 2)}
                    </pre>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl font-bold text-gray-900">ATS-Lite 🤖</h1>
          <p className="text-gray-600">Watch the ATS think in real-time</p>

          {/* Search Input */}
          <div className="flex gap-4">
            <input
              className="border border-gray-300 p-3 flex-1 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white placeholder-gray-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
              }}
              placeholder="e.g. backend dev in Germany, React engineers, senior developers..."
              disabled={loading}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Thinking..." : "Search"}
            </button>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>
          )}

          {/* Summary with streaming effect */}
          <AnimatePresence>
            {summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
              >
                <h3 className="font-semibold text-gray-900 mb-3">AI Summary</h3>
                <StreamingText text={summary} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Table with FLIP animations */}
          <AnimatePresence>
            {ranked.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {showAllCandidates ? 
                      `All ${ranked.length} Candidates` : 
                      `Top ${Math.min(5, ranked.length)} Candidates (of ${ranked.length} total matches)`
                    }
                  </h2>
                </div>
                
                <motion.div 
                  className="divide-y divide-gray-200"
                  layout
                >
                  <AnimatePresence mode="popLayout">
                    {candidatesToShow.map((candidate, index) => (
                      <motion.div
                        key={candidate.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ 
                          layout: { duration: 0.3 },
                          opacity: { delay: index * 0.05, duration: 0.2 }
                        }}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {candidate.full_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {candidate.title} • {candidate.location} • {candidate.years_experience} years
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {candidate.skills?.split(';').slice(0, 3).join(', ')}
                            </p>
                          </div>
                          <div className="text-sm text-gray-400">
                            #{index + 1}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
                
                {/* Toggle view button */}
                {hasMoreCandidates && (
                  <div className="px-6 py-3 bg-gray-50 text-center border-t border-gray-200">
                    <button 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      onClick={() => setShowAllCandidates(!showAllCandidates)}
                    >
                      {showAllCandidates ? 
                        `Show top 5 candidates ↑` : 
                        `View all ${ranked.length} candidates →`
                      }
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* No results message */}
          {!loading && plan && ranked.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
            >
              <div className="text-yellow-800">
                <h3 className="font-medium mb-2">No candidates found</h3>
                <p className="text-sm">Try adjusting your search terms or criteria.</p>
                <div className="mt-3 text-xs font-mono bg-yellow-100 p-2 rounded">
                  Filter used: {JSON.stringify(plan.filter)}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Candidate Detail Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedCandidate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedCandidate.full_name}
                </h2>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="text-sm font-mono bg-gray-50 p-4 rounded overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(selectedCandidate, null, 2)}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
