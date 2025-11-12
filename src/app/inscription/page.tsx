"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import { auth, db } from "@/firebaseClient";
import { OAuthProvider, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export default function InscriptionPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [sex, setSex] = useState<"M" | "F" | "Other" | "T-MAX 530">("Other");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas !");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const parsedHeight = Number(heightCm);
            if (!Number.isFinite(parsedHeight) || parsedHeight <= 0) {
                throw new Error("Merci de saisir une taille valide.");
            }
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            const userDoc = doc(db, "users", credential.user.uid);
            await setDoc(userDoc, {
                firstName,
                lastName,
                email,
                birthDate,
                heightCm: parsedHeight,
                sex,
                training: {
                    sessionsPerWeek: 3,
                    planType: "UPPER_LOWER",
                },
                nutrition: {
                    goalCode: "GET_BACK_IN_SHAPE",
                    activityFactor: 1.4,
                    targetDeltaKcal: 0,
                    maintenanceKcal: null,
                    targetKcal: null,
                },
                photoUrl: null,
                createdAt: serverTimestamp(),
            });
            router.push("/profil");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Une erreur est survenue.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const upsertUserDoc = async (uid: string, emailVal?: string, extra?: Record<string, unknown>) => {
        const userDoc = doc(db, "users", uid);
        await setDoc(userDoc, {
            firstName,
            lastName,
            email: emailVal ?? email,
            birthDate,
            heightCm: Number(heightCm) || null,
            sex: "Other",
            training: { sessionsPerWeek: 3, planType: "UPPER_LOWER" },
            nutrition: { goalCode: "GET_BACK_IN_SHAPE", activityFactor: 1.4, targetDeltaKcal: 0, maintenanceKcal: null, targetKcal: null },
            photoUrl: null,
            createdAt: serverTimestamp(),
            ...extra,
        }, { merge: true });
    };

    const handleGoogle = async () => {
        setError(null);
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const cred = await signInWithPopup(auth, provider);
            await upsertUserDoc(cred.user.uid, cred.user.email || undefined, {});
            router.push("/profil");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Google: échec d'inscription.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <>
            <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] font-sans text-[#333333]">
                <Nav />
                <main className="min-h-screen flex flex-col items-center p-8 font-sans ">
                    {/* FORMULAIRE D'INSCRIPTION */}
                    <section className="mt-12 w-full max-w-md bg-white p-8 rounded-2xl shadow-lg shadow-black/5">
                        <h2 className="text-2xl font-bold mb-6 text-center">Inscription</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col">
                            <label className="mb-2 font-medium text-gray-700" htmlFor="email">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />

                            <label className="mb-2 font-medium text-gray-700" htmlFor="firstName">
                                Prenom
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />

                            <label className="mb-2 font-medium text-gray-700" htmlFor="lastName">
                                Nom
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />

                            <label className="mb-2 font-medium text-gray-700" htmlFor="sex">
                                Sexe
                            </label>
                            <select
                                id="sex"
                                value={sex}
                                onChange={(e) => setSex(e.target.value as "M" | "F" | "Other" | "T-MAX 530")}
                                className="mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="M">Homme</option>
                                <option value="F">Femme</option>
                                <option value="Other">Autre</option>
                                <option value="T-MAX 530">T-MAX 530</option>
                            </select>

               <label className="mb-2 font-medium text-gray-700" htmlFor="birthDate">
                                Date de naissance
                            </label>
                            <input
                                type="date"
                                id="birthDate"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />

                            <label className="mb-2 font-medium text-gray-700" htmlFor="height">
                                Taille (cm)
                            </label>
                            <input
                                type="number"
                                id="height"
                                value={heightCm}
                                onChange={(e) => setHeightCm(e.target.value)}
                                className="mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />

                            {error && (
                                <p className="mb-4 rounded-md bg-red-100 px-4 py-2 text-sm text-red-700">
                                    {error}
                                </p>
                            )}

                            <label className="mb-2 font-medium text-gray-700" htmlFor="password">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />

                            <label className="mb-2 font-medium text-gray-700" htmlFor="confirmPassword">
                                Confirmez le mot de passe
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />

                            <button type="submit" style={{ backgroundColor: "#FCAB10" }} className="mt-6 w-full rounded-md  px-4 py-2 text-white font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                                {loading ? "Inscription en cours..." : "S'inscrire"}
                            </button>
                            <div className="mt-4 grid grid-cols-1 gap-3">
                                <button type="button" onClick={handleGoogle} className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Continuer avec Google
                                </button>

                            </div>
                            <br></br>
                            <a href="/connexion">Vous avez deja un compte ? Connectez-vous</a>
                        </form>
                    </section>

                    <style>{`
        .nav-link { color: #39393A; position: relative; }
        .nav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px; background: transparent; transition: background 200ms ease; }
        .nav-link:hover::after { background: #FCAB10; }

        @keyframes floatBlob {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.05); }
        }
      `}</style>
                </main>
            </div>

        </>

    );
}

