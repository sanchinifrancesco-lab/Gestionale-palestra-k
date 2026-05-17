"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cliente, getClienti } from "../../lib/storage";

export default function ScadenzePage() {
  const [clienti, setClienti] = useState<Cliente[]>([]);

  useEffect(() => {
    setClienti(getClienti());
  }, []);

  const oggi = new Date();

  const certificatiInScadenza = clienti.filter((cliente) => {
    if (!cliente.scadenzaCertificato) return false;

    const scadenza = new Date(cliente.scadenzaCertificato);

    const differenza =
      (scadenza.getTime() - oggi.getTime()) /
      (1000 * 60 * 60 * 24);

    return differenza <= 30;
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link href="/" className="underline text-sm">
        ← Torna alla dashboard
      </Link>

      <h1 className="text-4xl font-bold my-8">
        Certificati Medici
      </h1>

      <div className="bg-white rounded-2xl p-6 shadow mb-6">
        <h2 className="text-xl font-semibold">
          Certificati in scadenza entro 30 giorni
        </h2>

        <p className="text-3xl mt-2">
          {certificatiInScadenza.length}
        </p>
      </div>

      <div className="space-y-4">
        {certificatiInScadenza.length === 0 ? (
          <div className="bg-white rounded-xl p-4 shadow">
            Nessun certificato in scadenza.
          </div>
        ) : (
          certificatiInScadenza.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-white rounded-2xl p-6 shadow"
            >
              <h2 className="text-2xl font-bold">
                {cliente.nome} {cliente.cognome}
              </h2>

              <p>📞 {cliente.telefono}</p>

              <p className="mt-2 text-orange-600 font-semibold">
                Certificato scade il:
                {" "}
                {cliente.scadenzaCertificato}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}