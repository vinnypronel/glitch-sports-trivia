#!/usr/bin/env node
/**
 * Add Question Script for Glitch Sports Trivia
 * 
 * Usage:
 *   node add-question.mjs
 * 
 * This will prompt you for:
 * - Question text
 * - Correct answer
 * - Answer variants (comma-separated)
 * - Sport type (NFL, NBA, MLB, NHL)
 * - Difficulty (easy, medium, hard)
 * - Is cursed? (weird/crazy stat)
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as readline from 'readline';

const sql = neon(process.env.DATABASE_URL);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

async function addQuestion() {
    console.log('\n🏈 Glitch Sports Trivia - Add New Question\n');
    console.log('─'.repeat(50));

    try {
        const text = await ask('📝 Question text:\n> ');
        const correct_answer = await ask('\n✅ Correct answer:\n> ');
        const variantsRaw = await ask('\n🔄 Answer variants (comma-separated, e.g. "Eagles, The Eagles"):\n> ');
        const answer_variants = variantsRaw.split(',').map(v => v.trim()).filter(v => v);

        console.log('\n🏟️ Sport type options: NFL, NBA, MLB, NHL');
        const sport_type = (await ask('> ')).toUpperCase();

        console.log('\n⭐ Difficulty options: easy, medium, hard');
        const difficulty = (await ask('> ')).toLowerCase();

        const is_cursed_raw = await ask('\n👻 Is this a "Cursed Stat" (weird/crazy)? (y/n):\n> ');
        const is_cursed = is_cursed_raw.toLowerCase() === 'y';

        // Calculate weirdness score based on cursed status
        const weirdness_score = is_cursed ? Math.floor(Math.random() * 3) + 8 : Math.floor(Math.random() * 5) + 3;

        console.log('\n📊 Saving to database...');

        await sql`
      INSERT INTO questions (text, correct_answer, answer_variants, sport_type, difficulty, weirdness_score, is_cursed)
      VALUES (${text}, ${correct_answer}, ${answer_variants}, ${sport_type}, ${difficulty}, ${weirdness_score}, ${is_cursed})
    `;

        console.log('\n✅ Question added successfully!\n');

        const addAnother = await ask('Add another question? (y/n): ');
        if (addAnother.toLowerCase() === 'y') {
            await addQuestion();
        } else {
            console.log('\n👋 Done! Your questions are live.\n');
            rl.close();
        }
    } catch (error) {
        console.error('\n❌ Error adding question:', error.message);
        rl.close();
        process.exit(1);
    }
}

addQuestion();
