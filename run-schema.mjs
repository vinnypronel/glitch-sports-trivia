import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';

async function runSchema() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('DATABASE_URL is not set. Please check your .env file.');
        process.exit(1);
    }

    const sql = neon(connectionString);

    console.log('Connecting to Neon database...');

    try {
        // Drop existing tables first (in reverse dependency order)
        console.log('Dropping existing tables...');
        await sql`DROP TABLE IF EXISTS game_logs CASCADE`;
        await sql`DROP TABLE IF EXISTS user_stats CASCADE`;
        await sql`DROP TABLE IF EXISTS questions CASCADE`;

        // Create questions table
        console.log('Creating questions table...');
        await sql`
      CREATE TABLE questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        answer_variants TEXT[],
        sport_type VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
        weirdness_score INTEGER DEFAULT 0,
        is_cursed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

        // Create user_stats table
        console.log('Creating user_stats table...');
        await sql`
      CREATE TABLE user_stats (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE,
        current_streak INTEGER DEFAULT 0,
        highest_score INTEGER DEFAULT 0,
        power_ups_owned JSONB DEFAULT '{"hail_mary": 3, "instant_replay": 3}'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

        // Create game_logs table
        console.log('Creating game_logs table...');
        await sql`
      CREATE TABLE game_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES user_stats(user_id),
        question_id INTEGER REFERENCES questions(id),
        is_correct BOOLEAN NOT NULL,
        user_input TEXT,
        time_taken INTEGER,
        attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

        // Insert sample data
        console.log('Inserting sample trivia data...');
        await sql`
      INSERT INTO questions (text, correct_answer, answer_variants, sport_type, difficulty, weirdness_score, is_cursed) VALUES
      ('Which NFL team is the only franchise with a logo that faces left?', 'Philadelphia Eagles', ARRAY['Eagles', 'The Philadelphia Eagles', 'Philly Eagles'], 'NFL', 'medium', 8, false),
      ('Gaylord Perry hit his only career home run on the exact same day that which man walked on the moon?', 'Neil Armstrong', ARRAY['Armstrong'], 'MLB', 'hard', 10, true),
      ('In 1961, Wilt Chamberlain set an unbreakable record by averaging how many minutes per game?', '48.5', ARRAY['48.5 minutes', '48.5 mins'], 'NBA', 'medium', 9, false),
      ('The Stanley Cup features several misspellings; which team is famously spelled as BQSTQN BRUINS?', 'Boston Bruins', ARRAY['Bruins', 'The Boston Bruins'], 'NHL', 'hard', 9, true),
      ('What is the only MLB team that does not have the city name on their home or road jerseys?', 'Los Angeles Angels', ARRAY['Angels'], 'MLB', 'medium', 7, false),
      ('In 1987, which NFL team technically won their division despite using replacement players during a strike?', 'Washington Redskins', ARRAY['Redskins', 'Washington Commanders'], 'NFL', 'hard', 8, true)
    `;

        console.log('✅ Schema successfully applied to Neon database!');
    } catch (error) {
        console.error('Error applying schema:', error);
        process.exit(1);
    }
}

runSchema();
