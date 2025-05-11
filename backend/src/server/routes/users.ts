import express from "express";
import { Request, Response, Router } from "express";
import db from "../db/connection";

const router = express.Router();

// Handle profile page requests
router.get("/profile", async (request: Request, response: Response) => {
  //@ts-ignore
  const { id: userId, email } = request.session.user;

  try {
    // If the request is for JSON data, return the user data
    if (
      request.headers.accept &&
      request.headers.accept.includes("application/json")
    ) {
      return response.json({
        user: {
          id: userId,
          email: email,
        },
      });
    }

    // Otherwise render the EJS template (if using server-side rendering)
    response.render("profile", {
      //@ts-ignore
      user: request.session.user,
    });
  } catch (error) {
    console.error("Error loading profile page:", error);
    if (
      request.headers.accept &&
      request.headers.accept.includes("application/json")
    ) {
      response.status(500).json({ error: "Failed to load profile" });
    } else {
      response.status(500).send("Failed to load profile page");
    }
  }
});

// API endpoint for game history
router.get("/game-history", async (request: Request, response: Response) => {
  try {
    //@ts-ignore
    const { id: userId } = request.session.user;

    // This is a placeholder - you would implement real game history fetching
    // from your database tables
    const gameHistory = await fetchGameHistoryForUser(userId);

    response.json({ history: gameHistory });
  } catch (error) {
    console.error("Error fetching game history:", error);
    response.status(500).json({ error: "Failed to fetch game history" });
  }
});

// API endpoint for user stats
router.get("/stats", async (request: Request, response: Response) => {
  try {
    //@ts-ignore
    const { id: userId } = request.session.user;

    // This is a placeholder - you would implement real stats fetching
    // from your database tables
    const stats = await fetchUserStats(userId);

    response.json({ stats });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    response.status(500).json({ error: "Failed to fetch user stats" });
  }
});

// Helper function to fetch game history (placeholder implementation)
async function fetchGameHistoryForUser(userId: number) {
  // Placeholder implementation - in a real app, you would query your database
  // This example returns mock data
  return [
    { id: "1", date: "2025-04-10", result: "Win", winnings: 120 },
    { id: "2", date: "2025-04-09", result: "Loss", winnings: -50 },
    { id: "3", date: "2025-04-08", result: "Win", winnings: 75 },
  ];
}

// Helper function to fetch user stats (placeholder implementation)
async function fetchUserStats(userId: number) {
  // Placeholder implementation - in a real app, you would query your database
  // This example returns mock data
  return {
    gamesPlayed: 3,
    wins: 2,
    losses: 1,
    totalWinnings: 145,
  };
}

export default router;
