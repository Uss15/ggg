import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TrendingUp, Loader2, AlertCircle } from 'lucide-react';

interface Prediction {
  bagId?: string;
  caseId?: string;
  riskLevel?: string;
  delayRisk?: string;
  riskFactors?: string[];
  delayFactors?: string[];
  recommendedActions: string[];
  urgency?: number;
  estimatedDaysToCompletion?: number;
}

interface AnalysisResult {
  predictions: Prediction[];
  summary: string;
  overallRiskScore?: number;
  criticalCases?: string[];
}

export const PredictiveAnalytics = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<AnalysisResult | null>(null);
  const [delayAnalysis, setDelayAnalysis] = useState<AnalysisResult | null>(null);
  const [itemsAnalyzed, setItemsAnalyzed] = useState(0);

  const handleAnalyze = async (analysisType: 'risk' | 'delay') => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-analytics', {
        body: { analysisType }
      });

      if (error) throw error;

      if (data?.analysis) {
        if (analysisType === 'risk') {
          setRiskAnalysis(data.analysis);
        } else {
          setDelayAnalysis(data.analysis);
        }
        setItemsAnalyzed(data.itemsAnalyzed || 0);
        toast.success('Analysis complete');
      }
    } catch (error: any) {
      console.error('Predictive analytics error:', error);
      toast.error(error.message || 'Failed to perform analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Predictive Analytics
        </CardTitle>
        <CardDescription>
          ML-powered predictions for evidence risk and case delays
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="risk" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="risk">Evidence Risk</TabsTrigger>
            <TabsTrigger value="delay">Case Delays</TabsTrigger>
          </TabsList>

          <TabsContent value="risk" className="space-y-4">
            <Button 
              onClick={() => handleAnalyze('risk')} 
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
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analyze Evidence Risk
                </>
              )}
            </Button>

            {riskAnalysis && (
              <div className="space-y-4">
                {riskAnalysis.summary && (
                  <Alert>
                    <AlertDescription>{riskAnalysis.summary}</AlertDescription>
                  </Alert>
                )}

                {riskAnalysis.predictions && riskAnalysis.predictions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      High-Risk Evidence ({riskAnalysis.predictions.length})
                    </h4>
                    {riskAnalysis.predictions.map((prediction, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <code className="text-sm">{prediction.bagId}</code>
                            <Badge variant={getRiskColor(prediction.riskLevel || 'low')}>
                              {prediction.riskLevel?.toUpperCase()}
                            </Badge>
                          </div>

                          {prediction.riskFactors && prediction.riskFactors.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">Risk Factors:</p>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {prediction.riskFactors.map((factor, i) => (
                                  <li key={i}>{factor}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {prediction.recommendedActions && prediction.recommendedActions.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">Recommended Actions:</p>
                              <ul className="text-sm list-disc list-inside">
                                {prediction.recommendedActions.map((action, i) => (
                                  <li key={i}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {prediction.urgency && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Urgency:</span>
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary rounded-full h-2" 
                                  style={{ width: `${prediction.urgency * 10}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{prediction.urgency}/10</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="delay" className="space-y-4">
            <Button 
              onClick={() => handleAnalyze('delay')} 
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
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Predict Case Delays
                </>
              )}
            </Button>

            {delayAnalysis && (
              <div className="space-y-4">
                {delayAnalysis.summary && (
                  <Alert>
                    <AlertDescription>{delayAnalysis.summary}</AlertDescription>
                  </Alert>
                )}

                {delayAnalysis.predictions && delayAnalysis.predictions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      At-Risk Cases ({delayAnalysis.predictions.length})
                    </h4>
                    {delayAnalysis.predictions.map((prediction, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <code className="text-sm">{prediction.bagId || prediction.caseId}</code>
                            <Badge variant={getRiskColor(prediction.delayRisk || 'low')}>
                              {prediction.delayRisk?.toUpperCase()}
                            </Badge>
                          </div>

                          {prediction.delayFactors && prediction.delayFactors.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">Delay Factors:</p>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {prediction.delayFactors.map((factor, i) => (
                                  <li key={i}>{factor}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {prediction.estimatedDaysToCompletion && (
                            <div className="p-2 bg-muted rounded">
                              <p className="text-sm">
                                <strong>Estimated Days to Completion:</strong> {prediction.estimatedDaysToCompletion}
                              </p>
                            </div>
                          )}

                          {prediction.recommendedActions && prediction.recommendedActions.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">Recommended Actions:</p>
                              <ul className="text-sm list-disc list-inside">
                                {prediction.recommendedActions.map((action, i) => (
                                  <li key={i}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};