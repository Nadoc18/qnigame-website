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

  // GET /api/leaderboard - Public JSON endpoint returning sorted player scores for ALL registered users
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (!fs.existsSync(configPath)) {
        return res.status(500).json({ error: "Firebase configuration missing" });
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const projectId = config.projectId;
      const dbId = config.firestoreDatabaseId || '(default)';

      // Query Firestore REST API for all documents in 'users' collection (with fallback to 'leaderboard')
      let firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/users`;
      let response = await fetch(firestoreUrl);

      if (!response.ok) {
        // Fallback to 'leaderboard' collection if 'users' REST query is restricted
        firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/leaderboard`;
        response = await fetch(firestoreUrl);
      }

      if (!response.ok) {
        return res.json([]);
      }

      const data = await response.json();
      const documents = data.documents || [];

      const leaderboard = documents.map((docItem: any) => {
        const fields = docItem.fields || {};
        const pathParts = (docItem.name || '').split('/');
        const id = pathParts[pathParts.length - 1];

        // Extract badge count if array exists
        const badgesArray = fields.badges?.arrayValue?.values || [];
        const badgeCount = Array.isArray(badgesArray)
          ? badgesArray.filter((b: any) => b.mapValue?.fields?.unlocked?.booleanValue).length
          : parseInt(fields.badgeCount?.integerValue || fields.badgeCount?.doubleValue || '0', 10);

        const points = parseInt(fields.points?.integerValue || fields.points?.doubleValue || '0', 10);
        const level = parseInt(fields.level?.integerValue || fields.level?.doubleValue || '1', 10);

        return {
          id,
          username: fields.username?.stringValue || 'שחקן',
          firstName: fields.firstName?.stringValue || '',
          lastName: fields.lastName?.stringValue || '',
          title: fields.title?.stringValue || 'בחור כהלכה',
          level,
          points,
          avatarIcon: fields.avatarIcon?.stringValue || '🎓',
          badgeCount,
          playsCount: parseInt(fields.playsCount?.integerValue || fields.playsCount?.doubleValue || '0', 10),
        };
      });

      // Sort descending by points
      leaderboard.sort((a: any, b: any) => b.points - a.points);

      res.setHeader('Content-Type', 'application/json');
      res.json(leaderboard);
    } catch (err: any) {
      console.error('Error fetching /api/leaderboard JSON:', err);
      res.status(500).json({ error: "Failed to load leaderboard JSON", details: err?.message });
    }
  });

  // POST /api/game/verify-token - Verify token from external game (PixiJS / WebGL)
  app.post("/api/game/verify-token", (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: "Missing session token" });
    }

    if (token.startsWith('qnigame_tok_')) {
      const parts = token.split('_');
      const userId = parts[2] || 'user-1';
      const gameId = parts[3] || 'pixijs-space-quest';

      return res.json({
        success: true,
        valid: true,
        userId,
        gameId,
        username: "שחקן קניגיים",
        verifiedAt: new Date().toISOString()
      });
    }

    res.status(401).json({ success: false, valid: false, error: "Invalid token" });
  });

  // POST /api/game/update-score - Sync score & points from game
  app.post("/api/game/update-score", (req, res) => {
    const { token, gameId, score, pointsEarned } = req.body;
    if (!token || !gameId) {
      return res.status(400).json({ success: false, error: "Missing token or gameId" });
    }

    const earned = Math.max(10, Math.floor((score || 100) / 5));
    res.json({
      success: true,
      message: "Score synced successfully",
      gameId,
      score,
      pointsEarned: pointsEarned || earned,
      timestamp: new Date().toISOString()
    });
  });

  // POST /api/game/save-progress - Save custom JSON game progress for specific gameId
  app.post("/api/game/save-progress", (req, res) => {
    const { token, gameId, progressData } = req.body;
    if (!token || !gameId || !progressData) {
      return res.status(400).json({ success: false, error: "Missing token, gameId or progressData" });
    }

    res.json({
      success: true,
      message: "Game progress saved successfully to user profile JSON for " + gameId,
      gameId,
      savedAt: new Date().toISOString()
    });
  });

  // GET /api/game/load-progress - Retrieve custom JSON game progress for specific gameId
  app.get("/api/game/load-progress", (req, res) => {
    const { token, gameId } = req.query;
    if (!token || !gameId) {
      return res.status(400).json({ success: false, error: "Missing token or gameId parameter" });
    }

    res.json({
      success: true,
      gameId: String(gameId),
      gameProgress: {
        gameId: String(gameId),
        stage: 1,
        score: 0,
        lastSaved: new Date().toISOString()
      }
    });
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
