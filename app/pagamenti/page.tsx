"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cliente,
  Pagamento,
  getClienti,
  getPagamenti,
  savePagamenti,
  aggiornaScadenzaAbbonamento,
} from "../../lib/storage";

export default function PagamentiPage() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [pagamenti, setPagamenti] = useState<Pagamento[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [voce, setVoce] = useState("Mensile");
  const [importo, setImporto] = useState("65");
  const [metodo, setMetodo] = useState("contanti");

  useEffect(() => {
    setClienti(getClienti());
    setPagamenti(getPagamenti());
  }, []);

  function registraPagamento(e: React.FormEvent) {
    e.preventDefault();

    if (!clienteId || !importo) {
      alert("Seleziona cliente e inserisci importo");
      return;
    }

    const nuovoPagamento: Pagamento = {
      id: "pagamento_" + Date.now(),
      clienteId,
      importo: Number(importo),
      metodo: `${metodo} - ${voce}`,
      data: new Date().toISOString().slice(0, 10),
    };

    const nuoviPagamenti = [...pagamenti, nuovoPagamento];
    savePagamenti(nuoviPagamenti);
    setPagamenti(nuoviPagamenti);

    if (voce === "Mensile" && Number(importo) === 65) {
      const oggi = new Date();
      oggi.setMonth(oggi.getMonth() + 1);
      aggiornaScadenzaAbbonamento(clienteId, oggi.toISOString().slice(0, 10));
      alert("Pagamento Mensile registrato. Abbonamento rinnovato di 1 mese.");
    } else {
      alert("Pagamento registrato.");
    }

    setClienti(getClienti());
    setClienteId("");
    setVoce("Mensile");
    setImporto("65");
    setMetodo("contanti");
  }

  function nomeCliente(id: string) {
    const cliente = clienti.find((c) => c.id === id);
    return cliente ? `${cliente.nome} ${cliente.cognome}` : "Cliente non trovato";
  }

  const totale = pagamenti.reduce((sum, p) => sum + p.importo, 0);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link href="/" className="underline text-sm">
        ← Torna alla dashboard
      </Link>

      <h1 className="text-4xl font-bold my-8">Pagamenti</h1>

      <form onSubmit={registraPagamento} className="bg-white rounded-2xl p-6 shadow max-w-2xl space-y-4 mb-8">
        <select className="w-full border p-3 rounded" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Seleziona cliente</option>
          {clienti.map((cliente, index) => (
  <option
    key={`${cliente.id}-${index}`}
    value={cliente.id}
  >
              {cliente.nome} {cliente.cognome}
            </option>
          ))}
        </select>

        <select className="w-full border p-3 rounded" value={voce} onChange={(e) => {
          setVoce(e.target.value);
          if (e.target.value === "Mensile") setImporto("65");
        }}>
          <option value="Mensile">Mensile</option>
        </select>

        <input className="w-full border p-3 rounded" placeholder="Importo es. 65" value={importo} onChange={(e) => setImporto(e.target.value)} />

        <select className="w-full border p-3 rounded" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
          <option value="contanti">Contanti</option>
          <option value="pos">POS</option>
          <option value="bonifico">Bonifico</option>
          <option value="satispay">Satispay</option>
        </select>

        <button className="bg-black text-white px-6 py-3 rounded-xl font-semibold">
          Registra pagamento
        </button>
      </form>

      <div className="bg-white rounded-2xl p-6 shadow mb-6">
        <h2 className="text-xl font-semibold">Totale registrato</h2>
        <p className="text-3xl mt-2">€ {totale}</p>
      </div>

      <div className="space-y-3">
        {pagamenti.map((pagamento) => (
          <div key={pagamento.id} className="bg-white rounded-xl p-4 shadow">
            <strong>{nomeCliente(pagamento.clienteId)}</strong>
            <p>€ {pagamento.importo} — {pagamento.metodo}</p>
            <p className="text-sm text-gray-500">{pagamento.data}</p>
          </div>
        ))}
      </div>
    </main>
  );
}