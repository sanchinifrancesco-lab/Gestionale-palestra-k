"use client";

import { useEffect, useRef, useState } from "react";
const playSound = (tipo: "ok" | "errore" | "gia") => {
  const audio = new Audio(`/sounds/${tipo}.mp3`);

  audio.play().catch(() => {});
};
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";

import {
  Cliente,
  Ingresso,
  getClientiFirebase,
  getIngressiFirebase,
  saveIngressi,
  salvaIngressoSingoloFirebase,
  salvaClienteSingoloFirebase,
} from "../../lib/storage";

export default function ScannerPage() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [ingressi, setIngressi] = useState<Ingresso[]>([]);

  const [messaggio, setMessaggio] = useState(
    "Pronto per scannerizzare"
  );

  const [ultimoCliente, setUltimoCliente] =
    useState("-");
    

  useEffect(() => {
    async function caricaDati() {
      const clientiFirebase =
        await getClientiFirebase();

      const ingressiFirebase =
        await getIngressiFirebase();

      setClienti(
        clientiFirebase as Cliente[]
      );

      setIngressi(
        ingressiFirebase as Ingresso[]
      );

      saveIngressi(
        ingressiFirebase as Ingresso[]
      );
    }

    caricaDati();
  }, []);

  async function registraIngresso(
    clienteId: string
  ) {
    const cliente = clienti.find(
      (c) => c.id === clienteId
    );

    if (!cliente) {
      setUltimoCliente("-");
      setMessaggio("QR non riconosciuto");
      return;
    }

    const oggi = new Date()
      .toISOString()
      .slice(0, 10);

    const giaEntratoOggi =
      ingressi.some(
        (ingresso) =>
          ingresso.clienteId ===
            cliente.id &&
          ingresso.data.startsWith(oggi)
      );

    if (giaEntratoOggi) {
      setUltimoCliente(
        `${cliente.nome} ${cliente.cognome}`
      );

      setMessaggio(
        "GIÀ REGISTRATO OGGI"
      );
      playSound("gia");

      return;
    }

    let esito = "OK";

    if (
      cliente.scadenzaAbbonamento &&
      cliente.scadenzaAbbonamento < oggi
    ) {
      esito = "ABBONAMENTO SCADUTO";
    }

    if (
      cliente.scadenzaCertificato &&
      cliente.scadenzaCertificato < oggi
    ) {
      esito = "CERTIFICATO SCADUTO";
    }

    const nuovoIngresso: Ingresso = {
      id: "ingresso_" + Date.now(),
      clienteId: cliente.id,
      data: new Date().toISOString(),
      esito,
    };

    const aggiornati = [
      ...ingressi,
      nuovoIngresso,
    ];

    setIngressi(aggiornati);

    saveIngressi(aggiornati);

    await salvaIngressoSingoloFirebase(
      nuovoIngresso
    );
    const clienteAggiornato: Cliente = {
  ...cliente,
  ingressiDisponibili:
    (cliente.ingressiDisponibili || 0) - 1,
};

await salvaClienteSingoloFirebase(clienteAggiornato);

setClienti(
  clienti.map((c) =>
    c.id === cliente.id ? clienteAggiornato : c
  )
);

    setUltimoCliente(
      `${cliente.nome} ${cliente.cognome}`
    );

    setMessaggio(esito);
    if (esito === "OK") {
  playSound("ok");
} else {
  playSound("errore");
}
    
  }

  useEffect(() => {
    if (scannerRef.current) return;

    scannerRef.current =
      new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        false
      );

    scannerRef.current.render(
      (decodedText) => {
        registraIngresso(decodedText);
      },
      () => {}
    );

    return () => {
      scannerRef.current
        ?.clear()
        .catch(() => {});

      scannerRef.current = null;
    };
  }, [clienti, ingressi]);

  const coloreMessaggio =
    messaggio === "OK"
      ? "text-green-600"
      : messaggio ===
        "GIÀ REGISTRATO OGGI"
      ? "text-blue-600"
      : "text-red-600";

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link
        href="/"
        className="underline text-sm"
      >
        ← Torna alla dashboard
      </Link>

      <h1 className="text-4xl font-bold my-8">
        Scanner QR
      </h1>

      <div className="bg-white rounded-2xl p-6 shadow max-w-xl mb-6">
        <div id="qr-reader"></div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow max-w-xl">
        <h2 className="text-xl font-semibold">
          Ultimo ingresso
        </h2>

        <p className="text-2xl mt-3">
          {ultimoCliente}
        </p>

        <p
          className={`text-3xl font-bold mt-2 ${coloreMessaggio}`}
        >
          {messaggio}
        </p>
      </div>
    </main>
  );
}