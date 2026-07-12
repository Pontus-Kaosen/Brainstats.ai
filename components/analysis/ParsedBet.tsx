type ParsedBetProps = {
    match: string;
    markets: string[];
  };
  
  export default function ParsedBet({
    match,
    markets,
  }: ParsedBetProps) {
    return (
      <div className="mt-8 rounded-2xl bg-[#101010] p-6">
        <h3 className="text-xl font-bold text-[#E8DCC8]">
          Identifierad spelidé
        </h3>
  
        <p className="mt-5">
          <strong>Match:</strong> {match}
        </p>
  
        <p className="mt-4 text-[#A9A9A9]">
          Marknader
        </p>
  
        <ul className="mt-2 space-y-2">
          {markets.map((market) => (
            <li key={market}>
              • {market}
            </li>
          ))}
        </ul>
      </div>
    );
  }