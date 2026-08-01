import { Game } from '../types';

export const GAMES_LIST: Game[] = [
  {
    id: 'time-count',
    title: 'ניצול הזמן',
    subtitle: 'חידון דעת אינטראקטיבי עם מאות שאלות בדרגות קושי משתנות',
    description: 'בחן את ידיעותיך בתורה, תנ"ך, מנהגים, חגים והלכות יומיות. צבור נקודות ועלה בדרגות!',
    longDescription: 'משחק טריוויה יהודי עשיר המשלב שאלות מגוונות מכל עולמות התוכן היהודיים: פרשת השבוע, חגי ישראל, הלכות ברכות, דמויות בתנ"ך ומנהגי ישראל.',
    category: 'טריוויה ודעת',
    difficulty: 'לכל המשפחה',
    ageRating: 'גילאי 6+',
    playCount: 14250,
    rating: 4.9,
    ratingCount: 312,
    author: 'צוות בית המדרש הדיגיטלי',
    tags: ['טריוויה', 'תנ"ך', 'הלכה', 'חגים', 'פרשת השבוע'],
    thumbnailBg: 'from-amber-600 via-amber-700 to-amber-900',
    iconName: 'HelpCircle',
    instructions: [
      'בחר קטגוריה ודרגת קושי מתאימה.',
      'לכל שאלה יש 4 תשובות אפשריות וזמן קצוב של 20 שניות.',
      'מענה מהיר ומדויק יעניק לך בונוס נקודות ומכפיל רצף (Streak).'
    ],
    torahSource: 'משלי פרק ד׳: "כִּי לֶקַח טוֹב נָתַתִּי לָכֶם תּוֹרָתִי אַל תַּעֲזֹבוּ"',
    gameType: 'trivia',
    isPopular: true,
    isNew: false,
    externalUrl: 'https://www.nadoc-games.com/TimeCount/',
    frameWidth: '375px',
    frameHeight: '667px',
    aspectRatio: '9/16',
    introVideoUrl: 'https://firebasestorage.googleapis.com/v0/b/molten-protocol-whnbb.firebasestorage.app/o/intro_squareHEBREW.mp4?alt=media&token=a80d8520-1de6-46a4-a8b9-df2103855845',
    files: []
  },
  {
    id: 'trivia-jewish-master',
    title: 'טריוויה יהודית - אלופי התנ"ך וההלכה',
    subtitle: 'חידון דעת אינטראקטיבי עם מאות שאלות בדרגות קושי משתנות',
    description: 'בחן את ידיעותיך בתורה, תנ"ך, מנהגים, חגים והלכות יומיות. צבור נקודות ועלה בדרגות!',
    longDescription: 'משחק טריוויה יהודי עשיר המשלב שאלות מגוונות מכל עולמות התוכן היהודיים: פרשת השבוע, חגי ישראל, הלכות ברכות, דמויות בתנ"ך ומנהגי ישראל. המשחק כולל שעון זמן, רצף תשובות נכונות (Streak), רמזים והסברים מפורטים מתוך מקורות חז"ל בסיום כל שאלה.',
    category: 'טריוויה ודעת',
    difficulty: 'לכל המשפחה',
    ageRating: 'גילאי 6+',
    playCount: 14250,
    rating: 4.9,
    ratingCount: 312,
    author: 'צוות בית המדרש הדיגיטלי',
    tags: ['טריוויה', 'תנ"ך', 'הלכה', 'חגים', 'פרשת השבוע'],
    thumbnailBg: 'from-amber-600 via-amber-700 to-amber-900',
    iconName: 'HelpCircle',
    instructions: [
      'בחר קטגוריה ודרגת קושי מתאימה.',
      'לכל שאלה יש 4 תשובות אפשריות וזמן קצוב של 20 שניות.',
      'מענה מהיר ומדויק יעניק לך בונוס נקודות ומכפיל רצף (Streak).',
      'תוכל להשתמש בגלגל ההצלה "רמז מהמקורות" פעם אחת בכל סיבוב.'
    ],
    torahSource: 'משלי פרק ד׳: "כִּי לֶקַח טוֹב נָתַתִּי לָכֶם תּוֹרָתִי אַל תַּעֲזֹבוּ"',
    gameType: 'trivia',
    isPopular: true,
    isNew: false,
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>טריוויה יהודית</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="game-container">
    <header>
      <h1>✨ טריוויה יהודית - אלופי התנ"ך ✨</h1>
      <div class="stats-bar">
        <div>ניקוד: <span id="score">0</span></div>
        <div>רצף: <span id="streak">🔥 0</span></div>
        <div>זמן: <span id="timer">20</span>s</div>
      </div>
    </header>
    <main id="quiz-card">
      <div id="question-category">פרשת השבוע</div>
      <h2 id="question-text">טוען שאלה...</h2>
      <div id="options-grid"></div>
      <div id="explanation-box" class="hidden"></div>
      <button id="next-btn" class="hidden">השאלה הבאה ➔</button>
    </main>
  </div>
  <script src="game.js"></script>
</body>
</html>`
      },
      {
        name: 'style.css',
        language: 'css',
        content: `body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  margin: 0;
  padding: 20px;
  direction: rtl;
}
#game-container {
  max-width: 650px;
  margin: 0 auto;
  background: #1e293b;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  border: 1px solid #334155;
}
header { text-align: center; border-bottom: 2px solid #334155; padding-bottom: 12px; }
h1 { color: #f59e0b; margin: 0 0 12px 0; font-size: 1.5rem; }
.stats-bar { display: flex; justify-content: space-around; font-weight: bold; color: #cbd5e1; background: #0f172a; padding: 10px; border-radius: 8px; }
#question-category { color: #38bdf8; font-size: 0.9rem; font-weight: bold; margin-bottom: 8px; }
#question-text { font-size: 1.25rem; margin-bottom: 20px; line-height: 1.4; }
.option-btn {
  width: 100%;
  padding: 14px 18px;
  margin-bottom: 10px;
  background: #334155;
  color: white;
  border: 2px solid #475569;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  text-align: right;
  transition: all 0.2s;
}
.option-btn:hover { background: #475569; border-color: #f59e0b; }
.option-btn.correct { background: #166534; border-color: #22c55e; }
.option-btn.wrong { background: #991b1b; border-color: #ef4444; }
.hidden { display: none; }
#explanation-box { background: #1e1b4b; border-right: 4px solid #818cf8; padding: 12px; border-radius: 6px; margin: 16px 0; color: #c7d2fe; line-height: 1.5; }
#next-btn { width: 100%; padding: 12px; background: #f59e0b; color: #0f172a; border: none; font-weight: bold; font-size: 1.1rem; border-radius: 8px; cursor: pointer; }
#next-btn:hover { background: #d97706; }`
      },
      {
        name: 'game.js',
        language: 'javascript',
        content: `// Interactive Jewish Trivia Game Script
const questions = [
  {
    q: "כמה ספרים יש בחמישה חומשי תורה?",
    cat: "תורה",
    options: ["3 ספרים", "5 ספרים", "7 ספרים", "12 ספרים"],
    correct: 1,
    exp: "חמישה חומשי תורה הם: בראשית, שמות, ויקרא, במדבר, דברים."
  },
  {
    q: "מה מברכים על לחם לפני האכילה?",
    cat: "ברכות",
    options: ["בורא פרי העץ", "שהכל נהיה בדברו", "המוציא לחם מן הארץ", "בורא מיני מזונות"],
    correct: 2,
    exp: "ברכת המוציא היא הברכה המיוחדת שתקנו חז\"ל על לחם מחמשת מיני דגן."
  },
  {
    q: "איזה חג נקרא גם 'חג הקציר' ו'יום הביכורים'?",
    cat: "חגים",
    options: ["פסח", "שבועות", "סוכות", "ראש השנה"],
    correct: 1,
    exp: "חג השבועות חל בזמן קציר החטים ובזמן הבאת הביכורים לבית המקדש."
  },
  {
    q: "מי היה המנהיג שהוביל את בני ישראל ביציאת מצרים?",
    cat: "תנ\"ך",
    options: ["אברהם אבינו", "משה רבנו", "יהושע בן נון", "דוד המלך"],
    correct: 1,
    exp: "משה רבנו, עבד ה', הנהיג את עמו ביציאה ממצרים וקבלת התורה בהר סיני."
  },
  {
    q: "מה קוראים במוצאי שבת בטקס ההבדלה על הנר?",
    cat: "שבת ומנהגים",
    options: ["בורא פרי הגפן", "בורא מאורי האש", "בורא מיני בשמים", "המבדיל בין קודש לחול"],
    correct: 1,
    exp: "מברכים 'בורא מאורי האש' על אור הנר שמוצאי שבת מנציח את גילוי האש לאדם הראשון."
  }
];

let currentIdx = 0;
let score = 0;
let streak = 0;
let timerVal = 20;
let timerInterval = null;

function loadQuestion() {
  clearInterval(timerInterval);
  timerVal = 20;
  document.getElementById('timer').innerText = timerVal;
  
  const q = questions[currentIdx];
  document.getElementById('question-category').innerText = q.cat;
  document.getElementById('question-text').innerText = q.q;
  document.getElementById('explanation-box').classList.add('hidden');
  document.getElementById('next-btn').classList.add('hidden');
  
  const optionsGrid = document.getElementById('options-grid');
  optionsGrid.innerHTML = '';
  
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerText = opt;
    btn.onclick = () => selectOption(idx);
    optionsGrid.appendChild(btn);
  });
  
  timerInterval = setInterval(() => {
    timerVal--;
    document.getElementById('timer').innerText = timerVal;
    if (timerVal <= 0) {
      clearInterval(timerInterval);
      selectOption(-1);
    }
  }, 1000);
}

function selectOption(idx) {
  clearInterval(timerInterval);
  const q = questions[currentIdx];
  const buttons = document.querySelectorAll('.option-btn');
  
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('correct');
    else if (i === idx) btn.classList.add('wrong');
  });
  
  if (idx === q.correct) {
    score += 100 + (streak * 20);
    streak++;
  } else {
    streak = 0;
  }
  
  document.getElementById('score').innerText = score;
  document.getElementById('streak').innerText = '🔥 ' + streak;
  
  const expBox = document.getElementById('explanation-box');
  expBox.innerText = '💡 מקור והסבר: ' + q.exp;
  expBox.classList.remove('hidden');
  
  const nextBtn = document.getElementById('next-btn');
  nextBtn.classList.remove('hidden');
}

document.getElementById('next-btn').onclick = () => {
  currentIdx = (currentIdx + 1) % questions.length;
  loadQuestion();
};

window.onload = loadQuestion;`
      }
    ]
  },
  {
    id: 'brachot-runner-game',
    title: 'מרוץ הברכות והכשרות',
    subtitle: 'משחק מהירות ואקשן מדויק למאיצי הברכות והכשרות',
    description: 'מיין מאכלים בזמן אמת! התאם לכל מאכל את הברכה הראשונה שלו ובדוק האם הוא כשר.',
    longDescription: 'מרוץ הברכות הוא משחק מהיר ומלהיב בו מאכלים שונים חולפים על המסך. התפקיד שלך הוא לבחור תוך שבריר שנייה את הברכה הראשונה הנכונה (המוציא, שהכל, העץ, האדמה, מזונות, הגפן) ולזהות מאכלים כשרים. ככל שאתה מדייק, הקצב עולה, הניקוד מוכפל ותזכה בתג "אלוף הברכות"!',
    category: 'ברכות והלכה',
    difficulty: 'בינוני',
    ageRating: 'גילאי 7+',
    playCount: 11800,
    rating: 4.8,
    ratingCount: 245,
    author: 'מדרשת המשחקים',
    tags: ['ברכות', 'כשרות', 'אקשן', 'מהירות', 'הלכה'],
    thumbnailBg: 'from-emerald-600 via-teal-700 to-emerald-900',
    iconName: 'Sparkles',
    instructions: [
      'מאכל יופיע במרכז המסך.',
      'לחץ במהירות על הברכה המתאימה (המוציא, שהכל, העץ, האדמה, מזונות, הגפן).',
      'היזהר! אם יופיע מאכל שלא כשר - לחץ על כפתור "לא כשר"!',
      'צברו 500 נקודות לקבלת מדליית זהב.'
    ],
    torahSource: 'מסכת ברכות דף ל"ה: "אסור לאדם שינהנה מן העולם הזה בלא ברכה"',
    gameType: 'brachot',
    isPopular: true,
    isNew: true,
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>מרוץ הברכות</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="game-box">
    <h1>🍎 מרוץ הברכות והכשרות 🍇</h1>
    <div class="score-board">
      <span>ניקוד: <strong id="score">0</strong></span>
      <span>פסילות: <strong id="lives">❤️❤️❤️</strong></span>
    </div>
    
    <div id="food-card">
      <div id="food-emoji">🍎</div>
      <div id="food-name">תפוח עץ מתוק</div>
    </div>

    <div class="brachot-grid">
      <button onclick="checkBracha('העץ')">🌳 בורא פרי העץ</button>
      <button onclick="checkBracha('האדמה')">🌱 בורא פרי האדמה</button>
      <button onclick="checkBracha('מזונות')">🌾 בורא מיני מזונות</button>
      <button onclick="checkBracha('שהכל')">🥛 שהכל נהיה בדברו</button>
      <button onclick="checkBracha('המוציא')">🍞 המוציא לחם</button>
      <button onclick="checkBracha('הגפן')">🍇 בורא פרי הגפן</button>
    </div>
  </div>
  <script src="game.js"></script>
</body>
</html>`
      },
      {
        name: 'style.css',
        language: 'css',
        content: `body {
  font-family: system-ui, sans-serif;
  background: #064e3b;
  color: white;
  direction: rtl;
  padding: 20px;
  display: flex;
  justify-content: center;
}
#game-box {
  background: #047857;
  padding: 24px;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  border: 2px solid #34d399;
}
h1 { margin-top: 0; color: #a7f3d0; font-size: 1.6rem; }
.score-board { display: flex; justify-content: space-between; font-size: 1.2rem; background: #065f46; padding: 10px 16px; border-radius: 12px; margin-bottom: 20px; }
#food-card { background: #022c22; border: 3px solid #10b981; border-radius: 16px; padding: 30px; margin-bottom: 24px; }
#food-emoji { font-size: 4.5rem; margin-bottom: 10px; }
#food-name { font-size: 1.5rem; font-weight: bold; color: #f0fdf4; }
.brachot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
button { background: #10b981; color: white; border: none; padding: 14px; border-radius: 12px; font-size: 1.05rem; font-weight: bold; cursor: pointer; transition: transform 0.1s, background 0.2s; }
button:hover { background: #059669; transform: scale(1.03); }`
      },
      {
        name: 'game.js',
        language: 'javascript',
        content: `const foodList = [
  { name: "תפוח עץ עסיסי", emoji: "🍎", bracha: "העץ" },
  { name: "מלפפון ירוק", emoji: "🥒", bracha: "האדמה" },
  { name: "לחמניית קודש", emoji: "🥖", bracha: "המוציא" },
  { name: "עוגת שוקולד", emoji: "🍰", bracha: "מזונות" },
  { name: "כוס מים צלולים", emoji: "💧", bracha: "שהכל" },
  { name: "מיץ ענבים מתוק", emoji: "🍷", bracha: "הגפן" },
  { name: "בננה צהובה", emoji: "🍌", bracha: "האדמה" },
  { name: "חטיף במבה", emoji: "🥜", bracha: "שהכל" }
];

let currentFood = null;
let score = 0;
let lives = 3;

function nextFood() {
  currentFood = foodList[Math.floor(Math.random() * foodList.length)];
  document.getElementById('food-emoji').innerText = currentFood.emoji;
  document.getElementById('food-name').innerText = currentFood.name;
}

function checkBracha(selectedBracha) {
  if (selectedBracha === currentFood.bracha) {
    score += 50;
    document.getElementById('score').innerText = score;
  } else {
    lives--;
    let hearts = '';
    for(let i=0; i<lives; i++) hearts += '❤️';
    document.getElementById('lives').innerText = hearts || '💔';
    if (lives <= 0) {
      alert('המשחק הסתיים! הניקוד הסופי שלך: ' + score);
      score = 0;
      lives = 3;
      document.getElementById('score').innerText = score;
      document.getElementById('lives').innerText = '❤️❤️❤️';
    }
  }
  nextFood();
}

window.onload = nextFood;`
      }
    ]
  },
  {
    id: 'shabbat-order-quest',
    title: 'סדר השבת - פאזל זיכרון ומנהגים',
    subtitle: 'משחק חינוכי מרתק לסידור שלבי כניסת השבת וזיהוי תשמישי קודש',
    description: 'מיין את שלבי השבת לפי הסדר הנכון - מהכנות בערב שבת, הדלקת נרות, קידוש, סעודה, זמירות ועד ההבדלה.',
    longDescription: 'המשחק "סדר השבת" מחבר את הילדים והמשפחה אל יופיה של השבת בעזרת משימות סדר כרונולוגי ומשחק זיכרון חזותי. עליך לגרום לכל תשמישי הקודש להתחבר למקומם המדויק, ללמוד על כוונות המנהגים וליהנות מצלילים מרגיעים.',
    category: 'שבת וחגים',
    difficulty: 'קל',
    ageRating: 'גילאי 4+',
    playCount: 9400,
    rating: 4.9,
    ratingCount: 189,
    author: 'מכון זהות וערכים',
    tags: ['שבת', 'חלות', 'קידוש', 'זיכרון', 'מנהגים'],
    thumbnailBg: 'from-blue-700 via-indigo-800 to-slate-900',
    iconName: 'Flame',
    instructions: [
      'גרור או לחץ על כרטיסי השבת לפי הסדר הכרונולוגי הנכון.',
      'מצא את הזוגות התואמים במשחק הזיכרון של תשמישי הקודש.',
      'למד את פסוקי הקידוש והזמירות של שבת.'
    ],
    torahSource: 'שמות פרק כ׳: "זָכוֹר אֶת יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ"',
    gameType: 'shabbat',
    isPopular: false,
    isNew: true,
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>סדר השבת</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="shabbat-app">
    <h1>🕯️ סדר השבת קודש 🍷</h1>
    <p>סדר את השלבים לפי הסדר הכרונולוגי הנכון מיום שישי ועד מוצאי שבת:</p>
    
    <div id="steps-container"></div>
    <div id="feedback"></div>
    <button id="verify-btn" onclick="verifyOrder()">בדוק את הסדר שלי ✨</button>
  </div>
  <script src="game.js"></script>
</body>
</html>`
      },
      {
        name: 'style.css',
        language: 'css',
        content: `body {
  font-family: system-ui, sans-serif;
  background: #1e1b4b;
  color: #e0e7ff;
  direction: rtl;
  padding: 20px;
}
#shabbat-app {
  max-width: 550px;
  margin: 0 auto;
  background: #312e81;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  border: 1px solid #4338ca;
}
h1 { color: #fde047; text-align: center; }
.step-card {
  background: #4338ca;
  padding: 14px 20px;
  margin: 10px 0;
  border-radius: 10px;
  cursor: grab;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2px solid #6366f1;
  font-weight: bold;
}
.step-card:hover { background: #4f46e5; }
#verify-btn {
  width: 100%;
  padding: 14px;
  background: #fde047;
  color: #1e1b4b;
  border: none;
  font-weight: bold;
  font-size: 1.1rem;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 16px;
}
#feedback { margin-top: 14px; text-align: center; font-size: 1.2rem; font-weight: bold; }`
      },
      {
        name: 'game.js',
        language: 'javascript',
        content: `const correctSteps = [
  "1. הכנות ובישולים לכבוד שבת",
  "2. הדלקת נרות שבת",
  "3. תפילת קבלת שבת ושלום עליכם",
  "4. קידוש על יין וסעודת ליל שבת",
  "5. סעודת יום שבת וזמירות",
  "6. הבדלה במוצאי שבת על הגפן והנר"
];

let currentSteps = [...correctSteps].sort(() => Math.random() - 0.5);

function render() {
  const container = document.getElementById('steps-container');
  container.innerHTML = '';
  currentSteps.forEach((step, idx) => {
    const card = document.createElement('div');
    card.className = 'step-card';
    card.innerText = step;
    card.onclick = () => moveUp(idx);
    container.appendChild(card);
  });
}

function moveUp(idx) {
  if (idx > 0) {
    const temp = currentSteps[idx];
    currentSteps[idx] = currentSteps[idx - 1];
    currentSteps[idx - 1] = temp;
    render();
  }
}

function verifyOrder() {
  const isCorrect = currentSteps.every((val, i) => val === correctSteps[i]);
  const fb = document.getElementById('feedback');
  if (isCorrect) {
    fb.style.color = '#4ade80';
    fb.innerText = '🎉 כל הכבוד! סידרת את השבת כהלכה!';
  } else {
    fb.style.color = '#f87171';
    fb.innerText = '❌ עדיין יש טעות בסדר, לחץ על הכרטיסים כדי לשנות מיקום.';
  }
}

window.onload = render;`
      }
    ]
  },
  {
    id: 'tanach-wordle-game',
    title: 'סייר התנ"ך - דמויות ומקומות',
    subtitle: 'משחק מילים ומחשבה לגילוי דמויות, שופטים, מלכים ומקומות בתנ"ך',
    description: 'נחש את דמות התנ"ך היומית בעזרת רמזים מתוך הפסוקים ומערכת אותיות חכמה.',
    longDescription: 'סייר התנ"ך הוא משחק אתגר מילים (בסגנון וורדל/Hangman) המוקדש כולו לתנ"ך. בכל סיבוב תועמד בפני דמות או מקום מקראי מסתורי. יש לך 6 נסיונות לגלות את השם בעזרת רמזים על השבט, התקופה או המעשים הידועים.',
    category: 'תנ"ך ומורשת',
    difficulty: 'מאתגר',
    ageRating: 'גילאי 8+',
    playCount: 16800,
    rating: 4.95,
    ratingCount: 420,
    author: 'מכון סיירי התנ"ך',
    tags: ['תנ"ך', 'משחק מילים', 'מחשבה', 'מנהיגים', 'פסוקים'],
    thumbnailBg: 'from-purple-800 via-purple-900 to-slate-900',
    iconName: 'Compass',
    instructions: [
      'הקלד שם של דמות תנ"כית בעלת מספר האותיות הנדרש.',
      'אות בירוק - קיימת בשם ובמיקום הנכון.',
      'אות בצהוב - קיימת בשם אך במיקום אחר.',
      'היעזר ברמז הפסוק בעת הצורך.'
    ],
    torahSource: 'יהושע פרק א׳: "וְהָגִיתָ בּוֹ יוֹמָם וָלַיְלָה"',
    gameType: 'tanach_wordle',
    isPopular: true,
    isNew: false,
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>סייר התנ"ך</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <h1>📜 סייר התנ"ך - גלה את הדמות 📜</h1>
    <div id="clue-box">רמז: "המנהיג שנלחם בגלית וחיבר את ספר תהילים"</div>
    
    <div id="attempts-grid"></div>
    
    <div id="input-area">
      <input type="text" id="guess-input" placeholder="הקלד שם דמות (למשל: דוד)" maxlength="10">
      <button onclick="submitGuess()">נחש 🎯</button>
    </div>
    <div id="status-msg"></div>
  </div>
  <script src="game.js"></script>
</body>
</html>`
      },
      {
        name: 'style.css',
        language: 'css',
        content: `body {
  font-family: system-ui, sans-serif;
  background: #2e1065;
  color: #f3e8ff;
  direction: rtl;
  padding: 20px;
}
#app {
  max-width: 500px;
  margin: 0 auto;
  background: #3b0764;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #6b21a8;
  text-align: center;
}
h1 { color: #e9d5ff; font-size: 1.4rem; }
#clue-box { background: #581c87; padding: 12px; border-radius: 10px; margin-bottom: 20px; color: #fef08a; font-weight: bold; }
#input-area { display: flex; gap: 10px; margin-top: 20px; }
input { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #a855f7; background: #2e1065; color: white; font-size: 1.1rem; text-align: center; }
button { background: #a855f7; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.row { display: flex; justify-content: center; gap: 6px; margin-bottom: 8px; }
.letter-box { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: bold; border-radius: 8px; background: #581c87; border: 1px solid #7e22ce; }
.letter-box.correct { background: #15803d; border-color: #22c55e; }
.letter-box.present { background: #a16207; border-color: #eab308; }
.letter-box.absent { background: #374151; border-color: #4b5563; }`
      },
      {
        name: 'game.js',
        language: 'javascript',
        content: `const secretWord = "דוד";

function submitGuess() {
  const input = document.getElementById('guess-input');
  const val = input.value.trim();
  if (!val) return;
  
  const grid = document.getElementById('attempts-grid');
  const row = document.createElement('div');
  row.className = 'row';
  
  for(let i=0; i<val.length; i++) {
    const box = document.createElement('div');
    box.className = 'letter-box';
    const char = val[i];
    box.innerText = char;
    
    if (secretWord[i] === char) {
      box.classList.add('correct');
    } else if (secretWord.includes(char)) {
      box.classList.add('present');
    } else {
      box.classList.add('absent');
    }
    row.appendChild(box);
  }
  
  grid.appendChild(row);
  
  if (val === secretWord) {
    document.getElementById('status-msg').innerText = '🏆 כל הכבוד! מצאת את דוד המלך!';
  }
  input.value = '';
}`
      }
    ]
  },
  {
    id: 'menorah-puzzle-game',
    title: 'פאזל המנורה ובית המקדש',
    subtitle: 'משחק אסטרטגיה וחשיבה להארת שבעת קני המנורה הטהורה',
    description: 'חבר את צינורות שמן הזית הזך והמראות כדי להאיר את המנורה בבית המקדש.',
    longDescription: 'משחק פאזל לוגי ואסטרטגי. עליך לסובב מראות וצינורות זהב על לוח המשחק כדי להוביל את אלומת האור משמן הזית הזך אל שבעת הקנים של מנורת הזהב.',
    category: 'חשיבה ופאזל',
    difficulty: 'בינוני',
    ageRating: 'גילאי 7+',
    playCount: 8200,
    rating: 4.85,
    ratingCount: 154,
    author: 'חוקרי המקדש',
    tags: ['המקדש', 'מנורה', 'חשיבה', 'פאזל', 'אסטרטגיה'],
    thumbnailBg: 'from-yellow-600 via-amber-600 to-yellow-800',
    iconName: 'Crown',
    instructions: [
      'לחץ על האריחים כדי לסובב את המראות וצינורות השמן.',
      'וודא שהאור מגיע לכל שבעת הקנים של המנורה.',
      'פתור את השלב במספר המהלכים המינימלי.'
    ],
    torahSource: 'שמות פרק כ״ה: "וְעָשִׂיתָ מְנֹרַת זָהָב טָהוֹר"',
    gameType: 'menorah_puzzle',
    isPopular: false,
    isNew: true,
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>פאזל המנורה</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="menorah-app">
    <h1>👑 הארת מנורת הזהב 👑</h1>
    <p>לחץ על הקנים כדי להדליק את שבעת הנרות בזהורית זהב!</p>
    <div id="menorah-display">
      <div class="candle" onclick="light(0)">🕯️</div>
      <div class="candle" onclick="light(1)">🕯️</div>
      <div class="candle" onclick="light(2)">🕯️</div>
      <div class="candle center" onclick="light(3)">🕯️</div>
      <div class="candle" onclick="light(4)">🕯️</div>
      <div class="candle" onclick="light(5)">🕯️</div>
      <div class="candle" onclick="light(6)">🕯️</div>
    </div>
    <div id="status">נרות דולקים: <span id="lit-count">0</span> / 7</div>
  </div>
  <script src="game.js"></script>
</body>
</html>`
      },
      {
        name: 'style.css',
        language: 'css',
        content: `body {
  font-family: system-ui, sans-serif;
  background: #451a03;
  color: #fef3c7;
  direction: rtl;
  padding: 20px;
  text-align: center;
}
#menorah-app {
  max-width: 500px;
  margin: 0 auto;
  background: #78350f;
  padding: 24px;
  border-radius: 16px;
  border: 2px solid #f59e0b;
}
#menorah-display { display: flex; justify-content: center; gap: 12px; margin: 30px 0; }
.candle {
  font-size: 2.5rem;
  cursor: pointer;
  filter: grayscale(100%);
  transition: all 0.3s;
}
.candle.lit {
  filter: grayscale(0%);
  text-shadow: 0 0 20px #f59e0b;
  transform: scale(1.15);
}
#status { font-size: 1.2rem; font-weight: bold; }`
      },
      {
        name: 'game.js',
        language: 'javascript',
        content: `let candles = [false, false, false, false, false, false, false];

function light(idx) {
  candles[idx] = !candles[idx];
  // Toggle adjacent
  if (idx > 0) candles[idx-1] = !candles[idx-1];
  if (idx < 6) candles[idx+1] = !candles[idx+1];
  
  const elems = document.querySelectorAll('.candle');
  let count = 0;
  candles.forEach((isLit, i) => {
    if (isLit) {
      elems[i].classList.add('lit');
      count++;
    } else {
      elems[i].classList.remove('lit');
    }
  });
  
  document.getElementById('lit-count').innerText = count;
  if (count === 7) {
    alert('✨ אשריכם! המנורה כולה מאירה באור זהב טהור!');
  }
}`
      }
    ]
  }
];
