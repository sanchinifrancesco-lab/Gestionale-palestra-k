"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Cliente,
  Pagamento,
  getClientiFirebase,
  getPagamentiFirebase,
  savePagamenti,
  salvaPagamentoSingoloFirebase,
  salvaClienteSingoloFirebase,
  eliminaPagamentoFirebase,
} from "../../lib/storage";

const pacchetti = {
  Mensile: { importo: 65, ingressi: 8 },

  Trimestrale: {
    importo: 195,
    ingressi: 24,
  },

  Semestrale: {
    importo: 330,
    ingressi: 48,
  },

  Annuale: {
    importo: 540,
    ingressi: 999,
  },

  Personalizzato: {
    importo: 0,
    ingressi: 0,
  },
};

type VocePagamento = keyof typeof pacchetti;

export default function PagamentiPage() {
  const [ricercaCliente, setRicercaCliente] =
  useState("");
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [pagamenti, setPagamenti] = useState<Pagamento[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [voce, setVoce] = useState<VocePagamento>("Mensile");
  const [importo, setImporto] = useState("65");
  const [ingressiDaAggiungere, setIngressiDaAggiungere] = useState("8");
  const [metodo, setMetodo] = useState("contanti");

  useEffect(() => {
    async function caricaDati() {
      const clientiFirebase = await getClientiFirebase();
      const pagamentiFirebase = await getPagamentiFirebase();

      setClienti(clientiFirebase as Cliente[]);
      setPagamenti(pagamentiFirebase as Pagamento[]);
      savePagamenti(pagamentiFirebase as Pagamento[]);
    }

    caricaDati();
  }, []);

  function formattaDataLocale(data: Date) {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(data.getDate()).padStart(2, "0")}`;
  }

  function ultimoGiornoDelMese(data: Date) {
    return new Date(
      data.getFullYear(),
      data.getMonth() + 1,
      0
    );
  }

  function calcolaScadenza(
    voce: VocePagamento,
    scadenzaAttuale?: string
  ) {
    const oggi = new Date();

    const base =
      scadenzaAttuale && new Date(scadenzaAttuale) > oggi
        ? new Date(scadenzaAttuale)
        : oggi;

    if (voce === "Mensile") {
      base.setMonth(base.getMonth() + 1);
      return ultimoGiornoDelMese(base);
    }

    if (voce === "Trimestrale") {
      base.setMonth(base.getMonth() + 3);
      return ultimoGiornoDelMese(base);
    }

    if (voce === "Semestrale") {
      base.setMonth(base.getMonth() + 6);
      return ultimoGiornoDelMese(base);
    }

    const anno =
      oggi.getMonth() <= 6
        ? oggi.getFullYear()
        : oggi.getFullYear() + 1;

    return new Date(anno, 6, 31);
  }

 function cambiaVoce(nuovaVoce: VocePagamento) {
  setVoce(nuovaVoce);
  setImporto(String(pacchetti[nuovaVoce].importo));
  setIngressiDaAggiungere(String(pacchetti[nuovaVoce].ingressi));
}

  async function registraPagamento(e: React.FormEvent) {
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
      data: formattaDataLocale(new Date()),
    };

    const nuoviPagamenti = [...pagamenti, nuovoPagamento];

    setPagamenti(nuoviPagamenti);
    savePagamenti(nuoviPagamenti);

    await salvaPagamentoSingoloFirebase(nuovoPagamento);

    const clienteDaAggiornare = clienti.find(
      (cliente) => cliente.id === clienteId
    );

    if (clienteDaAggiornare) {
      const nuovaScadenza = calcolaScadenza(
        voce,
        clienteDaAggiornare.scadenzaAbbonamento
      );

      const ingressiAttuali =
        clienteDaAggiornare.ingressiDisponibili || 0;

      const recuperiDalPacchettoPrecedente =
  clienteDaAggiornare.ingressiDisponibili || 0;

const aggiornato: Cliente = {
  ...clienteDaAggiornare,

  scadenzaAbbonamento:
    formattaDataLocale(nuovaScadenza),

  attivo: true,

  tipoAbbonamento: voce,

  // nuovo pacchetto
  ingressiDisponibili:
    Number(
      ingressiDaAggiungere ||
      pacchetti[voce].ingressi
    ),

  // ingressi vecchi diventano recuperi
  recuperiDisponibili:
    recuperiDalPacchettoPrecedente,

  // recuperi validi fino alla nuova scadenza
  scadenzaRecuperi:
    formattaDataLocale(nuovaScadenza),
};

      await salvaClienteSingoloFirebase(aggiornato);

      setClienti(
        clienti.map((cliente) =>
          cliente.id === clienteId ? aggiornato : cliente
        )
      );
    }

    alert(`Pagamento ${voce} registrato. Abbonamento aggiornato.`);

    setClienteId("");
    setVoce("Mensile");
  setIngressiDaAggiungere("8");
    setMetodo("contanti");
  }

  async function eliminaPagamento(pagamentoId: string) {
    const conferma = confirm("Eliminare questo pagamento?");

    if (!conferma) return;

    await eliminaPagamentoFirebase(pagamentoId);

    const aggiornati = pagamenti.filter(
      (p) => p.id !== pagamentoId
    );

    setPagamenti(aggiornati);
    savePagamenti(aggiornati);

    alert("Pagamento eliminato");
  }

  function nomeCliente(id: string) {
    const cliente = clienti.find((c) => c.id === id);

    return cliente
      ? `${cliente.cognome} ${cliente.nome}`
      : "Cliente non trovato";
  }

  const totale = pagamenti.reduce(
    (sum, p) => sum + p.importo,
    0
  );
const clientiFiltrati =
  clienti.filter((cliente) =>
    `${cliente.cognome} ${cliente.nome}`
      .toLowerCase()
      .includes(
        ricercaCliente.toLowerCase()
      )
  );
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link href="/" className="underline text-sm">
        ← Torna alla dashboard
      </Link>

      <h1 className="text-4xl font-bold my-8">
        Pagamenti
      </h1>

      <form
        onSubmit={registraPagamento}
        className="bg-white rounded-2xl p-6 shadow max-w-2xl space-y-4 mb-8"
      >
      <input
  type="text"
  placeholder="Cerca cliente..."
  value={ricercaCliente}
  onChange={(e) =>
    setRicercaCliente(
      e.target.value
    )
  }
  className="w-full border p-3 rounded mb-3"
/>
        <select
          className="w-full border p-3 rounded"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
        >
          <option value="">Seleziona cliente</option>

          {clientiFiltrati.map((cliente, index) => (
            <option
              key={`${cliente.id}-${index}`}
              value={cliente.id}
            >
              {cliente.cognome} {cliente.nome}
            </option>
          ))}
        </select>

        <select
          className="w-full border p-3 rounded"
          value={voce}
          onChange={(e) =>
            cambiaVoce(e.target.value as VocePagamento)
          }
        >
          <option value="Mensile">
            Mensile - 65€ / 8 ingressi
          </option>
          <option value="Trimestrale">
            Trimestrale - 195€ / 24 ingressi
          </option>
          <option value="Semestrale">
            Semestrale - 330€ / 48 ingressi
          </option>
          <option value="Annuale">
            Annuale - 540€ / 999 ingressi
          </option>
          <option value="Personalizzato">
  Personalizzato
</option>
        </select>

        {voce === "Personalizzato" && (
  <>
    <input
      className="w-full border p-3 rounded"
      placeholder="Importo"
      value={importo}
      onChange={(e) =>
        setImporto(e.target.value)
      }
    />

    <input
      className="w-full border p-3 rounded"
      placeholder="Ingressi da aggiungere"
      value={ingressiDaAggiungere}
      onChange={(e) =>
        setIngressiDaAggiungere(
          e.target.value
         )
      }
    />
  </>
)}
        <select
          className="w-full border p-3 rounded"
          value={metodo}
          onChange={(e) => setMetodo(e.target.value)}
        >
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
        <h2 className="text-xl font-semibold">
          Totale registrato
        </h2>
        <p className="text-3xl mt-2">€ {totale}</p>
      </div>

      <div className="space-y-3">
        {pagamenti.map((pagamento) => (
          <div
            key={pagamento.id}
            className="bg-white rounded-xl p-4 shadow"
          >
            <strong>{nomeCliente(pagamento.clienteId)}</strong>

            <p>
              € {pagamento.importo} — {pagamento.metodo}
            </p>

            <p className="text-sm text-gray-500">
              {pagamento.data}
            </p>

            <button
              onClick={() => eliminaPagamento(pagamento.id)}
              className="bg-red-600 text-white px-4 py-2 rounded-xl mt-3"
            >
              Elimina
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}