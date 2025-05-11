import express from "express";
import { Request, Response } from "express";
import db from "../../db/connection";

const router = express.Router();

router.post("/createCommunityCards", async (request: Request, response: Response) => {
  const { round_id, cards } = request.body;

  try {
    const community_cards = await db.one(
        `INSERT INTO community_cards(round_id, card1, card2, card3, card4, card5) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
        [round_id, cards[0], cards[1], cards[2], cards[3], cards[4]]
    );

    response.status(201).json({
      success: true,
      message: "Community cards created successfully",
      community_cards: community_cards,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: "Failed to create community cards",
    });
  }
});

export default router;
