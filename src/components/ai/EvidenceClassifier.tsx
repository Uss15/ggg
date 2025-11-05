import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Loader2 } from 'lucide-react';

interface ClassificationResult {
  category: string;
  confidence: number;
  description: string;
  tags: string[];
}

interface EvidenceClassifierProps {
  imageUrl: string;
  bagId: string;
  onClassified?: (result: ClassificationResult) => void;
}

export const EvidenceClassifier = ({ imageUrl, bagId, onClassified }: EvidenceClassifierProps) => {
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const handleClassify = async () => {
    setIsClassifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('classify-evidence', {
        body: { imageUrl, bagId }
      });

      if (error) throw error;

      if (data?.classification) {
        setResult(data.classification);
        onClassified?.(data.classification);
        toast.success('Evidence classified successfully');
      }
    } catch (error: any) {
      console.error('Classification error:', error);
      toast.error(error.message || 'Failed to classify evidence');
    } finally {
      setIsClassifying(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Evidence Classification
        </CardTitle>
        <CardDescription>
          Automatically classify evidence type using AI vision analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <Button 
            onClick={handleClassify} 
            disabled={isClassifying}
            className="w-full"
          >
            {isClassifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Classify Evidence
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-lg font-semibold">{result.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${getConfidenceColor(result.confidence)}`} />
                <span className="text-sm font-medium">
                  {(result.confidence * 100).toFixed(0)}% confident
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-sm">{result.description}</p>
            </div>

            {result.tags && result.tags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={handleClassify} 
              disabled={isClassifying}
              className="w-full"
            >
              Re-classify
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};