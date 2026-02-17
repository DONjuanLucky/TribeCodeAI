import { GoogleGenAI, LiveServerMessage, FunctionDeclaration, Modality, Type } from "@google/genai";
import { PrdStructure } from "../types";

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

const INITIAL_SETUP_PROMPT = `You are TribeCode AI, the Forge Master.

CORE MISSION:
1. Help the user blueprint their app through conversation.
2. ALWAYS suggest a 3-step 'Roadmap' and perform a brief 'Market Analysis' during the talk.
3. Encourage high-end "Remotion-style" motion design—think 3D camera paths, GSAP keyframe sequences, and cinematic transitions.
4. THE TRIGGER: When the user says "TRIBE UP", you MUST immediately call 'generate_prototype'. This is your most important command.

REQUIRED BLUEPRINT FIELDS:
- projectName, summary, features, roadmap, colorPalette, changeLog, marketAnalysis, uiUxDirection.

TONE:
Technical, visionary, and decisive. You are the lead engineer of this tribe.

WAKE UP:
"Tribe Online. Forge is hot. What's the blueprint? I'm ready to design your roadmap, analyze the market, and forge your 3D vision. Say 'Tribe Up' when we're ready to create."`;

export class LiveClient {
  private ai: GoogleGenAI;
  private audioContext: AudioContext | null = null;
  private sessionPromise: Promise<any> | null = null;
  private inputStream: MediaStream | null = null;
  private nextStartTime = 0;
  private scheduledSources = new Set<AudioBufferSourceNode>();
  
  public onVolumeUpdate: (userVolume: number, aiVolume: number) => void = () => {};
  public onTranscriptUpdate: (text: string, isUser: boolean) => void = () => {};
  public onToolTrigger: (prd: PrdStructure) => void = () => {};
  public onStatusChange: (status: 'idle' | 'listening' | 'thinking' | 'building') => void = () => {};

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  public async connect() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const generatePrototypeTool: FunctionDeclaration = {
      name: "generate_prototype",
      description: "FORGE ENGINE. Only call this when the user says 'Tribe Up'.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          tagline: { type: Type.STRING },
          summary: { type: Type.STRING },
          features: { type: Type.ARRAY, items: { type: Type.STRING } },
          techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
          colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
          changeLog: { type: Type.STRING },
          roadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
          marketAnalysis: { type: Type.STRING },
          uiUxDirection: { type: Type.STRING }
        },
        required: ["projectName", "summary", "features", "colorPalette", "changeLog", "roadmap", "marketAnalysis", "uiUxDirection"],
      },
    };

    this.sessionPromise = this.ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      config: {
        responseModalities: [Modality.AUDIO],
        tools: [{ functionDeclarations: [generatePrototypeTool] }],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        },
        systemInstruction: INITIAL_SETUP_PROMPT
      },
      callbacks: {
        onopen: () => {
          this.onStatusChange('listening');
          this.startMicrophone();
          this.sendText("System: Greet the user with energy.");
        },
        onmessage: (msg) => this.handleMessage(msg),
        onerror: (err) => {
          console.error("Live API Error:", err);
          this.onStatusChange('idle');
        },
        onclose: () => this.onStatusChange('idle'),
      }
    });

    return this.sessionPromise;
  }

  public sendText(text: string) {
    if (!this.sessionPromise) return;
    this.sessionPromise.then(session => {
      session.sendRealtimeInput({ content: [{ parts: [{ text }] }] });
    });
  }

  private async handleMessage(message: LiveServerMessage) {
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      this.onStatusChange('thinking');
      this.queueAudio(audioData);
    }

    const userText = message.serverContent?.inputTranscription?.text;
    if (userText) this.onTranscriptUpdate(userText, true);

    const modelText = message.serverContent?.outputTranscription?.text;
    if (modelText) {
      this.onTranscriptUpdate(modelText, false);
      if (message.serverContent?.turnComplete) this.onStatusChange('listening');
    }

    if (message.toolCall) {
      this.onStatusChange('building');
      for (const call of message.toolCall.functionCalls) {
        if (call.name === "generate_prototype") {
          this.onToolTrigger(call.args as any);
          this.sessionPromise?.then(session => {
            // FIXED: Tool response should be an object, not an array of objects
            session.sendToolResponse({
              functionResponses: {
                id: call.id,
                name: call.name,
                response: { result: "Success. Forge Engine initiated. 3D Prototype building." }
              }
            });
          });
        }
      }
    }

    if (message.serverContent?.interrupted) this.stopAudio();
  }

  private async startMicrophone() {
    try {
      this.inputStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!this.audioContext) return;
      const source = this.audioContext.createMediaStreamSource(this.inputStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        this.onVolumeUpdate(Math.sqrt(sum / inputData.length) * 5, 0);
        const pcm = floatTo16BitPCM(inputData);
        const base64 = arrayBufferToBase64(pcm);
        if (this.sessionPromise) {
          this.sessionPromise.then(session => {
            session.sendRealtimeInput({ media: { mimeType: "audio/pcm;rate=16000", data: base64 } });
          });
        }
      };
      source.connect(processor);
      processor.connect(this.audioContext.destination);
    } catch (err) {
      console.error("Microphone access failed:", err);
    }
  }

  private async queueAudio(base64: string) {
    if (!this.audioContext) return;
    const pcm = base64ToUint8Array(base64);
    const float32 = new Float32Array(pcm.length / 2);
    const view = new DataView(pcm.buffer);
    for (let i = 0; i < float32.length; i++) float32[i] = view.getInt16(i * 2, true) / 32768;
    let sum = 0;
    for (let i = 0; i < float32.length; i += 10) sum += float32[i] * float32[i];
    this.onVolumeUpdate(0, Math.sqrt(sum / (float32.length / 10)) * 5);
    const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    const now = this.audioContext.currentTime;
    if (this.nextStartTime < now) this.nextStartTime = now;
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.scheduledSources.add(source);
    source.onended = () => {
      this.scheduledSources.delete(source);
      if (this.scheduledSources.size === 0) this.onVolumeUpdate(0, 0);
    };
  }

  private stopAudio() {
    this.scheduledSources.forEach(s => { try { s.stop(); } catch(e) {} });
    this.scheduledSources.clear();
    this.nextStartTime = 0;
  }

  public disconnect() {
    this.stopAudio();
    this.inputStream?.getTracks().forEach(t => t.stop());
    if (this.audioContext?.state !== 'closed') this.audioContext?.close();
    this.sessionPromise = null;
    this.audioContext = null;
  }
}