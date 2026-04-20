# App-Assets — TODO vor App-Store-Submission

Die aktuellen PNGs sind das Expo-Default-Placeholder-Set. Vor einer App-Store-Einreichung
müssen sie durch eigene Icons ersetzt werden. Größen und Anforderungen von Apple/Google:

| Datei | Größe | Zweck |
|---|---|---|
| `icon.png` | 1024 × 1024 px, PNG, keine Transparenz, keine Rundung | Master-Icon (Apple rundet selbst) |
| `splash-icon.png` | mind. 1242 × 1242 px, PNG, transparent | Splash-Screen-Logo (wird auf grünem BG zentriert) |
| `favicon.png` | 48 × 48 px, PNG | Web-Favicon |
| `android-icon-foreground.png` | 432 × 432 px, PNG, transparent | Android Adaptive Icon (Vordergrund) |
| `android-icon-background.png` | 432 × 432 px, PNG | Android Adaptive Icon (Hintergrund) — wird von `backgroundColor` im `app.json` überlagert, daher optional |
| `android-icon-monochrome.png` | 432 × 432 px, PNG, monochrom | Android 13+ Themed Icon |

## Design-Konventionen
- Primärfarbe **`#059669`** (Mission-Grün) für Splash-BG
- Dark-Splash-BG **`#0b3d2e`**
- Icon-Motiv: am besten ein stilisiertes Schild / Level-Badge / Missions-Pin in Weiß auf Grün

## Empfohlener Workflow
1. Icon in Figma / Illustrator designen (1024×1024)
2. Mit https://www.appicon.co oder `npx @expo/assets-worker` in Größen exportieren
3. Dateien hier ablegen
4. `npm run prebuild` — Expo generiert native Icons
