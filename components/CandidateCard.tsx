'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

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
}

interface CandidateCardProps {
  candidate: Candidate;
  index: number;
  onClick: (candidate: Candidate) => void;
  isHighlighted?: boolean;
}

export default function CandidateCard({ candidate, index, onClick, isHighlighted }: CandidateCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const skills = candidate.skills?.split(';').filter(Boolean) || [];
  const topSkills = skills.slice(0, 4);
  const remainingSkills = skills.length - 4;

  const formatSalary = (salary?: string) => {
    if (!salary) return null;
    const num = parseInt(salary);
    return `$${(num / 1000).toFixed(0)}k`;
  };

  const getExperienceLevel = (years: string) => {
    const num = parseInt(years);
    if (num <= 2) return { label: 'Junior', color: 'bg-green-100 text-green-800' };
    if (num <= 5) return { label: 'Mid-level', color: 'bg-blue-100 text-blue-800' };
    if (num <= 10) return { label: 'Senior', color: 'bg-purple-100 text-purple-800' };
    return { label: 'Expert', color: 'bg-orange-100 text-orange-800' };
  };

  const experienceLevel = getExperienceLevel(candidate.years_experience);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      layout
      layoutId={candidate.id}
      className={`relative group cursor-pointer ${isHighlighted ? 'ring-2 ring-indigo-500' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(candidate)}
    >
      {/* Main Card */}
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
      >
        {/* Background Gradient Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.1 : 0 }}
          className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl"
        />

        {/* Rank Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.2 }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
        >
          {index + 1}
        </motion.div>

        {/* Header Section */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex-1">
            <motion.h3
              className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              {candidate.full_name}
            </motion.h3>
            <p className="text-indigo-600 font-semibold mb-2">{candidate.title}</p>
            
            {/* Location and Experience */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{candidate.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{candidate.years_experience} years</span>
              </div>
            </div>
          </div>

          {/* Experience Level Badge */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            className={`px-3 py-1 rounded-full text-xs font-medium ${experienceLevel.color}`}
          >
            {experienceLevel.label}
          </motion.div>
        </div>

        {/* Skills Section */}
        <div className="mb-4 relative z-10">
          <div className="flex flex-wrap gap-2 mb-2">
            {topSkills.map((skill, skillIndex) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + skillIndex * 0.05 }}
                whileHover={{ scale: 1.1 }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                {skill.trim()}
              </motion.span>
            ))}
            {remainingSkills > 0 && (
              <motion.span
                whileHover={{ scale: 1.1 }}
                className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-sm font-medium"
              >
                +{remainingSkills} more
              </motion.span>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-sm relative z-10">
          <div className="flex items-center space-x-4">
            {candidate.desired_salary_usd && (
              <div className="flex items-center space-x-1 text-green-600 font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>{formatSalary(candidate.desired_salary_usd)}</span>
              </div>
            )}
            
            {candidate.availability_weeks && parseInt(candidate.availability_weeks) === 0 && (
              <div className="flex items-center space-x-1 text-emerald-600 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Available now</span>
              </div>
            )}
          </div>

          {/* Action Hint */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
            className="text-indigo-500 font-medium flex items-center space-x-1"
          >
            <span>View details</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </div>

        {/* Hover Glow Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl pointer-events-none"
        />

        {/* Animated Background Particles */}
        <AnimatePresence>
          {isHovered && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: Math.random() * 200, y: Math.random() * 200 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0],
                    x: Math.random() * 300,
                    y: Math.random() * 300
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 2, 
                    delay: i * 0.2,
                    repeat: Infinity 
                  }}
                  className="absolute w-2 h-2 bg-indigo-400 rounded-full pointer-events-none"
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
} 