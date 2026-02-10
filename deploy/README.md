# LevelMission - Deployment auf Hetzner

Diese Anleitung beschreibt die vollständige Installation von LevelMission auf einem Hetzner Cloud Server.

## Voraussetzungen

- Hetzner Cloud Account
- Domain (optional, aber empfohlen)
- SSH-Zugang zum Server

## Server-Empfehlung

| Typ | Spezifikation | Kosten/Monat |
|-----|---------------|--------------|
| CX21 | 2 vCPU, 4 GB RAM, 40 GB SSD | ~5,83 € |
| CX31 | 2 vCPU, 8 GB RAM, 80 GB SSD | ~10,59 € |

**Empfehlung:** CX21 ist für den Start ausreichend.

## Schnellstart (3 Schritte)

### Schritt 1: Server bestellen

1. Gehe zu [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Erstelle neues Projekt
3. Server hinzufügen:
   - **Location:** Falkenstein (DE) oder Nürnberg (DE)
   - **Image:** Ubuntu 22.04
   - **Type:** CX21 (oder höher)
   - **SSH-Key:** Deinen öffentlichen SSH-Key hinzufügen
   - **Firewall:** Erstelle Regel für SSH (22), HTTP (80), HTTPS (443)

### Schritt 2: Server-Installation

```bash
# Via SSH verbinden
ssh root@DEINE_SERVER_IP

# Deploy-Ordner herunterladen
git clone https://github.com/Ds9001-1983/FamilyQuest.git /tmp/familyquest
cd /tmp/familyquest/deploy

# Installations-Skript ausführen
chmod +x install.sh
./install.sh
```

**Das Skript installiert automatisch:**
- Node.js 20 LTS
- PostgreSQL 15
- Nginx
- PM2 (Prozessmanager)
- Certbot (SSL)
- UFW Firewall

### Schritt 3: App-Setup

```bash
# Zum App-Benutzer wechseln
su - familyquest

# Setup-Skript ausführen
cd /tmp/familyquest/deploy
chmod +x setup-app.sh
./setup-app.sh
```

**Das Skript führt durch:**
1. Repository klonen
2. Dependencies installieren
3. Umgebungsvariablen konfigurieren
4. Datenbank-Migration
5. App bauen
6. PM2 konfigurieren
7. Nginx konfigurieren
8. SSL-Zertifikat (optional)

## Manuelle Installation

Falls du die Skripte nicht verwenden möchtest:

### 1. System vorbereiten

```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential
```

### 2. Node.js installieren

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 3. PostgreSQL installieren

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Datenbank erstellen
sudo -u postgres psql
CREATE USER familyquest WITH PASSWORD 'sicheres_passwort';
CREATE DATABASE familyquest OWNER familyquest;
\q
```

### 4. App installieren

```bash
# Benutzer erstellen
useradd -m -s /bin/bash familyquest
su - familyquest

# Repository klonen
git clone https://github.com/Ds9001-1983/FamilyQuest.git ~/app
cd ~/app

# Dependencies
npm ci

# Umgebungsvariablen
cp deploy/.env.example .env
nano .env  # Anpassen!

# Datenbank-Migration
npm run db:push

# Build
npm run build

# Testen
npm start
```

### 5. PM2 einrichten

```bash
npm install -g pm2
pm2 start dist/index.js --name levelmission
pm2 save
pm2 startup
```

### 6. Nginx einrichten

```bash
apt install -y nginx
nano /etc/nginx/sites-available/levelmission
# Konfiguration aus deploy/nginx.conf einfügen

ln -s /etc/nginx/sites-available/levelmission /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 7. SSL-Zertifikat

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d deine-domain.de
```

## Wartung

### Logs anzeigen

```bash
pm2 logs levelmission
```

### App neustarten

```bash
pm2 restart levelmission
```

### Updates einspielen

```bash
su - familyquest
cd ~/app
git pull
npm ci
npm run build
pm2 restart levelmission
```

### Datenbank-Backup

```bash
pg_dump -U familyquest familyquest > backup_$(date +%Y%m%d).sql
```

## Fehlerbehebung

### App startet nicht

```bash
# Logs prüfen
pm2 logs levelmission --lines 100

# Umgebungsvariablen prüfen
cat ~/app/.env

# Manuell starten zum Testen
cd ~/app && npm start
```

### Datenbank-Verbindungsfehler

```bash
# PostgreSQL Status
systemctl status postgresql

# Verbindung testen
psql -U familyquest -d familyquest -h localhost
```

### Nginx-Fehler

```bash
# Konfiguration testen
nginx -t

# Logs prüfen
tail -f /var/log/nginx/levelmission.error.log
```

## Sicherheits-Checkliste

- [ ] SSH-Key statt Passwort verwenden
- [ ] Root-Login deaktivieren
- [ ] UFW Firewall aktiviert
- [ ] SSL-Zertifikat installiert
- [ ] Sichere Passwörter für Datenbank
- [ ] SESSION_SECRET ist 32+ Zeichen
- [ ] /tmp/db_password.txt gelöscht
- [ ] Regelmäßige Backups eingerichtet

## Support

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/Ds9001-1983/FamilyQuest/issues

---

**Viel Erfolg mit LevelMission!** 🚀
