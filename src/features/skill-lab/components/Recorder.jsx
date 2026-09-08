import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
function wav(samples, rate) {
  const out = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(out);
  const text = (at, value) => [...value].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 32767, true));
  return new Uint8Array(out);
}
export default function Recorder({ disabled, onRecording }) {
  const [recording, setRecording] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const mounted = useRef(true);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const active = useRef(null);
  const stop = (deliver = true) => {
    const a = active.current;
    if (!a) return;
    active.current = null;
    clearInterval(a.timer);
    a.processor.disconnect();
    a.source.disconnect();
    a.stream.getTracks().forEach((t) => t.stop());
    void a.context.close();
    setRecording(false);
    if (deliver) {
      const data = wav(Float32Array.from(a.samples), a.rate);
      let binary = '';
      for (let i = 0; i < data.length; i += 16384)
        binary += String.fromCharCode(...data.subarray(i, i + 16384));
      onRecording(btoa(binary));
    }
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const a = active.current;
      if (a) {
        clearInterval(a.timer);
        a.stream.getTracks().forEach((t) => t.stop());
        a.processor.disconnect();
        void a.context.close();
      }
    };
  }, []);
  async function start() {
    setError('');
    setRequesting(true);
    let pendingStream;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pendingStream = stream;
      if (!mounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const context = new AudioContext({ sampleRate: 16000 });
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const a = {
        stream,
        context,
        source,
        processor,
        rate: context.sampleRate,
        samples: [],
        timer: null,
      };
      active.current = a;
      processor.onaudioprocess = (e) => {
        if (active.current !== a) return;
        const chunk = e.inputBuffer.getChannelData(0);
        const remaining = Math.floor(a.rate * 60) - a.samples.length;
        for (let i = 0; i < Math.min(chunk.length, remaining); i++) a.samples.push(chunk[i]);
        if (remaining <= chunk.length) stop();
      };
      source.connect(processor);
      processor.connect(context.destination);
      await context.resume();
      setSeconds(0);
      setRecording(true);
      a.timer = setInterval(() => setSeconds(Math.floor(a.samples.length / a.rate)), 500);
    } catch {
      pendingStream?.getTracks().forEach((t) => t.stop());
      stop(false);
      if (mounted.current)
        setError('Microphone access was not available. You can type your practice answer instead.');
    } finally {
      if (mounted.current) setRequesting(false);
    }
  }
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={requesting || (disabled && !recording)}
        onClick={() => (recording ? stop() : start())}
      >
        {recording ? `Stop recording · ${seconds}s` : 'Record an answer'}
      </Button>
      <p className="text-xs text-slate-500">
        Up to 60 seconds. The recording is deleted after processing, with cleanup within 24 hours if
        interrupted.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
