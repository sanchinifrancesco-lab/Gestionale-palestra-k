"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Cliente,
  LezionePersonal,
  getClientiFirebase,
  getLezioniPersonalFirebase,
  salvaClienteSingoloFirebase,
  salvaLezionePersonalFirebase,
} from "../../lib/storage";

export default function PersonalPage() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [lezioni, setLezioni] = useState<LezionePersonal[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [pacchetto, setPacchetto] = useState("Singola");
  const [tipoLezione, setTipoLezione] =
    useState("Individuale");

  const [note, setNote] = useState("");

  useEffect(() => {
    async function caricaDati() {
      setClienti(
        (await getClientiFirebase()) as Cliente[]
      );

      setLezioni(
        (await getLezioniPersonalFirebase()) as LezionePersonal[]
      );
    }

    caricaDati();
  }, []);

  async function aggiungiPacchetto() {
    const cliente = clienti.find(
      (c) => c.id === clienteId
    );

    if (!cliente) {
      alert("Seleziona cliente");
      return;
    }

    const lezioniDaAggiungere =
      pacchetto === "Pacchetto 10"
        ? 10
        : 1;

    const aggiornato: Cliente = {
      ...cliente,

      lezioniPersonalDisponibili:
        (cliente.lezioniPersonalDisponibili || 0) +
        lezioniDaAggiungere,

      tipoPersonal: pacchetto,
    };

    await salvaClienteSingoloFirebase(
      aggiornato
    );

    setClienti(
      clienti.map((c) => 
        c.id === cliente.id
          ? aggiornato
          : c
      )
    );

    alert("Pacchetto aggiornato");
  }

  async function registraLezione() {
    const cliente = clienti.find(
      (c) => c.id === clienteId
    );

    if (!cliente) {
      alert("Seleziona cliente");
      return;
    }

    if (
      (cliente.lezioniPersonalDisponibili || 0) <= 0
    ) {
      alert("Lezioni esaurite");
      return;
    }

    const nuovaLezione: LezionePersonal = {
      id: "personal_" + Date.now(),

      clienteId: cliente.id,

      data: new Date().toISOString(),

      tipoLezione,

      note,
    };

    await salvaLezionePersonalFirebase(
      nuovaLezione
    );

    const aggiornato: Cliente = {
      ...cliente,

      lezioniPersonalDisponibili:
        (cliente.lezioniPersonalDisponibili || 0) -
        1,
    };

    await salvaClienteSingoloFirebase(
      aggiornato
    );

    setClienti(
      clienti.map((c) =>
        c.id === cliente.id
          ? aggiornato
          : c
      )
    );

    setLezioni([
      nuovaLezione,
      ...lezioni,
    ]);

    setNote("");

    alert("Lezione registrata");
  }

  function nomeCliente(id: string) {
    const cliente = clienti.find(
      (c) => c.id === id
    );

    if (!cliente) {
      return "Cliente";
    }

    return `${cliente.cognome} ${cliente.nome}`;
  }
  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <Link
        href="/"
        className="underline text-sm"
      >
        ← Dashboard
      </Link>

      <h1 className="text-4xl font-bold my-8">
        Personal
      </h1>

      <div className="bg-white rounded-2xl shadow p-6 max-w-2xl space-y-4 mb-10">

        <select
          className="w-full border p-3 rounded"
          value={clienteId}
          onChange={(e) =>
            setClienteId(e.target.value)
          }
        >
          <option value="">
            Seleziona cliente
          </option>

          
        {clienti.filter(
  (cliente) =>
    (cliente.lezioniPersonalDisponibili || 0) > 0 ||
    cliente.gruppo?.toLowerCase() === "personal"
)
  .map((cliente) => (
            <option
              key={cliente.id}
              value={cliente.id}
            >
              {cliente.cognome}{" "}
              {cliente.nome}
              {" — "}
              PT:
              {" "}
              {cliente.lezioniPersonalDisponibili || 0}
            </option>
          ))}
        </select>

        <select
          className="w-full border p-3 rounded"
          value={pacchetto}
          onChange={(e) =>
            setPacchetto(e.target.value)
          }
        >
          <option value="Singola">
            Singola +1
          </option>

          <option value="Pacchetto 10">
            Pacchetto 10 
          </option>
        </select>

        <button
          onClick={aggiungiPacchetto}
          className="bg-black text-white px-6 py-3 rounded-xl"
        >
          Aggiungi pacchetto
        </button>

        <hr />

        <select
          className="w-full border p-3 rounded"
          value={tipoLezione}
          onChange={(e) =>
            setTipoLezione(
              e.target.value
            )
          }
        >
          <option value="Individuale">
            Individuale
          </option>

          <option value="Mini gruppo">
            Mini gruppo
          </option>
        </select>

        <textarea
          className="w-full border p-3 rounded"
          placeholder="Note"
          value={note}
          onChange={(e) =>
            setNote(e.target.value)
          }
        />

        <button
          onClick={registraLezione}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl"
        >
          Registra lezione
        </button>
      </div>

      <div className="space-y-4">
        {lezioni.map((lezione) => (
          <div
            key={lezione.id}
            className="bg-white rounded-xl shadow p-4"
          >
            <h2 className="font-bold text-lg">
              {nomeCliente(
                lezione.clienteId
              )}
            </h2>

            <p>
              {lezione.tipoLezione}
            </p>

            <p>
              {new Date(
                lezione.data
              ).toLocaleString("it-IT")}
            </p>

            {lezione.note && (
              <p>
                Note: {lezione.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
