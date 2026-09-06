import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pairedTestsEnabled } from './pairedApi';
export default function TakeWithFriend({ test, isLocked = false }) {
  const totalQuestions = Number(test?.total_questions ?? test?.question_count ?? 40);
  if (!pairedTestsEnabled || isLocked || !test?.id || totalQuestions !== 40) return null;
  return (
    <Button asChild variant="outline" size="sm" className="mt-2 w-full">
      <Link to={`/${test.test_type}-test/${test.id}?together=true`}>
        <Users size={14} className="mr-2" />
        Take with a friend
      </Link>
    </Button>
  );
}
