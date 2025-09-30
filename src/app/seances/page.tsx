"use client"; // nécessaire pour utiliser le state React dans App Router
import { useState } from "react";

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
        <main style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
            <h1>Mes Séances</h1>

            <form onSubmit={ajouterSeance} style={{ marginBottom: "1rem" }}>
                <input
                    type="text"
                    placeholder="Nom de la séance"
                    value={nouvelleSeance}
                    onChange={(e) => setNouvelleSeance(e.target.value)}
                    style={{ padding: "0.5rem", marginRight: "0.5rem" }}
                />
                <button type="submit" style={{ padding: "0.5rem 1rem" }}>
                    Ajouter
                </button>
            </form>

            {seances.length === 0 ? (
                <p>Aucune séance pour le moment.</p>
            ) : (
                <ul>
                    {seances.map((s, index) => (
                        <li key={index} style={{ marginBottom: "0.5rem" }}>
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
