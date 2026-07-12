export function calculateRisk(markets: string[]) {
    const count = markets.length;
  
    if (count <= 1) return "Low";
    if (count === 2) return "Medium";
  
    return "High";
  }