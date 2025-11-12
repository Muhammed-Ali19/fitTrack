"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import { auth } from "@/firebaseClient";
import { OAuthProvider, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

export default function ConnexionPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/profil");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Impossible de se connecter.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError(null);
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push("/profil");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Google: échec de connexion.";
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
                    {/* FORMULAIRE DE CONNEXION */}
                    <section className="mt-12 w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                            </div>
                            {error && (
                                <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
                                    {error}
                                </p>
                            )}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                            </div>
                            <button type="submit" style={{ backgroundColor: "#FCAB10" }} className="mt-6 w-full rounded-md  px-4 py-2 text-white font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                                {loading ? "Connexion..." : "Se connecter"}
                            </button>
                            <div className="mt-4 grid grid-cols-1 gap-3">
                                <button
                                    type="button"
                                    onClick={handleGoogle}
                                    className="flex items-center justify-center gap-3 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    <img
                                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                        alt="Google logo"
                                        className="w-5 h-5"
                                    />
                                    Continuer avec Google
                                </button>
                            </div>
                            <a href="/inscription">Vous n'avez pas de compte ? Inscrivez-vous</a>
                        </form>
                    </section>

                </main>
            </div>

        </>

    );
}
