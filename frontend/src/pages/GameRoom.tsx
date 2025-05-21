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
  message: string;
  sender: string;
  timestamp: number;
  id?: string;
}

interface ServerPlayer {
  player_id: string;
  email: string;
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

  // Connect to socket.io server
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io();

    // Listen for chat messages
    socketRef.current.on(`chat-message:${gameId}`, (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    // Listen for player join events
    socketRef.current.on(`game:${gameId}:player-joined`, (data) => {
      toast.info(`${data.email} has joined the game`);

      // Update player list if we have the game state
      setGame((prevState) => {
        // Deep copy of the current state
        const newState = { ...prevState };

        // Check if the player is already in the list
        const existingPlayerIndex = newState.players.findIndex(
          (p) => p.id === data.userId
        );

        if (existingPlayerIndex === -1) {
          // Add the new player
          newState.players.push({
            id: data.userId,
            email: data.email,
            chips: 1000, // Default starting chips
            isActive: true,
            isDealer: false,
            isTurn: false,
            hasFolded: false,
            currentBet: 0,
            position: newState.players.length,
          });
        }

        return newState;
      });
    });

    socketRef.current.on(`game:${gameId}:start`, () => {
      setGame((prev) => ({
        ...prev,
        status: "playing",
      }));
      console.log("Game started!");
    });

    socketRef.current.on(`game:${gameId}:check`, (data) => {
      const { playerId } = data;
    
      setGame((prev) => {
        const newState = { ...prev };

        newState.players = newState.players.map((player) => {
          if (player.id === playerId) {
            return {
              ...player,
              lastAction: "check",
            };
          }
          return player;
        });

        return newState;
      });
    });

    socketRef.current.on(`game:${gameId}:bet`, ({ playerId, amount }) => {
      setGame((prevGame) => {
        const updatedGame = { ...prevGame };
    
        updatedGame.players = updatedGame.players.map((p) => {
          if (p.id === playerId) {
            return {
              ...p,
              chips: p.chips - amount,
              currentBet: p.currentBet + amount,
            };
          }
          return p;
        });

        updatedGame.pot += amount;

        if (amount > updatedGame.currentBet) {
          updatedGame.currentBet = amount;
        }
    
        return updatedGame;
      });
    
      setCurrentPlayer((prev) => {
        if (!prev || prev.id !== playerId) return prev;
    
        return {
          ...prev,
          chips: prev.chips - amount,
          currentBet: prev.currentBet + amount,
        };
      });
    });  
    
    socketRef.current.on(`game:${gameId}:raise`, ({ playerId, amount }) => {
      setGame((prevGame) => {
        const updatedGame = { ...prevGame };

        updatedGame.players = updatedGame.players.map((p) => {
          if (p.id === playerId) {
            return {
              ...p,
              chips: p.chips - amount,
              currentBet: p.currentBet + amount,
            };
          }
          return p;
        });

        updatedGame.pot += amount;
        updatedGame.currentBet += amount;
    
        return updatedGame;
      });

      setCurrentPlayer((prev) => {
        if (!prev || prev.id !== playerId) return prev;
        return {
          ...prev,
          chips: prev.chips - amount,
          currentBet: prev.currentBet + amount,
        };
      });
    });

    socketRef.current.on(`game:${gameId}:call`, ({ playerId, callAmount }) => {
      setGame((prevGame) => {
        const updatedGame = { ...prevGame };
    
        updatedGame.players = updatedGame.players.map((p) => {
          if (p.id === playerId) {
            return {
              ...p,
              chips: p.chips - callAmount,
              currentBet: p.currentBet + callAmount,
            };
          }
          return p;
        });

        updatedGame.pot += callAmount;
    
        return updatedGame;
      });

      setCurrentPlayer((prev) => {
        if (!prev || prev.id !== playerId) return prev;
        return {
          ...prev,
          chips: prev.chips - callAmount,
          currentBet: prev.currentBet + callAmount,
        };
      });
    });
    

    // Listen for changing round
    socketRef.current.on(`game:${gameId}:change-round`, (data) => {
      setGame((prevState) => {
        const newState = { ...prevState };
        newState.round = data.newRound;
        return newState;
      });
    });

    socketRef.current.on(`game:${gameId}:change-turn`, (data) => {
      const newPlayerId = data.newPlayer;
    
      setGame(prev => {
        const updatedPlayers = prev.players.map(player => ({
          ...player,
          isTurn: player.id === newPlayerId,
        }));
    
        return {
          ...prev,
          currentTurn: newPlayerId,
          players: updatedPlayers,
        };
      });

      setCurrentPlayer(prev => {
        if (!prev) return null;
        if (prev.id === newPlayerId) {
          return { ...prev, isTurn: true };
        } else {
          return { ...prev, isTurn: false };
        }
      });
    });    

    socketRef.current.on(`game:${gameId}:deal`, (data) => {
      setGame((prevState) => {
        const newState = { ...prevState };

        newState.communityCards = data.communityCards;

        newState.players = newState.players.map((player) => {
          const updatedPlayer = data.players.find((p: any) => p.id === player.id);
          if (updatedPlayer) {
            return {
              ...player,
              hand: updatedPlayer.actualCards,
            };
          }
          return player;
        });
    
        return newState;
      });
  
      setCurrentPlayer((prev) => {
        if (!prev) return null;
    
        const updatedPlayer = data.players.find((p: any) => p.id === prev.id);
        if (updatedPlayer) {
          return {
            ...prev,
            hand: updatedPlayer.actualCards,
          };
        }
    
        return prev;
      });
    });

    // Listen for player leave events
    socketRef.current.on(`game:${gameId}:player-left`, (data) => {
      toast.info(`A player has left the game`);

      // Update player list if we have the game state
      setGame((prevState) => {
        // Deep copy of the current state
        const newState = { ...prevState };

        // Remove the player
        newState.players = newState.players.filter((p) => p.id !== data.userId);

        return newState;
      });
    });

    // Cleanup on unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, [gameId]);

  // Fetch initial game data
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setIsLoading(true);

        // We don't have a proper JSON API endpoint yet, so we'll need to
        // create a temporary game state with the players from the game
        try {
          const response = await axios.get(`/games/${gameId}`, {
            headers: { Accept: "application/json" },
          });

          console.log("Data: ", response);

          if (response.data && response.data.players) {
            // Create a game state with the available data
            const gameStateFromServer = {
              ...initialGameState,
              id: gameId || "",
              name: response.data.name || `Game ${gameId}`,
              round: response.data.round,
              players: response.data.players.map((p: ServerPlayer) => ({
                id: p.player_id,
                email: p.email,
                chips: 1000, // Default starting chips
                isActive: true,
                isDealer: false,
                isTurn: false,
                hasFolded: false,
                currentBet: 0,
                position: 0, // Will be adjusted
              })),
              currentBet: response.data.game.current_bet,
              smallBlind: response.data.game.small_blind,
              bigBlind: response.data.game.big_blind,
              pot: response.data.game.pot,
              currentTurn: response.data.game.current_turn
            };

            // Adjust player positions
            gameStateFromServer.players.forEach((p: Player, i: number) => {
              p.position = i;
            });

            setGame(gameStateFromServer);

            // Find the current player
            const player = gameStateFromServer.players.find(
              (p: Player) => p.id === user?.id
            );
            if (player) {
              setCurrentPlayer(player);
            }
          }
        } catch (error) {
          console.error("Error fetching game data:", error);

          // For development, create mock data until API is fully implemented
          const mockGame: GameState = {
            id: gameId || "1",
            name: `Game ${gameId}`,
            status: "waiting",
            players: [
              {
                id: user?.id || "1",
                email: user?.email || "you@example.com",
                chips: 1000,
                isActive: true,
                isDealer: true,
                isTurn: true,
                hasFolded: false,
                currentBet: 0,
                position: 0,
                hand: [
                  { suit: "hearts" as const, value: "A" },
                  { suit: "diamonds" as const, value: "K" },
                ],
              },
            ],
            pot: 0,
            currentBet: 0,
            communityCards: [],
            dealerPosition: 0,
            currentTurn: user?.id || null,
            round: "pre-flop",
            winner: null,
            smallBlind: 5,
            bigBlind: 10,
          };

          setGame(mockGame);

          // Set current player
          const mockCurrentPlayer: Player = {
            id: user?.id || "1",
            email: user?.email || "you@example.com",
            chips: 1000,
            isActive: true,
            isDealer: true,
            isTurn: true,
            hasFolded: false,
            currentBet: 0,
            position: 0,
            hand: [
              { suit: "hearts" as const, value: "A" },
              { suit: "diamonds" as const, value: "K" },
            ],
          };

          setCurrentPlayer(mockCurrentPlayer);
        }
      } catch (error) {
        console.error("Failed to load game:", error);
        toast.error("Failed to load the game");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, user?.id, user?.email]);

  // Game actions
  const handleBet = async (amount: number) => {
    try {
      await axios.post("/games/bet", {
        gameId: game.id,
        playerId: currentPlayer?.id,
        amount,
      });
      console.log("Bet sent:", amount);
    } catch (err) {
      console.error("Failed to bet:", err);
    }
  };  

  const handleCall = async () => {
    try {
      await axios.post("/games/call", {
        gameId: game.id,
        playerId: currentPlayer?.id,
      });
      console.log("Call sent");
    } catch (err) {
      console.error("Failed to call:", err);
    }
  };

  const handleCheck = async () => {
    console.log("Checking");
    try {
      await axios.post("/games/check", { gameId: gameId, playerId: currentPlayer?.id });
    } catch (error) {
      console.error("Error checking:", error);
      toast.error("Failed to check");
    }
  };

  const handleFold = () => {
    console.log("Folding");
    // This would be implemented with actual game logic
  };

  const handleRaise = async (amount: number) => {
    try {
      await axios.post("/games/raise", {
        gameId: game.id,
        playerId: currentPlayer?.id,
        amount,
      });
      console.log("Raise sent:", amount);
    } catch (err) {
      console.error("Failed to raise:", err);
    }
  }; 
  
  const handleStartGame = async () => {
    try {
      await axios.post("/games/start", {
        gameId: game.id
      });
      console.log("Game started");
    } catch (err) {
      console.error("Failed to start:", err);
    }
  };

  const handleLeaveGame = async () => {
    try {
      await axios.post("/games/leave", { gameId });
      navigate("/lobby");
    } catch (error) {
      console.error("Error leaving game:", error);
      toast.error("Failed to leave the game");
    }
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    // Send the message to the server
    fetch(`/chat/${gameId}`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        message,
      }),
    }).catch((error) => {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-4 mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{game.name}</h1>
        <button onClick={handleStartGame} className={game.status === "playing" ? "btn" : "btn btn-secondary"} disabled={game.status === "playing" && true}>
          Start Game
        </button>
        <button onClick={handleLeaveGame} className="btn btn-secondary">
          Leave Game
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
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

            {/* Player's hand and controls - Updated to match new styling */}
            <div className="p-4 mb-6 rounded-lg shadow-md bg-gradient-to-r from-secondary/10 to-primary/10">
              <h2 className="mb-3 text-xl font-bold text-primary">Your Hand</h2>
              {currentPlayer ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Left side - player cards and info */}
                  <div className="p-4 rounded-lg shadow-sm bg-white/80">
                    <PlayerHand cards={currentPlayer.hand || []} />
                    <div className="flex justify-between p-2 mt-3 bg-gray-100 rounded-md">
                      <div>
                        <span className="text-sm font-medium">Chips:</span>
                        <span className="ml-2 font-bold text-primary">
                          ${currentPlayer.chips}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          Current Bet:
                        </span>
                        <span className="ml-2 font-bold text-accent">
                          ${currentPlayer.currentBet}
                        </span>
                      </div>
                    </div>
                    {/* Player status indicator */}
                    <div className="mt-3 text-center">
                      {currentPlayer.isTurn ? (
                        <div className="inline-block px-3 py-1 text-sm font-medium text-white rounded-full bg-accent animate-pulse">
                          Your Turn
                        </div>
                      ) : (
                        <div className="inline-block px-3 py-1 text-sm font-medium text-gray-600 bg-gray-200 rounded-full">
                          Waiting
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - betting controls */}
                  <div className="flex items-center justify-center p-4 rounded-lg shadow-sm bg-white/80">
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
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-white/80">
                  <p className="text-gray-500">
                    You are not currently in this game.
                  </p>
                </div>
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
            currentUsername={user?.email || ""}
          />
        </div>
      </div>

      {/* Game winner notification */}
      {game.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md p-8 text-center bg-white rounded-lg">
            <h2 className="mb-4 text-2xl font-bold">Game Over!</h2>
            <p className="mb-6 text-xl">
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
