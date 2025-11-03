import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, XCircle, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChainIntegrity {
  log_id: string;
  is_valid: boolean;
  expected_hash: string;
  actual_hash: string;
}

export function BlockchainVerification({ bagId }: { bagId: string }) {
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState<ChainIntegrity[]>([]);
  const [verified, setVerified] = useState<boolean | null>(null);

  const verifyChain = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.rpc('verify_custody_chain_integrity', {
        p_bag_id: bagId,
      });

      if (error) throw error;

      setResults(data || []);
      const allValid = data?.every((r: ChainIntegrity) => r.is_valid) ?? false;
      setVerified(allValid);

      if (allValid) {
        toast.success('Chain of custody integrity verified');
      } else {
        toast.error('Chain of custody integrity compromised!');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error('Failed to verify chain integrity');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Blockchain Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Verify the cryptographic integrity of the chain of custody using SHA-256 blockchain hashing.
        </p>

        <Button
          onClick={verifyChain}
          disabled={verifying}
          className="w-full"
        >
          <Hash className="h-4 w-4 mr-2" />
          {verifying ? 'Verifying...' : 'Verify Chain Integrity'}
        </Button>

        {verified !== null && (
          <Alert variant={verified ? 'default' : 'destructive'}>
            {verified ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {verified
                ? 'Chain of custody integrity verified. All entries are authentic and unmodified.'
                : 'WARNING: Chain of custody integrity compromised! Tampering detected.'}
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Verification Results:</h4>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={result.log_id}
                  className={`p-3 border rounded-lg text-xs ${
                    result.is_valid ? 'border-success/50 bg-success/5' : 'border-destructive bg-destructive/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Entry #{index + 1}</span>
                    <Badge variant={result.is_valid ? 'secondary' : 'destructive'}>
                      {result.is_valid ? 'Valid' : 'Invalid'}
                    </Badge>
                  </div>
                  {!result.is_valid && (
                    <div className="space-y-1">
                      <div>
                        <span className="text-muted-foreground">Expected:</span>
                        <p className="font-mono break-all">{result.expected_hash}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Actual:</span>
                        <p className="font-mono break-all">{result.actual_hash}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
