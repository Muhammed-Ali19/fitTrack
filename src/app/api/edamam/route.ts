import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();

    if (!query) {
        return new Response(JSON.stringify({ error: "Missing query" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const appId = process.env.EDAMAM_APP_ID;
    const appKey = process.env.EDAMAM_APP_KEY;

    // If Edamam credentials are missing, fallback to Open Food Facts (public API)
    if (!appId || !appKey) {
        try {
            const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
                query
            )}&search_simple=1&action=process&json=1&page_size=20`;
            const res = await fetch(offUrl, { next: { revalidate: 60 } });
            if (!res.ok) {
                const text = await res.text();
                return new Response(JSON.stringify({ error: "OFF error", details: text }), {
                    status: 502,
                    headers: { "Content-Type": "application/json" },
                });
            }
            const data = await res.json();
            const items = (data?.products ?? []).map((p: any) => {
                const nutriments = p?.nutriments ?? {};
                return {
                    id: p.id || p._id || p.code,
                    label: p.product_name || p.generic_name || p.brands || "Inconnu",
                    image: p.image_small_url || p.image_url || null,
                    nutrients: {
                        calories: nutriments["energy-kcal_100g"] ?? null,
                        protein: nutriments["proteins_100g"] ?? null,
                        fat: nutriments["fat_100g"] ?? null,
                        carbs: nutriments["carbohydrates_100g"] ?? null,
                    },
                };
            });
            return new Response(JSON.stringify({ items, source: "open-food-facts" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    }

    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${encodeURIComponent(
        appId
    )}&app_key=${encodeURIComponent(appKey)}&ingr=${encodeURIComponent(query)}&nutrition-type=logging`;

    try {
        const res = await fetch(url, { next: { revalidate: 60 } });
        if (!res.ok) {
            const text = await res.text();
            return new Response(JSON.stringify({ error: "Edamam error", details: text }), {
                status: 502,
                headers: { "Content-Type": "application/json" },
            });
        }
        const data = await res.json();

        // Normalize minimal fields for UI consumption
        const items = (data?.hints ?? []).map((h: any) => {
            const f = h.food ?? {};
            return {
                id: f.foodId,
                label: f.label,
                image: f.image,
                nutrients: {
                    calories: f.nutrients?.ENERC_KCAL ?? null,
                    protein: f.nutrients?.PROCNT ?? null,
                    fat: f.nutrients?.FAT ?? null,
                    carbs: f.nutrients?.CHOCDF ?? null,
                },
            };
        });

        return new Response(JSON.stringify({ items, source: "edamam" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
