"use client";

import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { auth, db } from "@/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

export default function StatsPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // 🔹 Récupération et mise à jour du profil utilisateur
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/connexion");
                return;
            }

            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as UserProfile;
                    let updatedProfile = { ...data };

                    const today = new Date().toISOString().split("T")[0];
                    let weightHistory = data.weightHistory || [];

                    // Vérifie si le poids actuel diffère de la dernière entrée
                    const lastEntry = weightHistory[weightHistory.length - 1];
                    if (
                        data.weightKg &&
                        (!lastEntry || lastEntry.weight !== data.weightKg)
                    ) {
                        weightHistory.push({
                            date: today,
                            weight: data.weightKg,
                        });

                        updatedProfile.weightHistory = weightHistory;

                        // 🔸 Enregistre la mise à jour dans Firestore
                        await updateDoc(docRef, { weightHistory });
                    }

                    setProfile(updatedProfile);
                }
            } catch (error) {
                console.error("Erreur récupération Firestore:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                <p>Chargement des statistiques...</p>
            </div>
        );
    }

    const weightHistory = profile?.weightHistory || [
        { date: "2025-01-01", weight: profile?.weightKg || 70 },
    ];

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
            title: { display: true, text: "Évolution du poids" },
        },
        scales: { y: { beginAtZero: false } },
    };

    // 🔹 Calcul de l’évolution du poids (gain/perte)
    const weightChange =
        weightHistory.length > 1
            ? weightHistory[weightHistory.length - 1].weight -
            weightHistory[0].weight
            : 0;

    const changeColor =
        weightChange < 0 ? "text-green-600" : weightChange > 0 ? "text-red-600" : "text-gray-500";

    return (
        <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#333333]">
            <Nav photoUrl={profile?.photoUrl} />

            <main className="min-h-screen flex flex-col items-center p-8">
                <div className="w-full max-w-4xl">
                    <h1 className="text-4xl font-extrabold text-[#39393A] mb-6">
                        Statistiques de {profile?.firstName || "l'utilisateur"}
                    </h1>

                    {/* --- Graphique du poids --- */}
                    <section className="bg-white p-6 rounded-2xl shadow-md border border-black/5 mb-6">
                        {weightHistory.length ? (
                            <>
                                <Line data={weightData} options={weightOptions} />
                                <p className={`text-center mt-4 font-medium ${changeColor}`}>
                                    {weightChange < 0
                                        ? `🔻 ${Math.abs(weightChange)} kg perdus`
                                        : weightChange > 0
                                            ? `🔺 +${weightChange} kg pris`
                                            : "⚖️ Poids stable"}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-[#333]/70">
                                Aucune donnée de poids disponible.
                            </p>
                        )}
                    </section>

                    {/* --- Informations physiques --- */}
                    <section className="bg-white p-6 rounded-2xl shadow-md border border-black/5 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Données physiques</h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <li>
                                <span className="font-medium">Taille :</span>{" "}
                                {profile?.heightCm ? `${profile.heightCm} cm` : "Non renseignée"}
                            </li>
                            <li>
                                <span className="font-medium">Poids actuel :</span>{" "}
                                {profile?.weightKg ? `${profile.weightKg} kg` : "Non renseigné"}
                            </li>
                            <li>
                                <span className="font-medium">Séances / semaine :</span>{" "}
                                {profile?.training?.sessionsPerWeek || 0}
                            </li>
                            <li>
                                <span className="font-medium">Facteur d’activité :</span>{" "}
                                {profile?.nutrition?.activityFactor || 1.2}
                            </li>
                        </ul>
                    </section>

                    {/* --- Résumé rapide --- */}
                    <section className="bg-[#FCAB10]/10 border border-[#FCAB10]/20 p-6 rounded-2xl">
                        <h2 className="text-xl font-semibold mb-2 text-[#39393A]">
                            Résumé rapide
                        </h2>
                        <p className="text-[#333333]/80 text-sm leading-relaxed">
                            Vous effectuez actuellement{" "}
                            <strong>{profile?.training?.sessionsPerWeek || 0}</strong>{" "}
                            séances par semaine avec un facteur d’activité de{" "}
                            <strong>{profile?.nutrition?.activityFactor || 1.2}</strong>.{" "}
                            Continuez à suivre votre progression régulièrement pour observer
                            vos résultats sur le long terme 💪
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
