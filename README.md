# CP Insight 🚀

**The Ultimate Analytics Platform for Competitive Programmers**

CP Insight is a robust, production-ready full-stack application designed to aggregate user data across platforms like Codeforces and LeetCode. It features an advanced mathematical Intelligence Engine to predict future contest ratings, identify weak topics, and generate customized daily practice plans.

---

## 🌟 Key Features
- **Deep Analytics Dashboard:** Premium, responsive UI featuring glassmorphism design, dark mode, and interactive `Recharts` data visualizations.
- **Asynchronous Data Sync:** Utilizes **BullMQ** and **Redis** to fetch thousands of submissions from Codeforces and LeetCode GraphQL APIs in the background, fully decoupled from the main web server.
- **Statistical Rating Predictor:** Built-in Node.js math engine that calculates Exponential Moving Averages (EMA) and Simple Linear Regressions to forecast future contest ratings.
- **Smart Recommendation Engine:** A rule-based heuristic engine that identifies user weaknesses and generates adaptive 3-day cyclic training plans.
- **Graceful Degradation (Demo Mode):** The frontend gracefully falls back to presentation mock data if the PostgreSQL/Redis backend is offline.

---

## 🏗️ System Architecture & Tech Stack
- **Frontend:** Next.js (App Router), React, TypeScript, Pure Vanilla CSS (Glassmorphism design system), Recharts.
- **Backend API:** Node.js, Express.js, TypeScript.
- **Database:** PostgreSQL accessed via Prisma ORM.
- **Message Queue & Caching:** Redis powering BullMQ background sync workers.

---

## 🚀 Running the Project Locally

### Prerequisites
- Node.js (v18+)
- Docker Desktop (Required for PostgreSQL & Redis)

### 1. Start the Database and Queue
Open a terminal in the root directory and start the Docker containers:
```bash
docker-compose up -d
```
*(This starts PostgreSQL on port 5432 and Redis on port 6379)*

### 2. Configure the Backend
Navigate to the `backend` folder:
```bash
cd backend
npm install
```
Push the Prisma schema to the database:
```bash
npx prisma db push
```
Start the Express server:
```bash
npm run dev
```
*(The backend API and BullMQ sync worker are now running on `http://localhost:5000`)*

### 3. Start the Frontend
Open a new terminal, navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
Navigate to **`http://localhost:3000/dashboard`** in your browser to view the application!

---

## 📂 Project Structure
* `frontend/`: The Next.js application, including the custom CSS design system and Recharts visualizations.
* `backend/`: The Express API server, Prisma schema, BullMQ worker configuration, and the Intelligence Engine.
* `docker-compose.yml`: Local infrastructure configuration for Postgres and Redis.
