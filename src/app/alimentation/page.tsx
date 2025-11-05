// FitTrack Home Page – React + Tailwind (single-file component)
// Palette :
//  - Primaire (orange): #FCAB10
//  - Secondaire (noir): #39393A
//  - Fond (blanc cassé): #F5F5F5
//  - Texte principal: #333333
//  - Texte secondaire: #F5F5F5
//  - Erreur: #FF3D00
//  - Validation: #4CAF50


"use client";
import { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function AlimentationPage() {
    const [repas, setRepas] = useState<string[]>([]);
    const [nouveauRepas, setNouveauRepas] = useState("");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<Array<{
        name: string;
        serving_size_g: number;
        calories: number;
        fat_total_g: number;
        fat_saturated_g: number;
        cholesterol_mg: number;
        sodium_mg: number;
        carbohydrates_total_g: number;
        fiber_g: number;
        sugar_g: number;
        protein_g: number;
    }>>([]);

    const ajouterRepas = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nouveauRepas.trim()) return;
        setRepas([...repas, nouveauRepas]);
        setNouveauRepas("");
    };

    const rechercherNutrition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setResults([]);
        try {
            const res = await fetch(`/api/nutrition?query=${encodeURIComponent(query)}`, {
                method: "GET",
                cache: "no-store",
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data?.error || "Erreur lors de la récupération des données");
            } else {
                setResults(Array.isArray(data?.items) ? data.items : []);
            }
        } catch {
            setError("Erreur réseau inattendue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>

            <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] font-sans text-[#333333]">
                <Nav />
                <main className="min-h-screen flex flex-col items-center p-8 font-sans ">

                    <h1 className="text-4xl font-bold mb-6 text-gray-800">Alimentation</h1>

                    <section className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-8 ">
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

                    <section className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
                        <h2 className="text-2xl font-semibold mb-4">Recherche nutritionnelle</h2>
                        <form onSubmit={rechercherNutrition} className="flex gap-3 mb-4">
                            <input
                                type="text"
                                placeholder="Ex: 1 pomme et 2 oeufs"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="border p-2 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <button
                                type="submit"
                                className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors disabled:opacity-60"
                                disabled={loading}
                            >
                                {loading ? "Recherche..." : "Obtenir nutrition"}
                            </button>
                        </form>

                        {error && (
                            <div className="text-red-600 mb-3">{error}</div>
                        )}

                        {results.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="border px-2 py-1 text-left">Nom</th>
                                            <th className="border px-2 py-1">Portion (g)</th>
                                            <th className="border px-2 py-1">Calories</th>
                                            <th className="border px-2 py-1">Lipides (g)</th>
                                            <th className="border px-2 py-1">Saturés (g)</th>
                                            <th className="border px-2 py-1">Cholest. (mg)</th>
                                            <th className="border px-2 py-1">Sodium (mg)</th>
                                            <th className="border px-2 py-1">Glucides (g)</th>
                                            <th className="border px-2 py-1">Fibres (g)</th>
                                            <th className="border px-2 py-1">Sucres (g)</th>
                                            <th className="border px-2 py-1">Protéines (g)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((item, idx) => (
                                            <tr key={`${item.name}-${idx}`} className="odd:bg-white even:bg-gray-50">
                                                <td className="border px-2 py-1 text-left capitalize">{item.name}</td>
                                                <td className="border px-2 py-1 text-right">{item.serving_size_g}</td>
                                                <td className="border px-2 py-1 text-right">{item.calories}</td>
                                                <td className="border px-2 py-1 text-right">{item.fat_total_g}</td>
                                                <td className="border px-2 py-1 text-right">{item.fat_saturated_g}</td>
                                                <td className="border px-2 py-1 text-right">{item.cholesterol_mg}</td>
                                                <td className="border px-2 py-1 text-right">{item.sodium_mg}</td>
                                                <td className="border px-2 py-1 text-right">{item.carbohydrates_total_g}</td>
                                                <td className="border px-2 py-1 text-right">{item.fiber_g}</td>
                                                <td className="border px-2 py-1 text-right">{item.sugar_g}</td>
                                                <td className="border px-2 py-1 text-right">{item.protein_g}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                </main>
                <Footer />
            </div>
        </>
    );
}
