"use client";

import { useEffect, useMemo, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { auth, db } from "@/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
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
import { useRouter } from "next/navigation";
import PatternBackground from "../components/PatternV2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type WeightEntry = {
    date: string;
    weight: number;
};

type UserProfile = {
    firstName?: string;
    heightCm?: number;
    weightKg?: number;
    training?: { sessionsPerWeek?: number };
    nutrition?: { activityFactor?: number };
    weightHistory?: WeightEntry[];
    photoUrl?: string;
};

type TrainingLog = {
    id: string;
    date: string;
    seanceTitle?: string;
    volume?: number;
    exercisesCount?: number;
};

export default function StatsPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsError, setLogsError] = useState<string | null>(null);
    const router = useRouter();

    const loadTrainingLogs = async (uid: string) => {
        setLogsLoading(true);
        setLogsError(null);
        try {
            const snap = await getDocs(query(collection(db, "users", uid, "trainingLogs"), orderBy("date", "asc")));
            const items: TrainingLog[] = snap.docs.map((docSnap) => {
                const data = docSnap.data() as Record<string, unknown>;
                return {
                    id: docSnap.id,
                    date: String(data.date ?? ""),
                    seanceTitle: typeof data.seanceTitle === "string" ? data.seanceTitle : undefined,
                    volume: typeof data.volume === "number" ? data.volume : Number(data.volume) || 0,
                    exercisesCount: Array.isArray((data as any).exercises) ? (data as any).exercises.length : undefined,
                };
            });
            setTrainingLogs(items);
        } catch (error) {
            setLogsError(error instanceof Error ? error.message : "Impossible de charger les seances.");
        } finally {
            setLogsLoading(false);
        }
    };

    // Auth + chargement profil et seances suivies
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/connexion");
                return;
            }
            setUserId(user.uid);

            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as UserProfile;
                    let updatedProfile = { ...data };

                    const today = new Date().toISOString().split("T")[0];
                    let weightHistory = data.weightHistory || [];

                    const lastEntry = weightHistory[weightHistory.length - 1];
                    if (data.weightKg && (!lastEntry || lastEntry.weight !== data.weightKg)) {
                        weightHistory = [...weightHistory, { date: today, weight: data.weightKg }];
                        updatedProfile.weightHistory = weightHistory;
                        await updateDoc(docRef, { weightHistory });
                    }

                    setProfile(updatedProfile);
                }
                await loadTrainingLogs(user.uid);
            } catch (error) {
                console.error("Erreur Firestore:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const weightHistory = profile?.weightHistory && profile.weightHistory.length
        ? profile.weightHistory
        : [{ date: "2025-01-01", weight: profile?.weightKg || 70 }];

    const weightData = {
        labels: weightHistory.map((entry) => entry.date),
        datasets: [
            {
                label: "Poids (kg)",
                data: weightHistory.map((entry) => entry.weight),
                borderColor: "#FCAB10",
                backgroundColor: "#FCAB1055",
                tension: 0.3,
            },
        ],
    };

    const weightOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" as const },
            title: { display: true, text: "Evolution du poids" },
        },
        scales: { y: { beginAtZero: false } },
    };

    const weightChange =
        weightHistory.length > 1
            ? weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight
            : 0;

    const changeColor =
        weightChange < 0 ? "text-green-600" : weightChange > 0 ? "text-red-600" : "text-gray-500";

    const trainingSeries = useMemo(() => {
        if (!trainingLogs.length) return [];
        const map = new Map<string, number>();
        trainingLogs.forEach((log) => {
            const key = log.date || "";
            const val = Number(log.volume) || 0;
            if (!key) return;
            map.set(key, (map.get(key) ?? 0) + val);
        });
        return Array.from(map.entries())
            .map(([date, volume]) => ({ date, volume }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [trainingLogs]);

    const trainingChartData = useMemo(() => {
        if (!trainingSeries.length) return null;
        return {
            labels: trainingSeries.map((t) => t.date),
            datasets: [
                {
                    label: "Volume (reps x kg)",
                    data: trainingSeries.map((t) => t.volume),
                    borderColor: "#39393A",
                    backgroundColor: "#39393A",
                    tension: 0.25,
                },
            ],
        };
    }, [trainingSeries]);

    const trainingChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" as const },
            title: { display: true, text: "Progression des seances" },
        },
        scales: { y: { beginAtZero: true } },
    };

    const recentLogs = useMemo(() => trainingLogs.slice(-8).reverse(), [trainingLogs]);

    return (
        <div className="min-h-screen font-sans text-[#333333] ">
            <Nav photoUrl={profile?.photoUrl} />
            <PatternBackground />

            <main className="min-h-screen flex flex-col items-center p-8 animate-page-enter">
                <div className="w-full max-w-5xl bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-black/5 mb-6 animate-card-rise animate-delay-1">
                    <h1 className="text-4xl font-extrabold text-[#39393A] mb-6">
                        Statistiques de {profile?.firstName || "l'utilisateur"}
                    </h1>

                    {loading && (
                        <div className="flex min-h-[200px] items-center justify-center text-sm text-[#333]/70">
                            Chargement des statistiques...
                        </div>
                    )}

                    {!loading && (
                        <>

                    <section className="bg-white p-6 rounded-2xl shadow-md border border-black/5 mb-6 animate-card-pop animate-delay-2">
                        {weightHistory.length ? (
                            <>
                                <Line data={weightData} options={weightOptions} />
                                <p className={`text-center mt-4 font-medium ${changeColor}`}>
                                    {weightChange < 0
                                        ? `${Math.abs(weightChange)} kg perdus`
                                        : weightChange > 0
                                            ? `+${weightChange} kg pris`
                                            : "Poids stable"}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-[#333]/70">Aucune donnee de poids disponible.</p>
                        )}
                    </section>

                    <section className="bg-white p-6 rounded-2xl shadow-md border border-black/5 mb-6 animate-card-pop animate-delay-3">
                        <h2 className="text-xl font-semibold mb-4">Progression des seances</h2>
                        {logsError && <p className="mb-3 text-sm text-red-600">{logsError}</p>}
                        <div className="h-64">
                            {logsLoading ? (
                                <div className="grid h-full place-items-center text-sm text-[#333]/70">Chargement...</div>
                            ) : trainingChartData ? (
                                <Line data={trainingChartData} options={trainingChartOptions} />
                            ) : (
                                <div className="grid h-full place-items-center text-sm text-[#333]/70">
                                    Aucune seance suivie pour l'instant. Enregistrez vos series depuis la page Programme.
                                </div>
                            )}
                        </div>
                        {recentLogs.length > 0 && (
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-[#39393A]/70">
                                            <th className="px-2 py-2">Date</th>
                                            <th className="px-2 py-2">Seance</th>
                                            <th className="px-2 py-2">Volume total</th>
                                            <th className="px-2 py-2">Nb exos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentLogs.map((log) => (
                                            <tr key={log.id} className="border-t border-black/5 text-[#333333]/90">
                                                <td className="px-2 py-2">{log.date || "-"}</td>
                                                <td className="px-2 py-2">{log.seanceTitle || "Sans titre"}</td>
                                                <td className="px-2 py-2">{log.volume != null ? Math.round(log.volume) : "-"}</td>
                                                <td className="px-2 py-2">{log.exercisesCount ?? "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="bg-white p-6 rounded-2xl shadow-md border border-black/5 mb-6 animate-card-pop animate-delay-4">
                        <h2 className="text-xl font-semibold mb-4">Donnees physiques</h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <li>
                                <span className="font-medium">Taille :</span>{" "}
                                {profile?.heightCm ? `${profile.heightCm} cm` : "Non renseignee"}
                            </li>
                            <li>
                                <span className="font-medium">Poids actuel :</span>{" "}
                                {profile?.weightKg ? `${profile.weightKg} kg` : "Non renseigne"}
                            </li>
                            <li>
                                <span className="font-medium">Seances / semaine :</span>{" "}
                                {profile?.training?.sessionsPerWeek || 0}
                            </li>
                            <li>
                                <span className="font-medium">Facteur d'activite :</span>{" "}
                                {profile?.nutrition?.activityFactor || 1.2}
                            </li>
                        </ul>
                    </section>

                    <section className="bg-[#FCAB10]/10 border border-[#FCAB10]/20 p-6 rounded-2xl animate-card-pop animate-delay-5">
                        <h2 className="text-xl font-semibold mb-2 text-[#39393A]">Resume rapide</h2>
                        <p className="text-[#333333]/80 text-sm leading-relaxed">
                            Vous effectuez actuellement{" "}
                            <strong>{profile?.training?.sessionsPerWeek || 0}</strong>{" "}
                            seances par semaine avec un facteur d'activite de{" "}
                            <strong>{profile?.nutrition?.activityFactor || 1.2}</strong>.{" "}
                            Continuez a suivre votre progression regulierement pour observer vos resultats sur le long terme.
                        </p>
                    </section>
                        </>
                    )}
                </div>
            </main >

            <Footer />
        </div >
    );
}
