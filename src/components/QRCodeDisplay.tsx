import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface QRCodeDisplayProps {
  bagId: string;
  url: string;
}

export const QRCodeDisplay = ({ bagId, url }: QRCodeDisplayProps) => {
  const downloadQR = () => {
    const svg = document.getElementById(`qr-${bagId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `${bagId}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">QR Code for {bagId}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG
            id={`qr-${bagId}`}
            value={url}
            size={200}
            level="H"
            includeMargin
          />
        </div>
        <Button onClick={downloadQR} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download QR Code
        </Button>
      </CardContent>
    </Card>
  );
};