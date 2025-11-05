import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const envKey = process.env.CALORIE_NINJAS_API_KEY || process.env.CALORIENINJAS_API_KEY;
    const headerKey = request.headers.get('x-dev-api-key');
    const usedKey = headerKey || envKey || null;

    const info: Record<string, unknown> = {
        hasEnvCALORIE_NINJAS_API_KEY: Boolean(process.env.CALORIE_NINJAS_API_KEY),
        hasEnvCALORIENINJAS_API_KEY: Boolean(process.env.CALORIENINJAS_API_KEY),
        hasHeaderKey: Boolean(headerKey),
        willUseKey: Boolean(usedKey),
    };

    if (!usedKey) return NextResponse.json({ ok: false, ...info, note: "Aucune clé détectée" }, { status: 200 });

    // Try a simple call
    try {
        const resp = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent('apple')}` ,{
            headers: { 'X-Api-Key': usedKey },
            cache: 'no-store'
        });
        let body: unknown = null;
        try { body = await resp.json(); } catch { body = await resp.text(); }
        return NextResponse.json({ ok: resp.ok, status: resp.status, ...info, sample: body }, { status: 200 });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ ok: false, ...info, error: message }, { status: 200 });
    }
}


