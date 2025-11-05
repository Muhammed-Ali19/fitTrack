"use client";
import React, { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

type Seance = {
    title: string;
    description: string;
    imageUrl: string;
    durationMinutes?: number;
    intensity?: "faible" | "modérée" | "élevée";
    equipment?: string;
    exercises?: string[];
    notes?: string;
};

export default function SeancesPage() {
    const [seances, setSeances] = useState<Seance[]>([
        {
            title: "Séance 1/semaine",
            description: "Description 1",
            imageUrl: "/img/image_muscu.png",
            durationMinutes: 30,
            intensity: "modérée",
            equipment: "Tapis, haltères légers",
            exercises: ["Échauffement 5min", "Circuit full-body 20min", "Étirements 5min"],
            notes: "Hydrate-toi et respire régulièrement.",
        },
        {
            title: "Séance 2/semaine",
            description: "Description 2",
            imageUrl: "/img/image_muscu.png",
            durationMinutes: 45,
            intensity: "élevée",
            equipment: "Banc, barre, élastiques",
            exercises: ["Échauffement 10min", "Force haut du corps 25min", "Core 10min"],
            notes: "Concentre-toi sur la technique.",
        },
    ]);

    const [nouvelleSeance, setNouvelleSeance] = useState("");
    const [nouvelleDescription, setNouvelleDescription] = useState("");
    const [nouvelleImage, setNouvelleImage] = useState("");
    const [nouvelleDuree, setNouvelleDuree] = useState<string>("");
    const [nouvelleIntensite, setNouvelleIntensite] = useState<"faible" | "modérée" | "élevée" | "">("");
    const [nouvelEquipement, setNouvelEquipement] = useState("");
    const [nouveauxExercices, setNouveauxExercices] = useState("");
    const [nouvellesNotes, setNouvellesNotes] = useState("");
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const ajouterSeance = (e: React.FormEvent) => {
        e.preventDefault();
        if (
            nouvelleSeance.trim() === "" ||
            nouvelleDescription.trim() === "" ||
            nouvelleImage.trim() === ""
        )
            return;

        const seance: Seance = {
            title: nouvelleSeance.trim(),
            description: nouvelleDescription.trim(),
            imageUrl: nouvelleImage.trim(),
            durationMinutes: nouvelleDuree ? Number(nouvelleDuree) : undefined,
            intensity: nouvelleIntensite || undefined,
            equipment: nouvelEquipement || undefined,
            exercises: nouveauxExercices
                ? nouveauxExercices
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : undefined,
            notes: nouvellesNotes || undefined,
        };

        setSeances((prev) => [...prev, seance]);

        setNouvelleSeance("");
        setNouvelleDescription("");
        setNouvelleImage("");
        setNouvelleDuree("");
        setNouvelleIntensite("");
        setNouvelEquipement("");
        setNouveauxExercices("");
        setNouvellesNotes("");
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] font-sans text-[#333333]">
            <Nav />
            <main className="min-h-screen p-8 flex flex-col items-center">
                <h1 className="text-4xl font-bold text-[#39393A] my-6">Mes séances</h1>

                {/* Formulaire ajout séance */}
                <form onSubmit={ajouterSeance} className="mb-6 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                        type="text"
                        value={nouvelleSeance}
                        onChange={(e) => setNouvelleSeance(e.target.value)}
                        placeholder="Titre de la séance"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FCAB10]"
                    />
                    <input
                        type="text"
                        value={nouvelleDescription}
                        onChange={(e) => setNouvelleDescription(e.target.value)}
                        placeholder="Description"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FCAB10]"
                    />
                    <input
                        type="text"
                        value={nouvelleImage}
                        onChange={(e) => setNouvelleImage(e.target.value)}
                        placeholder="URL image (ex: /img/image_muscu.png)"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FCAB10]"
                    />

                    <input
                        type="number"
                        min={0}
                        value={nouvelleDuree}
                        onChange={(e) => setNouvelleDuree(e.target.value)}
                        placeholder="Durée (min)"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FCAB10]"
                    />
                    <select
                        value={nouvelleIntensite}
                        onChange={(e) => setNouvelleIntensite(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FCAB10] bg-white"
                    >
                        <option value="">Intensité (optionnel)</option>
                        <option value="faible">Faible</option>
                        <option value="modérée">Modérée</option>
                        <option value="élevée">Élevée</option>
                    </select>
                    <input
                        type="text"
                        value={nouvelEquipement}
                        onChange={(e) => setNouvelEquipement(e.target.value)}
                        placeholder="Équipement (ex: tapis, haltères)"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FCAB10]"
                    />

                    <input
                        type="text"
                        value={nouveauxExercices}
                        onChange={(e) => setNouveauxExercices(e.target.value)}
                        placeholder="Exercices (séparés par des virgules)"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FCAB10] md:col-span-2"
                    />
                    <input
                        type="text"
                        value={nouvellesNotes}
                        onChange={(e) => setNouvellesNotes(e.target.value)}
                        placeholder="Notes (optionnel)"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FCAB10]"
                    />

                    <div className="md:col-span-3 flex justify-end">
                        <button
                            type="submit"
                            className="bg-[#FCAB10] text-white px-4 py-2 rounded-lg hover:bg-orange-500 transition"
                        >
                            Ajouter
                        </button>
                    </div>
                </form>

                {/* Cards des séances */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                    {seances.map((seance, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition flex flex-col items-start"
                            >
                                <img
                                    src={seance.imageUrl}
                                    alt={`Illustration de ${seance.title}`}
                                    className="rounded-md mb-4 w-full h-48 object-cover"
                                />
                                <h3 className="text-xl font-semibold text-[#39393A]">{seance.title}</h3>
                                <p className="text-gray-600 mt-2">{seance.description}</p>

                                <div className="mt-3 text-sm text-gray-700 space-y-1">
                                    {typeof seance.durationMinutes === "number" && (
                                        <div><span className="font-semibold">Durée:</span> {seance.durationMinutes} min</div>
                                    )}
                                    {seance.intensity && (
                                        <div><span className="font-semibold">Intensité:</span> {seance.intensity}</div>
                                    )}
                                </div>

                                <button
                                    className="mt-4 bg-[#FCAB10] text-white px-3 py-2 rounded-lg hover:bg-orange-500 transition"
                                    onClick={() => setOpenIndex(isOpen ? null : index)}
                                >
                                    {isOpen ? "Masquer les détails" : "Voir détails"}
                                </button>

                                {isOpen && (
                                    <div className="mt-4 w-full text-sm text-gray-700">
                                        {seance.equipment && (
                                            <div className="mb-2"><span className="font-semibold">Équipement:</span> {seance.equipment}</div>
                                        )}
                                        {seance.exercises && seance.exercises.length > 0 && (
                                            <div className="mb-2">
                                                <div className="font-semibold mb-1">Exercices:</div>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {seance.exercises.map((ex, i) => (
                                                        <li key={i}>{ex}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {seance.notes && (
                                            <div className="mt-2"><span className="font-semibold">Notes:</span> {seance.notes}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <Footer />
            </main>

        </div>
    );
}
