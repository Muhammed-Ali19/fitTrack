"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { ensureDailyMealsFresh, readDailyMeals, writeDailyMeals } from "@/lib/dailyMealStorage";

type NutritionItem = {
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
};

type MealEntry = NutritionItem & { id: string };

const SUGGESTIONS = [
    "pomme",
    "150g poulet, 100g riz, 1 avocat",
    "yaourt nature, 30g amandes",
    "banane",
    "omelette 2 oeufs",
];

const DAY_CHECK_INTERVAL = 60_000;

function formatNumber(n: number, digits = 1) {
    return Number((n || 0).toFixed(digits));
}

function uid() {
    return Math.random().toString(36).slice(2);
}

export default function AlimentationPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<NutritionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Clef locale non configurée via UI désormais, mais on continue à lire localStorage côté requête
    const [activeTab, setActiveTab] = useState<"recherche" | "repas" | "historique">("recherche");
    const [meal, setMeal] = useState<MealEntry[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [portions, setPortions] = useState<Record<string, number>>({});
    // Debug UI retirée

    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        try {
            const h = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("fittrack_alim_history") || "[]") : [];
            if (Array.isArray(h)) setHistory(h.slice(0, 10));
        } catch { }

        setMeal(readDailyMeals<MealEntry>());
    }, []);

    useEffect(() => {
        writeDailyMeals(meal);
    }, [meal]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const checkForNewDay = () => {
            if (ensureDailyMealsFresh()) {
                setMeal([]);
            }
        };

        checkForNewDay();
        const intervalId = window.setInterval(checkForNewDay, DAY_CHECK_INTERVAL);
        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        // Debounced search on query changes
        if (activeTab !== "recherche") return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) { setResults([]); setError(null); return; }
        debounceRef.current = setTimeout(() => {
            rechercher(query);
        }, 450);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, activeTab]);

    const totals = useMemo(() => {
        return meal.reduce(
            (acc, it) => ({
                calories: acc.calories + (it.calories || 0),
                protein_g: acc.protein_g + (it.protein_g || 0),
                carbs_g: acc.carbs_g + (it.carbohydrates_total_g || 0),
                fat_g: acc.fat_g + (it.fat_total_g || 0),
                fiber_g: acc.fiber_g + (it.fiber_g || 0),
                sugar_g: acc.sugar_g + (it.sugar_g || 0),
                sodium_mg: acc.sodium_mg + (it.sodium_mg || 0),
                cholesterol_mg: acc.cholesterol_mg + (it.cholesterol_mg || 0),
            }),
            { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0, cholesterol_mg: 0 }
        );
    }, [meal]);

    async function rechercher(q: string) {
        setLoading(true);
        setError(null);
        setResults([]);
        try {
            const headers: Record<string, string> = {};
            try {
                const k = typeof window !== "undefined" ? localStorage.getItem("calorieninjas_dev_key") : null;
                if (k) headers["x-dev-api-key"] = k;
            } catch { }

            const res = await fetch(`/api/nutrition?query=${encodeURIComponent(q)}`, { cache: "no-store", headers });
            const data = await res.text();
            let json: any = null;
            try { json = JSON.parse(data); } catch { json = { error: "Réponse non JSON", details: data }; }
            if (!res.ok) {
                const details = typeof json?.details === "string" ? json.details : json?.details ? JSON.stringify(json.details) : "";
                const msg = [json?.error || "Erreur lors de la récupération des données", details].filter(Boolean).join(" — ");
                setError(msg);
                return;
            }
            const items: NutritionItem[] = Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : [];
            setResults(items);
            // initialize default portions for each result row
            setPortions((prev) => {
                const next = { ...prev } as Record<string, number>;
                items.forEach((it, i) => {
                    const key = `${it.name}-${i}`;
                    if (next[key] == null) {
                        next[key] = it.serving_size_g && it.serving_size_g > 0 ? Math.round(it.serving_size_g) : 100;
                    }
                });
                return next;
            });
            // persist history
            try {
                const next = [q, ...history.filter((x) => x !== q)].slice(0, 10);
                setHistory(next);
                if (typeof window !== "undefined") localStorage.setItem("fittrack_alim_history", JSON.stringify(next));
            } catch { }
        } catch (e) {
            setError("Erreur réseau inattendue");
        } finally {
            setLoading(false);
        }
    }

    function addToMeal(item: NutritionItem) {
        const entry: MealEntry = { ...item, id: uid() };
        setMeal((m) => [entry, ...m]);
        setActiveTab("repas");
    }

    function removeFromMeal(id: string) {
        setMeal((m) => m.filter((x) => x.id !== id));
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] font-sans text-[#333333]">
            <Nav />
            <main className="min-h-screen flex flex-col items-center p-8 font-sans ">
                <div className="w-full max-w-6xl">
                    <header className="mb-6">
                        <h1 className="text-4xl font-extrabold tracking-tight text-[#39393A]">Alimentation</h1>
                        <p className="mt-2 text-[#333333]/80">Recherche, construction de repas et suivi macros via CalorieNinjas.</p>
                    </header>

                    {/* Bandeau de configuration de clé supprimé */}

                    <div className="mb-4 inline-flex rounded-xl border border-black/10 bg-white p-1">
                        {[
                            { key: "recherche", label: "Recherche" },
                            { key: "repas", label: "Mon repas" },
                            { key: "historique", label: "Historique" },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key as any)}
                                className={`px-4 py-2 rounded-lg text-sm ${activeTab === t.key ? "bg-[#FCAB10] text-white" : "text-[#39393A]"}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === "recherche" && (
                        <section className="bg-white p-6 rounded-2xl shadow-md border border-black/5 mb-6">
                            <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) rechercher(query); }} className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    placeholder="Ex: 150g poulet, 100g riz, 1 avocat"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="border border-black/10 p-3 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                                <button
                                    type="submit"
                                    className="bg-[#FCAB10] text-white py-3 px-5 rounded-xl hover:brightness-95 transition-colors disabled:opacity-60"
                                    disabled={loading}
                                >
                                    {loading ? "Analyse..." : "Analyser"}
                                </button>
                            </form>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => { setQuery(s); rechercher(s); }}
                                        className="text-xs bg-[#39393A] text-white/95 px-3 py-1.5 rounded-full hover:opacity-90"
                                    >
                                        {s}
                                    </button>
                                ))}
                                {/* Bouton diagnostiquer supprimé */}
                            </div>

                            {error && <div className="mt-3 text-red-600">{error}</div>}
                            {/* Zone debug supprimée */}
                        </section>
                    )}

                    {activeTab === "recherche" && (
                        <section>
                            {loading && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="rounded-2xl bg-white border border-black/5 p-5 shadow-md animate-pulse h-32" />
                                    ))}
                                </div>
                            )}
                            {!loading && results.length === 0 && !error && (
                                <div className="text-sm text-[#333333]/70">Aucun résultat. Essayez une autre formulation (ex: "apple" au lieu de "pomme").</div>
                            )}
                            {!loading && results.length > 0 && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {results.map((item, idx) => {
                                        const key = `${item.name}-${idx}`;
                                        const portion = portions[key] ?? (item.serving_size_g || 100);
                                        // Calcul dynamique des valeurs selon la portion choisie
                                        const baseRef = item.serving_size_g && item.serving_size_g > 0 ? item.serving_size_g : 100;
                                        const ratio = (portion || 0) / baseRef;
                                        const kcal = Math.round((item.calories || 0) * ratio);
                                        const protein = formatNumber((item.protein_g || 0) * ratio);
                                        const carbs = formatNumber((item.carbohydrates_total_g || 0) * ratio);
                                        const fat = formatNumber((item.fat_total_g || 0) * ratio);

                                        const totalMacros = protein + carbs + fat || 1;
                                        const pPct = Math.min(100, Math.round((protein / totalMacros) * 100));
                                        const cPct = Math.min(100, Math.round((carbs / totalMacros) * 100));
                                        const fPct = Math.min(100, Math.round((fat / totalMacros) * 100));

                                        const adjustedItem = {
                                            ...item,
                                            serving_size_g: portion,
                                            calories: kcal,
                                            protein_g: protein,
                                            carbohydrates_total_g: carbs,
                                            fat_total_g: fat,
                                        };

                                        return (
                                            <div key={`${item.name}-${idx}`} className="rounded-2xl bg-white border border-black/5 p-5 shadow-md">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-lg font-semibold capitalize text-[#39393A]">{item.name}</h3>
                                                        <label className="text-xs text-[#333333]/70 flex items-center gap-2">
                                                            Portion :
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={5000}
                                                                value={portion}
                                                                onChange={(e) => {
                                                                    const num = Number(e.target.value);
                                                                    const val = Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0;
                                                                    setPortions((p) => ({ ...p, [key]: val }));
                                                                }}
                                                                className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#FCAB10]"
                                                            />{" "}
                                                            g
                                                        </label>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-extrabold text-[#FCAB10]">{kcal}</div>
                                                        <div className="text-xs text-[#333333]/70">kcal</div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 space-y-2">
                                                    <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
                                                        <div className="h-full bg-green-500" style={{ width: `${pPct}%` }} />
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-[#333333]/70">
                                                        <span>Prot {protein} g</span>
                                                        <span>Gluc {carbs} g</span>
                                                        <span>Lip {fat} g</span>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                    <span className="rounded-full bg-[#39393A] text-white/95 px-2.5 py-1">Fibres {formatNumber((item.fiber_g || 0) * ratio)} g</span>
                                                    <span className="rounded-full bg-[#39393A] text-white/95 px-2.5 py-1">Sucres {formatNumber((item.sugar_g || 0) * ratio)} g</span>
                                                    <span className="rounded-full bg-[#39393A] text-white/95 px-2.5 py-1">Sodium {Math.round((item.sodium_mg || 0) * ratio)} mg</span>
                                                    <span className="rounded-full bg-[#39393A] text-white/95 px-2.5 py-1">Cholest. {Math.round((item.cholesterol_mg || 0) * ratio)} mg</span>
                                                </div>

                                                <div className="mt-4">
                                                    <button
                                                        onClick={() => addToMeal(adjustedItem)}
                                                        className="w-full bg-[#FCAB10] text-white py-2 rounded-lg hover:brightness-95"
                                                    >
                                                        Ajouter au repas
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === "repas" && (
                        <section className="grid gap-4 sm:grid-cols-3">
                            <div className="sm:col-span-2 space-y-4">
                                {meal.length === 0 && (
                                    <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-[#333333]/70">Votre repas est vide. Ajoutez des éléments depuis l’onglet Recherche.</div>
                                )}
                                {meal.map((it) => (
                                    <div key={it.id} className="rounded-2xl bg-white border border-black/5 p-5 shadow-md">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-base font-semibold capitalize text-[#39393A]">{it.name}</h3>
                                                <p className="text-xs text-[#33333]/70">Portion: {it.serving_size_g} g</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-extrabold text-[#FCAB10]">{Math.round(it.calories)} kcal</div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-[#333333]/80">
                                            Prot {formatNumber(it.protein_g)} g · Gluc {formatNumber(it.carbohydrates_total_g)} g · Lip {formatNumber(it.fat_total_g)} g · Fibres {formatNumber(it.fiber_g)} g · Sucres {formatNumber(it.sugar_g)} g
                                        </div>
                                        <div className="mt-3">
                                            <button onClick={() => removeFromMeal(it.id)} className="text-xs px-3 py-1.5 rounded-lg border border-black/10 hover:bg-black/5">Retirer</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-xl bg-white p-5 border border-black/5 shadow-sm">
                                    <p className="text-xs text-[#333333]/70">Total repas</p>
                                    <p className="mt-1 text-3xl font-bold text-[#39393A]">{Math.round(totals.calories)} kcal</p>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                        <div className="rounded-lg bg-[#F5F5F5] p-3">Prot {formatNumber(totals.protein_g)} g</div>
                                        <div className="rounded-lg bg-[#F5F5F5] p-3">Gluc {formatNumber(totals.carbs_g)} g</div>
                                        <div className="rounded-lg bg-[#F5F5F5] p-3">Lip {formatNumber(totals.fat_g)} g</div>
                                        <div className="rounded-lg bg-[#F5F5F5] p-3">Fibres {formatNumber(totals.fiber_g)} g</div>
                                    </div>
                                    <div className="mt-2 text-xs text-[#333333]/70">Sucres {formatNumber(totals.sugar_g)} g · Sodium {Math.round(totals.sodium_mg)} mg · Cholestérol {Math.round(totals.cholesterol_mg)} mg</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setMeal([])}
                                        className="flex-1 text-sm px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5"
                                    >
                                        Vider le repas
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === "historique" && (
                        <section className="rounded-2xl bg-white border border-black/5 p-5 shadow-md">
                            {history.length === 0 ? (
                                <div className="text-sm text-[#333333]/70">Aucune recherche récente.</div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {history.map((h) => (
                                        <button
                                            key={h}
                                            onClick={() => { setActiveTab("recherche"); setQuery(h); rechercher(h); }}
                                            className="text-xs bg-[#39393A] text-white/95 px-3 py-1.5 rounded-full hover:opacity-90"
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
