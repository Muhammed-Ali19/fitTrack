"use client";
import React, { useState } from "react";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function ConnexionPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logique de connexion ici
        console.log("Email:", email);
        console.log("Password:", password);
    };

    return (
        <>
            <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] font-sans text-[#333333]">

                <Nav />
                <main className="min-h-screen  p-8 font-sans flex flex-col items-center">


                    {/* FORMULAIRE DE CONNEXION */}
                    <section className="mt-12 w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                            </div>
                            <button type="submit" style={{ backgroundColor: "#FCAB10" }} className="mt-6 w-full rounded-md  px-4 py-2 text-white font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                                Se connecter
                            </button>
                            <a href="/inscription">Vous n'avez pas de compte ? Inscrivez-vous</a>
                        </form>
                    </section>
                    <Footer />
                </main>
            </div>


        </>

    );
}
