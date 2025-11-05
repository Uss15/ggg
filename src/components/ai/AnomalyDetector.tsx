import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldAlert, Loader2, AlertTriangle } from 'lucide-react';

interface Anomaly {
  logId: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

interface AnomalyAnalysis {
  anomalies: Anomaly[];
  summary: string;
  riskScore: number;
}

interface AnomalyDetectorProps {
  bagId?: string;
  timeframe?: 'all' | 'recent';
}

export const AnomalyDetector = ({ bagId, timeframe = 'recent' }: AnomalyDetectorProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnomalyAnalysis | null>(null);
  const [logsAnalyzed, setLogsAnalyzed] = useState(0);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-anomalies', {
        body: { bagId, timeframe }
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(data.analysis);
        setLogsAnalyzed(data.logsAnalyzed || 0);
        
        if (data.analysis.anomalies?.length > 0) {
          toast.warning(`Found ${data.analysis.anomalies.length} anomalies`);
        } else {
          toast.success('No anomalies detected');
        }
      }
    } catch (error: any) {
      console.error('Anomaly detection error:', error);
      toast.error(error.message || 'Failed to detect anomalies');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return 'text-red-500';
    if (risk >= 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Anomaly Detection
        </CardTitle>
        <CardDescription>
          AI-powered detection of suspicious custody events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <ShieldAlert className="mr-2 h-4 w-4" />
              Detect Anomalies
            </>
          )}
        </Button>

        {analysis && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Logs Analyzed</p>
                <p className="text-2xl font-bold">{logsAnalyzed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className={`text-2xl font-bold ${getRiskColor(analysis.riskScore)}`}>
                  {(analysis.riskScore * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Anomalies</p>
                <p className="text-2xl font-bold">{analysis.anomalies?.length || 0}</p>
              </div>
            </div>

            {analysis.summary && (
              <Alert>
                <AlertDescription>{analysis.summary}</AlertDescription>
              </Alert>
            )}

            {analysis.anomalies && analysis.anomalies.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Detected Anomalies
                </h4>
                {analysis.anomalies.map((anomaly, index) => (
                  <Card key={index} className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(anomaly.severity)}>
                              {anomaly.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{anomaly.type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                        </div>
                      </div>
                      {anomaly.recommendation && (
                        <div className="mt-2 p-2 bg-muted rounded">
                          <p className="text-sm"><strong>Recommendation:</strong> {anomaly.recommendation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};