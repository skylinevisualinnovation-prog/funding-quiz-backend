import { useState } from 'react';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * Funding Readiness Quiz Component
 * 
 * Design Philosophy: Elevated Authority
 * - Premium, professional aesthetic with gold accents
 * - Circular progress ring for elegant progress tracking
 * - Ornamental dividers separating sections
 * - Smooth animations and micro-interactions
 * - Mobile-first responsive design
 */

interface QuizQuestion {
  id: number;
  category: string;
  question: string;
  description?: string;
  options: {
    text: string;
    points: number;
  }[];
}

interface QuizScore {
  total: number;
  percentage: number;
  readinessLevel: 'Not Ready' | 'Developing' | 'Ready' | 'Highly Ready';
  recommendations: string[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    category: 'Credit Profile',
    question: 'What is your current business or personal credit score range?',
    description: 'This helps us understand your creditworthiness',
    options: [
      { text: 'Below 600', points: 0 },
      { text: '600 - 700', points: 25 },
      { text: '700 - 750', points: 50 },
      { text: '750+', points: 100 },
    ],
  },
  {
    id: 2,
    category: 'Financial History',
    question: 'How many months of positive bank statements do you have?',
    description: 'Lenders typically require 6+ months',
    options: [
      { text: 'Less than 3 months', points: 0 },
      { text: '3 - 6 months', points: 33 },
      { text: '6 - 12 months', points: 67 },
      { text: 'More than 12 months', points: 100 },
    ],
  },
  {
    id: 3,
    category: 'Revenue Stability',
    question: 'How would you describe your monthly revenue pattern?',
    description: 'Consistent revenue is a key indicator of stability',
    options: [
      { text: 'Highly variable/unpredictable', points: 0 },
      { text: 'Somewhat inconsistent', points: 33 },
      { text: 'Generally consistent', points: 67 },
      { text: 'Very consistent and growing', points: 100 },
    ],
  },
  {
    id: 4,
    category: 'Business Operations',
    question: 'How long has your business been operating?',
    description: 'Established businesses have better funding prospects',
    options: [
      { text: 'Less than 1 year', points: 0 },
      { text: '1 - 2 years', points: 33 },
      { text: '2 - 5 years', points: 67 },
      { text: 'More than 5 years', points: 100 },
    ],
  },
  {
    id: 5,
    category: 'Funding Purpose',
    question: 'What is your primary reason for seeking funding?',
    description: 'Different purposes have different approval rates',
    options: [
      { text: 'Debt consolidation', points: 50 },
      { text: 'Working capital/operations', points: 75 },
      { text: 'Growth/expansion', points: 85 },
      { text: 'Equipment/inventory', points: 90 },
    ],
  },
];

export default function FundingQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [score, setScore] = useState<QuizScore | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitQuizMutation = trpc.quiz.submit.useMutation();

  const handleAnswer = (points: number) => {
    const newAnswers = [...answers, points];
    setAnswers(newAnswers);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore(newAnswers);
    }
  };

  const calculateScore = (finalAnswers: number[]) => {
    const total = finalAnswers.reduce((sum, points) => sum + points, 0);
    const percentage = Math.round((total / (QUIZ_QUESTIONS.length * 100)) * 100);

    let readinessLevel: 'Not Ready' | 'Developing' | 'Ready' | 'Highly Ready';
    let recommendations: string[] = [];

    if (percentage < 40) {
      readinessLevel = 'Not Ready';
      recommendations = [
        'Build your credit score to 650+',
        'Establish 6+ months of positive bank statements',
        'Stabilize your monthly revenue',
      ];
    } else if (percentage < 60) {
      readinessLevel = 'Developing';
      recommendations = [
        'Continue building your credit history',
        'Maintain consistent revenue for 3+ more months',
        'Prepare detailed financial documentation',
      ];
    } else if (percentage < 80) {
      readinessLevel = 'Ready';
      recommendations = [
        'You are a strong candidate for funding',
        'Prepare your business plan and financial projections',
        'Gather all required documentation',
      ];
    } else {
      readinessLevel = 'Highly Ready';
      recommendations = [
        'You are an excellent candidate for funding',
        'You may qualify for premium funding options',
        'Schedule a consultation to explore your options',
      ];
    }

    setScore({
      total,
      percentage,
      readinessLevel,
      recommendations,
    });
    setShowResults(true);
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleSubmitQuiz = async () => {
    // Validate required fields
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!score) return;

    setIsSubmitting(true);

    try {
      await submitQuizMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        score: score.percentage,
        readinessLevel: score.readinessLevel,
        answers: JSON.stringify(answers),
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
      });

      toast.success('Thank you! Your results have been submitted. We will contact you soon.');
      
      // Reset form after successful submission
      setTimeout(() => {
        handleReset();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setName('');
    setEmail('');
    setPhone('');
    setShowResults(false);
    setQuizStarted(false);
    setScore(null);
  };

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="card-elevated text-center">
            <div className="mb-8">
              <h1 className="font-display text-4xl md:text-5xl text-navy mb-4">
                Are You Positioned for Funding?
              </h1>
              <p className="text-lg text-charcoal-light mb-2">
                Discover your funding readiness in just 5 minutes
              </p>
              <p className="text-sm text-charcoal-light/70">
                No impact to your credit score. Completely confidential.
              </p>
            </div>

            <div className="divider-ornamental">
              <div className="divider-ornamental-dot"></div>
            </div>

            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="badge-micro flex-shrink-0">✓</div>
                <div className="text-left">
                  <p className="font-semibold text-navy mb-1">Quick Assessment</p>
                  <p className="text-sm text-charcoal-light">
                    Answer 5 simple questions about your business and finances
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="badge-micro flex-shrink-0">✓</div>
                <div className="text-left">
                  <p className="font-semibold text-navy mb-1">Instant Results</p>
                  <p className="text-sm text-charcoal-light">
                    Get your funding readiness score immediately
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="badge-micro flex-shrink-0">✓</div>
                <div className="text-left">
                  <p className="font-semibold text-navy mb-1">Personalized Guidance</p>
                  <p className="text-sm text-charcoal-light">
                    Receive tailored recommendations for your situation
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              className="btn-premium-accent w-full flex items-center justify-center gap-2"
            >
              Start the Quiz
              <ArrowRight size={20} />
            </button>

            <p className="text-xs text-charcoal-light/60 mt-6">
              By starting the quiz, you agree to receive funding information from Elevate One Capital LLC
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showResults && score) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="card-elevated">
            <div className="text-center mb-8">
              <div className="mb-6">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663480638096/W8rmQiMtoPxsZDBFuoQkCG/quiz-success-illustration-dFqENWpFmHShJqDvkfgWZR.webp"
                  alt="Success"
                  className="w-full max-w-sm mx-auto rounded-lg"
                />
              </div>

              <h2 className="font-display text-4xl text-navy mb-4">
                Your Funding Readiness Score
              </h2>

              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="text-center">
                  <div className="text-6xl font-bold text-gold mb-2">
                    {score.percentage}%
                  </div>
                  <p className="text-sm text-charcoal-light">Overall Score</p>
                </div>

                <div className="w-px h-20 bg-cream-dark"></div>

                <div className="text-center">
                  <div className="text-2xl font-display text-navy mb-2">
                    {score.readinessLevel}
                  </div>
                  <p className="text-sm text-charcoal-light">Funding Status</p>
                </div>
              </div>
            </div>

            <div className="divider-ornamental">
              <div className="divider-ornamental-dot"></div>
            </div>

            <div className="my-8">
              <h3 className="font-display text-xl text-navy mb-4">
                Personalized Recommendations
              </h3>
              <ul className="space-y-3">
                {score.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-charcoal">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="divider-ornamental">
              <div className="divider-ornamental-dot"></div>
            </div>

            <div className="mt-8">
              <label className="block text-sm font-semibold text-navy mb-3">
                Share Your Information to Get Started
              </label>
              
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-cream-dark rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
                  disabled={isSubmitting}
                />
                
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-cream-dark rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
                  disabled={isSubmitting}
                />
                
                <input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-cream-dark rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
                  disabled={isSubmitting}
                />
              </div>

              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="btn-premium w-full flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={20} className="animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Submit & Get Results'}
              </button>

              <p className="text-xs text-charcoal-light/60 mt-3">
                We will send your detailed results and next steps to your email
              </p>
            </div>

            <button
              onClick={handleReset}
              disabled={isSubmitting}
              className="w-full mt-6 px-6 py-2 text-navy border border-navy rounded-md hover:bg-navy hover:text-cream transition-all duration-200 disabled:opacity-50"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="mb-8 flex justify-center">
          <div className="relative w-32 h-32">
            <svg className="progress-ring" width="128" height="128">
              <circle
                cx="64"
                cy="64"
                r="45"
                fill="none"
                stroke="#e8e6e3"
                strokeWidth="3"
              />
              <circle
                className="progress-ring-circle"
                cx="64"
                cy="64"
                r="45"
                fill="none"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-navy">
                  {currentQuestion + 1}/{QUIZ_QUESTIONS.length}
                </div>
                <p className="text-xs text-charcoal-light">Questions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-elevated mb-8">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-gold/20 text-navy text-xs font-semibold rounded-full mb-3">
              {question.category}
            </span>
            <h2 className="font-display text-2xl md:text-3xl text-navy mb-2">
              {question.question}
            </h2>
            {question.description && (
              <p className="text-charcoal-light">{question.description}</p>
            )}
          </div>

          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option.points)}
                className="w-full p-4 text-left border-2 border-cream-dark rounded-lg hover:border-gold hover:bg-gold/5 transition-all duration-200 group"
              >
                <p className="font-medium text-charcoal group-hover:text-navy transition-colors">
                  {option.text}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-charcoal-light/60">
          Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
        </div>
      </div>
    </div>
  );
}
