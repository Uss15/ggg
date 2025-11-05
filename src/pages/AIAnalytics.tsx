import { Header } from '@/components/Header';
import { AnomalyDetector } from '@/components/ai/AnomalyDetector';
import { PredictiveAnalytics } from '@/components/ai/PredictiveAnalytics';
import { Sparkles } from 'lucide-react';

export default function AIAnalytics() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Sparkles className="h-8 w-8" />
            AI-Powered Analytics
          </h1>
          <p className="text-muted-foreground">
            Advanced AI analysis for evidence classification, anomaly detection, and predictive insights
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <AnomalyDetector timeframe="recent" />
          <PredictiveAnalytics />
        </div>
      </main>
    </div>
  );
}