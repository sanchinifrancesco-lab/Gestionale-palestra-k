"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Cliente,
  Pagamento,
  Ingresso,
  getClientiFirebase,
  getPagamentiFirebase,
  getIngressiFirebase,
} from "../lib/storage";

export default function Home() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [pagamenti, setPagamenti] = useState<Pagamento[]>([]);
  const [ingressi, setIngressi] = useState<Ingresso[]>([]);

  useEffect(() => {
    async function caricaDati() {
      setClienti((await getClientiFirebase()) as Cliente[]);
      setPagamenti((await getPagamentiFirebase()) as Pagamento[]);
      setIngressi((await getIngressiFirebase()) as Ingresso[]);
    }

    caricaDati();
  }, []);

  const oggi = new Date().toISOString().slice(0, 10);
  const meseCorrente = new Date().toISOString().slice(0, 7);
  const annoCorrente = new Date().getFullYear().toString();

  const clientiAttivi = clienti.filter(
    (c) => c.scadenzaAbbonamento && c.scadenzaAbbonamento >= oggi
  ).length;

  const clientiScaduti = clienti.filter(
    (c) => c.scadenzaAbbonamento && c.scadenzaAbbonamento < oggi
  ).length;

  const ingressiOggi = ingressi.filter((i) =>
    i.data.startsWith(oggi)
  ).length;

  const ingressiMese = ingressi.filter((i) =>
    i.data.startsWith(meseCorrente)
  ).length;

  const incassoMese = pagamenti
    .filter((p) => p.data.startsWith(meseCorrente))
    .reduce((totale, p) => totale + p.importo, 0);

  const incassoAnno = pagamenti
    .filter((p) => p.data.startsWith(annoCorrente))
    .reduce((totale, p) => totale + p.importo, 0);

  const certificatiScaduti = clienti.filter(
    (c) => c.scadenzaCertificato && c.scadenzaCertificato < oggi
  ).length;

  const senzaIngressi = clienti.filter(
    (c) =>
      c.scadenzaAbbonamento >= oggi &&
      (c.ingressiDisponibili || 0) <= 0
  );

  const clientiPersonal = clienti.filter(
    (c) =>
      c.gruppo?.trim().toLowerCase().includes("personal") ||
      (c.lezioniPersonalDisponibili || 0) > 0
  ).length;
  const gruppiClienti = clienti.reduce((acc, cliente) => {
  const gruppo =
    cliente.gruppo?.trim() || "Senza gruppo";

  acc[gruppo] =
    (acc[gruppo] || 0) + 1;

  return acc;
}, {} as Record<string, number>);

  const ultimiPagamenti = [...pagamenti]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 5);

  function nomeCliente(id: string) {
    const cliente = clienti.find((c) => c.id === id);
    return cliente ? `${cliente.cognome} ${cliente.nome}` : "Cliente";
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            Gestionale Palestra K
          </h1>
          <p className="text-gray-600 mt-2">
            Dashboard operativa
          </p>
        </div>

        <div className="text-sm text-gray-600">
          Oggi: {oggi}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  <Link href="/clienti">
    <Card title="Clienti attivi" value={clientiAttivi} />
  </Link>

  <Link href="/non-rinnovati">
    <Card title="Clienti scaduti" value={clientiScaduti} warning />
  </Link>

  <Link href="/ingressi">
    <Card title="Ingressi oggi" value={ingressiOggi} />
  </Link>

  <Link href="/pagamenti">
    <Card title="Incasso mese" value={`€ ${incassoMese}`} />
  </Link>

  <Link href="/ingressi">
    <Card title="Ingressi mese" value={ingressiMese} />
  </Link>

  <Link href="/pagamenti">
    <Card title="Incasso anno" value={`€ ${incassoAnno}`} />
  </Link>

  <Link href="/scadenze">
    <Card title="Certificati scaduti" value={certificatiScaduti} warning />
  </Link>

  <Link href="/personal">
    <Card title="Clienti Personal" value={clientiPersonal} />
  </Link>
</div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-10">
        <Menu href="/clienti" label="Clienti" />
        <Menu href="/nuovo-cliente" label="Nuovo Cliente" />
        <Menu href="/pagamenti" label="Pagamenti" />
        <Menu href="/scanner" label="Scanner QR" />
        <Menu href="/ingressi" label="Report Ingressi" />
        <Menu href="/scadenze" label="Certificati" />
        <Menu href="/personal" label="Personal" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="bg-white rounded-2xl p-6 shadow">
  <h2 className="text-2xl font-bold mb-4">
    Gruppi / Orari
  </h2>

  {Object.keys(gruppiClienti).length === 0 ? (
    <p className="text-gray-600">
      Nessun gruppo registrato.
    </p>
  ) : (
    <div className="space-y-3">
      {Object.entries(gruppiClienti)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([gruppo, totale]) => (
          <div
            key={gruppo}
            className="border rounded-xl p-3 flex justify-between"
          >
            <strong>{gruppo}</strong>
            <span>{totale} clienti</span>
          </div>
        ))}
    </div>
  )}
</section>

        <section className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">
            Attivi senza ingressi
          </h2>

          {senzaIngressi.length === 0 ? (
            <p className="text-gray-600">
              Nessun cliente attivo senza ingressi.
            </p>
          ) : (
            <div className="space-y-3">
              {senzaIngressi.slice(0, 8).map((cliente) => (
                <div key={cliente.id} className="border rounded-xl p-3">
                  <strong>
                    {cliente.cognome} {cliente.nome}
                  </strong>
                  <p className="text-sm">
                    Scadenza: {cliente.scadenzaAbbonamento}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">
            Ultimi pagamenti
          </h2>

          {ultimiPagamenti.length === 0 ? (
            <p className="text-gray-600">
              Nessun pagamento registrato.
            </p>
          ) : (
            <div className="space-y-3">
              {ultimiPagamenti.map((pagamento) => (
                <div key={pagamento.id} className="border rounded-xl p-3">
                  <strong>
                    {nomeCliente(pagamento.clienteId)}
                  </strong>
                  <p className="text-sm">
                    € {pagamento.importo} — {pagamento.metodo}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pagamento.data}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  value,
  warning,
}: {
  title: string;
  value: string | number;
  warning?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-600">
        {title}
      </h2>

      <p
        className={`text-4xl mt-4 font-bold ${
          warning ? "text-red-600" : "text-black"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Menu({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="bg-black text-white rounded-xl p-5 text-center font-semibold"
    >
      {label}
    </Link>
  );
}
