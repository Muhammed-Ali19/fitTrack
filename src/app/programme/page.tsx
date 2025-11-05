"use client";
import React, { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function SeancesPage() {
    const [seances, setSeances] = useState<
        { id: number; titre: string; description: string; duree: number; intensite: string }[]
    >([]);
    const [titre, setTitre] = useState("");
    const [description, setDescription] = useState("");
    const [duree, setDuree] = useState<number>(30);
    const [intensite, setIntensite] = useState("Moyenne");

    const ajouterSeance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!titre.trim()) return alert("Le titre est obligatoire !");
        const nouvelleSeance = {
            id: Date.now(),
            titre,
            description,
            duree,
            intensite,
        };
        setSeances([...seances, nouvelleSeance]);
        setTitre("");
        setDescription("");
        setDuree(30);
        setIntensite("Moyenne");
    };

    const supprimerSeance = (id: number) => {
        setSeances(seances.filter((s) => s.id !== id));
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] font-sans text-[#333333]">
            <Nav />

            <main className="min-h-screen p-8 flex flex-col items-center">
                {/* Titre */}
                <h1 className="text-4xl font-bold text-[#39393A] my-6">
                    🏋️‍♂️ Mes Séances de Sport
                </h1>

                {/* Formulaire d’ajout */}
                <form
                    onSubmit={ajouterSeance}
                    className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md space-y-4 border border-[#FCAB10]/20"
                >
                    <div>
                        <label className="block text-[#39393A] font-semibold mb-1">
                            Nom de la séance
                        </label>
                        <input
                            type="text"
                            value={titre}
                            onChange={(e) => setTitre(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FCAB10]"
                            placeholder="Ex: Cardio Full Body"
                        />
                    </div>

                    <div>
                        <label className="block text-[#39393A] font-semibold mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 h-24 focus:outline-none focus:ring-2 focus:ring-[#FCAB10]"
                            placeholder="Ex: Échauffement + burpees + gainage..."
                        />
                    </div>

                    <div className="flex space-x-4">
                        <div className="w-1/2">
                            <label className="block text-[#39393A] font-semibold mb-1">
                                Durée (min)
                            </label>
                            <input
                                type="number"
                                value={duree}
                                onChange={(e) => setDuree(Number(e.target.value))}
                                min={5}
                                max={180}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FCAB10]"
                            />
                        </div>

                        <div className="w-1/2">
                            <label className="block text-[#39393A] font-semibold mb-1">
                                Intensité
                            </label>
                            <select
                                value={intensite}
                                onChange={(e) => setIntensite(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FCAB10]"
                            >
                                <option>Faible</option>
                                <option>Moyenne</option>
                                <option>Élevée</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#FCAB10] text-[#F5F5F5] font-semibold py-2 rounded-lg hover:bg-[#e69a0d] transition"
                    >
                        ➕ Ajouter la séance
                    </button>
                </form>

                {/* Liste des séances */}
                <section className="w-full max-w-2xl mt-10 space-y-4">
                    {seances.map((s) => (
                        <div
                            key={s.id}
                            className="bg-white border border-[#FCAB10]/20 rounded-xl p-4 shadow flex justify-between items-center"
                        >
                            <div>
                                <h2 className="text-xl font-semibold text-[#39393A]">{s.titre}</h2>
                                <p className="text-sm text-[#555]">{s.description}</p>
                                <p className="text-sm mt-1 text-[#333]">
                                    ⏱️ {s.duree} min | 🔥 Intensité : <strong>{s.intensite}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => supprimerSeance(s.id)}
                                className="bg-[#FF3D00] text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
                            >
                                Supprimer
                            </button>
                        </div>
                    ))}

                    {seances.length === 0 && (
                        <p className="text-center text-gray-500 mt-6">
                            Aucune séance ajoutée pour le moment 💪
                        </p>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}
