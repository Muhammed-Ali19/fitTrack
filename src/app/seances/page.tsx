"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function SeancesPage() {
    const [seances, setSeances] = useState<string[]>([]);
    const [nouvelleSeance, setNouvelleSeance] = useState("");

    const ajouterSeance = (e: React.FormEvent) => {
        e.preventDefault();
        if (nouvelleSeance.trim() === "") return;
        setSeances([...seances, nouvelleSeance]);
        setNouvelleSeance("");
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8 font-sans flex flex-col items-center">
            {/* NAVBAR */}
            <header className="relative z-10 w-full">
                <nav className="mx-auto mt-6 w-[90%] max-w-5xl rounded-2xl border border-black/5 bg-white/90 shadow-lg shadow-black/5 backdrop-blur">
                    <div className="flex items-center justify-between px-6 py-3">
                        {/* Logo */}
                        <Link href="/">
                            <img
                                src="/img/logo.png"
                                alt="FitTrack Logo"
                                className="w-10 h-10 cursor-pointer"
                            />
                        </Link>

                        <p style={{ fontWeight: "bold", fontSize: "1.25rem", color: "#39393A", textAlign: "center" }}>FitTrack</p>

                        {/* Liens */}
                        <ul className="flex items-center gap-6 text-sm font-medium">
                            <li>
                                <Link
                                    href="/profil"
                                    className="text-gray-800 hover:text-orange-500 transition"
                                >
                                    Profil
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/alimentation"
                                    className="text-gray-800 hover:text-orange-500 transition"
                                >
                                    Alimentation
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/seances"
                                    className="text-gray-800 hover:text-orange-500 transition"
                                >
                                    Séances
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>
            </header>

            {/* Titre */}
            <h1 className="text-4xl font-bold text-gray-800 my-6">Mes Séances</h1>

            {/* Formulaire */}
            <form
                onSubmit={ajouterSeance}
                className="w-full max-w-md flex gap-3 mb-6 bg-white p-6 rounded-2xl shadow-md border border-black/5"
            >
                <input
                    type="text"
                    placeholder="Nom de la séance"
                    value={nouvelleSeance}
                    onChange={(e) => setNouvelleSeance(e.target.value)}
                    className="flex-1 border border-black/10 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                />
                <button
                    type="submit"
                    className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 active:translate-y-px transition"
                >
                    Ajouter
                </button>
            </form>

            {/* Liste des séances */}
            {seances.length === 0 ? (
                <p className="text-gray-600">Aucune séance pour le moment.</p>
            ) : (
                <ul className="w-full max-w-md space-y-3">
                    {seances.map((s, index) => (
                        <li
                            key={index}
                            className="bg-white p-4 rounded-xl shadow-sm border border-black/5"
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
