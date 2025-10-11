import React from "react";
import { GAME_OPTIONS } from "../constants/gameTypes";

export default function GameTypeSelector({ selectedGame, onSelect, className = "" }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      {GAME_OPTIONS.map((option) => {
        const isSelected = option.id === selectedGame;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            aria-pressed={isSelected}
            className={`rounded-2xl border px-4 py-4 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent ${
              isSelected
                ? "border-accent bg-secondary shadow-glow"
                : "border-secondary-light/40 bg-secondary-dark hover:border-accent/60 hover:shadow-glow"
            }`}
          >
            <p className="text-lg font-semibold text-text">{option.title}</p>
            <p className={`mt-1 text-sm text-text ${isSelected ? "" : "opacity-80"}`}>
              {option.summary}
            </p>
          </button>
        );
      })}
    </div>
  );
}
