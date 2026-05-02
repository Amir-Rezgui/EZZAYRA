// ─── Anomaly Zone data ───────────────────────────────────────────────────────
// Replace coordinates with real ones provided by colleagues.
// Each zone has: polygon coordinates, alerts, and analysis samples.

export type AlertSeverity = "critical" | "warning" | "info";

export interface ZoneAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string; // ISO string
}

export interface ZoneAnalysis {
  id: string;
  date: string;
  ndvi: number;
  humidity: number;
  temperature: number;
  disease_risk: "low" | "medium" | "high";
  notes: string;
}

export interface AnomalyZone {
  id: string;
  name: string;
  status: "normal" | "warning" | "critical";
  /** GeoJSON polygon coordinates [lng, lat] */
  coordinates: [number, number][];
  alerts: ZoneAlert[];
  analyses: ZoneAnalysis[];
}

// ── DEMO ZONES ────────────────────────────────────────────────────────────────
export const ANOMALY_ZONES: AnomalyZone[] = [
  {
    id: "zone-sfax-sud",
    name: "Sfax Sud",
    status: "critical",
    coordinates: [
      [10.68, 34.61],
      [10.73, 34.59],
      [10.81, 34.60],
      [10.83, 34.65],
      [10.79, 34.71],
      [10.72, 34.72],
      [10.67, 34.68],
      [10.68, 34.61],
    ],
    alerts: [
      {
        id: "a1",
        severity: "critical",
        message: "NDVI critique : chute de 38 % sur 30 jours",
        timestamp: new Date(Date.now() - 3_600_000).toISOString(),
      },
      {
        id: "a2",
        severity: "warning",
        message: "Risque de verticilliose détecté (confiance 82 %)",
        timestamp: new Date(Date.now() - 7_200_000).toISOString(),
      },
      {
        id: "a3",
        severity: "info",
        message: "Humidité du sol en dessous du seuil optimal",
        timestamp: new Date(Date.now() - 14_400_000).toISOString(),
      },
    ],
    analyses: [
      { id: "an1", date: "2025-05-01", ndvi: 0.31, humidity: 22, temperature: 28, disease_risk: "high",   notes: "Stress hydrique sévère détecté" },
      { id: "an2", date: "2025-04-01", ndvi: 0.38, humidity: 27, temperature: 26, disease_risk: "high",   notes: "Début de décoloration foliaire" },
      { id: "an3", date: "2025-03-01", ndvi: 0.44, humidity: 33, temperature: 22, disease_risk: "medium", notes: "Légère baisse NDVI confirmée" },
      { id: "an4", date: "2025-02-01", ndvi: 0.50, humidity: 40, temperature: 18, disease_risk: "low",    notes: "Situation normale" },
    ],
  },
  {
    id: "zone-kebili",
    name: "Kébili",
    status: "warning",
    coordinates: [
      [8.91, 33.61],
      [8.99, 33.59],
      [9.08, 33.62],
      [9.11, 33.68],
      [9.07, 33.76],
      [8.97, 33.78],
      [8.89, 33.73],
      [8.88, 33.65],
      [8.91, 33.61],
    ],
    alerts: [
      {
        id: "b1",
        severity: "warning",
        message: "Température nocturne anormalement basse (< 4 °C)",
        timestamp: new Date(Date.now() - 1_800_000).toISOString(),
      },
      {
        id: "b2",
        severity: "info",
        message: "Rendement prévu en baisse de 15 %",
        timestamp: new Date(Date.now() - 5_400_000).toISOString(),
      },
    ],
    analyses: [
      { id: "bn1", date: "2025-05-01", ndvi: 0.46, humidity: 30, temperature: 25, disease_risk: "medium", notes: "Gelées légères enregistrées" },
      { id: "bn2", date: "2025-04-01", ndvi: 0.51, humidity: 35, temperature: 21, disease_risk: "low",    notes: "Développement végétatif normal" },
      { id: "bn3", date: "2025-03-01", ndvi: 0.53, humidity: 38, temperature: 19, disease_risk: "low",    notes: "Bonne reprise végétative" },
    ],
  },
  {
    id: "zone-monastir",
    name: "Monastir",
    status: "warning",
    coordinates: [
      [10.76, 35.66],
      [10.83, 35.64],
      [10.91, 35.67],
      [10.92, 35.73],
      [10.87, 35.79],
      [10.80, 35.80],
      [10.74, 35.76],
      [10.73, 35.70],
      [10.76, 35.66],
    ],
    alerts: [
      {
        id: "c1",
        severity: "warning",
        message: "Oïdium détecté sur 12 % de la superficie",
        timestamp: new Date(Date.now() - 900_000).toISOString(),
      },
    ],
    analyses: [
      { id: "cn1", date: "2025-05-01", ndvi: 0.47, humidity: 45, temperature: 24, disease_risk: "medium", notes: "Traitement phytosanitaire recommandé" },
      { id: "cn2", date: "2025-04-01", ndvi: 0.48, humidity: 50, temperature: 22, disease_risk: "medium", notes: "Présence fongique confirmée" },
    ],
  },
  {
    id: "zone-nabeul",
    name: "Nabeul",
    status: "normal",
    coordinates: [
      [10.66, 36.41],
      [10.74, 36.39],
      [10.83, 36.42],
      [10.84, 36.48],
      [10.80, 36.55],
      [10.73, 36.57],
      [10.65, 36.53],
      [10.63, 36.46],
      [10.66, 36.41],
    ],
    alerts: [],
    analyses: [
      { id: "dn1", date: "2025-05-01", ndvi: 0.67, humidity: 55, temperature: 22, disease_risk: "low", notes: "Excellente vigueur végétative" },
      { id: "dn2", date: "2025-04-01", ndvi: 0.65, humidity: 58, temperature: 20, disease_risk: "low", notes: "Floraison en cours — état sain" },
    ],
  },
];
