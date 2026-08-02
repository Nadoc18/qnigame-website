import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Set proper MIME types and headers for WebAssembly & Unity WebGL builds
  app.use((req, res, next) => {
    const url = req.path.toLowerCase();
    if (url.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    } else if (url.endsWith('.wasm.gz')) {
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('Content-Encoding', 'gzip');
    } else if (url.endsWith('.wasm.br')) {
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('Content-Encoding', 'br');
    } else if (url.endsWith('.js.gz') || url.endsWith('.framework.js.gz')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Content-Encoding', 'gzip');
    } else if (url.endsWith('.data.gz') || url.endsWith('.data.br')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      if (url.endsWith('.gz')) res.setHeader('Content-Encoding', 'gzip');
      if (url.endsWith('.br')) res.setHeader('Content-Encoding', 'br');
    } else if (url.endsWith('.data')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    next();
  });

  // Helper to load games from public/games.json
  const getGamesFromJson = () => {
    try {
      const jsonPath = path.join(process.cwd(), 'public', 'games.json');
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to read games.json:', e);
    }
    return [];
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GET /api/games - Fetch all games from games.json
  app.get("/api/games", (req, res) => {
    const games = getGamesFromJson();
    res.json({
      success: true,
      source: "Qnigame JSON Database",
      total: games.length,
      lastUpdated: new Date().toISOString(),
      games
    });
  });

  // Helper to save games to public/games.json
  const saveGamesToJson = (games: any[]) => {
    try {
      const jsonPath = path.join(process.cwd(), 'public', 'games.json');
      fs.writeFileSync(jsonPath, JSON.stringify(games, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save games.json:', e);
    }
  };

  // POST /api/games - Add a new game to games.json
  app.post("/api/games", (req, res) => {
    const newGame = req.body;
    if (!newGame || !newGame.title) {
      return res.status(400).json({ success: false, error: "Missing required game title" });
    }

    const id = newGame.id || `game-${Date.now()}`;
    const gameRecord = {
      id,
      title: newGame.title,
      subtitle: newGame.subtitle || 'משחק חדש',
      description: newGame.description || 'משחק חדש שהתווסף לספרייה',
      longDescription: newGame.longDescription || newGame.description || '',
      category: newGame.category || 'טריוויה ודעת',
      difficulty: newGame.difficulty || 'לכל המשפחה',
      ageRating: newGame.ageRating || 'גילאי 6+',
      playCount: newGame.playCount || 1,
      rating: newGame.rating || 5.0,
      ratingCount: newGame.ratingCount || 1,
      author: newGame.author || 'יוצר המשחק',
      tags: newGame.tags || ['משחק חדש'],
      thumbnailBg: newGame.thumbnailBg || 'from-emerald-600 via-teal-700 to-emerald-900',
      thumbnailUrl: newGame.thumbnailUrl || newGame.imageUrl || newGame.thumbnail || newGame.image || newGame.photo || undefined,
      imageUrl: newGame.imageUrl || newGame.thumbnailUrl || newGame.thumbnail || newGame.image || newGame.photo || undefined,
      iconName: newGame.iconName || 'Gamepad2',
      instructions: newGame.instructions || ['לחץ על שחק כדי להתחיל'],
      torahSource: newGame.torahSource || 'קניגיים Qnigame - עננים של דעת',
      gameType: newGame.gameType || 'trivia',
      externalUrl: newGame.externalUrl || newGame.playUrl || `https://qnigame.com/play/${id}`,
      files: newGame.files || [],
      isPopular: false,
      isNew: true
    };

    const games = getGamesFromJson();
    const existingIdx = games.findIndex((g: any) => g.id === id);
    if (existingIdx >= 0) {
      games[existingIdx] = { ...games[existingIdx], ...gameRecord };
    } else {
      games.unshift(gameRecord);
    }
    saveGamesToJson(games);

    res.json({
      success: true,
      message: "המשחק התווסף בהצלחה לספריית המשחקים!",
      game: gameRecord,
      totalGames: games.length
    });
  });

  // POST /api/games/sync - Sync with an external Cloud JSON URL
  app.post("/api/games/sync", async (req, res) => {
    const { cloudUrl } = req.body;
    if (!cloudUrl) {
      return res.status(400).json({ success: false, error: "לא צוינה כתובת ענן (cloudUrl)" });
    }

    try {
      const response = await fetch(cloudUrl);
      if (!response.ok) {
        throw new Error(`שגיאת תקשורת מהענן: ${response.statusText}`);
      }
      const data = await response.json();
      const gamesArray = Array.isArray(data) ? data : (data.games || []);

      const games = getGamesFromJson();
      if (gamesArray.length > 0) {
        gamesArray.forEach((g: any) => {
          if (g.id && g.title) {
            const idx = games.findIndex((existing: any) => existing.id === g.id);
            if (idx >= 0) {
              games[idx] = { ...games[idx], ...g };
            } else {
              games.push(g);
            }
          }
        });
        saveGamesToJson(games);
      }

      res.json({
        success: true,
        message: `סונכרנו בהצלחה ${gamesArray.length} משחקים מהענן!`,
        totalGames: games.length,
        games
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `שגיאה בסנכרון מהענן: ${err.message || 'שגיאה בלתי צפויה'}`
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
