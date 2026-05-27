import { db } from "./firebase";

import {
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc,
  deleteDoc
} from "firebase/firestore";

export type Cliente = {
  id: string;
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  gruppo: string;
  scadenzaAbbonamento: string;
  scadenzaCertificato: string;
  attivo: boolean;
  ingressiDisponibili: number;
  tipoAbbonamento: string;
  lezioniPersonalDisponibili: number;
  tipoPersonal: string;
  recuperiDisponibili: number;
 scadenzaRecuperi: string;
 note?: string;
};
export type Ingresso = {
  id: string;
  clienteId: string;
  data: string;
  esito: string;
  
};
export type LezionePersonal = {
  id: string;
  clienteId: string;
  data: string;
  tipoLezione: string;
  note: string;
};
export type Pagamento = {
  id: string;
  clienteId: string;
  importo: number;
  metodo: string;
  data: string;
};



export function getClienti(): Cliente[] {
  if (typeof window === "undefined") return [];

  return JSON.parse(
    localStorage.getItem("clienti") || "[]"
  );
}

export function saveClienti(clienti: Cliente[]) {
  localStorage.setItem(
    "clienti",
    JSON.stringify(clienti)
  );
}

export function getPagamenti(): Pagamento[] {
  if (typeof window === "undefined") return [];

  return JSON.parse(
    localStorage.getItem("pagamenti") || "[]"
  );
}

export function savePagamenti(
  pagamenti: Pagamento[]
) {
  localStorage.setItem(
    "pagamenti",
    JSON.stringify(pagamenti)
  );
}

export function getIngressi(): Ingresso[] {
  if (typeof window === "undefined") return [];

  return JSON.parse(
    localStorage.getItem("ingressi") || "[]"
  );
}

export function saveIngressi(
  ingressi: Ingresso[]
) {
  localStorage.setItem(
    "ingressi",
    JSON.stringify(ingressi)
  );
}

export function aggiornaScadenzaAbbonamento(
  clienteId: string,
  nuovaScadenza: string
) {
  const clienti = getClienti();

  const aggiornati = clienti.map((cliente) => {
    if (cliente.id === clienteId) {
      return {
        ...cliente,
        scadenzaAbbonamento: nuovaScadenza,
        attivo: true,
      };
    }

    return cliente;
  });

  saveClienti(aggiornati);
}

export async function saveClientiFirebase(
  clienti: Cliente[]
) {
  for (const cliente of clienti) {
    await addDoc(
      collection(db, "clienti"),
      cliente
    );
  }
}

export async function getClientiFirebase() {
  const querySnapshot = await getDocs(
    collection(db, "clienti")
  );

  return querySnapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
}

export async function salvaClienteSingoloFirebase(
  cliente: Cliente
) {
  await setDoc(
    doc(db, "clienti", cliente.id),
    cliente
  );
}export async function salvaPagamentoSingoloFirebase(
  pagamento: Pagamento
) {
  await setDoc(
    doc(db, "pagamenti", pagamento.id),
    pagamento
  );
}

export async function getPagamentiFirebase() {
  const querySnapshot = await getDocs(
    collection(db, "pagamenti")
  );

  return querySnapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
}

export async function salvaIngressoSingoloFirebase(
  ingresso: Ingresso
) {
  await setDoc(
    doc(db, "ingressi", ingresso.id),
    ingresso
  );
}

export async function getIngressiFirebase() {
  const querySnapshot = await getDocs(
    collection(db, "ingressi")
  );

  return querySnapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
}export async function eliminaClienteFirebase(clienteId: string) {
  await deleteDoc(doc(db, "clienti", clienteId));
}
export async function eliminaPagamentoFirebase(
  pagamentoId: string
) {
  await deleteDoc(
    doc(db, "pagamenti", pagamentoId)
  );
}
export async function getLezioniPersonalFirebase() {
  const querySnapshot = await getDocs(
    collection(db, "lezioniPersonal")
  );

  return querySnapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
}
export async function salvaLezionePersonalFirebase(
  lezione: LezionePersonal
) {
  await setDoc(
    doc(db, "lezioniPersonal", lezione.id),
    lezione
  );
}
export async function eliminaIngressoFirebase(
  ingressoId: string
) {
  await deleteDoc(
    doc(db, "ingressi", ingressoId)
  );
}