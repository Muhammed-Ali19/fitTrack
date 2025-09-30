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
import React, { useMemo, useState } from "react";
import Link from "next/link";

export default function FitTrackHome() {
  const [height, setHeight] = useState(0);
  const [weight, setWeight] = useState(0);
  const [bmi, setBmi] = useState<number | null>(null);

  const category = useMemo(() => {
    if (bmi == null) return null;
    if (bmi < 18.5) return { label: "Insuffisance pondérale", color: "text-[#FF3D00]" };
    if (bmi < 25) return { label: "Corpulence normale", color: "text-[#4CAF50]" };
    if (bmi < 30) return { label: "Surpoids", color: "text-[#FCAB10]" };
    return { label: "Obésité", color: "text-[#FF3D00]" };
  }, [bmi]);

  const onCalc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!height || !weight) return;
    const h = Number(height) / 100;
    const val = Number(weight) / (h * h);
    setBmi(Number(val.toFixed(1)));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] text-[#333333]">
      {/* <AnimatedBackground /> */}

      {/* NAVBAR */}
      <header className="relative z-10">
        <nav className="mx-auto mt-6 w-[90%] max-w-5xl rounded-2xl border border-black/5 bg-white/90 shadow-lg shadow-black/5 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">


              <div>
                <Link href="/">
                  <img
                    src="/img/logo.png"
                    alt="FitTrack Logo"
                    style={{ width: "40px", height: "40px" }}
                  />
                </Link>
              </div>


            </div>

            <ul className="flex items-center gap-6 text-sm font-medium">
              <li><a href="profil" className="nav-link">Profil</a></li>
              <li><a href="alimentation" className="nav-link">Alimentation</a></li>
              <li><a href="seances" className="nav-link">Séances</a></li>
            </ul>
          </div>
        </nav>
      </header>

      {/* SECTION IMC */}
      <main className="relative z-10 mx-auto grid w-[90%] max-w-5xl place-items-center py-16">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#39393A] sm:text-6xl">IMC</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-[#333333]/80">
            Entrez votre taille et votre poids pour calculer votre IMC.
          </p>
        </div>

        <form onSubmit={onCalc} className="mt-8 w-full max-w-xl rounded-3xl border border-black/5 bg-white/95 p-6 shadow-xl shadow-black/5 backdrop-blur">
          <div className="grid gap-4">
            <div>
              <label htmlFor="height" className="mb-1 block text-sm font-medium text-[#39393A]">Taille (cm)</label>
              <input
                id="height"
                type="number"
                placeholder="Ex: 175"
                value={height || ""}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]"
              />
            </div>

            <div>
              <label htmlFor="weight" className="mb-1 block text-sm font-medium text-[#39393A]">Poids (kg)</label>
              <input
                id="weight"
                type="number"
                placeholder="Ex: 70"
                value={weight || ""}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-[#FCAB10] px-6 text-base font-semibold text-[#F5F5F5] shadow hover:brightness-95 active:translate-y-px active:shadow-sm"
            >
              Calculer
            </button>
          </div>

          {bmi !== null && (
            <div className="mt-5 rounded-xl border border-black/5 bg-[#F5F5F5] p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-[#39393A]">Votre IMC</p>
                <p className="text-sm font-medium text-[#333333]/70">(kg/m²)</p>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-3xl font-extrabold text-[#39393A]">{bmi}</span>
                {category && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${category.color} bg-white border border-black/5`}>{category.label}</span>
                )}
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full bg-[#FCAB10] transition-[width] duration-500"
                  style={{ width: `${Math.max(5, Math.min(100, (bmi / 40) * 100))}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-[#333333]/60">
                <span>15</span>
                <span>20</span>
                <span>25</span>
                <span>30</span>
                <span>40</span>
              </div>
            </div>
          )}
        </form>
      </main>

      <footer className="relative z-10 pb-8">

      </footer>

      <style>{`
        .nav-link { color: #39393A; position: relative; }
        .nav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px; background: transparent; transition: background 200ms ease; }
        .nav-link:hover::after { background: #FCAB10; }

        @keyframes floatBlob {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.05); }
        }
      `}</style>
    </div >
  );
}

function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-[#FCAB10]/30 blur-3xl animate-pulse" style={{ animation: "floatBlob 15s infinite alternate ease-in-out" }} />
      <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-[#39393A]/20 blur-3xl animate-pulse" style={{ animation: "floatBlob 20s infinite alternate ease-in-out" }} />
      <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-[#FCAB10]/20 blur-3xl animate-pulse" style={{ animation: "floatBlob 18s infinite alternate ease-in-out" }} />
    </div>
  );
}
