"use client";
import React, { useEffect, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { auth, db } from "@/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import PatternBackground from "../components/PatternV2";
import { Play } from "next/font/google";

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

type StoredPlan = {
    sessionsPerWeek?: number;
    planType?: TrainingPlanType;
    goalCode?: GoalCode;
    seances?: Seance[];
    savedNote?: string;
    updatedAt?: unknown;
};

type SetEntry = { reps: string; weight: string };
type SessionLogForm = {
    date: string;
    notes: string;
    exercises: Record<number, SetEntry[]>;
};

const LOCAL_PLAN_KEY = "fittrack_training_plan";
const todayKey = () => {
    const d = new Date();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
};

const GOAL_LABELS: Record<GoalCode, string> = {
    MASS_GAIN: "Prise de masse",
    MUSCLE_MAINTAIN: "Maintenance musculaire",
    CUTTING: "Seche",
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

const LOWER_IMAGE = "/img/lower.jpg";
const UPPER_IMAGE = "/img/Upper.jpg";

function autoImageForSession(title: string): string {
    const normalized = title.toLowerCase();
    return normalized.includes("lower") || normalized.includes("leg") ? LOWER_IMAGE : UPPER_IMAGE;
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
                niveau: "Intermediaire",
                duree: 55,
                image: autoImageForSession("Full Body A"),
                exercices: [
                    { nom: "Squat barre", repetitions: reps },
                    { nom: "Developpe couche", repetitions: reps },
                    { nom: "Rowing barre", repetitions: reps },
                    { nom: "Fentes marchees", repetitions: accessory },
                    { nom: "Gainage planche", repetitions: "3x45-60s" },
                ],
            },
            {
                id: 2,
                titre: "Full Body B",
                objectif: goalLabel,
                niveau: "Intermediaire",
                duree: 55,
                image: autoImageForSession("Full Body B"),
                exercices: [
                    { nom: "Souleve de terre jambes tendues", repetitions: reps },
                    { nom: "Developpe militaire halteres", repetitions: reps },
                    { nom: "Tractions / tirage vertical", repetitions: reps },
                    { nom: "Hip thrust", repetitions: reps },
                    { nom: "Gainage lateral", repetitions: "3x30-45s" },
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
                niveau: "Intermediaire",
                duree: 60,
                image: autoImageForSession("Upper"),
                exercices: [
                    { nom: "Developpe couche ou incline", repetitions: reps },
                    { nom: "Tractions / tirage vertical", repetitions: reps },
                    { nom: "Developpe militaire", repetitions: reps },
                    { nom: "Rowing halteres", repetitions: reps },
                    { nom: "Elevations laterales", repetitions: accessory },
                    { nom: "Curl + barre au front", repetitions: accessory },
                ],
            },
            {
                id: 2,
                titre: "Lower",
                objectif: goalLabel,
                niveau: "Intermediaire",
                duree: 60,
                image: autoImageForSession("Lower"),
                exercices: [
                    { nom: "Squat ou presse", repetitions: reps },
                    { nom: "Souleve de terre jambes tendues", repetitions: reps },
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
                niveau: "Intermediaire",
                duree: 55,
                image: autoImageForSession("Push"),
                exercices: [
                    { nom: "Developpe couche incline", repetitions: reps },
                    { nom: "Dips ou pompes lestees", repetitions: reps },
                    { nom: "Developpe militaire", repetitions: reps },
                    { nom: "Elevations laterales", repetitions: accessory },
                    { nom: "Extensions triceps", repetitions: accessory },
                ],
            },
            {
                id: 2,
                titre: "Pull",
                objectif: goalLabel,
                niveau: "Intermediaire",
                duree: 55,
                image: autoImageForSession("Pull"),
                exercices: [
                    { nom: "Tractions / tirage vertical", repetitions: reps },
                    { nom: "Rowing barre", repetitions: reps },
                    { nom: "Rowing unilateral", repetitions: accessory },
                    { nom: "Curl biceps", repetitions: accessory },
                    { nom: "Face pulls", repetitions: accessory },
                ],
            },
            {
                id: 3,
                titre: "Legs",
                objectif: goalLabel,
                niveau: "Intermediaire",
                duree: 60,
                image: autoImageForSession("Legs"),
                exercices: [
                    { nom: "Squat ou front squat", repetitions: reps },
                    { nom: "Hip thrust", repetitions: reps },
                    { nom: "Fentes marchees", repetitions: accessory },
                    { nom: "Leg curl", repetitions: accessory },
                    { nom: "Mollets debout", repetitions: accessory },
                ],
            },
            {
                id: 4,
                titre: "Upper Accessory",
                objectif: goalLabel,
                niveau: "Intermediaire",
                duree: 50,
                image: autoImageForSession("Upper Accessory"),
                exercices: [
                    { nom: "Developpe halteres", repetitions: reps },
                    { nom: "Tirage poitrine prise neutre", repetitions: reps },
                    { nom: "Rowing machine", repetitions: accessory },
                    { nom: "Elevations laterales", repetitions: accessory },
                    { nom: "Core (planche + hollow)", repetitions: "3x30-45s" },
                ],
            },
        ];
        return repeatPattern(base, ctx.sessionsPerWeek);
    }

    const base: Seance[] = [
        {
            id: 1,
            titre: "Push",
            objectif: goalLabel,
            niveau: "Intermediaire",
            duree: 55,
            image: autoImageForSession("Push"),
            exercices: [
                { nom: "Developpe couche", repetitions: reps },
                { nom: "Developpe incline halteres", repetitions: reps },
                { nom: "Elevations laterales", repetitions: accessory },
                { nom: "Dips ou pompes", repetitions: accessory },
                { nom: "Extensions triceps", repetitions: accessory },
            ],
        },
        {
            id: 2,
            titre: "Pull",
            objectif: goalLabel,
            niveau: "Intermediaire",
            duree: 55,
            image: autoImageForSession("Pull"),
            exercices: [
                { nom: "Tractions / tirage vertical", repetitions: reps },
                { nom: "Rowing barre", repetitions: reps },
                { nom: "Rowing unilateral", repetitions: accessory },
                { nom: "Curl biceps", repetitions: accessory },
                { nom: "Face pulls", repetitions: accessory },
            ],
        },
        {
            id: 3,
            titre: "Legs",
            objectif: goalLabel,
            niveau: "Intermediaire",
            duree: 60,
            image: autoImageForSession("Legs"),
            exercices: [
                { nom: "Squat ou presse", repetitions: reps },
                { nom: "Souleve de terre jambes tendues", repetitions: reps },
                { nom: "Fentes bulgares", repetitions: accessory },
                { nom: "Leg curl", repetitions: accessory },
                { nom: "Mollets debout", repetitions: accessory },
            ],
        },
    ];
    return repeatPattern(base, ctx.sessionsPerWeek);
}
function loadLocalPlan(): StoredPlan | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(LOCAL_PLAN_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? (parsed as StoredPlan) : null;
    } catch {
        return null;
    }
}

function saveLocalPlan(plan: StoredPlan) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(plan));
    } catch {
        /* ignore localStorage errors */
    }
}

export default function SeancesPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [seances, setSeances] = useState<Seance[]>([]);
    const [titre, setTitre] = useState("");
    const [objectif, setObjectif] = useState("Musculation");
    const [niveau, setNiveau] = useState("Debutant");
    const [duree, setDuree] = useState<number>(30);
    const [image, setImage] = useState("");
    const [exercices, setExercices] = useState<Exercice[]>([{ nom: "", repetitions: "" }]);
    const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(3);
    const [planType, setPlanType] = useState<TrainingPlanType>("UPPER_LOWER");
    const [goalCode, setGoalCode] = useState<GoalCode>("GET_BACK_IN_SHAPE");
    const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [logForms, setLogForms] = useState<Record<number, SessionLogForm>>({});
    const [logStatus, setLogStatus] = useState<Record<number, string | null>>({});
    const [logSaving, setLogSaving] = useState<Record<number, boolean>>({});
    const [logOpen, setLogOpen] = useState<Record<number, boolean>>({});

    const router = useRouter();

    useEffect(() => {
        const cached = loadLocalPlan();
        if (!cached) return;
        if (typeof cached.sessionsPerWeek === "number") setSessionsPerWeek(cached.sessionsPerWeek);
        if (cached.planType) setPlanType(cached.planType);
        if (cached.goalCode) setGoalCode(cached.goalCode);
        if (Array.isArray(cached.seances)) setSeances(cached.seances);
        if (typeof cached.savedNote === "string") setSuggestionNote(cached.savedNote);
    }, []);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUserId(null);
                setSeances([]);
                router.push("/connexion");
                return;
            }

            setUserId(firebaseUser.uid);

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
                    if (Array.isArray((data as any).training?.seances)) setSeances((data as any).training?.seances);
                    if (typeof (data as any).training?.savedNote === "string") setSuggestionNote((data as any).training?.savedNote);
                }
            } catch (err) {
                console.error("Erreur recuperation profil :", err);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const ajouterExercice = () => setExercices([...exercices, { nom: "", repetitions: "" }]);

    const handleExerciceChange = (index: number, field: keyof Exercice, value: string) => {
        const newExercices = [...exercices];
        newExercices[index][field] = value;
        setExercices(newExercices);
    };

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
        const nextSeances = [...seances, nouvelleSeance];
        setSeances(nextSeances);
        persistProgram(nextSeances, "manual");
        setTitre("");
        setObjectif("Musculation");
        setNiveau("Debutant");
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
        const note = `Programme ${planType} - ${sessionsPerWeek} seances (${GOAL_LABELS[goalCode]}) genere automatiquement.`;
        setSuggestionNote(note);
        persistProgram(suggested, "auto", note);
    };
    const persistProgram = async (items: Seance[], source: "auto" | "manual", noteOverride?: string) => {
        const savedNote =
            noteOverride ||
            (source === "auto"
                ? `Programme ${planType} - ${sessionsPerWeek} seances (${GOAL_LABELS[goalCode]}) genere automatiquement.`
                : "Programme personnalise sauvegarde");

        saveLocalPlan({
            sessionsPerWeek,
            planType,
            goalCode,
            seances: items,
            savedNote,
        });

        if (!userId) {
            setSaveStatus("Connectez-vous pour sauvegarder votre programme.");
            return;
        }
        setSaveStatus("Sauvegarde en cours...");
        try {
            await setDoc(
                doc(db, "users", userId),
                {
                    training: {
                        sessionsPerWeek,
                        planType,
                        seances: items,
                        savedNote,
                        updatedAt: serverTimestamp(),
                    },
                    nutrition: { goalCode },
                },
                { merge: true }
            );

            setSaveStatus("Programme enregistre dans votre compte.");
        } catch (err) {
            console.error("Erreur sauvegarde programme :", err);
            setSaveStatus("Impossible de sauvegarder le programme pour le moment.");
        }
    };

    const buildDefaultLogForm = (seance: Seance): SessionLogForm => ({
        date: todayKey(),
        notes: "",
        exercises: seance.exercices.reduce((acc, _ex, idx) => {
            acc[idx] = [{ reps: "", weight: "" }];
            return acc;
        }, {} as Record<number, SetEntry[]>),
    });

    const toggleLogForm = (seance: Seance) => {
        setLogForms((prev) => {
            if (prev[seance.id]) return prev;
            return { ...prev, [seance.id]: buildDefaultLogForm(seance) };
        });
        setLogOpen((prev) => ({ ...prev, [seance.id]: !prev[seance.id] }));
    };

    const updateLogMeta = (seanceId: number, key: "date" | "notes", value: string) => {
        setLogForms((prev) => {
            const current = prev[seanceId] ?? { date: todayKey(), notes: "", exercises: {} };
            return { ...prev, [seanceId]: { ...current, [key]: value } };
        });
    };

    const updateSetValue = (seanceId: number, exIndex: number, setIndex: number, field: keyof SetEntry, value: string) => {
        setLogForms((prev) => {
            const current = prev[seanceId] ?? { date: todayKey(), notes: "", exercises: {} };
            const exSets = current.exercises[exIndex] ?? [{ reps: "", weight: "" }];
            const nextSets = exSets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s));
            const exercises = { ...current.exercises, [exIndex]: nextSets };
            return { ...prev, [seanceId]: { ...current, exercises } };
        });
    };

    const addSetRow = (seanceId: number, exIndex: number) => {
        setLogForms((prev) => {
            const current = prev[seanceId] ?? { date: todayKey(), notes: "", exercises: {} };
            const exSets = current.exercises[exIndex] ?? [{ reps: "", weight: "" }];
            const exercises = { ...current.exercises, [exIndex]: [...exSets, { reps: "", weight: "" }] };
            return { ...prev, [seanceId]: { ...current, exercises } };
        });
    };

    const saveSessionLog = async (seance: Seance) => {
        if (!userId) {
            setLogStatus((prev) => ({ ...prev, [seance.id]: "Connectez-vous pour enregistrer la seance." }));
            return;
        }
        const form = logForms[seance.id] ?? buildDefaultLogForm(seance);

        const exercisesPayload = seance.exercices.map((ex, idx) => {
            const sets = (form.exercises[idx] ?? [{ reps: "", weight: "" }])
                .map((s) => ({ reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 }))
                .filter((s) => s.reps > 0 || s.weight > 0);
            return { name: ex.nom, sets };
        });

        const volume = exercisesPayload.reduce(
            (total, ex) => total + ex.sets.reduce((acc, s) => acc + s.reps * (s.weight || 0), 0),
            0
        );

        if (volume <= 0) {
            setLogStatus((prev) => ({ ...prev, [seance.id]: "Renseignez au moins un set avec reps et poids." }));
            return;
        }

        setLogSaving((prev) => ({ ...prev, [seance.id]: true }));
        setLogStatus((prev) => ({ ...prev, [seance.id]: null }));

        try {
            await addDoc(collection(db, "users", userId, "trainingLogs"), {
                seanceId: seance.id,
                seanceTitle: seance.titre,
                date: form.date || todayKey(),
                volume,
                planType,
                goalCode,
                sessionsPerWeek,
                niveau: seance.niveau,
                objectif: seance.objectif,
                exercises: exercisesPayload,
                notes: form.notes || null,
                createdAt: serverTimestamp(),
            });
            setLogStatus((prev) => ({ ...prev, [seance.id]: "Seance enregistree." }));
        } catch (err) {
            console.error("Erreur sauvegarde seance :", err);
            setLogStatus((prev) => ({ ...prev, [seance.id]: "Impossible d'enregistrer la seance pour le moment." }));
        } finally {
            setLogSaving((prev) => ({ ...prev, [seance.id]: false }));
        }
    };

    const supprimerSeance = (id: number) => {
        const next = seances.filter((s) => s.id !== id);
        setSeances(next);
        persistProgram(next, "manual");
    };

    const totalDuree = seances.reduce((acc, s) => acc + s.duree, 0);
    const dureeMoyenne = seances.length ? Math.round(totalDuree / seances.length) : 0;

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="relative min-h-screen overflow-hidden font-sans text-[#333]">
            <Nav photoUrl={profile?.photoUrl} />
            <PatternBackground />


            <main className="p-8 flex flex-col items-center pt-24 pb-16 animate-page-enter">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-black/5 mb-6 w-full max-w-6xl">
                    <h1 className="text-4xl font-bold text-[#39393A] my-6 animate-card-rise animate-delay-1">
                        Mes Programmes d'Entrainement
                    </h1>
                    <section className="bg-white border border-[#FCAB10]/30 rounded-2xl shadow-lg w-full max-w-3xl p-6 mb-10 flex justify-between items-center text-center animate-card-rise animate-delay-2">
                        <div>
                            <p className="text-2xl font-bold text-[#FCAB10]">{seances.length}</p>
                            <p className="text-gray-600">Seances creees</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#FCAB10]">{dureeMoyenne} min</p>
                            <p className="text-gray-600">Duree moyenne</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#FCAB10]">{totalDuree} min</p>
                            <p className="text-gray-600">Duree totale</p>
                        </div>
                    </section>

                    <section className="bg-[#FCAB10]/10 border border-[#FCAB10]/30 rounded-2xl shadow-lg w-full max-w-3xl p-6 mb-10 animate-card-rise animate-delay-2">
                        <div className="flex flex-col gap-3">
                            <h2 className="text-xl font-semibold text-[#39393A]">Proposition automatique</h2>
                            <p className="text-sm text-[#333]/80">
                                Ajuste ici si besoin (meme si ton profil n'est pas renseigne) puis genere un plan cle en main.
                            </p>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <label className="text-sm font-medium text-[#39393A]">
                                    Seances / semaine
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
                                        <option value="CUTTING">Seche</option>
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
                                    Programme {planType} - {sessionsPerWeek} seances ({GOAL_LABELS[goalCode]}) pret a l'usage.
                                </span>
                            </div>
                            {suggestionNote && <div className="text-xs text-[#333]/70">{suggestionNote}</div>}
                            {saveStatus && (
                                <div
                                    className={`text-xs ${saveStatus.includes("Impossible")
                                        ? "text-red-600"
                                        : saveStatus.includes("enregistre")
                                            ? "text-green-600"
                                            : "text-[#333]/70"
                                        }`}
                                >
                                    {saveStatus}
                                </div>
                            )}
                        </div>
                    </section>
                    <form
                        onSubmit={ajouterSeance}
                        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl border border-[#FCAB10]/20 space-y-6 animate-card-rise animate-delay-3"
                    >
                        <h2 className="text-2xl font-semibold text-[#39393A] mb-4">Creer une nouvelle seance</h2>

                        <div>
                            <label className="font-semibold text-[#39393A]">Nom de la seance</label>
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
                                    <option>Debutant</option>
                                    <option>Intermediaire</option>
                                    <option>Avance</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="font-semibold text-[#39393A]">Duree (minutes)</label>
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
                            Creer la seance
                        </button>
                    </form>

                    <section className="w-full max-w-4xl mt-10 space-y-6 animate-card-rise" style={{ animationDelay: "0.4s" }}>
                        {seances.map((s, index) => (
                            <div
                                key={s.id}
                                className="bg-white border border-[#FCAB10]/30 rounded-xl shadow-md overflow-hidden animate-card-pop"
                                style={{ animationDelay: `${0.45 + index * 0.05}s` }}
                            >
                                <div className="flex flex-col md:flex-row items-center gap-6 p-4">
                                    <img src={s.image} alt={s.titre} className="w-32 h-32 object-cover rounded-xl border border-[#FCAB10]/20" />
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-[#39393A]">{s.titre}</h3>
                                        <p className="text-sm text-gray-600 mb-1">Objectif: {s.objectif} | Niveau: {s.niveau}</p>
                                        <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                                            <div className="bg-[#FCAB10] h-3 rounded-full" style={{ width: `${Math.min((s.duree / 120) * 100, 100)}%` }} />
                                        </div>
                                        <p className="text-sm text-gray-700 mt-1">{s.duree} minutes</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => toggleLogForm(s)}
                                            className="bg-[#FCAB10] text-white px-3 py-2 rounded-lg hover:brightness-95 transition"
                                        >
                                            {logOpen[s.id] ? "Fermer le suivi" : "Suivre cette seance"}
                                        </button>
                                        <button onClick={() => supprimerSeance(s.id)} className="bg-[#FF3D00] text-white px-3 py-2 rounded-lg hover:bg-red-600 transition">
                                            Supprimer
                                        </button>
                                    </div>
                                </div>

                                <div className="px-6 pb-4">
                                    <h4 className="font-semibold text-[#39393A] mt-2 mb-1">Exercices :</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-700">
                                        {s.exercices.map((ex, i) => (
                                            <li key={i}>
                                                {ex.nom} - {ex.repetitions}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {logOpen[s.id] && (
                                    <div className="px-6 pb-6 border-t border-[#FCAB10]/30 bg-[#FCAB10]/5">
                                        {(() => {
                                            const logForm = logForms[s.id] ?? buildDefaultLogForm(s);
                                            return (
                                                <div className="space-y-4">
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        <label className="text-sm font-medium text-[#39393A]">
                                                            Date
                                                            <input
                                                                type="date"
                                                                value={logForm.date}
                                                                onChange={(e) => updateLogMeta(s.id, "date", e.target.value)}
                                                                className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_2px_rgba(252,171,16,0.2)]"
                                                            />
                                                        </label>
                                                        <label className="text-sm font-medium text-[#39393A]">
                                                            Notes
                                                            <input
                                                                type="text"
                                                                value={logForm.notes}
                                                                onChange={(e) => updateLogMeta(s.id, "notes", e.target.value)}
                                                                placeholder="RPE, sensations, etc."
                                                                className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_2px_rgba(252,171,16,0.2)]"
                                                            />
                                                        </label>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {s.exercices.map((ex, exIndex) => {
                                                            const sets = logForm.exercises[exIndex] ?? [{ reps: "", weight: "" }];
                                                            return (
                                                                <div key={exIndex} className="rounded-xl border border-black/5 bg-white p-4 shadow-sm shadow-black/5">
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-[#39393A]">{ex.nom}</p>
                                                                            <p className="text-xs text-[#333]/70">{ex.repetitions}</p>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => addSetRow(s.id, exIndex)}
                                                                            className="text-xs font-semibold text-[#FCAB10] hover:underline"
                                                                        >
                                                                            + Ajouter une serie
                                                                        </button>
                                                                    </div>
                                                                    <div className="mt-3 space-y-2">
                                                                        {sets.map((set, setIndex) => (
                                                                            <div key={setIndex} className="grid grid-cols-2 gap-2">
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    placeholder="Reps"
                                                                                    value={set.reps}
                                                                                    onChange={(e) => updateSetValue(s.id, exIndex, setIndex, "reps", e.target.value)}
                                                                                    className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_2px_rgba(252,171,16,0.2)]"
                                                                                />
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    step="0.5"
                                                                                    placeholder="Poids (kg)"
                                                                                    value={set.weight}
                                                                                    onChange={(e) => updateSetValue(s.id, exIndex, setIndex, "weight", e.target.value)}
                                                                                    className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_2px_rgba(252,171,16,0.2)]"
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {logStatus[s.id] && (
                                                        <p className="text-sm text-[#333]/80">{logStatus[s.id]}</p>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => saveSessionLog(s)}
                                                        disabled={logSaving[s.id]}
                                                        className="inline-flex items-center justify-center rounded-xl bg-[#39393A] px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-95 disabled:opacity-60"
                                                    >
                                                        {logSaving[s.id] ? "Enregistrement..." : "Enregistrer cette seance"}
                                                    </button>
                                                </div>

                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        ))}

                        {seances.length === 0 && (
                            <p className="text-center text-gray-500 mt-6 animate-card-rise" style={{ animationDelay: "0.45s" }}>
                                Aucune seance enregistree. Commence a creer ton premier programme !
                            </p>
                        )}
                    </section>
                </div>

            </main>

            <Footer />
        </div>
    );
}
