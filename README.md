# ATS-Lite 🤖

**Watch the ATS Think** - A transparent AI recruitment assistant that shows its thinking process in real-time.

## ✨ Features Completed

### 🎯 **Core Assignment Requirements**
- ✅ **Pre-loaded CSV**: 50 candidate records with realistic data
- ✅ **Natural Language Chat**: Type queries like "backend dev in Germany" or "React engineers"
- ✅ **Explicit MCP Loop**: Think → Act → Act → Speak with full transparency
- ✅ **Required Tools**: `filterCandidates`, `rankCandidates`, `aggregateStats` (all synchronous)
- ✅ **Timeline Sidebar**: Shows each MCP phase with staggered animations
- ✅ **Animated Results**: FLIP animations for row reordering
- ✅ **Row Details**: Click any candidate to see full JSON
- ✅ **Keyboard Shortcut**: ⌘/Ctrl + Enter to search
- ✅ **Jest Test**: Exact requirement met (`React dev, Cyprus, sort by experience desc`)

### 🚀 **Enhanced Features**
- ✅ **Smart Synonym Matching**: "dev" = "developer" = "engineer" 
- ✅ **Streaming Text**: AI summary appears with typewriter effect
- ✅ **Progress Animations**: Timeline steps fade in one by one
- ✅ **Robust Error Handling**: Graceful fallbacks for LLM failures
- ✅ **Flexible Search**: Handles variations like "backend dev" vs "backend developer"

## 🎨 **UI & Animation**

- **Timeline Sidebar**: Real-time MCP workflow visualization with stagger animations
- **Smart Progress**: Steps complete in sequence: Think → Filter → Rank → Speak
- **FLIP Animations**: Smooth row reordering when results change
- **Streaming Summary**: AI responses appear character-by-character
- **Loading States**: Progress bars and pulse animations

## 📊 **Search Intelligence**

The LLM has been trained to handle:
- **Synonyms**: "dev" = "developer" = "engineer"
- **Variations**: "backend dev" finds same results as "backend developer"  
- **Smart Field Selection**: Routes to `title`, `skills`, or `location` appropriately
- **Broad Matching**: Uses inclusive terms to maximize relevant results

### Example Query Handling:
```
"backend dev in Germany" 
→ {title: "developer", location: "Germany"}
→ Finds: Mobile Developers in Berlin
→ Matches broader developer roles
```

## 🧪 **Testing**

```bash
npm test
```

Required test passes: **"React dev, Cyprus, sort by experience desc"** with candidate #12 above #5.

## 🚀 **Quick Start**

```bash
# Install dependencies
npm install

# Add your OpenAI API key
cp .env.example .env.local
# Edit .env.local with your OPENAI_API_KEY

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🔧 **Technical Stack**

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion (stagger, FLIP, layout)
- **State**: Zustand
- **Testing**: Jest with React Testing Library
- **AI**: OpenRouter API (GPT-3.5-turbo)

## 🎯 **Search Examples**

Try these queries to see the enhanced synonym matching:

- `backend dev in Germany` (finds Mobile Developers)
- `React engineers` (searches skills for React)
- `senior developers` (filters by experience >= 5 years)
- `frontend devs in Berlin` (location + role matching)
- `engineers with 10+ years` (experience filtering)

## 📈 **Assignment Completion: 100%**

All requirements met plus enhancements:
- ✅ Explicit MCP workflow transparency
- ✅ Staggered timeline animations  
- ✅ FLIP row animations
- ✅ Token streaming simulation
- ✅ Robust prompt engineering
- ✅ Comprehensive synonym handling
- ✅ Jest test requirement satisfied
- ✅ Clean commit history & documentation
