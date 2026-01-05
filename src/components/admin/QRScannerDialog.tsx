import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Camera, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
}

interface ScanResult {
  success: boolean;
  message: string;
  student_name: string | null;
  roll_number: string | null;
  scanned_at: string | null;
}

export function QRScannerDialog({ open, onOpenChange, eventId, eventTitle }: QRScannerDialogProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        () => {} // Ignore scan failures
      );

      setIsScanning(true);
      setScanResult(null);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string, result: Html5QrcodeResult) => {
    // Stop scanning immediately to prevent duplicate scans
    await stopScanning();
    setIsProcessing(true);

    try {
      // Parse QR data
      const qrData = JSON.parse(decodedText);
      
      if (!qrData.token || !qrData.event_id) {
        setScanResult({
          success: false,
          message: "Invalid QR Code format",
          student_name: null,
          roll_number: null,
          scanned_at: null,
        });
        return;
      }

      // Validate that QR is for this event
      if (qrData.event_id !== eventId) {
        setScanResult({
          success: false,
          message: "This QR code is for a different event",
          student_name: null,
          roll_number: null,
          scanned_at: null,
        });
        return;
      }

      // Call the database function to mark attendance
      const { data, error } = await supabase.rpc('mark_event_attendance', {
        p_qr_token: qrData.token,
        p_event_id: eventId,
      });

      if (error) {
        console.error("Error marking attendance:", error);
        setScanResult({
          success: false,
          message: "Database error. Please try again.",
          student_name: null,
          roll_number: null,
          scanned_at: null,
        });
        return;
      }

      const resultData = data?.[0];
      setScanResult({
        success: resultData?.success || false,
        message: resultData?.message || "Unknown error",
        student_name: resultData?.student_name || null,
        roll_number: resultData?.roll_number || null,
        scanned_at: resultData?.scanned_at || null,
      });

      if (resultData?.success) {
        toast({
          title: "Attendance Marked!",
          description: `${resultData.student_name} (${resultData.roll_number}) is now present.`,
        });
      }

    } catch (err) {
      console.error("Error processing QR:", err);
      setScanResult({
        success: false,
        message: "Invalid QR Code",
        student_name: null,
        roll_number: null,
        scanned_at: null,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanAnother = () => {
    setScanResult(null);
    startScanning();
  };

  // Cleanup on unmount or close
  useEffect(() => {
    if (!open) {
      stopScanning();
      setScanResult(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan QR Code - {eventTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner Container */}
          {!scanResult && (
            <div className="space-y-4">
              <div 
                id="qr-reader" 
                ref={containerRef}
                className="w-full aspect-square bg-muted rounded-lg overflow-hidden"
              />
              
              {!isScanning && !isProcessing && (
                <Button onClick={startScanning} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              )}

              {isProcessing && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Processing...</span>
                </div>
              )}
            </div>
          )}

          {/* Scan Result */}
          {scanResult && (
            <div className="space-y-4">
              {scanResult.success ? (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <span className="text-lg font-semibold text-green-700 dark:text-green-300">
                      Attendance Marked!
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Student Name:</span>
                      <span className="font-medium">{scanResult.student_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Roll Number:</span>
                      <span className="font-medium">{scanResult.roll_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scan Time:</span>
                      <span className="font-medium">{formatTime(scanResult.scanned_at)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {scanResult.message.includes("already") ? (
                      <AlertCircle className="h-8 w-8 text-amber-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                    <span className="text-lg font-semibold text-red-700 dark:text-red-300">
                      {scanResult.message}
                    </span>
                  </div>
                  {scanResult.student_name && (
                    <div className="space-y-1 text-sm mt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Student:</span>
                        <span className="font-medium">{scanResult.student_name}</span>
                      </div>
                      {scanResult.scanned_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Previously scanned:</span>
                          <span className="font-medium">{formatTime(scanResult.scanned_at)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleScanAnother} className="flex-1">
                  <Camera className="mr-2 h-4 w-4" />
                  Scan Another
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
