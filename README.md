# Yakinori Japanese Challenge 🍣

A phone game for Yakinori Japanese Kitchen customers. Players pick a group (Family, Friends, Couples or Kids), learn 8 Japanese words in a short lesson, then take a 5-question quiz. Getting 4 or more right wins a reward of 10% off drinks and desserts. Each phone gets 2 chances per day.

Anonymous interaction events are logged to a Google Sheet, so you can see whether people play, whether they enjoy it, and where to improve it.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole game, in one file (logo included) |
| `apps-script/Code.gs` | Google Sheet event logger and auto-built Summary tab |

---

## Part 1: Put the game live on GitHub Pages (about 5 minutes)

1. On GitHub, click **New repository** and name it `yakinori-quiz`. Make it **Public**.
2. Click **Add file → Upload files**, upload `index.html`, `README.md` and the `apps-script` folder, then click **Commit**.
3. Go to **Settings → Pages**. Under Source, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then click **Save**.
4. After 1–2 minutes the game is live at:
   **https://sushma-66.github.io/yakinori-quiz/**
5. Put that link into a free QR code generator and print the table cards.

## Part 2: Turn on event tracking (about 10 minutes)

1. Create a new Google Sheet called **Yakinori Quiz Data**.
2. Click **Extensions → Apps Script**, delete the sample code, paste in all of `apps-script/Code.gs`, and save.
3. At the top, select the function **setup** and click **Run**. Allow the permissions it asks for. This creates the **Events** and **Summary** tabs.
4. Click **Deploy → New deployment**. Click the ⚙️ icon and choose **Web app**, then set:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. In `index.html`, find `logUrl: ""` near the top and paste the URL between the quotes. Commit the change on GitHub (use the pencil icon to edit the file in the browser).
6. Test it: play one game on your phone. Within a few seconds, new rows should appear in the **Events** tab, and the **Summary** tab should update.

> If you change `Code.gs` later, go to **Deploy → Manage deployments → Edit → Version: New version** so the change goes live without changing the URL.

## Settings (top of `index.html`)

| Setting | Default | Meaning |
|---|---|---|
| `wordsPerLesson` | 8 | Words taught before the quiz |
| `questionsPerGame` | 5 | Quiz questions |
| `winScore` | 4 | Correct answers needed to win |
| `maxAttempts` | 2 | Quiz chances per phone per day |
| `secondsPerQuestion` | 20 | Timer for each question |
| `rewardTitle` | 10% off drinks & desserts | Text shown on the prize |
| `staffPin` | 2580 | **Change before going live** |
| `logUrl` | "" | Your Apps Script web-app URL |

The questions themselves live in the `B` (all words) and `CATS` (words per group) lists in the script, so you can add, change or remove words there.

## Staff guide

- **To check a win:** tap **Staff** at the bottom of the page and enter the PIN to see today's code. A real win shows the same code and a clock that keeps ticking.
- **To redeem:** after applying the discount on the till, tap **Staff: redeem** on the customer's phone. The ticket gets a REDEEMED stamp.
- **To reset a phone:** use **Reset phone** in the Staff panel. This gives the phone its 2 chances back (useful for testing).

## What gets tracked (no names, no personal data)

| Event | When it fires | Extra fields |
|---|---|---|
| `app_open` | Page opened | |
| `start` | Name entered and Next tapped (the name itself is **not** sent) | |
| `menu_open` / `back_click` | ☰ menu or back button used | |
| `category_selected` | Group picked | category, source (`grid` or `menu`) |
| `lesson_start` / `lesson_completed` | Lesson started / finished | seconds spent in the lesson |
| `quiz_start` | Quiz started (uses a chance) | attempt (1 or 2) |
| `answer` | Each question answered | word, correct (1/0), seconds, source (`click` or `timeout`) |
| `quiz_abandon` | Left the quiz partway through | |
| `quiz_finish` | Quiz completed | score, win (1/0) |
| `retry_click` | Tapped "Try again" | |
| `rating` | 😐 / 🙂 / 😍 tapped | rating (1–3) |
| `feedback` | Suggestion sent | rating, comment |
| `redeemed` | Staff redeemed a reward | |

Every row also records the anonymous session id, the time (with day and hour in UK time), the screen it happened on, and the device type.

## Questions the Summary tab answers

1. **Are people playing?** A funnel from opened, to picked a group, to finished the lesson, to started, finished and won the quiz, to redeemed.
2. **Is it fun?** Average rating, % "Loved it", rating by group, and customers' own ideas.
3. **Is it too easy or too hard?** Win rate and average score by group, plus the hardest words.
4. **Where do people drop off?** For example, many people start the lesson but don't finish it, which would mean the lesson is too long.
5. **When do people play?** By hour and by day, which can be compared with busy periods.

### Ideas for improving the game from the data

- If the win rate is above ~70%, raise `winScore` to 5. If it's below ~25%, lower it to 3.
- If people often leave during the lesson, set `wordsPerLesson` to 6.
- Replace words that are below ~30% correct, or keep them and add a better fun fact.
- If one group gets low ratings, rewrite that group's words.
- Compare redemptions with the EOD reports to check whether quiz days sell more desserts.
