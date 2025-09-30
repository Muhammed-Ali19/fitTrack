// firebaseClient.ts
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "XXX",
    authDomain: "XXX.firebaseapp.com",
    projectId: "XXX",
    appId: "XXX",
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// sign up + profil
export async function signUpAndCreateProfile({
                                                 email, password, firstName, lastName, sex, birthDate, heightCm
                                             }: any) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    await setDoc(doc(db, "users", uid), {
        email, firstName, lastName, sex, birthDate, heightCm,
        createdAt: serverTimestamp(),
        training: { sessionsPerWeek: 3, planType: "UPPER_LOWER" }, // valeur par défaut
        nutrition: {
            goalCode: "GET_BACK_IN_SHAPE",
            activityFactor: 1.4,
            targetDeltaKcal: 0,
            maintenanceKcal: null,
            targetKcal: null
        }
    });
    return uid;
}
