import { useState, useMemo } from "react";
import {
  ClipboardList,
  TreePine,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
} from "lucide-react";
import clsx from "clsx";
import { useAnomalyData } from "../services/anomalyService";

export default function AnalysesPage() {
  const { results, loading } = useAnomalyData();
  const [searchTerm, setSearchTerm] = useState("");

  // ── Computations ──
  const stats = useMemo(() => {
    if (results.length === 0) return null;

    const totalArea = results.reduce((sum, r) => sum + r.area_ha, 0);
    const avgNdvi = results.reduce((sum, r) => sum + r.ndvi_actuel, 0) / results.length;
    const criticalCount = results.filter((r) => r.status === "critical").length;
    const warningCount = results.filter((r) => r.status === "warning").length;
    const normalCount = results.filter((r) => r.status === "normal").length;
    
    const intensifCount = results.filter((r) => r.systeme === "intensif").length;
    const extensifCount = results.filter((r) => r.systeme === "extensif").length;

    return {
      totalArea,
      avgNdvi,
      criticalCount,
      warningCount,
      normalCount,
      intensifCount,
      extensifCount,
    };
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!searchTerm) return results;
    const lower = searchTerm.toLowerCase();
    return results.filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.gouvernorat.toLowerCase().includes(lower) ||
        r.systeme.toLowerCase().includes(lower)
    );
  }, [results, searchTerm]);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* ── Header ── */}
      <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-olive-dark/70">Récapitulatif & Statistiques</p>
        <h2 className="mt-2 text-3xl">Vue Globale du Domaine</h2>
        <p className="mt-2 text-sm text-olive-dark/70">
          Supervision analytique de toutes vos parcelles connectées.
        </p>
      </section>

      {/* ── Loading State ── */}
      {loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-olive-dark/50">
          <RefreshCw size={32} className="animate-spin mb-4" />
          <p>Chargement des statistiques...</p>
        </div>
      )}

      {/* ── Stats Grid ── */}
      {!loading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-olive backdrop-blur flex flex-col items-center text-center">
            <TreePine size={24} className="text-olive-mid mb-2" />
            <p className="text-xs uppercase text-olive-dark/60 font-bold">Total Parcelles</p>
            <p className="text-2xl font-black text-olive-dark mt-1">{results.length}</p>
            <p className="text-[10px] text-olive-dark/50 mt-1">{stats.totalArea.toFixed(0)} ha au total</p>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-olive backdrop-blur flex flex-col items-center text-center">
            <Activity size={24} className="text-blue-500 mb-2" />
            <p className="text-xs uppercase text-olive-dark/60 font-bold">NDVI Moyen</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats.avgNdvi.toFixed(2)}</p>
            <p className="text-[10px] text-olive-dark/50 mt-1">Indice de végétation</p>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-olive backdrop-blur flex flex-col items-center text-center">
            <AlertTriangle size={24} className="text-red-500 mb-2" />
            <p className="text-xs uppercase text-olive-dark/60 font-bold">Alertes Actives</p>
            <p className="text-2xl font-black text-red-600 mt-1">{stats.criticalCount + stats.warningCount}</p>
            <p className="text-[10px] text-red-500/70 mt-1">{stats.criticalCount} critiques, {stats.warningCount} attention</p>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-olive backdrop-blur flex flex-col items-center text-center">
            <ClipboardList size={24} className="text-orange-500 mb-2" />
            <p className="text-xs uppercase text-olive-dark/60 font-bold">Systèmes</p>
            <div className="mt-2 w-full flex justify-between text-sm font-bold text-olive-dark">
              <span>Intensif: <span className="text-olive-mid">{stats.intensifCount}</span></span>
              <span>Extensif: <span className="text-olive-mid">{stats.extensifCount}</span></span>
            </div>
          </div>
        </div>
      )}

      {/* ── Global List ── */}
      {!loading && results.length > 0 && (
        <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur w-full min-w-0 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-olive-dark">Liste des parcelles</h3>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-dark/40" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/80 border-none rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-olive-mid outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full pb-2 scrollbar-thin scrollbar-thumb-olive-mid/20">
            <table className="w-full text-left text-sm text-olive-dark whitespace-nowrap min-w-[600px]">
              <thead className="text-xs uppercase text-olive-dark/60 border-b border-olive-mid/10">
                <tr>
                  <th className="pb-3 px-2 font-semibold">Parcelle</th>
                  <th className="pb-3 px-2 font-semibold">Gouvernorat</th>
                  <th className="pb-3 px-2 font-semibold">Système</th>
                  <th className="pb-3 px-2 font-semibold text-right">Surface (ha)</th>
                  <th className="pb-3 px-2 font-semibold text-right">NDVI</th>
                  <th className="pb-3 px-2 font-semibold text-right">LST (°C)</th>
                  <th className="pb-3 px-2 font-semibold text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-mid/5">
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-white/40 transition">
                    <td className="py-3 px-2 font-bold">{r.name}</td>
                    <td className="py-3 px-2 text-olive-dark/80">{r.gouvernorat}</td>
                    <td className="py-3 px-2 capitalize text-olive-dark/80">{r.systeme}</td>
                    <td className="py-3 px-2 text-right text-olive-dark/80">{r.area_ha.toFixed(1)}</td>
                    <td className="py-3 px-2 text-right font-bold">{r.ndvi_actuel.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right text-orange-600 font-semibold">
                      {r.lst_observe?.length > 0 ? (r.lst_observe[r.lst_observe.length - 1] - 273.15).toFixed(1) : "--"}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center">
                        {r.status === "critical" ? (
                          <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                            <AlertTriangle size={12} /> Critique
                          </span>
                        ) : r.status === "warning" ? (
                          <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600">
                            <AlertTriangle size={12} /> Attention
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600">
                            <CheckCircle2 size={12} /> Normal
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-olive-dark/50 italic">
                      Aucune parcelle trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
