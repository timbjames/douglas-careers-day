# douglas-careers-day

Demo Careers Day Application: a raffle and a game built for a school careers festival.

| Part | Tech |
|---|---|
| `api/` | .NET 10 Minimal API, EF Core, PostgreSQL |
| `web/` | React + TypeScript (Vite), served by nginx |
| `docker-compose.yml` | Runs `db`, `api` and `web` together |

## Run it with Docker

```bash
cp .env.example .env      # then edit the password and admin PIN
docker compose up --build
```

Open http://localhost. The badge in the bottom-right corner turns green when the API and the database are both up.

To reset everything, including all raffle entries and scores:

```bash
docker compose down -v
```

## Offline edition (no Docker, no server)

A backup in case Docker won't run on the day: the whole app as **one HTML file** that you double-click to open. It has no server and needs no internet.

```bash
cd web
npm install
npm run build:offline
# → web/dist-offline/careers-day-offline.html
```

Copy that file to any laptop and open it in Chrome or Edge. Everything works: home, intro, raffle, admin draw, Bug Squash, the big screen and the Learn pages.

- **Where the data lives:** raffle entries, prizes, winners and scores are saved in that browser on that laptop, so they survive a refresh or restart. Use the admin wipe buttons at the end of the day.
- **Live updates between tabs:** open `#/screen` in a second tab or window on the TV and it updates live as people enter, play and win.
- **No phones:** phones can't reach a file on your laptop, so the big screen says "Enter at the stand" instead of showing a QR code. Visitors use the laptop or a tablet at the stand.
- **Admin PIN:** set by `VITE_OFFLINE_ADMIN_PIN` in `web/.env.offline` (default `1234`). Change it before building if pupils might get hold of the laptop.
- **Links:** pages use `#/` links, for example `careers-day-offline.html#/screen` or `#/admin`.

## Local development

Start a throwaway Postgres that matches `api/appsettings.Development.json`:

```bash
docker run -d --name careersday-db -p 5432:5432 \
  -e POSTGRES_DB=careersday -e POSTGRES_USER=careersday -e POSTGRES_PASSWORD=careersday \
  postgres:17-alpine
```

Then, in two terminals:

```bash
# API → http://localhost:5080
cd api && dotnet run

# Frontend → http://localhost:5173 (proxies /api to the API)
cd web && npm install && npm run dev
```

The API applies EF Core migrations automatically on startup.

### Adding a migration

```bash
dotnet tool restore
dotnet ef migrations add <Name> --project api -o Data/Migrations
```

## Pages

| Route | Purpose |
|---|---|
| `/` | Home: enter the raffle or play the game |
| `/intro` | Title card: LRQA and Douglas Academy logos large, with "Head of Development · Software / Computer Science". Any click or key closes it to the home page. Also opened from the home page's "About this career" button. |
| `/raffle` | Raffle entry: first name + optional initial → 4-digit ticket number |
| `/game` | Bug Squash: 30-second tap game with a live leaderboard |
| `/screen` | Big-screen display: QR code, live raffle count, prizes, winners, leaderboard, activity feed and full-screen winner reveals |
| `/learn` | Careers in tech: myths vs truths, routes into tech, qualifications, useful school subjects, how software gets made, languages & frameworks, top tips |
| `/admin` | PIN-protected admin: prizes, animated draw, entries, leaderboard moderation, end-of-day wipe |

## Branding

The app is co-branded LRQA × Douglas Academy.

- **Logos:** the LRQA logo and Douglas Academy crest are in `web/src/assets/brand/` (see the README there).
- **Colours and fonts:** edit the brand tokens at the top of `web/src/index.css`. The LRQA navy (#0F1232) and green (#0FF2B2) are sampled from the logo; the raffle red and game blue come from the school crest.
- **Wording** (event title, tagline, school motto, and the role and field on the intro screen): edit `web/src/brand.ts`.

## Careers in tech pages (`/learn`)

These are infographic pages to show while you talk. Open `/learn` on the big screen and use the arrow keys, space, or a presentation clicker (Page Up/Down):

- **Myths vs truths:** each press flips the next myth card to show the truth, and ← flips it back. After the last card, the next press moves on to the next topic. Pupils can also tap the cards.
- **Routes into tech:** university, Graduate Apprenticeship, Modern Apprenticeship, college and teaching yourself, plus a "My pathway" timeline.
- **Qualifications & training:** an SCQF ladder from National 5s up to degrees, the Foundation Apprenticeship you can do at school, certifications and soft skills.
- **Useful school subjects:** each subject rated by how useful it is, with a reason why.
- **How software gets made:** an animated infinity loop of the development lifecycle (Plan → Code → Build → Test → Release → Deploy → Operate → Monitor). Each press moves to the next stage and shows the tools used at it. Tools used to build this app are highlighted.
- **Languages & frameworks:** 12 languages, each with a one-line "Hello!", plus frameworks grouped by what they build. Each press spotlights the next group.
- **Top tips:** 8 numbered tips. Each press spotlights the next tip and dims the others.

All the text is in `web/src/learn/content.ts`. The running order is in `web/src/learn/topics.ts`.

## Bug Squash

Bugs crawl across a code editor; tap them before the 30 seconds run out.

| Critter | Points |
|---|---|
| Red bug | +10 |
| Orange speedy bug | +20 |
| Golden bug | +50 |
| ✦ Feature | −20 (don't squash it!) |

Squashing 5 in a row raises a combo multiplier, up to x4. Missing or hitting a feature resets it. The game gets faster and busier as the round goes on. Players can save their score under a nickname, which is checked against the same blocklist as raffle names. Use the **Scores** tab in admin to delete a single score, tick several and delete them together, or reset the leaderboard.

## The big screen

Open `/screen` on the laptop that's connected to the TV or projector, and press F11 for full screen. Everything updates live over SignalR (`/hubs/live`):

- **QR code** so visitors can join on their phones. Set `PUBLIC_URL` in `.env` to the address phones can reach, usually your laptop's IP on the event wifi or hotspot, e.g. `http://192.168.1.50`. Otherwise the QR code points at whatever address the screen was opened on, and shows a warning if that's `localhost`.
- The raffle entry count, the prizes still available, and the winners.
- The Bug Squash top 10, plus a feed of new entries and scores. A new #1 gets confetti.
- When you draw a winner in `/admin`, the big screen takes over with a drum roll and reveals the same ticket at the same moment.

**Sound:** browsers only play audio after the page has been clicked, so click the big screen once after opening it. Every page has a 🔊/🔇 toggle.

If the connection drops (wifi blip, API restart), pages show "reconnecting…", retry on their own and catch up when they're back. They also refresh every 30 seconds as a safety net.

## Running the raffle on the day

1. Open `/admin` on your laptop and unlock it with `ADMIN_PIN`.
2. **Prizes** tab: add each prize and how many you have.
3. Visitors enter at `/raffle` on a tablet or their phones, giving their first name, an optional surname initial, and their class (e.g. `1A`). They get a ticket number and photograph it. The class tells apart pupils with the same name, e.g. "Sam T (1A)" and "Sam T (2C)".
4. At the end of the day, open the **Draw** tab, pick a prize and press **Draw a winner**.
   - If the winner has gone home, press **Not here? Redraw**. Their ticket is marked as forfeited and can't be drawn again.
5. When everything has been handed out, go to **Entries**, type `WIPE` and wipe all entries.

Safeguards:
- Only a first name, an optional surname initial and a class are stored, and names are checked against a small blocklist. A class is 1–4 letters or numbers with at least one digit, e.g. `1A`, `S3B` or `4C2`.
- Each IP address can make at most 20 entries a minute.
- After 5 wrong admin PINs, that IP address is locked out for a minute.
