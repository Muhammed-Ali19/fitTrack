import { NextResponse } from "next/server";

// Helper to split user free text into ingredient lines for Edamam
function splitIntoIngredients(input: string): string[] {
    const normalized = input
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    // Split on commas or common conjunctions (fr/en)
    const parts = normalized
        .split(/,|\bet\b|\band\b|\+|\&/g)
        .map(s => s.trim())
        .filter(Boolean);
    return parts.length > 0 ? parts : [normalized];
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query || !query.trim()) {
        return NextResponse.json({ error: "Paramètre 'query' requis" }, { status: 400 });
    }

    const appId = process.env.EDAMAM_APP_ID;
    const appKey = process.env.EDAMAM_APP_KEY;
    if (!appId || !appKey) {
        return NextResponse.json({ error: "Variables EDAMAM_APP_ID/EDAMAM_APP_KEY manquantes" }, { status: 500 });
    }

    const ingredients = splitIntoIngredients(query);

    try {
        // Call Edamam per ingredient to get a per-item breakdown to match UI expectations
        const results = await Promise.all(
            ingredients.map(async (ingr) => {
                const url = new URL("https://api.edamam.com/api/nutrition-data");
                url.searchParams.set("app_id", appId);
                url.searchParams.set("app_key", appKey);
                url.searchParams.set("nutrition-type", "cooking");
                url.searchParams.set("ingr", ingr);

                const resp = await fetch(url.toString(), { cache: "no-store" });
                if (!resp.ok) {
                    const text = await resp.text();
                    throw new Error(`Erreur Edamam pour '${ingr}': ${text}`);
                }
                const data = await resp.json();

                const nutrients = data?.totalNutrients || {};
                return {
                    name: ingr,
                    serving_size_g: Math.round(data?.totalWeight ?? 0),
                    calories: Math.round(data?.calories ?? 0),
                    fat_total_g: Number((nutrients?.FAT?.quantity ?? 0).toFixed(1)),
                    fat_saturated_g: Number((nutrients?.FASAT?.quantity ?? 0).toFixed(1)),
                    cholesterol_mg: Math.round(nutrients?.CHOLE?.quantity ?? 0),
                    sodium_mg: Math.round(nutrients?.NA?.quantity ?? 0),
                    carbohydrates_total_g: Number((nutrients?.CHOCDF?.quantity ?? 0).toFixed(1)),
                    fiber_g: Number((nutrients?.FIBTG?.quantity ?? 0).toFixed(1)),
                    sugar_g: Number((nutrients?.SUGAR?.quantity ?? 0).toFixed(1)),
                    protein_g: Number((nutrients?.PROCNT?.quantity ?? 0).toFixed(1)),
                };
            })
        );

        return NextResponse.json({ items: results });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}


