export const MEAL_STORAGE_KEY = "fittrack_meal";
export const MEAL_DAY_KEY = "fittrack_meal_day";

export function getCurrentDayKey(date: Date = new Date()): string {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

export function clearDailyMeals(dayKey = getCurrentDayKey()) {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(MEAL_STORAGE_KEY);
        localStorage.setItem(MEAL_DAY_KEY, dayKey);
    } catch {
        /* noop */
    }
}

export function ensureDailyMealsFresh(): boolean {
    if (typeof window === "undefined") return false;
    try {
        const today = getCurrentDayKey();
        const storedDay = localStorage.getItem(MEAL_DAY_KEY);
        if (storedDay !== today) {
            clearDailyMeals(today);
            return true;
        }
    } catch {
        clearDailyMeals();
        return true;
    }
    return false;
}

export function readDailyMeals<T = unknown>(): T[] {
    if (typeof window === "undefined") return [];
    if (ensureDailyMealsFresh()) return [];
    try {
        const raw = localStorage.getItem(MEAL_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
        clearDailyMeals();
        return [];
    }
}

export function writeDailyMeals<T = unknown>(meals: T[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify(meals));
        localStorage.setItem(MEAL_DAY_KEY, getCurrentDayKey());
    } catch {
        /* noop */
    }
}

export function getStoredDailyCalories(): number {
    const meals = readDailyMeals<Array<{ calories?: number }>>();
    return meals.reduce((total, meal) => total + (Number(meal?.calories) || 0), 0);
}
