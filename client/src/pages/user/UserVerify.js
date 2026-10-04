import { useEffect, useRef, useState } from 'react';
import { Button, Field, Panel, SectionHeader, StatusPill } from '../../components/Ui';
import { userVerifyScan } from '../../utils/apiClient';
import { getTokenForRole } from '../../utils/auth';

function hasQrDetector() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

async function readQrPayload(source) {
  if (!hasQrDetector()) {
    throw new Error('This browser does not support QR extraction. Use a Chromium-based browser or paste the payload manually.');
  }

  const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
  const barcodes = await detector.detect(source);
  const match = barcodes.find((item) => item.rawValue);
  return match?.rawValue?.trim() || '';
}

function formatDateTime(value) {
  if (!value) {
    return '--';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function shortenId(value, maxLength = 28) {
  if (!value) {
    return '--';
  }

  if (value.length <= maxLength) {
    return value;
  }

  const edge = Math.max(6, Math.floor((maxLength - 3) / 2));
  return `${value.slice(0, edge)}...${value.slice(-edge)}`;
}

function normalizeVerifyResult(data) {
  const scan = data.scanRecord || {};
  return {
    ScanID: scan.ScanID || '',
    EmpID: scan.EmpID || '',
    EmpName: scan.EmpName || '',
    EmpDeptID: scan.EmpDeptID || '',
    EmpDeptName: scan.EmpDeptName || '',
    usedAt: scan.usedAt || '',
    expiresAt: scan.expiresAt || '',
  };
}

async function requestScanVerification(token, qrData) {
  const data = await userVerifyScan(token, qrData);
  return {
    result: normalizeVerifyResult(data),
    qrData: data.qrData || '',
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

export default function UserVerify() {
  const [token] = useState(() => getTokenForRole('user'));
  const [scanInput, setScanInput] = useState('');
  const [scanStatus, setScanStatus] = useState({ tone: '', message: '' });
  const [uploadStatus, setUploadStatus] = useState({ tone: '', message: '' });
  const [payloadStatus, setPayloadStatus] = useState({ tone: '', message: '' });
  const [verifyResult, setVerifyResult] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [detectorSupported] = useState(() => hasQrDetector());

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const captureLockRef = useRef(false);

  const stopCamera = () => {
    if (scanLoopRef.current) {
      clearInterval(scanLoopRef.current);
      scanLoopRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const verifyScan = async (rawPayload = '') => {
    const qrData = (rawPayload || scanInput).trim();

    if (!qrData) {
      const message = 'No QR payload available to verify.';
      setPayloadStatus({ tone: 'error', message });
      setScanStatus({ tone: 'error', message });
      return;
    }

    setPayloadStatus({ tone: '', message: 'Verifying typed payload...' });
    setScanStatus({ tone: '', message: 'Verifying scan...' });
    try {
      const verification = await requestScanVerification(token, { qrData });
      setVerifyResult(verification.result);
      setScanInput(verification.qrData || qrData);
      setPayloadStatus({ tone: 'success', message: 'Payload verified successfully.' });
      setScanStatus({ tone: 'success', message: 'Scan verified successfully.' });
    } catch (err) {
      setVerifyResult(null);
      setPayloadStatus({ tone: 'error', message: err.message });
      setScanStatus({ tone: 'error', message: err.message });
    }
  };

  const extractFromFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedImageName(file.name);
    setUploadingImage(true);
    setUploadStatus({ tone: '', message: 'Uploading QR image for verification...' });
    setPayloadStatus({ tone: '', message: '' });
    setScanStatus({ tone: '', message: 'Uploading QR image for verification...' });

    try {
      const imageData = await fileToDataUrl(file);
      const verification = await requestScanVerification(token, { imageData });
      setVerifyResult(verification.result);
      setScanInput(verification.qrData);
      setUploadStatus({ tone: 'success', message: 'QR image verified successfully.' });
      setScanStatus({ tone: 'success', message: 'QR image verified successfully.' });
    } catch (err) {
      setVerifyResult(null);
      setUploadStatus({ tone: 'error', message: err.message });
      setScanStatus({ tone: 'error', message: err.message });
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return undefined;
    }

    if (!detectorSupported) {
      setCameraStatus('QR extraction is not supported in this browser.');
      setCameraOpen(false);
      return undefined;
    }

    let cancelled = false;

    const startCamera = async () => {
      setCameraStatus('Starting camera...');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          return;
        }

        video.srcObject = stream;
        await video.play();
        setCameraStatus('Point the camera at the QR code.');

        scanLoopRef.current = setInterval(async () => {
          if (captureLockRef.current || !videoRef.current || !canvasRef.current) {
            return;
          }

          const activeVideo = videoRef.current;
          if (activeVideo.readyState < 2 || !activeVideo.videoWidth || !activeVideo.videoHeight) {
            return;
          }

          const canvas = canvasRef.current;
          canvas.width = activeVideo.videoWidth;
          canvas.height = activeVideo.videoHeight;

          const context = canvas.getContext('2d');
          if (!context) {
            return;
          }

          context.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);

          captureLockRef.current = true;
          try {
            const qrValue = await readQrPayload(canvas);
            if (!qrValue) {
              return;
            }

            setScanInput(qrValue);
            setCameraStatus('QR detected. Verifying...');
            setCameraOpen(false);
            setScanStatus({ tone: '', message: 'Verifying scan...' });

            try {
              const verification = await requestScanVerification(token, { qrData: qrValue });
              setVerifyResult(verification.result);
              setScanInput(verification.qrData || qrValue);
              setPayloadStatus({ tone: '', message: '' });
              setUploadStatus({ tone: '', message: '' });
              setScanStatus({ tone: 'success', message: 'Scan verified successfully.' });
            } catch (err) {
              setVerifyResult(null);
              setScanStatus({ tone: 'error', message: err.message });
            }
          } finally {
            captureLockRef.current = false;
          }
        }, 700);
      } catch (err) {
        setCameraStatus(err.message || 'Camera access failed.');
        setCameraOpen(false);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [cameraOpen, detectorSupported, token]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const cameraTone = detectorSupported ? (cameraOpen ? 'success' : 'neutral') : 'danger';

  return (
    <div className="page-stack user-verify-page">
      <Panel
        title="Scan Verification"
        subtitle="Extract the QR text in the browser, then send the encrypted payload to the backend for verification."
        right={
          <StatusPill tone={scanStatus.tone === 'error' ? 'danger' : verifyResult ? 'success' : 'neutral'}>
            {scanStatus.message || 'Waiting for scan'}
          </StatusPill>
        }
      >
        <div className="user-verify-grid">
          <div className="admin-action-card create user-verify-capture">
            <SectionHeader title="Capture QR" subtitle="Use camera or upload a QR image. Manual payload entry remains as a fallback." />
            <div className="verify-capture-banner">
              <div className="verify-capture-copy">
                <p className="label">How it works</p>
                <strong>Capture the QR first, then the app extracts and verifies it for you.</strong>
                <span>Use camera for live scanning or upload a screenshot when camera support is unavailable.</span>
              </div>
              <div className="verify-capture-badges">
                <StatusPill tone={cameraTone}>{detectorSupported ? 'Camera ready' : 'Camera unavailable'}</StatusPill>
                <StatusPill tone={selectedImageName ? 'success' : 'neutral'}>{selectedImageName ? 'Image selected' : 'Upload ready'}</StatusPill>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={extractFromFile} hidden />
            <div className="verify-option-grid">
              <div className={`verify-option-card ${cameraOpen ? 'active' : ''} ${!detectorSupported ? 'disabled' : ''}`}>
                <div className="verify-option-head">
                  <p className="label">Camera</p>
                </div>
                <strong>{detectorSupported ? 'Scan directly from camera' : 'Camera scan not available here'}</strong>
                <span>
                  {detectorSupported
                    ? 'Best for scanning a QR shown on another screen or device.'
                    : 'This browser cannot decode live camera frames. Use image upload instead.'}
                </span>
                <Button
                  type="button"
                  variant={detectorSupported ? 'primary' : 'ghost'}
                  onClick={() => setCameraOpen((prev) => !prev)}
                  disabled={!detectorSupported}
                >
                  {cameraOpen ? 'Close camera' : 'Scan with camera'}
                </Button>
              </div>

              <div className="verify-option-card upload">
                <div className="verify-option-head">
                  <p className="label">Upload</p>
                </div>
                <strong>{selectedImageName ? 'QR image selected' : 'Choose a QR image'}</strong>
                <span>Upload PNG, JPG, or screenshot files. The backend will extract and verify the QR text.</span>
                <div className="verify-file-pill">{selectedImageName || 'No image selected yet'}</div>
                <Button type="button" variant="ghost" onClick={openFilePicker} disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading image...' : 'Choose QR image'}
                </Button>
                {selectedImageName && (
                  <p className={`note ${uploadStatus.tone}`}>
                    {uploadingImage ? 'Processing selected image...' : uploadStatus.message || 'Image ready for verification.'}
                  </p>
                )}
              </div>
            </div>
            <div className="verify-inline-notes">
              <p className="note">
                {detectorSupported
                  ? 'Camera scan uses browser QR detection. Image upload works through the backend even if browser extraction fails.'
                  : 'Camera scan is not supported in this browser, but QR image upload still works.'}
              </p>
            </div>
            {cameraOpen && (
              <div className="verify-camera-shell">
                <div className="verify-camera-frame">
                  <video ref={videoRef} autoPlay muted playsInline />
                  <div className="verify-camera-overlay" aria-hidden="true" />
                </div>
                <p className="note">{cameraStatus}</p>
              </div>
            )}
            <canvas ref={canvasRef} hidden />
          </div>

          <div className="admin-action-card update user-verify-payload">
            <SectionHeader title="Extracted payload" subtitle="The encrypted text stays visible here before or after verification." />
            <Field
              label="Encrypted QR payload"
              as="textarea"
              rows={5}
              value={scanInput}
              onChange={(event) => setScanInput(event.target.value)}
              placeholder={detectorSupported ? 'Scan a QR image, upload one, or use the camera to populate this automatically.' : 'Upload a QR image or paste encrypted QR payload here'}
            />
            <div className="actions">
              <Button type="button" onClick={() => verifyScan()}>
                Verify payload
              </Button>
            </div>
            {payloadStatus.message && <p className={`note ${payloadStatus.tone}`}>{payloadStatus.message}</p>}
          </div>
        </div>

        <div className="user-verify-result-grid">
          <div className="admin-metric-card user-verify-result">
            <p className="label">Verification state</p>
            <strong>{verifyResult ? 'Verified' : '--'}</strong>
            <span>{verifyResult ? 'Scan accepted and stored successfully.' : 'No verified scan record yet.'}</span>
          </div>
          <div className="admin-metric-card user-verify-result">
            <p className="label">Employee</p>
            <strong>{verifyResult?.EmpName || verifyResult?.EmpID || '--'}</strong>
            <span>{verifyResult?.EmpID ? `Employee ID ${verifyResult.EmpID}` : 'Recovered from the decrypted employee payload.'}</span>
          </div>
          <div className="admin-metric-card user-verify-result">
            <p className="label">Department</p>
            <strong>{verifyResult?.EmpDeptName || verifyResult?.EmpDeptID || '--'}</strong>
            <span>{verifyResult?.EmpDeptID ? `Department ID ${verifyResult.EmpDeptID}` : 'Linked department from the verified employee record.'}</span>
          </div>
          <div className="admin-metric-card user-verify-result user-verify-result-time">
            <p className="label">Verified at</p>
            <strong>{verifyResult ? formatDateTime(verifyResult.usedAt) : '--'}</strong>
            <span>{verifyResult ? 'Stored as a scan event in your history.' : 'Verification timestamp will appear here.'}</span>
            {verifyResult?.ScanID && (
              <div className="user-verify-id" title={verifyResult.ScanID}>
                <p className="label">Scan ID</p>
                <code>{shortenId(verifyResult.ScanID)}</code>
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
