import express, { Request, Response } from 'express';
import * as PokerEvaluator from 'poker-evaluator';

const router = express.Router();

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
}

export interface Player {
  id: string;
  holeCards: Card[];
}

export interface EvaluateRequest {
  players: Player[];
  communityCards: Card[];
}

function formatCard(card: Card): string {
  const valueMap: Record<string, string> = {
    '10': 'T',
    J: 'J',
    Q: 'Q',
    K: 'K',
    A: 'A',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
  };

  const suitMap: Record<string, string> = {
    hearts: 'h',
    diamonds: 'd',
    clubs: 'c',
    spades: 's',
  };

  const value = valueMap[card.value];
  const suit = suitMap[card.suit];

  return `${value}${suit}`;
}

router.post('/evaluate', (req: Request<{}, {}, EvaluateRequest>, res: Response) => {
  const { players, communityCards } = req.body;

  if (!Array.isArray(players) || players.length < 2) {
    return res.status(400).json({ error: 'At least 2 players are required.' });
  }

  if (!Array.isArray(communityCards) || communityCards.length !== 5) {
    return res.status(400).json({ error: 'Exactly 5 community cards are required.' });
  }

  const results = players.map((player) => {
    if (player.holeCards.length !== 2) {
      throw new Error(`Player ${player.id} must have 2 hole cards`);
    }

    const fullHand = [...player.holeCards, ...communityCards];
    const formattedHand = fullHand.map(formatCard);

    const evaluated = PokerEvaluator.evalHand(formattedHand);

    return {
      id: player.id,
      handType: evaluated.handType,
      handRank: evaluated.handRank,
      handName: evaluated.handName,
      value: evaluated.value,
    };
  });

  const highestValue = Math.max(...results.map((r) => r.value));
  const winners = results.filter((r) => r.value === highestValue);

  res.json({
    winners,
    results,
  });
});

const SUITS: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
const VALUES: Card["value"][] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default router;
