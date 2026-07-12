export function calculateScore(markets: string[]) {
    let score = 85;
  
    const count = markets.length;
  
    if (count === 0) score = 50;
    if (count === 1) score = 80;
    if (count === 2) score = 76;
    if (count >= 3) score = 68;
  
    return score;
  }