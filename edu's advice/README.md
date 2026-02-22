# Tom's Travel Companion

**Status:** 🟡 In Development
**PRD:** `prd.json` (machine-readable spec for Claude Code)

## What is this?

A web app that helps Tom plan multimodal commuter journeys (bike + train). It combines location input, schedule parsing, and real-time transport intelligence into a single tool.

The core question it answers: **"When should I leave, and can I take my bike on the train?"**

## Feature Phases

### Phase 1 - Location Input
Set your origin and destination.

| Feature | Description | Req ID |
|---------|-------------|--------|
| Postcode entry (From) | Type your home postcode, app validates and geocodes it | TTC-001 |
| Geolocation (From) | One-click "use my location" via browser GPS | TTC-002 |
| Postcode entry (To) | Type your work/college postcode, save multiple destinations | TTC-003 |
| Place search (To) | Type a college or workplace name, get autocomplete suggestions | TTC-004 |
| Map display | See both locations on an interactive map | TTC-005 |

### Phase 2 - Schedule Intelligence
Upload your timetable and let an LLM parse it.

| Feature | Description | Req ID |
|---------|-------------|--------|
| Text schedule upload | Paste or upload schedule text; LLM extracts day/time/location | TTC-006 |
| Image schedule upload | Take a photo of your timetable; LLM vision extracts the data | TTC-007 |

### Phase 3 - Transport Search
Find out the rules and options for your journey.

| Feature | Description | Req ID |
|---------|-------------|--------|
| Bike-on-train rules | Search which bikes are allowed on which trains at which times | TTC-008 |
| Bike-share availability | Find Lime, Santander Cycles, and other shared bikes near stations | TTC-009 |

### Phase 4 - Journey Orchestration
Everything comes together.

| Feature | Description | Req ID |
|---------|-------------|--------|
| Journey planner | Combine schedule + location + bike rules into departure recommendations | TTC-010 |

### Phase 5 - Daily Intelligence
Weather-aware decisions and live train data for daily use.

| Feature | Description | Req ID |
|---------|-------------|--------|
| Weather-aware departure | See current weather and rain/wind warnings. Get cycling advice ("walk instead?") | TTC-011 |
| Live train departures | Real-time departure board from your station - delays, cancellations, platforms | TTC-012 |
| Service disruption alerts | Warnings when your route has engineering works or cancellations | TTC-013 |
| College term awareness | App knows your term dates - no pointless notifications during holidays | TTC-016 |

### Phase 6 - Budget & Safety
Track costs, stay safe, and see your commute impact.

| Feature | Description | Req ID |
|---------|-------------|--------|
| Railcard savings tracker | Track ticket costs and see how much your 16-25 Railcard saves | TTC-014 |
| "Arrived safely" notification | One-tap button to notify a contact that you've arrived at college | TTC-015 |
| Delay Repay helper | When trains are late, get help claiming your money back | TTC-017 |
| Commute stats & CO2 | See how many days you've cycled, distance covered, and CO2 saved vs driving | TTC-018 |

## Getting Started (Step by Step)

### 1. Unzip and look around

After unzipping, you should have three files:

```
README.md       # This file (you're reading it)
PROMPT.md       # Instructions for Claude Code (it reads this, not you)
prd.json        # Machine-readable specification (source of truth)
```

You only need to read this README. Claude Code reads the other two files itself.

### 2. Set up the project

Open a terminal in the unzipped folder and run:

```bash
npx create-next-app@latest toms-travel-companion --typescript --tailwind --app --src-dir
cd toms-travel-companion
```

Then copy `prd.json` and `PROMPT.md` into the new project folder:

```bash
cp ../prd.json ../PROMPT.md .
```

### 3. Get your API keys

You need these before building. Phase 1-4 only need the first three; the rest are for later phases.

| API | What for | How to get it | Phase needed |
|-----|----------|---------------|--------------|
| Google Maps Platform | Postcodes, places, maps | https://console.cloud.google.com/google/maps-apis | 1 |
| LLM provider | Schedule parsing | OpenAI, Anthropic, or Google AI (via Vercel AI SDK) | 2 |
| Perplexity | Bike rule searches | https://docs.perplexity.ai/ | 3 |
| Transport API | Live train departures | https://www.transportapi.com/ (free tier: 1000/day) | 5 |
| Open-Meteo | Weather forecasts | Free, no key needed | 5 |

Create a `.env.local` file in your project root (never commit this to git):

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here
TRANSPORT_API_APP_ID=your_id_here
TRANSPORT_API_APP_KEY=your_key_here
```

### 4. Start Claude Code

Open a terminal in the project folder and run:

```bash
claude --dangerously-skip-permissions
```

Then tell it:

```
Read PROMPT.md and prd.json, then explain all of this to me and give me options of what you think we should do next.
```

Claude Code will read both files, then walk you through what the app does and suggest where to start. You're in charge; just chat with it like a colleague.

### 5. Build features

When you're ready to build, just ask in plain English:

```
Build TTC-001.
```

Claude Code will read the requirement from `prd.json`, build it, and explain what it did. When you're happy, ask for the next one. Work through Phase 1 (TTC-001 to TTC-005) first, as each requirement builds on the previous one.

### 6. Run the app

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You can keep Claude Code running in another terminal and ask it to make changes while you test.

### 7. Let it fly (dark factory mode)

Once you're comfortable with how Claude Code works, you can let it build an entire phase without stopping:

```
Implement all Phase 2 requirements in order.
```

It will work through each requirement sequentially, building and testing as it goes. You watch the output and jump in if anything looks wrong.

### 8. Deploy to Vercel

The easiest way to get this live is with the Vercel CLI:

```bash
npm i -g vercel
vercel
```

It will ask you to log in (create a free account at https://vercel.com if you don't have one), then deploy automatically. You'll get a live URL you can share with Tom.

To add your API keys to the live site, go to your project on https://vercel.com, then Settings > Environment Variables, and add the same keys from your `.env.local` file.

After the first deploy, every time you want to push an update:

```bash
vercel --prod
```

Or ask Claude Code: "Deploy this to Vercel" and it will do it for you.

## Tech Stack

- **Framework:** Next.js (TypeScript, App Router)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS (dark theme)
- **Maps:** Google Maps JavaScript API
- **LLM:** Vercel AI SDK (provider-agnostic)
- **Search:** Perplexity API
- **Bike data:** TfL API + GBFS open feeds
