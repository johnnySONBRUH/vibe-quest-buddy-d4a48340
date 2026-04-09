

## Plan: Dark/Light Mode Toggle, Welcome Tutorial, and Versatile AI Agent

### 1. Dark/Light Mode Toggle

**Create `src/hooks/useTheme.tsx`** — a context provider that reads the user's preference from `localStorage` (or defaults to system preference), toggles between `dark` and `light` by adding/removing the `dark` class on `<html>`, and persists the choice.

**Add a toggle button to the Dashboard header** — a Sun/Moon icon button next to the sign-out button using the existing `Switch` or a simple icon toggle. Also add it to the Auth page header for consistency.

**Wrap App in ThemeProvider** in `src/App.tsx`.

### 2. Welcome Tutorial for New Users

**Create `src/components/WelcomeTutorial.tsx`** — a multi-step onboarding modal (3-4 slides) shown only on first login. Steps:
- **Welcome** — introduce QuestUp, explain the concept of daily missions and XP
- **Missions** — explain mission categories (study, exercise, social, creative, wellness) and difficulty scaling
- **Streaks & Achievements** — explain streaks, badges, and leveling up
- **AI Coach** — introduce the AI assistant and invite them to try it

Uses `framer-motion` for slide transitions, dots for step indicators, and a "Get Started" CTA on the last step. Completion is tracked via `localStorage` key `questup_onboarding_complete`.

**Integrate into `Dashboard.tsx`** — show the tutorial overlay when the flag is not set.

### 3. Versatile AI Agent

**Upgrade the edge function `supabase/functions/ai-motivator/index.ts`** to support a richer system prompt that makes the AI a versatile assistant, not just a motivator. It should:
- Give study tips, create study plans, explain concepts
- Help with time management and productivity
- Offer workout suggestions and wellness advice
- Generate creative prompts and social challenges
- Answer general student life questions
- Accept a `mode` parameter (motivate, study-help, plan, general) to adjust behavior

**Upgrade `src/components/AIMotivator.tsx`** to:
- Add mode selector tabs/chips at the top of the chat (Coach, Study Help, Planner, General)
- Pass selected mode to the edge function
- Add streaming support for real-time token rendering
- Update quick prompts to be mode-aware
- Rename the component label from "AI Coach" to "QuestUp AI"

### Technical Details

**Files to create:**
- `src/hooks/useTheme.tsx` — theme context with toggle + persistence
- `src/components/WelcomeTutorial.tsx` — multi-step onboarding modal

**Files to modify:**
- `src/App.tsx` — wrap with ThemeProvider
- `src/pages/Dashboard.tsx` — add theme toggle button, integrate tutorial
- `src/pages/Auth.tsx` — add theme toggle
- `src/components/AIMotivator.tsx` — add mode selector, streaming, versatile prompts
- `supabase/functions/ai-motivator/index.ts` — expand system prompt with mode support, add streaming
- `src/index.css` — ensure dark mode sidebar variables are defined (already present)

**No database changes needed.**

