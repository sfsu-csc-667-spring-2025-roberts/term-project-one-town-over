import express from "express";
import { Request, Response } from "express";
import db from "../../db/connection";

const router = express.Router();

router.post("/createPlayerHand", async (request: Request, response: Response) => {
  const { round_id, player_id, cards } = request.body;

  try {
    const player_hand = await db.one(
        `INSERT INTO player_hands(round_id, player_id, card1, card2) VALUES($1, $2, $3, $4) RETURNING *`,
        [round_id, player_id, cards[0], cards[1]]
    );

    response.status(201).json({
      success: true,
      message: "Player hand created successfully",
      player_hand: player_hand,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: "Failed to create player hand",
    });
  }
});

router.put("/playerLoose", async (request: Request, response: Response) => {
    const { hand_id } = request.body;

    try {
        const player_hand = await db.one(
            `UPDATE player_hands SET has_loose = true WHERE hand_id = $1 RETURNING *`,
            [hand_id]
        );

        response.status(201).json({
        success: true,
        message: "Player hand edited successfully",
        player_hand: player_hand,
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({
        success: false,
        message: "Failed to edit player hand",
        });
    }
});

export default router;
