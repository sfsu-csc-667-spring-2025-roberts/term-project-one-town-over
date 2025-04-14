import React from "react";

interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  value: string;
}

interface Player {
  id: string;
  username: string;
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
  dealerPosition,
  currentTurn,
  currentUserId,
}) => {
  // Calculate positions for players around the table
  const getPlayerPositions = () => {
    const tablePositions = [
      { top: "85%", left: "50%" }, // bottom center (current player)
      { top: "70%", left: "20%" }, // bottom left
      { top: "30%", left: "10%" }, // middle left
      { top: "10%", left: "30%" }, // top left
      { top: "10%", left: "70%" }, // top right
      { top: "30%", left: "90%" }, // middle right
      { top: "70%", left: "80%" }, // bottom right
    ];

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
        className="h-16 w-12 md:h-24 md:w-16 bg-white rounded-md shadow-md m-1 flex flex-col items-center justify-center border border-gray-300"
      >
        <span className="text-lg md:text-2xl font-bold">{card.value}</span>
        <span className={`text-lg md:text-2xl ${suitColors[card.suit]}`}>
          {suitSymbols[card.suit]}
        </span>
      </div>
    );
  };

  // Render a card back
  const renderCardBack = (key: string) => (
    <div
      key={key}
      className="h-16 w-12 md:h-24 md:w-16 bg-secondary rounded-md shadow-md m-1 flex items-center justify-center border-2 border-gray-300"
    >
      <div className="h-[90%] w-[90%] border-2 border-gray-300 rounded-sm flex items-center justify-center">
        <span className="text-white text-2xl">♠</span>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full relative">
      {/* Community cards */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-wrap justify-center">
        {communityCards.length > 0 ? (
          communityCards.map((card, index) => renderCard(card, index))
        ) : (
          <div className="text-white text-lg font-medium">
            Waiting for cards...
          </div>
        )}
      </div>

      {/* Players */}
      {positionedPlayers.map((player) => (
        <div
          key={player.id}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 text-center ${
            player.isTurn ? "z-10" : "z-0"
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
              {player.username}
            </div>
            <div className="text-xs">${player.chips}</div>

            {/* Player's cards */}
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
              <div className="mt-2 bg-accent text-white px-2 py-1 rounded-full text-xs">
                ${player.currentBet}
              </div>
            )}

            {/* Dealer button */}
            {player.isDealer && (
              <div className="absolute -top-2 -right-2 bg-white text-primary font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-primary text-xs">
                D
              </div>
            )}

            {/* Folded indicator */}
            {player.hasFolded && (
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">FOLD</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PokerTable;
