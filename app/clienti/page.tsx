"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Cliente,
  getClientiFirebase,
  saveClienti,
  salvaClienteSingoloFirebase,
} from "../../lib/storage";

export default function ClientiPage() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [ricerca, setRicerca] = useState("");
  const [clienteInModifica, setClienteInModifica] = useState<string | null>(null);

  useEffect(() => {
    async function caricaClienti() {
      const clientiFirebase = await getClientiFirebase();
      setClienti(clientiFirebase as Cliente[]);
      saveClienti(clientiFirebase as Cliente[]);
    }

    caricaClienti();
  }, []);

  function aggiornaCliente(id: string, campo: keyof Cliente, valore: string | boolean) {
    const aggiornati = clienti.map((cliente) =>
      cliente.id === id ? { ...cliente, [campo]: valore } : cliente
    );

    setClienti(aggiornati);
    saveClienti(aggiornati);

    const clienteAggiornato = aggiornati.find((cliente) => cliente.id === id);

    if (clienteAggiornato) {
      salvaClienteSingoloFirebase(clienteAggiornato);
    }
  }

  function salvaModifica() {
    setClienteInModifica(null);
    alert("Cliente aggiornato");
  }

  const clientiFiltrati = clienti.filter((cliente) =>
    `${cliente.nome} ${cliente.cognome} ${cliente.telefono}`
      .toLowerCase()
      .includes(ricerca.toLowerCase())
  );

  const oggi = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
  <h1 className="text-4xl font-bold">
    Clienti
  </h1>

  <div className="flex gap-3">

    <Link
      href="/nuovo-cliente"
      className="bg-black text-white px-5 py-3 rounded-xl"
    >
      + Nuovo Cliente
    </Link>

    <button
      onClick={async () => {
        const locali = JSON.parse(
          localStorage.getItem("clienti") || "[]"
        );

        for (const cliente of locali) {
          await salvaClienteSingoloFirebase(cliente);
        }

        alert(`Migrati ${locali.length} clienti su Firebase`);
      }}
      className="bg-blue-600 text-white px-5 py-3 rounded-xl"
    >
      Migra su Firebase
    </button>

  </div>
</div>

      <input
        type="text"
        placeholder="Cerca nome o telefono..."
        className="w-full max-w-md border p-3 rounded-xl mb-6"
        value={ricerca}
        onChange={(e) => setRicerca(e.target.value)}
      />

      <div className="space-y-4">
        {clientiFiltrati.map((cliente) => {
          const inModifica = clienteInModifica === cliente.id;

          const abbonamentoScaduto =
            cliente.scadenzaAbbonamento && cliente.scadenzaAbbonamento < oggi;

          const certificatoScaduto =
            cliente.scadenzaCertificato && cliente.scadenzaCertificato < oggi;

          return (
            <div key={cliente.id} className="bg-white rounded-2xl p-6 shadow">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-3">
                  {inModifica ? (
                    <>
                      <input className="w-full border p-3 rounded" value={cliente.nome} onChange={(e) => aggiornaCliente(cliente.id, "nome", e.target.value)} placeholder="Nome" />
                      <input className="w-full border p-3 rounded" value={cliente.cognome} onChange={(e) => aggiornaCliente(cliente.id, "cognome", e.target.value)} placeholder="Cognome" />
                      <input className="w-full border p-3 rounded" value={cliente.telefono} onChange={(e) => aggiornaCliente(cliente.id, "telefono", e.target.value)} placeholder="Telefono" />
                      <input className="w-full border p-3 rounded" value={cliente.email} onChange={(e) => aggiornaCliente(cliente.id, "email", e.target.value)} placeholder="Email" />
                      <input className="w-full border p-3 rounded" value={cliente.gruppo} onChange={(e) => aggiornaCliente(cliente.id, "gruppo", e.target.value)} placeholder="Gruppo" />

                      <label className="block">
                        Scadenza abbonamento
                        <input type="date" className="w-full border p-3 rounded mt-1" value={cliente.scadenzaAbbonamento} onChange={(e) => aggiornaCliente(cliente.id, "scadenzaAbbonamento", e.target.value)} />
                      </label>

                      <label className="block">
                        Scadenza certificato
                        <input type="date" className="w-full border p-3 rounded mt-1" value={cliente.scadenzaCertificato} onChange={(e) => aggiornaCliente(cliente.id, "scadenzaCertificato", e.target.value)} />
                      </label>

                      <button onClick={salvaModifica} className="bg-green-600 text-white px-5 py-3 rounded-xl">
                        Salva modifiche
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-semibold">
                        {cliente.nome} {cliente.cognome}
                      </h2>

                      <p>📞 {cliente.telefono}</p>
                      <p>✉️ {cliente.email}</p>
                      <p>👥 {cliente.gruppo}</p>

                      <p className={`font-semibold ${abbonamentoScaduto ? "text-red-600" : "text-green-600"}`}>
                        📅 Abbonamento: {cliente.scadenzaAbbonamento}
                      </p>

                      <p className={`font-semibold ${certificatoScaduto ? "text-orange-600" : "text-green-600"}`}>
                        🩺 Certificato: {cliente.scadenzaCertificato}
                      </p>

                      <button onClick={() => setClienteInModifica(cliente.id)} className="bg-black text-white px-5 py-3 rounded-xl mt-3">
                        Modifica
                      </button>
                    </>
                  )}
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div id={`qr-${cliente.id}`} className="w-[140px] h-[140px] flex items-center justify-center bg-white p-2 border">
                    <QRCodeSVG value={cliente.id} size={120} />
                  </div>

                  <button
                    onClick={() => {
                      const contenuto = document.getElementById(`qr-${cliente.id}`)?.innerHTML;
                      const finestra = window.open("", "_blank");

                      if (!finestra || !contenuto) return;

                      finestra.document.write(`
                        <html>
                          <head>
                            <title>QR ${cliente.nome} ${cliente.cognome}</title>
                          </head>
                          <body style="font-family: Arial; text-align: center; padding: 40px;">
                            <h2>${cliente.nome} ${cliente.cognome}</h2>
                            <p>Palestra K</p>
                            ${contenuto}
                            <br/><br/>
                            <button onclick="window.print()">Stampa QR</button>
                          </body>
                        </html>
                      `);

                      finestra.document.close();
                    }}
                    className="bg-black text-white px-4 py-2 rounded-xl"
                  >
                    Stampa QR
                  </button>

                  <a
                    href={`https://wa.me/${cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Ciao ${cliente.nome}, questo è il tuo QR personale per l’ingresso in Palestra K. Salvalo sul telefono e mostralo quando entri.`
                    )}`}
                    target="_blank"
                    className="bg-green-600 text-white px-4 py-2 rounded-xl"
                  >
                    Invia WhatsApp
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}