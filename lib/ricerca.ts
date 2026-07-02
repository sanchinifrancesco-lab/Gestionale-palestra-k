import type { Cliente } from "./storage";

function normalizza(testo: string) {
  return testo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("it")
    .trim();
}

export function clienteCorrispondeAllaRicerca(
  cliente: Cliente,
  ricerca: string
) {
  const termini = normalizza(ricerca).split(/\s+/).filter(Boolean);
  const datiCliente = normalizza(
    `${cliente.nome} ${cliente.cognome} ${cliente.telefono}`
  );

  return termini.every((termine) => datiCliente.includes(termine));
}
