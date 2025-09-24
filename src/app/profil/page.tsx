"use client";
import React, { useMemo, useState } from "react";

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
        const h = Number(height) / 100; // cm -> m
        const val = Number(weight) / (h * h);
        setBmi(Number(val.toFixed(1)));
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] text-[#333333]">
            {/* Animated background blobs (subtil, non intrusif) */}
            <BackgroundBlobs />

            {/* NAVBAR */}
            <header className="relative z-10">
                <nav className="mx-auto mt-6 w-[90%] max-w-5xl rounded-2xl border border-black/5 bg-white/90 shadow-lg shadow-black/5 backdrop-blur">
                    <div className="flex items-center justify-between px-6 py-3">
                        {/* Logo + marque */}
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#FCAB10] text-[#F5F5F5] shadow">
                                {/* haltère en SVG */}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    <path d="M4 14V10M8 16V8M16 16V8M20 14V10"/>
                                    <rect x="9" y="10" width="6" height="4" rx="1"/>
                                </svg>
                            </div>
                            <span className="text-lg font-semibold tracking-tight text-[#39393A]">FitTrack</span>
                        </div>

                        {/* Liens */}
                        <ul className="flex items-center gap-6 text-sm font-medium">
                            <li><a href="#profil" className="nav-link">Profil</a></li>
                            <li><a href="#alimentation" className="nav-link">Alimentation</a></li>
                            <li><a href="#seances" className="nav-link">Séances</a></li>
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
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="number"
                                placeholder="Ex: 175"
                                value={height || ""}
                                onChange={(e) => setHeight(Number(e.target.value))}
                                className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base outline-none ring-0 transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]"
                            />
                        </div>

                        <div>
                            <label htmlFor="weight" className="mb-1 block text-sm font-medium text-[#39393A]">Poids (kg)</label>
                            <input
                                id="weight"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="number"
                                placeholder="Ex: 70"
                                value={weight || ""}
                                onChange={(e) => setWeight(Number(e.target.value))}
                                className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base outline-none ring-0 transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-[#FCAB10] px-6 text-base font-semibold text-[#F5F5F5] shadow hover:brightness-95 active:translate-y-px active:shadow-sm"
                        >
                            Calculer
                        </button>
                    </div>

                    {/* Résultat */}
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

                            {/* Barre d'échelle simple */}
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

            {/* Footer minimal */}
            <footer className="relative z-10 pb-8">
                <p className="mx-auto w-[90%] max-w-5xl text-xs text-[#333333]/60">
                    © {new Date().getFullYear()} FitTrack. Interface d'accueil.
                </p>
            </footer>

            {/* Styles additionnels (animations + liens) */}
            <style>{`
        .nav-link { color: #39393A; position: relative; }
        .nav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px; background: transparent; transition: background 200ms ease; }
        .nav-link:hover::after { background: #FCAB10; }

        @keyframes blob {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(20px,-10px) scale(1.05); }
          66% { transform: translate(-10px,20px) scale(0.98); }
        }
      `}</style>
        </div>
    );
}

function BackgroundBlobs() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* Motif doux en "nuages" + dégradés, respecte le fond #F5F5F5 */}
            <div className="absolute -left-8 top-24 h-64 w-64 rounded-[40%] bg-[#FCAB10]/20 blur-3xl" style={{ animation: "blob 18s infinite ease-in-out" }} />
            <div className="absolute right-0 top-0 h-72 w-72 rounded-[45%] bg-[#39393A]/10 blur-3xl" style={{ animation: "blob 22s infinite ease-in-out" }} />
            <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-[45%] bg-[#FCAB10]/10 blur-3xl" style={{ animation: "blob 20s infinite ease-in-out" }} />
            <div className="absolute bottom-[-2rem] right-16 h-64 w-64 rounded-[40%] bg-[#39393A]/10 blur-3xl" style={{ animation: "blob 24s infinite ease-in-out" }} />
        </div>
    );
}


