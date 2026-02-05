import { useState, useEffect } from 'react';

export interface Question {
    id: number;
    question: string;
    correct_answer: string;
    answer_variants: string[];
    sport_type: string;
    question_type: 'single' | 'multi';
    required_answers: number;
}

const API_BASE = '/api';

export const useQuestions = () => {
    const [sports, setSports] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSports();
    }, []);

    const fetchSports = async () => {
        try {
            const res = await fetch(`${API_BASE}/sports`);
            const data = await res.json();
            setSports(data);
        } catch (err) {
            console.error('Failed to fetch sports:', err);
            setError('Failed to load sports');
        }
    };

    const fetchQuestions = async (sport: string, limit: number = 10): Promise<Question[]> => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/questions?sport=${sport}&limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch questions');
            const data = await res.json();
            return data;
        } catch (err) {
            console.error('Failed to fetch questions:', err);
            setError('Failed to load questions');
            return [];
        } finally {
            setLoading(false);
        }
    };

    return { sports, fetchQuestions, loading, error };
};
