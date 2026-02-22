import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, ShieldX, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';

interface CertificateVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VerifiedCertificate {
  certificate_number: string;
  certificate_title: string;
  student_name: string;
  roll_number: string;
  issued_at: string;
  club: { name: string } | null;
  event: { title: string; event_date: string | null } | null;
}

export const CertificateVerifyDialog = ({ open, onOpenChange }: CertificateVerifyDialogProps) => {
  const [certNumber, setCertNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [certificate, setCertificate] = useState<VerifiedCertificate | null>(null);

  const handleVerify = async () => {
    const trimmed = certNumber.trim().toUpperCase();
    if (!trimmed) return;

    setIsVerifying(true);
    setResult('idle');
    setCertificate(null);

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          certificate_number,
          certificate_title,
          student_name,
          roll_number,
          issued_at,
          club:clubs(name),
          event:events(title, event_date)
        `)
        .eq('certificate_number', trimmed)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCertificate(data as VerifiedCertificate);
        setResult('valid');
      } else {
        setResult('invalid');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setResult('invalid');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setCertNumber('');
      setResult('idle');
      setCertificate(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Verify Event Certificate
          </DialogTitle>
          <DialogDescription>
            Enter the certificate number to verify its authenticity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. CERT-A1B2C3D4"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              className="font-mono uppercase"
            />
            <Button onClick={handleVerify} disabled={isVerifying || !certNumber.trim()}>
              {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {result === 'valid' && certificate && (
            <div className="rounded-lg border-2 border-green-500/50 bg-green-50 dark:bg-green-950/30 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                <ShieldCheck className="h-5 w-5" />
                Certificate is Authentic
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Certificate No.</span>
                  <Badge variant="outline" className="font-mono">{certificate.certificate_number}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title</span>
                  <span className="font-medium text-right">{certificate.certificate_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student</span>
                  <span className="font-medium">{certificate.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Roll Number</span>
                  <span className="font-medium">{certificate.roll_number}</span>
                </div>
                {certificate.club?.name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Club</span>
                    <span className="font-medium">{certificate.club.name}</span>
                  </div>
                )}
                {certificate.event?.title && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event</span>
                    <span className="font-medium">{certificate.event.title}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issued On</span>
                  <span className="font-medium">{format(new Date(certificate.issued_at), 'PPP')}</span>
                </div>
              </div>
            </div>
          )}

          {result === 'invalid' && (
            <div className="rounded-lg border-2 border-destructive/50 bg-red-50 dark:bg-red-950/30 p-4 animate-fade-in">
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <ShieldX className="h-5 w-5" />
                Certificate Not Found
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                No certificate exists with this number. Please check and try again.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
