export class IntelligenceEngine {
  
  /**
   * Predicts future rating using an Exponential Moving Average (EMA) and 
   * Simple Linear Regression over recent contest rating changes.
   */
  static predictRating(contestHistory: { rating: number; timestamp: number }[]) {
    if (!contestHistory || contestHistory.length === 0) {
      return { predictedRating1Mo: 0, predictedRating3Mo: 0, confidence: 0 };
    }
    if (contestHistory.length < 3) {
      const current = contestHistory[contestHistory.length - 1].rating;
      return { predictedRating1Mo: current, predictedRating3Mo: current, confidence: 10 };
    }

    // Sort chronologically
    const sorted = [...contestHistory].sort((a, b) => a.timestamp - b.timestamp);
    const ratings = sorted.map(c => c.rating);
    const n = ratings.length;

    // 1. Exponential Moving Average for Baseline
    const alpha = 2 / (n + 1);
    let ema = ratings[0];
    for (let i = 1; i < n; i++) {
      ema = (ratings[i] * alpha) + (ema * (1 - alpha));
    }

    // 2. Simple Linear Regression (y = mx + b)
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += ratings[i];
      sumXY += i * ratings[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Assume 4 contests per month on average
    const projected1Month = Math.round(ema + slope * 4);
    const projected3Month = Math.round(ema + slope * 12);

    // Calculate Variance for Confidence Interval
    let variance = 0;
    for (let i = 0; i < n; i++) {
      const diff = ratings[i] - ema;
      variance += diff * diff;
    }
    const stdDev = Math.sqrt(variance / n);
    const confidence = Math.max(10, 100 - (stdDev / 10)); // Heuristic confidence

    return {
      predictedRating1Mo: projected1Month,
      predictedRating3Mo: projected3Month,
      confidence: Math.min(100, Math.round(confidence))
    };
  }

  /**
   * Generates a personalized daily practice plan based on weak and strong topics.
   * Employs Rule-based heuristics.
   */
  static generateDailyPlan(weakTopics: string[], strongTopics: string[], currentRating: number) {
    // Determine target difficulties
    const easyTarget = Math.max(800, currentRating - 200);
    const mediumTarget = currentRating;
    const hardTarget = currentRating + 200;

    const plan = {
      day1: [] as any[],
      day2: [] as any[],
      day3: [] as any[]
    };

    // If user has weak topics, focus heavily on them.
    if (weakTopics.length > 0) {
      plan.day1 = [
        { topic: weakTopics[0], difficulty: easyTarget, count: 2, label: 'Strengthen Fundamentals' },
        { topic: weakTopics[0], difficulty: mediumTarget, count: 1, label: 'Push Limits' }
      ];
      
      if (weakTopics.length > 1) {
        plan.day2 = [
          { topic: weakTopics[1], difficulty: easyTarget, count: 1, label: 'Warmup' },
          { topic: weakTopics[1], difficulty: mediumTarget, count: 2, label: 'Core Practice' }
        ];
      } else {
        plan.day2 = [
          { topic: weakTopics[0], difficulty: hardTarget, count: 1, label: 'Challenge Problem' },
          { topic: strongTopics[0] || 'Random', difficulty: mediumTarget, count: 1, label: 'Maintenance' }
        ];
      }
    } else {
      // General Improvement Plan
      plan.day1 = [
        { topic: 'Dynamic Programming', difficulty: mediumTarget, count: 2, label: 'Core Practice' }
      ];
      plan.day2 = [
        { topic: 'Graphs', difficulty: hardTarget, count: 1, label: 'Challenge' }
      ];
    }

    plan.day3 = [
      { topic: 'Virtual Contest', difficulty: currentRating, count: 4, label: 'Simulation' }
    ];

    return plan;
  }
}
