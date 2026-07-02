import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SpeakingTestUnavailable({ error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full shadow-xl border-0">
        <CardContent className="pt-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Test Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to={createPageUrl('Speaking')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tests
              </Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
            >
              <Link to={createPageUrl('Dashboard')}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
