"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cliente,
  Ingresso,
  getClientiFirebase,
  getIngressiFirebase,
  eliminaIngressoFirebase,
} from "../../lib/storage";
import { clienteCorrispondeAllaRicerca } from "../../lib/ricerca";

export default function IngressiPage() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [ingressi, setIngressi] = useState<Ingresso[]>([]);
  const [ricerca, setRicerca] = useState("");

  const meseCorrente = new Date().toISOString().slice(0, 7);
  const [mese, setMese] = useState(meseCorrente);

  useEffect(() => {
    async function caricaDati() {
      setClienti((await getClientiFirebase()) as Cliente[]);
      setIngressi((await getIngressiFirebase()) as Ingresso[]);
    }

    caricaDati();
  }, []);

  async function eliminaIngresso(ingressoId: string) {
    const conferma = confirm("Eliminare questo ingresso?");
    if (!conferma) return;

    await eliminaIngressoFirebase(ingressoId);

    setIngressi(
      ingressi.filter((ingresso) => ingresso.id !== ingressoId)
    );

    alert("Ingresso eliminato");
  }

  const ingressiDelMese = ingressi.filter((ingresso) =>
    ingresso.data.startsWith(mese)
  );

  const reportClienti = clienti
    .filter((cliente) =>
      clienteCorrispondeAllaRicerca(cliente, ricerca)
    )
    .map((cliente) => {
      const ingressiCliente = ingressiDelMese.filter(
        (ingresso) => ingresso.clienteId === cliente.id
      );

      return {
        cliente,
        totale: ingressiCliente.length,
        ingressi: ingressiCliente,
      };
    })
    .filter((riga) => riga.totale > 0)
    .sort((a, b) => b.totale - a.totale);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link href="/" className="underline text-sm">
        ← Torna alla dashboard
      </Link>

      <h1 className="text-4xl font-bold my-8">
        Report Mensile Ingressi
      </h1>

      <div className="bg-white rounded-2xl p-6 shadow mb-6 max-w-xl">
        <label className="block font-semibold mb-2">
          Seleziona mese
        </label>

        <input
          type="month"
          value={mese}
          onChange={(e) => setMese(e.target.value)}
          className="border p-3 rounded-xl w-full"
        />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow mb-6 max-w-xl">
        <label className="block font-semibold mb-2">
          Cerca cliente
        </label>

        <input
          type="text"
          placeholder="Nome o telefono..."
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          className="border p-3 rounded-xl w-full"
        />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow mb-6">
        <h2 className="text-xl font-semibold">
          Totale ingressi nel mese
        </h2>

        <p className="text-3xl mt-2">
          {ingressiDelMese.length}
        </p>
      </div>

      <div className="space-y-4">
        {reportClienti.length === 0 ? (
          <div className="bg-white rounded-xl p-4 shadow">
            Nessun ingresso registrato per questo mese.
          </div>
        ) : (
          reportClienti.map((riga) => (
            <div
              key={riga.cliente.id}
              className="bg-white rounded-2xl p-6 shadow"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {riga.cliente.nome} {riga.cliente.cognome}
                  </h2>

                  <p className="text-gray-600">
                    👥 {riga.cliente.gruppo}
                  </p>

                  <p className="text-gray-600">
                    📞 {riga.cliente.telefono}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Ingressi mese
                  </p>

                  <p className="text-4xl font-bold">
                    {riga.totale}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <p className="font-semibold mb-2">
                  Dettaglio ingressi:
                </p>

                <div className="space-y-2">
                  {riga.ingressi.map((ingresso) => (
                    <div
                      key={ingresso.id}
                      className="flex justify-between items-center border rounded-xl p-3"
                    >
                      <div>
                        <p>
                          {new Date(ingresso.data).toLocaleString("it-IT")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {ingresso.esito}
                        </p>
                      </div>

                      <button
                        onClick={() => eliminaIngresso(ingresso.id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-xl text-sm"
                      >
                        Elimina
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
