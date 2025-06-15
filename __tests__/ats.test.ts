import { filterCandidates, rankCandidates, aggregateStats } from '@/lib/ats';

// Mock candidate data for testing
const mockCandidates = [
  {
    id: '5',
    full_name: 'Alex Junior',
    title: 'Frontend Engineer',
    location: 'Nicosia, Cyprus',
    years_experience: '3',
    skills: 'React;JavaScript;CSS',
    willing_to_relocate: 'No'
  },
  {
    id: '12',
    full_name: 'Maria Senior',
    title: 'React Developer',
    location: 'Nicosia, Cyprus',
    years_experience: '8',
    skills: 'React;TypeScript;Node.js',
    willing_to_relocate: 'Yes'
  },
  {
    id: '8',
    full_name: 'John Smith',
    title: 'Backend Engineer',
    location: 'Berlin, Germany',
    years_experience: '5',
    skills: 'Java;Spring;MySQL',
    willing_to_relocate: 'No'
  },
  {
    id: '15',
    full_name: 'Sarah React',
    title: 'Full-Stack Developer',
    location: 'Limassol, Cyprus',
    years_experience: '6',
    skills: 'React;Node.js;MongoDB',
    willing_to_relocate: 'Yes'
  }
];

describe('ATS Tools', () => {
  describe('filterCandidates', () => {
    it('should filter candidates by location', () => {
      const filter = { location: 'Cyprus' };
      const result = filterCandidates(filter, mockCandidates);
      
      expect(result).toHaveLength(3);
      expect(result.every(c => c.location.includes('Cyprus'))).toBe(true);
    });

    it('should filter candidates by skills', () => {
      const filter = { skills: 'React' };
      const result = filterCandidates(filter, mockCandidates);
      
      expect(result).toHaveLength(3);
      expect(result.every(c => c.skills.includes('React'))).toBe(true);
    });

    it('should filter candidates by multiple criteria', () => {
      const filter = { 
        location: 'Cyprus',
        skills: 'React'
      };
      const result = filterCandidates(filter, mockCandidates);
      
      expect(result).toHaveLength(3);
      expect(result.every(c => 
        c.location.includes('Cyprus') && c.skills.includes('React')
      )).toBe(true);
    });
  });

  describe('rankCandidates', () => {
    it('should rank candidates by years of experience descending', () => {
      const candidates = mockCandidates.filter(c => c.skills.includes('React'));
      const rankPlan = { primary: 'years_experience' };
      const result = rankCandidates(candidates, rankPlan);
      
      expect(result).toHaveLength(3);
      expect(parseInt(result[0].years_experience)).toBeGreaterThanOrEqual(
        parseInt(result[1].years_experience)
      );
      expect(parseInt(result[1].years_experience)).toBeGreaterThanOrEqual(
        parseInt(result[2].years_experience)
      );
    });

    it('should handle empty candidate array', () => {
      const result = rankCandidates([], { primary: 'years_experience' });
      expect(result).toEqual([]);
    });
  });

  describe('aggregateStats', () => {
    it('should calculate correct statistics', () => {
      const reactCandidates = mockCandidates.filter(c => c.skills.includes('React'));
      const stats = aggregateStats(reactCandidates);
      
      expect(stats.count).toBe(3);
      expect(stats.avg_experience).toBeCloseTo(5.7, 1); // (3+8+6)/3 = 5.67
      expect(stats.top_skills).toBeDefined();
      expect(stats.top_skills).toContain('React');
    });

    it('should handle empty candidate array', () => {
      const stats = aggregateStats([]);
      expect(stats.count).toBe(0);
      expect(stats.avg_experience).toBe(0);
      expect(stats.top_skills).toEqual([]);
    });
  });

  describe('Integration Test - Assignment Requirement', () => {
    it('React dev, Cyprus, sort by experience desc - candidate #12 should appear above #5', () => {
      // Step 1: Filter for React developers in Cyprus
      const filter = {
        skills: 'React',
        location: 'Cyprus'
      };
      const filtered = filterCandidates(filter, mockCandidates);
      
      // Step 2: Rank by experience descending
      const rankPlan = { primary: 'years_experience' };
      const ranked = rankCandidates(filtered, rankPlan);
      
      // Step 3: Verify that candidate #12 appears above #5
      const candidate12Index = ranked.findIndex(c => c.id === '12');
      const candidate5Index = ranked.findIndex(c => c.id === '5');
      
      expect(candidate12Index).toBeLessThan(candidate5Index);
      expect(ranked[candidate12Index].years_experience).toBe('8');
      expect(ranked[candidate5Index].years_experience).toBe('3');
      
      // Verify both candidates are React developers in Cyprus
      expect(ranked[candidate12Index].skills).toContain('React');
      expect(ranked[candidate12Index].location).toContain('Cyprus');
      expect(ranked[candidate5Index].skills).toContain('React');
      expect(ranked[candidate5Index].location).toContain('Cyprus');
    });
  });
}); 