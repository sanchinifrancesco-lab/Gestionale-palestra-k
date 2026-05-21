"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cliente, getClientiFirebase } from "../../lib/storage";

export default function NonRinnovatiPage() {
  const [clienti, setClienti] = useState<Cliente[]>([]);

  useEffect(() => {
    async function caricaClienti() {
      const clientiFirebase = await getClientiFirebase();
      setClienti(clientiFirebase as Cliente[]);
    }

    caricaClienti();
  }, []);

  const oggi = new Date();

  const nonRinnovati = clienti.filter((cliente) => {
    if (!cliente.scadenzaAbbonamento) return false;

    const scadenza = new Date(cliente.scadenzaAbbonamento);

    const giorniScaduto =
      (oggi.getTime() - scadenza.getTime()) / (1000 * 60 * 60 * 24);

    return giorniScaduto >= 15;
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link href="/" className="underline text-sm">
        ← Torna alla dashboard
      </Link>

      <h1 className="text-4xl font-bold my-8">Clienti non rinnovati</h1>

      <div className="bg-white rounded-2xl p-6 shadow mb-6">
        <h2 className="text-xl font-semibold">
          Totale clienti da recuperare
        </h2>

        <p className="text-3xl mt-2">{nonRinnovati.length}</p>
      </div>

      <div className="space-y-4">
        {nonRinnovati.length === 0 ? (
          <div className="bg-white rounded-xl p-4 shadow">
            Nessun cliente non rinnovato.
          </div>
        ) : (
          nonRinnovati.map((cliente, index) => (
            <div
              key={`${cliente.id}-${index}`}
              className="bg-white rounded-2xl p-6 shadow"
            >
              <h2 className="text-2xl font-bold">
                {cliente.nome} {cliente.cognome}
              </h2>

              <p>📞 {cliente.telefono}</p>
              <p>👥 {cliente.gruppo}</p>

              <p className="text-red-600 font-semibold mt-2">
                Scaduto il {cliente.scadenzaAbbonamento}
              </p>

              <a
                href={`https://wa.me/${cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Ciao ${cliente.nome}, ti scrivo perché ho visto che non hai ancora rinnovato l'abbonamento in Palestra K. Se vuoi riprendere, ti tengo il posto nel tuo gruppo.`
                )}`}
                target="_blank"
                className="inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded-xl"
              >
                Scrivi su WhatsApp
              </a>
            </div>
          ))
        )}
      </div>
    </main>
  );
}