"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import PatternBackground from "../components/PatternV2";
import { auth, db } from "@/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type MetricEntry = {
  id: string;
  measuredAt: string; // YYYY-MM-DD
  weightKg?: number;
  bmi?: number;
  waistCm?: number;
  sleepHours?: number;
  energyLevel?: number;
};

type FormState = {
  measuredAt: string;
  weightKg: string;
  waistCm: string;
  sleepHours: string;
  energyLevel: string;
};

const todayKey = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

function toDate(measuredAt: string): Date | null {
  const parsed = new Date(`${measuredAt}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function MetricsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [form, setForm] = useState<FormState>({
    measuredAt: todayKey(),
    weightKg: "",
    waistCm: "",
    sleepHours: "",
    energyLevel: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState | null>(null);
  const [rowSaving, setRowSaving] = useState(false);
  const [rowDeleting, setRowDeleting] = useState<string | null>(null);

  // Auth + profil (taille pour IMC)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/connexion");
        return;
      }
      setUserId(firebaseUser.uid);
      getDoc(doc(db, "users", firebaseUser.uid))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data() as { heightCm?: number };
            if (typeof data.heightCm === "number") setHeightCm(data.heightCm);
          }
        })
        .catch(() => {
          /* noop */
        })
        .finally(() => setLoading(false));
    });
    return () => unsubscribe();
  }, [router]);

  const loadMetrics = useCallback(
    async (uid: string) => {
      setError(null);
      try {
        const q = query(
          collection(db, "users", uid, "metrics"),
          orderBy("measuredAt", "desc"),
          limit(90)
        );
        const snap = await getDocs(q);
        const items: MetricEntry[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Partial<MetricEntry>;
          return {
            id: docSnap.id,
            measuredAt: String(data.measuredAt ?? ""),
            weightKg: typeof data.weightKg === "number" ? data.weightKg : undefined,
            bmi: typeof data.bmi === "number" ? data.bmi : undefined,
            waistCm: typeof data.waistCm === "number" ? data.waistCm : undefined,
            sleepHours: typeof data.sleepHours === "number" ? data.sleepHours : undefined,
            energyLevel: typeof data.energyLevel === "number" ? data.energyLevel : undefined,
          };
        });
        setMetrics(items);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Impossible de charger les métriques pour l'instant."
        );
      }
    },
    []
  );

  useEffect(() => {
    if (!userId) return;
    loadMetrics(userId);
  }, [userId, loadMetrics]);

  const handleChange = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const handleEditChange = (key: keyof FormState) => (value: string) =>
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError(null);

    try {
      const weight = Number(form.weightKg);
      const waist = form.waistCm ? Number(form.waistCm) : undefined;
      const sleep = form.sleepHours ? Number(form.sleepHours) : undefined;
      const energy = form.energyLevel ? Number(form.energyLevel) : undefined;

      if (!Number.isFinite(weight) || weight <= 0) throw new Error("Poids invalide.");
      if (waist !== undefined && (!Number.isFinite(waist) || waist <= 0))
        throw new Error("Tour de taille invalide.");
      if (sleep !== undefined && (sleep < 0 || sleep > 24)) throw new Error("Sommeil invalide.");
      if (energy !== undefined && (energy < 1 || energy > 10)) throw new Error("Énergie 1 à 10.");

      let bmi: number | undefined = undefined;
      if (heightCm && heightCm > 0) {
        const h = heightCm / 100;
        bmi = Number((weight / (h * h)).toFixed(1));
      }

      await addDoc(collection(db, "users", userId, "metrics"), {
        measuredAt: form.measuredAt,
        weightKg: weight,
        bmi: bmi ?? null,
        waistCm: waist ?? null,
        sleepHours: sleep ?? null,
        energyLevel: energy ?? null,
        createdAt: serverTimestamp(),
      });

      setForm((prev) => ({
        ...prev,
        weightKg: "",
        waistCm: "",
        sleepHours: "",
        energyLevel: "",
      }));
      await loadMetrics(userId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer la métrique.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry: MetricEntry) => {
    setEditingId(entry.id);
    setError(null);
    setEditForm({
      measuredAt: entry.measuredAt || todayKey(),
      weightKg: entry.weightKg != null ? String(entry.weightKg) : "",
      waistCm: entry.waistCm != null ? String(entry.waistCm) : "",
      sleepHours: entry.sleepHours != null ? String(entry.sleepHours) : "",
      energyLevel: entry.energyLevel != null ? String(entry.energyLevel) : "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setRowSaving(false);
    setRowDeleting(null);
  };

  const handleUpdateRow = async () => {
    if (!userId || !editingId || !editForm) return;
    setRowSaving(true);
    setError(null);
    try {
      const weight = Number(editForm.weightKg);
      const waist = editForm.waistCm ? Number(editForm.waistCm) : undefined;
      const sleep = editForm.sleepHours ? Number(editForm.sleepHours) : undefined;
      const energy = editForm.energyLevel ? Number(editForm.energyLevel) : undefined;

      if (!Number.isFinite(weight) || weight <= 0) throw new Error("Poids invalide.");
      if (waist !== undefined && (!Number.isFinite(waist) || waist <= 0))
        throw new Error("Tour de taille invalide.");
      if (sleep !== undefined && (sleep < 0 || sleep > 24)) throw new Error("Sommeil invalide.");
      if (energy !== undefined && (energy < 1 || energy > 10)) throw new Error("Ç%nergie 1 Çÿ 10.");

      let bmi: number | undefined = undefined;
      if (heightCm && heightCm > 0) {
        const h = heightCm / 100;
        bmi = Number((weight / (h * h)).toFixed(1));
      }

      await updateDoc(doc(db, "users", userId, "metrics", editingId), {
        measuredAt: editForm.measuredAt,
        weightKg: weight,
        bmi: bmi ?? null,
        waistCm: waist ?? null,
        sleepHours: sleep ?? null,
        energyLevel: energy ?? null,
      });

      await loadMetrics(userId);
      cancelEdit();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de mettre Çÿ jour la mÇ¸trique.");
    } finally {
      setRowSaving(false);
    }
  };

  const handleDeleteRow = async (id: string) => {
    if (!userId) return;
    setRowDeleting(id);
    setError(null);
    try {
      await deleteDoc(doc(db, "users", userId, "metrics", id));
      await loadMetrics(userId);
      if (editingId === id) cancelEdit();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer la mÇ¸trique.");
    } finally {
      setRowDeleting(null);
    }
  };

  const filtered = useMemo(() => {
    if (!metrics.length) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range + 1);
    return metrics
      .filter((m) => {
        const d = toDate(m.measuredAt);
        return d ? d >= cutoff : false;
      })
      .sort((a, b) => {
        const da = toDate(a.measuredAt)?.getTime() ?? 0;
        const db = toDate(b.measuredAt)?.getTime() ?? 0;
        return da - db;
      });
  }, [metrics, range]);

  const chartData = useMemo(() => {
    const labels = filtered.map((m) => m.measuredAt);
    return {
      labels,
      datasets: [
        {
          label: "Poids (kg)",
          data: filtered.map((m) => m.weightKg ?? null),
          borderColor: "#FCAB10",
          backgroundColor: "#FCAB10",
          tension: 0.25,
          spanGaps: true,
          yAxisID: "y",
        },
        {
          label: "IMC",
          data: filtered.map((m) => m.bmi ?? null),
          borderColor: "#4CAF50",
          backgroundColor: "#4CAF50",
          tension: 0.25,
          spanGaps: true,
          yAxisID: "y",
        },
        {
          label: "Tour de taille (cm)",
          data: filtered.map((m) => m.waistCm ?? null),
          borderColor: "#39393A",
          backgroundColor: "#39393A",
          borderDash: [6, 6],
          tension: 0.25,
          spanGaps: true,
          yAxisID: "y",
        },
        {
          label: "Sommeil (h)",
          data: filtered.map((m) => m.sleepHours ?? null),
          borderColor: "#2196F3",
          backgroundColor: "#2196F3",
          spanGaps: true,
          yAxisID: "y1",
        },
        {
          label: "Énergie (1-10)",
          data: filtered.map((m) => m.energyLevel ?? null),
          borderColor: "#9C27B0",
          backgroundColor: "#9C27B0",
          borderDash: [4, 2],
          spanGaps: true,
          yAxisID: "y1",
        },
      ],
    };
  }, [filtered]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" as const },
        title: { display: false },
      },
      scales: {
        y: {
          type: "linear" as const,
          position: "left" as const,
          title: { display: true, text: "Poids / IMC / Tour" },
        },
        y1: {
          type: "linear" as const,
          position: "right" as const,
          grid: { drawOnChartArea: false },
          title: { display: true, text: "Sommeil / Énergie" },
          suggestedMin: 0,
          suggestedMax: 10,
        },
      },
    }),
    []
  );

  const lastEntry = metrics[0];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  return (
    <div className="relative min-h-screen font-sans text-[#333333]">
      <Nav />
      <PatternBackground />

      <main className="relative z-10 mx-auto flex w-[90%] max-w-6xl flex-col gap-8 py-12 animate-page-enter">
        <header className="flex flex-col gap-2 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-md shadow-black/5 backdrop-blur-sm">
          <h1 className="text-3xl font-extrabold text-[#39393A]">Journal des métriques</h1>
          <p className="text-sm text-[#333333]/80">
            Saisis ton poids, IMC (calculé), tour de taille, sommeil et niveau d'énergie. Les
            données sont stockées dans <code>/users/&lt;uid&gt;/metrics</code>.
          </p>
          {lastEntry && (
            <div className="flex flex-wrap gap-4 text-sm text-[#39393A]/80">
              <span className="rounded-lg bg-[#FCAB10]/10 px-3 py-1 font-semibold">
                Dernier poids: {lastEntry.weightKg ?? "?"} kg
              </span>
              {lastEntry.bmi && (
                <span className="rounded-lg bg-[#4CAF50]/10 px-3 py-1 font-semibold">
                  IMC: {lastEntry.bmi}
                </span>
              )}
            </div>
          )}
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-black/5 bg-white/95 p-6 shadow-lg shadow-black/5"
          >
            <h2 className="text-xl font-bold text-[#39393A]">Nouvelle saisie</h2>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-medium text-[#39393A]">
                Date
                <input
                  type="date"
                  value={form.measuredAt}
                  onChange={(e) => handleChange("measuredAt")(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]"
                  required
                />
              </label>
              <label className="text-sm font-medium text-[#39393A]">
                Poids (kg) *
                <input
                  type="number"
                  value={form.weightKg}
                  onChange={(e) => handleChange("weightKg")(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]"
                  placeholder="Ex: 70"
                  required
                />
              </label>
              <label className="text-sm font-medium text-[#39393A]">
                Tour de taille (cm)
                <input
                  type="number"
                  value={form.waistCm}
                  onChange={(e) => handleChange("waistCm")(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]"
                  placeholder="Ex: 82"
                />
              </label>
              <label className="text-sm font-medium text-[#39393A]">
                Sommeil (heures)
                <input
                  type="number"
                  step="0.25"
                  value={form.sleepHours}
                  onChange={(e) => handleChange("sleepHours")(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]"
                  placeholder="Ex: 7.5"
                />
              </label>
              <label className="text-sm font-medium text-[#39393A]">
                Niveau d'énergie (1-10)
                <input
                  type="number"
                  min={1}
                  max={10}
                  step="1"
                  value={form.energyLevel}
                  onChange={(e) => handleChange("energyLevel")(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]"
                  placeholder="Ex: 8"
                />
              </label>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-[#FCAB10] px-5 text-sm font-semibold text-white shadow hover:brightness-95 disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer la métrique"}
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-black/5 bg-white/95 p-6 shadow-lg shadow-black/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#39393A]">Tendances</h2>
              <div className="flex gap-2">
                {[7, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setRange(d as 7 | 30)}
                    className={`rounded-lg px-3 py-1 text-sm ${
                      range === d ? "bg-[#FCAB10] text-white" : "bg-[#F5F5F5] text-[#39393A]"
                    }`}
                  >
                    {d} jours
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72">
              {filtered.length ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="grid h-full place-items-center text-sm text-[#333]/70">
                  Aucune donnée sur la période.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white/95 p-6 shadow-lg shadow-black/5">
          <h2 className="text-xl font-bold text-[#39393A] mb-4">Historique récent</h2>
          {metrics.length === 0 ? (
            <p className="text-sm text-[#333]/70">Aucune métrique enregistrée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                                <thead>
                  <tr className="text-[#39393A]/70">
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Poids (kg)</th>
                    <th className="px-2 py-2">IMC</th>
                    <th className="px-2 py-2">T. taille (cm)</th>
                    <th className="px-2 py-2">Sommeil (h)</th>
                    <th className="px-2 py-2">Energie</th>
                    <th className="px-2 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(0, 30).map((m) => (
                    <tr key={m.id} className="border-t border-black/5 text-[#333333]/90">
                      {editingId === m.id && editForm ? (
                        <>
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={editForm.measuredAt}
                              onChange={(e) => handleEditChange("measuredAt")(e.target.value)}
                              className="h-9 w-full rounded-md border border-black/10 px-2 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={editForm.weightKg}
                              onChange={(e) => handleEditChange("weightKg")(e.target.value)}
                              className="h-9 w-full rounded-md border border-black/10 px-2 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2 text-[#333]/70">{m.bmi ?? "-"}</td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={editForm.waistCm}
                              onChange={(e) => handleEditChange("waistCm")(e.target.value)}
                              className="h-9 w-full rounded-md border border-black/10 px-2 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              step="0.25"
                              value={editForm.sleepHours}
                              onChange={(e) => handleEditChange("sleepHours")(e.target.value)}
                              className="h-9 w-full rounded-md border border-black/10 px-2 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={editForm.energyLevel}
                              onChange={(e) => handleEditChange("energyLevel")(e.target.value)}
                              className="h-9 w-full rounded-md border border-black/10 px-2 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={handleUpdateRow}
                              disabled={rowSaving}
                              className="rounded-lg bg-[#FCAB10] px-3 py-1 text-white text-xs font-semibold disabled:opacity-60"
                            >
                              {rowSaving ? "Enregistrement..." : "Sauver"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-lg border border-black/10 px-3 py-1 text-xs font-semibold text-[#39393A]"
                            >
                              Annuler
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-2">{m.measuredAt}</td>
                          <td className="px-2 py-2">{m.weightKg ?? "-"}</td>
                          <td className="px-2 py-2">{m.bmi ?? "-"}</td>
                          <td className="px-2 py-2">{m.waistCm ?? "-"}</td>
                          <td className="px-2 py-2">{m.sleepHours ?? "-"}</td>
                          <td className="px-2 py-2">{m.energyLevel ?? "-"}</td>
                          <td className="px-2 py-2 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => startEdit(m)}
                              className="rounded-lg border border-black/10 px-3 py-1 text-xs font-semibold text-[#39393A]"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(m.id)}
                              disabled={rowDeleting === m.id}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 disabled:opacity-60"
                            >
                              {rowDeleting === m.id ? "Suppression..." : "Supprimer"}
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}


