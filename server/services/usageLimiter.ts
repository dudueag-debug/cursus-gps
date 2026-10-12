/**
 * Quota and cost limiter for commercial map APIs (Google Routes, Mapbox)
 */
export class UsageLimiter {
  private static dailyGoogleQuota = 2500; // Daily maximum free/budget limit
  private static googleCallsToday = 0;
  private static lastResetDay = new Date().getUTCDate();

  private static checkReset() {
    const today = new Date().getUTCDate();
    if (today !== this.lastResetDay) {
      this.googleCallsToday = 0;
      this.lastResetDay = today;
    }
  }

  public static canUseCommercialApi(provider: 'google' | 'mapbox'): boolean {
    this.checkReset();
    if (provider === 'google') {
      return this.googleCallsToday < this.dailyGoogleQuota;
    }
    return true;
  }

  public static recordCommercialCall(provider: 'google' | 'mapbox') {
    this.checkReset();
    if (provider === 'google') {
      this.googleCallsToday++;
    }
  }

  public static getUsageStats() {
    this.checkReset();
    return {
      googleCallsToday: this.googleCallsToday,
      dailyGoogleQuota: this.dailyGoogleQuota,
      remainingGoogleCalls: Math.max(0, this.dailyGoogleQuota - this.googleCallsToday),
    };
  }
}
