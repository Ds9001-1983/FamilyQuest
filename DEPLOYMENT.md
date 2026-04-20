# Deployment

## Backend

### Render (empfohlen — alles vorkonfiguriert)

1. Neon-DB anlegen (https://neon.tech) → `DATABASE_URL` kopieren
2. Repo zu Render verbinden, "Blueprint" wählen → [render.yaml](render.yaml) wird erkannt
3. Im Render-Dashboard:
   - `DATABASE_URL` einfügen
   - `CORS_ORIGINS` auf die gehostete Web-URL (falls genutzt) setzen, z. B. `https://levelmission.app`
   - `SESSION_SECRET` und `JWT_SECRET` werden automatisch generiert
4. Nach dem ersten Deploy: einmalig `npm run db:push` lokal gegen die Prod-DB ausführen

### Andere Anbieter (Fly.io, Railway, Cloud Run)

Der mitgelieferte [Dockerfile](Dockerfile) baut ein `node:20-bookworm-slim` Image, das auf
Port `5000` lauscht. Folgende Env-Vars sind Pflicht:

- `NODE_ENV=production`
- `DATABASE_URL`
- `SESSION_SECRET` (≥ 32 Zeichen)
- `JWT_SECRET` (≥ 32 Zeichen)
- `CORS_ORIGINS` (nur falls ein Browser-Client zugreift; native Apps senden keine Origin)

Optional: `PORT`, `HOST`.

### TLS

Der Server setzt Session-Cookies mit `secure: true` in Prod. Dafür muss der Reverse-Proxy
TLS terminieren und Render/Fly/Railway tun das automatisch. `trust proxy` ist aktiv.

## Mobile

### Dev auf echtem Gerät

```bash
cd mobile
EXPO_PUBLIC_API_URL=http://<dein-LAN-IP>:5000 npm start
```

`localhost` geht nicht vom Handy aus — immer die LAN-IP des Entwicklungsrechners nehmen.

### TestFlight-Build

```bash
cd mobile
npx --yes eas login
npx --yes eas build:configure          # einmalig
npx --yes eas build --profile production --platform ios
npx --yes eas submit --profile production --platform ios
```

Vor dem ersten Build in [eas.json](mobile/eas.json) `submit.production.ios.appleId`,
`ascAppId` und `appleTeamId` eintragen.

Die Production-Build-URL zeigt standardmäßig auf `http://localhost:5000`. Überschreibe mit:

```bash
EAS_BUILD_ENV_EXPO_PUBLIC_API_URL=https://api.levelmission.app \
  npx eas build --profile production --platform ios
```

Oder dauerhaft in `eas.json` unter `build.production.env`.
