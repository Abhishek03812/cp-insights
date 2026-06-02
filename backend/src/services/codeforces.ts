export class CodeforcesService {
  private static BASE_URL = "https://codeforces.com/api";

  static async getUserInfo(handle: string) {
    const res = await fetch(`${this.BASE_URL}/user.info?handles=${handle}`);
    const data = await res.json();
    if (data.status !== "OK") throw new Error("Codeforces API Error");
    return data.result[0];
  }

  static async getUserSubmissions(handle: string, limit = 1000) {
    const res = await fetch(`${this.BASE_URL}/user.status?handle=${handle}&from=1&count=${limit}`);
    const data = await res.json();
    if (data.status !== "OK") throw new Error("Codeforces API Error");
    return data.result;
  }

  static async getUserRatingHistory(handle: string) {
    const res = await fetch(`${this.BASE_URL}/user.rating?handle=${handle}`);
    const data = await res.json();
    if (data.status !== "OK") throw new Error("Codeforces API Error");
    return data.result;
  }
}
