/**
 * Yakinori Japanese Challenge: event logger + summary dashboard
 * ------------------------------------------------------------
 * Paste this whole file into Extensions > Apps Script of a new Google Sheet.
 * 1. Run setup() once (it creates the "Events" and "Summary" tabs).
 * 2. Deploy > New deployment > Web app
 *      Execute as: Me      Who has access: Anyone
 * 3. Copy the web-app URL into SETTINGS.logUrl in index.html.
 *
 * No names are collected: each phone gets a random anonymous session id.
 */

const TZ = 'Europe/London';
const COLS = ['received_at','day','hour','session','event','category','attempt','word',
              'correct','seconds','score','win','rating','comment','source','screen','device','client_ts'];
const ALLOWED_EVENTS = ['app_open','start','menu_open','back_click','category_selected','lesson_start',
  'lesson_completed','quiz_start','answer','quiz_abandon','quiz_finish','retry_click','rating','feedback','redeemed'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents || '{}');
    if (ALLOWED_EVENTS.indexOf(d.event) === -1) return out('ignored');
    const now = new Date();
    const clean = v => {                       // stop formula injection + trim long text
      if (v === undefined || v === null) return '';
      if (typeof v === 'number') return v;
      v = String(v).slice(0, 300);
      return /^[=+\-@]/.test(v) ? "'" + v : v;
    };
    const row = {
      received_at: now,
      day: Utilities.formatDate(now, TZ, 'EEE'),
      hour: Number(Utilities.formatDate(now, TZ, 'H')),
      session: d.session, event: d.event, category: d.category, attempt: d.attempt, word: d.word,
      correct: d.correct, seconds: d.seconds, score: d.score, win: d.win, rating: d.rating,
      comment: d.comment, source: d.source, screen: d.screen, device: d.device, client_ts: d.ts
    };
    sheet_('Events').appendRow(COLS.map(c => clean(row[c])));
    return out('ok');
  } catch (err) {
    return out('error');
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return out('Yakinori quiz logger is running'); }

function out(t) { return ContentService.createTextOutput(t); }

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

/** Run once from the Apps Script editor. */
function setup() {
  const ev = sheet_('Events');
  if (ev.getLastRow() === 0) {
    ev.appendRow(COLS);
    ev.setFrozenRows(1);
    ev.getRange(1, 1, 1, COLS.length).setFontWeight('bold').setBackground('#adcc54');
  }

  const s = sheet_('Summary');
  s.clear();
  const E = 'Events!';
  // helper: unique sessions that fired an event
  const uniq = ev => `=IFERROR(COUNTUNIQUE(FILTER(${E}D2:D,${E}E2:E="${ev}")),0)`;

  const rows = [
    ['YAKINORI JAPANESE CHALLENGE: SUMMARY', ''],
    ['', ''],
    ['1. FUNNEL (unique phones)', 'Phones', '% of opened'],
    ['Opened the app',          uniq('app_open'),         '=IFERROR(B4/$B$4,0)'],
    ['Entered name',            uniq('start'),            '=IFERROR(B5/$B$4,0)'],
    ['Picked a group',          uniq('category_selected'),'=IFERROR(B6/$B$4,0)'],
    ['Finished the lesson',     uniq('lesson_completed'), '=IFERROR(B7/$B$4,0)'],
    ['Started the quiz',        uniq('quiz_start'),       '=IFERROR(B8/$B$4,0)'],
    ['Finished the quiz',       uniq('quiz_finish'),      '=IFERROR(B9/$B$4,0)'],
    ['Won',                     `=IFERROR(COUNTUNIQUE(FILTER(${E}D2:D,${E}E2:E="quiz_finish",${E}L2:L=1)),0)`, '=IFERROR(B10/$B$4,0)'],
    ['Reward redeemed',         uniq('redeemed'),         '=IFERROR(B11/$B$4,0)'],
    ['Used 2nd chance',         `=IFERROR(COUNTUNIQUE(FILTER(${E}D2:D,${E}E2:E="quiz_start",${E}G2:G=2)),0)`, '=IFERROR(B12/$B$4,0)'],
    ['Left a quiz halfway',     uniq('quiz_abandon'),     '=IFERROR(B13/$B$4,0)'],
    ['', ''],
    ['2. IS IT FUN?', ''],
    ['Average rating (1 = meh, 3 = loved it)', `=IFERROR(AVERAGE(FILTER(${E}M2:M,${E}E2:E="rating")),"")`],
    ['Number of ratings', `=COUNTIF(${E}E2:E,"rating")`],
    ['% "Loved it"', `=IFERROR(COUNTIFS(${E}E2:E,"rating",${E}M2:M,3)/B17,0)`],
    ['Avg lesson time (seconds)', `=IFERROR(AVERAGE(FILTER(${E}J2:J,${E}E2:E="lesson_completed")),"")`],
  ];
  s.getRange(1, 1, rows.length, 3).setValues(rows.map(r => [r[0], r[1] || '', r[2] || '']));
  s.getRange('C4:C13').setNumberFormat('0%');
  s.getRange('B18').setNumberFormat('0%');
  s.getRange('B16').setNumberFormat('0.00');
  s.getRange('B19').setNumberFormat('0');

  // Query tables (each spills down/right)
  const q = (cell, title, formula) => { s.getRange(cell).setValue(title).setFontWeight('bold'); s.getRange(cell).offset(1, 0).setFormula(formula); };
  q('E3', '3. BY GROUP: plays, win rate, avg score',
    `=IFERROR(QUERY(${E}A2:R,"select F, count(E), avg(L), avg(K) where E='quiz_finish' group by F label count(E) 'Quizzes', avg(L) 'Win rate', avg(K) 'Avg score'",0),"no data yet")`);
  q('E11', '4. FUN RATING BY GROUP',
    `=IFERROR(QUERY(${E}A2:R,"select F, avg(M), count(M) where E='rating' group by F label avg(M) 'Avg rating', count(M) 'Ratings'",0),"no data yet")`);
  q('E19', '5. HARDEST WORDS (lowest % correct first)',
    `=IFERROR(QUERY(${E}A2:R,"select H, avg(I), count(I), avg(J) where E='answer' group by H order by avg(I) asc label avg(I) '% correct', count(I) 'Times asked', avg(J) 'Avg seconds'",0),"no data yet")`);
  q('J3', '6. WHEN DO PEOPLE PLAY? (by hour)',
    `=IFERROR(QUERY(${E}A2:R,"select C, count(E) where E='quiz_start' group by C order by C label C 'Hour', count(E) 'Quizzes'",0),"no data yet")`);
  q('J30', '7. BY DAY',
    `=IFERROR(QUERY(${E}A2:R,"select B, count(E) where E='quiz_start' group by B label B 'Day', count(E) 'Quizzes'",0),"no data yet")`);
  q('M3', '8. HOW PEOPLE PICK A GROUP',
    `=IFERROR(QUERY(${E}A2:R,"select O, count(E) where E='category_selected' group by O label O 'Picked from', count(E) 'Times'",0),"no data yet")`);
  q('M9', '9. IDEAS FROM CUSTOMERS (newest first)',
    `=IFERROR(QUERY(${E}A2:R,"select A, F, M, N where E='feedback' and N <> '' order by A desc label A 'When', F 'Group', M 'Rating', N 'Comment'",0),"no comments yet")`);

  s.getRange('A1').setFontSize(14).setFontWeight('bold');
  ['A3','A15'].forEach(c => s.getRange(c).setFontWeight('bold'));
  s.setColumnWidth(1, 280);
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(s);
}
