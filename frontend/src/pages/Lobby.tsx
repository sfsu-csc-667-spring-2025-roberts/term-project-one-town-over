import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

interface Game {
  id: string | number;
  name: string;
  host: string;
  players: number;
  maxPlayers: number;
  status: "waiting" | "playing" | "ended";
  createdAt: string;
}

interface ChatMessage {
  message: string;
  sender: string;
  timestamp: number;
  id?: string;
}

const Lobby: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showCreateGameModal, setShowCreateGameModal] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newGameMinPlayers, setNewGameMinPlayers] = useState(2);
  const [newGameMaxPlayers, setNewGameMaxPlayers] = useState(4);
  const [newGamePassword, setNewGamePassword] = useState("");

  // Connect to socket.io server
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io();

    // Listen for lobby updates
    socketRef.current.on("game-created", (gameData) => {
      // Add the new game to our list
      setGames((prevGames) => [
        {
          id: gameData.gameId,
          name: gameData.gameName,
          host: gameData.host.email,
          players: 1, // Just created, so 1 player (the host)
          maxPlayers: gameData.gameMaxPlayers,
          status: "waiting",
          createdAt: new Date().toISOString(),
        },
        ...prevGames,
      ]);
    });

    // Listen for chat messages
    socketRef.current.on("chat-message:0", (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    // Cleanup on unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Actually we don't have an API endpoint for games list yet
        // So we'll prepare for when we have it but for now leave dummy data
        try {
          // If this endpoint gets implemented:
          const response = await axios.get("/games/list", {
            headers: { Accept: "application/json" },
          });
          if (response.data && response.data.games) {
            setGames(response.data.games);
          }
        } catch (error) {
          console.log("Games list API not implemented yet");
          // Keep using dummy data for now
          setGames([
            {
              id: "1",
              name: "Jack's Game",
              host: "jackrichards",
              players: 2,
              maxPlayers: 6,
              status: "waiting",
              createdAt: new Date().toISOString(),
            },
            {
              id: "2",
              name: "Heber's Table",
              host: "hebertrujillo",
              players: 5,
              maxPlayers: 6,
              status: "playing",
              createdAt: new Date().toISOString(),
            },
            {
              id: "3",
              name: "Nathan's Casino",
              host: "nathandonat",
              players: 3,
              maxPlayers: 8,
              status: "waiting",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching lobby data:", error);
        toast.error("Failed to load game listings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    // Send to the backend - for lobby chat, use roomId 0
    fetch(`/chat/0`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        message: newMessage,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to send message");
        }
        setNewMessage("");
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
      });
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGameName.trim()) {
      toast.error("Please enter a game name");
      return;
    }

    try {
      // Use the actual backend API to create a game
      const response = await axios.post("/games/create", {
        gameName: newGameName,
        gameMinPlayers: newGameMinPlayers,
        gameMaxPlayers: newGameMaxPlayers,
        gamePassword:
          newGamePassword.trim() === "" ? undefined : newGamePassword,
      });

      setShowCreateGameModal(false);
      setNewGameName("");
      setNewGamePassword("");

      // If we get a redirect URL, use it
      if (response.data && response.data.gameId) {
        navigate(`/games/${response.data.gameId}`);
      }

      toast.success("Game created successfully");
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game");
    }
  };

  const handleJoinGame = async (gameId: string | number) => {
    try {
      const response = await axios.post("/games/join", {
        gameId,
        gamePassword: "", // If needed, implement password prompt
      });

      if (response.status === 200) {
        navigate(`/games/${gameId}`);
      }
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Failed to join game");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Game list section */}
        <div className="w-full lg:w-2/3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Game Lobby</h1>
            <button
              onClick={() => setShowCreateGameModal(true)}
              className="btn btn-primary"
            >
              Create Game
            </button>
          </div>

          {games.length === 0 ? (
            <div className="p-8 text-center card">
              <p className="mb-4 text-gray-500">
                No games available right now.
              </p>
              <button
                onClick={() => setShowCreateGameModal(true)}
                className="mx-auto btn btn-primary"
              >
                Create the First Game
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {games.map((game) => (
                <div key={game.id} className="card">
                  <div className="flex flex-col justify-between md:flex-row md:items-center">
                    <div>
                      <h2 className="mb-2 text-xl font-bold">{game.name}</h2>
                      <p className="mb-2 text-gray-600">
                        Hosted by: {game.host}
                      </p>
                      <p className="mb-2 text-gray-600">
                        Players: {game.players}/{game.maxPlayers}
                      </p>
                      <p className="mb-2 text-gray-600">
                        Status:
                        <span
                          className={`ml-2 font-medium ${
                            game.status === "waiting"
                              ? "text-yellow-600"
                              : game.status === "playing"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {game.status.charAt(0).toUpperCase() +
                            game.status.slice(1)}
                        </span>
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      {game.status !== "waiting" ||
                      game.players >= game.maxPlayers ? (
                        <button
                          className="opacity-75 btn btn-secondary"
                          disabled
                        >
                          {game.status === "playing" ? "Spectate" : "Game Full"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinGame(game.id)}
                          className="btn btn-primary"
                        >
                          Join Game
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat section */}
        <div className="w-full mt-6 lg:w-1/3 lg:mt-0">
          <div className="card h-[600px] flex flex-col">
            <h2 className="mb-4 text-xl font-bold">Lobby Chat</h2>

            <div
              ref={chatContainerRef}
              className="flex-1 mb-4 space-y-3 overflow-y-auto"
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={msg.id || `chat-msg-${index}`}
                  className={`flex ${
                    msg.sender === user?.email ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.sender === user?.email
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-gray-200 text-gray-800 rounded-tl-none"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium ${
                          msg.sender === user?.email
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      >
                        {msg.sender}
                      </span>
                      <span
                        className={`text-xs ${
                          msg.sender === user?.email
                            ? "text-white/70"
                            : "text-gray-500"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p>{msg.message}</p>
                  </div>
                </div>
              ))}

              {chatMessages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="mt-auto">
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 rounded-r-none input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 rounded-l-none btn btn-primary"
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Create Game Modal */}
      {showCreateGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-xl font-bold">Create New Game</h2>

            <form onSubmit={handleCreateGame}>
              <div className="mb-4">
                <label htmlFor="game-name" className="block mb-2 text-gray-700">
                  Game Name
                </label>
                <input
                  id="game-name"
                  type="text"
                  className="input"
                  placeholder="Enter a name for your game"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="min-players"
                  className="block mb-2 text-gray-700"
                >
                  Min Players
                </label>
                <input
                  id="min-players"
                  type="number"
                  className="input"
                  min={2}
                  max={10}
                  value={newGameMinPlayers}
                  onChange={(e) =>
                    setNewGameMinPlayers(parseInt(e.target.value))
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="max-players"
                  className="block mb-2 text-gray-700"
                >
                  Max Players
                </label>
                <input
                  id="max-players"
                  type="number"
                  className="input"
                  min={2}
                  max={10}
                  value={newGameMaxPlayers}
                  onChange={(e) =>
                    setNewGameMaxPlayers(parseInt(e.target.value))
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="block mb-2 text-gray-700">
                  Password (Optional)
                </label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="Leave empty for public game"
                  value={newGamePassword}
                  onChange={(e) => setNewGamePassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="text-gray-800 bg-gray-200 btn hover:bg-gray-300"
                  onClick={() => setShowCreateGameModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;
