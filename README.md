# 🎮 Glitch Sports Trivia

A weird sports trivia game featuring obscure and "cursed" facts from NFL, NBA, MLB, and NHL history.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the app (starts both frontend + API)
npm start
```

Then open **http://localhost:5173** in your browser!

## 📝 Managing Questions

Questions are stored in a **Neon PostgreSQL database**. Add new questions via the Neon SQL Editor:

```sql
-- Single answer question
INSERT INTO questions (text, correct_answer, answer_variants, sport_type, difficulty) 
VALUES (
  'Which NBA player scored 100 points in a single game?', 
  'Wilt Chamberlain', 
  ARRAY['Wilt', 'Chamberlain'], 
  'NBA', 
  'easy'
);

-- Multi-answer question (8 boxes)
INSERT INTO questions (text, correct_answer, answer_variants, sport_type, difficulty, question_type, required_answers) 
VALUES (
  'Name the 8 teams that appeared in the Super Bowl since 2018',
  'Patriots',
  ARRAY['Patriots', 'Rams', 'Chiefs', '49ers', 'Buccaneers', 'Bengals', 'Eagles', 'Chiefs'],
  'NFL',
  'hard',
  'multi',
  8
);
```

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js API
- **Database**: Neon (Serverless PostgreSQL)
- **Animations**: Framer Motion

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   └── TriviaArena.tsx    # Main game component
│   └── hooks/
│       ├── useQuestions.ts    # Fetches questions from API
│       └── useGameAudio.ts    # Sound effects
├── server.mjs                 # Express API server
├── schema.sql                 # Database schema
└── .env                       # Database connection (not in repo)
```

## 🔐 Environment Variables

Create a `.env` file with your Neon connection string:

```
DATABASE_URL=postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run frontend + API together |
| `npm run dev` | Run frontend only |
| `npm run server` | Run API only |
| `node sql.mjs "SQL"` | Run raw SQL queries |

---

Built with a love for weird sports facts
