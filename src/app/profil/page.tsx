"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Nav from "../components/Nav";
import { auth, db, storage } from "@/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserProfile = {
    firstName?: string;
    lastName?: string;
    email?: string;
    birthDate?: string;
    heightCm?: number;
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

// Small avatar
const Avatar: React.FC<{ photoUrl?: string }> = ({ photoUrl }) => (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[#FCAB10] grid place-items-center shadow-md ring-8 ring-white/70">
        {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Profil" className="h-full w-full object-cover" />
        ) : (
            <svg viewBox="0 0 24 24" className="h-12 w-12 text-[#39393A]">
                <path fill="currentColor" d="M12 2a5 5 0 1 0 0 10a5 5 0 0 0 0-10ZM4 20.5C4 16.91 7.58 14 12 14s8 2.91 8 6.5V22H4z" />
            </svg>
        )}
    </div>
);

const Field: React.FC<{label: string; value: React.ReactNode}> = ({label, value}) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-3">
        <div className="text-[#39393A]/70 font-medium">{label}</div>
        <div className="sm:col-span-2 text-[#39393A] font-semibold">{value}</div>
    </div>
);

const ProfileCard: React.FC<{
    profile: UserProfile;
    onRequestPhoto: () => void;
    uploadingPhoto: boolean;
}> = ({ profile, onRequestPhoto, uploadingPhoto }) => {
    const formattedBirthDate = useMemo(() => {
        if (!profile.birthDate) return "Non renseignee";
        const date = new Date(`${profile.birthDate}T00:00:00`);
        return Number.isNaN(date.getTime()) ? profile.birthDate : date.toLocaleDateString();
    }, [profile.birthDate]);

    const heightDisplay = useMemo(() => {
        if (profile.heightCm == null || Number.isNaN(Number(profile.heightCm))) {
            return "Non renseignee";
        }
        return `${profile.heightCm} cm`;
    }, [profile.heightCm]);

    const sexLabel = useMemo(() => {
        switch (profile.sex) {
            case "M":
                return "Homme";
            case "F":
                return "Femme";
            case "Other":
                return "Autre";
            case "T-MAX 530":
                return "T-MAX 530";
            default:
                return "Non renseigne";
        }
    }, [profile.sex]);

    const trainingSessionsDisplay = profile.training?.sessionsPerWeek
        ? `${profile.training.sessionsPerWeek} / semaine`
        : "Non renseigne";

    const trainingPlanLabel = useMemo(() => {
        switch (profile.training?.planType) {
            case "FULL_BODY":
                return "Full Body";
            case "UPPER_LOWER":
                return "Upper / Lower";
            case "SPLIT_4":
                return "Split 4 jours";
            case "PPL":
                return "Push Pull Legs";
            default:
                return "Non renseigne";
        }
    }, [profile.training?.planType]);

    const nutritionGoalLabel = useMemo(() => {
        switch (profile.nutrition?.goalCode) {
            case "MASS_GAIN":
                return "Prise de masse";
            case "MUSCLE_MAINTAIN":
                return "Maintenance musculaire";
            case "CUTTING":
                return "Seche";
            case "GET_BACK_IN_SHAPE":
                return "Reprendre la forme";
            default:
                return "Non renseigne";
        }
    }, [profile.nutrition?.goalCode]);

    const nutritionActivityDisplay =
        profile.nutrition?.activityFactor != null
            ? `${profile.nutrition.activityFactor}`
            : "Non renseigne";

    const nutritionDeltaDisplay =
        profile.nutrition?.targetDeltaKcal != null
            ? `${profile.nutrition.targetDeltaKcal} kcal`
            : "Non renseigne";

    return (
        <section className="mx-auto w-[min(1100px,92%)] mt-10">
        <div className="rounded-3xl bg-white/90 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/5 p-6 sm:p-10 relative overflow-hidden">
            {/* Soft highlight */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#FCAB10]/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[#FCAB10]/15 blur-3xl" />

            <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-10">
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
                <div className="rounded-2xl border border-black/5 bg-white p-5">
                    <Field label="Prenom" value={profile.firstName || "Non renseigne"} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="Nom" value={profile.lastName || "Non renseigne"} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field
                        label="E-mail"
                        value={
                            profile.email ? (
                                <a className="underline underline-offset-2" href={`mailto:${profile.email}`}>
                                    {profile.email}
                                </a>
                            ) : (
                                "Non renseigne"
                            )
                        }
                    />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="Sexe" value={sexLabel} />
                </div>

                <div className="rounded-2xl border border-black/5 bg-white p-5">
                    <Field label="Date de naissance" value={formattedBirthDate} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="Taille" value={heightDisplay} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="Seances par semaine" value={trainingSessionsDisplay} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="Programme" value={trainingPlanLabel} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="Objectif nutrition" value={nutritionGoalLabel} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="Facteur d'activite" value={nutritionActivityDisplay} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="Delta calorique" value={nutritionDeltaDisplay} />
                </div>
            </div>

            <div className="mt-8 flex items-center justify-end">
                <Link href="/modifierProfile" className="inline-flex items-center gap-2 rounded-xl border border-[#FCAB10] px-5 py-3 text-[#39393A] font-semibold shadow hover:bg-[#FCAB10]/10 transition">
                    Modifier le profil
                </Link>
            </div>
        </div>
    </section>
);
};

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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
                        photoUrl: data.photoUrl,
                    });
                } else {
                    setProfile({
                        email: firebaseUser.email ?? undefined,
                    });
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Impossible de recuperer vos informations.";
                setError(message);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/connexion");
    };

    const handleChoosePhoto = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !userId) {
            return;
        }
        setUploadingPhoto(true);
        setError(null);
        try {
            const photoRef = ref(storage, `users/${userId}/profile-${Date.now()}`);
            await uploadBytes(photoRef, file);
            const url = await getDownloadURL(photoRef);
            const userDocRef = doc(db, "users", userId);
            await updateDoc(userDocRef, {
                photoUrl: url,
                updatedAt: serverTimestamp(),
            });
            setProfile((prev) => (prev ? { ...prev, photoUrl: url } : prev));
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Impossible de mettre a jour la photo.";
            setError(message);
        } finally {
            setUploadingPhoto(false);
        }
    };

    if (loading) {
        return (
            <div>
                <Nav />
                <div className="flex min-h-[60vh] items-center justify-center text-[#39393A]">
                    Chargement de votre profil...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Nav />
                <div className="mx-auto mt-12 max-w-lg rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <div>
            <Nav />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
            <ProfileCard profile={profile} onRequestPhoto={handleChoosePhoto} uploadingPhoto={uploadingPhoto} />
            <div className="mx-auto mt-6 flex w-[min(1100px,92%)] justify-end">
                <button
                    onClick={handleLogout}
                    className="rounded-xl border border-[#39393A]/20 bg-white px-4 py-2 text-sm font-semibold text-[#39393A] shadow hover:bg-[#FCAB10]/10 transition"
                >
                    Se deconnecter
                </button>
            </div>
        </div>
    );
}






