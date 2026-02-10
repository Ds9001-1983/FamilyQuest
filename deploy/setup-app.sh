#!/bin/bash
#===============================================================================
# LevelMission - App Setup Skript
# Version: 1.0
# Ausführen als: familyquest-Benutzer (NICHT als root!)
#===============================================================================

set -e  # Bei Fehler abbrechen

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfiguration
APP_DIR="$HOME/app"
REPO_URL="https://github.com/Ds9001-1983/FamilyQuest.git"
APP_NAME="levelmission"

#===============================================================================
# Hilfsfunktionen
#===============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNUNG]${NC} $1"
}

log_error() {
    echo -e "${RED}[FEHLER]${NC} $1"
}

check_not_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "Dieses Skript sollte NICHT als root ausgeführt werden!"
        log_info "Bitte als 'familyquest'-Benutzer ausführen"
        exit 1
    fi
}

#===============================================================================
# 1. Repository klonen oder aktualisieren
#===============================================================================

clone_or_update_repo() {
    log_info "=== Repository wird vorbereitet ==="

    if [[ -d "${APP_DIR}/.git" ]]; then
        log_info "Repository existiert, wird aktualisiert..."
        cd ${APP_DIR}
        git fetch origin
        git pull origin main || git pull origin master
        log_success "Repository aktualisiert"
    else
        log_info "Repository wird geklont..."

        # Verzeichnis leeren falls vorhanden
        if [[ -d "${APP_DIR}" ]]; then
            rm -rf ${APP_DIR}/*
        fi

        git clone ${REPO_URL} ${APP_DIR}
        cd ${APP_DIR}
        log_success "Repository geklont"
    fi
}

#===============================================================================
# 2. Dependencies installieren
#===============================================================================

install_dependencies() {
    log_info "=== Dependencies werden installiert ==="

    cd ${APP_DIR}

    # npm ci für saubere Installation (besser als npm install)
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi

    log_success "Dependencies installiert"
}

#===============================================================================
# 3. Umgebungsvariablen konfigurieren
#===============================================================================

setup_env() {
    log_info "=== Umgebungsvariablen werden konfiguriert ==="

    ENV_FILE="${APP_DIR}/.env"

    if [[ -f "${ENV_FILE}" ]]; then
        log_warn ".env-Datei existiert bereits"
        read -p "Überschreiben? (j/n): " OVERWRITE
        if [[ "$OVERWRITE" != "j" ]]; then
            log_info "Bestehende .env-Datei wird beibehalten"
            return
        fi
    fi

    # Interaktive Eingabe
    echo ""
    echo "Bitte gib die erforderlichen Werte ein:"
    echo ""

    # Datenbank-Passwort
    read -p "PostgreSQL Passwort (siehe /tmp/db_password.txt): " DB_PASSWORD
    if [[ -z "$DB_PASSWORD" ]]; then
        log_error "Passwort darf nicht leer sein!"
        exit 1
    fi

    # Session Secret generieren
    SESSION_SECRET=$(openssl rand -base64 32)
    log_info "Session Secret wurde automatisch generiert"

    # Domain (optional)
    read -p "Domain (z.B. app.example.com, oder leer für später): " DOMAIN

    # .env-Datei erstellen
    cat > ${ENV_FILE} <<EOF
# LevelMission Produktions-Konfiguration
# Erstellt am: $(date)

# Node Environment
NODE_ENV=production

# Datenbank (PostgreSQL)
DATABASE_URL=postgresql://familyquest:${DB_PASSWORD}@localhost:5432/familyquest

# Session Secret (min. 32 Zeichen - NICHT ÄNDERN!)
SESSION_SECRET=${SESSION_SECRET}

# Optional: Domain für CORS
# DOMAIN=${DOMAIN}
EOF

    chmod 600 ${ENV_FILE}
    log_success ".env-Datei erstellt"
}

#===============================================================================
# 4. Datenbank-Migration ausführen
#===============================================================================

run_migrations() {
    log_info "=== Datenbank-Migration wird ausgeführt ==="

    cd ${APP_DIR}

    # Drizzle Push
    npm run db:push

    log_success "Datenbank-Migration abgeschlossen"
}

#===============================================================================
# 5. App bauen
#===============================================================================

build_app() {
    log_info "=== App wird gebaut ==="

    cd ${APP_DIR}

    # TypeScript prüfen
    log_info "TypeScript wird geprüft..."
    npm run check

    # Build
    log_info "Produktion-Build wird erstellt..."
    npm run build

    log_success "App erfolgreich gebaut"
}

#===============================================================================
# 6. PM2 konfigurieren und starten
#===============================================================================

setup_pm2() {
    log_info "=== PM2 wird konfiguriert ==="

    cd ${APP_DIR}

    # PM2 Ecosystem-Datei erstellen
    cat > ecosystem.config.cjs <<EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'dist/index.js',
    cwd: '${APP_DIR}',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '${APP_DIR}/logs/error.log',
    out_file: '${APP_DIR}/logs/out.log',
    log_file: '${APP_DIR}/logs/combined.log',
    time: true
  }]
};
EOF

    # Log-Verzeichnis erstellen
    mkdir -p ${APP_DIR}/logs

    # Bestehende App stoppen (falls vorhanden)
    pm2 delete ${APP_NAME} 2>/dev/null || true

    # App starten
    pm2 start ecosystem.config.cjs

    # PM2 speichern für Auto-Start
    pm2 save

    # Startup-Skript generieren
    log_info "PM2 Startup-Skript wird erstellt..."
    pm2 startup systemd -u $(whoami) --hp $HOME | tail -1 | sudo bash

    log_success "PM2 konfiguriert und gestartet"
}

#===============================================================================
# 7. Nginx konfigurieren
#===============================================================================

setup_nginx() {
    log_info "=== Nginx wird konfiguriert ==="

    # Domain abfragen falls nicht gesetzt
    if [[ -z "$DOMAIN" ]]; then
        read -p "Domain für Nginx (z.B. app.example.com): " DOMAIN
    fi

    if [[ -z "$DOMAIN" ]]; then
        log_warn "Keine Domain angegeben, Nginx wird mit Server-IP konfiguriert"
        DOMAIN="_"
    fi

    # Nginx-Konfiguration erstellen
    NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"

    sudo tee ${NGINX_CONF} > /dev/null <<EOF
# LevelMission - Nginx Konfiguration
# Erstellt am: $(date)

upstream ${APP_NAME}_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Logs
    access_log /var/log/nginx/${APP_NAME}.access.log;
    error_log /var/log/nginx/${APP_NAME}.error.log;

    # Sicherheits-Header
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Kompression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Proxy zum Node.js Backend
    location / {
        proxy_pass http://${APP_NAME}_backend;
        proxy_http_version 1.1;

        # WebSocket Support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        # Header
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        proxy_cache_bypass \$http_upgrade;
    }

    # Statische Assets cachen
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://${APP_NAME}_backend;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Symlink erstellen
    sudo ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/

    # Default-Seite deaktivieren
    sudo rm -f /etc/nginx/sites-enabled/default

    # Konfiguration testen
    sudo nginx -t

    # Nginx neu laden
    sudo systemctl reload nginx

    log_success "Nginx konfiguriert für: ${DOMAIN}"
}

#===============================================================================
# 8. SSL-Zertifikat einrichten (optional)
#===============================================================================

setup_ssl() {
    log_info "=== SSL-Zertifikat ==="

    if [[ "$DOMAIN" == "_" || -z "$DOMAIN" ]]; then
        log_warn "Keine Domain konfiguriert, SSL wird übersprungen"
        return
    fi

    read -p "SSL-Zertifikat mit Certbot einrichten? (j/n): " SETUP_SSL

    if [[ "$SETUP_SSL" != "j" ]]; then
        log_info "SSL-Setup übersprungen"
        return
    fi

    read -p "E-Mail für Let's Encrypt: " LE_EMAIL

    # Certbot ausführen
    sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m ${LE_EMAIL}

    log_success "SSL-Zertifikat installiert"
}

#===============================================================================
# App testen
#===============================================================================

test_app() {
    log_info "=== App wird getestet ==="

    # Kurz warten
    sleep 3

    # Status prüfen
    pm2 status

    # Healthcheck
    log_info "Healthcheck..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 || echo "000")

    if [[ "$RESPONSE" == "200" ]]; then
        log_success "App läuft! (HTTP $RESPONSE)"
    else
        log_warn "App antwortet mit HTTP $RESPONSE"
        log_info "Prüfe Logs: pm2 logs ${APP_NAME}"
    fi
}

#===============================================================================
# Zusammenfassung
#===============================================================================

print_summary() {
    echo ""
    echo "==============================================================================="
    echo -e "${GREEN}App-Setup abgeschlossen!${NC}"
    echo "==============================================================================="
    echo ""
    echo "Status:"
    pm2 status
    echo ""
    echo "Nützliche Befehle:"
    echo "  pm2 logs ${APP_NAME}      - Logs anzeigen"
    echo "  pm2 restart ${APP_NAME}   - App neustarten"
    echo "  pm2 stop ${APP_NAME}      - App stoppen"
    echo "  pm2 monit                 - Monitoring"
    echo ""
    if [[ "$DOMAIN" != "_" && -n "$DOMAIN" ]]; then
        echo "Deine App ist erreichbar unter:"
        echo "  http://${DOMAIN}"
        echo "  https://${DOMAIN} (falls SSL aktiviert)"
    else
        echo "Deine App ist erreichbar unter:"
        echo "  http://<SERVER-IP>"
    fi
    echo ""
    echo -e "${YELLOW}WICHTIG: Lösche /tmp/db_password.txt falls noch vorhanden!${NC}"
    echo ""
}

#===============================================================================
# Hauptprogramm
#===============================================================================

main() {
    echo ""
    echo "==============================================================================="
    echo "  LevelMission - App Setup"
    echo "==============================================================================="
    echo ""

    check_not_root

    clone_or_update_repo
    install_dependencies
    setup_env
    run_migrations
    build_app
    setup_pm2
    setup_nginx
    setup_ssl
    test_app

    print_summary
}

# Skript starten
main "$@"
