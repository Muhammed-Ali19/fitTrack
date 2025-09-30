"use client";
import React from "react";
import Link from "next/link";


const Footer = () => {
    return (
        <footer className="relative z-10 pb-8">
            <div className="mx-auto mt-16 w-full max-w-5xl border-t border-black/10 pt-8 text-center text-sm text-[#333333]/60">
                &copy; {new Date().getFullYear()} FitTrack. Tous droits réservés.
            </div>
        </footer>
    );
}

export default Footer;