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
import React, { useState } from "react";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

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
        <>

            <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] font-sans text-[#333333]">
                <Nav />
                <main className="min-h-screen p-8 font-sans bg[#F5FF5F5] flex flex-col items-center">


                    {/* Titre */}
                    <h1 className="text-4xl font-bold text-gray-800 my-6">Page séances</h1>

                    {/* Formulaire */}
                </main>

                <Footer />
            </div>

        </>

    );


}
