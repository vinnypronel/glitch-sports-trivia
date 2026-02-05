import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, Award, CheckCircle2, XCircle, Trophy, Dribbble, Target, Activity, Loader2 } from 'lucide-react';
import { useGameAudio, type SoundEffect } from '../hooks/useGameAudio';
import { useQuestions, type Question } from '../hooks/useQuestions';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const SPORTS = [
    { id: 'ALL', name: 'ALL SPORTS', icon: Trophy },
    { id: 'NFL', name: 'NFL', icon: Target },
    { id: 'NBA', name: 'NBA', icon: Dribbble },
    { id: 'MLB', name: 'MLB', icon: Activity },
    { id: 'NHL', name: 'NHL', icon: Activity },
];

const TriviaArena: React.FC = () => {
    const { playSFX, startTensionLoop, updateTension, stopTensionLoop } = useGameAudio();
    const { fetchQuestions } = useQuestions();

    const [gameState, setGameState] = useState<'idle' | 'selecting' | 'loading' | 'playing' | 'answered' | 'gameover'>('idle');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(24);
    const [streak, setStreak] = useState(0);
    const [score, setScore] = useState(0);
    const [userInputs, setUserInputs] = useState<string[]>(['']);
    const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([]);
    const [powerUps, setPowerUps] = useState({ reveal: 3, skip: 2 });

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const currentQuestion = questions[currentQuestionIndex];
    const requiredAnswers = currentQuestion?.required_answers || 1;

    // Initialize inputs when question changes
    useEffect(() => {
        if (currentQuestion) {
            const count = currentQuestion.required_answers || 1;
            setUserInputs(Array(count).fill(''));
            setCorrectAnswers([]);
            inputRefs.current = Array(count).fill(null);
        }
    }, [currentQuestionIndex, currentQuestion]);

    // Timer Logic
    useEffect(() => {
        let timer: number;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = window.setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameState === 'playing') {
            submitAnswer();
        }

        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    useEffect(() => {
        if (gameState === 'playing') {
            updateTension(timeLeft);
        }
    }, [timeLeft, gameState, updateTension]);

    useEffect(() => {
        if (gameState === 'playing' && inputRefs.current[0]) {
            inputRefs.current[0]?.focus();
        }
    }, [gameState, currentQuestionIndex]);

    const selectSport = async (sport: string) => {
        setGameState('loading');
        const fetchedQuestions = await fetchQuestions(sport, 10);

        if (fetchedQuestions.length === 0) {
            alert('No questions available for this sport yet!');
            setGameState('selecting');
            return;
        }

        setQuestions(fetchedQuestions);
        setCurrentQuestionIndex(0);
        setGameState('playing');
        setTimeLeft(24);
        startTensionLoop();
    };

    const handleInputChange = (index: number, value: string) => {
        const newInputs = [...userInputs];
        newInputs[index] = value;
        setUserInputs(newInputs);
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (index < requiredAnswers - 1) {
                // Move to next input
                inputRefs.current[index + 1]?.focus();
            } else {
                // Last input, submit
                submitAnswer();
            }
        } else if (e.key === 'Tab' && !e.shiftKey && index < requiredAnswers - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    const submitAnswer = () => {
        if (gameState !== 'playing') return;

        setGameState('answered');
        stopTensionLoop();

        // All valid answers (correct_answer + variants)
        const allValidAnswers = [
            currentQuestion.correct_answer.toLowerCase(),
            ...(currentQuestion.answer_variants || []).map(v => v.toLowerCase())
        ];

        // Check each user input
        const results = userInputs.map(input => {
            const normalized = input.trim().toLowerCase();
            return allValidAnswers.includes(normalized);
        });

        setCorrectAnswers(results);

        const correctCount = results.filter(r => r).length;
        const totalRequired = requiredAnswers;
        const isFullyCorrect = correctCount === totalRequired;

        if (correctCount > 0) {
            const newStreak = isFullyCorrect ? streak + 1 : 0;
            setStreak(newStreak);

            // Partial credit: score based on how many they got right
            const pointsPerAnswer = (timeLeft * 10) / totalRequired;
            setScore(prev => prev + (pointsPerAnswer * correctCount * (1 + newStreak * 0.1)));

            let sfx: SoundEffect = 'CORRECT_SWISH';
            if (currentQuestion.sport_type === 'MLB') sfx = 'BAT_CRACK';
            if (currentQuestion.sport_type === 'NFL') sfx = 'WHISTLE';
            playSFX(sfx);

            if (newStreak === 3 || newStreak === 5 || newStreak === 10) {
                playSFX('CROWD_CHEER', Math.min(1, 0.3 + (newStreak * 0.05)));
            }
        } else {
            setStreak(0);
            playSFX('GLITCH_SFX');
        }

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                nextQuestion();
            } else {
                setGameState('gameover');
            }
        }, 3000);
    };

    const nextQuestion = () => {
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeLeft(24);
        setGameState('playing');
        startTensionLoop();
    };

    const useReveal = () => {
        if (powerUps.reveal <= 0 || gameState !== 'playing') return;

        // Reveal a random correct answer
        const allAnswers = [currentQuestion.correct_answer, ...(currentQuestion.answer_variants || [])];
        const unusedAnswers = allAnswers.filter(a =>
            !userInputs.some(input => input.toLowerCase() === a.toLowerCase())
        );

        if (unusedAnswers.length > 0) {
            const revealed = unusedAnswers[0];
            // Find first empty input and fill it
            const emptyIndex = userInputs.findIndex(input => !input.trim());
            if (emptyIndex !== -1) {
                const newInputs = [...userInputs];
                newInputs[emptyIndex] = revealed;
                setUserInputs(newInputs);
            }
            setPowerUps(prev => ({ ...prev, reveal: prev.reveal - 1 }));
        }
    };

    const useSkip = () => {
        if (powerUps.skip <= 0 || gameState !== 'playing') return;

        setPowerUps(prev => ({ ...prev, skip: prev.skip - 1 }));
        setGameState('answered');
        stopTensionLoop();
        setCorrectAnswers(Array(requiredAnswers).fill(true));
        setScore(prev => prev + 10);

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                nextQuestion();
            } else {
                setGameState('gameover');
            }
        }, 1500);
    };

    // IDLE STATE
    if (gameState === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-brand-dark overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-glitch/10 to-transparent pointer-events-none" />
                <motion.h1
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-7xl font-display font-black text-brand-neon mb-8 tracking-tighter italic text-center"
                >
                    GLITCH <span className="text-white">SPORTS</span> TRIVIA
                </motion.h1>
                <button
                    onClick={() => setGameState('selecting')}
                    className="px-8 py-4 bg-brand-neon text-black font-bold text-xl rounded-none transform transition hover:scale-105 active:scale-95 skew-x-[-12deg]"
                >
                    ENTER THE GLITCH
                </button>
            </div>
        );
    }

    // LOADING STATE
    if (gameState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-brand-dark">
                <Loader2 className="w-16 h-16 text-brand-neon animate-spin mb-4" />
                <p className="text-white/50 text-lg font-display italic">Loading weird trivia...</p>
            </div>
        );
    }

    // SELECTING STATE
    if (gameState === 'selecting') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-brand-dark p-8">
                <h2 className="text-4xl font-display font-black text-white mb-12 tracking-tight">SELECT YOUR <span className="text-brand-neon italic underline">DOMAIN</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
                    {SPORTS.map((sport) => (
                        <button
                            key={sport.id}
                            onClick={() => selectSport(sport.id)}
                            className="group relative flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 hover:border-brand-neon transition-all hover:bg-white/10 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-brand-neon/0 group-hover:bg-brand-neon/5 transition-colors" />
                            <sport.icon className="w-12 h-12 text-brand-neon mb-4 group-hover:scale-110 transition-transform" />
                            <span className="text-xl font-black font-display italic tracking-widest">{sport.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // PLAYING STATE
    return (
        <div className="min-h-screen w-full bg-brand-dark text-white flex flex-col items-center p-8">
            {/* Header Stats */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 px-4 py-2 border-l-4 border-brand-neon">
                        <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Points</p>
                        <p className="text-2xl font-black font-display text-brand-neon">{Math.floor(score)}</p>
                    </div>
                    <div className="bg-white/10 px-4 py-2 border-l-4 border-brand-glitch">
                        <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Streak</p>
                        <p className="text-2xl font-black font-display italic">{streak}x</p>
                    </div>
                </div>

                {/* Shot Clock */}
                <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" />
                        <motion.circle
                            cx="48" cy="48" r="40"
                            stroke={timeLeft < 5 ? "#ff0055" : "#a3ff12"}
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={251.2}
                            animate={{ strokeDashoffset: 251.2 - (251.2 * timeLeft / 24) }}
                            transition={{ duration: 1, ease: "linear" }}
                            className={cn(timeLeft < 5 && "animate-glitch")}
                        />
                    </svg>
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center text-3xl font-black font-display italic",
                        timeLeft < 5 ? "text-brand-glitch" : "text-brand-neon"
                    )}>
                        {timeLeft}
                    </div>
                </div>
            </div>

            {/* Question Card */}
            {currentQuestion && (
                <motion.div
                    key={currentQuestion.id}
                    initial={{ x: 200, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -200, opacity: 0 }}
                    className="w-full max-w-2xl bg-white/5 border border-white/10 p-12 relative overflow-hidden"
                >
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-brand-neon text-xs font-bold tracking-[0.3em] uppercase">
                                {currentQuestion.sport_type} // {currentQuestion.difficulty}
                            </span>
                            {requiredAnswers > 1 && (
                                <span className="bg-brand-glitch text-white text-[10px] px-2 py-0.5 font-bold">
                                    {requiredAnswers} ANSWERS
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold mt-2 leading-tight">
                            {currentQuestion.question}
                        </p>
                    </div>

                    {/* Dynamic Answer Inputs */}
                    <div className="space-y-3">
                        {Array.from({ length: requiredAnswers }).map((_, index) => (
                            <div key={index} className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-bold text-sm">
                                    {index + 1}.
                                </div>
                                <input
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    value={userInputs[index] || ''}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    disabled={gameState !== 'playing'}
                                    placeholder={`Answer ${index + 1}...`}
                                    className={cn(
                                        "w-full bg-white/10 border-2 p-4 pl-10 text-lg font-bold font-display italic outline-none transition-all placeholder:text-white/20",
                                        gameState === 'answered' && correctAnswers[index] === true && "border-brand-neon text-brand-neon",
                                        gameState === 'answered' && correctAnswers[index] === false && "border-brand-glitch text-brand-glitch",
                                        gameState === 'playing' && "border-white/10 focus:border-brand-neon"
                                    )}
                                />
                                {gameState === 'answered' && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {correctAnswers[index] ? (
                                            <CheckCircle2 className="text-brand-neon" size={20} />
                                        ) : (
                                            <XCircle className="text-brand-glitch" size={20} />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Results Summary */}
                    {gameState === 'answered' && (
                        <div className="mt-6 p-4 bg-white/5 border border-white/10">
                            <p className="font-bold text-white/70 mb-2">
                                You got {correctAnswers.filter(c => c).length} / {requiredAnswers} correct!
                            </p>
                            <p className="text-sm text-white/50">
                                Correct answers: {[currentQuestion.correct_answer, ...(currentQuestion.answer_variants || [])].slice(0, requiredAnswers).join(', ')}
                            </p>
                        </div>
                    )}

                    {/* Submit Button for multi-answer */}
                    {gameState === 'playing' && requiredAnswers > 1 && (
                        <button
                            onClick={submitAnswer}
                            className="mt-6 w-full py-3 bg-brand-neon text-black font-bold text-lg hover:scale-[1.02] transition-transform"
                        >
                            SUBMIT ALL ANSWERS
                        </button>
                    )}
                </motion.div>
            )}

            {/* Power-Up Bar */}
            <div className="mt-12 flex gap-4">
                <button
                    onClick={useReveal}
                    disabled={powerUps.reveal <= 0 || gameState !== 'playing'}
                    className="group flex flex-col items-center gap-2 disabled:opacity-30 disabled:grayscale transition-all"
                >
                    <div className="w-16 h-16 bg-white/5 border border-white/10 flex flex-col items-center justify-center group-hover:border-brand-neon group-hover:bg-brand-neon group-hover:text-black transition-all">
                        <Zap size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Reveal ({powerUps.reveal})</p>
                </button>

                <button
                    onClick={useSkip}
                    disabled={powerUps.skip <= 0 || gameState !== 'playing'}
                    className="group flex flex-col items-center gap-2 disabled:opacity-30 disabled:grayscale transition-all"
                >
                    <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-brand-glitch group-hover:bg-brand-glitch group-hover:text-white transition-all">
                        <RotateCcw size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Skip ({powerUps.skip})</p>
                </button>
            </div>

            {/* Game Over */}
            <AnimatePresence>
                {gameState === 'gameover' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-brand-dark/95 flex flex-col items-center justify-center z-50 p-8 text-center"
                    >
                        <Award className="text-brand-neon w-24 h-24 mb-6" />
                        <h2 className="text-6xl font-black font-display mb-4 italic tracking-tighter">FINAL WHISTLE</h2>
                        <div className="bg-white/10 p-8 mb-8 border-y-2 border-brand-neon">
                            <p className="text-white/50 uppercase tracking-widest mb-2 font-black">SEASON PERFORMANCE</p>
                            <p className="text-7xl font-black text-brand-neon font-display tracking-tighter italic">{Math.floor(score)}</p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-4 bg-brand-neon text-black font-bold text-xl hover:scale-105 transition-all skew-x-[-12deg]"
                        >
                            PLAY ANOTHER SEASON
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TriviaArena;
