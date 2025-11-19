"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type NavProps = {
    photoUrl?: string;
};

const NAV_LINKS = [
    { href: "/profil", label: "Profil" },
    { href: "/alimentation", label: "Alimentation" },
    { href: "/programme", label: "Programme" },
    { href: "/stats", label: "Mes Stats" },
];

const Nav: React.FC<NavProps> = ({ photoUrl }) => {
    const [autoPhotoUrl, setAutoPhotoUrl] = useState<string | undefined>(undefined);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (photoUrl) return;
        let isMounted = true;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!isMounted) return;
            if (!firebaseUser) {
                setAutoPhotoUrl(undefined);
                return;
            }

            const fallback = firebaseUser.photoURL ?? undefined;
            try {
                const snapshot = await getDoc(doc(db, "users", firebaseUser.uid));
                if (!isMounted) return;
                if (snapshot.exists()) {
                    const data = snapshot.data() as { photoUrl?: string };
                    setAutoPhotoUrl(data.photoUrl || fallback);
                } else {
                    setAutoPhotoUrl(fallback);
                }
            } catch {
                setAutoPhotoUrl(fallback);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [photoUrl]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const resolvedPhoto = photoUrl ?? autoPhotoUrl;

    return (
        <header className="relative z-10">
            <nav className="relative mx-auto mt-6 w-[90%] max-w-5xl rounded-2xl border border-black/5 bg-white/90 shadow-lg shadow-black/5 backdrop-blur">
                <div className="flex items-center justify-between px-6 py-3">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <img
                                src="/img/logo.png"
                                alt="FitTrack Logo"
                                style={{ width: "40px", height: "40px" }}
                            />
                        </Link>
                    </div>

                    {/* Liens de navigation */}
                    <ul className="hidden items-center gap-6 text-sm font-medium md:flex">
                        {NAV_LINKS.map((link) => (
                            <li key={link.href}>
                                <Link href={link.href} className="nav-link">
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Actions droite */}
                    <div className="flex items-center gap-3 md:pl-4">
                        <button
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/80 transition hover:border-[#FCAB10] md:hidden"
                            aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="mobile-navigation"
                            onClick={toggleMobileMenu}
                        >
                            <span aria-hidden="true" className="relative block h-5 w-5">
                                <span
                                    className={`absolute left-0 block h-0.5 w-full rounded-full bg-[#39393A] transition-all duration-200 ease-out ${
                                        isMobileMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                                    }`}
                                />
                                <span
                                    className={`absolute left-0 block h-0.5 w-full rounded-full bg-[#39393A] transition-all duration-200 ease-out ${
                                        isMobileMenuOpen ? "top-1/2 -translate-y-1/2 opacity-0" : "top-1/2 -translate-y-1/2 opacity-100"
                                    }`}
                                />
                                <span
                                    className={`absolute left-0 block h-0.5 w-full rounded-full bg-[#39393A] transition-all duration-200 ease-out ${
                                        isMobileMenuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                                    }`}
                                />
                            </span>
                        </button>

                        {/* Avatar profil */}
                        <div>
                            {resolvedPhoto ? (
                                <img
                                    src={resolvedPhoto}
                                    alt="Avatar"
                                    className="h-10 w-10 rounded-full object-cover border-2 border-[#FCAB10]"
                                />
                            ) : (
                                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#FCAB10] text-white font-bold">
                                    ?
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Menu mobile */}
                <div
                    id="mobile-navigation"
                    className={`border-t border-black/5 px-6 pb-4 ${isMobileMenuOpen ? "block md:hidden" : "hidden"}`}
                >
                    <ul className="flex flex-col gap-3 pt-4 text-sm font-medium">
                        {NAV_LINKS.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className="nav-link block rounded-xl border border-black/5 bg-white/90 px-4 py-2 text-center shadow-sm shadow-black/5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:shadow-md"
                                    onClick={closeMobileMenu}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            <style>{`
                .nav-link { color: #39393A; position: relative; }
                .nav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px; background: transparent; transition: background 200ms ease; }
                .nav-link:hover::after { background: #FCAB10; }
                @media (max-width: 767px) {
                    .nav-link::after { display: none; }
                }

                @keyframes floatBlob {
                    0%,100% { transform: translate(0,0) scale(1); }
                    50% { transform: translate(20px, -15px) scale(1.05); }
                }
            `}</style>
        </header>
    );
};

export default Nav;
