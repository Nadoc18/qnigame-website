---
description: "Use when editing workspace editor behavior, JavaScript files, or MJS files in this project. Keeps Live Server previewing and JavaScript language support consistent."
applyTo: ["**/*.{js,mjs,ts,tsx,html,css,json}"]
---

# Workspace Editor Guidance

- Keep Live Server watching the workspace by leaving liveServer.settings.ignoreFiles empty.
- Treat .js and .mjs files as JavaScript in the editor so syntax highlighting and IntelliSense stay consistent.
- Preserve workspace-level editor settings in .vscode/settings.json when changing project behavior.
