'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Button } from '@/components/ui';
import {
  FileCheck2,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  PlayCircle,
} from 'lucide-react';

interface Question {
  _id: string;
  questionText: string;
  options: { optionId: string; text: string }[];
  marks: number;
}

interface ExamData {
  exam: {
    title: string;
    instructions?: string;
    durationMinutes: number;
    totalMarks: number;
    negativeMarkPerWrong: number;
  };
  questions: Question[];
}

export default function ExamTakePage() {
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutes in seconds

  useEffect(() => {
    // In production, examId is loaded from URL or query
    loadMockOrRealExam();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const loadMockOrRealExam = () => {
    setExamData({
      exam: {
        title: 'Class 6 Bangla 1st Paper — Weekly Evaluation Test',
        instructions: 'Read each question carefully. Select one correct option. Negative marks apply for wrong answers.',
        durationMinutes: 30,
        totalMarks: 20,
        negativeMarkPerWrong: 0.25,
      },
      questions: [
        {
          _id: 'q1',
          questionText: 'বাংলা সাহিত্যের প্রাচীনতম নিদর্শন কোনটি?',
          options: [
            { optionId: 'a', text: 'চর্যাপদ' },
            { optionId: 'b', text: 'শ্রীকৃষ্ণকীর্তন' },
            { optionId: 'c', text: 'পদ্মাবতী' },
            { optionId: 'd', text: 'মেঘনাদবধ কাব্য' },
          ],
          marks: 5,
        },
        {
          _id: 'q2',
          questionText: 'বাংলা বর্ণমালায় মোট কতটি বর্ণ রয়েছে?',
          options: [
            { optionId: 'a', text: '৩৯টি' },
            { optionId: 'b', text: '৫০টি' },
            { optionId: 'c', text: '১১টি' },
            { optionId: 'd', text: '৫২টি' },
          ],
          marks: 5,
        },
        {
          _id: 'q3',
          questionText: 'বাক্যের ক্ষুদ্রতম একক কী?',
          options: [
            { optionId: 'a', text: 'শব্দ' },
            { optionId: 'b', text: 'বর্ণ' },
            { optionId: 'c', text: 'ধ্বনি' },
            { optionId: 'd', text: 'অক্ষর' },
          ],
          marks: 5,
        },
        {
          _id: 'q4',
          questionText: 'নিচের কোনটি তৎসম শব্দ?',
          options: [
            { optionId: 'a', text: 'হাত' },
            { optionId: 'b', text: 'চন্দ্র' },
            { optionId: 'c', text: 'চামচ' },
            { optionId: 'd', text: 'রিকশা' },
          ],
          marks: 5,
        },
      ],
    });
  };

  const handleSelect = (questionId: string, optionId: string) => {
    if (result) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // Simulate server evaluation or post to endpoint
    setTimeout(() => {
      // Mock accurate evaluation for preview
      let score = 0;
      const correctAnswers: Record<string, string> = { q1: 'a', q2: 'b', q3: 'a', q4: 'b' };
      Object.entries(selectedAnswers).forEach(([qId, optId]) => {
        if (correctAnswers[qId] === optId) score += 5;
        else score -= 0.25;
      });

      setResult({
        totalScore: Math.max(0, score),
        passMarks: 10,
        totalMarks: 20,
        passed: score >= 10,
      });
      setSubmitting(false);
    }, 800);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!examData) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Exam Header */}
      <div className="glass-panel rounded-2xl p-6 mb-8 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            MCQ Examination
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-2">
            {examData.exam.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">{examData.exam.instructions}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-amber-400">
            <Clock className="w-4 h-4" />
            <span>Time: {formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Result Card if Submitted */}
      {result && (
        <Card className="mb-8 border border-slate-700 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {result.passed ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-7 h-7" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-white">
                  {result.passed ? 'Congratulations! You Passed' : 'Test Completed'}
                </h3>
                <p className="text-xs text-slate-400">
                  Authoritative score calculated server-side.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div>
                <span className="text-xs text-slate-500 block">Total Marks</span>
                <span className="text-sm font-semibold text-slate-200">{result.totalMarks}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Your Score</span>
                <span className="text-2xl font-extrabold text-blue-400">
                  {result.totalScore}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {examData.questions.map((q, idx) => (
          <Card key={q._id} className="border border-slate-800">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-base font-semibold text-white">
                <span className="text-blue-400 mr-2">{idx + 1}.</span> {q.questionText}
              </h3>
              <span className="text-xs text-slate-500 shrink-0 font-medium">
                {q.marks} Marks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((opt) => {
                const isSelected = selectedAnswers[q._id] === opt.optionId;
                return (
                  <button
                    key={opt.optionId}
                    disabled={!!result}
                    onClick={() => handleSelect(q._id, opt.optionId)}
                    className={`p-3 rounded-xl text-xs text-left border transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold uppercase shrink-0 border ${
                        isSelected
                          ? 'border-blue-400 bg-blue-500 text-white'
                          : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      {opt.optionId}
                    </span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      {!result && (
        <div className="mt-8 flex justify-end">
          <Button
            size="lg"
            isLoading={submitting}
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length === 0}
            className="w-full sm:w-auto"
          >
            Submit Examination
          </Button>
        </div>
      )}
    </div>
  );
}
