"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  Cliente,
  Pagamento,
  Ingresso,
  LezionePersonal,
  getClientiFirebase,
  getPagamentiFirebase,
  getIngressiFirebase,
  getLezioniPersonalFirebase,
  salvaClienteSingoloFirebase,
} from "../../../lib/storage";

export default function SchedaCliente() {
  const params = useParams();
  const clienteId = params.id as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pagamenti, setPagamenti] = useState<Pagamento[]>([]);
  const [ingressi, setIngressi] = useState<Ingresso[]>([]);
  const [lezioni, setLezioni] = useState<LezionePersonal[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    async function caricaDati() {
      const clienti = (await getClientiFirebase()) as Cliente[];
      const trovato = clienti.find((c) => c.id === clienteId) || null;

      setCliente(trovato);
      setNote(trovato?.noteCliente || "");

      const tuttiPagamenti = (await getPagamentiFirebase()) as Pagamento[];
      setPagamenti(tuttiPagamenti.filter((p) => p.clienteId === clienteId));

      const tuttiIngressi = (await getIngressiFirebase()) as Ingresso[];
      setIngressi(tuttiIngressi.filter((i) => i.clienteId === clienteId));

      const tutteLezioni =
        (await getLezioniPersonalFirebase()) as LezionePersonal[];
      setLezioni(tutteLezioni.filter((l) => l.clienteId === clienteId));
    }

    caricaDati();
  }, [clienteId]);

  if (!cliente) {
    return <main className="p-8">Cliente non trovato</main>;
  }

  const totalePagato = pagamenti.reduce((totale, p) => totale + p.importo, 0);

  const ingressiOrdinati = [...ingressi].sort((a, b) =>
    b.data.localeCompare(a.data)
  );

  const pagamentiOrdinati = [...pagamenti].sort((a, b) =>
    b.data.localeCompare(a.data)
  );

  const ultimiIngressi = ingressiOrdinati.slice(0, 5);

  const ingressiMese = ingressi.filter((i) =>
    i.data.startsWith(new Date().toISOString().slice(0, 7))
  ).length;

  const mesi = ultimi5Mesi();
  const datiGrafico = mesi.map((mese) => ({
    mese,
    valore: ingressi.filter((i) => i.data.startsWith(mese.key)).length,
  }));

  const maxValore = Math.max(...datiGrafico.map((d) => d.valore), 1);

  async function salvaNote() {
  if (!cliente) return;

  const aggiornato: Cliente = {
    ...cliente,
    noteCliente: note,
  };

  await salvaClienteSingoloFirebase(aggiornato);

  setCliente(aggiornato);

  alert("Note salvate");
}

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link href="/clienti" className="underline text-sm">
        ← Torna ai clienti
      </Link>

      <h1 className="text-4xl font-bold mt-6 mb-2">
        {cliente.cognome} {cliente.nome}
      </h1>

      <p className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-semibold mb-8">
        {cliente.tipoAbbonamento || "Cliente"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <section className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">
            Storico Pagamenti
          </h2>

          {pagamentiOrdinati.length === 0 ? (
            <p className="text-gray-500">Nessun pagamento registrato.</p>
          ) : (
            <div className="space-y-3">
              {pagamentiOrdinati.map((p) => (
                <div key={p.id} className="border rounded-xl p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{p.metodo}</p>
                      <p className="text-sm text-gray-500">{p.data}</p>
                    </div>

                    <p className="font-bold text-green-600">
                      € {p.importo}
                    </p>
                  </div>
                </div>
              ))}

              <p className="text-xl font-bold text-center pt-4">
                Totale pagato:{" "}
                <span className="text-green-600">€ {totalePagato}</span>
              </p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">
            Storico Ingressi
          </h2>

          {ultimiIngressi.length === 0 ? (
            <p className="text-gray-500">Nessun ingresso registrato.</p>
          ) : (
            <div className="space-y-3">
              {ultimiIngressi.map((i) => (
                <div key={i.id} className="border rounded-xl p-4">
                  <p className="font-semibold">{i.esito}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(i.data).toLocaleString("it-IT")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">
            Note Cliente
          </h2>

          <textarea
            className="w-full border rounded-xl p-4 min-h-[180px]"
            placeholder="Scrivi note sul cliente..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button
            onClick={salvaNote}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl mt-4"
          >
            Salva note
          </button>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">
            Riepilogo Attività
          </h2>

          <p className="text-4xl font-bold text-blue-600">
            {ingressiMese}
          </p>
          <p className="text-gray-600 mb-6">
            ingressi questo mese
          </p>

          <div className="space-y-3">
            {datiGrafico.map((d) => (
              <div key={d.mese.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{d.mese.label}</span>
                  <span>{d.valore}</span>
                </div>

                <div className="bg-gray-200 h-3 rounded-full">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{
                      width: `${(d.valore / maxValore) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {lezioni.length > 0 && (
        <section className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">
            Storico Personal
          </h2>

          <div className="space-y-3">
            {lezioni.map((l) => (
              <div key={l.id} className="border rounded-xl p-4">
                <p className="font-semibold">{l.tipoLezione}</p>
                <p>{l.note}</p>
                <p className="text-sm text-gray-500">
                  {new Date(l.data).toLocaleString("it-IT")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ultimi5Mesi() {
  const oggi = new Date();

  return Array.from({ length: 5 }).map((_, index) => {
    const data = new Date(oggi.getFullYear(), oggi.getMonth() - 4 + index, 1);

    return {
      key: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(
        2,
        "0"
      )}`,
      label: data.toLocaleDateString("it-IT", {
        month: "short",
      }),
    };
  });
}