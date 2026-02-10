#!/bin/bash
#===============================================================================
# LevelMission - Hetzner Server Installations-Skript
# Version: 1.0
# Für: Ubuntu 22.04 LTS
#===============================================================================

set -e  # Bei Fehler abbrechen

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfiguration
APP_USER="familyquest"
APP_DIR="/home/${APP_USER}/app"
NODE_VERSION="20"
POSTGRES_VERSION="15"

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

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Dieses Skript muss als root ausgeführt werden!"
        log_info "Bitte mit 'sudo bash install.sh' ausführen"
        exit 1
    fi
}

#===============================================================================
# 1. System vorbereiten
#===============================================================================

prepare_system() {
    log_info "=== System wird vorbereitet ==="

    # Updates
    log_info "System-Updates werden installiert..."
    apt update && apt upgrade -y

    # Grundlegende Pakete
    log_info "Grundlegende Pakete werden installiert..."
    apt install -y \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw

    log_success "System vorbereitet"
}

#===============================================================================
# 2. Node.js installieren
#===============================================================================

install_nodejs() {
    log_info "=== Node.js ${NODE_VERSION} wird installiert ==="

    # Prüfen ob bereits installiert
    if command -v node &> /dev/null; then
        CURRENT_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$CURRENT_VERSION" -ge "$NODE_VERSION" ]]; then
            log_success "Node.js $(node -v) bereits installiert"
            return
        fi
    fi

    # NodeSource Repository hinzufügen
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -

    # Node.js installieren
    apt install -y nodejs

    # Version prüfen
    log_success "Node.js $(node -v) installiert"
    log_success "npm $(npm -v) installiert"
}

#===============================================================================
# 3. PostgreSQL installieren
#===============================================================================

install_postgresql() {
    log_info "=== PostgreSQL ${POSTGRES_VERSION} wird installiert ==="

    # Prüfen ob bereits installiert
    if command -v psql &> /dev/null; then
        log_success "PostgreSQL bereits installiert"
        return
    fi

    # PostgreSQL Repository
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    apt update

    # PostgreSQL installieren
    apt install -y postgresql-${POSTGRES_VERSION} postgresql-contrib-${POSTGRES_VERSION}

    # Dienst starten
    systemctl start postgresql
    systemctl enable postgresql

    log_success "PostgreSQL ${POSTGRES_VERSION} installiert und gestartet"
}

#===============================================================================
# 4. Nginx installieren
#===============================================================================

install_nginx() {
    log_info "=== Nginx wird installiert ==="

    # Prüfen ob bereits installiert
    if command -v nginx &> /dev/null; then
        log_success "Nginx bereits installiert"
        return
    fi

    apt install -y nginx

    # Dienst starten
    systemctl start nginx
    systemctl enable nginx

    log_success "Nginx installiert und gestartet"
}

#===============================================================================
# 5. PM2 installieren
#===============================================================================

install_pm2() {
    log_info "=== PM2 wird installiert ==="

    # Prüfen ob bereits installiert
    if command -v pm2 &> /dev/null; then
        log_success "PM2 bereits installiert"
        return
    fi

    npm install -g pm2

    log_success "PM2 $(pm2 -v) installiert"
}

#===============================================================================
# 6. Certbot installieren (für SSL)
#===============================================================================

install_certbot() {
    log_info "=== Certbot wird installiert ==="

    # Prüfen ob bereits installiert
    if command -v certbot &> /dev/null; then
        log_success "Certbot bereits installiert"
        return
    fi

    apt install -y certbot python3-certbot-nginx

    log_success "Certbot installiert"
}

#===============================================================================
# 7. App-Benutzer erstellen
#===============================================================================

create_app_user() {
    log_info "=== App-Benutzer '${APP_USER}' wird erstellt ==="

    # Prüfen ob Benutzer existiert
    if id "${APP_USER}" &>/dev/null; then
        log_success "Benutzer '${APP_USER}' existiert bereits"
        return
    fi

    # Benutzer erstellen
    useradd -m -s /bin/bash ${APP_USER}

    # Zur sudo-Gruppe hinzufügen
    usermod -aG sudo ${APP_USER}

    # SSH-Verzeichnis erstellen
    mkdir -p /home/${APP_USER}/.ssh

    # SSH-Key kopieren (wenn vorhanden)
    if [[ -f /root/.ssh/authorized_keys ]]; then
        cp /root/.ssh/authorized_keys /home/${APP_USER}/.ssh/
        chown -R ${APP_USER}:${APP_USER} /home/${APP_USER}/.ssh
        chmod 700 /home/${APP_USER}/.ssh
        chmod 600 /home/${APP_USER}/.ssh/authorized_keys
        log_info "SSH-Keys wurden kopiert"
    fi

    log_success "Benutzer '${APP_USER}' erstellt"
}

#===============================================================================
# 8. PostgreSQL Datenbank einrichten
#===============================================================================

setup_database() {
    log_info "=== Datenbank wird eingerichtet ==="

    # Zufälliges Passwort generieren
    DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)

    # Prüfen ob Benutzer existiert
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${APP_USER}'" | grep -q 1; then
        log_warn "Datenbank-Benutzer '${APP_USER}' existiert bereits"
        read -p "Neues Passwort setzen? (j/n): " RESET_PW
        if [[ "$RESET_PW" == "j" ]]; then
            sudo -u postgres psql -c "ALTER USER ${APP_USER} WITH PASSWORD '${DB_PASSWORD}';"
            log_success "Passwort wurde aktualisiert"
        else
            log_warn "Bestehendes Passwort wird beibehalten"
            log_warn "Du musst das Passwort manuell in der .env-Datei setzen!"
            DB_PASSWORD="DEIN_BESTEHENDES_PASSWORT"
        fi
    else
        # Benutzer und Datenbank erstellen
        sudo -u postgres psql <<EOF
CREATE USER ${APP_USER} WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${APP_USER} OWNER ${APP_USER};
GRANT ALL PRIVILEGES ON DATABASE ${APP_USER} TO ${APP_USER};
EOF
        log_success "Datenbank und Benutzer erstellt"
    fi

    # Passwort speichern für spätere Verwendung
    echo "${DB_PASSWORD}" > /tmp/db_password.txt
    chmod 600 /tmp/db_password.txt

    log_info "Datenbank-Passwort wurde in /tmp/db_password.txt gespeichert"
    log_warn "WICHTIG: Notiere dir dieses Passwort und lösche die Datei danach!"
    echo ""
    echo -e "${GREEN}Datenbank-Passwort: ${DB_PASSWORD}${NC}"
    echo ""
}

#===============================================================================
# 9. Firewall konfigurieren
#===============================================================================

setup_firewall() {
    log_info "=== Firewall wird konfiguriert ==="

    # UFW Regeln
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'

    # UFW aktivieren (ohne Nachfrage)
    echo "y" | ufw enable

    log_success "Firewall konfiguriert und aktiviert"
    ufw status
}

#===============================================================================
# 10. App-Verzeichnis vorbereiten
#===============================================================================

prepare_app_directory() {
    log_info "=== App-Verzeichnis wird vorbereitet ==="

    # Verzeichnis erstellen
    mkdir -p ${APP_DIR}
    chown -R ${APP_USER}:${APP_USER} ${APP_DIR}

    log_success "App-Verzeichnis ${APP_DIR} erstellt"
}

#===============================================================================
# Zusammenfassung ausgeben
#===============================================================================

print_summary() {
    echo ""
    echo "==============================================================================="
    echo -e "${GREEN}Installation abgeschlossen!${NC}"
    echo "==============================================================================="
    echo ""
    echo "Installierte Komponenten:"
    echo "  - Node.js:     $(node -v 2>/dev/null || echo 'nicht installiert')"
    echo "  - npm:         $(npm -v 2>/dev/null || echo 'nicht installiert')"
    echo "  - PostgreSQL:  $(psql --version 2>/dev/null | head -1 || echo 'nicht installiert')"
    echo "  - Nginx:       $(nginx -v 2>&1 | cut -d'/' -f2 || echo 'nicht installiert')"
    echo "  - PM2:         $(pm2 -v 2>/dev/null || echo 'nicht installiert')"
    echo "  - Certbot:     $(certbot --version 2>/dev/null | cut -d' ' -f2 || echo 'nicht installiert')"
    echo ""
    echo "Nächste Schritte:"
    echo "  1. Wechsle zum App-Benutzer:  su - ${APP_USER}"
    echo "  2. Führe das Setup-Skript aus: bash setup-app.sh"
    echo ""
    echo "Wichtige Informationen:"
    echo "  - App-Benutzer:     ${APP_USER}"
    echo "  - App-Verzeichnis:  ${APP_DIR}"
    echo "  - Datenbank:        ${APP_USER}"
    echo "  - DB-Passwort:      Siehe /tmp/db_password.txt"
    echo ""
    echo -e "${YELLOW}WICHTIG: Lösche /tmp/db_password.txt nachdem du das Passwort notiert hast!${NC}"
    echo ""
}

#===============================================================================
# Hauptprogramm
#===============================================================================

main() {
    echo ""
    echo "==============================================================================="
    echo "  LevelMission - Hetzner Server Installation"
    echo "  Für Ubuntu 22.04 LTS"
    echo "==============================================================================="
    echo ""

    check_root

    prepare_system
    install_nodejs
    install_postgresql
    install_nginx
    install_pm2
    install_certbot
    create_app_user
    setup_database
    setup_firewall
    prepare_app_directory

    print_summary
}

# Skript starten
main "$@"
