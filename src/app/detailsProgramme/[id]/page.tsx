"use client";
import React, { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import Link from "next/link";
import { db } from "@/firebaseClient";
import { doc, getDoc } from "firebase/firestore";

export default function DetailsProgrammePage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [programme, setProgramme] = useState<{ title: string; description: string; imageUrl: string } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const fetchProgramme = async () => {
            try {
                const ref = doc(db, "programmes", id);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const data = snap.data() as any;
                    setProgramme({
                        title: data.title ?? "Sans titre",
                        description: data.description ?? "",
                        imageUrl: data.imageUrl ?? "/img/image_muscu.png",
                    });
                    setError("");
                } else {
                    setProgramme(null);
                    setError("Programme introuvable");
                }
            } catch (e: any) {
                setError(e?.message || "Erreur lors du chargement du programme");
            } finally {
                setLoading(false);
            }
        };
        fetchProgramme();
    }, [id]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5] font-sans text-[#333333]">
            <Nav />
            <main className="min-h-screen p-8 flex flex-col items-center">
                <h1 className="text-4xl font-bold text-[#39393A] my-6">Détails séance</h1>

                <div className="max-w-3xl w-full bg-white shadow-lg rounded-xl p-6">
                    {loading && <div className="text-center text-gray-500">Chargement...</div>}
                    {!!error && (
                        <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 border border-red-200">{error}</div>
                    )}
                    {!loading && !error && !programme && (
                        <div className="text-center text-gray-500">Programme introuvable</div>
                    )}
                    {!loading && !error && programme && (
                        <>
                            <img
                                src={programme.imageUrl}
                                alt="Illustration de la séance"
                                className="w-full h-64 object-cover rounded-md mb-6"
                            />

                            <h2 className="text-2xl font-semibold text-[#39393A] mb-4">{programme.title}</h2>
                            <p className="text-lg text-gray-700 mb-4">{programme.description}</p>
                        </>
                    )}

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
