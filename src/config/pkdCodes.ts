// PKD main sections - official classification
// Source: PKD 2007 main sections (A-U)
// Updated: 2025-08-08

export interface PKDCode {
  code: string;
  name: string;
}

export const PKD_CODES: PKDCode[] = [
  { code: "A", name: "Rolnictwo, leśnictwo, łowiectwo i rybactwo" },
  { code: "B", name: "Górnictwo i wydobywanie" },
  { code: "C", name: "Przetwórstwo przemysłowe" },
  { code: "D", name: "Wytwarzanie i zaopatrywanie w energię elektryczną, gaz, parę wodną, gorącą wodę i powietrze do układów klimatyzacyjnych" },
  { code: "E", name: "Dostawa wody; gospodarowanie ściekami i odpadami oraz działalność związana z rekultywacją" },
  { code: "F", name: "Budownictwo" },
  { code: "G", name: "Handel hurtowy i detaliczny; naprawa pojazdów samochodowych, w tym motocykli" },
  { code: "H", name: "Transport i gospodarka magazynowa" },
  { code: "I", name: "Działalność związana z zakwaterowaniem i usługami gastronomicznymi" },
  { code: "J", name: "Informacja i komunikacja" },
  { code: "K", name: "Działalność finansowa i ubezpieczeniowa" },
  { code: "L", name: "Działalność związana z obsługą rynku nieruchomości" },
  { code: "M", name: "Działalność profesjonalna, naukowa i techniczna" },
  { code: "N", name: "Działalność w zakresie usług administrowania i działalność wspierająca" },
  { code: "O", name: "Administracja publiczna i obrona narodowa; obowiązkowe zabezpieczenia społeczne" },
  { code: "P", name: "Edukacja" },
  { code: "Q", name: "Opieka zdrowotna i pomoc społeczna" },
  { code: "R", name: "Działalność związana z kulturą, rozrywką i rekreacją" },
  { code: "S", name: "Pozostała działalność usługowa" },
  { code: "T", name: "Gospodarstwa domowe zatrudniające pracowników; gospodarstwa domowe produkujące wyroby i świadczące usługi na własne potrzeby" },
  { code: "U", name: "Organizacje i zespoły eksterytorialne" }
];

export default PKD_CODES;
