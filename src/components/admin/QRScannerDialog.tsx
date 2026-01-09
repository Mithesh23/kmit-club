import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Camera, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  event_date?: string | null;
}

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  eventDate?: string | null;
  events?: Event[];
  onEventChange?: (event: { id: string; title: string; event_date?: string | null }) => void;
}

interface ScanResult {
  success: boolean;
  message: string;
  student_name: string | null;
  roll_number: string | null;
  scanned_at: string | null;
}

export function QRScannerDialog({ 
  open, 
  onOpenChange, 
  eventId, 
  eventTitle, 
  eventDate,
  events = [], 
  onEventChange 
}: QRScannerDialogProps) {
  // Check if event date has passed
  const isEventPast = eventDate ? new Date(eventDate) < new Date(new Date().toDateString()) : false;
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const setResultAndAutoResume = (result: ScanResult) => {
    setScanResult(result);
    // Auto-resume scanning after 2 seconds for all scans
    autoResumeTimerRef.current = setTimeout(() => {
      setScanResult(null);
      startScanning();
    }, 2000);
  };

  const onScanSuccess = async (decodedText: string, result: Html5QrcodeResult) => {
    // Stop scanning immediately to prevent duplicate scans
    await stopScanning();
    setIsProcessing(true);

    try {
      // Parse QR data
      const qrData = JSON.parse(decodedText);
      
      if (!qrData.token || !qrData.event_id) {
        setResultAndAutoResume({
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
        setResultAndAutoResume({
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
        setResultAndAutoResume({
          success: false,
          message: "Database error. Please try again.",
          student_name: null,
          roll_number: null,
          scanned_at: null,
        });
        return;
      }

      const resultData = data?.[0];
      setResultAndAutoResume({
        success: resultData?.success || false,
        message: resultData?.message || "Unknown error",
        student_name: resultData?.student_name || null,
        roll_number: resultData?.roll_number || null,
        scanned_at: resultData?.scanned_at || null,
      });

    } catch (err) {
      console.error("Error processing QR:", err);
      setResultAndAutoResume({
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


  // Auto-start camera when dialog opens (only if event is not past)
  useEffect(() => {
    if (open && eventId && !isScanning && !scanResult && !isProcessing && !isEventPast) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanning();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, eventId, isEventPast]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!open) {
      stopScanning();
      setScanResult(null);
      if (autoResumeTimerRef.current) {
        clearTimeout(autoResumeTimerRef.current);
        autoResumeTimerRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      stopScanning();
      if (autoResumeTimerRef.current) {
        clearTimeout(autoResumeTimerRef.current);
        autoResumeTimerRef.current = null;
      }
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
            Scan QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Selector */}
          {events.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Event</label>
              <Select
                value={eventId}
                onValueChange={(value) => {
                  const selectedEvent = events.find(e => e.id === value);
                  if (selectedEvent && onEventChange) {
                    onEventChange({ id: selectedEvent.id, title: selectedEvent.title, event_date: selectedEvent.event_date });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Event Past Warning */}
          {isEventPast && eventId && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-300">Event Date Passed</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Attendance cannot be marked after the event date has passed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Container */}
          {!scanResult && eventId && !isEventPast && (
            <div className="space-y-4">
              <div 
                id="qr-reader" 
                ref={containerRef}
                className="w-full aspect-square bg-muted rounded-lg overflow-hidden"
              />
              
              {!isScanning && !isProcessing && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Starting camera...</span>
                </div>
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
                  <p className="text-xs text-green-600 dark:text-green-400 mt-3 text-center flex items-center justify-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Resuming scanner...
                  </p>
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

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Resuming scanner...</span>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Close Scanner
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
