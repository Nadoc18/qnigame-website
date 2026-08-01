import React, { useState, useEffect } from 'react';
import { RotateCcw, HelpCircle, Trophy, Sparkles, BookOpen, CheckCircle, Delete } from 'lucide-react';
import { soundManager } from '../../utils/audio';
import confetti from 'canvas-confetti';

const WORD_BANK = [
  { word: 'בראשית', hint: 'ספר התורה הראשון ותחילת הבריאה', source: 'בראשית א׳: "בְּרֵאשִׁית בָּרָא אֱלֹהִים"' },
  { word: 'מנורה', hint: 'כלי זהב טהור שהועמד במשכן ובבית המקדש', source: 'שמות כ״ה: "וְעָשִׂיתָ מְנֹרַת זָהָב טָהוֹר"' },
  { word: 'תפילה', hint: 'עבודה שבלב הפונה אל בורא עולם', source: 'תהילים קמ״א: "תִּכּוֹן תְּפִלָּתִי קְטֹרֶת לְפָנֶיךָ"' },
  { word: 'שופר', hint: 'קרן יובל התוקעת בראש השנה ומעוררת לתשובה', source: 'ויקרא כ״ה: "וְהַעֲבַרְתָּ שׁוֹפַר תְּרוּעָה"' },
  { word: 'אברהם', hint: 'אבי האומה העברית ואיש החסד', source: 'בראשית י״ז: "כִּי אַב הֲמוֹן גּוֹיִם נְתַתִּיךָ"' },
  { word: 'שבתות', hint: 'ימי המנוחה והקודש שניתנו לעם ישראל', source: 'שמות מ״א: "אֶת שַׁבְּתֹתַי תִּשְׁמֹרוּ"' },
];

const HEBREW_KEYBOARD = [
  ['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'],
  ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'],
  ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ']
];

interface TanachWordleProps {
  onRecordScore?: (score: number) => void;
}

export const TanachWordle: React.FC<TanachWordleProps> = ({ onRecordScore }) => {
  const [currentWordObj, setCurrentWordObj] = useState(WORD_BANK[0]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const targetWord = currentWordObj.word;
  const wordLength = targetWord.length;
  const maxAttempts = 6;

  const startNewGame = () => {
    soundManager.playClick();
    const randomIndex = Math.floor(Math.random() * WORD_BANK.length);
    setCurrentWordObj(WORD_BANK[randomIndex]);
    setGuesses([]);
    setCurrentGuess('');
    setIsGameOver(false);
    setIsWon(false);
    setErrorMsg(null);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const handleKeyPress = (char: string) => {
    if (isGameOver) return;
    if (currentGuess.length < wordLength) {
      soundManager.playClick();
      setCurrentGuess((prev) => prev + char);
      setErrorMsg(null);
    }
  };

  const handleDelete = () => {
    if (isGameOver) return;
    if (currentGuess.length > 0) {
      soundManager.playClick();
      setCurrentGuess((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = () => {
    if (isGameOver) return;

    if (currentGuess.length !== wordLength) {
      soundManager.playWrong();
      setErrorMsg(`המילה חייבת להכיל בדיוק ${wordLength} אותיות`);
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);

    if (currentGuess === targetWord) {
      // Won!
      soundManager.playCorrect();
      setIsWon(true);
      setIsGameOver(true);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });

      const score = Math.max(150, 600 - (newGuesses.length - 1) * 80);
      if (onRecordScore) onRecordScore(score);
    } else if (newGuesses.length >= maxAttempts) {
      // Game over
      soundManager.playWrong();
      setIsGameOver(true);
    } else {
      soundManager.playClick();
    }

    setCurrentGuess('');
  };

  // Check status of each letter in previous guesses
  const getLetterStatus = (letter: string) => {
    let status = 'unused';
    guesses.forEach((guess) => {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === letter) {
          if (targetWord[i] === letter) {
            status = 'correct'; // Green
          } else if (targetWord.includes(letter) && status !== 'correct') {
            status = 'present'; // Yellow
          } else if (!targetWord.includes(letter) && status === 'unused') {
            status = 'absent'; // Gray
          }
        }
      }
    });
    return status;
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6 text-right" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2f4d21] to-[#1c3817] text-white p-6 rounded-3xl border-2 border-[#3e632c] shadow-xl flex items-center justify-between gap-4">
        <div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#c99719]/25 text-[#f5d77f] font-black border border-[#c99719]/40">
            תנ"ך ומורשת
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">וורדל תנ"ך והפרשה</h2>
          <p className="text-xs text-emerald-200 mt-1 font-medium">נחש את המילה התורנית בת {wordLength} האותיות ב-6 ניסיונות</p>
        </div>

        <button
          onClick={startNewGame}
          className="px-4 py-2.5 bg-[#c99719] hover:bg-[#e5af24] text-[#2f4d21] rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>מילה חדשה</span>
        </button>
      </div>

      {/* Hint Banner */}
      <div className="bg-amber-500/10 border border-amber-400/40 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-slate-800 font-bold">
        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>רמז: {currentWordObj.hint}</span>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-bold text-center animate-bounce">
          {errorMsg}
        </div>
      )}

      {/* Word Grid */}
      <div className="space-y-2.5 max-w-sm mx-auto">
        {Array.from({ length: maxAttempts }).map((_, rowIndex) => {
          const guess = guesses[rowIndex] || (rowIndex === guesses.length ? currentGuess : '');
          const isSubmitted = rowIndex < guesses.length;

          return (
            <div key={rowIndex} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` }}>
              {Array.from({ length: wordLength }).map((_, colIndex) => {
                const letter = guess[colIndex] || '';

                let cellBg = 'bg-slate-900 border-slate-700 text-white';
                if (isSubmitted) {
                  if (targetWord[colIndex] === letter) {
                    cellBg = 'bg-emerald-600 border-emerald-400 text-white shadow-md';
                  } else if (targetWord.includes(letter)) {
                    cellBg = 'bg-amber-500 border-amber-300 text-slate-950 shadow-md';
                  } else {
                    cellBg = 'bg-slate-800 border-slate-700 text-slate-400';
                  }
                } else if (letter) {
                  cellBg = 'bg-slate-800 border-amber-400 text-[#f5c242] scale-105';
                }

                return (
                  <div
                    key={colIndex}
                    className={`aspect-square rounded-xl border-2 font-black text-xl sm:text-2xl flex items-center justify-center transition-all ${cellBg}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Virtual Hebrew Keyboard */}
      <div className="space-y-2 pt-2 max-w-md mx-auto">
        {HEBREW_KEYBOARD.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map((char) => {
              const status = getLetterStatus(char);
              let btnBg = 'bg-slate-800 text-white hover:bg-slate-700';
              if (status === 'correct') btnBg = 'bg-emerald-600 text-white';
              if (status === 'present') btnBg = 'bg-amber-500 text-slate-950 font-black';
              if (status === 'absent') btnBg = 'bg-slate-900 text-slate-600 opacity-60';

              return (
                <button
                  key={char}
                  onClick={() => handleKeyPress(char)}
                  className={`w-9 sm:w-11 h-11 rounded-xl font-black text-sm transition-all shadow-sm active:scale-95 ${btnBg}`}
                >
                  {char}
                </button>
              );
            })}
          </div>
        ))}

        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:from-emerald-500 hover:to-emerald-600 transition-all active:scale-95"
          >
            אישור מילה ✓
          </button>
          <button
            onClick={handleDelete}
            className="px-5 py-3 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-slate-700"
          >
            <Delete className="w-4 h-4" />
            <span>מחק</span>
          </button>
        </div>
      </div>

      {/* Victory / Defeat Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white border-4 border-amber-400 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-400 text-amber-600 mx-auto flex items-center justify-center text-3xl shadow-lg">
              {isWon ? '🏆' : '📖'}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900">
                {isWon ? 'אשריך! פיצחת את המילה!' : `הזדמנות נוספת! המילה הייתה: ${targetWord}`}
              </h3>
              <p className="text-xs text-slate-600 font-bold">{currentWordObj.hint}</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs font-bold text-emerald-900 space-y-1">
              <div className="text-[#2f4d21] font-black">מקור מהתורה והחכמה:</div>
              <div className="italic font-serif text-sm text-slate-800">"{currentWordObj.source}"</div>
            </div>

            <button
              onClick={startNewGame}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-lg shadow-amber-500/30"
            >
              מילה חדשה 🔄
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
