import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function verifyData() {
    const sql = neon(process.env.DATABASE_URL);

    console.log('📊 Checking database tables...\n');

    const questions = await sql`SELECT id, text, sport_type, correct_answer FROM questions`;
    console.log('Questions Table:');
    console.table(questions);

    const userStats = await sql`SELECT * FROM user_stats`;
    console.log('\nUser Stats Table:');
    console.table(userStats);
}

verifyData();
