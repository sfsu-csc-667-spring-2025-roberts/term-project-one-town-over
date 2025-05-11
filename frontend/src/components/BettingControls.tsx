import React, { useState } from "react";

interface BettingControlsProps {
  onBet: (amount: number) => void;
  onCall: () => void;
  onCheck: () => void;
  onFold: () => void;
  onRaise: (amount: number) => void;
  isPlayerTurn: boolean;
  currentBet: number;
  playerBet: number;
  playerChips: number;
  minRaise: number;
}

const BettingControls: React.FC<BettingControlsProps> = ({
  onBet,
  onCall,
  onCheck,
  onFold,
  onRaise,
  isPlayerTurn,
  currentBet,
  playerBet,
  playerChips,
  minRaise,
}) => {
  const [raiseAmount, setRaiseAmount] = useState(currentBet + minRaise);
  const [showRaiseControls, setShowRaiseControls] = useState(false);

  // Calculate whether actions are valid
  const canCheck = currentBet === playerBet;
  const callAmount = currentBet - playerBet;
  const canCall = callAmount > 0 && callAmount <= playerChips;
  const canRaise = playerChips > callAmount + minRaise;
  const canBet = currentBet === 0 && playerChips > minRaise;

  // Handle raise slider
  const handleRaiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRaiseAmount(parseInt(e.target.value));
  };

  // Handle raise submission
  const handleRaise = () => {
    if (raiseAmount > playerChips) return;
    onRaise(raiseAmount);
    setShowRaiseControls(false);
  };

  if (!isPlayerTurn) {
    return (
      <div className="text-center p-4">
        <div className="text-gray-500 font-medium">
          Waiting for your turn...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {!showRaiseControls ? (
        <div className="flex flex-wrap gap-2 justify-center">
          {canCheck && (
            <button onClick={onCheck} className="btn btn-primary">
              Check
            </button>
          )}

          {canCall && (
            <button onClick={onCall} className="btn btn-primary">
              Call ${callAmount}
            </button>
          )}

          {canBet && (
            <button onClick={() => onBet(minRaise)} className="btn btn-accent">
              Bet ${minRaise}
            </button>
          )}

          {canRaise && (
            <button
              onClick={() => setShowRaiseControls(true)}
              className="btn btn-accent"
            >
              Raise
            </button>
          )}

          <button onClick={onFold} className="btn btn-secondary">
            Fold
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raise Amount: ${raiseAmount}
            </label>
            <input
              type="range"
              min={currentBet + minRaise}
              max={playerChips}
              value={raiseAmount}
              onChange={handleRaiseChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>${currentBet + minRaise}</span>
              <span>All-in (${playerChips})</span>
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <button onClick={handleRaise} className="btn btn-accent">
              Raise to ${raiseAmount}
            </button>
            <button
              onClick={() => setShowRaiseControls(false)}
              className="btn bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BettingControls;
