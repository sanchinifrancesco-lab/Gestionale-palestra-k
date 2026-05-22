"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Cliente,
  Ingresso,
  getClientiFirebase,
  saveClienti,
  salvaClienteSingoloFirebase,
  eliminaClienteFirebase,
  salvaIngressoSingoloFirebase,
} from "../../lib/storage";

export default function ClientiPage() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [ricerca, setRicerca] = useState("");
  const [clienteInModifica, setClienteInModifica] = useState<string | null>(null);

  useEffect(() => {
    async function caricaClienti() {
      const clientiFirebase = await getClientiFirebase();
      const clientiSistemati = (clientiFirebase as Cliente[]).map((cliente) => ({
  ...cliente,
  ingressiDisponibili: cliente.ingressiDisponibili || 0,
  tipoAbbonamento: cliente.tipoAbbonamento || "",
}));

setClienti(clientiSistemati);


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

  function salvaModifica(){
    async function eliminaCliente(clienteId: string) {
  const conferma = confirm(
    "Sei sicuro di voler eliminare questo cliente?"
  );

  if (!conferma) return;

  await eliminaClienteFirebase(clienteId);

  const aggiornati = clienti.filter(
    (cliente) => cliente.id !== clienteId
  );

  setClienti(aggiornati);
  saveClienti(aggiornati);

  alert("Cliente eliminato");
}
    setClienteInModifica(null);
    alert("Cliente aggiornato");
  }

  async function importaClientiCSV(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const testo = await file.text();
    const righe = testo.split("\n").filter((riga) => riga.trim() !== "");

    const nuoviClienti = righe.slice(1).map((riga, index) => {
      const colonne = riga.split(",");

      return {
        id: "cliente_" + Date.now() + "_" + index,
        cognome: colonne[0]?.trim() || "",
        nome: colonne[1]?.trim() || "",
        telefono: colonne[2]?.trim() || "",
        email: colonne[3]?.trim() || "",
        gruppo: "",
        scadenzaAbbonamento: "",
        scadenzaCertificato: "",
        attivo: true,
        ingressiDisponibili:0,
        tipoAbbonamento:"",
        lezioniPersonalDisponibili: 0,
        tipoPersonal: "",
      };
      
    });

    for (const cliente of nuoviClienti) {
      await salvaClienteSingoloFirebase(cliente);
    }

    setClienti([...clienti, ...nuoviClienti]);
    alert("Clienti importati");
}
async function registraIngressoManuale(cliente: Cliente
) {
  if (
    (cliente.ingressiDisponibili || 0) <= 0
  ) {
    alert("Ingressi esauriti");

    return;
  }

  const nuovoIngresso: Ingresso = {
    id: "ingresso_" + Date.now(),

    clienteId: cliente.id,

    data: new Date().toISOString(),

    esito: "OK MANUALE",
  };

  await salvaIngressoSingoloFirebase(
    nuovoIngresso
  );

  const clienteAggiornato: Cliente = {
    ...cliente,

    ingressiDisponibili:
      (cliente.ingressiDisponibili || 0) - 1,
  };

  await salvaClienteSingoloFirebase(
    clienteAggiornato
  );

  const aggiornati = clienti.map((c) =>
    c.id === cliente.id
      ? clienteAggiornato
      : c
  );

  setClienti(aggiornati);

  saveClienti(aggiornati);

  alert("Ingresso manuale registrato");
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
        <h1 className="text-4xl font-bold">Clienti</h1>

        <div className="flex gap-3">
          <Link href="/nuovo-cliente" className="bg-black text-white px-5 py-3 rounded-xl">
            + Nuovo Cliente
          </Link>

          <label className="bg-blue-600 text-white px-5 py-3 rounded-xl cursor-pointer">
            Importa Clienti
            <input
              type="file"
              accept=".csv"
              onChange={importaClientiCSV}
              className="hidden"
            />
          </label>
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

          async function eliminaCliente(clienteId: string) {
  const conferma = confirm("Sei sicuro di voler eliminare questo cliente?");

  if (!conferma) return;

  await eliminaClienteFirebase(clienteId);

  const aggiornati = clienti.filter((cliente) => cliente.id !== clienteId);

  setClienti(aggiornati);
  saveClienti(aggiornati);

  alert("Cliente eliminato");
}

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
                      <p>
🎫 Ingressi:
{cliente.ingressiDisponibili}
</p>

<p>
💳 Tipo:
{cliente.tipoAbbonamento}
</p>
                      <p>👥 {cliente.gruppo}</p>
                      <p> 🏋️ Personal: {cliente.tipoPersonal ? "Sì" : "No"}
</p>

                      <p className={`font-semibold ${abbonamentoScaduto ? "text-red-600" : "text-green-600"}`}>
                        📅 Abbonamento: {cliente.scadenzaAbbonamento}
                      </p>

                      <p className={`font-semibold ${certificatoScaduto ? "text-orange-600" : "text-green-600"}`}>
                        🩺 Certificato: {cliente.scadenzaCertificato}
                      </p>

                      <button onClick={() => setClienteInModifica(cliente.id)} className="bg-black text-white px-5 py-3 rounded-xl mt-3">
                        Modifica
                      </button> 
                      <button
  onClick={() =>
    registraIngressoManuale(cliente)
  }
  className="bg-blue-600 text-white px-5 py-3 rounded-xl mt-3 ml-3"
>
  Ingresso manuale
</button>
                      <button
  onClick={() => eliminaCliente(cliente.id)}
  className="bg-red-600 text-white px-5 py-3 rounded-xl mt-3 ml-3"
>
  Elimina
</button>
                      

                      
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-3">
                  <div id={`qr-${cliente.id}`} className="w-[140px] h-[140px] flex items-center justify-center bg-white p-2 border">
                    <QRCodeSVG value={cliente.id} size={120} />
                  </div>

                 <div className="flex flex-col gap-2 w-full mt-3">

  <button
    onClick={() => {
      const contenuto =
        document.getElementById(
          `qr-${cliente.id}`
        )?.innerHTML;

      const finestra = window.open(
        "",
        "_blank"
      );

      if (!finestra || !contenuto)
        return;

      finestra.document.write(`
        <html>
          <head>
            <title>
              QR ${cliente.nome}
              ${cliente.cognome}
            </title>
          </head>

          <body style="
            font-family: Arial;
            text-align: center;
            padding: 40px;
          ">
            <h2>
              ${cliente.nome}
              ${cliente.cognome}
            </h2>

            <p>Palestra K</p>

            ${contenuto}

            <br/><br/>

            <button onclick="window.print()">
              Stampa QR
            </button>
          </body>
        </html>
      `);

      finestra.document.close();
    }}
    className="bg-black text-white px-4 py-2 rounded-xl w-full"
  >
    Stampa QR
  </button>

  <button
    onClick={() => {
      const svg = document.querySelector(
        `#qr-${cliente.id} svg`
      );

      if (!svg) return;

      const serializer =
        new XMLSerializer();

      const svgString =
        serializer.serializeToString(svg);

      const blob = new Blob(
        [svgString],
        {
          type:
            "image/svg+xml;charset=utf-8",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `QR-${cliente.nome}-${cliente.cognome}.svg`;

      link.click();

      URL.revokeObjectURL(url);
    }}
    className="bg-blue-600 text-white px-4 py-2 rounded-xl w-full"
  >
    Scarica QR
  </button>

  <a
    href={`https://wa.me/${cliente.telefono.replace(
      /\D/g,
      ""
    )}?text=${encodeURIComponent(
      `Ciao ${cliente.nome},
questo è il tuo QR personale
per l’ingresso in Palestra K.`
    )}`}
    target="_blank"
    className="bg-green-600 text-white px-4 py-2 rounded-xl text-center w-full"
  >
    Invia WhatsApp
  </a>

</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}