import { CategoryCode } from "../types/athletics";

export interface OfficialDisciplineInfo {
  name: string;
  family: "Sprint et Haies" | "Demi-Fond & Fond" | "Marche" | "Sauts" | "Lancers" | "Épreuves Combinées" | "Triathlon" | "Relais";
  nature: "time" | "distance" | "points";
  categories: CategoryCode[];
  structures: Array<"EXTERIEUR" | "SALLE">;
  sexe?: "M" | "F" | "ALL";
  specifications?: string;
}

export interface OfficialEventEntry {
  cat: CategoryCode;
  sexe: "M" | "F";
  structure: "EXTERIEUR" | "SALLE";
  name: string;
  code_ep: string;
  label: string; // e.g. "50m salle-105" ou "Hauteur-501"
  family: "Sprint et Haies" | "Demi-Fond & Fond" | "Marche" | "Sauts" | "Lancers" | "Épreuves Combinées" | "Triathlon";
}

/**
 * Registre officiel complet des 367 épreuves FFA par catégorie, sexe et lieu de pratique (Salle / Plein air)
 * avec leur code officiel "code_ep" (Colonne G dans les fichiers FFA Logica)
 */
export const OFFICIAL_EVENT_ENTRIES: OfficialEventEntry[] = [
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "50m",
    "code_ep": "104",
    "label": "50m-104",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "50m",
    "code_ep": "104",
    "label": "50m-104",
    "family": "Sprint et Haies"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "80m",
    "code_ep": "108",
    "label": "80m-108",
    "family": "Sprint et Haies"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "80m",
    "code_ep": "108",
    "label": "80m-108",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "100m",
    "code_ep": "110",
    "label": "100m-110",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "100m",
    "code_ep": "110",
    "label": "100m-110",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "100m",
    "code_ep": "110",
    "label": "100m-110",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "100m",
    "code_ep": "110",
    "label": "100m-110",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "100m",
    "code_ep": "110",
    "label": "100m-110",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "100m",
    "code_ep": "110",
    "label": "100m-110",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "100m",
    "code_ep": "110",
    "label": "100m-110",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "100m",
    "code_ep": "110",
    "label": "100m-110",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "50m",
    "code_ep": "105",
    "label": "50m salle-105",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "50m",
    "code_ep": "105",
    "label": "50m salle-105",
    "family": "Sprint et Haies"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "50m",
    "code_ep": "105",
    "label": "50m salle-105",
    "family": "Sprint et Haies"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "50m",
    "code_ep": "105",
    "label": "50m salle-105",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "60m",
    "code_ep": "107",
    "label": "60m salle-107",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "60m",
    "code_ep": "107",
    "label": "60m salle-107",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "60m",
    "code_ep": "107",
    "label": "60m salle-107",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "60m",
    "code_ep": "107",
    "label": "60m salle-107",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "60m",
    "code_ep": "107",
    "label": "60m salle-107",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "60m",
    "code_ep": "107",
    "label": "60m salle-107",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "60m",
    "code_ep": "107",
    "label": "60m salle-107",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "60m",
    "code_ep": "107",
    "label": "60m salle-107",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "50m haies",
    "code_ep": "321",
    "label": "50m haies-321",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "50m haies",
    "code_ep": "321",
    "label": "50m haies-321",
    "family": "Sprint et Haies"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "120m",
    "code_ep": "112",
    "label": "120m-112",
    "family": "Sprint et Haies"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "120m",
    "code_ep": "112",
    "label": "120m-112",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "200m",
    "code_ep": "120",
    "label": "200m-120",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "200m",
    "code_ep": "120",
    "label": "200m-120",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "200m",
    "code_ep": "120",
    "label": "200m-120",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "200m",
    "code_ep": "120",
    "label": "200m-120",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "200m",
    "code_ep": "120",
    "label": "200m-120",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "200m",
    "code_ep": "120",
    "label": "200m-120",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "200m",
    "code_ep": "120",
    "label": "200m-120",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "200m",
    "code_ep": "120",
    "label": "200m-120",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "50m haies",
    "code_ep": "322",
    "label": "50m haies salle-322",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "50m haies",
    "code_ep": "322",
    "label": "50m haies salle-322",
    "family": "Sprint et Haies"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "50m haies",
    "code_ep": "302",
    "label": "50m haies salle-302",
    "family": "Sprint et Haies"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "50m haies",
    "code_ep": "301",
    "label": "50m haies salle-301",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "200m",
    "code_ep": "121",
    "label": "200m salle-121",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "200m",
    "code_ep": "121",
    "label": "200m salle-121",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "200m",
    "code_ep": "121",
    "label": "200m salle-121",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "200m",
    "code_ep": "121",
    "label": "200m salle-121",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "200m",
    "code_ep": "121",
    "label": "200m salle-121",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "200m",
    "code_ep": "121",
    "label": "200m salle-121",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "200m",
    "code_ep": "121",
    "label": "200m salle-121",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "200m",
    "code_ep": "121",
    "label": "200m salle-121",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "1000m",
    "code_ep": "210",
    "label": "1000m-210",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "1000m",
    "code_ep": "210",
    "label": "1000m-210",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "100m haies",
    "code_ep": "310",
    "label": "100m haies-310",
    "family": "Sprint et Haies"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "80m haies",
    "code_ep": "308",
    "label": "80m haies-308",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "400m",
    "code_ep": "140",
    "label": "400m-140",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "400m",
    "code_ep": "140",
    "label": "400m-140",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "400m",
    "code_ep": "140",
    "label": "400m-140",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "400m",
    "code_ep": "140",
    "label": "400m-140",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "400m",
    "code_ep": "140",
    "label": "400m-140",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "400m",
    "code_ep": "140",
    "label": "400m-140",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "400m",
    "code_ep": "140",
    "label": "400m-140",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "400m",
    "code_ep": "140",
    "label": "400m-140",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "1000m",
    "code_ep": "211",
    "label": "1000m salle-211",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "1000m",
    "code_ep": "211",
    "label": "1000m salle-211",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "1000m",
    "code_ep": "211",
    "label": "1000m salle-211",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "1000m",
    "code_ep": "210",
    "label": "1000m salle-210",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "400m",
    "code_ep": "141",
    "label": "400m salle-141",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "400m",
    "code_ep": "141",
    "label": "400m salle-141",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "400m",
    "code_ep": "141",
    "label": "400m salle-141",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "400m",
    "code_ep": "141",
    "label": "400m salle-141",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "400m",
    "code_ep": "141",
    "label": "400m salle-141",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "400m",
    "code_ep": "141",
    "label": "400m salle-141",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "400m",
    "code_ep": "141",
    "label": "400m salle-141",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "400m",
    "code_ep": "141",
    "label": "400m salle-141",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "2000m marche",
    "code_ep": "902",
    "label": "2000m marche-902",
    "family": "Marche"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "2000m marche",
    "code_ep": "902",
    "label": "2000m marche-902",
    "family": "Marche"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "200m haies",
    "code_ep": "326",
    "label": "200m haies-326",
    "family": "Sprint et Haies"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "200m haies",
    "code_ep": "326",
    "label": "200m haies-326",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "110m haies",
    "code_ep": "312",
    "label": "110m haies-312",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "100m haies",
    "code_ep": "311",
    "label": "100m haies-311",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "110m haies",
    "code_ep": "315",
    "label": "110m haies-315",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "100m haies",
    "code_ep": "310",
    "label": "100m haies-310",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "110m haies",
    "code_ep": "313",
    "label": "110m haies-313",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "100m haies",
    "code_ep": "310",
    "label": "100m haies-310",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "110m haies",
    "code_ep": "313",
    "label": "110m haies-313",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "100m haies",
    "code_ep": "310",
    "label": "100m haies-310",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "2000m marche",
    "code_ep": "952",
    "label": "2000m marche salle-952",
    "family": "Marche"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "2000m marche",
    "code_ep": "952",
    "label": "2000m marche salle-952",
    "family": "Marche"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "2000m",
    "code_ep": "221",
    "label": "2000m salle-221",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "2000m",
    "code_ep": "221",
    "label": "2000m salle-221",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "60m haies",
    "code_ep": "307",
    "label": "60m haies salle-307",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "60m haies",
    "code_ep": "305",
    "label": "60m haies salle-305",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "60m haies",
    "code_ep": "317",
    "label": "60m haies salle-317",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "60m haies",
    "code_ep": "306",
    "label": "60m haies salle-306",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "60m haies",
    "code_ep": "309",
    "label": "60m haies salle-309",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "60m haies",
    "code_ep": "306",
    "label": "60m haies salle-306",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "60m haies",
    "code_ep": "309",
    "label": "60m haies salle-309",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "60m haies",
    "code_ep": "306",
    "label": "60m haies salle-306",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "1000m",
    "code_ep": "210",
    "label": "1000m-210",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "1000m",
    "code_ep": "210",
    "label": "1000m-210",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "400m haies",
    "code_ep": "341",
    "label": "400m haies-341",
    "family": "Sprint et Haies"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "400m haies",
    "code_ep": "340",
    "label": "400m haies-340",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "400m haies",
    "code_ep": "342",
    "label": "400m haies-342",
    "family": "Sprint et Haies"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "400m haies",
    "code_ep": "340",
    "label": "400m haies-340",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "400m haies",
    "code_ep": "342",
    "label": "400m haies-342",
    "family": "Sprint et Haies"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "400m haies",
    "code_ep": "340",
    "label": "400m haies-340",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "400m haies",
    "code_ep": "342",
    "label": "400m haies-342",
    "family": "Sprint et Haies"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "400m haies",
    "code_ep": "340",
    "label": "400m haies-340",
    "family": "Sprint et Haies"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "3000m marche",
    "code_ep": "953",
    "label": "3000m marche salle-953",
    "family": "Marche"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "3000m marche",
    "code_ep": "953",
    "label": "3000m marche salle-953",
    "family": "Marche"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "800m",
    "code_ep": "209",
    "label": "800m salle-209",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "800m",
    "code_ep": "209",
    "label": "800m salle-209",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "800m",
    "code_ep": "209",
    "label": "800m salle-209",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "800m",
    "code_ep": "209",
    "label": "800m salle-209",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "800m",
    "code_ep": "209",
    "label": "800m salle-209",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "800m",
    "code_ep": "209",
    "label": "800m salle-209",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "800m",
    "code_ep": "209",
    "label": "800m salle-209",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "800m",
    "code_ep": "209",
    "label": "800m salle-209",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "2000m",
    "code_ep": "220",
    "label": "2000m-220",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "2000m",
    "code_ep": "220",
    "label": "2000m-220",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "800m",
    "code_ep": "208",
    "label": "800m-208",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "800m",
    "code_ep": "208",
    "label": "800m-208",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "800m",
    "code_ep": "208",
    "label": "800m-208",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "800m",
    "code_ep": "208",
    "label": "800m-208",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "800m",
    "code_ep": "208",
    "label": "800m-208",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "800m",
    "code_ep": "208",
    "label": "800m-208",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "800m",
    "code_ep": "208",
    "label": "800m-208",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "800m",
    "code_ep": "208",
    "label": "800m-208",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "1500m",
    "code_ep": "216",
    "label": "1500m salle-216",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "1500m",
    "code_ep": "216",
    "label": "1500m salle-216",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "1500m",
    "code_ep": "216",
    "label": "1500m salle-216",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "1500m",
    "code_ep": "216",
    "label": "1500m salle-216",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "1500m",
    "code_ep": "216",
    "label": "1500m salle-216",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "1500m",
    "code_ep": "216",
    "label": "1500m salle-216",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "1500m",
    "code_ep": "216",
    "label": "1500m salle-216",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "1500m",
    "code_ep": "216",
    "label": "1500m salle-216",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "3000m marche",
    "code_ep": "903",
    "label": "3000m marche-903",
    "family": "Marche"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "3000m marche",
    "code_ep": "903",
    "label": "3000m marche-903",
    "family": "Marche"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "1500m",
    "code_ep": "215",
    "label": "1500m-215",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "1500m",
    "code_ep": "215",
    "label": "1500m-215",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "1500m",
    "code_ep": "215",
    "label": "1500m-215",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "1500m",
    "code_ep": "215",
    "label": "1500m-215",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "1500m",
    "code_ep": "215",
    "label": "1500m-215",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "1500m",
    "code_ep": "215",
    "label": "1500m-215",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "1500m",
    "code_ep": "215",
    "label": "1500m-215",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "1500m",
    "code_ep": "215",
    "label": "1500m-215",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "5000m marche",
    "code_ep": "955",
    "label": "5000m marche salle-955",
    "family": "Marche"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "3000m marche",
    "code_ep": "953",
    "label": "3000m marche salle-953",
    "family": "Marche"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "5000m marche",
    "code_ep": "955",
    "label": "5000m marche salle-955",
    "family": "Marche"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "3000m marche",
    "code_ep": "953",
    "label": "3000m marche salle-953",
    "family": "Marche"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "5000m marche",
    "code_ep": "955",
    "label": "5000m marche salle-955",
    "family": "Marche"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "3000m marche",
    "code_ep": "953",
    "label": "3000m marche salle-953",
    "family": "Marche"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "3000m",
    "code_ep": "231",
    "label": "3000m salle-231",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "3000m",
    "code_ep": "231",
    "label": "3000m salle-231",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "3000m",
    "code_ep": "230",
    "label": "3000m-230",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "3000m",
    "code_ep": "230",
    "label": "3000m-230",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "5000m",
    "code_ep": "250",
    "label": "5000m-250",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "3000m",
    "code_ep": "230",
    "label": "3000m-230",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "5000m",
    "code_ep": "250",
    "label": "5000m-250",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "5000m",
    "code_ep": "250",
    "label": "5000m-250",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "5000m",
    "code_ep": "250",
    "label": "5000m-250",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "5000m",
    "code_ep": "250",
    "label": "5000m-250",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "5000m marche",
    "code_ep": "955",
    "label": "5000m marche salle-955",
    "family": "Marche"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "3000m marche",
    "code_ep": "953",
    "label": "3000m marche salle-953",
    "family": "Marche"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "603",
    "label": "Poids-603",
    "family": "Lancers"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "602",
    "label": "Poids-602",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "2000m steeple",
    "code_ep": "422",
    "label": "2000m steeple-422",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "2000m steeple",
    "code_ep": "420",
    "label": "2000m steeple-420",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "3000m steeple",
    "code_ep": "430",
    "label": "3000m steeple-430",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "2000m steeple",
    "code_ep": "420",
    "label": "2000m steeple-420",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "3000m steeple",
    "code_ep": "430",
    "label": "3000m steeple-430",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "3000m steeple",
    "code_ep": "431",
    "label": "3000m steeple-431",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "3000m steeple",
    "code_ep": "430",
    "label": "3000m steeple-430",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "3000m steeple",
    "code_ep": "431",
    "label": "3000m steeple-431",
    "family": "Demi-Fond & Fond"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "653",
    "label": "Poids salle-653",
    "family": "Lancers"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "652",
    "label": "Poids salle-652",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Hauteur",
    "code_ep": "511",
    "label": "Hauteur salle-511",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "650",
    "label": "Javelot-650",
    "family": "Lancers"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "650",
    "label": "Javelot-650",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "5000m marche",
    "code_ep": "905",
    "label": "5000m marche-905",
    "family": "Marche"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "5000m marche",
    "code_ep": "905",
    "label": "5000m marche-905",
    "family": "Marche"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "10000m marche",
    "code_ep": "910",
    "label": "10000m marche-910",
    "family": "Marche"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "10000m marche",
    "code_ep": "910",
    "label": "10000m marche-910",
    "family": "Marche"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "10000m marche",
    "code_ep": "910",
    "label": "10000m marche-910",
    "family": "Marche"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "10000m marche",
    "code_ep": "910",
    "label": "10000m marche-910",
    "family": "Marche"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "10000m marche",
    "code_ep": "910",
    "label": "10000m marche-910",
    "family": "Marche"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "10000m marche",
    "code_ep": "910",
    "label": "10000m marche-910",
    "family": "Marche"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Tétrathlon",
    "code_ep": "725",
    "label": "Tétrathlon salle-725",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Tétrathlon",
    "code_ep": "724",
    "label": "Tétrathlon salle-724",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "654",
    "label": "Poids salle-654",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "653",
    "label": "Poids salle-653",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Perche",
    "code_ep": "512",
    "label": "Perche salle-512",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "616",
    "label": "Disque-616",
    "family": "Lancers"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "616",
    "label": "Disque-616",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Hauteur",
    "code_ep": "501",
    "label": "Hauteur-501",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Triathlon",
    "code_ep": "798",
    "label": "Triathlon salle-798",
    "family": "Triathlon"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Triathlon",
    "code_ep": "798",
    "label": "Triathlon salle-798",
    "family": "Triathlon"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Pentathlon Lg",
    "code_ep": "734",
    "label": "Pentathlon Lg salle-734",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Longueur",
    "code_ep": "513",
    "label": "Longueur salle-513",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "633",
    "label": "Marteau-633",
    "family": "Lancers"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "633",
    "label": "Marteau-633",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "604",
    "label": "Poids-604",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "603",
    "label": "Poids-603",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Perche",
    "code_ep": "502",
    "label": "Perche-502",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Pentathlon Perche",
    "code_ep": "735",
    "label": "Pentathlon Perche salle-735",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Pentathlon",
    "code_ep": "733",
    "label": "Pentathlon salle-733",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "655",
    "label": "Poids salle-655",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "653",
    "label": "Poids salle-653",
    "family": "Lancers"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "656",
    "label": "Poids salle-656",
    "family": "Lancers"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "654",
    "label": "Poids salle-654",
    "family": "Lancers"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "657",
    "label": "Poids salle-657",
    "family": "Lancers"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "654",
    "label": "Poids salle-654",
    "family": "Lancers"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Triple Saut",
    "code_ep": "514",
    "label": "Triple Saut salle-514",
    "family": "Sauts"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Tétrathlon",
    "code_ep": "705",
    "label": "Tétrathlon-705",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Tétrathlon",
    "code_ep": "704",
    "label": "Tétrathlon-704",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "660",
    "label": "Javelot-660",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "650",
    "label": "Javelot-650",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Longueur",
    "code_ep": "503",
    "label": "Longueur-503",
    "family": "Sauts"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Triathlon",
    "code_ep": "798",
    "label": "Triathlon salle-798",
    "family": "Triathlon"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Triathlon",
    "code_ep": "798",
    "label": "Triathlon salle-798",
    "family": "Triathlon"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Heptathlon",
    "code_ep": "723",
    "label": "Heptathlon salle-723",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Pentathlon",
    "code_ep": "722",
    "label": "Pentathlon salle-722",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Heptathlon",
    "code_ep": "721",
    "label": "Heptathlon salle-721",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Pentathlon",
    "code_ep": "714",
    "label": "Pentathlon salle-714",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Heptathlon",
    "code_ep": "716",
    "label": "Heptathlon salle-716",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Pentathlon",
    "code_ep": "714",
    "label": "Pentathlon salle-714",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "657",
    "label": "Poids salle-657",
    "family": "Lancers"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Poids",
    "code_ep": "654",
    "label": "Poids salle-654",
    "family": "Lancers"
  },
  {
    "cat": "BE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Triathlon",
    "code_ep": "795",
    "label": "Triathlon-795",
    "family": "Triathlon"
  },
  {
    "cat": "BE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Triathlon",
    "code_ep": "795",
    "label": "Triathlon-795",
    "family": "Triathlon"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "612",
    "label": "Disque-612",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "608",
    "label": "Disque-608",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Triple Saut",
    "code_ep": "504",
    "label": "Triple Saut-504",
    "family": "Sauts"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "SALLE",
    "name": "Heptathlon",
    "code_ep": "716",
    "label": "Heptathlon salle-716",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "SALLE",
    "name": "Pentathlon",
    "code_ep": "714",
    "label": "Pentathlon salle-714",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "634",
    "label": "Marteau-634",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "633",
    "label": "Marteau-633",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "605",
    "label": "Poids-605",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "603",
    "label": "Poids-603",
    "family": "Lancers"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "606",
    "label": "Poids-606",
    "family": "Lancers"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "604",
    "label": "Poids-604",
    "family": "Lancers"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "607",
    "label": "Poids-607",
    "family": "Lancers"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "604",
    "label": "Poids-604",
    "family": "Lancers"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "607",
    "label": "Poids-607",
    "family": "Lancers"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Poids",
    "code_ep": "604",
    "label": "Poids-604",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Octathlon",
    "code_ep": "728",
    "label": "Octathlon-728",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Hexathlon",
    "code_ep": "706",
    "label": "Hexathlon-706",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "672",
    "label": "Javelot-672",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "650",
    "label": "Javelot-650",
    "family": "Lancers"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "681",
    "label": "Javelot-681",
    "family": "Lancers"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "660",
    "label": "Javelot-660",
    "family": "Lancers"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "681",
    "label": "Javelot-681",
    "family": "Lancers"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "660",
    "label": "Javelot-660",
    "family": "Lancers"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "681",
    "label": "Javelot-681",
    "family": "Lancers"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Javelot",
    "code_ep": "660",
    "label": "Javelot-660",
    "family": "Lancers"
  },
  {
    "cat": "MI",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Triathlon",
    "code_ep": "795",
    "label": "Triathlon-795",
    "family": "Triathlon"
  },
  {
    "cat": "MI",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Triathlon",
    "code_ep": "795",
    "label": "Triathlon-795",
    "family": "Triathlon"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "615",
    "label": "Disque-615",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "608",
    "label": "Disque-608",
    "family": "Lancers"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "617",
    "label": "Disque-617",
    "family": "Lancers"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "610",
    "label": "Disque-610",
    "family": "Lancers"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "620",
    "label": "Disque-620",
    "family": "Lancers"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "610",
    "label": "Disque-610",
    "family": "Lancers"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "620",
    "label": "Disque-620",
    "family": "Lancers"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Disque",
    "code_ep": "610",
    "label": "Disque-610",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "635",
    "label": "Marteau-635",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "633",
    "label": "Marteau-633",
    "family": "Lancers"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "636",
    "label": "Marteau-636",
    "family": "Lancers"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "634",
    "label": "Marteau-634",
    "family": "Lancers"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "637",
    "label": "Marteau-637",
    "family": "Lancers"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "634",
    "label": "Marteau-634",
    "family": "Lancers"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "637",
    "label": "Marteau-637",
    "family": "Lancers"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Marteau",
    "code_ep": "634",
    "label": "Marteau-634",
    "family": "Lancers"
  },
  {
    "cat": "CA",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Decathlon",
    "code_ep": "731",
    "label": "Decathlon-731",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "CA",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Heptathlon",
    "code_ep": "776",
    "label": "Heptathlon-776",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "JU",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Decathlon",
    "code_ep": "730",
    "label": "Decathlon-730",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "JU",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Heptathlon",
    "code_ep": "717",
    "label": "Heptathlon-717",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "ES",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Decathlon",
    "code_ep": "710",
    "label": "Decathlon-710",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "ES",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Heptathlon",
    "code_ep": "717",
    "label": "Heptathlon-717",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "SE",
    "sexe": "M",
    "structure": "EXTERIEUR",
    "name": "Decathlon",
    "code_ep": "710",
    "label": "Decathlon-710",
    "family": "Épreuves Combinées"
  },
  {
    "cat": "SE",
    "sexe": "F",
    "structure": "EXTERIEUR",
    "name": "Heptathlon",
    "code_ep": "717",
    "label": "Heptathlon-717",
    "family": "Épreuves Combinées"
  }
];

/**
 * Décompose un libellé d'épreuve sélectionné (ex: "50m salle-105" ou "Hauteur-501")
 */
export function parseDisciplineOption(label: string): {
  name: string;
  structure: "EXTERIEUR" | "SALLE";
  code_ep: string;
} {
  if (!label) return { name: "", structure: "EXTERIEUR", code_ep: "" };
  const dashIdx = label.lastIndexOf("-");
  if (dashIdx === -1) {
    return { name: label, structure: "EXTERIEUR", code_ep: "" };
  }
  const code_ep = label.slice(dashIdx + 1).trim();
  const left = label.slice(0, dashIdx).trim();
  const isSalle = left.toLowerCase().includes(" salle");
  const name = isSalle ? left.replace(/\s+salle$/i, "").trim() : left;
  return {
    name,
    structure: isSalle ? "SALLE" : "EXTERIEUR",
    code_ep,
  };
}

/**
 * Recherche le code_ep officiel (colonne G) à partir des critères de la performance
 */
export function lookupOfficialCodeEp(
  disciplineName: string,
  structure: string = "EXTERIEUR",
  category?: string,
  sexe?: string
): string {
  if (!disciplineName) return "110";

  // Si le libellé contient déjà le suffixe -<code_ep> (ex: "100m-110" ou "60m salle-107")
  const suffixMatch = disciplineName.match(/-(\d+)$/);
  if (suffixMatch) return suffixMatch[1];

  // Si le libellé correspond directement au label d'une entrée officielle
  const entryByLabel = OFFICIAL_EVENT_ENTRIES.find(e => e.label.toLowerCase() === disciplineName.toLowerCase().trim());
  if (entryByLabel) return entryByLabel.code_ep;

  const rawClean = disciplineName
    .replace(/\s*-\s*(salle|indoor|plein\s*air)\b/gi, '')
    .replace(/\s+(salle|indoor|plein\s*air)\b/gi, '')
    .trim()
    .toLowerCase();

  const isSalle = disciplineName.toLowerCase().includes("salle") || 
                  disciplineName.toLowerCase().includes("indoor") || 
                  structure.toUpperCase().includes("SALLE") ||
                  rawClean === "60m";

  const normStruct = isSalle ? "SALLE" : "EXTERIEUR";
  const normCat = category ? category.slice(0, 2).toUpperCase() : "";
  const normSexe = sexe ? sexe.toUpperCase().slice(0, 1) : "";

  // Cas particuliers FFA prioritaires
  if (rawClean === "100m") return "110";
  if (rawClean === "60m") return "107";
  if (rawClean === "50m" && isSalle) return "105";
  if (rawClean === "50m" && !isSalle) return "104";
  if (rawClean === "80m") return "108";
  if (rawClean === "120m") return "109";
  if (rawClean === "200m" && !isSalle) return "208";
  if (rawClean === "200m" && isSalle) return "209";
  if (rawClean === "400m" && !isSalle) return "140";
  if (rawClean === "400m" && isSalle) return "140";
  if (rawClean === "longueur" && !isSalle) return "503";
  if (rawClean === "longueur" && isSalle) return "513";
  if (rawClean === "hauteur" && !isSalle) return "501";
  if (rawClean === "hauteur" && isSalle) return "511";
  if (rawClean === "perche" && !isSalle) return "502";
  if (rawClean === "perche" && isSalle) return "512";
  if (rawClean === "triple saut" && !isSalle) return "504";
  if (rawClean === "triple saut" && isSalle) return "514";
  if (rawClean === "poids" && !isSalle) return "601";
  if (rawClean === "poids" && isSalle) return "652";
  if (rawClean === "disque") return "608";
  if (rawClean === "marteau") return "603";
  if (rawClean === "javelot") return "605";

  // 1. Recherche exacte : disc + structure + cat + sexe
  const exact = OFFICIAL_EVENT_ENTRIES.find(e => 
    e.name.toLowerCase() === rawClean &&
    e.structure === normStruct &&
    (!normCat || e.cat === normCat || (normCat === "MA" && e.cat === "SE")) &&
    (!normSexe || e.sexe === normSexe)
  );
  if (exact) return exact.code_ep;

  // 2. Recherche disc + structure + cat
  const byCat = OFFICIAL_EVENT_ENTRIES.find(e => 
    e.name.toLowerCase() === rawClean &&
    e.structure === normStruct &&
    (!normCat || e.cat === normCat || (normCat === "MA" && e.cat === "SE"))
  );
  if (byCat) return byCat.code_ep;

  // 3. Recherche disc + structure
  const byStruct = OFFICIAL_EVENT_ENTRIES.find(e => 
    e.name.toLowerCase() === rawClean &&
    e.structure === normStruct
  );
  if (byStruct) return byStruct.code_ep;

  // 4. Recherche sur le nom seul
  const byName = OFFICIAL_EVENT_ENTRIES.find(e => e.name.toLowerCase() === rawClean);
  if (byName) return byName.code_ep;

  return isSalle ? "107" : "110";
}

/**
 * Groupes de familles athlétiques pour l'affichage
 */
export const OFFICIAL_FAMILIES = [
  "Sprint et Haies",
  "Demi-Fond & Fond",
  "Marche",
  "Sauts",
  "Lancers",
  "Épreuves Combinées",
  "Triathlon"
] as const;

/**
 * Récupère les disciplines filtrées selon la catégorie et la structure,
 * présentées sous la forme demandée (ex: "50m salle-105" ou "Hauteur-501").
 * - Globalement dans chaque catégorie : tri alphabétique (et non sur le code épreuve)
 * - Pour le Sprint et Haies : tout le sprint d'abord, puis toutes les haies
 * - Triathlon : placé après les épreuves combinées avec triathlon et triathlon salle
 */
export function getFilteredOfficialDisciplines(
  category: CategoryCode | "ALL",
  structure: "ALL" | "EXTERIEUR" | "SALLE" = "ALL",
  sexe: "ALL" | "M" | "F" = "ALL"
): Array<{ family: string; items: string[] }> {
  const normCat = category === "MA" ? "SE" : category;

  // Filtrer les entrées éligibles
  const filtered = OFFICIAL_EVENT_ENTRIES.filter(e => {
    // Filtre catégorie
    if (normCat !== "ALL" && e.cat !== normCat) {
      return false;
    }
    // Filtre structure
    if (structure !== "ALL" && e.structure !== structure) {
      return false;
    }
    // Filtre sexe
    if (sexe !== "ALL" && e.sexe !== sexe) {
      return false;
    }
    return true;
  });

  // Grouper par famille athlétique
  const familyMap = new Map<string, Set<string>>();
  OFFICIAL_FAMILIES.forEach(f => familyMap.set(f, new Set<string>()));

  filtered.forEach(entry => {
    const set = familyMap.get(entry.family);
    if (set) {
      set.add(entry.label);
    }
  });

  const result: Array<{ family: string; items: string[] }> = [];
  OFFICIAL_FAMILIES.forEach(f => {
    const itemsSet = familyMap.get(f);
    if (itemsSet && itemsSet.size > 0) {
      const itemsList = Array.from(itemsSet);

      if (f === "Sprint et Haies") {
        // Pour le sprint et haies, mettre d'abord tout le sprint puis toutes les haies (tri alphabétique)
        const sprints = itemsList.filter(item => !item.toLowerCase().includes('haie'));
        const haies = itemsList.filter(item => item.toLowerCase().includes('haie'));

        sprints.sort((a, b) => a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' }));
        haies.sort((a, b) => a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' }));

        result.push({
          family: f,
          items: [...sprints, ...haies]
        });
      } else {
        // Globalement dans chaque catégorie : tri alphabétique et non sur le code épreuve
        itemsList.sort((a, b) => a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' }));
        result.push({
          family: f,
          items: itemsList
        });
      }
    }
  });

  return result;
}

// Rétrocompatibilité
export const OFFICIAL_FFA_DISCIPLINES: OfficialDisciplineInfo[] = [
  { name: "50m", family: "Sprint et Haies", nature: "time", categories: ["BE", "MI"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "60m", family: "Sprint et Haies", nature: "time", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["SALLE"] },
  { name: "80m", family: "Sprint et Haies", nature: "time", categories: ["MI"], structures: ["EXTERIEUR"] },
  { name: "100m", family: "Sprint et Haies", nature: "time", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "120m", family: "Sprint et Haies", nature: "time", categories: ["MI"], structures: ["EXTERIEUR"] },
  { name: "200m", family: "Sprint et Haies", nature: "time", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "400m", family: "Sprint et Haies", nature: "time", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "800m", family: "Demi-Fond & Fond", nature: "time", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "1000m", family: "Demi-Fond & Fond", nature: "time", categories: ["BE", "MI"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "1500m", family: "Demi-Fond & Fond", nature: "time", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "2000m", family: "Demi-Fond & Fond", nature: "time", categories: ["MI"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "3000m", family: "Demi-Fond & Fond", nature: "time", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "5000m", family: "Demi-Fond & Fond", nature: "time", categories: ["JU", "ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "10000m", family: "Demi-Fond & Fond", nature: "time", categories: ["ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "50m Haies", family: "Sprint et Haies", nature: "time", categories: ["BE", "MI"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "60m Haies", family: "Sprint et Haies", nature: "time", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["SALLE"] },
  { name: "80m Haies", family: "Sprint et Haies", nature: "time", categories: ["MI"], structures: ["EXTERIEUR"] },
  { name: "100m Haies", family: "Sprint et Haies", nature: "time", categories: ["MI", "CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "110m Haies", family: "Sprint et Haies", nature: "time", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "200m Haies", family: "Sprint et Haies", nature: "time", categories: ["MI"], structures: ["EXTERIEUR"] },
  { name: "400m Haies", family: "Sprint et Haies", nature: "time", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "2000m Steeple", family: "Demi-Fond & Fond", nature: "time", categories: ["CA", "JU"], structures: ["EXTERIEUR"] },
  { name: "3000m Steeple", family: "Demi-Fond & Fond", nature: "time", categories: ["JU", "ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "2000m Marche", family: "Marche", nature: "time", categories: ["BE"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "3000m Marche", family: "Marche", nature: "time", categories: ["MI", "CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "5000m Marche", family: "Marche", nature: "time", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "10000m Marche", family: "Marche", nature: "time", categories: ["JU", "ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "Hauteur", family: "Sauts", nature: "distance", categories: ["BE", "MI", "CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "Perche", family: "Sauts", nature: "distance", categories: ["BE", "MI", "CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "Longueur", family: "Sauts", nature: "distance", categories: ["BE", "MI", "CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "Triple Saut", family: "Sauts", nature: "distance", categories: ["BE", "MI", "CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "Poids", family: "Lancers", nature: "distance", categories: ["BE", "MI", "CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "Disque", family: "Lancers", nature: "distance", categories: ["BE", "MI", "CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "Marteau", family: "Lancers", nature: "distance", categories: ["BE", "MI", "CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "Javelot", family: "Lancers", nature: "distance", categories: ["BE", "MI", "CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "Tétrathlon", family: "Épreuves Combinées", nature: "points", categories: ["BE"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "Pentathlon", family: "Épreuves Combinées", nature: "points", categories: ["MI", "CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "Pentathlon Perche", family: "Épreuves Combinées", nature: "points", categories: ["MI"], structures: ["SALLE"] },
  { name: "Hexathlon", family: "Épreuves Combinées", nature: "points", categories: ["MI"], structures: ["EXTERIEUR"] },
  { name: "Octathlon", family: "Épreuves Combinées", nature: "points", categories: ["MI"], structures: ["EXTERIEUR"] },
  { name: "Heptathlon", family: "Épreuves Combinées", nature: "points", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR", "SALLE"] },
  { name: "Décathlon", family: "Épreuves Combinées", nature: "points", categories: ["CA", "JU", "ES", "SE", "MA"], structures: ["EXTERIEUR"] },
  { name: "Triathlon", family: "Triathlon", nature: "points", categories: ["BE", "MI"], structures: ["EXTERIEUR"] },
  { name: "Triathlon salle", family: "Triathlon", nature: "points", categories: ["BE", "MI"], structures: ["SALLE"] },
];

/**
 * Groupes d'épreuves officielles avec codes épreuves pour les listes de sélection
 */
export const OFFICIAL_DISCIPLINE_GROUPS = getFilteredOfficialDisciplines("ALL", "ALL", "ALL");

export interface OfficialCodeEpInfo {
  code_ep: string;
  name: string;
  label: string;
  family: "Sprint et Haies" | "Demi-Fond & Fond" | "Marche" | "Sauts" | "Lancers" | "Épreuves Combinées" | "Triathlon" | "Autre";
  nature: "time" | "distance" | "points";
  structure?: "EXTERIEUR" | "SALLE";
}

/**
 * Retrouve la discipline officielle, sa famille athlétique et sa nature à partir du code_ep FFA officiel (colonne G)
 */
export function getEventInfoByCodeEp(code_ep?: string, fallbackDiscipline?: string): OfficialCodeEpInfo {
  const cleanCode = (code_ep || '').trim().replace(/^0+/, '');

  if (cleanCode) {
    // 1. Recherche dans le registre officiel des 367 épreuves
    const found = OFFICIAL_EVENT_ENTRIES.find(e => e.code_ep === cleanCode);
    if (found) {
      const nature: "time" | "distance" | "points" = 
        found.family === 'Épreuves Combinées' || found.family === 'Triathlon' ? 'points' :
        found.family === 'Sauts' || found.family === 'Lancers' ? 'distance' : 'time';

      return {
        code_ep: cleanCode,
        name: found.name,
        label: `${found.name} (Code ${cleanCode})`,
        family: found.family,
        nature,
        structure: found.structure,
      };
    }

    // 2. Fallbacks sur codes Logica spécifiques fréquents
    if (cleanCode === '106') {
      return {
        code_ep: '106',
        name: '60m',
        label: '60m (Code 106)',
        family: 'Sprint et Haies',
        nature: 'time',
        structure: 'SALLE',
      };
    }
    if (cleanCode === '727') {
      return {
        code_ep: '727',
        name: 'Heptathlon MF',
        label: 'Heptathlon MF (Code 727)',
        family: 'Épreuves Combinées',
        nature: 'points',
        structure: 'EXTERIEUR',
      };
    }
    if (cleanCode === '728') {
      return {
        code_ep: '728',
        name: 'Octathlon MH',
        label: 'Octathlon MH (Code 728)',
        family: 'Épreuves Combinées',
        nature: 'points',
        structure: 'EXTERIEUR',
      };
    }
    if (cleanCode === '795') {
      return {
        code_ep: '795',
        name: 'Triathlon U14-U16',
        label: 'Triathlon U14-U16 (Code 795)',
        family: 'Triathlon',
        nature: 'points',
        structure: 'EXTERIEUR',
      };
    }
  }

  // 3. Fallback sur le libellé de la discipline
  const fbName = fallbackDiscipline || 'Épreuve';
  const fbLower = fbName.toLowerCase();
  let family: OfficialCodeEpInfo['family'] = 'Autre';
  let nature: "time" | "distance" | "points" = 'time';

  if (fbLower.includes('athlon') || fbLower.includes('triathlon') || fbLower.includes('points')) {
    family = fbLower.includes('triathlon') ? 'Triathlon' : 'Épreuves Combinées';
    nature = 'points';
  } else if (fbLower.includes('hauteur') || fbLower.includes('perche') || fbLower.includes('longueur') || fbLower.includes('triple')) {
    family = 'Sauts';
    nature = 'distance';
  } else if (fbLower.includes('poids') || fbLower.includes('disque') || fbLower.includes('marteau') || fbLower.includes('javelot')) {
    family = 'Lancers';
    nature = 'distance';
  } else if (fbLower.includes('marche')) {
    family = 'Marche';
    nature = 'time';
  } else if (fbLower.includes('haie')) {
    family = 'Sprint et Haies';
    nature = 'time';
  } else if (fbLower.includes('800') || fbLower.includes('1000') || fbLower.includes('1500') || fbLower.includes('3000') || fbLower.includes('5000') || fbLower.includes('steeple')) {
    family = 'Demi-Fond & Fond';
    nature = 'time';
  } else {
    family = 'Sprint et Haies';
    nature = 'time';
  }

  return {
    code_ep: cleanCode || '000',
    name: fbName,
    label: cleanCode ? `${fbName} (Code ${cleanCode})` : fbName,
    family,
    nature,
    structure: 'EXTERIEUR',
  };
}
