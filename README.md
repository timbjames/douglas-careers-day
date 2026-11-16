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
| `/raffle` | Raffle entry *(coming soon)* |
| `/game` | Bug Squash *(coming soon)* |
| `/screen` | Big-screen display *(coming soon)* |
| `/admin` | PIN-protected prize draw *(coming soon)* |
