import { GoogleGenAI, LiveServerMessage, FunctionDeclaration } from "@google/genai";
import { PrdStructure } from "../types";

// --- Audio Helpers ---

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

// --- Instructions ---

const SYSTEM_SETUP_PROMPT = `SYSTEM: Initialize Persona: TribeCode AI.
You are a technical co-founder. Your goal is to build an app with the user.

CAPABILITIES:
- You have a tool called 'generate_prototype'.
- IMPORTANT: You cannot call this tool yet because I am setting up the session.
- FOR NOW: Just talk to the user. Ask them what they want to build. 
- When they say "Tribe Up", you will eventually trigger the build (I will handle the logic).

BEHAVIOR:
1. Greet the user with "Tribe Online!".
2. Ask what kind of application they want to create today.
3. Be enthusiastic and technical.`;

export class LiveClient {
  private ai: GoogleGenAI;
  private audioContext: AudioContext | null = null;
  private sessionPromise: Promise<any> | null = null;
  
  // Audio State
  private nextStartTime = 0;
  private scheduledSources = new Set<AudioBufferSourceNode>();
  
  // Callbacks
  public onVolumeUpdate: (userVolume: number, aiVolume: number) => void = () => {};
  public onTranscriptUpdate: (text: string, isUser: boolean) => void = () => {};
  public onToolTrigger: (prd: PrdStructure) => void = () => {};

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  public async connect() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });

    const generatePrototypeTool: FunctionDeclaration = {
      name: "generate_prototype",
      description: "Builds the app based on the current discussion. Call this when the user says 'Tribe Up'.",
      parameters: {
        type: "OBJECT" as any,
        properties: {
          projectName: { type: "STRING" as any },
          tagline: { type: "STRING" as any },
          summary: { type: "STRING" as any },
          features: { type: "ARRAY" as any, items: { type: "STRING" as any } },
          techStack: { type: "ARRAY" as any, items: { type: "STRING" as any } },
          colorPalette: { type: "ARRAY" as any, items: { type: "STRING" as any } },
          changeLog: { type: "STRING" as any }
        },
        required: ["projectName", "summary", "features", "colorPalette", "changeLog"],
      },
    };

    // The 'Operation not implemented' error usually comes from specific config fields.
    // We use the absolute bare minimum here to ensure connection success.
    this.sessionPromise = this.ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      config: {
        responseModalities: ["AUDIO" as any],
        tools: [{ functionDeclarations: [generatePrototypeTool] }],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      },
      callbacks: {
        onopen: () => {
          console.log("Session Opened");
          this.startMicrophone();
          // Initialize persona as a message rather than config to avoid rejected connect calls
          this.sendText(SYSTEM_SETUP_PROMPT);
        },
        onmessage: (msg) => this.handleMessage(msg),
        onerror: (err) => console.error("Live API Error:", err),
        onclose: () => console.log("Session Closed"),
      }
    });

    return this.sessionPromise;
  }

  public sendText(text: string) {
    this.sessionPromise?.then(session => {
      session.sendRealtimeInput({
        content: [{ parts: [{ text }] }]
      });
    });
  }

  private async handleMessage(message: LiveServerMessage) {
    // 1. Audio Output
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) this.queueAudio(audioData);

    // 2. Transcription
    const transcript = message.serverContent?.inputTranscription?.text;
    if (transcript) this.onTranscriptUpdate(transcript, true);

    const modelTranscript = message.serverContent?.outputTranscription?.text;
    if (modelTranscript) this.onTranscriptUpdate(modelTranscript, false);

    // 3. Tools
    if (message.toolCall) {
      for (const call of message.toolCall.functionCalls) {
        if (call.name === "generate_prototype") {
          this.onToolTrigger(call.args as any);
          this.sessionPromise?.then(session => {
            session.sendToolResponse({
              functionResponses: {
                id: call.id,
                name: call.name,
                response: { result: "App built successfully. Inform the user." }
              }
            });
          });
        }
      }
    }

    if (message.serverContent?.interrupted) this.stopAudio();
  }

  private async startMicrophone() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.audioContext!.createMediaStreamSource(stream);
    const processor = this.audioContext!.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      
      // Volume Visualizer logic
      let sum = 0;
      for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
      this.onVolumeUpdate(Math.sqrt(sum / input.length) * 5, 0);

      const pcm = floatTo16BitPCM(input);
      const base64 = arrayBufferToBase64(pcm);

      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({
          media: { mimeType: "audio/pcm;rate=16000", data: base64 }
        });
      });
    };

    source.connect(processor);
    processor.connect(this.audioContext!.destination);
  }

  private async queueAudio(base64: string) {
    const pcm = base64ToUint8Array(base64);
    const float32 = new Float32Array(pcm.length / 2);
    const view = new DataView(pcm.buffer);

    for (let i = 0; i < float32.length; i++) {
      float32[i] = view.getInt16(i * 2, true) / 32768;
    }

    // AI Volume Visualizer logic
    let sum = 0;
    for (let i = 0; i < float32.length; i += 10) sum += float32[i] * float32[i];
    this.onVolumeUpdate(0, Math.sqrt(sum / (float32.length / 10)) * 5);

    const buffer = this.audioContext!.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext!.destination);

    const now = this.audioContext!.currentTime;
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
    this.audioContext?.close();
    this.sessionPromise = null;
  }
}