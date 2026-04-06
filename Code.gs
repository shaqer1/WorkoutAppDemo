// ==========================================
// Demo'S 10-WEEK COMEBACK WORKOUT APP
// Google Apps Script - Backend + Web App
// ==========================================

const SHEET_NAME_LOG = "WorkoutLog";
const SHEET_NAME_PLAN = "WorkoutPlan";
const SHEET_NAME_PROGRESS = "Progress";
const SHEET_NAME_CONFIG = "Config";
const SHEET_NAME_EXERCISE_CACHE = "ExerciseCache";

// ExerciseDB API Configuration
const EXERCISEDB_API_HOST = "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com";
const EXERCISEDB_API_KEY = "EXERCISEDB_API_KEY";
const EXERCISE_ID_COLUMN = "Exercise_ID";
const EXERCISE_SEARCH_RESULTS_COLUMN = "Exercise_Search_Results_JSON";
const RELATED_EXERCISE_IDS_COLUMN = "Related_Exercise_Ids_JSON";

// ==========================================
// WEB APP ENTRY POINT
// ==========================================

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle("Demo's Workout App")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==========================================
// INITIALIZATION
// ==========================================

function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create sheets if they don't exist
  ['WorkoutPlan', 'WorkoutLog', 'Progress', 'Config', SHEET_NAME_EXERCISE_CACHE].forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });
  
  const planSheet = ss.getSheetByName(SHEET_NAME_PLAN);
  const hasExistingPlan = planSheet && planSheet.getLastRow() > 1;

  if (!hasExistingPlan) {
    setupWorkoutPlan();
  } else {
    ensureWorkoutPlanMetadataColumns_(planSheet);
    populateExerciseMetadataForMissingRows(planSheet);
  }
  setupConfig();
  setupProgressSheet();
  setupLogSheet();
  setupExerciseCacheSheet();
  
  return {
    success: true,
    message: hasExistingPlan
      ? "Spreadsheet initialized. Existing workout plan preserved and missing exercise metadata backfilled."
      : "Spreadsheet initialized with workout plan!"
  };
}

function setupLogSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_LOG);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date', 'Week', 'Day', 'Exercise', 'Set', 'Planned_Reps', 'Actual_Reps', 'Weight_lbs', 'Notes', 'Timestamp']);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');
  }
}

function setupProgressSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_PROGRESS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date', 'Week', 'Day_Name', 'Completed', 'Total_Exercises', 'Notes', 'Energy_Level', 'Timestamp']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');
  }
}

function setupConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_CONFIG);
  sheet.clearContents();
  sheet.appendRow(['Key', 'Value']);
  sheet.appendRow(['start_date', new Date().toISOString().split('T')[0]]);
  sheet.appendRow(['current_week', 1]);
  sheet.appendRow(['name', 'Demo']);
  sheet.appendRow(['weight_lbs', 199]);
  sheet.appendRow(['height', "6'10\""]);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
}

function setupExerciseCacheSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_EXERCISE_CACHE);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Exercise_ID', 'Name', 'JSON', 'Image_URL', 'Video_URL', 'Updated_At']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');
  }
}

// ==========================================
// WORKOUT PLAN DATA
// ==========================================

function setupWorkoutPlan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_PLAN);
  sheet.clearContents();
  
  const headers = ['Week', 'Day', 'Phase', 'Section', 'Order', 'Exercise', 'Sets', 'Reps', 'Weight', 'Tempo', 'Rest', 'Video_URL', EXERCISE_ID_COLUMN, EXERCISE_SEARCH_RESULTS_COLUMN, RELATED_EXERCISE_IDS_COLUMN, 'Notes', 'Category'];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');
  
  const plan = getFullWorkoutPlan();
  const planRows = plan.map(row => [
    row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11], '', '', '', row[12], row[13]
  ]);

  if (planRows.length > 0) {
    sheet.getRange(2, 1, planRows.length, headers.length).setValues(planRows);
    setupExerciseCacheSheet();
    populateExerciseMetadataForMissingRows(sheet);
  }
}

function getFullWorkoutPlan() {
  // 10-week plan: Weeks 1-2 ease back in, Weeks 3-10 progressive
  // Format: [week, day, phase, section, order, exercise, sets, reps, weight, tempo, rest, video_url, notes, category]
  
  const rows = [];
  
  // WEEKS 1-2: REINTRODUCTION (3x/week, lighter)
  // Upper Body A
  for (let w = 1; w <= 2; w++) {
    const mult = w === 1 ? 0 : 1;
    
    // Day 1: Upper Body A
    addExercises(rows, w, "Day 1 - Upper Body A", "Warm-Up", [
      [1, "Overhead Pull Aparts", "1", "12", "Light band", "Controlled", "", "https://www.youtube.com/watch?v=BDWHTHHOLnk", "Keep arms straight, squeeze shoulder blades", "warmup"],
      [2, "Banded Wall Slides", "1", "12", "Light band", "Controlled", "", "https://www.youtube.com/watch?v=6nMKKl8LpAs", "Keep elbows on wall the whole time", "warmup"],
      [3, "Serratus Pulldown", "1", "12", "BW", "Controlled", "", "https://www.youtube.com/watch?v=Gn6RLTxj6_o", "Focus on serratus activation", "warmup"],
      [4, "90/90 Hip Stretch", "1", "45s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=iR2eaHcZKXU", "Great for hip mobility", "warmup"],
    ]);
    addExercises(rows, w, "Day 1 - Upper Body A", "Strength", [
      [1, "A1. Bench Press", "3", w===1?"8":"10", w===1?"45 lbs":"55 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=rT7DgCr-3pg", "Start light! Focus on form", "push"],
      [2, "A2. Face Pulls", "3", w===1?"8":"10", "Light band", "Controlled", "90s", "https://www.youtube.com/watch?v=eIq5CB9JfKE", "Elbows high, pull to forehead", "pull"],
      [3, "B1. Neutral Grip DB Press", "3", w===1?"8":"10", w===1?"10 lbs":"12.5 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=3XWFRijFuQM", "Palms facing each other", "push"],
      [4, "B2. Single Arm Bent Over Row", "3", w===1?"8":"10", w===1?"10 lbs":"12.5 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=FWJR5Ve8bnQ", "Elbow back and up", "pull"],
      [5, "C1. Zottman Curls", "3", w===1?"8":"10", w===1?"10 lbs":"12.5 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=ZrTqiRXUYJo", "Curl up with supinated grip, lower with pronated", "arms"],
      [6, "C2. Overhead Tricep Extension", "3", w===1?"8":"10", w===1?"10 lbs":"12.5 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q", "Keep elbows close to head", "arms"],
      [7, "D1. Pallof Press Isohold", "3", "30s", "Light band", "Hold", "60s", "https://www.youtube.com/watch?v=AH_QZLm_0-s", "Don't rotate - resist rotation!", "core"],
    ]);
    addExercises(rows, w, "Day 1 - Upper Body A", "Cool-Down", [
      [1, "Doorway Chest Stretch", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=4yKqsJ9u3-0", "Feel the stretch across chest", "stretch"],
      [2, "Lat Stretch w/ Band", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=fG8ey8TpGxY", "Pull arm overhead gently", "stretch"],
      [3, "Child's Pose", "1", "60s", "BW", "Hold", "", "https://www.youtube.com/watch?v=2MJGg-dUKh0", "Breathe deeply, relax", "stretch"],
    ]);
    
    // Day 2: Lower Body A
    addExercises(rows, w, "Day 2 - Lower Body A", "Warm-Up", [
      [1, "Glute Bridge", "1", "12", "Heavy band", "Controlled", "", "https://www.youtube.com/watch?v=wPM8icPu6H8", "Drive through heels", "warmup"],
      [2, "Clamshells", "1", "12/side", "Medium band", "Controlled", "", "https://www.youtube.com/watch?v=SrkBXlT4m3E", "Keep feet stacked", "warmup"],
      [3, "Banded Squats", "1", "12", "Medium band", "Controlled", "", "https://www.youtube.com/watch?v=aclHkVaku9U", "Push knees out against band", "warmup"],
      [4, "Monster Walks", "1", "15/direction", "Medium band", "Controlled", "", "https://www.youtube.com/watch?v=jMaXp7GqNTw", "Band around ankles, all directions", "warmup"],
    ]);
    addExercises(rows, w, "Day 2 - Lower Body A", "Strength", [
      [1, "A1. Goblet Squat", "3", w===1?"8":"10", w===1?"15 lbs":"20 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=MeIiIdhvXT4", "Easier intro to squatting for comeback", "legs"],
      [2, "B1. Bulgarian Split Squat", "3", w===1?"8":"10", "BW", "Controlled", "90s", "https://www.youtube.com/watch?v=2C-uNgKwPLE", "BW only for now - get the form right", "legs"],
      [3, "B2. Romanian Deadlift", "3", w===1?"8":"10", w===1?"15 lbs":"20 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=_oyxQjyyj-s", "Hip hinge, soft knees", "legs"],
      [4, "C1. Lateral Step Up", "3", w===1?"8":"10", "BW", "Controlled", "60s", "https://www.youtube.com/watch?v=WCFCdxzFBa4", "Control the lowering phase", "legs"],
      [5, "C2. Copenhagen Plank", "3", "20s", "BW", "Hold", "60s", "https://www.youtube.com/watch?v=z3MIxMi5tQ4", "Hips level, squeeze inner thigh", "core"],
    ]);
    addExercises(rows, w, "Day 2 - Lower Body A", "Cool-Down", [
      [1, "Pigeon Stretch", "1", "45s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=E7LWhiwUsDg", "Great hip flexor + glute stretch", "stretch"],
      [2, "Standing Quad Stretch", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=JNblc3n0pNk", "Stand tall", "stretch"],
      [3, "Seated Hamstring Stretch", "1", "45s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=Aw5LpMBWLO0", "Hinge at hips not waist", "stretch"],
    ]);
    
    // Day 3: Full Body
    addExercises(rows, w, "Day 3 - Full Body", "Warm-Up", [
      [1, "Walking Lunge", "1", "12", "BW", "Controlled", "", "https://www.youtube.com/watch?v=L8fvypPrzzs", "Big step, drop the knee", "warmup"],
      [2, "Banded Crab Walk", "1", "12/direction", "Medium band", "Controlled", "", "https://www.youtube.com/watch?v=aF33WCPtGQA", "Band at wrists and ankles", "warmup"],
      [3, "Shoulder External Rotation", "1", "12", "Medium band", "Controlled", "", "https://www.youtube.com/watch?v=t2T7-u-EfJg", "Elbow at 90°, rotate out", "warmup"],
    ]);
    addExercises(rows, w, "Day 3 - Full Body", "Strength", [
      [1, "A1. Trap Bar Deadlift", "3", w===1?"6":"8", w===1?"45 lbs":"65 lbs", "Controlled", "2min", "https://www.youtube.com/watch?v=sqeicLCOZhE", "More beginner friendly than conventional", "legs"],
      [2, "A2. Seated Shoulder Press", "3", w===1?"8":"10", w===1?"10 lbs x2":"12.5 lbs x2", "Controlled", "90s", "https://www.youtube.com/watch?v=qEwKCR5JCog", "Sit tall, press straight up", "push"],
      [3, "B1. DB Split Squats", "3", w===1?"8":"10", "BW", "Controlled", "90s", "https://www.youtube.com/watch?v=2C-uNgKwPLE", "Front foot flat, step wide", "legs"],
      [4, "B2. Eccentric Pull Up", "3", w===1?"5":"6", "BW", "5s down", "2min", "https://www.youtube.com/watch?v=kRrKkjHMpBQ", "Jump up, lower S-L-O-W-L-Y", "pull"],
      [5, "C1. Glute Ham Raise", "3", w===1?"6":"8", "BW", "Controlled", "90s", "https://www.youtube.com/watch?v=q5xh4OP1Y9Y", "Lower with control, don't collapse", "legs"],
      [6, "C2. Wide Grip Lat Pulldown", "3", w===1?"8":"10", w===1?"20 lbs":"25 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=CAwf7n6Luuc", "Squeeze shoulder blades down", "pull"],
      [7, "D1. Single Leg Hip Thrust", "3", w===1?"8":"10", "BW", "Controlled", "60s", "https://www.youtube.com/watch?v=Z9LkHZrd_z8", "Drive heel into ground", "legs"],
    ]);
    addExercises(rows, w, "Day 3 - Full Body", "Cool-Down", [
      [1, "Hip Flexor Lunge Stretch", "1", "45s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=YQmpR9niDmU", "Posterior pelvic tilt for better stretch", "stretch"],
      [2, "Thread the Needle", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=3bFmiyJNkLg", "Upper back rotation stretch", "stretch"],
      [3, "Foam Roll Thoracic Spine", "1", "60s", "BW", "Hold", "", "https://www.youtube.com/watch?v=1pQHtAHj3iU", "Hips up, roll upper back", "stretch"],
    ]);
  }
  
  // WEEKS 3-5: CYCLE 2 INSPIRED - Building Phase
  for (let w = 3; w <= 5; w++) {
    const diff = w - 3; // 0, 1, 2
    
    addExercises(rows, w, "Day 1 - Upper Body A", "Warm-Up", [
      [1, "Scapular Push Ups", "1", "12", "BW", "Controlled", "", "https://www.youtube.com/watch?v=SHhP01P7AhA", "Don't bend elbows, just shoulder blades", "warmup"],
      [2, "Y Raise", "1", "12", "BW or 2 lbs", "Controlled", "", "https://www.youtube.com/watch?v=x2K7OL8LU-4", "Squeeze at top, lower slow", "warmup"],
      [3, "Shoulder Extension Isohold", "1", "12", "Light band", "Controlled", "", "https://www.youtube.com/watch?v=q5xh4OP1Y9Y", "Band behind back, hold", "warmup"],
      [4, "Wrist Circles", "1", "30s", "BW", "Controlled", "", "https://www.youtube.com/watch?v=a_e4B_BXQII", "Both directions", "warmup"],
    ]);
    addExercises(rows, w, "Day 1 - Upper Body A", "Strength", [
      [1, "A1. Bench Press", "4", w===3?"5":w===4?"5":"5", w===3?"65 lbs":w===4?"70 lbs":"75 lbs", "Controlled", "2min", "https://www.youtube.com/watch?v=rT7DgCr-3pg", "Progressive weight each week", "push"],
      [2, "A2. Pendlay Row", "4", "8", w===3?"15 lbs x2":w===4?"17.5 lbs x2":"20 lbs x2", "Explosive up, controlled down", "90s", "https://www.youtube.com/watch?v=VXTNkrqELHo", "Pull from dead stop each rep", "pull"],
      [3, "B1. Renegade Row", "3", "8", w===3?"15 lbs x2":w===4?"17.5 lbs x2":"20 lbs x2", "Controlled", "90s", "https://www.youtube.com/watch?v=EJPSA8I0sO8", "Hips steady, no rotation", "pull"],
      [4, "B2. Tricep Dips on Bench", "3", w===3?"8":w===4?"10":"12", "BW", "Controlled", "90s", "https://www.youtube.com/watch?v=2z8JmcrW-As", "Elbows back, lower deep", "arms"],
      [5, "C1. Reverse Grip Bicep Curl", "3", "8", w===3?"12.5 lbs x2":w===4?"15 lbs x2":"17.5 lbs x2", "Controlled", "60s", "https://www.youtube.com/watch?v=4p_N_0xJ8pE", "Palms face down", "arms"],
      [6, "C2. Landmine Shoulder Press", "3", "10", w===3?"Bar only":w===4?"Bar + 5 lbs":"Bar + 7.5 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=_uxB0C_2aeU", "Kneel for stability", "push"],
      [7, "D1. Landmine Twist", "3", "10/side", w===3?"Bar only":w===4?"Bar + 5 lbs":"Bar + 7.5 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=hXLhKkR1Mco", "Rotate from core, not arms", "core"],
    ]);
    addExercises(rows, w, "Day 1 - Upper Body A", "Cool-Down", [
      [1, "Banded Shoulder Internal/External Rotation", "1", "20 each", "Light band", "Controlled", "", "https://www.youtube.com/watch?v=t2T7-u-EfJg", "Elbow tucked", "stretch"],
      [2, "Cross-Body Shoulder Stretch", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=m3AqMFBDRps", "Keep elbow level", "stretch"],
      [3, "Wrist Extensor Stretch", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=mSZWSQSSEjE", "Arm straight, pull fingers back", "stretch"],
    ]);
    
    addExercises(rows, w, "Day 2 - Lower Body A", "Warm-Up", [
      [1, "Single Leg Glute Bridge", "1", "12/side", "BW", "Controlled", "", "https://www.youtube.com/watch?v=wPM8icPu6H8", "Drive through heel", "warmup"],
      [2, "Jump Squats", "1", "12", "BW", "Explosive", "", "https://www.youtube.com/watch?v=A-cFYWvaHr0", "Land soft, control the landing", "warmup"],
      [3, "Banded Jane Fonda", "1", "12/side", "Medium band", "Controlled", "", "https://www.youtube.com/watch?v=SrkBXlT4m3E", "Lying on side, lift leg", "warmup"],
      [4, "Monster Walks", "1", "12/direction", "Medium band", "Controlled", "", "https://www.youtube.com/watch?v=jMaXp7GqNTw", "Band around ankles", "warmup"],
    ]);
    addExercises(rows, w, "Day 2 - Lower Body A", "Strength", [
      [1, "A1. DB Front Squat (Knees Banded)", "4", "5", w===3?"20 lbs x2":w===4?"25 lbs x2":"27.5 lbs x2", "Controlled", "2min", "https://www.youtube.com/watch?v=iGIQd50TBaQ", "Knees push against band", "legs"],
      [2, "B1. Single Leg Bench Squat", "3", w===3?"8":w===4?"8":"10", "BW", "Controlled", "90s", "https://www.youtube.com/watch?v=5mWOHJXGq8g", "20-18 inch box", "legs"],
      [3, "B2. Exercise Ball Hamstring Roll-Ins", "3", w===3?"8":w===4?"10":"12", "BW", "Controlled", "90s", "https://www.youtube.com/watch?v=Hq5dHaEiD14", "Hips up throughout", "legs"],
      [4, "C1. Peterson Step Up", "3", "12", w===3?"BW":w===4?"12.5 lbs":"15 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=Cn-tgqMFD0w", "Heels hang off edge", "legs"],
      [5, "C2. KB Sumo Squat", "3", w===3?"8":w===4?"10":"8", w===3?"20 lbs KB":w===4?"25 lbs KB":"30 lbs KB", "Controlled", "60s", "https://www.youtube.com/watch?v=MeIiIdhvXT4", "Wide stance, toes out", "legs"],
      [6, "D1. Half Kneeling Cable Chop", "3", "10/side", w===3?"7.5 lbs":w===4?"7.5 lbs":"10 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=tg2jALHOkEs", "Rotate through core", "core"],
    ]);
    addExercises(rows, w, "Day 2 - Lower Body A", "Cool-Down", [
      [1, "Couch Stretch", "1", "45s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=oqrJknhaFhU", "Intense hip flexor stretch", "stretch"],
      [2, "Lateral Band Walk Stretch", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=E7LWhiwUsDg", "Adductor stretch", "stretch"],
      [3, "Supine Twist", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=WBLCbSBRFjE", "Breathe and let gravity work", "stretch"],
    ]);
    
    addExercises(rows, w, "Day 3 - Full Body", "Warm-Up", [
      [1, "Overhead Pull Apart", "1", "12", "Light band", "Controlled", "", "https://www.youtube.com/watch?v=BDWHNHHOLnk", "Arms straight overhead", "warmup"],
      [2, "Wrist Banded Shoulder Flexion", "1", "12", "Medium band", "Controlled", "", "https://www.youtube.com/watch?v=q5xh4OP1Y9Y", "Against wall", "warmup"],
      [3, "Walking Lunge", "1", "12", "BW", "Controlled", "", "https://www.youtube.com/watch?v=L8fvypPrzzs", "Big steps, control", "warmup"],
    ]);
    addExercises(rows, w, "Day 3 - Full Body", "Strength", [
      [1, "A1. KB Deadlift (Knees Banded)", "4", "5", w===3?"26 lbs x2":w===4?"30 lbs x2":"35 lbs x2", "Controlled", "2min", "https://www.youtube.com/watch?v=sqeicLCOZhE", "Light band around knees", "legs"],
      [2, "A2. Standing Shoulder Press", "4", "7", w===3?"10 lbs x2":w===4?"17.5 lbs x2":"20 lbs x2", "Controlled", "2min", "https://www.youtube.com/watch?v=qEwKCR5JCog", "Press straight overhead", "push"],
      [3, "B1. Overhead Walking Lunge", "3", "16", w===3?"10 lbs":w===4?"15 lbs":"15 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=L8fvypPrzzs", "One DB overhead, walk", "legs"],
      [4, "B2. Eccentric Pull Up", "3", "5", "BW", "5s down", "2min", "https://www.youtube.com/watch?v=kRrKkjHMpBQ", "Slow lower builds strength fast", "pull"],
      [5, "C1. Loaded Hip Thrust", "3", w===3?"8":w===4?"10":"8", w===3?"10 lbs x2":w===4?"15 lbs x2":"20 lbs x2", "Controlled", "90s", "https://www.youtube.com/watch?v=xDmFkJxPzeM", "Shoulders on bench", "legs"],
      [6, "C2. DB Pullover", "3", w===3?"10":w===4?"12":"10", w===3?"15 lbs":w===4?"17.5 lbs":"20 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=GJqNAqnW00Q", "Lats and chest stretch", "pull"],
      [7, "D1. Exercise Ball Around the World", "3", w===3?"30s":w===4?"30s":"45s", "BW", "Controlled", "60s", "https://www.youtube.com/watch?v=Q2IDmS2wFb4", "Slow and controlled circles", "core"],
    ]);
    addExercises(rows, w, "Day 3 - Full Body", "Cool-Down", [
      [1, "Doorway Chest Stretch", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=4yKqsJ9u3-0", "Feel stretch across pec", "stretch"],
      [2, "Figure 4 Stretch", "1", "45s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=A7UzH-4JDZE", "Cross ankle over knee", "stretch"],
      [3, "Cat-Cow", "1", "60s", "BW", "Controlled", "", "https://www.youtube.com/watch?v=kqnua4rHVVA", "Breathe with movement", "stretch"],
    ]);
  }
  
  // WEEKS 6-8: CYCLE 4 INSPIRED - Strength Phase
  for (let w = 6; w <= 8; w++) {
    const diff = w - 6;
    
    addExercises(rows, w, "Day 1 - Upper Body A", "Warm-Up", [
      [1, "T Raise", "1", "12", "BW", "Controlled", "", "https://www.youtube.com/watch?v=x2K7OL8LU-4", "Arms out in T, squeeze shoulder blades", "warmup"],
      [2, "Scapular Push Ups", "1", "12", "BW", "Controlled", "", "https://www.youtube.com/watch?v=SHhP01P7AhA", "Arms locked, just move shoulder blades", "warmup"],
      [3, "Straight Arm Pulldown", "1", "12", "25 lbs", "Controlled", "", "https://www.youtube.com/watch?v=eGo4IYlbE5g", "Cable, lat isolation", "warmup"],
      [4, "Wrist Banded Yoga Block Raises", "1", "12", "Medium band", "Controlled", "", "https://www.youtube.com/watch?v=a_e4B_BXQII", "Wrist stability", "warmup"],
    ]);
    addExercises(rows, w, "Day 1 - Upper Body A", "Strength", [
      [1, "A1. Bench Press", "3", w===6?"6":"4", w===6?"75 lbs":"65-70% 1RM", "Controlled", "2min", "https://www.youtube.com/watch?v=rT7DgCr-3pg", "Week 6=3x6, Week 7=4x4, Week 8=4x4", "push"],
      [2, "B1. BB Bent Over Row", "4", "15", w===6?"Bar+bar":w===7?"40 lbs":"50 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=FWJR5Ve8bnQ", "Hinge 45°, row to belly button", "pull"],
      [3, "B2. Narrow Push Ups", "4", "12", "BW", "Controlled", "90s", "https://www.youtube.com/watch?v=jWxvty2KROs", "Elbows close to body", "push"],
      [4, "C1. Incline Bicep Curl", "3", "12", w===6?"15 lbs":w===7?"15 lbs":"15 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=soxrZlIl35U", "Lay back on incline bench", "arms"],
      [5, "C2. Tricep Pushdown", "3", "15", w===6?"20-25 lbs":w===7?"25 lbs":"25-30 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=2-LAMcpzODU", "Rope or bar attachment", "arms"],
      [6, "D1. Hanging Knees to Chest", "3", "10", "BW", "Controlled", "60s", "https://www.youtube.com/watch?v=hdng3Nm1x_E", "Control the swing", "core"],
    ]);
    addExercises(rows, w, "Day 1 - Upper Body A", "Cool-Down", [
      [1, "Pec Minor Stretch", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=4yKqsJ9u3-0", "Arm in doorframe", "stretch"],
      [2, "Overhead Tricep Stretch", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=m3AqMFBDRps", "Pull elbow gently", "stretch"],
    ]);
    
    addExercises(rows, w, "Day 2 - Lower Body A", "Warm-Up", [
      [1, "Jumping Lunges", "1", "12", "BW", "Explosive", "", "https://www.youtube.com/watch?v=Z9LkHZrd_z8", "Land soft!", "warmup"],
      [2, "Banded Squats", "1", "12", "Heavy band", "Controlled", "", "https://www.youtube.com/watch?v=aclHkVaku9U", "Push knees out", "warmup"],
      [3, "Banded Hip Extension", "1", "12", "Medium band", "Controlled", "", "https://www.youtube.com/watch?v=pPpIMBMuFVg", "On hands and knees", "warmup"],
      [4, "Pike Raises", "1", "12", "BW", "Controlled", "", "https://www.youtube.com/watch?v=GJqNAqnW00Q", "Shoulder stability", "warmup"],
    ]);
    addExercises(rows, w, "Day 2 - Lower Body A", "Strength", [
      [1, "A1. Barbell Back Squat", "3", w===6?"6":"4", w===6?"65-70%":"0.75 1RM", "Controlled", "2min", "https://www.youtube.com/watch?v=ultWZbUMPL8", "Bar on traps, chest up", "legs"],
      [2, "B1. BB Split Squats", "4", "12", w===6?"45 lbs":w===7?"50 lbs":"50-55 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=2C-uNgKwPLE", "Each side!", "legs"],
      [3, "B2. Hamstring Curl", "4", "15", w===6?"45 lbs":w===7?"50 lbs":"55 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=ELOCsoDSmrg", "Machine curl", "legs"],
      [4, "C1. Leg Press", "3", "20", w===6?"20 lbs":w===7?"30 lbs":"40 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=IZxyjW7MPJQ", "Feet shoulder width", "legs"],
      [5, "C2. Cable Pull Through", "3", "15", w===6?"40 lbs":w===7?"45 lbs":"50 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=pPpIMBMuFVg", "Hip hinge, cable between legs", "legs"],
      [6, "D1. Exercise Ball Leg Lifts", "3", "12", "BW", "Controlled", "60s", "https://www.youtube.com/watch?v=Hq5dHaEiD14", "Squeeze ball between feet", "core"],
    ]);
    addExercises(rows, w, "Day 2 - Lower Body A", "Cool-Down", [
      [1, "Pigeon Pose", "1", "60s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=E7LWhiwUsDg", "Breathe into the stretch", "stretch"],
      [2, "Foam Roll Quads", "1", "60s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=zJDgjGJp_5Y", "Roll along entire quad", "stretch"],
      [3, "Standing Hip Circle", "1", "30s/direction", "BW", "Controlled", "", "https://www.youtube.com/watch?v=GJqNAqnW00Q", "Big circles, loose hips", "stretch"],
    ]);
    
    addExercises(rows, w, "Day 3 - Upper Body B", "Warm-Up", [
      [1, "Elbows Tucked Pull Aparts", "1", "12", "Light band", "Controlled", "", "https://www.youtube.com/watch?v=BDWHNHHOLnk", "Elbows in, pull apart", "warmup"],
      [2, "Shoulder External Rotation", "1", "12", "Light band", "Controlled", "", "https://www.youtube.com/watch?v=t2T7-u-EfJg", "Elbow at side", "warmup"],
      [3, "Banded 90° Shoulder Flexion", "1", "12", "25 lbs", "Controlled", "", "https://www.youtube.com/watch?v=q5xh4OP1Y9Y", "Shoulder stability", "warmup"],
    ]);
    addExercises(rows, w, "Day 3 - Upper Body B", "Strength", [
      [1, "A1. DB Shoulder Press", "3", w===6?"6":"4", w===6?"20 lbs x2":"20-22.5 lbs x2", "Controlled", "2min", "https://www.youtube.com/watch?v=qEwKCR5JCog", "Seated or standing", "push"],
      [2, "B1. Landmine Row", "4", "15", w===6?"Bar":"Bar + 10 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=VXTNkrqELHo", "Single arm row", "pull"],
      [3, "B2. Decline Bench Press", "4", "12", w===6?"17.5 lbs x2":w===7?"20 lbs x2":"22.5 lbs x2", "Controlled", "90s", "https://www.youtube.com/watch?v=jWxvty2KROs", "Head lower than hips", "push"],
      [4, "C1. Ring Rows", "3", "12", "BW", "Controlled", "60s", "https://www.youtube.com/watch?v=KwJKPGo8M6I", "Adjust angle for difficulty", "pull"],
      [5, "C2. Straight Arm Pulldown", "3", "15", w===6?"25 lbs":w===7?"30 lbs":"35 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=eGo4IYlbE5g", "Cable, arms straight", "pull"],
      [6, "D1. Exercise Ball Knees to Chest", "3", "10", "BW", "Controlled", "60s", "https://www.youtube.com/watch?v=hdng3Nm1x_E", "Roll ball toward chest", "core"],
    ]);
    addExercises(rows, w, "Day 3 - Upper Body B", "Cool-Down", [
      [1, "Lat Stretch w/ Rack", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=fG8ey8TpGxY", "Hip hinge away from rack", "stretch"],
      [2, "Neck Rolls", "1", "60s", "BW", "Gentle", "", "https://www.youtube.com/watch?v=GJqNAqnW00Q", "Slow and gentle", "stretch"],
    ]);
  }
  
  // WEEKS 9-10: CYCLE 5/6 INSPIRED - Peak Phase
  for (let w = 9; w <= 10; w++) {
    
    addExercises(rows, w, "Day 1 - Upper Body Peak", "Warm-Up", [
      [1, "Overhead Pull Apart", "1", "15", "Light band", "Controlled", "", "https://www.youtube.com/watch?v=BDWHNHHOLnk", "Overhead position", "warmup"],
      [2, "Upside Down KB Press", "1", "15", "Light KB", "Controlled", "", "https://www.youtube.com/watch?v=UkBFDGlFdxc", "Balance KB upside down", "warmup"],
      [3, "SA Scapular Push Up", "1", "15", "BW", "Controlled", "", "https://www.youtube.com/watch?v=SHhP01P7AhA", "One arm on box, move blade", "warmup"],
    ]);
    addExercises(rows, w, "Day 1 - Upper Body Peak", "Strength", [
      [1, "A1. Bench Press", "5", w===9?"5":"2", w===9?"0.75 1RM":"0.85 1RM", "Controlled", "2min", "https://www.youtube.com/watch?v=rT7DgCr-3pg", "Week 9 = 5x5 at 75%, Week 10 = 5x2 at 85%", "push"],
      [2, "B1. Seated Row", "4", "15", "60 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=GZbfZ033f74", "Pull to belly button, squeeze", "pull"],
      [3, "B2. Cable Chest Fly", "4", "12", "7.5-10 lbs x2", "Controlled", "90s", "https://www.youtube.com/watch?v=Iwe6AmxVf7o", "Feel the stretch", "push"],
      [4, "C1. Plate Press-Out", "3", "12", "5-10 lbs", "Controlled", "60s", "https://www.youtube.com/watch?v=WBLCbSBRFjE", "Chest activation", "push"],
      [5, "C2. Chin Ups", "3", "6", "BW", "Controlled", "90s", "https://www.youtube.com/watch?v=brhRXlOhsAM", "Palms face you, full hang to chin", "pull"],
      [6, "D1. Bicep Curl to Overhead Press", "3", "12", "10 lbs x2", "Controlled", "60s", "https://www.youtube.com/watch?v=soxrZlIl35U", "Compound curl + press", "arms"],
      [7, "D2. Skull Crushers", "3", "15", "12-15 lbs x2", "Controlled", "60s", "https://www.youtube.com/watch?v=l3WVM7BNVac", "Lower to forehead slowly", "arms"],
    ]);
    addExercises(rows, w, "Day 1 - Upper Body Peak", "Cool-Down", [
      [1, "Doorway Pec Stretch", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=4yKqsJ9u3-0", "High and low variations", "stretch"],
      [2, "Child's Pose w/ Lat Reach", "1", "60s", "BW", "Hold", "", "https://www.youtube.com/watch?v=2MJGg-dUKh0", "Reach arm to side", "stretch"],
    ]);
    
    addExercises(rows, w, "Day 2 - Lower Body Peak", "Warm-Up", [
      [1, "Broad Jumps", "1", "15", "BW", "Explosive", "", "https://www.youtube.com/watch?v=A-cFYWvaHr0", "Land soft and balanced", "warmup"],
      [2, "Duck Walks", "1", "15", "BW", "Controlled", "", "https://www.youtube.com/watch?v=aclHkVaku9U", "Deep squat position, walk", "warmup"],
      [3, "Banded Glute Bridge", "1", "25", "Heavy band", "Controlled", "", "https://www.youtube.com/watch?v=wPM8icPu6H8", "Band at hip crease", "warmup"],
      [4, "Lateral Lunge", "1", "15/side", "BW", "Controlled", "", "https://www.youtube.com/watch?v=WCFCdxzFBa4", "Push knee out over toes", "warmup"],
    ]);
    addExercises(rows, w, "Day 2 - Lower Body Peak", "Strength", [
      [1, "A1. Barbell Back Squat", "5", w===9?"5":"2", w===9?"0.75 1RM":"0.85 1RM", "Controlled", "2min", "https://www.youtube.com/watch?v=ultWZbUMPL8", "You're getting strong!", "legs"],
      [2, "B1. KB Sumo Deadlift", "4", "15", w===9?"45 lbs KB":"48 lbs KB", "Controlled", "90s", "https://www.youtube.com/watch?v=sqeicLCOZhE", "Wide stance, feet out", "legs"],
      [3, "B2. BB Romanian Deadlift", "4", "10", w===9?"15 lbs x2":"17.5 lbs x2", "2-0-2", "90s", "https://www.youtube.com/watch?v=_oyxQjyyj-s", "Slow and controlled tempo", "legs"],
      [4, "C1. Hamstring Slides", "3", "12", "BW", "Controlled", "60s", "https://www.youtube.com/watch?v=Hq5dHaEiD14", "Sliders or socks on smooth floor", "legs"],
      [5, "C2. DB Curtsy Lunge", "3", "15/side", "12.5 lbs x2", "Controlled", "60s", "https://www.youtube.com/watch?v=Z9LkHZrd_z8", "Step back and across", "legs"],
      [6, "D1. Body Saw Plank", "3", "1 min", "BW", "Controlled", "60s", "https://www.youtube.com/watch?v=Q2IDmS2wFb4", "Forearms on sliders", "core"],
    ]);
    addExercises(rows, w, "Day 2 - Lower Body Peak", "Cool-Down", [
      [1, "Seated Hamstring Stretch", "1", "60s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=Aw5LpMBWLO0", "Sit tall, hinge forward", "stretch"],
      [2, "Hip Flexor Stretch", "1", "45s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=YQmpR9niDmU", "Posterior pelvic tilt", "stretch"],
      [3, "Foam Roll Glutes", "1", "60s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=zJDgjGJp_5Y", "Figure 4 position on foam roller", "stretch"],
    ]);
    
    addExercises(rows, w, "Day 3 - Upper Body Peak B", "Warm-Up", [
      [1, "Beast Hold", "1", "30s", "BW", "Hold", "", "https://www.youtube.com/watch?v=7XRfFCaI8aM", "Knees just above ground", "warmup"],
      [2, "Prone Y Raise", "1", "15", "BW", "Controlled", "", "https://www.youtube.com/watch?v=x2K7OL8LU-4", "Lie face down, raise arms in Y", "warmup"],
      [3, "Arch Hold", "1", "90s", "BW", "Hold", "", "https://www.youtube.com/watch?v=7XRfFCaI8aM", "Face down, lift arms + legs", "warmup"],
    ]);
    addExercises(rows, w, "Day 3 - Upper Body Peak B", "Strength", [
      [1, "A1. Overhead Press", "5", w===9?"5":"2", w===9?"45 lbs":"0.85 1RM", "Controlled", "2min", "https://www.youtube.com/watch?v=qEwKCR5JCog", "Barbell strict press", "push"],
      [2, "B1. Overhead Row Machine", "4", "10", w===9?"45 lbs x2":"55 lbs x2", "Controlled", "90s", "https://www.youtube.com/watch?v=GZbfZ033f74", "Seated cable row", "pull"],
      [3, "B2. KB Clean and Jerk", "4", "12", "17.5 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=UkBFDGlFdxc", "Full power movement", "push"],
      [4, "C1. Incline Bench Press", "3", "12", "65 lbs", "Controlled", "90s", "https://www.youtube.com/watch?v=jWxvty2KROs", "30-45° incline", "push"],
      [5, "C2. KB Bear Row", "3", "15", "22 lbs x2", "Controlled", "60s", "https://www.youtube.com/watch?v=EJPSA8I0sO8", "In bear position, row alternating", "pull"],
      [6, "D1. L Sits", "3", "20s", "BW", "Hold", "60s", "https://www.youtube.com/watch?v=IUZJoSGGBTc", "On parallettes or floor", "core"],
      [7, "D2. Floor Swimmers", "3", "30s", "BW", "Controlled", "60s", "https://www.youtube.com/watch?v=x2K7OL8LU-4", "Opposite arm+leg, like swimming", "core"],
    ]);
    addExercises(rows, w, "Day 3 - Upper Body Peak B", "Cool-Down", [
      [1, "Thread the Needle", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=3bFmiyJNkLg", "Upper back rotation", "stretch"],
      [2, "Supine Spinal Twist", "1", "30s/side", "BW", "Hold", "", "https://www.youtube.com/watch?v=WBLCbSBRFjE", "Knees drop to side", "stretch"],
      [3, "Savasana / Full Body Relax", "1", "2 min", "BW", "Hold", "", "https://www.youtube.com/watch?v=kqnua4rHVVA", "You earned it. Great work!", "stretch"],
    ]);
  }
  
  return rows;
}

function addExercises(rows, week, dayName, section, exercises) {
  exercises.forEach(ex => {
    rows.push([week, dayName, getPhase(week), section, ex[0], ex[1], ex[2], ex[3], ex[4], ex[5], ex[6], ex[7], ex[8], ex[9]]);
  });
}

function getPhase(week) {
  if (week <= 2) return "Phase 1: Reintroduction";
  if (week <= 5) return "Phase 2: Building";
  if (week <= 8) return "Phase 3: Strength";
  return "Phase 4: Peak";
}

// ==========================================
// EXERCISE METADATA POPULATION (Ascend API)
// ==========================================

function ensureWorkoutPlanMetadataColumns_(sheet) {
  const targetSheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PLAN);
  const data = targetSheet.getDataRange().getValues();
  if (data.length === 0) {
    return;
  }

  const headers = data[0].map(h => String(h || ''));
  const inserts = [];

  if (headers.indexOf(EXERCISE_ID_COLUMN) === -1) {
    inserts.push(EXERCISE_ID_COLUMN);
  }
  if (headers.indexOf(EXERCISE_SEARCH_RESULTS_COLUMN) === -1) {
    inserts.push(EXERCISE_SEARCH_RESULTS_COLUMN);
  }
  if (headers.indexOf(RELATED_EXERCISE_IDS_COLUMN) === -1) {
    inserts.push(RELATED_EXERCISE_IDS_COLUMN);
  }

  if (!inserts.length) {
    return;
  }

  for (let i = 0; i < inserts.length; i++) {
    targetSheet.insertColumnAfter(targetSheet.getLastColumn());
    targetSheet.getRange(1, targetSheet.getLastColumn()).setValue(inserts[i]);
  }
}

function populateExerciseMetadataForMissingRows(sheet) {
  const targetSheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PLAN);
  ensureWorkoutPlanMetadataColumns_(targetSheet);
  setupExerciseCacheSheet();

  const data = targetSheet.getDataRange().getValues();
  if (data.length <= 1) {
    Logger.log('No workout data to populate exercise metadata.');
    return;
  }

  const headers = data[0];
  const exerciseIndex = headers.indexOf('Exercise');
  const idIndex = headers.indexOf(EXERCISE_ID_COLUMN);
  const searchResultsIndex = headers.indexOf(EXERCISE_SEARCH_RESULTS_COLUMN);
  const relatedIdsIndex = headers.indexOf(RELATED_EXERCISE_IDS_COLUMN);

  if ([exerciseIndex, idIndex, searchResultsIndex, relatedIdsIndex].includes(-1)) {
    throw new Error('Required workout plan metadata columns are missing.');
  }

  const rowUpdates = [];
  const byNormalizedName = {};

  for (let i = 1; i < data.length; i++) {
    const exerciseName = String(data[i][exerciseIndex] || '').trim();
    if (!exerciseName) continue;

    const existingId = String(data[i][idIndex] || '').trim();
    if (existingId) continue;

    const normalized = normalizeExerciseSearchTerm_(exerciseName);
    if (!normalized) continue;

    if (!byNormalizedName[normalized]) {
      const searchData = searchExercises_(normalized);
      let selectedExerciseId = '';
      let searchResultsPayload = [];
      let relatedIds = [];

      if (searchData && searchData.success && Array.isArray(searchData.data) && searchData.data.length) {
        searchResultsPayload = searchData.data.map(item => ({
          exerciseId: item.exerciseId || '',
          name: item.name || '',
          imageUrl: item.imageUrl || ''
        }));

        selectedExerciseId = searchResultsPayload[0].exerciseId || '';

        if (selectedExerciseId) {
          const details = getExerciseDetailsWithCache_(selectedExerciseId);
          relatedIds = Array.isArray(details.relatedExerciseIds) ? details.relatedExerciseIds : [];
        }
      }

      byNormalizedName[normalized] = {
        selectedExerciseId: selectedExerciseId,
        searchResultsJson: JSON.stringify(searchResultsPayload || []),
        relatedIdsJson: JSON.stringify(relatedIds || [])
      };
    }

    rowUpdates.push({
      rowNumber: i + 1,
      idValue: byNormalizedName[normalized].selectedExerciseId,
      searchValue: byNormalizedName[normalized].searchResultsJson,
      relatedValue: byNormalizedName[normalized].relatedIdsJson
    });
  }

  rowUpdates.forEach(update => {
    targetSheet.getRange(update.rowNumber, idIndex + 1).setValue(update.idValue || '');
    targetSheet.getRange(update.rowNumber, searchResultsIndex + 1).setValue(update.searchValue || '[]');
    targetSheet.getRange(update.rowNumber, relatedIdsIndex + 1).setValue(update.relatedValue || '[]');
  });

  Logger.log('Populated exercise metadata for ' + rowUpdates.length + ' rows with blank Exercise_ID');
}

function normalizeExerciseSearchTerm_(exerciseName) {
  return String(exerciseName || '')
    .replace(/^[A-Za-z]\d+\.\s*/, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getExerciseApiHeaders_() {
  return {
    'Content-Type': 'application/json',
    'x-rapidapi-host': EXERCISEDB_API_HOST,
    'x-rapidapi-key': EXERCISEDB_API_KEY
  };
}

function searchExercises_(searchTerm) {
  if (!searchTerm) {
    return { success: false, data: [], statusCode: 400, message: 'Search term is required.' };
  }

  const url = 'https://' + EXERCISEDB_API_HOST + '/api/v1/exercises/search?search=' + encodeURIComponent(searchTerm);
  const response = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: getExerciseApiHeaders_(),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  if (statusCode !== 200) {
    const isRateLimited = statusCode === 429;
    const message = isRateLimited
      ? 'Rate limit reached (429). RapidAPI plan limits are 1,000 requests/hour and 2,000 requests/month. Please wait and try again later.'
      : 'Search failed with status ' + statusCode;

    Logger.log('Search failed for ' + searchTerm + ' with status ' + statusCode);
    return {
      success: false,
      data: [],
      statusCode: statusCode,
      isRateLimited: isRateLimited,
      message: message
    };
  }

  const parsed = JSON.parse(response.getContentText() || '{}');
  if (parsed && typeof parsed === 'object') {
    return {
      success: !!parsed.success,
      data: Array.isArray(parsed.data) ? parsed.data : [],
      statusCode: 200,
      message: parsed.success ? '' : 'Search API returned no results.'
    };
  }

  return { success: false, data: [], statusCode: 500, message: 'Invalid search response format.' };
}

function searchExercisesForUi(searchTerm) {
  const normalized = normalizeExerciseSearchTerm_(searchTerm);
  if (!normalized) {
    return { success: false, data: [], message: 'Enter an exercise name to search.' };
  }

  const result = searchExercises_(normalized);
  if (!result.success) {
    return {
      success: false,
      data: [],
      message: result.message || 'Search failed.',
      statusCode: result.statusCode || 500,
      isRateLimited: !!result.isRateLimited,
      disclaimer: result.isRateLimited
        ? 'API limits: 1,000 requests/hour and 2,000 requests/month.'
        : ''
    };
  }

  const data = (result.data || []).slice(0, 10).map(item => ({
    exerciseId: item.exerciseId || '',
    name: item.name || '',
    imageUrl: item.imageUrl || ''
  }));

  return {
    success: true,
    data: data,
    message: data.length ? '' : 'No exercises found for that search.'
  };
}

function getExerciseDetailsFromApi_(exerciseId) {
  const url = 'https://' + EXERCISEDB_API_HOST + '/api/v1/exercises/' + encodeURIComponent(exerciseId);
  const response = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: getExerciseApiHeaders_(),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    Logger.log('Exercise details failed for ' + exerciseId + ' with status ' + response.getResponseCode());
    return null;
  }

  const parsed = JSON.parse(response.getContentText() || '{}');
  return parsed && parsed.success && parsed.data ? parsed.data : null;
}

function getExerciseCacheMap_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_EXERCISE_CACHE);
  if (!sheet || sheet.getLastRow() <= 1) {
    return {};
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  const map = {};

  rows.forEach(row => {
    const id = String(row[0] || '').trim();
    const json = String(row[2] || '').trim();
    if (!id || !json) return;
    map[id] = json;
  });

  return map;
}

function parseJsonObject_(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;
  }
}

function decorateSearchResultsWithCachedInfo_(searchResults) {
  const items = Array.isArray(searchResults) ? searchResults : [];
  if (!items.length) return [];

  const cacheMap = getExerciseCacheMap_();
  return items.map(item => {
    const id = String(item.exerciseId || '').trim();
    const cached = id ? parseJsonObject_(cacheMap[id]) : null;
    const equipments = cached && Array.isArray(cached.equipments) ? cached.equipments : [];

    return {
      exerciseId: id,
      name: item.name || '',
      imageUrl: item.imageUrl || '',
      equipments: equipments
    };
  });
}

function getExerciseDetailsWithCache_(exerciseId) {
  if (!exerciseId) return {};

  setupExerciseCacheSheet();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_EXERCISE_CACHE);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim() === exerciseId) {
      const json = String(data[i][2] || '').trim();
      if (json) {
        try {
          return JSON.parse(json);
        } catch (e) {
          break;
        }
      }
    }
  }

  const details = getExerciseDetailsFromApi_(exerciseId);
  if (!details) {
    return {};
  }

  upsertExerciseCache_(exerciseId, details);
  return details;
}

function upsertExerciseCache_(exerciseId, details) {
  if (!exerciseId || !details) {
    return;
  }

  setupExerciseCacheSheet();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_EXERCISE_CACHE);
  const data = sheet.getDataRange().getValues();

  const values = [
    exerciseId,
    details.name || '',
    JSON.stringify(details),
    details.imageUrl || '',
    details.videoUrl || '',
    new Date().toISOString()
  ];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim() === exerciseId) {
      sheet.getRange(i + 1, 1, 1, values.length).setValues([values]);
      return;
    }
  }

  sheet.appendRow(values);
}

// ==========================================
// DATA ACCESS FUNCTIONS (called from frontend)
// ==========================================

function getWorkoutForDay(week, dayName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_PLAN);
  ensureWorkoutPlanMetadataColumns_(sheet);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const exerciseIdIndex = headers.indexOf(EXERCISE_ID_COLUMN);

  const neededIds = new Set();
  if (exerciseIdIndex !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) == String(week) && String(data[i][1]) === String(dayName)) {
        const id = String(data[i][exerciseIdIndex] || '').trim();
        if (id) neededIds.add(id);
      }
    }
  }

  const detailsById = {};
  neededIds.forEach(id => {
    detailsById[id] = getExerciseDetailsWithCache_(id);
  });
  
  const result = { warmup: [], strength: [], cooldown: [], nutrition: null };
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, j) => row[h] = data[i][j]);
    
    if (row.Week == week && row.Day === dayName) {
      const selectedExerciseId = row[EXERCISE_ID_COLUMN] || '';
      const details = selectedExerciseId ? (detailsById[selectedExerciseId] || {}) : {};
      const searchResults = decorateSearchResultsWithCachedInfo_(parseJsonArray_(row[EXERCISE_SEARCH_RESULTS_COLUMN]));
      const ex = {
        order: row.Order,
        section: row.Section,
        exercise: row.Exercise,
        exerciseId: selectedExerciseId,
        exerciseSearchResults: searchResults,
        relatedExerciseIds: parseJsonArray_(row[RELATED_EXERCISE_IDS_COLUMN]),
        sets: row.Sets,
        reps: row.Reps,
        weight: row.Weight,
        tempo: row.Tempo,
        rest: row.Rest,
        video: row.Video_URL,
        imageUrl: details.imageUrl || '',
        detailVideoUrl: details.videoUrl || '',
        overview: details.overview || '',
        instructions: Array.isArray(details.instructions) ? details.instructions : [],
        targetMuscles: Array.isArray(details.targetMuscles) ? details.targetMuscles : [],
        equipments: Array.isArray(details.equipments) ? details.equipments : [],
        exerciseTips: Array.isArray(details.exerciseTips) ? details.exerciseTips : [],
        variations: Array.isArray(details.variations) ? details.variations : [],
        detailName: details.name || '',
        notes: row.Notes,
        category: row.Category
      };
      
      if (row.Section === "Warm-Up") result.warmup.push(ex);
      else if (row.Section === "Strength") result.strength.push(ex);
      else if (row.Section === "Cool-Down") result.cooldown.push(ex);
    }
  }
  
  result.nutrition = getNutritionForDay(dayName);
  result.phase = getPhase(week);
  
  return result;
}

function parseJsonArray_(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function getExerciseDetailsForId(exerciseId) {
  const id = String(exerciseId || '').trim();
  if (!id) {
    return { success: false, message: 'Exercise ID is required.' };
  }

  const details = getExerciseDetailsWithCache_(id);
  if (!details || !details.name) {
    return { success: false, message: 'Exercise details not found.' };
  }

  return {
    success: true,
    data: {
      exerciseId: id,
      name: details.name || '',
      imageUrl: details.imageUrl || '',
      videoUrl: details.videoUrl || '',
      overview: details.overview || '',
      instructions: Array.isArray(details.instructions) ? details.instructions : [],
      relatedExerciseIds: Array.isArray(details.relatedExerciseIds) ? details.relatedExerciseIds : [],
      targetMuscles: Array.isArray(details.targetMuscles) ? details.targetMuscles : [],
      equipments: Array.isArray(details.equipments) ? details.equipments : [],
      exerciseTips: Array.isArray(details.exerciseTips) ? details.exerciseTips : [],
      variations: Array.isArray(details.variations) ? details.variations : []
    }
  };
}

function getNutritionForDay(dayName) {
  // For x
  // ~2400-2600 calories on training days for muscle gain
  
  const isLower = dayName.toLowerCase().includes('lower') || dayName.toLowerCase().includes('full');
  
  if (isLower) {
    return {
      timing: "Pre-Workout (1-2 hrs before)",
      calories: 650,
      protein: 35,
      carbs: 90,
      fat: 15,
      preMeal: "Oats + banana + protein shake or chicken + rice + veggies",
      postMeal: "Rice + chicken thighs + olive oil + spinach (high carb recovery)",
      postCalories: 700,
      postProtein: 45,
      postCarbs: 80,
      postFat: 18,
      dailyTarget: { cal: 2600, protein: 160, carbs: 310, fat: 75 },
      notes: "Leg days burn more. Prioritize carbs pre and post workout for energy + recovery."
    };
  } else {
    return {
      timing: "Pre-Workout (1-2 hrs before)",
      calories: 550,
      protein: 35,
      carbs: 65,
      fat: 15,
      preMeal: "Toast + eggs + OJ, or protein shake + banana + peanut butter",
      postMeal: "Salmon or beef + sweet potato + avocado",
      postCalories: 600,
      postProtein: 45,
      postCarbs: 60,
      postFat: 20,
      dailyTarget: { cal: 2400, protein: 155, carbs: 275, fat: 75 },
      notes: "Upper days: slightly higher protein, moderate carbs. Don't skip breakfast!"
    };
  }
}

function getWeekDays(week) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_PLAN);
  const data = sheet.getDataRange().getValues();
  
  const days = [];
  const seen = new Set();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == week && !seen.has(data[i][1])) {
      seen.add(data[i][1]);
      days.push(data[i][1]);
    }
  }
  
  return days;
}

// ==========================================
// CLONE WORKOUT DAY
// ==========================================

function cloneWorkoutDay(week, sourceDayName, newDayName) {
  try {
    if (!newDayName || !String(newDayName).trim()) {
      return { success: false, message: 'New day name is required.' };
    }
    newDayName = String(newDayName).trim();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_PLAN);
    if (!sheet) return { success: false, message: 'WorkoutPlan sheet not found.' };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const dayIndex = headers.indexOf('Day');
    const weekIndex = headers.indexOf('Week');
    if (dayIndex === -1 || weekIndex === -1) return { success: false, message: 'WorkoutPlan missing Week/Day columns.' };

    // Check new name isn't already taken for this week
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][weekIndex]) === String(week) && String(data[i][dayIndex]) === newDayName) {
        return { success: false, message: 'A day named "' + newDayName + '" already exists in Week ' + week + '.' };
      }
    }

    // Collect rows matching the source day
    const sourceRows = [];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][weekIndex]) == String(week) && String(data[i][dayIndex]) === String(sourceDayName)) {
        sourceRows.push(data[i].slice());
      }
    }

    if (sourceRows.length === 0) {
      return { success: false, message: 'Source day "' + sourceDayName + '" not found in Week ' + week + '.' };
    }

    // Clone each row with the new day name
    sourceRows.forEach(row => {
      row[dayIndex] = newDayName;
      sheet.appendRow(row);
    });

    return { success: true, message: 'Cloned ' + sourceRows.length + ' exercises to "' + newDayName + '".' };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.message };
  }
}

function getWeekWorkoutOverview(week) {
  const days = getWeekDays(week);
  const completedSet = {};

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const progressSheet = ss.getSheetByName(SHEET_NAME_PROGRESS);
  if (progressSheet && progressSheet.getLastRow() > 1) {
    const progressData = progressSheet.getRange(2, 1, progressSheet.getLastRow() - 1, progressSheet.getLastColumn()).getValues();
    const seen = {};

    for (let i = progressData.length - 1; i >= 0; i--) {
      const rowWeek = String(progressData[i][1] || '');
      const rowDay = String(progressData[i][2] || '');
      const completed = progressData[i][3] === true || String(progressData[i][3]).toLowerCase() === 'true';
      if (rowWeek !== String(week) || !rowDay || !completed) continue;
      seen[rowDay] = true;
      completedSet[rowDay] = true;
    }
  }

  // Also mark days completed when WorkoutLog has entries, even if Progress sheet is empty.
  const logSheet = ss.getSheetByName(SHEET_NAME_LOG);
  if (logSheet && logSheet.getLastRow() > 1) {
    const logData = logSheet.getRange(2, 1, logSheet.getLastRow() - 1, logSheet.getLastColumn()).getValues();
    for (let i = 0; i < logData.length; i++) {
      const rowWeek = String(logData[i][1] || '');
      const rowDay = String(logData[i][2] || '');
      if (rowWeek === String(week) && rowDay) {
        completedSet[rowDay] = true;
      }
    }
  }

  const completedDays = Object.keys(completedSet);

  return {
    days: days,
    completedDays: completedDays
  };
}

function normalizeExerciseKey_(name) {
  return String(name || '').replace(/[^a-zA-Z0-9]/g, '_');
}

function getWorkoutLogStateForDay(week, dayName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_NAME_LOG);
  if (!logSheet || logSheet.getLastRow() <= 1) {
    return { setsByExercise: {}, completedExerciseKeys: [] };
  }

  const rows = logSheet.getRange(2, 1, logSheet.getLastRow() - 1, logSheet.getLastColumn()).getValues();
  const setsByExercise = {};

  for (let i = 0; i < rows.length; i++) {
    const rowWeek = String(rows[i][1] || '');
    const rowDay = String(rows[i][2] || '');
    if (rowWeek !== String(week) || rowDay !== String(dayName)) continue;

    const exName = String(rows[i][3] || '').trim();
    const setNum = String(rows[i][4] || '').trim();
    if (!exName || !setNum) continue;

    const key = normalizeExerciseKey_(exName);
    if (!setsByExercise[key]) {
      setsByExercise[key] = {};
    }

    setsByExercise[key][setNum] = {
      plannedReps: rows[i][5] || '',
      actualReps: rows[i][6] || '',
      weight: rows[i][7] || '',
      notes: rows[i][8] || ''
    };
  }
  console.log('Sets by exercise for week ' + week + ' day ' + dayName, setsByExercise);

  return {
    setsByExercise: setsByExercise,
    completedExerciseKeys: Object.keys(setsByExercise)
  };
}

function updateExerciseSelectionForWorkout(week, dayName, exerciseName, section, newExerciseId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_PLAN);
  ensureWorkoutPlanMetadataColumns_(sheet);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { success: false, updatedRows: 0, message: 'Workout plan is empty.' };
  }

  const headers = data[0];
  const weekIndex = headers.indexOf('Week');
  const dayIndex = headers.indexOf('Day');
  const sectionIndex = headers.indexOf('Section');
  const exerciseIndex = headers.indexOf('Exercise');
  const exerciseIdIndex = headers.indexOf(EXERCISE_ID_COLUMN);
  const searchResultsIndex = headers.indexOf(EXERCISE_SEARCH_RESULTS_COLUMN);
  const relatedIdsIndex = headers.indexOf(RELATED_EXERCISE_IDS_COLUMN);

  if ([weekIndex, dayIndex, sectionIndex, exerciseIndex, exerciseIdIndex, searchResultsIndex, relatedIdsIndex].includes(-1)) {
    throw new Error('Required WorkoutPlan columns are missing.');
  }

  const selectedId = String(newExerciseId || '').trim();
  const details = selectedId ? getExerciseDetailsWithCache_(selectedId) : {};
  const relatedIdsJson = JSON.stringify(Array.isArray(details.relatedExerciseIds) ? details.relatedExerciseIds : []);
  const selectedSummary = selectedId ? [{
    exerciseId: selectedId,
    name: details.name || '',
    imageUrl: details.imageUrl || ''
  }] : [];
  const searchJson = JSON.stringify(selectedSummary);

  let updatedRows = 0;
  for (let i = 1; i < data.length; i++) {
    const weekMatch = String(data[i][weekIndex]) === String(week);
    const dayMatch = String(data[i][dayIndex]) === String(dayName);
    const exerciseMatch = String(data[i][exerciseIndex]) === String(exerciseName);
    const sectionMatch = !section || String(data[i][sectionIndex]) === String(section);

    if (weekMatch && dayMatch && exerciseMatch && sectionMatch) {
      sheet.getRange(i + 1, exerciseIdIndex + 1).setValue(selectedId);
      sheet.getRange(i + 1, searchResultsIndex + 1).setValue(searchJson);
      sheet.getRange(i + 1, relatedIdsIndex + 1).setValue(relatedIdsJson);
      if (details.name) {
        sheet.getRange(i + 1, exerciseIndex + 1).setValue(details.name);
      }
      updatedRows++;
    }
  }

  return {
    success: updatedRows > 0,
    updatedRows: updatedRows,
    message: updatedRows > 0 ? 'Exercise selection updated.' : 'No matching exercise row found.'
  };
}

function logSet(date, week, dayName, exercise, setNum, plannedReps, actualReps, weight, notes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_LOG);
  sheet.appendRow([date, week, dayName, exercise, setNum, plannedReps, actualReps, weight, notes, new Date().toISOString()]);
  return { success: true };
}

function logWorkoutComplete(date, week, dayName, totalExercises, notes, energyLevel) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_PROGRESS);
  sheet.appendRow([date, week, dayName, true, totalExercises, notes, energyLevel, new Date().toISOString()]);
  return { success: true };
}

function getCurrentWeek() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = ss.getSheetByName(SHEET_NAME_CONFIG);
  const data = config.getDataRange().getValues();
  for (const row of data) {
    if (row[0] === 'current_week') return parseInt(row[1]) || 1;
  }
  return 1;
}

function setCurrentWeek(week) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = ss.getSheetByName(SHEET_NAME_CONFIG);
  const data = config.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'current_week') {
      config.getRange(i + 1, 2).setValue(week);
      return { success: true };
    }
  }
  return { success: false };
}

function getProgressData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return { totalSessions: 0, totalSets: 0, recent: [] };
    }

    const log = ss.getSheetByName(SHEET_NAME_LOG);
    const progress = ss.getSheetByName(SHEET_NAME_PROGRESS);

    const logData = (log && log.getLastRow() > 1)
      ? log.getRange(2, 1, log.getLastRow() - 1, log.getLastColumn()).getValues()
      : [];
    const progressData = (progress && progress.getLastRow() > 1)
      ? progress.getRange(2, 1, progress.getLastRow() - 1, progress.getLastColumn()).getValues()
      : [];

    // Helper: convert a spreadsheet cell value (Date or string) to a YYYY-MM-DD string
    // Avoids instanceof Date which is unreliable in GAS V8 sandbox for sheet values
    const toDateStr = function(v) {
      if (!v) return '';
      if (typeof v.toISOString === 'function') return v.toISOString().split('T')[0];
      return String(v).split('T')[0].split(' ')[0]; // handles date strings
    };

    const sessionsByKey = {};
    for (let i = 0; i < progressData.length; i++) {
      const r = progressData[i];
      const key = [String(r[0] || ''), String(r[1] || ''), String(r[2] || '')].join('|');
      sessionsByKey[key] = {
        date: toDateStr(r[0]),
        week: String(r[1] || ''),
        day: String(r[2] || ''),
        energy: String(r[6] || ''),
        notes: String(r[5] || ''),
        sets: 0
      };
    }

    const logSessionSets = {};
    for (let i = 0; i < logData.length; i++) {
      const r = logData[i];
      const key = [String(r[0] || ''), String(r[1] || ''), String(r[2] || '')].join('|');
      logSessionSets[key] = (logSessionSets[key] || 0) + 1;
      if (!sessionsByKey[key]) {
        sessionsByKey[key] = {
          date: toDateStr(r[0]),
          week: String(r[1] || ''),
          day: String(r[2] || ''),
          energy: '',
          notes: '',
          sets: 0
        };
      }
    }
    console.log('Sessions by key after combining Progress and Log data:', sessionsByKey);

    Object.keys(logSessionSets).forEach(key => {
      if (sessionsByKey[key]) {
        sessionsByKey[key].sets = logSessionSets[key];
        if (!sessionsByKey[key].notes) {
          sessionsByKey[key].notes = 'Logged sets: ' + logSessionSets[key];
        }
      }
    });

    const allSessions = Object.keys(sessionsByKey).map(key => sessionsByKey[key]);
    // date is already a YYYY-MM-DD string, so lexicographic sort works fine
    allSessions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    console.log('All sessions after merging and sorting:', JSON.stringify(allSessions));

    const totalSessions = allSessions.length;
    const totalSets = logData.length;
    console.log('Total sessions:', totalSessions, 'Total sets:', totalSets);

    // All fields already plain strings/numbers — safe to serialize over google.script.run
    const recent = allSessions.slice(0, 5).map(r => ({
      date: String(r.date || ''),
      week: String(r.week || ''),
      day: String(r.day || ''),
      energy: String(r.energy || ''),
      notes: String(r.notes || '')
    }));

    // Count total unique week+day combinations in the WorkoutPlan to use as denominator
    const plan = ss.getSheetByName(SHEET_NAME_PLAN);
    let totalPlannedDays = 40; // default: 4 days × 10 weeks
    if (plan && plan.getLastRow() > 1) {
      const planData = plan.getRange(2, 1, plan.getLastRow() - 1, 2).getValues();
      const planDayKeys = new Set();
      for (let i = 0; i < planData.length; i++) {
        const wk = String(planData[i][0] || '').trim();
        const dy = String(planData[i][1] || '').trim();
        if (wk && dy) planDayKeys.add(wk + '|' + dy);
      }
      if (planDayKeys.size > 0) totalPlannedDays = planDayKeys.size;
    }

    console.log('Returning to client:', JSON.stringify({ totalSessions: totalSessions, totalSets: totalSets, totalPlannedDays: totalPlannedDays, recent: recent }));
    return { totalSessions: totalSessions, totalSets: totalSets, totalPlannedDays: totalPlannedDays, recent: recent };
  } catch (error) {
    Logger.log('getProgressData error: ' + error);
    return { totalSessions: 0, totalSets: 0, recent: [] };
  }
}

// ==========================================
// MENU SETUP
// ==========================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('💪 Workout App')
    .addItem('Initialize / Reset App', 'initializeSpreadsheet')
    .addItem('Open App', 'openApp')
    .addToUi();
}

function openApp() {
  // const url = ScriptApp.getService().getUrl();
  const url = "INSERT DEPLOYED URL HERE";
  const html = HtmlService.createHtmlOutput(`<script>window.open('${url}');google.script.host.close();</script>`);
  SpreadsheetApp.getUi().showModalDialog(html, 'Opening app...');
}
