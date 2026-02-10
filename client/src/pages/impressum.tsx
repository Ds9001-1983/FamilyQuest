import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Impressum() {
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
          <h1 className="text-2xl font-bold text-gray-900">Impressum</h1>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">Angaben gemäß § 5 TMG</h2>
            <div className="text-gray-600 space-y-1">
              <p className="font-medium">[Ihr Name / Firmenname]</p>
              <p>[Straße und Hausnummer]</p>
              <p>[PLZ und Ort]</p>
              <p>Deutschland</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">Kontakt</h2>
            <div className="text-gray-600 space-y-1">
              <p>E-Mail: [ihre-email@example.com]</p>
              <p>Telefon: [Ihre Telefonnummer] (optional)</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">Verantwortlich für den Inhalt</h2>
            <p className="text-gray-600">
              [Ihr Name]<br />
              [Adresse wie oben]
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">EU-Streitschlichtung</h2>
            <p className="text-gray-600">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="text-gray-600">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">Haftung für Inhalte</h2>
            <p className="text-gray-600">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen
              Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind
              wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte
              fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
              rechtswidrige Tätigkeit hinweisen.
            </p>
          </section>

          <div className="pt-4 border-t text-center text-sm text-gray-500">
            <p>LevelMission - Eine Familien-App</p>
            <p className="mt-1">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
