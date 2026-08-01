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
    <div className="w-full h-full max-w-5xl mx-auto p-4 sm:p-6 space-y-4 text-right flex flex-col justify-between" dir="rtl">
      
      {/* 16:9 Widescreen Top Banner */}
      <div className="bg-gradient-to-r from-[#2f4d21] to-[#1c3817] text-white p-4 sm:p-5 rounded-2xl border-2 border-[#3e632c] shadow-lg flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c99719]/20 border border-[#c99719]/40 flex items-center justify-center text-xl shrink-0">
            📖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c99719]/25 text-[#f5d77f] font-black border border-[#c99719]/40">
                16:9 Widescreen
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">וורדל תנ"ך והפרשה</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-amber-500/10 border border-amber-400/40 px-3 py-1.5 rounded-xl text-xs text-amber-300 font-bold">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>רמז: {currentWordObj.hint}</span>
          </div>

          <button
            onClick={startNewGame}
            className="px-3.5 py-2 bg-[#c99719] hover:bg-[#e5af24] text-[#2f4d21] rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>מילה חדשה</span>
          </button>
        </div>
      </div>

      {/* Mobile Hint Display */}
      <div className="sm:hidden bg-amber-500/10 border border-amber-400/40 p-2.5 rounded-xl flex items-center gap-2 text-xs text-[#f5d77f] font-bold">
        <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>רמז: {currentWordObj.hint}</span>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 p-2 rounded-xl text-xs font-bold text-center animate-bounce">
          {errorMsg}
        </div>
      )}

      {/* 16:9 Widescreen Side-by-Side Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1">
        
        {/* Left/Right Column 1: Word Grid (6 Rows) */}
        <div className="md:col-span-5 space-y-2 max-w-xs mx-auto w-full">
          {Array.from({ length: maxAttempts }).map((_, rowIndex) => {
            const guess = guesses[rowIndex] || (rowIndex === guesses.length ? currentGuess : '');
            const isSubmitted = rowIndex < guesses.length;

            return (
              <div key={rowIndex} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` }}>
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
                      className={`aspect-square rounded-xl border-2 font-black text-lg sm:text-xl flex items-center justify-center transition-all ${cellBg}`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Left/Right Column 2: Virtual Keyboard & Controls */}
        <div className="md:col-span-7 space-y-4">
          <div className="space-y-2">
            {HEBREW_KEYBOARD.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1.5">
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
                      className={`w-9 sm:w-11 h-10 sm:h-11 rounded-xl font-black text-sm transition-all shadow-sm active:scale-95 ${btnBg}`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3 max-w-sm mx-auto">
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

      </div>

      {/* Victory / Defeat Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white border-4 border-amber-400 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-600 mx-auto flex items-center justify-center text-3xl shadow-lg">
              {isWon ? '🏆' : '📖'}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">
                {isWon ? 'אשריך! פיצחת את המילה!' : `הזדמנות נוספת! המילה הייתה: ${targetWord}`}
              </h3>
              <p className="text-xs text-slate-600 font-bold">{currentWordObj.hint}</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs font-bold text-emerald-900 space-y-1">
              <div className="text-[#2f4d21] font-black">מקור מהתורה והחכמה:</div>
              <div className="italic font-serif text-sm text-slate-800">"{currentWordObj.source}"</div>
            </div>

            <button
              onClick={startNewGame}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg"
            >
              מילה חדשה 🔄
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
