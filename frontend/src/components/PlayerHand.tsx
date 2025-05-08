import React from "react";

interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  value: string;
}

interface PlayerHandProps {
  cards: Card[];
}

const PlayerHand: React.FC<PlayerHandProps> = ({ cards }) => {
  const suitSymbols = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };

  const suitColors = {
    hearts: "text-red-600",
    diamonds: "text-red-600",
    clubs: "text-gray-900",
    spades: "text-gray-900",
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="flex justify-center">
        <div className="text-gray-500">Waiting for cards...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      {cards.map((card, index) => (
        <div
          key={`${card.value}-${card.suit}-${index}`}
          className="h-28 w-20 bg-white rounded-md shadow-lg m-1 flex flex-col items-center justify-center border border-gray-300 transition-transform hover:scale-110"
        >
          <div className="text-2xl font-bold">{card.value}</div>
          <div className={`text-4xl ${suitColors[card.suit]}`}>
            {suitSymbols[card.suit]}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerHand;
