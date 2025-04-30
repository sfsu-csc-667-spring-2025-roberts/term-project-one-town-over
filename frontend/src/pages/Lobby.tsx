import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

interface Game {
  room_id: string;
  name: string;
  code: string;
  host: string;
  players: number;
  max_players: number;
  status: "Waiting" | "Playing" | "Ended";
  created_at: string;
  small_blind: number;
  big_blind: number;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
}

const Lobby: React.FC = () => {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showCreateGameModal, setShowCreateGameModal] = useState(false);
  const [newGameName, setNewGameName] = useState("");

  // Connect to socket.io server
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io();

    // Listen for lobby updates
    socketRef.current.on("game-list-update", (updatedGames: Game[]) => {
      setGames(updatedGames);
    });

    // Listen for chat messages
    socketRef.current.on("chat-message", (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    // Cleanup on unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch game list
      const gamesResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}:${process.env.REACT_APP_BACKEND_PORT}/game_rooms/getRooms`);
      setGames(gamesResponse.data || []);
      
      // Fetch recent chat messages
      const chatResponse = await axios.get("/api/chat/lobby");
      setChatMessages(chatResponse.data.messages || []);
    } catch (error) {
      console.error("Error fetching lobby data:", error);
      toast.error("Failed to load game listings");
      
      setChatMessages([
        {
          id: "1",
          user: "jackrichards",
          message: "Anyone want to join my game?",
          timestamp: "2025-04-13T20:31:00Z",
        },
        {
          id: "2",
          user: "hebertrujillo",
          message: "My game is almost full, one spot left!",
          timestamp: "2025-04-13T20:32:00Z",
        },
        {
          id: "3",
          user: "nathandonat",
          message: "Just created a new table, come join!",
          timestamp: "2025-04-13T20:33:00Z",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch initial data
  useEffect(() => {
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

    // In a real app, this would be sent to the server via socket.io
    // For now, we'll just add it locally and assume it works
    const message = {
      id: Date.now().toString(),
      user: user?.username || "Anonymous",
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    socketRef.current?.emit("send-chat-message", message);
    setChatMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGameName.trim()) {
      toast.error("Please enter a game name");
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}:${process.env.REACT_APP_BACKEND_PORT}/game_rooms/createRoom`, {
          name: newGameName
      })

      fetchData();
      setShowCreateGameModal(false);
      setNewGameName("");
      toast.success("Game created successfully");
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Game list section */}
        <div className="w-full lg:w-2/3">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Game Lobby</h1>
            <button
              onClick={() => setShowCreateGameModal(true)}
              className="btn btn-primary"
            >
              Create Game
            </button>
          </div>

          {games.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500 mb-4">
                No games available right now.
              </p>
              <button
                onClick={() => setShowCreateGameModal(true)}
                className="btn btn-primary mx-auto"
              >
                Create the First Game
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {games.map((game) => (
                <div key={game.room_id} className="card">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold mb-2">{game.name}</h2>
                      <p className="text-gray-600 mb-2">
                        Hosted by: {game.host}
                      </p>
                      <p className="text-gray-600 mb-2">
                        Players: {game.players}/{game.max_players}
                      </p>
                      <p className="text-gray-600 mb-2">
                        Status:
                        <span
                          className={`ml-2 font-medium ${
                            game.status === "Waiting"
                              ? "text-yellow-600"
                              : game.status === "Playing"
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
                      {game.status !== "Waiting" ||
                      game.players >= game.max_players ? (
                        <button
                          className="btn btn-secondary opacity-75"
                          disabled
                        >
                          {game.status === "Playing" ? "Spectate" : "Game Full"}
                        </button>
                      ) : (
                        <Link
                          to={`/game/${game.room_id}`}
                          className="btn btn-primary"
                        >
                          Join Game
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat section */}
        <div className="w-full lg:w-1/3 mt-6 lg:mt-0">
          <div className="card h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Lobby Chat</h2>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-4 space-y-3"
            >
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.user === user?.username
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.user === user?.username
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-gray-200 text-gray-800 rounded-tl-none"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-xs font-medium ${
                          msg.user === user?.username
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      >
                        {msg.user}
                      </span>
                      <span
                        className={`text-xs ${
                          msg.user === user?.username
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
                  className="input rounded-r-none flex-1"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary rounded-l-none px-4"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New Game</h2>

            <form onSubmit={handleCreateGame}>
              <div className="mb-4">
                <label htmlFor="game-name" className="block text-gray-700 mb-2">
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

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="btn bg-gray-200 text-gray-800 hover:bg-gray-300"
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
