/**
 * task tracker backend (personal Google account only).
 * Keeps tasks, goals, lists and workouts in this Google Sheet, and puts every
 * task and goal on your Google Calendar as an all-day event on its due date.
 *
 * Setup: see SETUP.md. Change SECRET to your own passcode before deploying.
 */
const SECRET = 'CHANGE-ME';

const HEAD = ['kind', 'id', 'data', 'updated'];
const KINDS = ['item', 'list', 'workout'];

function doGet() {
  return ContentService.createTextOutput('task tracker is running.');
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad request' }); }
  if (!body || body.key !== SECRET) return out_({ ok: false, error: 'wrong passcode' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    switch (body.action) {
      case 'ping': return out_({ ok: true });
      case 'list': return out_({ ok: true, docs: list_() });
      case 'put': return out_({ ok: true, doc: put_(body.kind, body.doc) });
      case 'delete': remove_(body.kind, body.id); return out_({ ok: true });
      default: return out_({ ok: false, error: 'unknown action' });
    }
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- sheet ----------

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('docs');
  if (!sh) {
    sh = ss.insertSheet('docs');
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold');
    sh.getRange('B:B').setNumberFormat('@');
  }
  return sh;
}

function list_() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const docs = { item: [], list: [], workout: [] };
  rows.forEach(r => {
    if (!r[1] || !docs[r[0]]) return;
    try { docs[r[0]].push(JSON.parse(r[2])); } catch (err) { /* skip a broken row */ }
  });
  return docs;
}

function findRow_(sh, kind, id) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const vals = sh.getRange(2, 1, last - 1, 2).getValues();
  for (let i = 0; i < vals.length; i++) if (vals[i][0] === kind && String(vals[i][1]) === String(id)) return i + 2;
  return 0;
}

function put_(kind, doc) {
  if (KINDS.indexOf(kind) < 0 || !doc || !doc.id) throw new Error('missing doc');
  const sh = sheet_();
  const r = findRow_(sh, kind, doc.id);
  if (kind === 'item') {
    // the sheet's copy knows the calendar event even if the phone's copy doesn't yet
    if (!doc.eventId && r) { try { doc.eventId = JSON.parse(sh.getRange(r, 3).getValue()).eventId || ''; } catch (err) {} }
    syncCalendar_(doc);
  }
  const row = [kind, String(doc.id), JSON.stringify(doc), new Date()];
  if (r) sh.getRange(r, 1, 1, HEAD.length).setValues([row]);
  else sh.appendRow(row);
  return doc;
}

function remove_(kind, id) {
  const sh = sheet_();
  const r = findRow_(sh, kind, id);
  if (!r) return;
  if (kind === 'item') {
    try { const d = JSON.parse(sh.getRange(r, 3).getValue()); if (d.eventId) deleteEvent_(d.eventId); } catch (err) {}
  }
  sh.deleteRow(r);
}

// ---------- google calendar ----------

function calTitle_(it) {
  const area = it.area === 'personal' ? 'personal' : 'work';
  const label = it.kind === 'goal' ? 'goal (' + area + '): ' : area + ': ';
  return (it.done ? 'done · ' : '') + label + it.text;
}

function event_(id) {
  if (!id) return null;
  try { return CalendarApp.getDefaultCalendar().getEventById(id); } catch (err) { return null; }
}

function deleteEvent_(id) {
  const ev = event_(id);
  if (ev) try { ev.deleteEvent(); } catch (err) {}
}

function syncCalendar_(it) {
  if (!it.due) return;
  if (it.archived) { if (it.eventId) deleteEvent_(it.eventId); it.eventId = ''; return; }
  const p = String(it.due).split('-').map(Number);
  const date = new Date(p[0], p[1] - 1, p[2]);
  const title = calTitle_(it);
  let ev = event_(it.eventId);
  if (!ev) {
    ev = CalendarApp.getDefaultCalendar().createAllDayEvent(title, date, { description: 'from your task tracker. check it off there to keep your score down.' });
    try { ev.removeAllReminders(); } catch (err) {}
    try { ev.setTransparency(CalendarApp.EventTransparency.TRANSPARENT); } catch (err) {}
    it.eventId = ev.getId();
  } else {
    if (ev.getTitle() !== title) ev.setTitle(title);
    if (ev.getAllDayStartDate().getTime() !== date.getTime()) ev.setAllDayDate(date);
  }
  try { ev.setColor(it.done ? CalendarApp.EventColor.GRAY : it.kind === 'goal' ? CalendarApp.EventColor.MAUVE : ''); } catch (err) {}
}
