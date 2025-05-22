import React from "react";

interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  value: string;
  isHide: boolean;
}

interface Player {
  id: string;
  email: string;
  chips: number;
  hand?: Card[];
  isActive: boolean;
  isDealer: boolean;
  isTurn: boolean;
  hasFolded: boolean;
  currentBet: number;
  position: number;
}

interface PokerTableProps {
  players: Player[];
  communityCards: Card[];
  dealerPosition: number;
  currentTurn: string | null;
  currentUserId: string;
}

const PokerTable: React.FC<PokerTableProps> = ({
  players,
  communityCards,
  // dealerPosition,
  // currentTurn,
  currentUserId,
}) => {
  // Calculate positions for players around the table
  const getPlayerPositions = () => {
    // Improved positioning to prevent overlapping
    const tablePositions = [
      { top: "85%", left: "50%" }, // bottom center (current player)
      { top: "75%", left: "15%" }, // bottom left - moved further left
      { top: "40%", left: "5%" }, // middle left - moved further left
      { top: "15%", left: "25%" }, // top left - moved up and left
      { top: "15%", left: "75%" }, // top right - moved up and right
      { top: "40%", left: "95%" }, // middle right - moved further right
      { top: "75%", left: "85%" }, // bottom right - moved further right
    ];

    console.log("Community cards: ", communityCards);

    // Find the current player index
    const currentPlayerIndex = players.findIndex((p) => p.id === currentUserId);

    // Sort players so current player is at the bottom
    let sortedPlayers = [...players];
    if (currentPlayerIndex !== -1) {
      sortedPlayers = [
        players[currentPlayerIndex],
        ...players.slice(currentPlayerIndex + 1),
        ...players.slice(0, currentPlayerIndex),
      ];
    }

    // Assign positions
    return sortedPlayers.map((player, index) => {
      const position =
        index < tablePositions.length
          ? tablePositions[index]
          : tablePositions[index % tablePositions.length];

      return {
        ...player,
        tablePosition: position,
      };
    });
  };

  const positionedPlayers = getPlayerPositions();

  // Render a card
  const renderCard = (card: Card, index: number) => {
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

    return (
      <div
        key={`${card.value}-${card.suit}-${index}`}
        className="flex flex-col items-center justify-center w-10 m-1 bg-white border border-gray-300 rounded-md shadow-md h-14 md:h-20 md:w-14"
      >
        <span className="text-lg font-bold md:text-xl">{card.value}</span>
        <span className={`text-lg md:text-xl ${suitColors[card.suit]}`}>
          {suitSymbols[card.suit]}
        </span>
      </div>
    );
  };

  // Render a card back
  const renderCardBack = (key: string) => (
    <div
      key={key}
      className="flex items-center justify-center w-10 m-1 border-2 border-gray-300 rounded-md shadow-md h-14 md:h-20 md:w-14 bg-secondary"
    >
      <div className="h-[90%] w-[90%] border-2 border-gray-300 rounded-sm flex items-center justify-center">
        <span className="text-xl text-white">♠</span>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Table background - elliptical shape */}
      <div className="absolute w-[90%] h-[80%] bg-green-800 rounded-[50%] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl border-4 border-[#6b492d]"></div>

      {/* Community cards - made smaller to prevent overlap */}
      <div className="absolute z-10 flex flex-wrap justify-center transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
        {communityCards.length > 0 ? (
          communityCards.map((card, index) =>
            card.isHide ? renderCardBack(String(index)) : renderCard(card, index)
          )
        ) : (
          <div className="text-lg font-medium text-white">
            Waiting for cards...
          </div>
        )}
      </div>

      {/* Players */}
      {positionedPlayers.map((player) => (
        <div
          key={player.id}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 text-center ${
            player.isTurn ? "z-20" : "z-10"
          }`}
          style={{
            top: player.tablePosition.top,
            left: player.tablePosition.left,
          }}
        >
          <div
            className={`bg-white rounded-full p-2 shadow-md ${
              player.isTurn ? "ring-4 ring-accent animate-pulse" : ""
            } ${player.hasFolded ? "opacity-50" : ""}`}
          >
            <div className="font-bold text-sm truncate max-w-[120px]">
              {player.email}
            </div>
            <div className="text-xs">${player.chips}</div>

            {/* Player's cards - made slightly smaller */}
            <div className="flex justify-center mt-2">
              {player.id === currentUserId && player.hand ? (
                // Current player's cards - face up
                player.hand.map((card, index) => renderCard(card, index))
              ) : player.hand ? (
                // Other players' cards - face down
                [
                  renderCardBack(`${player.id}-card-1`),
                  renderCardBack(`${player.id}-card-2`),
                ]
              ) : (
                <div className="text-xs text-gray-500">No cards</div>
              )}
            </div>

            {/* Player's bet */}
            {player.currentBet > 0 && (
              <div className="px-2 py-1 mt-2 text-xs text-white rounded-full bg-accent">
                ${player.currentBet}
              </div>
            )}

            {/* Dealer button */}
            {player.isDealer && (
              <div className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold bg-white border-2 rounded-full -top-2 -right-2 text-primary border-primary">
                D
              </div>
            )}

            {/* Folded indicator */}
            {player.hasFolded && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                <span className="font-bold text-white">FOLD</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PokerTable;
