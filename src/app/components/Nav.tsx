"use client";
import React from "react";
import Link from "next/link";

type NavProps = {
    photoUrl?: string;
};

const Nav: React.FC<NavProps> = ({ photoUrl }) => {
    return (
        <header className="relative z-10">
            <nav className="mx-auto mt-6 w-[90%] max-w-5xl rounded-2xl border border-black/5 bg-white/90 shadow-lg shadow-black/5 backdrop-blur">
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
                    <ul className="flex items-center gap-6 text-sm font-medium">
                        <li>
                            <Link href="/profil" className="nav-link">Profil</Link>
                        </li>
                        <li>
                            <Link href="/alimentation" className="nav-link">Alimentation</Link>
                        </li>
                        <li>
                            <Link href="/programme" className="nav-link">Programme</Link>
                        </li>
                    </ul>

                    {/* Avatar profil */}
                    <div className="ml-4">
                        {photoUrl ? (
                            <img
                                src={photoUrl}
                                alt="Avatar"
                                className="h-10 w-10 rounded-full object-cover border-2 border-[#FCAB10]"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-[#FCAB10] grid place-items-center text-white font-bold">
                                ?
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <style>{`
                .nav-link { color: #39393A; position: relative; }
                .nav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px; background: transparent; transition: background 200ms ease; }
                .nav-link:hover::after { background: #FCAB10; }

                @keyframes floatBlob {
                    0%,100% { transform: translate(0,0) scale(1); }
                    50% { transform: translate(20px, -15px) scale(1.05); }
                }
            `}</style>
        </header>
    );
};

export default Nav;
