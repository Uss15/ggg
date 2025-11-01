import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";

interface QRScannerProps {
  onScan: (bagId: string) => void;
}

export const QRScanner = ({ onScan }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        // Explicitly play the video
        try {
          await videoRef.current.play();
          setIsScanning(true);
          startScanning();
          toast.success("Camera started successfully");
        } catch (playError) {
          console.error("Video play error:", playError);
          toast.error("Failed to start camera preview");
          // Clean up the stream if play fails
          mediaStream.getTracks().forEach(track => track.stop());
        }
      }
    } catch (error: any) {
      console.error("Camera access error:", error);
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        toast.error("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (error.name === 'NotFoundError') {
        toast.error("No camera found on this device.");
      } else {
        toast.error("Unable to access camera. Please check permissions.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanning = () => {
    scanIntervalRef.current = setInterval(() => {
      captureAndDecode();
    }, 500);
  };

  const captureAndDecode = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Use BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code']
        });
        
        const barcodes = await barcodeDetector.detect(canvas);
        
        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue;
          handleQRDetected(qrData);
        }
      } else {
        // Fallback: Manual QR detection using image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        // This is a placeholder - in production, use a library like jsQR
        toast.info("Please use manual entry. QR scanning requires browser support.");
        stopCamera();
      }
    } catch (error) {
      console.error("QR detection error:", error);
    }
  };

  const handleQRDetected = (data: string) => {
    stopCamera();
    
    // Extract bag ID from URL or use directly
    const bagIdMatch = data.match(/BAG-\d{4}-\d{4}/);
    if (bagIdMatch) {
      toast.success("QR Code detected!");
      onScan(bagIdMatch[0]);
    } else {
      toast.error("Invalid QR code format");
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Scanner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {isScanning ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-2 border-primary m-12 rounded-lg pointer-events-none" />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Camera className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <Button
          onClick={isScanning ? stopCamera : startCamera}
          className="w-full"
          variant={isScanning ? "destructive" : "default"}
        >
          {isScanning ? (
            <>
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Position the QR code within the frame to scan
        </p>
      </CardContent>
    </Card>
  );
};
