import { create } from "zustand";

interface Candidate {
  id: string;
  full_name: string;
  title: string;
  location: string;
  years_experience: string;
  skills: string;
  availability_weeks: string;
  willing_to_relocate: string;
}

interface MCPPlan {
  filter: Record<string, string>;
  rank: { primary: string; tie_breakers?: string[] };
}

interface ATSState {
  message: string;
  candidates: Candidate[];
  filtered: Candidate[];
  ranked: Candidate[];
  plan: MCPPlan | null;
  summary: string;
  suggestions: string[];
  loading: boolean;
  setMessage: (m: string) => void;
  setCandidates: (c: Candidate[]) => void;
  setFiltered: (c: Candidate[]) => void;
  setRanked: (c: Candidate[]) => void;
  setPlan: (p: MCPPlan | null) => void;
  setSummary: (s: string) => void;
  setSuggestions: (s: string[]) => void;
  setLoading: (v: boolean) => void;
}

export const useATSStore = create<ATSState>((set) => ({
  message: "",
  candidates: [],
  filtered: [],
  ranked: [],
  plan: null,
  summary: "",
  suggestions: [],
  loading: false,
  setMessage: (message) => set({ message }),
  setCandidates: (candidates) => set({ candidates }),
  setFiltered: (filtered) => set({ filtered }),
  setRanked: (ranked) => set({ ranked }),
  setPlan: (plan) => set({ plan }),
  setSummary: (summary) => set({ summary }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setLoading: (loading) => set({ loading }),
}));
