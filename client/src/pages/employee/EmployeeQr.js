import { useEffect, useRef, useState } from 'react';
import { Button, Panel, StatusPill } from '../../components/Ui';
import { empGenerateQr } from '../../utils/apiClient';
import { WS_URL } from '../../utils/config';
import { getTokenForRole } from '../../utils/auth';

const QR_LIFETIME_MS = 5 * 60 * 1000;

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatExpiry(timestamp) {
  if (!timestamp) {
    return '-';
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return parsed.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function EmployeeQr() {
  const [token] = useState(() => getTokenForRole('employee'));
  const [qrData, setQrData] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [qrExpiresAt, setQrExpiresAt] = useState('');
  const [qrStatus, setQrStatus] = useState({ tone: '', message: '' });
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [wsEnabled, setWsEnabled] = useState(true);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const wsRef = useRef(null);

  const applyQrPayload = (payload, feedbackMessage = '') => {
    const nextExpiresAt = payload.expiresAt || '';
    setQrCode(payload.qrCode || '');
    setQrData(payload.qrData || '');
    setQrExpiresAt(nextExpiresAt);
    setTimeLeftMs(nextExpiresAt ? Math.max(0, Date.parse(nextExpiresAt) - Date.now()) : 0);
    setQrStatus({ tone: feedbackMessage ? 'success' : '', message: feedbackMessage });
  };

  useEffect(() => {
    if (!token || !wsEnabled) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsStatus('disconnected');
      return;
    }

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;
    setWsStatus('connecting');

    ws.onopen = () => setWsStatus('connected');
    ws.onclose = () => setWsStatus('disconnected');
    ws.onerror = () => setWsStatus('error');
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'qr') {
          const nextExpiresAt = message.expiresAt || '';
          setQrCode(message.qrCode || '');
          setQrData(message.qrData || '');
          setQrExpiresAt(nextExpiresAt);
          setTimeLeftMs(nextExpiresAt ? Math.max(0, Date.parse(nextExpiresAt) - Date.now()) : 0);
          setQrStatus({ tone: '', message: '' });
          return;
        }
        if (message.type === 'error') {
          setQrStatus({ tone: 'error', message: message.message || 'QR stream error' });
        }
      } catch (err) {
        setQrStatus({ tone: 'error', message: 'Unexpected QR stream data' });
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, wsEnabled]);

  useEffect(() => {
    if (!qrExpiresAt) {
      setTimeLeftMs(0);
      return;
    }

    const syncCountdown = () => {
      const remaining = Date.parse(qrExpiresAt) - Date.now();
      setTimeLeftMs(Number.isNaN(remaining) ? 0 : Math.max(0, remaining));
    };

    syncCountdown();
    const timer = setInterval(syncCountdown, 1000);
    return () => clearInterval(timer);
  }, [qrExpiresAt]);

  const refreshQr = async () => {
    setQrStatus({ tone: '', message: 'Refreshing QR...' });
    try {
      const data = await empGenerateQr(token);
      applyQrPayload(data, 'Fresh QR ready.');
    } catch (err) {
      setQrStatus({ tone: 'error', message: err.message });
    }
  };

  const copyQrData = async () => {
    if (!qrData) return;
    try {
      await navigator.clipboard.writeText(qrData);
      setQrStatus({ tone: 'success', message: 'QR payload copied.' });
    } catch (err) {
      setQrStatus({ tone: 'error', message: 'Copy failed.' });
    }
  };

  const countdownTone = !qrExpiresAt ? 'neutral' : timeLeftMs <= 30000 ? 'danger' : timeLeftMs <= 60000 ? 'warning' : 'success';
  const countdownLabel = !qrExpiresAt ? 'Waiting for QR' : timeLeftMs <= 0 ? 'Expired' : timeLeftMs <= 60000 ? 'Expiring soon' : 'Valid';
  const countdownText = qrExpiresAt ? formatCountdown(timeLeftMs) : '--:--';
  const expiryText = formatExpiry(qrExpiresAt);
  const progressWidth = qrExpiresAt ? Math.max(0, Math.min(100, (timeLeftMs / QR_LIFETIME_MS) * 100)) : 0;

  return (
    <div className="grid compact-grid">
      <Panel
        title="Employee QR"
        subtitle="Live encrypted QR credentials"
        right={
          <div className="panel-head-actions">
            <StatusPill tone={wsStatus === 'connected' ? 'success' : wsStatus === 'error' ? 'danger' : 'neutral'}>
              QR stream: {wsStatus}
            </StatusPill>
            <StatusPill tone={countdownTone}>
              {countdownLabel}: {countdownText}
            </StatusPill>
          </div>
        }
      >
        <label className="toggle">
          <input type="checkbox" checked={wsEnabled} onChange={(event) => setWsEnabled(event.target.checked)} />
          Live stream
        </label>

        <div className="qr-frame">
          {qrCode ? <img src={qrCode} alt="Employee QR" /> : <p>No QR yet</p>}
        </div>

        <div className="qr-meta qr-meta-grid">
          <div className="qr-meta-card qr-countdown-card">
            <p className="label">Time left</p>
            <div className="qr-timer-row">
              <strong className="qr-timer-large">{countdownText}</strong>
              <StatusPill tone={countdownTone}>{countdownLabel}</StatusPill>
            </div>
            <p className="qr-timer-copy">
              {qrExpiresAt
                ? 'The QR rotates automatically while the live stream stays connected.'
                : 'Waiting for the secure stream to deliver the current QR code.'}
            </p>
            <div className="qr-timer-track" aria-hidden="true">
              <div className={`qr-timer-fill ${countdownTone}`} style={{ width: `${progressWidth}%` }} />
            </div>
          </div>
          <div className="qr-meta-card qr-expiry-card">
            <p className="label">Expires</p>
            <strong>{expiryText}</strong>
            <span>{qrExpiresAt ? 'Shown in your local device time.' : 'Expiry time will appear once a QR is available.'}</span>
          </div>
        </div>

        <div className="actions">
          <Button type="button" onClick={refreshQr}>
            Refresh now
          </Button>
          <Button type="button" variant="ghost" onClick={copyQrData}>
            Copy QR payload
          </Button>
        </div>
        {qrStatus.message && <p className={`note ${qrStatus.tone}`}>{qrStatus.message}</p>}
      </Panel>
    </div>
  );
}
