import { useAuth } from "@/_core/hooks/useAuth";
import FundingQuiz from '@/components/FundingQuiz';

/**
 * Home Page - Funding Readiness Quiz Landing Page
 * 
 * Design Philosophy: Elevated Authority
 * This page hosts the main quiz component that guides users through
 * a 5-question assessment to determine their funding readiness.
 */

export default function Home() {
  // The userAuth hooks provides authentication state
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  return <FundingQuiz />;
}
