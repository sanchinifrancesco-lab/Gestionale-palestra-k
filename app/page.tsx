"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cliente, getClienti, getIngressi, getPagamenti } from "../lib/storage";

export default function Home() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [ingressiOggi, setIngressiOggi] = useState(0);
  const [incassoMese, setIncassoMese] = useState(0);

  useEffect(() => {
    const clientiSalvati = getClienti();
    const ingressiSalvati = getIngressi();
    const pagamentiSalvati = getPagamenti();

    const oggi = new Date().toISOString().slice(0, 10);
    const mese = new Date().toISOString().slice(0, 7);

    setClienti(clientiSalvati);

    setIngressiOggi(
      ingressiSalvati.filter((ingresso) =>
        ingresso.data.startsWith(oggi)
      ).length
    );

    setIncassoMese(
      pagamentiSalvati
        .filter((pagamento) => pagamento.data.startsWith(mese))
        .reduce((totale, pagamento) => totale + pagamento.importo, 0)
    );
  }, []);

  const oggi = new Date().toISOString().slice(0, 10);

  const clientiAttivi = clienti.filter(
    (cliente) => cliente.attivo
  ).length;

  const scadenze = clienti.filter(
    (cliente) =>
      cliente.scadenzaAbbonamento < oggi ||
      cliente.scadenzaCertificato < oggi
  ).length;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8">
        Gestionale Palestra K
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card title="Clienti Attivi" value={clientiAttivi} />
        <Card title="Ingressi Oggi" value={ingressiOggi} />
        <Card title="Scadenze" value={scadenze} />
        <Card title="Incasso Mese" value={`€ ${incassoMese}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Menu href="/clienti" label="Clienti" />
        <Menu href="/nuovo-cliente" label="Nuovo Cliente" />
        <Menu href="/pagamenti" label="Pagamenti" />
         <Menu href="/personal" label="Personal" />
        <Menu href="/scanner" label="Scanner QR" />
        <Menu href="/scadenze" label="Scadenze" />
        <Menu href="/ingressi" label="Report Ingressi" />
        <Menu href="/non-rinnovati" label="Non Rinnovati" />
      </div>
    </main>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-3xl mt-4">{value}</p>
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
