import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { toast } from "react-toastify";

interface GameHistory {
  id: string;
  date: string;
  result: string;
  winnings: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    totalWinnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        // These would be actual API calls to your backend
        const historyResponse = await axios.get("/api/users/game-history");
        const statsResponse = await axios.get("/api/users/stats");

        setGameHistory(historyResponse.data.history || []);
        setStats(
          statsResponse.data.stats || {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            totalWinnings: 0,
          }
        );
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load your profile data");

        // For demo purposes, set mock data
        setGameHistory([
          { id: "1", date: "2025-04-10", result: "Win", winnings: 120 },
          { id: "2", date: "2025-04-09", result: "Loss", winnings: -50 },
          { id: "3", date: "2025-04-08", result: "Win", winnings: 75 },
        ]);

        setStats({
          gamesPlayed: 3,
          wins: 2,
          losses: 1,
          totalWinnings: 145,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-4 py-8 mx-auto">
      <div className="mb-8 card">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold text-white rounded-full bg-primary">
            {user?.email.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">{user?.email}</h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
        <div className="bg-white card">
          <h2 className="mb-4 text-xl font-bold">Statistics</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Games Played:</span>{" "}
              {stats.gamesPlayed}
            </p>
            <p>
              <span className="font-medium">Wins:</span> {stats.wins}
            </p>
            <p>
              <span className="font-medium">Losses:</span> {stats.losses}
            </p>
            <p>
              <span className="font-medium">Win Rate:</span>{" "}
              {stats.gamesPlayed > 0
                ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p>
              <span className="font-medium">Total Winnings:</span> $
              {stats.totalWinnings}
            </p>
          </div>
        </div>

        <div className="bg-white card">
          <h2 className="mb-4 text-xl font-bold">Account Info</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p>
              <span className="font-medium">Account Created:</span> April 1,
              2025
            </p>
            <p>
              <span className="font-medium">Account Status:</span>{" "}
              <span className="font-medium text-green-600">Active</span>
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-xl font-bold">Recent Games</h2>

        {gameHistory.length === 0 ? (
          <p className="text-gray-500">No games played yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Result</th>
                  <th className="px-4 py-2">Winnings</th>
                </tr>
              </thead>
              <tbody>
                {gameHistory.map((game) => (
                  <tr key={game.id} className="border-t">
                    <td className="px-4 py-2">
                      {new Date(game.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`${
                          game.result === "Win"
                            ? "text-green-600"
                            : "text-red-600"
                        } font-medium`}
                      >
                        {game.result}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`${
                          game.winnings >= 0 ? "text-green-600" : "text-red-600"
                        } font-medium`}
                      >
                        {game.winnings >= 0 ? "+" : ""}$
                        {Math.abs(game.winnings)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
