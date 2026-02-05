-- Glitch Sports Trivia PostgreSQL Schema

-- Questions Table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    answer_variants TEXT[],
    sport_type VARCHAR(50) NOT NULL,
    question_type VARCHAR(20) DEFAULT 'single',
    required_answers INTEGER DEFAULT 1
);

-- UserStats Table
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE,
    current_streak INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    power_ups_owned JSONB DEFAULT '{"hail_mary": 3, "instant_replay": 3}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GameLogs Table
CREATE TABLE game_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_stats(user_id),
    question_id INTEGER REFERENCES questions(id),
    is_correct BOOLEAN NOT NULL,
    user_input TEXT,
    time_taken INTEGER,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
