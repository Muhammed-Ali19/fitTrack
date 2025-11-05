import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    console.log("=== DEBUG API ===");
    console.log("Query reçue:", query);

    const normalized = (query || "").replace(/\s+/g, " ").trim();
    const translated = translateFrenchToEnglish(normalized);
    if (!normalized) {
        console.log("❌ Query vide");
        return NextResponse.json({ error: "Paramètre 'query' requis" }, { status: 400 });
    }

    const envKey = process.env.CALORIE_NINJAS_API_KEY || process.env.CALORIENINJAS_API_KEY;
    const headerKey = process.env.NODE_ENV !== 'production' ? request.headers.get('x-dev-api-key') : null;
    const apiKey = envKey || headerKey || undefined;
    console.log("API Key présente?", !!apiKey);
    console.log("API Key (env) longueur:", envKey?.length);

    if (!apiKey) {
        console.log("❌ API Key manquante");
        return NextResponse.json({ error: "Clé API manquante", details: "Définissez CALORIE_NINJAS_API_KEY (ou CALORIENINJAS_API_KEY) dans .env.local et redémarrez. En dev, vous pouvez aussi envoyer l'en-tête x-dev-api-key." }, { status: 500 });
    }

    try {
        const url = `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(translated)}`;
        console.log("URL appelée:", url);

        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Api-Key': apiKey,
            },
            cache: "no-store"
        });

        console.log("Status reçu:", resp.status);

        const text = await resp.text();
        console.log("Réponse brute:", text);

        if (!resp.ok) {
            console.log("❌ Erreur de l'API externe");
            // Si clé invalide/forbidden, tenter API Ninjas (migration CalorieNinjas)
            if (resp.status === 401 || resp.status === 403) {
                console.log("Tentative avec API Ninjas...");
                const alt = await fetch(
                    `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(translated)}`,
                    { headers: { 'X-Api-Key': apiKey }, cache: 'no-store' }
                );
                const altText = await alt.text();
                console.log("Status API Ninjas:", alt.status);
                console.log("Réponse API Ninjas brute:", altText);
                if (alt.ok) {
                    let altJson: unknown = [];
                    try { altJson = JSON.parse(altText); } catch {}
                    // Normaliser vers { items }
                    return NextResponse.json({ items: Array.isArray(altJson) ? altJson : [] });
                }
                return NextResponse.json(
                    { error: "Erreur API Ninjas", details: altText, status: alt.status },
                    { status: alt.status }
                );
            }
            // Requêtes invalides (400) ou autres: renvoyer détails
            return NextResponse.json(
                { error: "Erreur CalorieNinjas", details: text, status: resp.status },
                { status: resp.status }
            );
        }

        const data = JSON.parse(text);
        console.log("✅ Données parsées:", data);

        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        console.log("❌ Exception:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// --- Helpers ---
function stripDiacritics(input: string): string {
    return input
        .normalize('NFD')
        .replace(/\p{Diacritic}+/gu, '')
        .replace(/œ/g, 'oe')
        .replace(/Œ/g, 'Oe');
}

function translateFrenchToEnglish(input: string): string {
    // Basic, deterministic FR->EN replacements for common foods/units; preserves quantities
    const s = ' ' + stripDiacritics(input.toLowerCase()) + ' ';
    const replacements: Array<[RegExp, string]> = [
        [/\bpommes? de terre\b/g, 'potato'],
        [/\bpommes?\b/g, 'apple'],
        [/\bbananes?\b/g, 'banana'],
        [/\briz\b/g, 'rice'],
        [/\bpoulets?\b/g, 'chicken'],
        [/\bboeuf\b/g, 'beef'],
        [/\bporc\b/g, 'pork'],
        [/\bsaumon\b/g, 'salmon'],
        [/\bthon\b/g, 'tuna'],
        [/\bavocats?\b/g, 'avocado'],
        [/\byaourts?\b/g, 'yogurt'],
        [/\bamandes?\b/g, 'almonds'],
        [/\boeufs?\b/g, 'egg'],
        [/\bomelettes?\b/g, 'omelette'],
        [/\bpates?\b/g, 'pasta'],
        [/\bpain\b/g, 'bread'],
        [/\bfromage\b/g, 'cheese'],
        [/\blait\b/g, 'milk'],
        [/\btomates?\b/g, 'tomato'],
        [/\bcarottes?\b/g, 'carrot'],
        [/\bhuile\b/g, 'oil'],
        [/\bbeurre\b/g, 'butter'],
        [/\bsucre\b/g, 'sugar'],
        [/\bsel\b/g, 'salt'],
        // units
        [/\bgrammes?\b/g, 'g'],
        [/\bg\b/g, 'g'],
        [/\bmillilitres?\b/g, 'ml'],
        [/\bml\b/g, 'ml'],
        [/\bl\b/g, 'l'],
        // connectors
        [/\bet\b/g, ' and '],
    ];
    let out = s;
    for (const [rx, rep] of replacements) {
        out = out.replace(rx, rep);
    }
    return out.trim().replace(/\s+/g, ' ');
}