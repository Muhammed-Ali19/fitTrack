"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type UserProfile = { photoUrl?: string };

type UserContextType = {
    profile: UserProfile | null;
    setProfile: (p: UserProfile) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        try {
            const p = JSON.parse(localStorage.getItem("fittrack_user_profile") || "{}");
            setProfile(p);
        } catch { }
    }, []);

    useEffect(() => {
        if (profile) {
            localStorage.setItem("fittrack_user_profile", JSON.stringify(profile));
        }
    }, [profile]);

    return <UserContext.Provider value={{ profile, setProfile }}>{children}</UserContext.Provider>;
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used within UserProvider");
    return ctx;
}
