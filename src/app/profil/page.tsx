"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebaseClient";
import { getStoredDailyCalories, MEAL_DAY_KEY, MEAL_STORAGE_KEY } from "@/lib/dailyMealStorage";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import PatternBackground from "../components/PatternV2";
import Nav from "../components/Nav";

type UserProfile = {
    firstName?: string;
    lastName?: string;
    email?: string;
    birthDate?: string;
    heightCm?: number;
    weightKg?: number; // Poids ajoutÃ©
    photoUrl?: string;
    sex?: "M" | "F" | "Other" | "T-MAX 530";
    training?: {
        sessionsPerWeek?: number;
        planType?: string;
    };
    nutrition?: {
        goalCode?: string;
        activityFactor?: number;
        targetDeltaKcal?: number;
    };
};

const MEAL_REFRESH_INTERVAL = 60_000;

// -------------------- AVATAR --------------------
const Avatar: React.FC<{ photoUrl?: string }> = ({ photoUrl }) => (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[#FCAB10] grid place-items-center shadow-md ring-8 ring-white/70">
        {photoUrl ? <img src={photoUrl} alt="Profil" className="h-full w-full object-cover" /> : <div className="text-[#39393A] text-3xl font-bold">?</div>}
    </div>
);

// -------------------- FIELD --------------------
const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-3">
        <div className="text-[#39393A]/70 font-medium">{label}</div>
        <div className="sm:col-span-2 text-[#39393A] font-semibold">{value}</div>
    </div>
);

// -------------------- PROFILE CARD --------------------
const ProfileCard: React.FC<{
    profile: UserProfile;
    dailyCalories: number;
    onRequestPhoto: () => void;
    uploadingPhoto: boolean;
    onLogout: () => void;
}> = ({ profile, dailyCalories, onRequestPhoto, uploadingPhoto, onLogout }) => {
    const [hasEntered, setHasEntered] = useState(false);
    useEffect(() => {
        if (typeof window === "undefined") {
            setHasEntered(true);
            return;
        }
        const raf = window.requestAnimationFrame(() => setHasEntered(true));
        return () => window.cancelAnimationFrame(raf);
    }, []);

    const motionBase =
        "transform transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100";
    const containerMotion = hasEntered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8";
    const childMotion = hasEntered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4";
    const getDelayStyle = (ms: number): React.CSSProperties => ({ transitionDelay: `${ms}ms` });

    const formattedBirthDate = useMemo(() => {
        if (!profile.birthDate) return "Non renseignÃ©e";
        const date = new Date(`${profile.birthDate}T00:00:00`);
        return Number.isNaN(date.getTime()) ? profile.birthDate : date.toLocaleDateString();
    }, [profile.birthDate]);

    const heightDisplay = profile.heightCm != null ? `${profile.heightCm} cm` : "Non renseignÃ©e";
    const weightDisplay = profile.weightKg != null ? `${profile.weightKg} kg` : "Non renseignÃ©";

    const sexLabel = useMemo(() => {
        switch (profile.sex) {
            case "M": return "Homme";
            case "F": return "Femme";
            case "Other": return "Autre";
            case "T-MAX 530": return "T-MAX 530";
            default: return "Non renseignÃ©";
        }
    }, [profile.sex]);

    const trainingSessionsDisplay = profile.training?.sessionsPerWeek ? `${profile.training.sessionsPerWeek} / semaine` : "Non renseignÃ©";

    const trainingPlanLabel = useMemo(() => {
        switch (profile.training?.planType) {
            case "FULL_BODY": return "Full Body";
            case "UPPER_LOWER": return "Upper / Lower";
            case "SPLIT_4": return "Split 4 jours";
            case "PPL": return "Push Pull Legs";
            default: return "Non renseignÃ©";
        }
    }, [profile.training?.planType]);

    const nutritionGoalLabel = useMemo(() => {
        switch (profile.nutrition?.goalCode) {
            case "MASS_GAIN": return "Prise de masse";
            case "MUSCLE_MAINTAIN": return "Maintenance musculaire";
            case "CUTTING": return "SÃ¨che";
            case "GET_BACK_IN_SHAPE": return "Reprendre la forme";
            default: return "Non renseignÃ©";
        }
    }, [profile.nutrition?.goalCode]);

    const nutritionActivityDisplay =
        profile.nutrition?.activityFactor != null
            ? `${profile.nutrition.activityFactor}`
            : "Non renseignÃ©";

    const targetDelta = profile.nutrition?.targetDeltaKcal ?? 0;
    const totalDelta = Math.round(targetDelta + dailyCalories);
    const nutritionDeltaDisplay =
        profile.nutrition?.targetDeltaKcal != null
            ? `${totalDelta} kcal (objectif ${profile.nutrition.targetDeltaKcal} + ${Math.round(dailyCalories)})`
            : `${Math.round(dailyCalories)} kcal`;

    return (
        <section className={`mx-auto w-[min(1100px,92%)] mt-10 ${motionBase} ${containerMotion}`}>
            <div
                className={`rounded-3xl bg-white/90 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/5 p-6 sm:p-10 relative overflow-hidden ${motionBase} ${childMotion}`}
                style={getDelayStyle(60)}
            >
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#FCAB10]/20 blur-3xl" />
                <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[#FCAB10]/15 blur-3xl" />

                <div
                    className={`flex flex-col sm:flex-row items-start gap-6 sm:gap-10 ${motionBase} ${childMotion}`}
                    style={getDelayStyle(140)}
                >
                    <div className="flex flex-col items-start gap-3">
                        <Avatar photoUrl={profile.photoUrl} />
                        <button
                            type="button"
                            onClick={onRequestPhoto}
                            className="rounded-lg border border-[#FCAB10] px-3 py-1 text-sm font-semibold text-[#39393A] hover:bg-[#FCAB10]/10 transition"
                        >
                            {uploadingPhoto ? "Envoi en cours..." : "Changer la photo"}
                        </button>
                    </div>
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#39393A]">Page profil</h1>
                        <p className="text-[#39393A]/60 mt-1">Vos informations personnelles</p>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                        className={`rounded-2xl border border-black/5 bg-white p-5 ${motionBase} ${childMotion}`}
                        style={getDelayStyle(220)}
                    >
                        <Field label="PrÃ©nom" value={profile.firstName || "Non renseignÃ©"} />
                        <Field label="Nom" value={profile.lastName || "Non renseignÃ©"} />
                        <Field label="E-mail" value={profile.email ? <a href={`mailto:${profile.email}`} className="underline">{profile.email}</a> : "Non renseignÃ©"} />
                        <Field label="Sexe" value={sexLabel} />
                    </div>

                    <div
                        className={`rounded-2xl border border-black/5 bg-white p-5 ${motionBase} ${childMotion}`}
                        style={getDelayStyle(280)}
                    >
                        <Field label="Date de naissance" value={formattedBirthDate} />
                        <Field label="Taille" value={heightDisplay} />
                        <Field label="Poids" value={weightDisplay} /> {/* Poids ajoutÃ© */}
                        <Field label="SÃ©ances / semaine" value={trainingSessionsDisplay} />
                        <Field label="Programme" value={trainingPlanLabel} />
                        <Field label="Objectif nutrition" value={nutritionGoalLabel} />
                        <Field label="Facteur d'activitÃ©" value={nutritionActivityDisplay} />
                        <Field label="Delta calorique" value={nutritionDeltaDisplay} />
                    </div>
                </div>

                <div
                    className={`mt-8 flex items-center justify-end gap-4 ${motionBase} ${childMotion}`}
                    style={getDelayStyle(360)}
                >
                    <Link href="/modifierProfile" className="inline-flex items-center gap-2 rounded-xl border border-[#FCAB10] px-5 py-3 text-[#39393A] font-semibold shadow hover:bg-[#FCAB10]/10 transition">
                        Modifier le profil
                    </Link>
                    <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl border border-[#39393A]/20 bg-white px-5 py-3 text-[#39393A] font-semibold shadow hover:bg-[#FCAB10]/10 transition">
                        Se dÃ©connecter
                    </button>
                </div>
            </div>
        </section>
    );
};

// -------------------- PAGE --------------------
export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [dailyCalories, setDailyCalories] = useState(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setProfile(null);
                setLoading(false);
                router.push("/connexion");
                return;
            }
            setUserId(firebaseUser.uid);
            try {
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data() as UserProfile;
                    setProfile({
                        ...data,
                        email: firebaseUser.email ?? data.email,
                        heightCm: data.heightCm != null ? Number(data.heightCm) : undefined,
                        weightKg: data.weightKg != null ? Number(data.weightKg) : undefined, // Poids ajoutÃ©
                        photoUrl: data.photoUrl,
                    });
                } else {
                    setProfile({ email: firebaseUser.email ?? undefined });
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Impossible de rÃ©cupÃ©rer vos informations.");
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const refreshDailyCalories = () => {
            setDailyCalories(Math.round(getStoredDailyCalories()));
        };

        refreshDailyCalories();
        const intervalId = window.setInterval(refreshDailyCalories, MEAL_REFRESH_INTERVAL);

        const handleStorage = (event: StorageEvent) => {
            if (event.key === MEAL_STORAGE_KEY || event.key === MEAL_DAY_KEY) refreshDailyCalories();
        };

        window.addEventListener("storage", handleStorage);
        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/connexion");
    };

    const handleChoosePhoto = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "user_profile_photos");

            const response = await fetch("https://api.cloudinary.com/v1_1/dvadrpdws/image/upload", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();

            if (data.secure_url) {
                await updateDoc(doc(db, "users", userId), { photoUrl: data.secure_url, updatedAt: serverTimestamp() });
                setProfile(prev => (prev ? { ...prev, photoUrl: data.secure_url } : prev));
            } else throw new Error("Erreur lors de l'upload.");

            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Impossible de mettre Ã  jour la photo.");
        } finally { setUploadingPhoto(false); }
    };

    if (loading) return <Nav photoUrl={profile?.photoUrl} />;

    return (
        <div>
            <Nav photoUrl={profile?.photoUrl} />
            <PatternBackground />

            {error && <div className="mx-auto mt-12 max-w-lg rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {profile && (
                <ProfileCard
                    profile={profile}
                    dailyCalories={dailyCalories}
                    onRequestPhoto={handleChoosePhoto}
                    uploadingPhoto={uploadingPhoto}
                    onLogout={handleLogout}
                />
            )}
        </div>
    );
}

