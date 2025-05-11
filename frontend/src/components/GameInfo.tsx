import React from "react";

interface GameInfoProps {
  pot: number;
  round: "pre-flop" | "flop" | "turn" | "river" | "showdown";
  smallBlind: number;
  bigBlind: number;
  currentBet: number;
}

const GameInfo: React.FC<GameInfoProps> = ({
  pot,
  round,
  smallBlind,
  bigBlind,
  currentBet,
}) => {
  // Format the round name for display
  const formatRoundName = (round: string) => {
    return round
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const rounds = ["pre-flop", "flop", "turn", "river", "showdown"];
  const currentRoundIndex = rounds.indexOf(round);

  return (
    <div className="p-4 mb-4 rounded-lg shadow-md bg-gradient-to-r from-primary/10 to-secondary/10">
      {/* Progress indicator - moved to top and made more visible */}
      <div className="flex items-center justify-between px-2 mb-4 md:px-8 lg:px-16 xl:px-32">
        {rounds.map((r, index) => (
          <React.Fragment key={r}>
            <div className="flex flex-col items-center">
              <div
                className={`h-4 w-4 rounded-full ${
                  index <= currentRoundIndex ? "bg-accent" : "bg-gray-300"
                } 
                ${round === r ? "ring-2 ring-offset-2 ring-accent" : ""}`}
              ></div>
              <span
                className={`text-xs mt-1 ${
                  round === r ? "font-bold text-accent" : "text-gray-600"
                }`}
              >
                {formatRoundName(r)}
              </span>
            </div>
            {index < rounds.length - 1 && (
              <div
                className={`h-1 flex-1 mx-1 ${
                  index < currentRoundIndex ? "bg-accent" : "bg-gray-300"
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Main content - restructured for better wide layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Game info */}
        <div className="p-3 rounded-md shadow-sm bg-white/80">
          <h2 className="mb-2 text-lg font-bold text-primary">Round Info</h2>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <span className="font-medium">Current:</span>
            <span className="bg-primary/20 px-2 py-0.5 rounded-full text-center">
              {formatRoundName(round)}
            </span>

            <span className="font-medium">Small Blind:</span>
            <span>${smallBlind}</span>

            <span className="font-medium">Big Blind:</span>
            <span>${bigBlind}</span>
          </div>
        </div>

        {/* Pot */}
        <div className="flex flex-col items-center justify-center bg-white/80 rounded-md p-4 shadow-sm border-2 border-accent min-h-[100px]">
          <div className="text-3xl font-bold text-accent">${pot}</div>
          <div className="mt-1 text-lg font-medium">CURRENT POT</div>
        </div>

        {/* Current Bet */}
        <div className="flex flex-col items-center justify-center bg-white/80 rounded-md p-4 shadow-sm min-h-[100px]">
          <div className="text-2xl font-bold">${currentBet}</div>
          <div className="mt-1 text-lg font-medium">CURRENT BET</div>
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
