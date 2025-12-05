"use client";
import React, { useEffect, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { auth, db } from "@/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import PatternBackground from "../components/PatternV2";

type TrainingPlanType = "FULL_BODY" | "UPPER_LOWER" | "SPLIT_4" | "PPL";
type GoalCode = "MASS_GAIN" | "MUSCLE_MAINTAIN" | "CUTTING" | "GET_BACK_IN_SHAPE";

type UserProfile = {
    photoUrl?: string;
    training?: { sessionsPerWeek?: number; planType?: TrainingPlanType };
    nutrition?: { goalCode?: GoalCode };
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

const GOAL_LABELS: Record<GoalCode, string> = {
    MASS_GAIN: "Prise de masse",
    MUSCLE_MAINTAIN: "Maintenance musculaire",
    CUTTING: "Sèche",
    GET_BACK_IN_SHAPE: "Reprise en forme",
};

function repScheme(goal: GoalCode): string {
    switch (goal) {
        case "MASS_GAIN":
            return "3-4x8-12 reps";
        case "CUTTING":
            return "3x12-15 reps";
        case "MUSCLE_MAINTAIN":
            return "3x10-12 reps";
        default:
            return "2-3x10-12 reps";
    }
}

function accessoryScheme(goal: GoalCode): string {
    return goal === "CUTTING" ? "2-3x15-20 reps" : "2-3x12-15 reps";
}

function repeatPattern(base: Seance[], count: number): Seance[] {
    const result: Seance[] = [];
    const safeCount = Math.max(2, Math.min(count, 6));
    for (let i = 0; i < safeCount; i++) {
        const template = base[i % base.length];
        result.push({
            ...template,
            id: Number(`${Date.now()}${i}`),
            titre: base.length === 1 ? `${template.titre} ${i + 1}` : template.titre,
        });
    }
    return result;
}

function buildProgram(ctx: { planType: TrainingPlanType; sessionsPerWeek: number; goal: GoalCode }): Seance[] {
    const reps = repScheme(ctx.goal);
    const accessory = accessoryScheme(ctx.goal);
    const goalLabel = GOAL_LABELS[ctx.goal];

    if (ctx.planType === "FULL_BODY") {
        const base: Seance[] = [
            {
                id: 1,
                titre: "Full Body A",
                objectif: goalLabel,
                niveau: "Intermédiaire",
                duree: 55,
                image: "/images/fullbody-a.jpg",
                exercices: [
                    { nom: "Squat barre", repetitions: reps },
                    { nom: "Développé couché", repetitions: reps },
                    { nom: "Rowing barre", repetitions: reps },
                    { nom: "Fentes marchées", repetitions: accessory },
                    { nom: "Gainage planche", repetitions: "3x45-60s" },
                ],
            },
            {
                id: 2,
                titre: "Full Body B",
                objectif: goalLabel,
                niveau: "Intermédiaire",
                duree: 55,
                image: "/images/fullbody-b.jpg",
                exercices: [
                    { nom: "Soulevé de terre jambes tendues", repetitions: reps },
                    { nom: "Développé militaire haltères", repetitions: reps },
                    { nom: "Tractions / tirage vertical", repetitions: reps },
                    { nom: "Hip thrust", repetitions: reps },
                    { nom: "Gainage latéral", repetitions: "3x30-45s" },
                ],
            },
        ];
        return repeatPattern(base, ctx.sessionsPerWeek);
    }

    if (ctx.planType === "UPPER_LOWER") {
        const base: Seance[] = [
            {
                id: 1,
                titre: "Upper",
                objectif: goalLabel,
                niveau: "Intermédiaire",
                duree: 60,
                image: "/images/upper.jpg",
                exercices: [
                    { nom: "Développé couché ou incliné", repetitions: reps },
                    { nom: "Tractions / tirage vertical", repetitions: reps },
                    { nom: "Développé militaire", repetitions: reps },
                    { nom: "Rowing haltères", repetitions: reps },
                    { nom: "Élévations latérales", repetitions: accessory },
                    { nom: "Curl + barre au front", repetitions: accessory },
                ],
            },
            {
                id: 2,
                titre: "Lower",
                objectif: goalLabel,
                niveau: "Intermédiaire",
                duree: 60,
                image: "/images/lower.jpg",
                exercices: [
                    { nom: "Squat ou presse", repetitions: reps },
                    { nom: "Soulevé de terre jambes tendues", repetitions: reps },
                    { nom: "Fentes bulgares", repetitions: accessory },
                    { nom: "Leg curl", repetitions: accessory },
                    { nom: "Mollets debout", repetitions: accessory },
                    { nom: "Gainage planche", repetitions: "3x45-60s" },
                ],
            },
        ];
        return repeatPattern(base, ctx.sessionsPerWeek);
    }

    if (ctx.planType === "SPLIT_4") {
        const base: Seance[] = [
            {
                id: 1,
                titre: "Push",
                objectif: goalLabel,
                niveau: "Intermédiaire",
                duree: 55,
                image: "/images/push.jpg",
                exercices: [
                    { nom: "Développé couché incliné", repetitions: reps },
                    { nom: "Dips ou pompes lestées", repetitions: reps },
                    { nom: "Développé militaire", repetitions: reps },
                    { nom: "Élévations latérales", repetitions: accessory },
                    { nom: "Extensions triceps", repetitions: accessory },
                ],
            },
            {
                id: 2,
                titre: "Pull",
                objectif: goalLabel,
                niveau: "Intermédiaire",
                duree: 55,
                image: "/images/pull.jpg",
                exercices: [
                    { nom: "Tractions / tirage vertical", repetitions: reps },
                    { nom: "Rowing barre", repetitions: reps },
                    { nom: "Rowing unilatéral", repetitions: accessory },
                    { nom: "Curl biceps", repetitions: accessory },
                    { nom: "Face pulls", repetitions: accessory },
                ],
            },
            {
                id: 3,
                titre: "Legs",
                objectif: goalLabel,
                niveau: "Intermédiaire",
                duree: 60,
                image: "/images/legs.jpg",
                exercices: [
                    { nom: "Squat ou front squat", repetitions: reps },
                    { nom: "Hip thrust", repetitions: reps },
                    { nom: "Fentes marchées", repetitions: accessory },
                    { nom: "Leg curl", repetitions: accessory },
                    { nom: "Mollets debout", repetitions: accessory },
                ],
            },
            {
                id: 4,
                titre: "Upper Accessory",
                objectif: goalLabel,
                niveau: "Intermédiaire",
                duree: 50,
                image: "/images/upper2.jpg",
                exercices: [
                    { nom: "Développé haltères", repetitions: reps },
                    { nom: "Tirage poitrine prise neutre", repetitions: reps },
                    { nom: "Rowing machine", repetitions: accessory },
                    { nom: "Élévations latérales", repetitions: accessory },
                    { nom: "Core (planche + hollow)", repetitions: "3x30-45s" },
                ],
            },
        ];
        return repeatPattern(base, ctx.sessionsPerWeek);
    }

    // PPL par défaut
    const base: Seance[] = [
        {
            id: 1,
            titre: "Push",
            objectif: goalLabel,
            niveau: "Intermédiaire",
            duree: 55,
            image: "/images/push.jpg",
            exercices: [
                { nom: "Développé couché", repetitions: reps },
                { nom: "Développé incliné haltères", repetitions: reps },
                { nom: "Élévations latérales", repetitions: accessory },
                { nom: "Dips ou pompes", repetitions: accessory },
                { nom: "Extensions triceps", repetitions: accessory },
            ],
        },
        {
            id: 2,
            titre: "Pull",
            objectif: goalLabel,
            niveau: "Intermédiaire",
            duree: 55,
            image: "/images/pull.jpg",
            exercices: [
                { nom: "Tractions / tirage vertical", repetitions: reps },
                { nom: "Rowing barre", repetitions: reps },
                { nom: "Rowing unilatéral", repetitions: accessory },
                { nom: "Curl biceps", repetitions: accessory },
                { nom: "Face pulls", repetitions: accessory },
            ],
        },
        {
            id: 3,
            titre: "Legs",
            objectif: goalLabel,
            niveau: "Intermédiaire",
            duree: 60,
            image: "/images/legs.jpg",
            exercices: [
                { nom: "Squat ou presse", repetitions: reps },
                { nom: "Soulevé de terre jambes tendues", repetitions: reps },
                { nom: "Fentes bulgares", repetitions: accessory },
                { nom: "Leg curl", repetitions: accessory },
                { nom: "Mollets debout", repetitions: accessory },
            ],
        },
    ];
    return repeatPattern(base, ctx.sessionsPerWeek);
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
    const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(3);
    const [planType, setPlanType] = useState<TrainingPlanType>("UPPER_LOWER");
    const [goalCode, setGoalCode] = useState<GoalCode>("GET_BACK_IN_SHAPE");
    const [suggestionNote, setSuggestionNote] = useState<string | null>(null);

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
                    const sessions = data.training?.sessionsPerWeek;
                    const plan = data.training?.planType;
                    const goal = data.nutrition?.goalCode;
                    if (typeof sessions === "number" && sessions > 0) setSessionsPerWeek(sessions);
                    if (plan) setPlanType(plan);
                    if (goal) setGoalCode(goal);
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

    const proposerProgramme = () => {
        const suggested = buildProgram({
            planType,
            sessionsPerWeek,
            goal: goalCode,
        });
        setSeances(suggested);
        setSuggestionNote(
            `Programme ${planType} - ${sessionsPerWeek} séances (${GOAL_LABELS[goalCode]}) généré automatiquement.`
        );
    };

    // ❌ Supprimer séance
    const supprimerSeance = (id: number) => setSeances(seances.filter((s) => s.id !== id));

    // 🧮 Récapitulatif
    const totalDuree = seances.reduce((acc, s) => acc + s.duree, 0);
    const dureeMoyenne = seances.length ? Math.round(totalDuree / seances.length) : 0;

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="relative min-h-screen overflow-hidden  font-sans text-[#333]">
            <Nav photoUrl={profile?.photoUrl} />
            <PatternBackground />

            <main className="p-8 flex flex-col items-center pt-24 pb-16 animate-page-enter">
                {/* Titre principal */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-black/5 mb-6">
                    <h1 className="text-4xl font-bold text-[#39393A] my-6 animate-card-rise animate-delay-1">
                        🏋️‍♂️ Mes Programmes d’Entraînement
                    </h1> {/* Section Récapitulatif */}
                    <section className="bg-white border border-[#FCAB10]/30 rounded-2xl shadow-lg w-full max-w-3xl p-6 mb-10 flex justify-between items-center text-center animate-card-rise animate-delay-2">
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

                    <section className="bg-[#FCAB10]/10 border border-[#FCAB10]/30 rounded-2xl shadow-lg w-full max-w-3xl p-6 mb-10 animate-card-rise animate-delay-2">
                        <div className="flex flex-col gap-3">
                            <h2 className="text-xl font-semibold text-[#39393A]">Proposition automatique</h2>
                            <p className="text-sm text-[#333]/80">
                                Ajuste ici si besoin (même si ton profil n'est pas renseigné) puis génére un plan clé en main.
                            </p>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <label className="text-sm font-medium text-[#39393A]">
                                    Séances / semaine
                                    <input
                                        type="number"
                                        min={2}
                                        max={6}
                                        value={sessionsPerWeek}
                                        onChange={(e) => setSessionsPerWeek(Math.max(2, Math.min(6, Number(e.target.value) || 2)))}
                                        className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_2px_rgba(252,171,16,0.2)]"
                                    />
                                </label>
                                <label className="text-sm font-medium text-[#39393A]">
                                    Type de plan
                                    <select
                                        value={planType}
                                        onChange={(e) => setPlanType(e.target.value as TrainingPlanType)}
                                        className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_2px_rgba(252,171,16,0.2)]"
                                    >
                                        <option value="FULL_BODY">Full Body</option>
                                        <option value="UPPER_LOWER">Upper / Lower</option>
                                        <option value="SPLIT_4">Split 4 jours</option>
                                        <option value="PPL">Push Pull Legs</option>
                                    </select>
                                </label>
                                <label className="text-sm font-medium text-[#39393A]">
                                    Objectif
                                    <select
                                        value={goalCode}
                                        onChange={(e) => setGoalCode(e.target.value as GoalCode)}
                                        className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_2px_rgba(252,171,16,0.2)]"
                                    >
                                        <option value="GET_BACK_IN_SHAPE">Reprise en forme</option>
                                        <option value="MASS_GAIN">Prise de masse</option>
                                        <option value="MUSCLE_MAINTAIN">Maintenance musculaire</option>
                                        <option value="CUTTING">SÇùche</option>
                                    </select>
                                </label>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={proposerProgramme}
                                    className="rounded-xl bg-[#FCAB10] px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-95 transition"
                                >
                                    Proposer un programme
                                </button>
                                <span className="text-xs text-[#333]/70">
                                    Programme {planType} - {sessionsPerWeek} séances ({GOAL_LABELS[goalCode]}) prêt à l'usage.
                                </span>
                            </div>
                            {suggestionNote && (
                                <div className="text-xs text-[#333]/70">
                                    {suggestionNote}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Formulaire */}
                    <form
                        onSubmit={ajouterSeance}
                        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl border border-[#FCAB10]/20 space-y-6 animate-card-rise animate-delay-3 "
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
                    <section className="w-full max-w-4xl mt-10 space-y-6 animate-card-rise" style={{ animationDelay: "0.4s" }}>
                        {seances.map((s, index) => (
                            <div
                                key={s.id}
                                className="bg-white border border-[#FCAB10]/30 rounded-xl shadow-md overflow-hidden animate-card-pop"
                                style={{ animationDelay: `${0.45 + index * 0.05}s` }}
                            >
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

                        {seances.length === 0 && (
                            <p className="text-center text-gray-500 mt-6 animate-card-rise" style={{ animationDelay: "0.45s" }}>
                                Aucune séance enregistrée. Commence à créer ton premier programme 💪
                            </p>
                        )}
                    </section>
                </div>



            </main >

            <Footer />
        </div >
    );
}
