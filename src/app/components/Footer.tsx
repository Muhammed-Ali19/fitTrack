"use client";
import React from "react";
import Link from "next/link";

const Footer = () => {
    return (
        <footer className="relative z-10 pb-8">
            <div className="mx-auto px-4 mt-16 w-full max-w-5xl 
        rounded-xl border border-white/10 
        bg-white/10 backdrop-blur-xl 
        pt-8 text-center text-sm text-white/80">
                &copy; {new Date().getFullYear()} FitTrack. Tous droits réservés.
            </div>
        </footer>

    );
}

export default Footer;
