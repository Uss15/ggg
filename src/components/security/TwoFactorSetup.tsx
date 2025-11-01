import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface TwoFactorSetupProps {
  userId: string;
  onComplete: () => void;
}

export function TwoFactorSetup({ userId, onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'enroll' | 'verify'>('enroll');
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const enrollMFA = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'SFEP Mobile App',
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep('verify');
        toast.success("Scan the QR code with your authenticator app");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to setup 2FA");
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });

      if (error) throw error;

      if (data) {
        toast.success("Two-factor authentication enabled successfully!");
        onComplete();
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Secret key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'enroll') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enable Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Two-factor authentication (2FA) helps protect your account by requiring a second verification step when signing in.
          </p>
          <Button onClick={enrollMFA} disabled={loading} className="w-full">
            {loading ? "Setting up..." : "Setup 2FA"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Your Authenticator</CardTitle>
        <CardDescription>
          Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          {qrCode && (
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG value={qrCode} size={200} level="H" includeMargin />
            </div>
          )}
          
          <div className="w-full">
            <Label htmlFor="secret">Or enter this key manually:</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="secret"
                value={secret}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copySecret}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="verify-code">Enter 6-digit code from your app</Label>
          <Input
            id="verify-code"
            type="text"
            placeholder="000000"
            maxLength={6}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
            className="text-center text-2xl tracking-widest"
          />
        </div>

        <Button 
          onClick={verifyMFA} 
          disabled={loading || verifyCode.length !== 6}
          className="w-full"
        >
          {loading ? "Verifying..." : "Verify and Enable"}
        </Button>
      </CardContent>
    </Card>
  );
}
