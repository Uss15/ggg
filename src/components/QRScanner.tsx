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
  const [initializing, setInitializing] = useState(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackWarnedRef = useRef(false);

  const startCamera = async () => {
    setInitializing(true);

    if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera API not available in this browser or context. Try Chrome or open in a new tab.');
      setInitializing(false);
      return;
    }

    const tryStart = async (mode: 'environment' | 'user') => {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure autoplay works across browsers (especially iOS)
        videoRef.current.muted = true;
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.setAttribute('playsinline', 'true');
        setStream(mediaStream);
        setIsScanning(true); // show video element immediately
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => resolve();
          if (videoRef.current.readyState >= 1) resolve();
        });
        await videoRef.current.play();
        startScanning();
        toast.success('Camera started');
      }
    };

    try {
      await tryStart('environment');
    } catch (err1: any) {
      console.warn('Environment camera failed, falling back to user camera', err1);
      try {
        await tryStart('user');
      } catch (error: any) {
        console.error('Camera access error:', error);
        setIsScanning(false);
        if (error.name === 'NotAllowedError') {
          toast.error('Camera permission denied. Allow access in browser settings.');
        } else if (error.name === 'NotFoundError' || error.message?.includes('Requested device not found')) {
          toast.error('No camera found on this device.');
        } else if (location.protocol !== 'https:') {
          toast.error('Camera requires HTTPS. Please use a secure connection.');
        } else if (window.top !== window.self) {
          toast.error('Camera may be blocked inside an embedded view. Use the button below to open in a new tab.');
        } else {
          toast.error('Unable to access camera. Please check permissions.');
        }
      }
    } finally {
      setInitializing(false);
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
        // Fallback: Browser lacks BarcodeDetector; keep camera running
        if (!fallbackWarnedRef.current) {
          toast.info("Live QR scanning not supported in this browser. Use Manual Entry.");
          fallbackWarnedRef.current = true;
        }
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
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-2 border-primary m-12 rounded-lg pointer-events-none" />
              {initializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                  <span className="text-sm">Initializing camera…</span>
                </div>
              )}
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
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            If the camera doesn’t start here (embedded view), open the scanner in a new tab.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isScanning || initializing}
            onClick={() => window.open(window.location.href, "_blank", "noopener,noreferrer")}
          >
            Open Scanner in New Tab
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
