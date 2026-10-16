# tasks setup

Personal task tracker. Everything lives on your **personal** accounts only:
Google `brendaocana08@gmail.com` and GitHub `bb7112`. Nothing First Chair.

## 1. Google Sheet + Calendar (about 5 minutes, on your laptop)

1. Signed in as **brendaocana08@gmail.com**, go to sheets.new and name the sheet `tasks`.
2. Click **Extensions > Apps Script**.
3. Delete what's there and paste everything from `google-apps-script.gs`.
4. On the line `const SECRET = 'CHANGE-ME';`, replace `CHANGE-ME` with your own passcode (a few words only you know). Save.
5. Click **Deploy > New deployment**, then the gear icon > **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy**, then **Authorize access**. Pick your personal Gmail. On "Google hasn't verified this app", click **Advanced > Go to tasks (unsafe)**. It's safe: it's your own script, and it only uses this sheet and your Google Calendar.
7. Copy the **Web app URL** (ends in `/exec`).

"Anyone" only means the URL can be reached. Without your passcode it refuses everything.

## 2. Put the app online (GitHub Pages, bb7112)

1. On github.com, signed in as **bb7112**, create a new repository called `tasks` (public is fine: none of your tasks are in it, only the app).
2. Tell Claude when it exists. Claude pushes the code and Pages turns on.
3. The app is then at **https://bb7112.github.io/tasks/**

## 3. On your iPhone

1. Open https://bb7112.github.io/tasks/ in **Safari**.
2. Tap **Share > Add to Home Screen**.
3. Open **tasks** from your home screen, then tap the settings icon (top right of home).
4. Paste the web app URL from step 1.7, type your passcode, and tap **connect**.

Every task and goal then shows up on your personal Google Calendar as an all-day event on its due date.

## Changing the backend later

If you edit the Apps Script, use **Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy**.
That keeps the same URL so the app keeps working.
