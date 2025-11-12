"use client";
import React, { useEffect, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { auth, db } from "@/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

type UserProfile = {
    photoUrl?: string;
};

interface Exercice {
    nom: string;
    repetitions: string;
}

interface Seance {
    id: number;
    titre: string;
    objectif: string;
    niveau: string;
    duree: number;
    image: string;
    exercices: Exercice[];
}

export default function SeancesPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [seances, setSeances] = useState<Seance[]>([]);
    const [titre, setTitre] = useState("");
    const [objectif, setObjectif] = useState("Musculation");
    const [niveau, setNiveau] = useState("Débutant");
    const [duree, setDuree] = useState<number>(30);
    const [image, setImage] = useState("");
    const [exercices, setExercices] = useState<Exercice[]>([{ nom: "", repetitions: "" }]);

    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                router.push("/connexion");
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data() as UserProfile;
                    setProfile({ photoUrl: data.photoUrl });
                }
            } catch (err) {
                console.error("Erreur récupération profil :", err);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    // ➕ Ajouter un exercice
    const ajouterExercice = () => setExercices([...exercices, { nom: "", repetitions: "" }]);

    // 🔄 Modifier un exercice
    const handleExerciceChange = (index: number, field: keyof Exercice, value: string) => {
        const newExercices = [...exercices];
        newExercices[index][field] = value;
        setExercices(newExercices);
    };

    // ➕ Ajouter la séance
    const ajouterSeance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!titre.trim()) return alert("Le titre est obligatoire !");
        const nouvelleSeance: Seance = {
            id: Date.now(),
            titre,
            objectif,
            niveau,
            duree,
            image: image || "/images/seance-default.jpg",
            exercices: exercices.filter((ex) => ex.nom.trim() !== ""),
        };
        setSeances([...seances, nouvelleSeance]);
        setTitre("");
        setObjectif("Musculation");
        setNiveau("Débutant");
        setDuree(30);
        setImage("");
        setExercices([{ nom: "", repetitions: "" }]);
    };

    // ❌ Supprimer séance
    const supprimerSeance = (id: number) => setSeances(seances.filter((s) => s.id !== id));

    // 🧮 Récapitulatif
    const totalDuree = seances.reduce((acc, s) => acc + s.duree, 0);
    const dureeMoyenne = seances.length ? Math.round(totalDuree / seances.length) : 0;

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] font-sans text-[#333]">
            <Nav photoUrl={profile?.photoUrl} />

            <main className="p-8 flex flex-col items-center">
                {/* Titre principal */}
                <h1 className="text-4xl font-bold text-[#39393A] my-6">
                    🏋️‍♂️ Mes Programmes d’Entraînement
                </h1>

                {/* Section Récapitulatif */}
                <section className="bg-white border border-[#FCAB10]/30 rounded-2xl shadow-lg w-full max-w-3xl p-6 mb-10 flex justify-between items-center text-center">
                    <div>
                        <p className="text-2xl font-bold text-[#FCAB10]">{seances.length}</p>
                        <p className="text-gray-600">Séances créées</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-[#FCAB10]">{dureeMoyenne} min</p>
                        <p className="text-gray-600">Durée moyenne</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-[#FCAB10]">{totalDuree} min</p>
                        <p className="text-gray-600">Durée totale</p>
                    </div>
                </section>

                {/* Formulaire */}
                <form
                    onSubmit={ajouterSeance}
                    className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl border border-[#FCAB10]/20 space-y-6"
                >
                    <h2 className="text-2xl font-semibold text-[#39393A] mb-4">➕ Créer une nouvelle séance</h2>

                    <div>
                        <label className="font-semibold text-[#39393A]">Nom de la séance</label>
                        <input
                            type="text"
                            value={titre}
                            onChange={(e) => setTitre(e.target.value)}
                            placeholder="Ex: Full Body Express"
                            className="w-full mt-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#FCAB10]"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="font-semibold text-[#39393A]">Objectif</label>
                            <select
                                value={objectif}
                                onChange={(e) => setObjectif(e.target.value)}
                                className="w-full mt-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#FCAB10]"
                            >
                                <option>Musculation</option>
                                <option>Cardio</option>
                                <option>Perte de poids</option>
                                <option>Souplesse</option>
                            </select>
                        </div>

                        <div className="w-1/2">
                            <label className="font-semibold text-[#39393A]">Niveau</label>
                            <select
                                value={niveau}
                                onChange={(e) => setNiveau(e.target.value)}
                                className="w-full mt-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#FCAB10]"
                            >
                                <option>Débutant</option>
                                <option>Intermédiaire</option>
                                <option>Avancé</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="font-semibold text-[#39393A]">Durée (minutes)</label>
                            <input
                                type="number"
                                value={duree}
                                onChange={(e) => setDuree(Number(e.target.value))}
                                min={5}
                                max={180}
                                className="w-full mt-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#FCAB10]"
                            />
                        </div>

                        <div className="w-1/2">
                            <label className="font-semibold text-[#39393A]">Image (URL)</label>
                            <input
                                type="text"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                placeholder="https://exemple.com/image.jpg"
                                className="w-full mt-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#FCAB10]"
                            />
                        </div>
                    </div>

                    {/* Exercices */}
                    <div>
                        <label className="font-semibold text-[#39393A] block mb-2">Liste des exercices :</label>
                        {exercices.map((ex, i) => (
                            <div key={i} className="flex gap-4 mb-2">
                                <input
                                    type="text"
                                    placeholder="Ex: Pompes"
                                    value={ex.nom}
                                    onChange={(e) => handleExerciceChange(i, "nom", e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg p-2"
                                />
                                <input
                                    type="text"
                                    placeholder="Ex: 3x15 reps"
                                    value={ex.repetitions}
                                    onChange={(e) => handleExerciceChange(i, "repetitions", e.target.value)}
                                    className="w-1/3 border border-gray-300 rounded-lg p-2"
                                />
                            </div>
                        ))}
                        <button type="button" onClick={ajouterExercice} className="text-[#FCAB10] font-semibold hover:underline mt-1">
                            + Ajouter un exercice
                        </button>
                    </div>

                    <button type="submit" className="w-full bg-[#FCAB10] text-white font-semibold py-2 rounded-lg hover:bg-[#e69a0d] transition">
                        Créer la séance
                    </button>
                </form>

                {/* Liste des séances */}
                <section className="w-full max-w-4xl mt-10 space-y-6">
                    {seances.map((s) => (
                        <div key={s.id} className="bg-white border border-[#FCAB10]/30 rounded-xl shadow-md overflow-hidden">
                            <div className="flex items-center gap-6 p-4">
                                <img src={s.image} alt={s.titre} className="w-32 h-32 object-cover rounded-xl border border-[#FCAB10]/20" />
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-[#39393A]">{s.titre}</h3>
                                    <p className="text-sm text-gray-600 mb-1">🎯 {s.objectif} | 💪 {s.niveau}</p>
                                    <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                                        <div className="bg-[#FCAB10] h-3 rounded-full" style={{ width: `${Math.min((s.duree / 120) * 100, 100)}%` }} />
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">⏱️ {s.duree} minutes</p>
                                </div>
                                <button onClick={() => supprimerSeance(s.id)} className="bg-[#FF3D00] text-white px-3 py-2 rounded-lg hover:bg-red-600 transition">
                                    Supprimer
                                </button>
                            </div>

                            <div className="px-6 pb-4">
                                <h4 className="font-semibold text-[#39393A] mt-2 mb-1">Exercices :</h4>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                    {s.exercices.map((ex, i) => (
                                        <li key={i}>
                                            {ex.nom} – {ex.repetitions}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}

                    {seances.length === 0 && <p className="text-center text-gray-500 mt-6">Aucune séance enregistrée. Commence à créer ton premier programme 💪</p>}
                </section>
            </main>

            <Footer />
        </div>
    );
}
