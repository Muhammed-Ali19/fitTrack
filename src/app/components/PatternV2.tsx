"use client";
import React from "react";
import "../patternV2.css"; // le fichier CSS juste en dessous


export default function PatternBackground() {
    return (
        <div
            aria-hidden
            className="pattern-container fixed top-0 left-0 w-screen h-screen -z-10"
        />

    );
}

