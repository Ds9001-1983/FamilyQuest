# LevelMission

Gamified family task-management app. Parents create missions (chores), children earn
XP by completing them, and trade XP for rewards the family defines.

German UI, Kids-Category-friendly (Parental Gate, Privacy Manifest, account deletion).

## Repo layout

```
server/    Express + TypeScript API (session + JWT auth, PostgreSQL via Drizzle)
shared/    Zod + Drizzle schema shared with the server
mobile/    Expo / React Native app (iOS + Android + web preview)
```

## Getting started

### Backend

```bash
cp .env.example .env        # fill in DATABASE_URL, SESSION_SECRET, JWT_SECRET
npm install
npm run db:push             # applies the Drizzle schema to your database
npm run dev                 # API at http://localhost:5000
```

### Mobile

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://<LAN-IP>:5000 npm start
```

`localhost` works only on iOS Simulator — for a physical device use the LAN IP of
the dev machine.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Render / Docker / EAS workflow.
