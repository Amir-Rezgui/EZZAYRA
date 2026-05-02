import axios from "axios";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";

export type Classification = "extensif" | "intensif" | "hyper-intensif";
export type AnomalyStatus = "normal" | "warning" | "critical";

export type GeoJsonInput = Feature | FeatureCollection | Geometry | Polygon;

export type Parcel = {
  id: string;
  geometry: Geometry;
  classification: Classification;
  ndvi_score: number;
  anomaly_status: AnomalyStatus;
  confidence: number;
  history?: number[];
};

export type AnalyzeResponse = {
  job_id: string;
  status: string;
  parcelles: Parcel[];
};

export type ChatResponse = {
  transcription: string;
  response_text: string;
  response_audio_url: string;
  relevance_score: number;
  refused: boolean;
  result_image_url?: string | null;
};

export type AnomalyResponse = {
  parcel_id: string;
  status: AnomalyStatus;
  score: number;
  history: number[];
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 30000
});

const handleError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    throw new Error(error.response?.data?.detail || error.message || fallback);
  }
  throw new Error(fallback);
};

export const api = {
  async analyzePolygon(geojson: GeoJsonInput): Promise<AnalyzeResponse> {
    try {
      const response = await apiClient.post<AnalyzeResponse>(
        "/api/analyze/polygon",
        {
          geojson,
          zone_name: "Zone dessinee"
        }
      );
      return response.data;
    } catch (error) {
      handleError(error, "Impossible d'analyser la zone");
      throw new Error("unreachable");
    }
  },

  async sendVoiceMessage(audio: Blob, image?: File): Promise<ChatResponse> {
    try {
      const formData = new FormData();
      formData.append("audio", audio, "audio.webm");
      if (image) {
        formData.append("image", image);
      }
      const response = await apiClient.post<ChatResponse>(
        "/api/chat/voice",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );
      return response.data;
    } catch (error) {
      handleError(error, "Impossible d'envoyer le message vocal");
      throw new Error("unreachable");
    }
  },

  async getAnomaly(parcelId: string): Promise<AnomalyResponse> {
    try {
      const response = await apiClient.get<AnomalyResponse>(
        `/api/anomaly/${parcelId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "Impossible de recuperer les anomalies");
      throw new Error("unreachable");
    }
  },

  async exportGeoJSON(jobId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`/api/export/geojson/${jobId}`, {
        responseType: "blob"
      });
      return response.data as Blob;
    } catch (error) {
      handleError(error, "Impossible d'exporter le GeoJSON");
      throw new Error("unreachable");
    }
  },

  async getDemoParcelles(): Promise<Parcel[]> {
    const module = await import("../data/demo-parcelles.json");
    return module.default as Parcel[];
  }
};
