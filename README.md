🏋️‍♂️ FitTrack – App Fitness Next.js

FitTrack est une application Next.js (App Router) dédiée au suivi fitness : calculs corporels (IMC/TDEE), nutrition & hydratation, plans d’entraînement, journal alimentaire, métriques physiques et statistiques interactives.

🛠️ Stack Technique

Next.js 15 + React 19

Tailwind CSS 4

Firebase Auth / Firestore / Storage

Chart.js

GSAP

Synchro locale via localStorage

Données utilisateur :
users/{uid} + sous-collections metrics, foodLogs/{day}/items, trainingLogs.

Authentification : email + Google.
Redirection automatique vers /connexion si non connecté.

UI : thème animé (nav + hero pattern).
Sources :
src/app/components/Nav.tsx, src/app/components/PatternV2.tsx, src/app/patternV2.css, src/app/globals.css.

📚 Navigation par Page
/ – Calculs corporels (src/app/page.tsx)

IMC / BMR / TDEE / % masse grasse / besoins hydriques

Sauvegarde des objectifs nutrition/hydratation/metrics → users/{uid}

Si non connecté, affichage d’un message.

/connexion – Login (src/app/connexion/page.tsx)

Email/Mot de passe ou Google

Redirection vers /profil

/inscription – Création de compte (src/app/inscription/page.tsx)

Données personnelles : taille, poids, sexe, date de naissance

Valeurs par défaut nutrition/training enregistrées en Firestore

/profil – Profil utilisateur (src/app/profil/page.tsx)

Identité, taille/poids, objectifs nutrition, séances/sem

Calories du repas du jour (localStorage)

Upload photo (Cloudinary)

Déconnexion

/modifierProfile – Édition du profil (src/app/modifierProfile/page.tsx)

Formulaire complet (profil + objectif + plan d’entraînement)

Upload photo vers Firebase Storage

/programme – Plan d’entraînement (src/app/programme/page.tsx)

Génération auto : Full body / Upper-Lower / Split 4j / PPL

Création manuelle possible

Sauvegarde locale + Firestore users/{uid}.training

Suivi de séance :

séries/reps/poids

calcul de volume

enregistrement dans trainingLogs

/alimentation – Journal alimentaire (src/app/alimentation/page.tsx)

Recherche via CalorieNinjas (/api/nutrition)

Portions ajustables

Macros/kcal + objectifs calories/eau

Sync localStorage + Firestore (foodLogs/{day}/items)

/metrics – Journal de métriques physiques (src/app/metrics/page.tsx)

Poids, IMC, tour de taille, sommeil, énergie

Graphiques 7/30 jours (Chart.js)

Édition & suppression (users/{uid}/metrics)

/stats – Statistiques (src/app/stats/page.tsx)

Courbes :

Évolution du poids (weightHistory)

Volume d’entraînement (trainingLogs)

Tableau des dernières séances éditables

Résumé physique

🧩 Composants transverses

Nav (menu + avatar)

Footer

PatternV2 (fond animé)

UserContext (cache local du profil)

Styles globaux : src/app/globals.css

🔧 APIs & Configuration
Firebase

Config : src/firebaseClient.ts

Règles Firestore : firestore.rules
→ Accès restreint au propriétaire

Nutrition (CalorieNinjas)

Route : /api/nutrition

Exige CALORIE_NINJAS_API_KEY dans .env.local

Debug : /api/nutrition/debug

Stockage repas du jour

Helpers dans src/lib/dailyMealStorage.ts

Clés : fittrack_meal, fittrack_meal_day

🚀 Démarrer en local
npm install
npm run dev
