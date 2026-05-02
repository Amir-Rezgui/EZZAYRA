import React, { useState, useRef, useEffect } from 'react';

const ASR_URL = "http://localhost:8001/transcribe";
const RAG_URL = "http://localhost:8002/query";
const CNN_URL = "http://localhost:8003/classify";

// ── WAV encoding helpers ──
function encodeWAV(samples: Float32Array, sampleRate: number) {
    const buf = new ArrayBuffer(44 + samples.length * 2);
    const v = new DataView(buf);
    const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); ws(8, 'WAVE');
    ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true); ws(36, 'data');
    v.setUint32(40, samples.length * 2, true);
    let off = 44;
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        v.setInt16(off, s < 0 ? s * 32768 : s * 32767, true); off += 2;
    }
    return new Blob([buf], { type: 'audio/wav' });
}

async function resample(audioBuffer: AudioBuffer, targetSR: number) {
    if (audioBuffer.sampleRate === targetSR) return audioBuffer.getChannelData(0);
    const ctx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * targetSR), targetSR);
    const src = ctx.createBufferSource();
    src.buffer = audioBuffer; src.connect(ctx.destination); src.start(0);
    const rendered = await ctx.startRendering();
    return rendered.getChannelData(0);
}

export default function ChatbotPage() {
    const [statusMsg, setStatusMsg] = useState('اضغط على الميكروفون وتكلم');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [cnnResult, setCnnResult] = useState<{ label: string, conf: number } | null>(null);
    const [transcription, setTranscription] = useState<string | null>(null);
    const [answerData, setAnswerData] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMicDisabled, setIsMicDisabled] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const setStatus = (msg: string, loading = false) => {
        setStatusMsg(msg);
        setIsLoading(loading);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        setStatus('جاري تحليل الصورة...', true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch(CNN_URL, { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                setCnnResult({
                    label: data.label || data.class,
                    conf: data.confidence || data.score || 0
                });
                setStatus('الصورة تحُللت — تكلم الآن', false);
            } else {
                setStatus('CNN: فشل الاتصال — اسأل بالصوت بدون صورة', false);
            }
        } catch {
            setStatus('CNN: فشل الاتصال — اسأل بالصوت بدون صورة', false);
        }
    };

    const toggleMic = async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.addEventListener('dataavailable', e => audioChunksRef.current.push(e.data));
                mediaRecorder.addEventListener('stop', handleStop);
                mediaRecorder.start();

                setIsRecording(true);
                setAnswerData(null);
                setTranscription(null);
                setStatus('جاري التسجيل... اضغط للإيقاف', false);
            } catch {
                alert('خطأ: لا يمكن الوصول للميكروفون');
            }
        } else {
            mediaRecorderRef.current?.stop();
            mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
            setIsRecording(false);
            setIsMicDisabled(true);
            setStatus('جاري معالجة الصوت...', true);
        }
    };

    const handleStop = async () => {
        try {
            const blob = new Blob(audioChunksRef.current);
            const arrBuf = await blob.arrayBuffer();
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const actx = new AudioContextClass();
            const audioBuf = await actx.decodeAudioData(arrBuf);
            const samples = await resample(audioBuf, 16000);
            const wav = encodeWAV(samples, 16000);

            setStatus('جاري التحويل من صوت إلى نص...', true);
            const fd = new FormData();
            fd.append('audio', wav, 'recording.wav');
            const asrRes = await fetch(ASR_URL, { method: 'POST', body: fd });
            if (!asrRes.ok) throw new Error('ASR failed');
            const asrData = await asrRes.json();
            const question = asrData.text || '';

            setTranscription(question);

            setStatus('جاري البحث في قاعدة البيانات...', true);
            const ragRes = await fetch(RAG_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: question,
                    cnn_label: cnnResult?.label || null,
                    cnn_confidence: cnnResult?.conf || null
                })
            });
            if (!ragRes.ok) throw new Error('RAG failed');
            const ragData = await ragRes.json();

            setAnswerData(ragData);
            
            const audioUrl = ragData.audio_url ? `http://localhost:8002${ragData.audio_url}` : null;
            if (audioUrl) {
                setTimeout(() => playAudio(audioUrl), 400);
            }

        } catch (err: any) {
            console.error(err);
            setStatus('خطأ في المعالجة — عاود المحاولة', false);
            setAnswerData({ error: true, text: `خطأ: ${err.message}` });
        } finally {
            setIsMicDisabled(false);
            setStatus('اضغط على الميكروفون وتكلم', false);
        }
    };

    const playAudio = (url: string) => {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
            setIsPlaying(false);
            return;
        }
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.play();
        setIsPlaying(true);
        audio.onended = () => {
            currentAudioRef.current = null;
            setIsPlaying(false);
        };
    };

    return (
        <div className="voice-agent-container" dir="rtl">
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            <style dangerouslySetInnerHTML={{__html: `
                .voice-agent-container {
                    --bg: transparent;
                    --bg2: #f4f7f4;
                    --surface: rgba(255, 255, 255, 0.7);
                    --border: rgba(85, 107, 47, 0.2);
                    --green: #556b2f;
                    --green-light: #6b8e23;
                    --green-glow: rgba(85, 107, 47, 0.15);
                    --gold: #b59410;
                    --gold-light: #d4b028;
                    --text: #2c3e2e;
                    --text-muted: #6b826b;
                    --red: #c0392b;
                    --red-glow: rgba(192, 57, 43, 0.2);
                    --radius: 24px;
                    
                    font-family: 'Tajawal', 'IBM Plex Sans Arabic', sans-serif;
                    background: transparent;
                    color: var(--text);
                    height: calc(100vh - 4rem);
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 20px 16px 40px;
                    width: 100%;
                }
                .va-header { text-align: center; margin-bottom: 28px; padding-top: 12px; }
                .va-logo-wrap { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px; }
                .va-olive-icon { font-size: 2.4rem; filter: drop-shadow(0 0 12px var(--green-glow)); animation: float 3s ease-in-out infinite; }
                @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                .va-h1 { font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 1.9rem; font-weight: 600; background: linear-gradient(135deg, var(--green-light), var(--gold-light)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
                .va-subtitle { font-size: 0.88rem; color: var(--text-muted); letter-spacing: 0.05em; margin: 0; }
                .va-card { background: var(--surface); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 24px; width: 100%; max-width: 560px; box-shadow: 0 20px 60px rgba(0,0,0,0.05), 0 0 0 1px rgba(255,255,255,0.4); }
                .va-section-label { font-size: 0.75rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
                .va-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
                .va-camera-section { margin-bottom: 24px; }
                .va-camera-area { width: 100%; min-height: 180px; aspect-ratio: 16/9; border: 2px dashed var(--green-light); border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease; overflow: hidden; background: #ffffff; }
                .va-camera-area:hover { border-color: var(--green); background: #f8fbf8; }
                .va-camera-area img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
                .va-camera-placeholder { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--text-muted); }
                .va-camera-placeholder i { font-size: 2.2rem; opacity: 0.6; }
                .va-camera-placeholder span { font-size: 0.9rem; }
                .va-cnn-badge { margin-top: 10px; padding: 10px 14px; background: rgba(74, 157, 100, 0.1); border: 1px solid rgba(74, 157, 100, 0.3); border-radius: 10px; font-size: 0.9rem; display: flex; align-items: center; gap: 10px; }
                .va-cnn-badge .va-label { font-weight: 600; color: var(--green-light); }
                .va-cnn-badge .va-conf { font-size: 0.78rem; color: var(--text-muted); margin-right: auto; }
                .va-voice-section { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 24px; }
                .va-mic-btn { width: 86px; height: 86px; border-radius: 50%; border: none; background: linear-gradient(145deg, var(--green), #2d7a45); color: white; font-size: 2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 28px var(--green-glow), 0 0 0 0 var(--green-glow); transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s; }
                .va-mic-btn:hover:not(:disabled) { transform: scale(1.06); }
                .va-mic-btn:active:not(:disabled) { transform: scale(0.94); }
                .va-mic-btn.recording { background: linear-gradient(145deg, var(--red), #8b1a14); box-shadow: 0 0 0 0 var(--red-glow); animation: pulse-rec 1.4s infinite; }
                @keyframes pulse-rec { 0% { box-shadow: 0 0 0 0 var(--red-glow); } 70% { box-shadow: 0 0 0 22px rgba(192,57,43,0); } 100% { box-shadow: 0 0 0 0 rgba(192,57,43,0); } }
                .va-mic-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .va-status-line { font-size: 0.9rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px; min-height: 22px; }
                .va-spinner { width: 16px; height: 16px; border: 2px solid rgba(74,157,100,0.3); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .va-transcription-box { width: 100%; background: #ffffff; border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; font-size: 1.15rem; line-height: 1.6; text-align: right; color: var(--text); min-height: 58px; }
                .va-answer-box { background: #ffffff; border: 1px solid rgba(74,157,100,0.25); border-right: 3px solid var(--green); border-radius: 12px; padding: 16px 18px; font-size: 1.1rem; line-height: 1.8; text-align: right; margin-bottom: 14px; }
                .va-answer-box.refused { border-right-color: var(--gold); background: rgba(201, 162, 39, 0.05); }
                .va-sources-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; margin-bottom: 14px; }
                .va-source-tag { padding: 3px 10px; background: rgba(74,157,100,0.12); border: 1px solid rgba(74,157,100,0.25); border-radius: 20px; font-size: 0.75rem; color: var(--green-light); }
                .va-play-btn { display: flex; align-items: center; gap: 10px; background: rgba(74,157,100,0.12); border: 1px solid rgba(74,157,100,0.3); border-radius: 12px; padding: 10px 18px; color: var(--green-light); cursor: pointer; font-size: 0.95rem; font-family: inherit; width: 100%; justify-content: center; transition: background 0.2s; }
                .va-play-btn:hover { background: rgba(74,157,100,0.2); }
                .va-play-btn.playing { background: rgba(74,157,100,0.25); }
                .va-relevance-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; font-size: 0.78rem; color: var(--text-muted); }
                .va-rel-bar-track { flex: 1; height: 4px; background: rgba(0,0,0,0.08); border-radius: 2px; overflow: hidden; }
                .va-rel-bar-fill { height: 100%; background: var(--green); border-radius: 2px; transition: width 0.6s ease; }
                .va-footer { margin-top: 28px; text-align: center; font-size: 0.75rem; color: rgba(122,158,130,0.5); }
                .va-waveform { display: flex; gap: 3px; align-items: center; height: 24px; }
                .va-wave-bar { width: 3px; background: var(--red); border-radius: 2px; animation: wave 0.8s ease-in-out infinite; }
                .va-wave-bar:nth-child(1) { animation-delay: 0.0s; } .va-wave-bar:nth-child(2) { animation-delay: 0.1s; } .va-wave-bar:nth-child(3) { animation-delay: 0.2s; } .va-wave-bar:nth-child(4) { animation-delay: 0.3s; } .va-wave-bar:nth-child(5) { animation-delay: 0.2s; } .va-wave-bar:nth-child(6) { animation-delay: 0.1s; }
                @keyframes wave { 0%,100% { height: 6px; } 50% { height: 22px; } }
            `}} />

            <header className="va-header">
                <div className="va-logo-wrap">
                    <span className="va-olive-icon">🫒</span>
                    <h1 className="va-h1">مساعد الزيتون</h1>
                </div>
                <p className="va-subtitle">Powered by ASR · RAG · LLM · TTS</p>
            </header>

            <div className="va-card">
                {/* ── Camera / Image section ── */}
                <div className="va-camera-section">
                    <div className="va-section-label"><i className="fas fa-camera"></i> صورة الورقة</div>
                    <div className="va-camera-area" onClick={() => fileInputRef.current?.click()}>
                        {!previewUrl ? (
                            <div className="va-camera-placeholder">
                                <i className="fas fa-camera-retro"></i>
                                <span>اضغط لتصوير أو رفع صورة ورقة زيتون</span>
                            </div>
                        ) : (
                            <img src={previewUrl} alt="olive leaf preview" />
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" capture="environment" onChange={handleFileChange} />

                    {cnnResult && (
                        <div className="va-cnn-badge">
                            <i className="fas fa-leaf" style={{ color: 'var(--green-light)' }}></i>
                            <span>تشخيص CNN:</span>
                            <span className="va-label">{cnnResult.label}</span>
                            <span className="va-conf">{cnnResult.conf ? `(${(cnnResult.conf * 100).toFixed(1)}%)` : ''}</span>
                        </div>
                    )}
                </div>

                {/* ── Voice section ── */}
                <div className="va-voice-section">
                    <div className="va-section-label" style={{ width: '100%' }}><i className="fas fa-microphone-alt"></i> سؤالك بالصوت</div>

                    <button className={`va-mic-btn ${isRecording ? 'recording' : ''}`} onClick={toggleMic} disabled={isMicDisabled} title="اضغط للتحدث">
                        <i className={isRecording ? "fas fa-stop" : "fas fa-microphone"}></i>
                    </button>

                    <div className="va-status-line">
                        {isLoading && <div className="va-spinner"></div>}
                        {isRecording && (
                            <div className="va-waveform">
                                <div className="va-wave-bar"></div><div className="va-wave-bar"></div><div className="va-wave-bar"></div>
                                <div className="va-wave-bar"></div><div className="va-wave-bar"></div><div className="va-wave-bar"></div>
                            </div>
                        )}
                        <span>{statusMsg}</span>
                    </div>

                    {transcription && (
                        <div className="va-transcription-box">{transcription}</div>
                    )}
                </div>

                {/* ── Answer section ── */}
                {answerData && (
                    <div className="va-answer-section">
                        <div className="va-section-label"><i className="fas fa-comment-dots"></i> الجواب</div>

                        <div className={`va-answer-box ${answerData.refused ? 'refused' : ''}`}>
                            {answerData.answer_text || answerData.text}
                        </div>

                        {answerData.source_citations && answerData.source_citations.length > 0 && (
                            <div className="va-sources-row">
                                {answerData.source_citations.map((s: string, i: number) => (
                                    <span key={i} className="va-source-tag">{s}</span>
                                ))}
                            </div>
                        )}

                        {answerData.audio_url && (
                            <button className={`va-play-btn ${isPlaying ? 'playing' : ''}`} onClick={() => playAudio(`http://localhost:8002${answerData.audio_url}`)}>
                                <i className={isPlaying ? "fas fa-stop" : "fas fa-volume-up"}></i>
                                <span>{isPlaying ? 'إيقاف الصوت' : 'اسمع الجواب بالصوت'}</span>
                            </button>
                        )}

                        {!answerData.refused && answerData.top_score !== undefined && (
                            <div className="va-relevance-row">
                                <span>درجة الملاءمة</span>
                                <div className="va-rel-bar-track">
                                    <div className="va-rel-bar-fill" style={{ width: `${Math.round(answerData.top_score * 100)}%` }}></div>
                                </div>
                                <span>{Math.round(answerData.top_score * 100)}%</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <footer className="va-footer">
                ASR: Whisper Tunisian · CNN: PlantVillage · RAG: FAISS + Claude · TTS: edge-tts
            </footer>
        </div>
    );
}
