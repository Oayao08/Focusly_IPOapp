# Focusly — Focus. Flow. Grow.
> Anti-procrastination productivity app for young people aged 17–24

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FLOWVITY MVP                           │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │  AI Engine   │    │  Persistence │  │
│  │  React SPA   │◄──►│ Claude API / │    │ localStorage │  │
│  │  (Mobile UI) │    │ Rule-based   │    │  (Browser)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### MVP Architecture (Phase 1 — this file)
- **Single-page React application** with localStorage persistence
- **5 core screens**: Home, Tasks, Focus, Habits, Stats
- **AI layer**: Rule-based insights locally + optional Claude API integration
- **Zero backend required** — runs entirely in the browser
- **Gamification engine**: Points, levels, badges

### Production Architecture (Phase 2)
```
┌──────────────────────────────────────────────────┐
│  Mobile App (React Native / Expo)                │
│  Web App (Next.js PWA)                           │
└───────────────────┬──────────────────────────────┘
                    │ HTTPS REST + WebSocket
┌───────────────────▼──────────────────────────────┐
│  API Gateway (Node.js / FastAPI)                 │
│  ├── Auth Service (JWT)                          │
│  ├── Task Service                                │
│  ├── Analytics Service                           │
│  └── AI Service (Claude API)                     │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│  PostgreSQL (users, tasks, habits, sessions)     │
│  Redis (sessions, cache, real-time)              │
└──────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### MVP (Current)
| Layer         | Technology       | Reason                                      |
|---------------|------------------|---------------------------------------------|
| Frontend      | React 18         | Component model, hooks, reactive UI         |
| Styling       | Pure CSS-in-JS   | No dependencies, full control               |
| Persistence   | localStorage     | Instant, zero-setup, works offline          |
| AI            | Rule-based + Claude API | Functional without key, enhanced with it |
| Fonts         | Google Fonts (Syne + Plus Jakarta Sans) | Distinctive, modern feel |

### Production Stack (Recommended)
| Layer         | Technology       | Reason                                      |
|---------------|------------------|---------------------------------------------|
| Mobile        | React Native / Expo | Cross-platform iOS + Android              |
| Web           | Next.js 14 (App Router) | SSR, PWA, fast performance             |
| Styling       | Tailwind CSS + CSS Vars | Design system consistency              |
| Backend       | FastAPI (Python) or Node.js + Express | Performance + AI libraries      |
| Database      | PostgreSQL + Prisma ORM | Reliable relational data             |
| Cache         | Redis            | Session data, streak cache, queues          |
| Auth          | Clerk or Supabase Auth | Fast auth implementation               |
| AI            | Claude API (Anthropic) | Personalized behavioral recommendations |
| Hosting       | Vercel (web) + Railway (API) | Zero-config, scalable            |
| Analytics     | PostHog (self-hosted) | Privacy-respecting usage analytics    |

---

## 3. Project Structure (Production)

```
flowvity/
├── apps/
│   ├── web/                          # Next.js web app
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   ├── (app)/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── tasks/page.tsx
│   │   │   │   ├── focus/page.tsx
│   │   │   │   ├── habits/page.tsx
│   │   │   │   └── stats/page.tsx
│   │   │   ├── api/
│   │   │   │   ├── tasks/route.ts
│   │   │   │   ├── habits/route.ts
│   │   │   │   ├── sessions/route.ts
│   │   │   │   └── ai/insights/route.ts
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                   # Reusable design system
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── ProgressRing.tsx
│   │   │   │   └── Toast.tsx
│   │   │   ├── tasks/
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   └── AddTaskForm.tsx
│   │   │   ├── focus/
│   │   │   │   ├── PomodoroTimer.tsx
│   │   │   │   └── SessionHistory.tsx
│   │   │   └── habits/
│   │   │       ├── HabitCard.tsx
│   │   │       └── StreakDots.tsx
│   │   ├── hooks/
│   │   │   ├── useTasks.ts
│   │   │   ├── useHabits.ts
│   │   │   ├── useTimer.ts
│   │   │   └── usePoints.ts
│   │   ├── lib/
│   │   │   ├── db.ts                 # Prisma client
│   │   │   ├── ai.ts                 # Claude API wrapper
│   │   │   ├── streak.ts             # Streak calculation
│   │   │   └── gamification.ts       # Points & badges
│   │   └── types/
│   │       └── index.ts
│   │
│   └── mobile/                       # React Native app (future)
│
├── packages/
│   └── shared/                       # Shared types & utils
│       ├── types/
│       └── constants/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── tasks.py
│   │   │   ├── habits.py
│   │   │   ├── sessions.py
│   │   │   └── ai.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── task.py
│   │   │   ├── habit.py
│   │   │   └── session.py
│   │   ├── services/
│   │   │   ├── ai_service.py         # Claude API integration
│   │   │   ├── streak_service.py
│   │   │   └── gamification.py
│   │   └── main.py
│   └── requirements.txt
│
├── database/
│   ├── migrations/
│   └── schema.prisma
│
└── docs/
    ├── architecture.md
    └── api.md
```

---

## 4. Database Schema

```sql
-- Users
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  name       TEXT,
  points     INTEGER DEFAULT 0,
  level      TEXT DEFAULT 'Starter',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  category        TEXT CHECK (category IN ('study','health','creative','personal','work')),
  estimated_mins  INTEGER DEFAULT 25,
  completed       BOOLEAN DEFAULT FALSE,
  date            DATE NOT NULL,
  points_value    INTEGER DEFAULT 10,
  completed_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Habits
CREATE TABLE habits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  emoji       TEXT DEFAULT '🌟',
  category    TEXT DEFAULT 'personal',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE habit_completions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id   UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  UNIQUE(habit_id, date)
);

-- Focus Sessions
CREATE TABLE focus_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id     UUID REFERENCES tasks(id),
  type        TEXT CHECK (type IN ('work','break')),
  duration    INTEGER NOT NULL,  -- minutes
  completed   BOOLEAN DEFAULT FALSE,
  date        DATE NOT NULL,
  started_at  TIMESTAMP,
  ended_at    TIMESTAMP
);

-- Badges
CREATE TABLE user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL,
  earned_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Off-device activity log
CREATE TABLE offline_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  activity    TEXT NOT NULL,
  date        DATE NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 5. AI Service (Python / FastAPI)

```python
# backend/src/services/ai_service.py
import anthropic
from typing import Optional

client = anthropic.Anthropic()

async def get_personalized_insights(user_stats: dict) -> str:
    """
    Generate personalized productivity insights using Claude.
    Falls back to rule-based recommendations if API unavailable.
    """
    
    system_prompt = """
    You are Flowvity's AI productivity coach for young people (17-24).
    
    Rules:
    - Be encouraging, specific, and actionable
    - Keep responses under 250 words
    - Use 1 relevant emoji per insight
    - Focus on: reducing phone use, building focus habits, consistency
    - Avoid generic advice — reference their actual numbers
    - Never shame or criticize — always constructive
    """
    
    user_message = f"""
    User's weekly productivity data:
    - Tasks completed: {user_stats['tasks_completed']}
    - Focus sessions: {user_stats['focus_sessions']} ({user_stats['focus_minutes']} min)
    - Habit streak (longest): {user_stats['longest_streak']} days
    - Habits completed this week: {user_stats['habits_rate']}%
    - Points earned: {user_stats['points']}
    - Off-device activities logged: {user_stats['offline_activities']}
    - Most productive day: {user_stats['best_day']}
    
    Give 3 specific, personalized insights to improve their productivity
    and help them spend less time on their phone.
    """
    
    try:
        message = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=400,
            messages=[{"role": "user", "content": user_message}],
            system=system_prompt
        )
        return message.content[0].text
    except Exception:
        return generate_rule_based_insights(user_stats)


def generate_rule_based_insights(stats: dict) -> str:
    """Fallback rule-based recommendation system."""
    insights = []
    
    if stats['focus_minutes'] < 60:
        insights.append("💡 Try to log at least 60 min of focused work this week. 2 Pomodoros per day is a great start.")
    elif stats['focus_minutes'] > 180:
        insights.append(f"🔥 Excellent focus this week — {stats['focus_minutes']} min! You're in the top tier.")
    
    if stats['longest_streak'] >= 7:
        insights.append(f"🏆 Your {stats['longest_streak']}-day habit streak is exceptional. You're building real discipline.")
    elif stats['longest_streak'] >= 3:
        insights.append(f"🌱 A {stats['longest_streak']}-day streak is a great foundation. Stay consistent!")
    else:
        insights.append("🌱 Focus on one habit at a time. Just 5 minutes a day builds powerful momentum.")
    
    if stats['offline_activities'] == 0:
        insights.append("📵 Try logging one offline activity today. Stepping away from screens recharges your focus.")
    
    return '\n\n'.join(insights[:3])
```

---

## 6. How to Run the Application

### Option A — Instant Demo (Recommended)
```bash
# Just open the file in any modern browser
open flowvity.html

# Or serve locally with Python
python -m http.server 8080
# Visit http://localhost:8080/flowvity.html
```

### Option B — Full React + Vite Development Setup
```bash
# 1. Initialize project
npm create vite@latest flowvity -- --template react
cd flowvity
npm install

# 2. Install dependencies
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Copy src/ files from this project
# (Split flowvity.html into component files under src/)

# 4. Run dev server
npm run dev
# Visit http://localhost:5173
```

### Option C — Full Stack (FastAPI Backend)
```bash
# Backend
pip install fastapi uvicorn anthropic psycopg2-binary python-dotenv
cd backend
cp .env.example .env
# Add ANTHROPIC_API_KEY and DATABASE_URL to .env
uvicorn src.main:app --reload --port 8000

# Frontend
cd apps/web
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

### Environment Variables
```env
# .env
ANTHROPIC_API_KEY=sk-ant-api...
DATABASE_URL=postgresql://user:pass@localhost:5432/flowvity
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## 7. Key Features Explained

### Pomodoro Timer
- Default: 25 min focus / 5 min break (customizable)
- Links to tasks for tracking what you worked on
- Earns 30 points per completed session
- Phase auto-transitions with toast notifications

### Habit Tracking with Streaks
- 7-day visual strip shows consistency at a glance
- Streak calculated from consecutive completion dates
- Badges unlock at 3-day and 7-day streaks
- Completion earns 20 points

### Gamification Engine
| Action                  | Points |
|-------------------------|--------|
| Complete a task         | +10    |
| Complete a Pomodoro     | +30    |
| Check off a habit       | +20    |
| Log offline activity    | +15    |
| Unlock a badge          | +10–100|

### Off-Device Activity System
- Rotating daily suggestions from 10 curated offline activities
- One-tap logging with instant point reward
- Logged activities tracked in daily stats
- Psychological principle: reward the alternative, not just restrict

### AI Recommendations
- Works without an API key (rule-based logic)
- Enhanced with Claude API for personalized insights
- Analyzes: task patterns, focus time, habit streaks, day-of-week productivity
- Designed to be encouraging, not shaming

---

## 8. Behavioral Psychology Principles Applied

| Principle                  | Implementation                                              |
|----------------------------|-------------------------------------------------------------|
| Temptation Bundling        | Pair tasks with immediate rewards (points)                  |
| Variable Reward Schedule   | Badge system with unpredictable unlock timing               |
| Commitment Devices         | Daily task list set in the morning                          |
| Implementation Intentions  | Link tasks to specific time estimates                       |
| Friction Reduction         | One-tap habit logging, minimal steps to start              |
| Friction Addition          | Off-device suggestions require thought to replace           |
| Progress Principle         | Visual progress ring drives completion drive                |
| Identity-Based Habits      | Level names (Focused, Flow Master) reinforce identity       |
| Loss Aversion              | Streak counter makes breaking the chain psychologically costly |
| Temporal Motivation        | Daily reset creates urgency without overwhelming            |

---

## 9. Next Improvements (Post-MVP)

### Phase 2 — Backend & Sync (1-2 months)
- [ ] User authentication (email + Google OAuth)
- [ ] Cloud sync across devices (PostgreSQL + FastAPI)
- [ ] Push notifications for habit reminders
- [ ] Weekly email digest with stats

### Phase 3 — Intelligence (2-3 months)
- [ ] Claude-powered goal decomposition (break big goals into tasks)
- [ ] Smart scheduling: suggest best focus time based on patterns
- [ ] Social accountability: share streaks with friends
- [ ] Screen time API integration (iOS Screen Time / Digital Wellbeing)
- [ ] Mood tracking to correlate with productivity

### Phase 4 — Platform (3-6 months)
- [ ] React Native mobile app (iOS + Android)
- [ ] Calendar integration (Google/Apple)
- [ ] Spotify focus playlists integration
- [ ] Community challenges (group habit streaks)
- [ ] Parental controls / accountability partner mode
- [ ] Wearable integration (Apple Watch quick logging)

---

## License
MIT License — Free to use, modify and distribute.

Built with ❤️ to help young people focus on what matters.
