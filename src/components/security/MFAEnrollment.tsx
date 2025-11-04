import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Smartphone, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function MFAEnrollment() {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const hasTOTP = data?.totp?.some(factor => factor.status === 'verified');
      setIsEnrolled(hasTOTP || false);
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  };

  const startEnrollment = async () => {
    setEnrolling(true);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      toast.success('Scan the QR code with your authenticator app');
    } catch (error) {
      console.error('Error enrolling MFA:', error);
      toast.error('Failed to start MFA enrollment');
    } finally {
      setLoading(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      const factorId = factors.data?.totp?.[0]?.id;

      if (!factorId) throw new Error('No factor found');

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });

      if (error) throw error;

      toast.success('2FA successfully enabled!');
      setIsEnrolled(true);
      setEnrolling(false);
      setQrCode('');
      setSecret('');
      setVerifyCode('');
    } catch (error) {
      console.error('Error verifying MFA:', error);
      toast.error('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const unenroll = async () => {
    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factorId = factors?.totp?.[0]?.id;

      if (!factorId) throw new Error('No factor found');

      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      toast.success('2FA disabled');
      setIsEnrolled(false);
    } catch (error) {
      console.error('Error unenrolling MFA:', error);
      toast.error('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication (2FA)
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnrolled ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is enabled for your account
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is not enabled. Enable it to secure your account.
            </AlertDescription>
          </Alert>
        )}

        {!isEnrolled && !enrolling && (
          <Button onClick={startEnrollment} disabled={loading} className="w-full">
            <Smartphone className="h-4 w-4 mr-2" />
            Enable 2FA
          </Button>
        )}

        {enrolling && (
          <div className="space-y-4">
            {qrCode && (
              <div className="flex flex-col items-center space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                </div>
                {secret && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Or enter this code manually:</p>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{secret}</code>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Code</label>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={verifyEnrollment} disabled={loading || verifyCode.length !== 6} className="flex-1">
                Verify & Enable
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEnrolling(false);
                  setQrCode('');
                  setSecret('');
                  setVerifyCode('');
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isEnrolled && (
          <Button variant="destructive" onClick={unenroll} disabled={loading} className="w-full">
            Disable 2FA
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
