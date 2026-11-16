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
| `/raffle` | Raffle entry: first name + optional initial → 4-digit ticket number |
| `/game` | Bug Squash: 30-second tap game with a live leaderboard |
| `/screen` | Big-screen display *(coming soon)* |
| `/admin` | PIN-protected admin: prizes, animated draw, entries, leaderboard moderation, end-of-day wipe |

## Bug Squash

Bugs crawl across a code editor; tap them before the 30 seconds run out.

| Critter | Points |
|---|---|
| Red bug | +10 |
| Orange speedy bug | +20 |
| Golden bug | +50 |
| ✦ Feature | −20 (don't squash it!) |

Squashing 5 in a row raises a combo multiplier, up to x4. Missing or hitting a feature resets it. The game gets faster and busier as the round goes on. Players can save their score under a nickname, which is checked against the same blocklist as raffle names. Use the **Scores** tab in admin to remove a score or reset the leaderboard.

## Running the raffle on the day

1. Open `/admin` on your laptop and unlock it with `ADMIN_PIN`.
2. **Prizes** tab: add each prize and how many you have.
3. Visitors enter at `/raffle` on a tablet or their phones. They get a ticket number and photograph it.
4. At the end of the day, open the **Draw** tab, pick a prize and press **Draw a winner**.
   - If the winner has gone home, press **Not here? Redraw**. Their ticket is marked as forfeited and can't be drawn again.
5. When everything has been handed out, go to **Entries**, type `WIPE` and wipe all entries.

Safeguards:
- Only a first name and an optional surname initial are stored, and names are checked against a small blocklist.
- Each IP address can make at most 20 entries a minute.
- After 5 wrong admin PINs, that IP address is locked out for a minute.
