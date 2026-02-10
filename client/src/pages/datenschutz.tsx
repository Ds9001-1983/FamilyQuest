import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Datenschutz() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Zurück zur App
        </button>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Datenschutzerklärung</h1>
          <p className="text-sm text-gray-500">Stand: {new Date().toLocaleDateString('de-DE')}</p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">1. Verantwortlicher</h2>
            <p className="text-gray-600">
              Verantwortlich für die Datenverarbeitung ist der im Impressum genannte Betreiber.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">2. Erhobene Daten</h2>
            <p className="text-gray-600">Wir erheben und verarbeiten folgende Daten:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>E-Mail-Adresse (für die Registrierung)</li>
              <li>Familienname</li>
              <li>Namen und Alter der Kinder (optional)</li>
              <li>Aufgaben und Belohnungen</li>
              <li>XP-Punkte und Fortschrittsdaten</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">3. Zweck der Datenverarbeitung</h2>
            <p className="text-gray-600">
              Die Daten werden ausschließlich zur Bereitstellung der App-Funktionen verwendet:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Benutzerauthentifizierung</li>
              <li>Speicherung von Aufgaben und Fortschritt</li>
              <li>Synchronisation zwischen Geräten</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">4. Datenschutz bei Kindern</h2>
            <p className="text-gray-600">
              Diese App ist für die Nutzung durch Familien konzipiert. Kinderdaten werden
              nur mit Zustimmung der Eltern erhoben und niemals an Dritte weitergegeben.
              Eltern haben jederzeit die Möglichkeit, die Daten ihrer Kinder einzusehen,
              zu ändern oder zu löschen.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">5. Datenspeicherung</h2>
            <p className="text-gray-600">
              Die Daten werden auf sicheren Servern gespeichert. Die Übertragung erfolgt
              verschlüsselt (HTTPS). Passwörter werden gehasht und können nicht im Klartext
              eingesehen werden.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">6. Ihre Rechte</h2>
            <p className="text-gray-600">Sie haben das Recht auf:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Auskunft über Ihre gespeicherten Daten</li>
              <li>Berichtigung unrichtiger Daten</li>
              <li>Löschung Ihrer Daten</li>
              <li>Einschränkung der Verarbeitung</li>
              <li>Datenübertragbarkeit</li>
              <li>Widerspruch gegen die Verarbeitung</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">7. Kontakt</h2>
            <p className="text-gray-600">
              Bei Fragen zum Datenschutz wenden Sie sich bitte an die im Impressum
              angegebene Kontaktadresse.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">8. Cookies</h2>
            <p className="text-gray-600">
              Diese App verwendet nur technisch notwendige Cookies für die Session-Verwaltung.
              Es werden keine Tracking- oder Werbe-Cookies verwendet.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
