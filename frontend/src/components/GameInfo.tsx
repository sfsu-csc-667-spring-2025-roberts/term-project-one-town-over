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

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex flex-wrap justify-between items-center">
      <div className="flex-1 min-w-[150px] mb-2 md:mb-0">
        <h2 className="text-lg font-bold mb-1">Game Info</h2>
        <div className="grid grid-cols-2 gap-x-4 text-sm">
          <div className="font-medium">Round:</div>
          <div>{formatRoundName(round)}</div>

          <div className="font-medium">Small Blind:</div>
          <div>${smallBlind}</div>

          <div className="font-medium">Big Blind:</div>
          <div>${bigBlind}</div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold text-accent">${pot}</div>
        <div className="text-sm text-gray-600">Current Pot</div>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-xl font-bold">${currentBet}</div>
        <div className="text-sm text-gray-600">Current Bet</div>
      </div>
    </div>
  );
};

export default GameInfo;
