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

export const evaluateHands = (
  players: { id: string; holeCards: Card[] }[],
  communityCards: Card[]
) => {
  const formatCard = (card: Card): string => {
    const valueMap = {
      '10': 'T', J: 'J', Q: 'Q', K: 'K', A: 'A',
      '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    };
    const suitMap = { hearts: 'h', diamonds: 'd', clubs: 'c', spades: 's' };

    return `${valueMap[card.value]}${suitMap[card.suit]}`;
  };

  const results = players.map((player) => {
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

  return { winners, results };
};

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
