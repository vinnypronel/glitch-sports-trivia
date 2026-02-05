-- Glitch Sports Trivia PostgreSQL Schema

-- Questions Table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    answer_variants TEXT[],
    sport_type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Sample Data
INSERT INTO questions (text, correct_answer, answer_variants, sport_type, difficulty) VALUES
('Which NFL team is the only franchise with a logo that faces left?', 'Philadelphia Eagles', ARRAY['Eagles', 'The Philadelphia Eagles', 'Philly Eagles'], 'NFL', 'medium'),
('Gaylord Perry hit his only career home run on the exact same day that which man walked on the moon?', 'Neil Armstrong', ARRAY['Armstrong'], 'MLB', 'hard'),
('In 1961, Wilt Chamberlain set an unbreakable record by averaging how many minutes per game?', '48.5', ARRAY['48.5 minutes', '48.5 mins'], 'NBA', 'medium'),
('The Stanley Cup features several misspellings; which team is famously spelled as BQSTQN BRUINS?', 'Boston Bruins', ARRAY['Bruins', 'The Boston Bruins'], 'NHL', 'hard'),
('What is the only MLB team that does not have the city name on their home or road jerseys?', 'Los Angeles Angels', ARRAY['Angels'], 'MLB', 'medium'),
('In 1987, which NFL team technically won their division despite using replacement players during a strike?', 'Washington Redskins', ARRAY['Redskins', 'Washington Commanders'], 'NFL', 'hard');
