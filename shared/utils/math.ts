export default class Math {
    static Clamp(val: number, low: number, high: number): number {
        if (val < low) val = low;
        if (val > high) val = high;
        return val;
    }
}