# 5Paisa Trading Suite — Cloud Deploy on Railway (FREE)

## How it works

```
Your Browser → Railway Cloud (Node.js proxy) → 5Paisa API
```

5Paisa blocks direct browser calls (CORS). The Node.js server on Railway handles all API calls server-side.

---

## Deploy in 5 minutes

### 1. Upload to GitHub
Create a new repo at github.com/new, then:
```bash
cd 5paisa-app
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/5paisa-trading-suite.git
git push -u origin main
```

### 2. Deploy on Railway (free)
1. Go to railway.app → Sign up free
2. New Project → Deploy from GitHub repo
3. Select your repo — Railway auto-detects Node.js and deploys ✅
4. Go to Settings → Domains → Generate Domain
5. Your app is live at: https://your-app.up.railway.app 🚀

### 3. No env variables needed
Credentials are entered at login time in the browser UI.

---

## Local development
```bash
npm install
node server.js
# Open http://localhost:3000
```

---

## Alternative free platforms

| Platform | Steps |
|---|---|
| Render | render.com → New Web Service → GitHub → Start Command: node server.js |
| Fly.io | flyctl launch → flyctl deploy |
| Cyclic | cyclic.sh → Link GitHub repo |
