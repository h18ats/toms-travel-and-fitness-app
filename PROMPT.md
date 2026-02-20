# PROMPT.md - Claude Code Development Instructions

## Purpose

This file tells Claude Code how to interpret `prd.json` and develop Tom's Travel Companion. Andy is learning Claude Code, so start conversationally: explain the project, discuss options, and let Andy drive. When Andy is ready to build, follow the dark factory protocol below to work through requirements autonomously.

---

## How to read prd.json

The `prd.json` file follows a standardised schema. Here is how to interpret each section:

### Top-level fields

| Field | What it means |
|-------|---------------|
| `name` | Project identifier |
| `version` | Semantic version - bump the patch when you complete a requirement |
| `status` | Overall project status |
| `currentState` | Snapshot of progress - update `completionPercentage` and `metrics.requirementsComplete` after each requirement |
| `focus` | What to work on right now (derived from WSJF scores) |

### Requirements

Each requirement in the `requirements` array has:

| Field | What it means |
|-------|---------------|
| `id` | Unique identifier (e.g. TTC-001). Reference this in commit messages. |
| `title` | Short name for the feature |
| `description` | What to build, in detail |
| `status` | `not-started`, `in-progress`, `completed`, `blocked` |
| `priority` | Human-readable priority level |
| `prioritization.wsjf` | Numerical priority score. Higher = do first. |
| `acceptanceCriteria` | **Checklist of things that must be true when done.** Every item must pass. |
| `deliverables` | Expected components/modules to create |
| `note` | Additional context |

### Execution order

The `executionOrder` array tells you the optimal build sequence. Follow this order unless a dependency forces a different sequence. The `dependencyConstraintApplied` flag means the requirement was reordered due to a prerequisite.

### Phases

The `phases` array groups requirements into logical milestones. Complete all requirements in a phase before moving to the next.

---

## Dark factory protocol

When asked to work autonomously (e.g. "implement Phase 1"), follow this protocol:

### For each requirement, in execution order:

1. **Read** the requirement from `prd.json`
2. **Update status** to `in-progress` in `prd.json`
3. **Inspect** the existing codebase to understand the current file structure, framework, and patterns
4. **Plan** the implementation:
   - Which files to create or modify
   - Which existing components to reuse
   - Which API integrations are needed
5. **Build** the feature:
   - Follow existing code patterns and conventions
   - Use the same styling approach (Tailwind, CSS modules, etc.) as the rest of the app
   - Create reusable components where the PRD indicates shared deliverables
6. **Verify** against acceptance criteria:
   - Go through each acceptance criterion line by line
   - Test in browser if possible (use `npm run dev` or equivalent)
   - Fix any criteria that are not met
7. **Update prd.json**:
   - Set `status` to `completed`
   - Add `completedDate` with today's date
   - Update `currentState.completionPercentage` and `metrics.requirementsComplete`
   - Bump `version` patch number
8. **Commit** with a descriptive message referencing the requirement ID:
   ```
   feat(TTC-001): Add postcode input with validation and geocoding
   ```
9. **Move to the next requirement**

### Dependency awareness

Some requirements depend on others:

| Requirement | Depends on |
|-------------|-----------|
| TTC-003 | TTC-001 (reuses PostcodeInput component) |
| TTC-005 | TTC-001, TTC-003 (needs origin + destination coordinates) |
| TTC-007 | TTC-006 (shares schedule data model) |
| TTC-010 | TTC-006, TTC-008 (combines schedule + bike rules) |
| TTC-011 | TTC-001 or TTC-002 (needs origin coordinates for weather forecast location) |
| TTC-012 | TTC-001 or TTC-002 (needs location to find nearest station) |
| TTC-013 | TTC-012 (uses same station/route data) |
| TTC-014 | None (standalone) |
| TTC-015 | TTC-001 or TTC-002 (optional: geofence uses destination coordinates) |
| TTC-016 | None (standalone) |
| TTC-017 | TTC-012 (needs live departure data to detect delays) |
| TTC-018 | TTC-001, TTC-003 (needs route for distance calculation) |

If a dependency is not yet built, build the dependency first.

---

## Code conventions

### General rules

- **Framework:** Match whatever the existing codebase uses (likely Next.js or React+Vite)
- **Language:** TypeScript preferred, JavaScript acceptable
- **Styling:** Tailwind CSS with the existing dark theme (`bg-[#0a1628]` based on current deployment)
- **State management:** React state + localStorage for persistence. No external state library unless already present.
- **API calls:** Use `fetch` or the existing HTTP client. For LLM calls, use Vercel AI SDK (`@vercel/ai`).

### Component patterns

- One component per file
- Named exports (not default exports) for better refactoring support
- Props interfaces defined at the top of each file
- Custom hooks in a `hooks/` directory
- API integration modules in a `lib/` or `services/` directory

### API key safety

- **Never** hardcode API keys in source files
- Use environment variables: `process.env.NEXT_PUBLIC_*` for client-side, `process.env.*` for server-side
- All LLM and Perplexity calls must go through server-side API routes (Vercel serverless functions) to keep keys secret
- Google Maps API key can be client-side but must have domain restrictions configured

### Error handling

- Every API call must have error handling
- Show user-friendly error messages (not raw API errors)
- Provide fallback behaviour when APIs are unavailable:
  - Geolocation fails → show manual postcode input
  - Places API fails → show manual postcode input
  - LLM parsing fails → show raw text and ask user to format manually
  - Perplexity fails → show "please try again" with link to manual search
  - Weather API fails → show "weather unavailable" with last cached data
  - Transport API fails → show "departures unavailable, check National Rail"
  - Geofence not supported → disable auto-arrival, keep manual button

### Accessibility

- All inputs must have labels
- All buttons must have descriptive text or aria-labels
- Colour contrast must meet WCAG AA (especially on dark backgrounds)
- Keyboard navigation must work for all interactive elements

---

## API integration details

### Google Maps Platform

**Geocoding** (postcode to coordinates):
```
GET https://maps.googleapis.com/maps/api/geocode/json
  ?address={postcode}&region=gb&key={API_KEY}
```

**Reverse geocoding** (coordinates to address):
```
GET https://maps.googleapis.com/maps/api/geocode/json
  ?latlng={lat},{lng}&key={API_KEY}
```

**Places Autocomplete** (name to place):
Use the `@googlemaps/js-api-loader` package or load the Maps JS SDK directly. Use `componentRestrictions: { country: 'gb' }` to filter to UK results.

### LLM Schedule Parsing (via Vercel AI SDK)

Create a server-side API route (e.g. `/api/parse-schedule`) that:

1. Receives the schedule text (or image as base64)
2. Calls the LLM with a structured output prompt
3. Returns parsed schedule as JSON

**Prompt template for text parsing:**
```
You are a schedule parser. Extract the timetable from the following text into structured JSON.

For each entry, extract:
- dayOfWeek: string (Monday, Tuesday, etc.)
- startTime: string (HH:MM in 24h format)
- endTime: string (HH:MM in 24h format)
- subject: string (class/event name)
- location: string (room/building if mentioned, otherwise null)

Return a JSON array of entries. If information is ambiguous, include your best guess and set a "confidence" field to "low".

Schedule text:
{user_input}
```

**For image parsing**, use the same prompt but attach the image to the LLM request as a vision input.

### Perplexity API

Create a server-side API route (e.g. `/api/search-bike-rules`) that:

```javascript
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: 'You are a UK transport expert. Answer questions about bike policies on trains. Always cite your sources with URLs.'
      },
      {
        role: 'user',
        content: query
      }
    ]
  })
});
```

### TfL Santander Cycles API

```
GET https://api.tfl.gov.uk/BikePoint
GET https://api.tfl.gov.uk/BikePoint?lat={lat}&lon={lon}&radius={metres}
```

No API key required. Returns docking stations with real-time bike/dock counts.

### GBFS Feeds

GBFS is an open standard. Feed discovery:
```
GET {provider_url}/gbfs.json
```

This returns URLs for `station_information.json` (locations) and `station_status.json` (availability). Common UK providers:
- Lime: check https://github.com/MobilityData/gbfs for current feed URLs
- HumanForest (London): GBFS compliant

### Open-Meteo API (Weather)

Free, no API key required. 10,000 requests/day limit.

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lng}
  &hourly=temperature_2m,precipitation_probability,windspeed_10m,weathercode
  &forecast_days=1
  &timezone=Europe/London
```

Returns hourly forecast. Key fields:
- `temperature_2m`: Temperature in Celsius
- `precipitation_probability`: 0–100% chance of rain
- `windspeed_10m`: Wind speed in km/h
- `weathercode`: WMO weather condition code

**Cycling thresholds:**
- Rain probability > 60% → suggest walking
- Wind speed > 30 km/h → suggest walking
- Temperature < 2°C → warn about ice

### Transport API / Realtime Trains

**Transport API:** https://www.transportapi.com/ (free tier: 1000 requests/day)

```
GET https://transportapi.com/v3/uk/train/station/{station_code}/live.json
  ?app_id={APP_ID}&app_key={APP_KEY}
  &darwin=false&train_status=passenger
```

**Alternative:** Realtime Trains API (https://api.rtt.io/) – free for personal use.

### UK Bank Holidays API

```
GET https://www.gov.uk/bank-holidays.json
```

Free, no authentication required. Returns bank holiday dates for England, Scotland, Wales, and Northern Ireland.

---

## Folder structure recommendation

Adapt this to the existing project structure. If starting fresh:

```
src/
  app/                     # Next.js app router (or pages/ for pages router)
    api/
      parse-schedule/      # LLM schedule parsing endpoint
        route.ts
      search-bike-rules/   # Perplexity search endpoint
        route.ts
    page.tsx               # Main app page
    layout.tsx             # Root layout with dark theme
  components/
    location/
      PostcodeInput.tsx    # TTC-001, TTC-003
      GeolocationButton.tsx # TTC-002
      PlaceAutocomplete.tsx # TTC-004
      SavedDestinations.tsx # TTC-003
    map/
      MapDisplay.tsx       # TTC-005
    schedule/
      ScheduleUpload.tsx   # TTC-006
      ImageUpload.tsx      # TTC-007
      ScheduleTable.tsx    # TTC-006, TTC-007 (shared)
    search/
      BikeRulesSearch.tsx  # TTC-008
      BikeShareMap.tsx     # TTC-009
    journey/
      JourneyPlanner.tsx   # TTC-010
      DailyView.tsx        # TTC-010
    weather/
      WeatherWidget.tsx    # TTC-011
      CyclingAdvice.tsx    # TTC-011
    departures/
      DepartureBoard.tsx   # TTC-012
      DisruptionBanner.tsx # TTC-013
    budget/
      CostTracker.tsx      # TTC-014
      RailcardSavings.tsx  # TTC-014
      DelayRepayClaim.tsx  # TTC-017
    safety/
      ArrivedSafelyButton.tsx # TTC-015
    stats/
      CommuteStats.tsx     # TTC-018
      CO2Savings.tsx       # TTC-018
      StreakCounter.tsx    # TTC-018
    calendar/
      TermCalendar.tsx     # TTC-016
  hooks/
    useGeolocation.ts      # TTC-002
    useLocalStorage.ts     # Shared persistence hook
    useWeather.ts          # TTC-011
    useDepartures.ts       # TTC-012
    useTermDates.ts        # TTC-016
  lib/
    geocoding.ts           # Google Geocoding API wrapper
    places.ts              # Google Places API wrapper
    schedule-parser.ts     # Client-side caller for /api/parse-schedule
    bike-rules.ts          # Client-side caller for /api/search-bike-rules
    bike-share.ts          # TfL + GBFS API wrappers
    weather.ts             # Open-Meteo API wrapper
    departures.ts          # Transport API wrapper
    bank-holidays.ts       # UK bank holidays
    cost-calculator.ts     # Railcard savings maths
  types/
    schedule.ts            # Schedule data model (shared between TTC-006, TTC-007)
    location.ts            # Location/address types
    bike-share.ts          # Bike-share station types
    weather.ts             # Weather types
    departures.ts          # Train departure types
    budget.ts              # Cost tracking types
    term-dates.ts          # Term calendar types
```

---

## Data models

### Location
```typescript
interface Location {
  postcode: string;
  address: string;        // Human-readable resolved address
  lat: number;
  lng: number;
  label?: string;         // User-defined label (e.g. "College", "Work")
  source: 'manual' | 'geolocation' | 'places';
}
```

### Schedule Entry
```typescript
interface ScheduleEntry {
  dayOfWeek: string;      // "Monday", "Tuesday", etc.
  startTime: string;      // "09:00" (24h)
  endTime: string;        // "10:30" (24h)
  subject: string;        // Class/event name
  location: string | null; // Room/building if known
  confidence: 'high' | 'low'; // LLM confidence in extraction
}
```

### Bike Share Station
```typescript
interface BikeShareStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  provider: string;       // "santander", "lime", etc.
  bikesAvailable: number;
  docksAvailable: number | null; // null for dockless
  lastUpdated: string;    // ISO timestamp
}
```

### Weather Forecast
```typescript
interface WeatherForecast {
  temperature: number;      // Celsius
  precipitationProbability: number;  // 0–100
  windSpeed: number;        // km/h
  weatherCode: number;      // WMO code
  time: string;             // ISO timestamp
  cyclingAdvice: 'good' | 'caution' | 'avoid';
}
```

### Train Departure
```typescript
interface TrainDeparture {
  scheduledTime: string;    // "08:15"
  expectedTime: string;     // "08:20" (or "On time")
  destination: string;      // "London Liverpool Street"
  platform: string | null;  // "2" or null if TBD
  operator: string;         // "Greater Anglia"
  status: 'on_time' | 'delayed' | 'cancelled';
  delayMinutes: number;     // 0 if on time
}
```

### Journey Cost
```typescript
interface JourneyCost {
  date: string;             // ISO date
  fullPrice: number;        // Pence (no floating point)
  railcardPrice: number;    // Pence after 1/3 discount (16-25 Railcard)
  saved: number;            // Difference in pence
  journeyType: 'single' | 'return' | 'season';
}
```

### Term Date
```typescript
interface TermDate {
  name: string;             // "Autumn Term"
  startDate: string;        // ISO date
  endDate: string;          // ISO date
  halfTermStart?: string;   // ISO date
  halfTermEnd?: string;     // ISO date
}
```

---

## Testing approach

- **Unit tests** for utility functions (postcode validation, geocoding response parsing)
- **Component tests** for form inputs and display components
- **Integration tests** for API routes (mock external APIs)
- **Manual testing** via `npm run dev` for visual and interaction verification

Use whatever test framework is already in the project. If none exists, use Vitest (fast, Vite-native).

---

## After completing a phase

1. Update `prd.json`:
   - Set the phase's `status` to `completed`
   - Verify all phase requirements are `completed`
   - Update `currentState`
2. Run all tests
3. Commit with message: `milestone: Complete Phase N - {phase name}`
4. Deploy to Vercel: run `vercel --prod` from the terminal

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Google Maps not loading | Check API key is set in `.env.local`; check browser console for errors; verify domain restrictions in GCP console |
| LLM returning unstructured output | Strengthen the system prompt; use structured output mode if available; add JSON schema to the prompt |
| Perplexity returning irrelevant results | Refine the system prompt; add "UK train operators" context; test queries manually first |
| Geolocation not working | Must be on HTTPS (Vercel handles this); check browser permissions; test on mobile |
| CORS errors on API calls | Move the call to a server-side API route instead of calling from the browser |
| Weather data stale | Check Open-Meteo status; verify coordinates are correct; cache may be serving old data |
| Departure board empty | Check station code is correct; Transport API free tier may be exhausted |
| Geofence not triggering | Requires HTTPS + location permission; check browser support (iOS/Android compatibility) |
| Bank holidays wrong | API defaults to England & Wales; check region parameter in API call |
