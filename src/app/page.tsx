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
import React, { useEffect, useMemo, useState } from "react";
import Nav from "./components/Nav"; // <-- import du composant Nav
import Footer from "./components/Footer"; // <-- import du composant Footer
import "./globals.css"; // Assurez-vous d'avoir les styles globaux
import { auth, db } from "@/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import PatternBackground from "./components/PatternV2";

type SyncFeedback = { type: "success" | "error" | "info"; message: string };

const MIN_CALORIE_GOAL = 1200;

function computeAgeFromBirthDate(birthDate?: string): number | null {
  if (!birthDate) return null;
  const parsed = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

function resolveDeltaFromBmi(bmiValue: number): number {
  if (bmiValue < 18.5) return 300;
  if (bmiValue < 25) return 0;
  if (bmiValue < 30) return -300;
  return -500;
}


type UserProfile = {
  heightCm?: number;
  weightKg?: number;
  birthDate?: string;
  sex?: "M" | "F" | "Other" | "T-MAX 530";
  nutrition?: {
    activityFactor?: number;
    targetKcal?: number;
    maintenanceKcal?: number;
    targetDeltaKcal?: number;
  };
  hydration?: {
    targetLiters?: number;
  };
  metrics?: {
    lastBmi?: number;
    lastBmr?: number;
    lastTdee?: number;
    lastBodyFatPct?: number;
    lastWaterIntakeL?: number;
    lastUpdatedAt?: unknown;
  };
};

export default function FitTrackHome() {
  const [height, setHeight] = useState(0);
  const [weight, setWeight] = useState(0);
  const [bmi, setBmi] = useState<number | null>(null);
  const [age, setAge] = useState(0);
  const [sex, setSex] = useState<"homme" | "femme">("homme");
  const [activity, setActivity] = useState(1.2);
  const [waterL, setWaterL] = useState<number | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);
  const [bodyFat, setBodyFat] = useState<number | null>(null);
  const [targetCalories, setTargetCalories] = useState<number | null>(null);
  const [targetAdjustment, setTargetAdjustment] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedback | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUserId(null);
        setSyncFeedback({
          type: "info",
          message: "Connectez-vous pour enregistrer votre IMC et vos objectifs dans le cloud.",
        });
        return;
      }
      setUserId(firebaseUser.uid);
      setSyncFeedback(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    (async () => {
      try {
        const snapshot = await getDoc(doc(db, "users", userId));
        if (!snapshot.exists() || !isMounted) return;
        const data = snapshot.data() as UserProfile;
        if (typeof data.heightCm === "number") setHeight(data.heightCm);
        if (typeof data.weightKg === "number") setWeight(data.weightKg);
        const derivedAge = computeAgeFromBirthDate(data.birthDate);
        if (derivedAge !== null) setAge(derivedAge);
        if (typeof data.nutrition?.activityFactor === "number") setActivity(data.nutrition.activityFactor);
        if (typeof data.nutrition?.targetKcal === "number") setTargetCalories(Math.round(data.nutrition.targetKcal));
        if (typeof data.nutrition?.targetDeltaKcal === "number") setTargetAdjustment(data.nutrition.targetDeltaKcal);
        const hydrationTarget = data.hydration?.targetLiters;
        const lastWaterEstimate = data.metrics?.lastWaterIntakeL;
        if (typeof hydrationTarget === "number") {
          setWaterL(Number(hydrationTarget.toFixed(2)));
        } else if (typeof lastWaterEstimate === "number") {
          setWaterL(Number(lastWaterEstimate.toFixed(2)));
        }
        if (data.sex === "F") setSex("femme");
        if (data.sex === "M") setSex("homme");
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
        if (isMounted) {
          setSyncFeedback({
            type: "error",
            message: "Impossible de récupérer vos données de profil Firebase.",
          });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const category = useMemo(() => {
    if (bmi == null) return null;
    if (bmi < 18.5) return { label: "Insuffisance pondérale", color: "text-[#FF3D00]" };
    if (bmi < 25) return { label: "Corpulence normale", color: "text-[#4CAF50]" };
    if (bmi < 30) return { label: "Surpoids", color: "text-[#FCAB10]" };
    return { label: "Obésité", color: "text-[#FF3D00]" };
  }, [bmi]);

  const onCalc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncFeedback(null);
    if (!height || !weight) {
      setSyncFeedback({
        type: "error",
        message: "Merci de renseigner votre taille et votre poids avant de calculer votre IMC.",
      });
      return;
    }
    const h = Number(height) / 100;
    const val = Number(weight) / (h * h);
    const bmiLocal = Number(val.toFixed(1));
    setBmi(bmiLocal);

    // Eau (L/jour) = poids * 0.03
    const water = Number((Number(weight) * 0.03).toFixed(2));
    setWaterL(water);

    // BMR: Mifflin-St Jeor
    const base = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age);
    const bmrLocal = sex === "homme" ? base + 5 : base - 161;
    const roundedBmr = Math.round(bmrLocal);
    setBmr(roundedBmr);

    // TDEE
    const tdeeLocal = bmrLocal * Number(activity || 1.2);
    const maintenanceKcal = Math.round(tdeeLocal);
    setTdee(maintenanceKcal);

    // % Masse grasse (Deurenberg)
    const bfLocal =
      sex === "homme"
        ? 1.2 * bmiLocal + 0.23 * Number(age) - 16.2
        : 1.2 * bmiLocal + 0.23 * Number(age) - 5.4;
    const formattedBodyFat = Number(bfLocal.toFixed(1));
    setBodyFat(formattedBodyFat);

    const targetDeltaLocal = resolveDeltaFromBmi(bmiLocal);
    const recommendedCalories = Math.max(MIN_CALORIE_GOAL, maintenanceKcal + targetDeltaLocal);
    setTargetCalories(recommendedCalories);
    setTargetAdjustment(targetDeltaLocal);

    if (!userId) {
      setSyncFeedback({
        type: "info",
        message: "Connectez-vous pour enregistrer ces recommandations et les retrouver dans votre suivi alimentation.",
      });
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", userId),
        {
          heightCm: Number(height),
          weightKg: Number(weight),
          sex: sex === "homme" ? "M" : "F",
          nutrition: {
            activityFactor: Number(activity),
            maintenanceKcal,
            targetDeltaKcal: targetDeltaLocal,
            targetKcal: recommendedCalories,
          },
          hydration: {
            targetLiters: water,
            updatedAt: serverTimestamp(),
          },
          metrics: {
            lastBmi: bmiLocal,
            lastBmr: roundedBmr,
            lastTdee: maintenanceKcal,
            lastBodyFatPct: formattedBodyFat,
            lastWaterIntakeL: water,
            lastUpdatedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );
      setSyncFeedback({
        type: "success",
        message: "Objectifs calorique et hydratation mis à jour dans votre profil Firestore.",
      });
    } catch (error) {
      console.error("Erreur Firestore (onCalc):", error);
      setSyncFeedback({
        type: "error",
        message: "Impossible d'enregistrer vos résultats pour le moment. Réessayez plus tard.",
      });
    } finally {
      setSaving(false);
    }
  };



  return (

    <div className="relative min-h-screen overflow-hidden  font-sans text-[#333333]">
      {/* <AnimatedBackground /> */}



      <Nav />
      <PatternBackground />





      {/* SECTION IMC */}
      <main className="relative z-10 mx-auto grid w-[90%] max-w-5xl place-items-center py-16 animate-page-enter">
        <div className="text-center bg-white/70 backdrop-blur-md rounded-2xl shadow-md shadow-black/10 px-6 py-4 inline-block animate-card-rise animate-delay-1">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#39393A] sm:text-6xl">
            IMC
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-[#333333]/90">
            Entrez votre taille et votre poids pour calculer votre IMC.
          </p>
        </div>

        <form onSubmit={onCalc} className="mt-8 w-full max-w-xl rounded-3xl border border-black/5 bg-white/95 p-6 shadow-xl shadow-black/5 backdrop-blur animate-card-pop animate-delay-2">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="mb-1 block text-sm font-medium text-[#39393A]">Âge (ans)</label>
                <input
                  id="age"
                  type="number"
                  placeholder="Ex: 25"
                  value={age || ""}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]"
                />
              </div>
              <div>
                <span className="mb-1 block text-sm font-medium text-[#39393A]">Sexe</span>
                <div className="flex gap-4 h-12 items-center">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="radio" name="sex" checked={sex === "homme"} onChange={() => setSex("homme")} />
                    Homme
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="radio" name="sex" checked={sex === "femme"} onChange={() => setSex("femme")} />
                    Femme
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="activity" className="mb-1 block text-sm font-medium text-[#39393A]">Niveau d’activité</label>
              <select
                id="activity"
                value={activity}
                onChange={(e) => setActivity(Number(e.target.value))}
                className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]"
              >
                <option value={1.2}>Sédentaire (1,2)</option>
                <option value={1.375}>Légèrement actif (1,375)</option>
                <option value={1.55}>Modérément actif (1,55)</option>
                <option value={1.725}>Très actif (1,725)</option>
                <option value={1.9}>Extrêmement actif (1,9)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-[#FCAB10] px-6 text-base font-semibold text-[#F5F5F5] shadow hover:brightness-95 active:translate-y-px active:shadow-sm disabled:opacity-60"
            >
              {saving ? "Sauvegarde..." : "Calculer"}
            </button>
            {syncFeedback && (
              <p
                className={`mt-3 text-sm ${syncFeedback.type === "success"
                  ? "text-green-600"
                  : syncFeedback.type === "error"
                    ? "text-red-600"
                    : "text-[#333333]"
                  }`}
              >
                {syncFeedback.message}
              </p>
            )}
          </div>

          {bmi !== null && (
            <div className="mt-5 rounded-xl border border-black/5 bg-[#F5F5F5] p-4 animate-card-pop animate-delay-3">
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
              {/* Résultats supplémentaires */}
              <div className="mt-5 grid gap-3">
                {waterL !== null && (
                  <div className="rounded-lg bg-white p-3 border border-black/5">
                    <p className="text-sm font-medium text-[#39393A]">💧 Besoins en eau (estimation)</p>
                    <p className="text-sm text-[#333333]/80">Eau (L/jour) = poids (kg) × 0,03</p>
                    <p className="mt-1 text-lg font-semibold text-[#39393A]">≈ {waterL} L/jour</p>
                    <p className="text-xs text-[#333333]/70 mt-1">+0,5 à +1 L si activité intense ou forte chaleur. L’alimentation (fruits, légumes) apporte aussi de l’eau.</p>
                  </div>
                )}
                {bmr !== null && (
                  <div className="rounded-lg bg-white p-3 border border-black/5">
                    <p className="text-sm font-medium text-[#39393A]">🔥 BMR (métabolisme de base)</p>
                    <p className="mt-1 text-lg font-semibold text-[#39393A]">≈ {bmr} kcal/jour</p>
                  </div>
                )}
                {tdee !== null && (
                  <div className="rounded-lg bg-white p-3 border border-black/5">
                    <p className="text-sm font-medium text-[#39393A]">⚡ TDEE (dépense énergétique totale)</p>
                    <p className="mt-1 text-lg font-semibold text-[#39393A]">≈ {tdee} kcal/jour</p>
                    <p className="text-xs text-[#333333]/70 mt-1">TDEE = BMR × facteur d’activité. Inclut mouvements quotidiens et activité physique.</p>
                  </div>
                )}
                {targetCalories !== null && (
                  <div className="rounded-lg bg-white p-3 border border-black/5">
                    <p className="text-sm font-medium text-[#39393A]">🎯 Objectif calorique quotidien</p>
                    <p className="mt-1 text-lg font-semibold text-[#39393A]">🔥 {targetCalories} kcal/jour</p>
                    {targetAdjustment !== null && (
                      <p className="text-xs text-[#333333]/70 mt-1">
                        {targetAdjustment > 0
                          ? `+${targetAdjustment} kcal pour encourager une légère prise de masse.`
                          : targetAdjustment < 0
                            ? `${targetAdjustment} kcal pour créer un déficit modéré.`
                            : "Objectif de maintien basé sur votre TDEE."}
                      </p>
                    )}
                  </div>
                )}
                {bodyFat !== null && (
                  <div className="rounded-lg bg-white p-3 border border-black/5">
                    <p className="text-sm font-medium text-[#39393A]">Calcule Masse Graisseuse (estimation)</p>
                    <p className="text-sm text-[#333333]/80">%MG = 1,20 × IMC + 0,23 × âge {sex === "homme" ? "- 16,2" : "- 5,4"}</p>
                    <p className="mt-1 text-lg font-semibold text-[#39393A]">≈ {bodyFat}%</p>
                    <div className="mt-2 text-xs text-[#333333]/80">
                      {sex === "homme" ? (
                        <div className="grid grid-cols-5 gap-2">
                          <span>2–5: Athlète</span>
                          <span>6–13: Fitness</span>
                          <span>14–17: Acceptable</span>
                          <span>18–24: Moyenne</span>
                          <span>25+: Élevé</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-5 gap-2">
                          <span>10–13: Athlète</span>
                          <span>14–20: Fitness</span>
                          <span>21–24: Acceptable</span>
                          <span>25–31: Moyenne</span>
                          <span>32+: Élevé</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </main>

      <Footer />
    </div >
  );
}



