import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const CHATS_FILE = path.join(process.cwd(), "chats.json");

// Helper to read/write chats
const getChats = () => {
  if (!fs.existsSync(CHATS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(CHATS_FILE, "utf-8"));
  } catch (e) {
    return [];
  }
};

const saveChats = (chats: any) => {
  fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
};

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${APP_URL}/auth/google/callback`
);

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Chat History API
app.get("/api/chats", (req, res) => {
  const chats = getChats();
  // Return metadata including mode
  res.json(chats.map((c: any) => ({ 
    id: c.id, 
    title: c.title, 
    timestamp: c.timestamp,
    mode: c.mode || 'normal' // Default to normal for existing chats
  })));
});

app.post("/api/chats", (req, res) => {
  const { title, mode } = req.body;
  const chats = getChats();
  const newChat = {
    id: Date.now().toString(),
    title: title || "New Chat",
    timestamp: new Date().toISOString(),
    mode: mode || 'normal',
    messages: []
  };
  chats.push(newChat);
  saveChats(chats);
  res.json(newChat);
});

app.get("/api/chats/:id", (req, res) => {
  const chats = getChats();
  const chat = chats.find((c: any) => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: "Chat not found" });
  res.json(chat);
});

app.post("/api/chats/:id/messages", (req, res) => {
  const { message } = req.body;
  const chats = getChats();
  const chatIndex = chats.findIndex((c: any) => c.id === req.params.id);
  if (chatIndex === -1) return res.status(404).json({ error: "Chat not found" });
  
  chats[chatIndex].messages.push(message);
  saveChats(chats);
  res.json(chats[chatIndex]);
});

app.delete("/api/chats/:id", (req, res) => {
  let chats = getChats();
  chats = chats.filter((c: any) => c.id !== req.params.id);
  saveChats(chats);
  res.json({ success: true });
});

// Google OAuth URL
app.get("/api/auth/google/url", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "select_account",
  });
  res.json({ url });
});

// Google OAuth Callback
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    // In a real app, you'd save these tokens to a session or database
    // For this demo, we'll just pass a success message back
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// GitHub OAuth URL
app.get("/api/auth/github/url", (req, res) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.status(500).json({ error: "GitHub credentials not configured in .env" });
  }
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user`;
  res.json({ url });
});

// GitHub OAuth Callback
app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data: any = await response.json();
    if (data.error) throw new Error(data.error_description);

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${data.access_token}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

// Publish to GitHub
app.post("/api/github/publish", async (req, res) => {
  const { token, repoName, description, code } = req.body;
  if (!token || !repoName || !code) return res.status(400).json({ error: "Missing required fields" });

  try {
    // 1. Create Repo
    const createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repoName,
        description: description || "Created with Champ AI",
        auto_init: true,
        private: false,
      }),
    });

    if (!createRes.ok) {
      const err: any = await createRes.json();
      throw new Error(err.message || "Failed to create repo");
    }

    const repo: any = await createRes.json();
    const owner = repo.owner.login;

    // 2. Create/Update index.html
    const fileRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/index.html`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Initial commit from Champ AI",
        content: Buffer.from(code).toString("base64"),
        branch: "main",
      }),
    });

    if (!fileRes.ok) {
        const err: any = await fileRes.json();
        throw new Error(err.message || "Failed to upload file");
    }

    // 3. Enable GitHub Pages
    try {
        await fetch(`https://api.github.com/repos/${owner}/${repoName}/pages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                source: { branch: "main", path: "/" }
            })
        });
    } catch (e) {
        console.warn("Failed to enable Pages", e);
    }

    res.json({ success: true, repoUrl: repo.html_url, pagesUrl: `https://${owner}.github.io/${repoName}/` });

  } catch (error: any) {
    console.error("Publish Error:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
