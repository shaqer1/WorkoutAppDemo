# 💪 Demo's 10-Week Comeback Workout App
## Google Apps Script Setup Guide

---

## WHAT THIS IS
A full workout app that lives in your Google Sheets and runs as a mobile web app on your phone. Features:
- 10-week progressive plan built from your trainer's cycles
- 3 workouts/week (Upper Body, Lower Body, Full Body)
- Warmup, Strength, and Cool-down sections every session
- YouTube video links for every exercise
- Set/rep/weight logging with editable inputs
- Pre & post-workout nutrition macros
- Progress tracking with energy level logging
- Backend data in Google Sheets for reviewing history

---

## SETUP STEPS (Takes ~5 minutes)

### 1. Create a New Google Spreadsheet
- Go to sheets.google.com
- Click "Blank" to create a new sheet
- Name it: "Demo Workout App"

### 2. Open Apps Script Editor
- In your sheet, click **Extensions → Apps Script**
- This opens the script editor

### 3. Add the Code Files

**File 1: Code.gs**
- The editor opens with a default "Code.gs" file
- **Delete all existing code** in Code.gs
- Copy ALL content from Code.gs file you received
- Paste it into the editor
- In `Code.gs`, replace the `EXERCISEDB_API_KEY` value with your own RapidAPI key from the free EDB plan: https://rapidapi.com/ascendapi/api/edb-with-videos-and-images-by-ascendapi/
- In `Code.gs`, update `openApp()` and replace `const url = "INSERT DEPLOYED URL HERE";` with your deployed Web App URL

**File 2: Index.html**
- Click the **"+"** button next to "Files" in the left sidebar
- Select **"HTML"**
- Name it exactly: `Index` (no .html extension, the editor adds it)
- **Delete all default content**
- Copy ALL content from Index.html file you received
- Paste it

### 4. Save Everything
- Click the floppy disk icon (💾) or Ctrl+S / Cmd+S
- Make sure both files are saved

### 5. Deploy as Web App
- Click the **"Deploy"** button (top right)
- Select **"New deployment"**
- Click the gear ⚙️ icon next to "Type"
- Select **"Web app"**
- Configure:
  - **Description:** Demo Workout App
  - **Execute as:** Me
  - **Who has access:** Only myself (or "Anyone" if you want it accessible without login)
- Click **"Deploy"**
- **Copy the Web App URL** — this is your app link!

### 6. Initialize the App
- In your Google Sheet, click **"Workout App" menu → Initialize / Reset App**
- This creates all the sheets and populates your 10-week workout plan
- Wait ~10-15 seconds for it to finish

### 7. Open on Your Phone
- Bookmark the Web App URL on your phone
- Add to Home Screen for an app-like experience:
  - **iPhone Safari:** Share → "Add to Home Screen"
  - **Android Chrome:** Three dots → "Add to Home Screen"

---

## HOW TO USE

### Workout Tab
1. Use **W1 / W2... buttons** in the top right to navigate weeks
2. Tap a **day card** (Upper Body, Lower Body, Full Body)
3. The full workout loads with:
   - Warm-up exercises
   - Strength sets with input fields
   - Cool-down stretches
4. For each set, enter your **actual reps** and **weight used**
5. Tap **✓** to mark a set complete (auto-logs to sheet)
6. Tap **"Mark Complete"** on each exercise when done
7. Tap **"Finish Workout"** to log the session with energy level + notes

### Nutrition Tab
- Shows pre-workout and post-workout meal macros
- Calibrated for your goal: **skinny → muscular, need surplus calories**
- Daily targets: ~2400-2600 cal, ~155-160g protein
- Includes meal ideas for each session type

### Progress Tab
- Total sessions completed
- Current week tracker
- All previous workout history with energy ratings

---

## YOUR 10-WEEK PLAN OVERVIEW

| Phase | Weeks | Focus |
|-------|-------|-------|
| 🌱 Reintroduction | 1-2 | Light weights, form focus, get the body moving again |
| 📈 Building | 3-5 | Based on your Cycle 2 — add weight each week |
| 💪 Strength | 6-8 | Based on Cycles 4 — heavier loads, compound focus |
| 🔥 Peak | 9-10 | Based on Cycles 5+6 — intensity, 5x5 and near-max work |

### Workout Days Per Week (3-4x)
- **Day 1:** Upper Body A (Bench, Rows, Arms)
- **Day 2:** Lower Body A (Squats, Deadlifts, Leg work)  
- **Day 3:** Full Body OR Upper Body B (varies by phase)

---

## UPDATING YOUR DATA

Your spreadsheet has these tabs:
- **WorkoutPlan** — The 10-week exercise database
- **WorkoutLog** — Every set you log (date, exercise, reps, weight)
- **Progress** — Every completed session with energy + notes
- **Config** — App settings (current week, start date)

You can:
- Edit weights in WorkoutPlan for future sessions
- View all your logged sets in WorkoutLog
- Track progress trends in Progress tab

---

## SCREENSHOTS

### Workout App UI
<img src="screenshots/2026-04-05%2019_49_51-Demo%20Workout%20App.png" alt="Workout App Screenshot 1" width="300" />
<img src="screenshots/2026-04-05%2019_50_10-Demo%20Workout%20App.png" alt="Workout App Screenshot 2" width="300" />
<img src="screenshots/2026-04-05%2019_50_35-Demo%20Workout%20App.png" alt="Workout App Screenshot 3" width="300" />
<img src="screenshots/2026-04-05%2019_50_52-Demo%20Workout%20App.png" alt="Workout App Screenshot 4" width="300" />
<img src="screenshots/2026-04-05%2019_51_06-Demo%20Workout%20App.png" alt="Workout App Screenshot 5" width="300" />
<img src="screenshots/2026-04-05%2019_51_49-Demo%20Workout%20App.png" alt="Workout App Screenshot 6" width="300" />
<img src="screenshots/2026-04-05%2019_52_40-Demo%20Workout%20App.png" alt="Workout App Screenshot 7" width="300" />
<img src="screenshots/2026-04-05%2019_53_03-Demo%20Workout%20App.png" alt="Workout App Screenshot 8" width="300" />
<img src="screenshots/2026-04-05%2019_53_20-Demo%20Workout%20App.png" alt="Workout App Screenshot 9" width="300" />
<img src="screenshots/2026-04-05%2019_53_40-Demo%20Workout%20App.png" alt="Workout App Screenshot 10" width="300" />
<img src="screenshots/2026-04-05%2019_54_15-Demo%20Workout%20App.png" alt="Workout App Screenshot 11" width="300" />
<img src="screenshots/2026-04-05%2019_55_37-Demo%20Workout%20App.png" alt="Workout App Screenshot 12" width="300" />

---

## TROUBLESHOOTING

**"Please initialize the app first"**
→ Go to your sheet → Workout App menu → Initialize / Reset App
**Workout not loading**
→ Make sure you're logged into Google with the same account

**Changes not saving**
→ Check that the script has permission to access Sheets. First run may prompt authorization — click "Review permissions" and allow.

**Want to reset week back to 1**
→ In Config sheet, change the "current_week" value to 1

---

## NOTES ON YOUR PLAN

Your trainer built excellent fundamentals across 6 cycles. This app:
- Starts you lighter (Weeks 1-2) to ease back in safely
- Uses the exact exercises from your existing cycles
- Adds new variety (DB Pullover, Landmine, KB Clean & Jerk, etc.)
- Includes YouTube links for everything — no guessing on form
- Right foot turning out noted — check the warm-up hip/ankle exercises each session


