# CP Insights 🚀

A full-stack competitive programming dashboard I built to track my progress across Codeforces and LeetCode in one seamless view. 

Instead of just showing raw numbers, it uses a custom-built Codeforces Elo algorithm to mathematically predict future ratings, and analyzes problem-solving history to recommend exactly what topics to practice based on current skill level.

## ✨ What it actually does
- **Live Delta Predictor:** I reverse-engineered the Codeforces rating distribution into a calibrated logarithmic curve. Plug in your rank after a contest, and it instantly (and accurately) predicts your rating drop/gain.
- **Smart Weakness Detection:** It maps your solved problems against rating-specific topic pools. It knows your skill tier, so it won't tell a beginner to practice advanced Segment Trees.
- **One Clean Dashboard:** A sleek, premium dark-mode UI built from scratch using pure CSS glassmorphism principles and React.

## 🛠️ Tech Stack
- **Frontend:** Next.js (React), TypeScript, Recharts, Custom CSS
- **Backend:** Node.js, Express, Prisma ORM, SQLite
- **Data Ingestion:** Custom sync workers pulling directly from the Codeforces & LeetCode APIs

## 🚀 How to run it locally

Since the backend uses a local SQLite database, there is no messy database configuration required. It runs right out of the box!

**1. Start the Backend API:**
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

**2. Start the Frontend Dashboard:**
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Then just open `http://localhost:3000/dashboard` in your browser!
