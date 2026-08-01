import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Sparkles, Award, Star, CheckCircle, Clock } from 'lucide-react';
import { soundManager } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface MemoryCard {
  id: number;
  icon: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_ITEMS = [
  { icon: '🕯️', label: 'נרות שבת' },
  { icon: '📜', label: 'ספר תורה' },
  { icon: '🍷', label: 'כוס קידוש' },
  { icon: '🍎', label: 'תפוח בדבש' },
  { icon: '🍇', label: 'פרי הגפן' },
  { icon: '🕎', label: 'מנורת המקדש' },
  { icon: '✡️', label: 'מגן דוד' },
  { icon: '🎓', label: 'תלמיד חכם' },
];

interface MemoryGameProps {
  onRecordScore?: (score: number) => void;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ onRecordScore }) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Initialize and shuffle cards
  const initializeGame = () => {
    soundManager.playClick();
    const duplicatedItems = [...CARD_ITEMS, ...CARD_ITEMS];
    const shuffled = duplicatedItems
      .sort(() => Math.random() - 0.5)
      .map((item, idx) => ({
        id: idx,
        icon: item.icon,
        label: item.label,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffled);
    setFlippedIndices([]);
    setMoves(0);
    setMatchedPairs(0);
    setIsWon(false);
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  // Timer interval
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && !isWon) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isWon]);

  const handleCardClick = (index: number) => {
    if (!isTimerRunning) setIsTimerRunning(true);

    if (
      flippedIndices.length >= 2 ||
      cards[index].isFlipped ||
      cards[index].isMatched
    ) {
      return;
    }

    soundManager.playClick();

    // Flip selected card
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = nextFlipped;

      if (newCards[firstIdx].label === newCards[secondIdx].label) {
        // Match found!
        soundManager.playCorrect();
        newCards[firstIdx].isMatched = true;
        newCards[secondIdx].isMatched = true;
        setCards(newCards);
        setFlippedIndices([]);
        setMatchedPairs((prev) => {
          const nextPairs = prev + 1;
          if (nextPairs === CARD_ITEMS.length) {
            handleWin();
          }
          return nextPairs;
        });
      } else {
        // No match - flip back after delay
        soundManager.playWrong();
        setTimeout(() => {
          setCards((prevCards) => {
            const resetCards = [...prevCards];
            resetCards[firstIdx].isFlipped = false;
            resetCards[secondIdx].isFlipped = false;
            return resetCards;
          });
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const handleWin = () => {
    setIsWon(true);
    setIsTimerRunning(false);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    // Calculate score
    const timeBonus = Math.max(0, 300 - timerSeconds * 2);
    const movePenalty = moves * 10;
    const finalScore = Math.max(100, 500 + timeBonus - movePenalty);

    if (onRecordScore) {
      onRecordScore(finalScore);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 text-right" dir="rtl">
      
      {/* Header Info */}
      <div className="bg-gradient-to-r from-[#2f4d21] to-[#1c3817] text-white p-6 rounded-3xl border-2 border-[#3e632c] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#c99719]/25 text-[#f5d77f] font-black border border-[#c99719]/40">
              חשיבה וזיכרון
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">משחק זיכרון מצוות וברכות</h2>
          <p className="text-xs text-emerald-200 mt-1 font-medium">התאם את כל הזוגות במינימום מהלכים וזמן!</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 bg-black/40 px-5 py-3 rounded-2xl border border-emerald-500/30">
          <div className="text-center">
            <div className="text-xs text-emerald-300 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>זמן</span>
            </div>
            <div className="text-lg font-black text-white font-mono">{formatTime(timerSeconds)}</div>
          </div>
          <div className="h-8 w-px bg-emerald-500/30" />
          <div className="text-center">
            <div className="text-xs text-emerald-300 font-bold">מהלכים</div>
            <div className="text-lg font-black text-[#f5c242]">{moves}</div>
          </div>
          <div className="h-8 w-px bg-emerald-500/30" />
          <div className="text-center">
            <div className="text-xs text-emerald-300 font-bold">זוגות</div>
            <div className="text-lg font-black text-emerald-400">{matchedPairs}/{CARD_ITEMS.length}</div>
          </div>
        </div>

        <button
          onClick={initializeGame}
          className="px-4 py-2.5 bg-[#c99719] hover:bg-[#e5af24] text-[#2f4d21] rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>משחק חדש</span>
        </button>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => handleCardClick(idx)}
            className={`aspect-square rounded-2xl cursor-pointer transition-all duration-300 transform perspective-1000 select-none shadow-md ${
              card.isFlipped || card.isMatched
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 rotate-0 scale-100'
                : 'bg-gradient-to-br from-[#2f4d21] to-[#1c3817] border-2 border-[#3e632c] hover:border-amber-400 hover:scale-105'
            }`}
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
              {card.isFlipped || card.isMatched ? (
                <>
                  <span className="text-3xl sm:text-4xl animate-in zoom-in duration-200">{card.icon}</span>
                  <span className="text-[10px] sm:text-xs font-black text-slate-950 mt-1 truncate max-w-full">
                    {card.label}
                  </span>
                </>
              ) : (
                <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-amber-300 font-black text-lg">
                  ✡️
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Victory Modal */}
      {isWon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white border-4 border-amber-400 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-400 text-amber-600 mx-auto flex items-center justify-center text-3xl shadow-lg">
              🏆
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900">אשריך! כל הכבוד!</h3>
              <p className="text-xs text-slate-600 font-bold">השלמת את משחק הזיכרון בהצלחה מרובה</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">זמן כולל</span>
                <span className="text-base font-black text-emerald-600 font-mono">{formatTime(timerSeconds)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">מספר מהלכים</span>
                <span className="text-base font-black text-amber-600">{moves}</span>
              </div>
            </div>

            <button
              onClick={initializeGame}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-lg shadow-amber-500/30"
            >
              שחק שוב! 🔄
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
