export function calculateConfidence(markets: string[]) {
    const count = markets.length;
  
    if (count <= 1) return 84;
    if (count === 2) return 78;
  
    return 69;
  }