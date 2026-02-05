import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const sql = neon(process.env.DATABASE_URL);

// Get all available sports
app.get('/api/sports', async (req, res) => {
    try {
        const result = await sql`
      SELECT DISTINCT sport_type FROM questions ORDER BY sport_type
    `;
        res.json(result.map(r => r.sport_type));
    } catch (error) {
        console.error('Error fetching sports:', error);
        res.status(500).json({ error: 'Failed to fetch sports' });
    }
});

// Get questions by sport (or all if sport=ALL)
app.get('/api/questions', async (req, res) => {
    try {
        const { sport, limit = 10 } = req.query;

        let result;
        if (sport && sport !== 'ALL') {
            result = await sql`
        SELECT id, text, correct_answer, answer_variants, sport_type, difficulty, question_type, required_answers
        FROM questions 
        WHERE sport_type = ${sport}
        ORDER BY RANDOM()
        LIMIT ${parseInt(limit)}
      `;
        } else {
            result = await sql`
        SELECT id, text, correct_answer, answer_variants, sport_type, difficulty, question_type, required_answers
        FROM questions 
        ORDER BY RANDOM()
        LIMIT ${parseInt(limit)}
      `;
        }

        res.json(result);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Get question count by sport
app.get('/api/questions/count', async (req, res) => {
    try {
        const result = await sql`
      SELECT sport_type, COUNT(*) as count 
      FROM questions 
      GROUP BY sport_type
    `;
        const total = await sql`SELECT COUNT(*) as total FROM questions`;
        res.json({
            byType: result,
            total: parseInt(total[0].total)
        });
    } catch (error) {
        console.error('Error fetching count:', error);
        res.status(500).json({ error: 'Failed to fetch count' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Glitch Sports Trivia API running on http://localhost:${PORT}`);
    console.log(`   GET /api/sports - List all sports`);
    console.log(`   GET /api/questions?sport=NFL&limit=10 - Get questions`);
    console.log(`   GET /api/questions/count - Get question counts`);
});
