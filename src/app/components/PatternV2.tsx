"use client";
import React, { useEffect, useState } from "react";
import "../../app/patternV2.css";

const PatternBackground: React.FC = () => {
    const [offsetY, setOffsetY] = useState<number>(0);

    useEffect(() => {
        const handleScroll = () => {
            setOffsetY(-window.scrollY * 0.5); // vitesse du parallax
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div
            className="pattern-container"

        />
    );
};

export default PatternBackground;
