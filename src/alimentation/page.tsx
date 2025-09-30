"use client";

import { useState } from "react";

export default function AlimentationPage() {
    const [repas, setRepas] = useState<string[]>([]);
    const [nouveauRepas, setNouveauRepas] = useState("");

    const ajouterRepas = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nouveauRepas.trim()) return;
        setRepas([...repas, nouveauRepas]);
        setNouveauRepas("");
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center p-8 font-sans">
            <h1 className="text-4xl font-bold mb-6 text-gray-800">Alimentation</h1>

            <section className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-8">
                <h2 className="text-2xl font-semibold mb-4">Ajouter un repas</h2>
                <form onSubmit={ajouterRepas} className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Nom du repas"
                        value={nouveauRepas}
                        onChange={(e) => setNouveauRepas(e.target.value)}
                        className="border p-2 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <button
                        type="submit"
                        className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors"
                    >
                        Ajouter
                    </button>
                </form>

                {repas.length > 0 && (
                    <ul className="mt-4 list-disc list-inside">
                        {repas.map((r, idx) => (
                            <li key={idx}>{r}</li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
