import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

console.log('🔍 Checking your Neon database...\n');

// Check tables
const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
console.log('📋 Tables in your database:');
if (tables.length === 0) {
    console.log('   ❌ No tables found! Database is empty.\n');
} else {
    tables.forEach(t => console.log(`   ✅ ${t.table_name}`));
    console.log('');
}

// Check questions
const questions = await sql`SELECT id, sport_type, text, correct_answer FROM questions`;
console.log(`📊 Questions in database: ${questions.length}\n`);

if (questions.length > 0) {
    questions.forEach((q, i) => {
        console.log(`${i + 1}. [${q.sport_type}] ${q.text}`);
        console.log(`   Answer: ${q.correct_answer}\n`);
    });
} else {
    console.log('   No questions found. Run: node run-schema.mjs to add sample data.\n');
}
