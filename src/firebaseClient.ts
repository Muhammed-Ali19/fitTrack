// src/firebaseClient.ts

// Import des SDK Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// (optionnel) import { getAnalytics } from "firebase/analytics";

// ⚠️ Ces infos viennent de ton console Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCLSEPE4WLBLQ7dCHd4vs_43fg4AiSdJyo",
    authDomain: "fittrack-ab956.firebaseapp.com",
    projectId: "fittrack-ab956",
    storageBucket: "fittrack-ab956.firebasestorage.app",
    messagingSenderId: "928007886369",
    appId: "1:928007886369:web:95ff0e80a5fb1a289ab560",
    measurementId: "G-7TEGBXX1LZ"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);

// Exporte les services que tu veux utiliser
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const analytics = getAnalytics(app); // si besoin
