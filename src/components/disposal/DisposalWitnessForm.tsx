import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DigitalSignature } from "@/components/evidence/DigitalSignature";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";

interface WitnessData {
  name: string;
  signature: string;
  signedAt: string;
}

interface DisposalWitnessFormProps {
  witnessNumber: 1 | 2;
  onComplete: (data: WitnessData) => void;
}

export const DisposalWitnessForm = ({ witnessNumber, onComplete }: DisposalWitnessFormProps) => {
  const [witnessName, setWitnessName] = useState("");
  const [signature, setSignature] = useState("");

  const handleSignature = (sig: string) => {
    setSignature(sig);
    toast.success(`Witness ${witnessNumber} signature captured`);
  };

  const handleComplete = () => {
    if (!witnessName.trim()) {
      toast.error("Please enter witness name");
      return;
    }
    if (!signature) {
      toast.error("Please provide signature");
      return;
    }

    onComplete({
      name: witnessName,
      signature: signature,
      signedAt: new Date().toISOString()
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Witness {witnessNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`witness${witnessNumber}Name`}>Witness Name</Label>
          <Input
            id={`witness${witnessNumber}Name`}
            value={witnessName}
            onChange={(e) => setWitnessName(e.target.value)}
            placeholder="Enter witness full name"
          />
        </div>

        <DigitalSignature
          title={`Witness ${witnessNumber} Signature`}
          onSign={handleSignature}
          onClear={() => setSignature("")}
        />

        {signature && (
          <div className="border rounded-lg p-2">
            <img src={signature} alt="Signature preview" className="max-h-32 mx-auto" />
          </div>
        )}

        <Button
          onClick={handleComplete}
          disabled={!witnessName.trim() || !signature}
          className="w-full"
        >
          Confirm Witness {witnessNumber}
        </Button>
      </CardContent>
    </Card>
  );
};
