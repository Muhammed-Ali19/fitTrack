"use client";
import React, { useState } from "react";
import Link from "next/link";
import Nav from "../components/Nav";

export default function InscriptionPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // Nouvel état pour la confirmation du mot de passe

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas !");
            return;
        }
        // Logique d'inscription ici
        console.log("Email:", email);
        console.log("Password:", password);
    };

    return (
        <>
            <Nav />
            <main className="min-h-screen bg-gray-50 p-8 font-sans flex flex-col items-center">
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
                            S'inscrire
                        </button>
                        <a href="/connexion">Vous avez déjà un compte ? Connectez-vous</a>
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
        </>

    );
}