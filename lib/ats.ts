interface Candidate {
  id: string;
  full_name: string;
  title: string;
  location: string;
  years_experience: string;
  skills: string;
  [key: string]: string | number; // Allow additional properties
}

interface FilterCondition {
  [key: string]: string | number | { $gte?: string; $lte?: string; $eq?: string };
}

interface RankPlan {
  primary: string;
  tie_breakers?: string[];
}

export function filterCandidates(
  filter: FilterCondition,
  candidates: Candidate[]
): Candidate[] {
  console.log("🔍 Filtering with:", filter, "Total candidates:", candidates.length);
  
  if (Object.keys(filter).length === 0) {
    return candidates;
  }
  
  const filtered = candidates.filter((candidate, index) => {
    const matches = Object.entries(filter).every(([key, condition]) => {
      const value = candidate[key];
      
      // Log the first few candidates for debugging
      if (index < 3) {
        console.log(`  🔍 Candidate ${index + 1}: Checking ${key}="${value}" against condition="${condition}"`);
      }

      // Handle numeric conditions
      if (typeof condition === "object" && condition !== null) {
        if ("$gte" in condition) {
          const result = parseFloat(String(value)) >= parseFloat(String(condition.$gte));
          if (index < 3) console.log(`    📊 ${value} >= ${condition.$gte} = ${result}`);
          return result;
        }
        if ("$lte" in condition) {
          const result = parseFloat(String(value)) <= parseFloat(String(condition.$lte));
          if (index < 3) console.log(`    📊 ${value} <= ${condition.$lte} = ${result}`);
          return result;
        }
        if ("$lt" in condition) {
          const result = parseFloat(String(value)) < parseFloat(String(condition.$lt));
          if (index < 3) console.log(`    📊 ${value} < ${condition.$lt} = ${result}`);
          return result;
        }
        if ("$gt" in condition) {
          const result = parseFloat(String(value)) > parseFloat(String(condition.$gt));
          if (index < 3) console.log(`    📊 ${value} > ${condition.$gt} = ${result}`);
          return result;
        }
        if ("$in" in condition) {
          const values = Array.isArray(condition.$in) ? condition.$in : [condition.$in];
          const result = values.some(val => String(value) === String(val));
          if (index < 3) console.log(`    📊 ${value} in [${values.join(', ')}] = ${result}`);
          return result;
        }
        if ("$eq" in condition) {
          const result = value == condition.$eq;
          if (index < 3) console.log(`    📊 ${value} == ${condition.$eq} = ${result}`);
          return result;
        }
        return false;
      }

      // Handle string values - convert both to lowercase for case-insensitive matching
      if (typeof value === "string") {
        const valueStr = value.toLowerCase();
        const conditionStr = String(condition).toLowerCase();
        
        // Handle semicolon-separated values (like skills)
        if (value.includes(';')) {
          const valuesArray = value.split(';').map(s => s.trim().toLowerCase());
          const result = valuesArray.some(val => val.includes(conditionStr));
          if (index < 3) console.log(`    🔍 Skills: [${valuesArray.join(', ')}] includes "${conditionStr}" = ${result}`);
          return result;
        }
        
        // Regular string matching
        const result = valueStr.includes(conditionStr);
        if (index < 3) console.log(`    🔍 String: "${valueStr}" includes "${conditionStr}" = ${result}`);
        return result;
      }

      // Handle array values
      if (Array.isArray(value)) {
        const result = value.some((v) =>
          String(v).toLowerCase().includes(String(condition).toLowerCase())
        );
        if (index < 3) console.log(`    🔍 Array: ${value} includes "${condition}" = ${result}`);
        return result;
      }

      return false;
    });
    
    if (index < 3) {
      console.log(`  ✅ Candidate ${index + 1} overall match: ${matches}`);
    }
    
    return matches;
  });

  console.log("✅ Filtered result:", filtered.length, "candidates");
  
  // Show some examples of what was found
  if (filtered.length > 0) {
    console.log("📋 Sample matches:", filtered.slice(0, 2).map(c => ({
      id: c.id,
      name: c.full_name,
      title: c.title,
      location: c.location,
      skills: c.skills?.split(';').slice(0, 3).join(', ')
    })));
  }
  
  return filtered;
}

export function rankCandidates(
  candidates: Candidate[],
  rankPlan: RankPlan
): Candidate[] {
  if (!candidates.length) return [];
  
  console.log("🏆 Ranking", candidates.length, "candidates by", rankPlan.primary);
  
  return [...candidates].sort((a, b) => {
    // Primary ranking
    const primaryA = a[rankPlan.primary];
    const primaryB = b[rankPlan.primary];
    
    // Handle numeric fields (like years_experience)
    if (!isNaN(Number(primaryA)) && !isNaN(Number(primaryB))) {
      const numA = parseFloat(String(primaryA));
      const numB = parseFloat(String(primaryB));
      if (numA !== numB) {
        return numB - numA; // Descending order (most experience first)
      }
    }
    
    // Handle string fields (alphabetical)
    if (typeof primaryA === 'string' && typeof primaryB === 'string') {
      const comparison = primaryA.localeCompare(primaryB);
      if (comparison !== 0) {
        return comparison;
      }
    }
    
    // Tie breakers
    if (rankPlan.tie_breakers?.length) {
      for (const tieBreaker of rankPlan.tie_breakers) {
        const valueA = a[tieBreaker];
        const valueB = b[tieBreaker];
        
        if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
          const numA = parseFloat(String(valueA));
          const numB = parseFloat(String(valueB));
          if (numA !== numB) {
            return numB - numA;
          }
        }
        
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          const comparison = valueA.localeCompare(valueB);
          if (comparison !== 0) {
            return comparison;
          }
        }
      }
    }
    
    return 0;
  });
}

export function aggregateStats(candidates: Candidate[]) {
  if (!candidates.length) {
    return { count: 0, avg_experience: 0, top_skills: [] };
  }

  const count = candidates.length;
  
  // Calculate average years of experience
  const totalExperience = candidates.reduce((sum, candidate) => {
    const exp = parseFloat(String(candidate.years_experience)) || 0;
    return sum + exp;
  }, 0);
  const avg_experience = Math.round((totalExperience / count) * 10) / 10;
  
  // Count skill frequencies
  const skillCounts: Record<string, number> = {};
  candidates.forEach(candidate => {
    if (candidate.skills) {
      const skills = candidate.skills.split(';').map((s: string) => s.trim());
      skills.forEach((skill: string) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    }
  });
  
  // Get top 5 skills
  const top_skills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([skill]) => skill);
  
  return { count, avg_experience, top_skills };
}
