"use client";

import { useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [poids, setPoids] = useState("");
  const [taille, setTaille] = useState("");
  const [imc, setImc] = useState<number | null>(null);
  const [categorie, setCategorie] = useState("");

  const calculerIMC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poids || !taille) return;

    const h = parseFloat(taille) / 100;
    const imcCalc = parseFloat(poids) / (h * h);
    setImc(Number(imcCalc.toFixed(1)));

    let cat = "";
    if (imcCalc < 18.5) cat = "Maigreur";
    else if (imcCalc < 25) cat = "Corpulence normale";
    else if (imcCalc < 30) cat = "Surpoids";
    else if (imcCalc < 35) cat = "Obésité modérée";
    else if (imcCalc < 40) cat = "Obésité sévère";
    else cat = "Obésité morbide";

    setCategorie(cat);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-8 font-sans">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">Bienvenue sur FitTrack</h1>
      <p className="text-gray-600 mb-8 text-center max-w-xl">
        Suivez vos séances, votre nutrition et votre progression !
      </p>

      <section className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Calculateur IMC</h2>
        <form onSubmit={calculerIMC} className="flex flex-col gap-3">
          <input
            type="number"
            placeholder="Poids (kg)"
            value={poids}
            onChange={(e) => setPoids(e.target.value)}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            placeholder="Taille (cm)"
            value={taille}
            onChange={(e) => setTaille(e.target.value)}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Calculer
          </button>
        </form>
        {imc && (
          <p className="mt-4 text-gray-700">
            Votre IMC : <span className="font-semibold">{imc}</span> — {categorie}
          </p>
        )}
      </section>

      <section className="w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Navigation</h2>
        <nav className="flex flex-col gap-3">
          <Link href="/seances" className="bg-green-500 text-white py-2 rounded text-center hover:bg-green-600 transition-colors">
            Séances
          </Link>
          <Link href="/nutrition" className="bg-yellow-500 text-white py-2 rounded text-center hover:bg-yellow-600 transition-colors">
            Nutrition
          </Link>
          <Link href="/profil" className="bg-purple-500 text-white py-2 rounded text-center hover:bg-purple-600 transition-colors">
            Profil
          </Link>
        </nav>
      </section>
    </main>
  );
}
