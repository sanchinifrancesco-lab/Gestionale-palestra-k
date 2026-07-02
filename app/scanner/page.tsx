"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const playSound = (tipo: "ok" | "errore" | "gia") => {
  const audio = new Audio(`/sounds/${tipo}.mp3`);
  audio.play().catch(() => {});
};

export default function ScannerPage() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [ingressi, setIngressi] = useState<Ingresso[]>([]);
  const [messaggio, setMessaggio] = useState("Pronto per scannerizzare");
  const [ultimoCliente, setUltimoCliente] = useState("-");

  useEffect(() => {
    async function caricaDati() {
      const clientiFirebase = await getClientiFirebase();
      const ingressiFirebase = await getIngressiFirebase();

      setClienti(clientiFirebase as Cliente[]);
      setIngressi(ingressiFirebase as Ingresso[]);
      saveIngressi(ingressiFirebase as Ingresso[]);
    }

    caricaDati();
  }, []);

  const registraIngresso = useCallback(async (clienteId: string) => {
    const cliente = clienti.find((c) => c.id === clienteId);

    if (!cliente) {
      setUltimoCliente("-");
      setMessaggio("QR non riconosciuto");
      playSound("errore");
      return;
    }

    const oggi = new Date().toISOString().slice(0, 10);

    const giaEntratoOggi = ingressi.some(
      (ingresso) =>
        ingresso.clienteId === cliente.id &&
        ingresso.data.startsWith(oggi)
    );

    if (giaEntratoOggi) {
      setUltimoCliente(`${cliente.nome} ${cliente.cognome}`);
      setMessaggio("GIÀ REGISTRATO OGGI");
      playSound("gia");
      return;
    }

    if (cliente.scadenzaAbbonamento && cliente.scadenzaAbbonamento < oggi) {
      setUltimoCliente(`${cliente.nome} ${cliente.cognome}`);
      setMessaggio("ABBONAMENTO SCADUTO");
      playSound("errore");
      return;
    }

    if (cliente.scadenzaCertificato && cliente.scadenzaCertificato < oggi) {
      setUltimoCliente(`${cliente.nome} ${cliente.cognome}`);
      setMessaggio("CERTIFICATO SCADUTO");
      playSound("errore");
      return;
    }

    const recuperiValidi =
      cliente.scadenzaRecuperi &&
      cliente.scadenzaRecuperi >= oggi
        ? cliente.recuperiDisponibili || 0
        : 0;

    const ingressiNormali = cliente.ingressiDisponibili || 0;

    const totaleIngressiDisponibili =
      recuperiValidi + ingressiNormali;

    if (totaleIngressiDisponibili <= 0) {
      setUltimoCliente(`${cliente.nome} ${cliente.cognome}`);
      setMessaggio("INGRESSI ESAURITI");
      playSound("errore");
      return;
    }

    const nuovoIngresso: Ingresso = {
      id: "ingresso_" + Date.now(),
      clienteId: cliente.id,
      data: new Date().toISOString(),
      esito: recuperiValidi > 0 ? "OK RECUPERO" : "OK",
    };

    const ingressiAggiornati = [...ingressi, nuovoIngresso];

    setIngressi(ingressiAggiornati);
    saveIngressi(ingressiAggiornati);

    await salvaIngressoSingoloFirebase(nuovoIngresso);

    let clienteAggiornato: Cliente;

    if (recuperiValidi > 0) {
      clienteAggiornato = {
        ...cliente,
        recuperiDisponibili: recuperiValidi - 1,
      };
    } else {
      clienteAggiornato = {
        ...cliente,
        ingressiDisponibili: ingressiNormali - 1,
      };
    }

    await salvaClienteSingoloFirebase(clienteAggiornato);

    setClienti(
      clienti.map((c) =>
        c.id === cliente.id ? clienteAggiornato : c
      )
    );

    setUltimoCliente(`${cliente.nome} ${cliente.cognome}`);
    setMessaggio(nuovoIngresso.esito);
    playSound("ok");
  }, [clienti, ingressi]);

  useEffect(() => {
    if (scannerRef.current) return;

    scannerRef.current = new Html5QrcodeScanner(
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
      scannerRef.current?.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, [registraIngresso]);

  const coloreMessaggio =
    messaggio === "OK" || messaggio === "OK RECUPERO"
      ? "text-green-600"
      : messaggio === "GIÀ REGISTRATO OGGI"
      ? "text-blue-600"
      : "text-red-600";

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link href="/" className="underline text-sm">
        ← Torna alla dashboard
      </Link>

      <h1 className="text-4xl font-bold my-8">Scanner QR</h1>

      <div className="bg-white rounded-2xl p-6 shadow max-w-xl mb-6">
        <div id="qr-reader"></div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow max-w-xl">
        <h2 className="text-xl font-semibold">Ultimo ingresso</h2>

        <p className="text-2xl mt-3">{ultimoCliente}</p>

        <p className={`text-3xl font-bold mt-2 ${coloreMessaggio}`}>
          {messaggio}
        </p>
      </div>
    </main>
  );
}
