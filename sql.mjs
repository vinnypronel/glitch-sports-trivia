import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Get the SQL from command line arguments
const query = process.argv.slice(2).join(' ');

if (!query) {
    console.log(`
📊 Neon SQL Runner
Usage: node sql.mjs "YOUR SQL QUERY HERE"

Examples:
  node sql.mjs "SELECT * FROM questions"
  node sql.mjs "INSERT INTO questions (text, correct_answer, answer_variants, sport_type, difficulty, is_cursed) VALUES ('Your question?', 'Answer', ARRAY['alt1', 'alt2'], 'NFL', 'medium', false)"
  `);
    process.exit(0);
}

try {
    console.log('Running query...\n');
    const result = await sql.unsafe(query);
    console.log('Result:');
    console.table(result);
} catch (error) {
    console.error('Error:', error.message);
}
