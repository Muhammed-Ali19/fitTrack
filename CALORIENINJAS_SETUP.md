Edamam Nutrition API setup

1) Get credentials
- Create an account and application on Edamam: https://www.edamam.com/
- Obtain your APP ID and APP KEY for the Nutrition Analysis API.

2) Create `.env.local`
- In the project root, create a file named `.env.local` with:

```
EDAMAM_APP_ID=your_app_id
EDAMAM_APP_KEY=your_app_key
```

3) Restart dev server
- Restart `next dev` so the env vars are picked up.

Notes
- Keys are used server-side via `src/app/api/nutrition/route.ts` and are never exposed to the client.


