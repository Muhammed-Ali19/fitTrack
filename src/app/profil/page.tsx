import React from "react";
import Nav from "../components/Nav";

// --- Demo data (remplace avec tes vraies données ou props) ---
const user = {
    firstName: "Alexandre",
    lastName: "Durand",
    email: "alexandre@example.com",
    goal: "Perte de poids",
    dailyCalories: 2000,
    sex: "Homme",
};

// Small avatar
const Avatar: React.FC = () => (
    <div className="relative h-24 w-24 shrink-0 rounded-full bg-[#FCAB10] grid place-items-center shadow-md ring-8 ring-white/70">
        <svg viewBox="0 0 24 24" className="h-12 w-12 text-[#39393A]">
            <path fill="currentColor" d="M12 2a5 5 0 1 0 0 10a5 5 0 0 0 0-10ZM4 20.5C4 16.91 7.58 14 12 14s8 2.91 8 6.5V22H4z"/>
        </svg>
    </div>
);

const Field: React.FC<{label: string; value: React.ReactNode}> = ({label, value}) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-3">
        <div className="text-[#39393A]/70 font-medium">{label}</div>
        <div className="sm:col-span-2 text-[#39393A] font-semibold">{value}</div>
    </div>
);

const ProfileCard: React.FC = () => (
    <section className="mx-auto w-[min(1100px,92%)] mt-10">
        <div className="rounded-3xl bg-white/90 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/5 p-6 sm:p-10 relative overflow-hidden">
            {/* Soft highlight */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#FCAB10]/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[#FCAB10]/15 blur-3xl" />

            <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-10">
                <Avatar />
                <div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#39393A]">Page profil</h1>
                    <p className="text-[#39393A]/60 mt-1">Vos informations personnelles</p>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-black/5 bg-white p-5">
                    <Field label="Prénom" value={user.firstName} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="Nom" value={user.lastName} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="E-mail" value={<a className="underline underline-offset-2" href={`mailto:${user.email}`}>{user.email}</a>} />
                </div>

                <div className="rounded-2xl border border-black/5 bg-white p-5">
                    <Field label="Objectif" value={user.goal} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="Calories journalières" value={`${user.dailyCalories} kcal`} />
                    <div className="h-px bg-black/5 my-2" />
                    <Field label="Sexe" value={<span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FCAB10]/20 text-[#39393A] font-semibold">{user.sex}</span>} />
                </div>
            </div>

            <div className="mt-8 flex items-center justify-end">
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#FCAB10] px-5 py-3 text-[#39393A] font-semibold shadow hover:brightness-95 active:translate-y-px transition">
                    Modifier le profil
                </button>
            </div>
        </div>
    </section>
);

export default function ProfilePage() {
    return (
        <div className="">
            <Nav />

            <ProfileCard />

        </div>
    );
}
