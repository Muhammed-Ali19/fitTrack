"use client";
import React from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Link from "next/link";

const imageUrl = "img/image_muscu.png"; // Exemple d'URL d'image

export default function SeancesPage() {
    return (


        <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] font-sans text-[#333333]">
            <Nav />
            <main className="min-h-screen p-8 flex flex-col items-center">
                <h1 className="text-4xl font-bold text-[#39393A] my-6">Détails séance</h1>

                <div className="max-w-3xl w-full bg-white shadow-lg rounded-xl p-6">
                    <img
                        src={imageUrl}
                        alt="Illustration de la séance"
                        className="w-full h-64 object-cover rounded-md mb-6"
                    />

                    <h2 className="text-2xl font-semibold text-[#39393A] mb-4">Séance 1 : Cardio</h2>
                    <p className="text-lg text-gray-700 mb-4">
                        Cette séance est axée sur le cardio avec une intensité progressive.
                        Elle dure environ 30 minutes et permet d'améliorer ton endurance
                        tout en brûlant des calories efficacement.
                    </p>

                    <h3 className="text-xl font-bold text-[#39393A] mb-2">Programme :</h3>
                    <ul className="list-disc list-inside text-gray-700 mb-6">
                        <li>Échauffement – 5 minutes</li>
                        <li>Course fractionnée – 10 minutes</li>
                        <li>Burpees + Jumping Jacks – 10 minutes</li>
                        <li>Étirements – 5 minutes</li>
                    </ul>

                    <div className="mt-6 flex gap-4">
                        <Link
                            href="/programme"
                            className="bg-gray-300 text-[#39393A] px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                        >
                            Retour
                        </Link>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}