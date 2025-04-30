import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

// Components for the game
import PokerTable from "../components/PokerTable";
import PlayerHand from "../components/PlayerHand";
import ChatBox from "../components/ChatBox";
import BettingControls from "../components/BettingControls";
import GameInfo from "../components/GameInfo";

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

interface GameState {
  id: string;
  name: string;
  status: "waiting" | "playing" | "ended";
  players: Player[];
  pot: number;
  currentBet: number;
  communityCards: Card[];
  dealerPosition: number;
  currentTurn: string | null;
  round: "pre-flop" | "flop" | "turn" | "river" | "showdown";
  winner: string | null;
  smallBlind: number;
  bigBlind: number;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
}

const initialGameState: GameState = {
  id: "",
  name: "",
  status: "waiting",
  players: [],
  pot: 0,
  currentBet: 0,
  communityCards: [],
  dealerPosition: 0,
  currentTurn: null,
  round: "pre-flop",
  winner: null,
  smallBlind: 5,
  bigBlind: 10,
};

const GameRoom: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState<GameState>(initialGameState);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Connect to socket.io server and initialize the game
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io();

    // Join the game room
    socketRef.current.emit("join-game", { gameId, userId: user?.id });

    // Listen for game state updates
    socketRef.current.on("game-state-update", (gameState: GameState) => {
      setGame(gameState);

      // Find the current player in the updated game state
      const player = gameState.players.find((p) => p.id === user?.id);
      if (player) {
        setCurrentPlayer(player);
      }
    });

    // Listen for chat messages
    socketRef.current.on("game-chat-message", (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    // Listen for game errors
    socketRef.current.on("game-error", (error: any) => {
      toast.error(error.message || "An error occurred in the game");
    });

    // Listen for game notifications
    socketRef.current.on("game-notification", (notification: any) => {
      toast.info(notification.message);
    });

    // Cleanup on unmount
    return () => {
      socketRef.current?.emit("leave-game", { gameId, userId: user?.id });
      socketRef.current?.disconnect();
    };
  }, [gameId, user?.id]);

  // Fetch initial game data
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setIsLoading(true);
        // Fetch game data
        const gameResponse = await axios.get(`/api/games/${gameId}`);
        setGame(gameResponse.data.game || initialGameState);

        // Find the current player
        const player = gameResponse.data.game.players.find(
          (p: Player) => p.id === user?.id
        );
        if (player) {
          setCurrentPlayer(player);
        }

        // Fetch chat messages
        const chatResponse = await axios.get(`/api/chat/game/${gameId}`);
        setChatMessages(chatResponse.data.messages || []);
      } catch (error) {
        console.error("Error fetching game data:", error);
        toast.error("Failed to load the game");

        // For demo purposes, let's set mock data
        const mockGame: GameState = {
          id: gameId || "1",
          name: "Jack's Game",
          status: "playing",
          players: [
            {
              id: "1",
              username: "jackrichards",
              chips: 1000,
              isActive: true,
              isDealer: true,
              isTurn: false,
              hasFolded: false,
              currentBet: 10,
              position: 0,
              hand: [
                { suit: "hearts" as const, value: "A" },
                { suit: "diamonds" as const, value: "K" },
              ],
            },
            {
              id: "2",
              username: "hebertrujillo",
              chips: 950,
              isActive: true,
              isDealer: false,
              isTurn: true,
              hasFolded: false,
              currentBet: 5,
              position: 1,
            },
            {
              id: "3",
              username: "nathandonat",
              chips: 1200,
              isActive: true,
              isDealer: false,
              isTurn: false,
              hasFolded: false,
              currentBet: 0,
              position: 2,
            },
          ],
          pot: 15,
          currentBet: 10,
          communityCards: [
            { suit: "clubs" as const, value: "10" },
            { suit: "hearts" as const, value: "J" },
            { suit: "spades" as const, value: "Q" },
          ],
          dealerPosition: 0,
          currentTurn: "2",
          round: "flop",
          winner: null,
          smallBlind: 5,
          bigBlind: 10,
        };

        setGame(mockGame);

        // Set current player for demo
        const mockCurrentPlayer: Player = {
          id: user?.id || "1",
          username: user?.username || "You",
          chips: 1000,
          isActive: true,
          isDealer: true,
          isTurn: false,
          hasFolded: false,
          currentBet: 10,
          position: 0,
          hand: [
            { suit: "hearts" as const, value: "A" },
            { suit: "diamonds" as const, value: "K" },
          ],
        };

        setCurrentPlayer(mockCurrentPlayer);

        // Set mock chat messages
        setChatMessages([
          {
            id: "1",
            user: "hebertrujillo",
            message: "Good luck everyone!",
            timestamp: new Date().toISOString(),
          },
          {
            id: "2",
            user: "nathandonat",
            message: "Let's play!",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, user?.id]);

  // Game actions
  const handleBet = (amount: number) => {
    socketRef.current?.emit("player-action", {
      gameId,
      userId: user?.id,
      action: "bet",
      amount,
    });
  };

  const handleCall = () => {
    socketRef.current?.emit("player-action", {
      gameId,
      userId: user?.id,
      action: "call",
    });
  };

  const handleCheck = () => {
    socketRef.current?.emit("player-action", {
      gameId,
      userId: user?.id,
      action: "check",
    });
  };

  const handleFold = () => {
    socketRef.current?.emit("player-action", {
      gameId,
      userId: user?.id,
      action: "fold",
    });
  };

  const handleRaise = (amount: number) => {
    socketRef.current?.emit("player-action", {
      gameId,
      userId: user?.id,
      action: "raise",
      amount,
    });
  };

  const handleLeaveGame = () => {
    socketRef.current?.emit("leave-game", { gameId, userId: user?.id });
    navigate("/lobby");
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    const chatMessage = {
      id: Date.now().toString(),
      user: user?.username || "Anonymous",
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    socketRef.current?.emit("send-game-chat", {
      gameId,
      message: chatMessage,
    });

    // Optimistically add to our local state
    setChatMessages((prev) => [...prev, chatMessage]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{game.name}</h1>
        <button onClick={handleLeaveGame} className="btn btn-secondary">
          Leave Game
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Game main area */}
        <div className="w-full lg:w-3/4">
          <div className="relative w-full">
            {/* Game state information */}
            <GameInfo
              pot={game.pot}
              round={game.round}
              smallBlind={game.smallBlind}
              bigBlind={game.bigBlind}
              currentBet={game.currentBet}
            />

            {/* Game table */}
            <div className="table-card min-h-[500px] p-8 flex flex-col items-center justify-center relative mb-6">
              <PokerTable
                players={game.players}
                communityCards={game.communityCards}
                dealerPosition={game.dealerPosition}
                currentTurn={game.currentTurn}
                currentUserId={user?.id || ""}
              />
            </div>

            {/* Player's hand and controls */}
            <div className="card mb-6">
              <h2 className="text-xl font-bold mb-4">Your Hand</h2>
              {currentPlayer ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <PlayerHand cards={currentPlayer.hand || []} />
                    <p className="mt-2">
                      <span className="font-medium">Chips:</span>{" "}
                      {currentPlayer.chips}
                    </p>
                    <p>
                      <span className="font-medium">Current Bet:</span>{" "}
                      {currentPlayer.currentBet}
                    </p>
                  </div>

                  {/* Betting controls */}
                  <BettingControls
                    onBet={handleBet}
                    onCall={handleCall}
                    onCheck={handleCheck}
                    onFold={handleFold}
                    onRaise={handleRaise}
                    isPlayerTurn={currentPlayer.isTurn}
                    currentBet={game.currentBet}
                    playerBet={currentPlayer.currentBet}
                    playerChips={currentPlayer.chips}
                    minRaise={game.bigBlind}
                  />
                </div>
              ) : (
                <p className="text-gray-500">
                  You are not currently in this game.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chat section */}
        <div className="w-full lg:w-1/4">
          <ChatBox
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            currentUserId={user?.id || ""}
            currentUsername={user?.username || ""}
          />
        </div>
      </div>

      {/* Game winner notification */}
      {game.winner && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="text-xl mb-6">
              <span className="font-medium">{game.winner}</span> wins the pot of{" "}
              <span className="font-medium text-accent">${game.pot}</span>!
            </p>
            <button
              onClick={() => navigate("/lobby")}
              className="btn btn-primary"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;
