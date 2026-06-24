import { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle, XCircle, Loader2, Smartphone, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, generateId } from '@/lib/utils';

interface QRCodeConnectProps {
  onConnected: (phoneNumber: string) => void;
  onError?: (error: string) => void;
}

type QRStatus = 'loading' | 'ready' | 'scanning' | 'connected' | 'expired' | 'error';

const QR_EXPIRY_SECONDS = 60;

export default function QRCodeConnect({ onConnected, onError }: QRCodeConnectProps) {
  const [status, setStatus] = useState<QRStatus>('loading');
  const [qrData, setQrData] = useState('');
  const [timeLeft, setTimeLeft] = useState(QR_EXPIRY_SECONDS);
  const [phoneNumber, setPhoneNumber] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanSimRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateQR = () => {
    setStatus('loading');
    setTimeLeft(QR_EXPIRY_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    if (scanSimRef.current) clearTimeout(scanSimRef.current);

    setTimeout(() => {
      const sessionId = generateId();
      const qrValue = `localboost://connect?session=${sessionId}&ts=${Date.now()}`;
      setQrData(qrValue);
      setStatus('ready');

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1500);
  };

  useEffect(() => {
    generateQR();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (scanSimRef.current) clearTimeout(scanSimRef.current);
    };
  }, []);

  // Draw QR on canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (status !== 'ready' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const cells = 25;
    const cellSize = size / cells;

    // Draw QR-like pattern (visual simulation)
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';

    // Use qrData string to seed pseudo-random pattern
    let seed = 0;
    for (let i = 0; i < qrData.length; i++) seed += qrData.charCodeAt(i);
    const rng = (n: number) => {
      seed = (seed * 16807 + 0) % 2147483647;
      return seed % n;
    };

    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        const isCorner =
          (row < 7 && col < 7) ||
          (row < 7 && col >= cells - 7) ||
          (row >= cells - 7 && col < 7);
        const inCornerInner =
          (row >= 2 && row < 5 && col >= 2 && col < 5) ||
          (row >= 2 && row < 5 && col >= cells - 5 && col < cells - 2) ||
          (row >= cells - 5 && row < cells - 2 && col >= 2 && col < 5);
        const isCornerBorder =
          (row === 0 || row === 6 || col === 0 || col === 6) && row < 7 && col < 7 ||
          (row === 0 || row === 6 || col === cells - 1 || col === cells - 7) && row < 7 && col >= cells - 7 ||
          (row === cells - 7 || row === cells - 1 || col === 0 || col === 6) && row >= cells - 7 && col < 7;

        let dark = false;
        if (isCorner) dark = isCornerBorder || inCornerInner;
        else dark = rng(2) === 1;

        if (dark) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize - 0.5, cellSize - 0.5);
        }
      }
    }

    // LocalBoost logo in center
    ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
    ctx.fillRect(size / 2 - 20, size / 2 - 20, 40, 40);
    ctx.fillStyle = '#25D366';
    ctx.beginPath();
    ctx.roundRect(size / 2 - 14, size / 2 - 14, 28, 28, 4);
    ctx.fill();
  }, [status, qrData]);

  const handleConnected = () => {
    const phone = '+55 (11) 9' + Math.floor(Math.random() * 9000 + 1000) + '-' + Math.floor(Math.random() * 9000 + 1000);
    setPhoneNumber(phone);
    setStatus('connected');
    if (timerRef.current) clearInterval(timerRef.current);
    onConnected(phone);
  };

  const progress = (timeLeft / QR_EXPIRY_SECONDS) * 100;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={cn(
        'relative w-56 h-56 rounded-2xl border-2 flex items-center justify-center overflow-hidden',
        status === 'connected' ? 'border-emerald-500' : 'border-border',
      )}>
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
          </div>
        )}

        {status === 'ready' && (
          <canvas ref={canvasRef} className="w-full h-full" />
        )}

        {status === 'expired' && (
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <XCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-muted-foreground">QR Code expirado</p>
            <Button size="sm" onClick={generateQR}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Gerar novo
            </Button>
          </div>
        )}

        {status === 'connected' && (
          <div className="flex flex-col items-center gap-3 text-center p-4">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
            <p className="font-semibold text-foreground text-sm">Conectado!</p>
            <p className="text-xs text-muted-foreground">{phoneNumber}</p>
          </div>
        )}

        {/* Timer ring */}
        {status === 'ready' && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1 bg-muted"
            style={{ transition: 'width 1s linear' }}
          >
            <div
              className={cn(
                'h-full transition-all duration-1000',
                timeLeft > 30 ? 'bg-primary' : timeLeft > 10 ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {status === 'ready' && (
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">Escaneie com seu WhatsApp</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Abra o WhatsApp → Menu → Aparelhos conectados → Conectar aparelho
          </p>
          <p className={cn(
            'text-xs font-mono',
            timeLeft > 30 ? 'text-muted-foreground' : timeLeft > 10 ? 'text-amber-500' : 'text-red-500'
          )}>
            Expira em {timeLeft}s
          </p>
          <div className="flex gap-2 justify-center mt-3">
            <Button size="sm" variant="outline" onClick={generateQR}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Atualizar
            </Button>
            {/* Simulate connection for demo */}
            <Button
              size="sm"
              onClick={handleConnected}
              className="bg-gradient-brand text-white hover:opacity-90"
            >
              <Wifi className="w-3 h-3 mr-1" />
              Simular conexão
            </Button>
          </div>
        </div>
      )}

      {status === 'connected' && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            WhatsApp conectado com sucesso!
          </p>
          <div className="mt-2 flex items-center gap-2 text-emerald-500 justify-center">
            <Smartphone className="w-4 h-4" />
            <span className="text-sm font-medium">{phoneNumber}</span>
          </div>
        </div>
      )}
    </div>
  );
}
