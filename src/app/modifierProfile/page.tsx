"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import { auth, db, storage } from "@/firebaseClient";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type TrainingPlanType = "FULL_BODY" | "UPPER_LOWER" | "SPLIT_4" | "PPL";
type GoalCode = "MASS_GAIN" | "MUSCLE_MAINTAIN" | "CUTTING" | "GET_BACK_IN_SHAPE";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  sex: "M" | "F" | "Other" | "T-MAX 530";
  birthDate: string;
  heightCm: string;
  weightKg: string;
  trainingSessionsPerWeek: number;
  trainingPlanType: TrainingPlanType;
  nutritionGoalCode: GoalCode;
  nutritionActivityFactor: string;
  nutritionTargetDeltaKcal: string;
  photoUrl?: string;
};

const DEFAULT_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  sex: "Other",
  birthDate: "",
  heightCm: "",
  weightKg: "",
  trainingSessionsPerWeek: 3,
  trainingPlanType: "UPPER_LOWER",
  nutritionGoalCode: "GET_BACK_IN_SHAPE",
  nutritionActivityFactor: "1.4",
  nutritionTargetDeltaKcal: "0",
  photoUrl: undefined,
};

export default function ModifierProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // -------------------- AUTH & LOAD --------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/connexion");
        return;
      }
      setUserId(firebaseUser.uid);
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setForm({
            firstName: (data.firstName as string) ?? "",
            lastName: (data.lastName as string) ?? "",
            email: firebaseUser.email ?? (data.email as string) ?? "",
            sex: (data.sex as FormState["sex"]) ?? "Other",
            birthDate: (data.birthDate as string) ?? "",
            heightCm: data.heightCm != null ? String(data.heightCm) : "",
            weightKg: data.weightKg != null ? String(data.weightKg) : "",
            trainingSessionsPerWeek:
              data.training?.sessionsPerWeek ?? DEFAULT_FORM.trainingSessionsPerWeek,
            trainingPlanType:
              (data.training?.planType as TrainingPlanType) ?? DEFAULT_FORM.trainingPlanType,
            nutritionGoalCode:
              (data.nutrition?.goalCode as GoalCode) ?? DEFAULT_FORM.nutritionGoalCode,
            nutritionActivityFactor:
              data.nutrition?.activityFactor != null
                ? String(data.nutrition.activityFactor)
                : DEFAULT_FORM.nutritionActivityFactor,
            nutritionTargetDeltaKcal:
              data.nutrition?.targetDeltaKcal != null
                ? String(data.nutrition.targetDeltaKcal)
                : DEFAULT_FORM.nutritionTargetDeltaKcal,
            photoUrl: (data.photoUrl as string | undefined) ?? undefined,
          });
        } else {
          setForm((prev) => ({ ...prev, email: firebaseUser.email ?? prev.email }));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Impossible de charger votre profil.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // -------------------- HANDLERS --------------------
  const handleChange = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumericChange = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const parsedHeight = Number(form.heightCm);
      const parsedWeight = Number(form.weightKg);
      const parsedActivity = Number(form.nutritionActivityFactor);
      const parsedDelta = Number(form.nutritionTargetDeltaKcal);

      if (!Number.isFinite(parsedHeight) || parsedHeight <= 0) throw new Error("Merci de saisir une taille valide.");
      if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) throw new Error("Merci de saisir un poids valide.");
      if (!Number.isFinite(parsedActivity) || parsedActivity < 1.1) throw new Error("Merci de saisir un facteur d'activité valide.");
      if (!Number.isFinite(parsedDelta)) throw new Error("Merci de saisir un delta calorique valide.");
      if (form.trainingSessionsPerWeek < 2 || form.trainingSessionsPerWeek > 14)
        throw new Error("Le nombre de séances doit être compris entre 2 et 14.");

      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        sex: form.sex,
        birthDate: form.birthDate,
        heightCm: parsedHeight,
        weightKg: parsedWeight,
        "training.sessionsPerWeek": form.trainingSessionsPerWeek,
        "training.planType": form.trainingPlanType,
        "nutrition.goalCode": form.nutritionGoalCode,
        "nutrition.activityFactor": parsedActivity,
        "nutrition.targetDeltaKcal": parsedDelta,
        updatedAt: serverTimestamp(),
      });

      setSuccess("Profil mis à jour avec succès.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleChoosePhoto = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setUploadingPhoto(true);
    setError(null);
    setSuccess(null);

    try {
      const photoRef = ref(storage, `users/${userId}/profile-${Date.now()}`);
      await uploadBytes(photoRef, file);
      const url = await getDownloadURL(photoRef);
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { photoUrl: url, updatedAt: serverTimestamp() });
      setForm((prev) => ({ ...prev, photoUrl: url }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccess("Photo de profil mise à jour.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour la photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const heightHelper = useMemo(() => {
    const value = Number(form.heightCm);
    return Number.isFinite(value) && value > 0 ? `${(value / 100).toFixed(2)} m` : null;
  }, [form.heightCm]);

  if (loading) return <div><Nav /><div className="flex min-h-[60vh] items-center justify-center">Chargement du profil...</div></div>;

  // -------------------- JSX --------------------
  return (
    <div className="bg-[#F5F5F5] min-h-screen text-[#333333]">
      <Nav />
      <main className="mx-auto mt-10 w-[min(900px,92%)] rounded-3xl border border-black/5 bg-white/90 p-8 shadow-lg shadow-black/5 backdrop-blur">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#39393A]">Modifier le profil</h1>
            <p className="text-[#333333]/70">Mettez à jour vos informations personnelles.</p>
          </div>
          <button type="button" onClick={() => router.push("/profil")}
            className="rounded-xl border border-[#39393A]/30 px-4 py-2 text-sm font-semibold text-[#39393A] transition hover:bg-[#FCAB10]/10">
            Retour au profil
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-[#FCAB10] shadow ring-8 ring-white/70">
            {form.photoUrl ? <img src={form.photoUrl} alt="Profil" className="h-full w-full object-cover" /> :
              <div className="grid h-full w-full place-items-center text-[#39393A]">
                <svg viewBox="0 0 24 24" className="h-10 w-10">
                  <path fill="currentColor" d="M12 2a5 5 0 1 0 0 10a5 5 0 0 0 0-10ZM4 20.5C4 16.91 7.58 14 12 14s8 2.91 8 6.5V22H4z" />
                </svg>
              </div>}
          </div>
          <button type="button" onClick={handleChoosePhoto}
            className="rounded-lg border border-[#FCAB10] px-4 py-2 text-sm font-semibold text-[#39393A] transition hover:bg-[#FCAB10]/10"
            disabled={uploadingPhoto}>
            {uploadingPhoto ? "Envoi en cours..." : "Changer la photo"}
          </button>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        {success && <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">{success}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="col-span-full grid gap-4 md:grid-cols-2">
            <Field label="Prénom" value={form.firstName} onChange={handleChange("firstName")} required />
            <Field label="Nom" value={form.lastName} onChange={handleChange("lastName")} required />
            <Field label="Email" value={form.email} onChange={handleChange("email")} type="email" required readOnly />
            <SelectField label="Sexe" value={form.sex} onChange={handleChange("sex")}
              options={[{ label: "Homme", value: "M" }, { label: "Femme", value: "F" }, { label: "Autre", value: "Other" }, { label: "T-MAX 530", value: "T-MAX 530" }]} />
            <Field label="Date de naissance" value={form.birthDate} onChange={handleChange("birthDate")} type="date" />
            <Field label="Taille (cm)" value={form.heightCm} onChange={handleNumericChange("heightCm")} type="number" min={50} max={250}>
              {heightHelper && <span className="text-xs text-[#333333]/60">{heightHelper}</span>}
            </Field>
            <Field label="Poids (kg)" value={form.weightKg} onChange={handleNumericChange("weightKg")} type="number" min={30} max={250} />
          </div>

          <section className="col-span-full rounded-2xl border border-black/5 bg-white p-5">
            <h2 className="text-lg font-semibold text-[#39393A]">Entraînement</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Séances par semaine" value={String(form.trainingSessionsPerWeek)}
                onChange={(v) => setForm((prev) => ({ ...prev, trainingSessionsPerWeek: Number(v) }))}
                type="number" min={2} max={14} />
              <SelectField label="Type de programme" value={form.trainingPlanType}
                onChange={(v) => setForm((prev) => ({ ...prev, trainingPlanType: v as TrainingPlanType }))}
                options={[
                  { label: "Full Body", value: "FULL_BODY" },
                  { label: "Upper / Lower", value: "UPPER_LOWER" },
                  { label: "Split 4 jours", value: "SPLIT_4" },
                  { label: "Push Pull Legs", value: "PPL" },
                ]} />
            </div>
          </section>

          <section className="col-span-full rounded-2xl border border-black/5 bg-white p-5">
            <h2 className="text-lg font-semibold text-[#39393A]">Objectif nutrition</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SelectField label="Objectif" value={form.nutritionGoalCode}
                onChange={(v) => setForm((prev) => ({ ...prev, nutritionGoalCode: v as GoalCode }))}
                options={[
                  { label: "Prise de masse", value: "MASS_GAIN" },
                  { label: "Maintenance musculaire", value: "MUSCLE_MAINTAIN" },
                  { label: "Sèche", value: "CUTTING" },
                  { label: "Reprise en forme", value: "GET_BACK_IN_SHAPE" },
                ]} />
              <Field label="Facteur d'activité" value={form.nutritionActivityFactor}
                onChange={handleNumericChange("nutritionActivityFactor")} type="number" step="0.1" min={1.2} max={1.9} />
              <Field label="Delta calorique (kcal)" value={form.nutritionTargetDeltaKcal}
                onChange={handleNumericChange("nutritionTargetDeltaKcal")} type="number" step="50" />
            </div>
          </section>

          <div className="col-span-full flex justify-end">
            <button type="submit"
              className="inline-flex items-center rounded-xl bg-[#FCAB10] px-6 py-3 text-sm font-semibold text-white shadow hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#FCAB10]/60 focus:ring-offset-2 disabled:opacity-70"
              disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

// -------------------- FIELD & SELECTFIELD --------------------
type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  children?: React.ReactNode;
  min?: number;
  max?: number;
  step?: string;
  readOnly?: boolean;
};

function Field({ label, value, onChange, type = "text", required, children, min, max, step, readOnly }: FieldProps) {
  return (
    <label className="flex flex-col text-sm font-medium text-[#39393A]">
      <span className="mb-1">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        required={required} min={min} max={max} step={step} readOnly={readOnly} disabled={readOnly}
        className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm font-normal text-[#333333] outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)] disabled:bg-[#f0f0f0]" />
      {children}
    </label>
  );
}

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
};

function SelectField<T extends string>({ label, value, onChange, options }: SelectFieldProps<T>) {
  return (
    <label className="flex flex-col text-sm font-medium text-[#39393A]">
      <span className="mb-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}
        className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm font-normal text-[#333333] outline-none transition focus:border-[#FCAB10] focus:shadow-[0_0_0_3px_rgba(252,171,16,0.25)]">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
