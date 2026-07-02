"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getClienti,
  saveClienti,
  salvaClienteSingoloFirebase,
} from "../../lib/storage";

export default function NuovoCliente() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [gruppo, setGruppo] = useState("");
  const [scadenzaAbbonamento, setScadenzaAbbonamento] = useState("");
  const [scadenzaCertificato, setScadenzaCertificato] = useState("");
  const [isPersonal, setIsPersonal] =
  useState(false);

  function salvaCliente(e: React.FormEvent) {
    e.preventDefault();

    const clienti = getClienti();

    const nuovoCliente = {
      id: "cliente_" + Date.now(),
      nome,
      cognome,
      telefono,
      email,
      gruppo:gruppo.trim().toLowerCase(),
      scadenzaAbbonamento,
      scadenzaCertificato,
      attivo: true,
      ingressiDisponibili: 0,
     tipoAbbonamento: "",
     lezioniPersonalDisponibili: 0,
     tipoPersonal: isPersonal
  ? "attivo"
  : "",
  recuperiDisponibili: 0,
scadenzaRecuperi: "",
    };

    saveClienti([...clienti, nuovoCliente]);
  salvaClienteSingoloFirebase(nuovoCliente);

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link href="/" className="underline text-sm">
        ← Torna alla dashboard
      </Link>

      <h1 className="text-4xl font-bold my-8">
        Nuovo Cliente
      </h1>

      <form
        onSubmit={salvaCliente}
        className="bg-white rounded-2xl p-6 shadow max-w-2xl space-y-4"
      >
        <input
          className="w-full border p-3 rounded"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <input
          className="w-full border p-3 rounded"
          placeholder="Cognome"
          value={cognome}
          onChange={(e) => setCognome(e.target.value)}
        />

        <input
          className="w-full border p-3 rounded"
          placeholder="Telefono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />

        <input
          className="w-full border p-3 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-3 rounded"
          placeholder="Gruppo es. Lun/Giov 18"
          value={gruppo}
          onChange={(e) => setGruppo(e.target.value)}
        />
        <label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={isPersonal}
    onChange={(e) =>
      setIsPersonal(e.target.checked)
    }
  />

  Cliente Personal
</label>

        <label className="block">
          Scadenza abbonamento

          <input
            type="date"
            className="w-full border p-3 rounded mt-1"
            value={scadenzaAbbonamento}
            onChange={(e) =>
              setScadenzaAbbonamento(e.target.value)
            }
          />
        </label>

        <label className="block">
          Scadenza certificato

          <input
            type="date"
            className="w-full border p-3 rounded mt-1"
            value={scadenzaCertificato}
            onChange={(e) =>
              setScadenzaCertificato(e.target.value)
            }
          />
        </label>

        <button className="bg-black text-white px-6 py-3 rounded-xl font-semibold">
          Salva Cliente
        </button>
      </form>
    </main>
  );
}
