export class LiveAudioOutputManager {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private initialized = false;

  async initializeAudioContext(): Promise<void> {
    if (this.initialized && this.audioContext && this.audioContext.state !== "closed") {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 24000 });
      await this.audioContext.audioWorklet.addModule("/pcm-processor.js");
      this.workletNode = new AudioWorkletNode(this.audioContext, "pcm-processor");
      this.workletNode.connect(this.audioContext.destination);
      this.initialized = true;
      console.log("LiveAudioOutputManager initialized at 24kHz studio rate.");
    } catch (e) {
      console.warn("AudioWorklet initialization fallback:", e);
    }
  }

  async playAudioChunk(base64AudioChunk: string): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initializeAudioContext();
      }
      if (this.audioContext && this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      if (!this.workletNode) return;

      const arrayBuffer = LiveAudioOutputManager.base64ToArrayBuffer(base64AudioChunk);
      const float32Data = LiveAudioOutputManager.convertPCM16LEToFloat32(arrayBuffer);
      this.workletNode.port.postMessage(float32Data);
    } catch (error) {
      console.error("Error playing audio chunk:", error);
    }
  }

  interrupt(): void {
    if (this.workletNode) {
      this.workletNode.port.postMessage("interrupt");
    }
  }

  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  static convertPCM16LEToFloat32(pcmData: ArrayBuffer): Float32Array {
    const inputArray = new Int16Array(pcmData);
    const float32Array = new Float32Array(inputArray.length);
    for (let i = 0; i < inputArray.length; i++) {
      float32Array[i] = inputArray[i] / 32768;
    }
    return float32Array;
  }
}

export class LiveVideoOutputManager {
  private mediaSource: MediaSource | null = null;
  private sourceBuffer: SourceBuffer | null = null;
  private chunkQueue: ArrayBuffer[] = [];
  private initialized = false;
  private codec = 'video/mp4; codecs="avc1.42c020, mp4a.40.2"';

  constructor(videoElementId = "video_player") {
    if (typeof window !== "undefined") {
      this.initMediaSource(videoElementId);
    }
  }

  initMediaSource(videoElementId = "video_player"): boolean {
    if (typeof window === "undefined") return false;
    const video = document.getElementById(videoElementId) as HTMLVideoElement;
    if (!video) {
      return false;
    }

    if (this.initialized && this.mediaSource) {
      return true;
    }

    video.muted = false;

    if ("MediaSource" in window) {
      const candidateCodecs = [
        'video/mp4; codecs="avc1.42c020, mp4a.40.2"',
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        'video/mp4; codecs="avc1.4D401F"',
        'video/mp4; codecs="avc1.64001E"',
        'video/mp4',
        'video/webm; codecs="vp8, opus"',
        'video/webm; codecs="vp9, opus"',
        'video/webm'
      ];
      let supportedCodec = this.codec;
      for (const c of candidateCodecs) {
        if (MediaSource.isTypeSupported(c)) {
          supportedCodec = c;
          break;
        }
      }
      this.codec = supportedCodec;

      this.mediaSource = new MediaSource();
      video.src = URL.createObjectURL(this.mediaSource);

      this.mediaSource.addEventListener("sourceopen", () => {
        try {
          if (!this.mediaSource) return;
          this.sourceBuffer = this.mediaSource.addSourceBuffer(this.codec);
          this.sourceBuffer.mode = "sequence";
          this.sourceBuffer.addEventListener("updateend", () => {
            this.processQueue();
          });
          this.initialized = true;
          this.processQueue();
        } catch (e) {
          console.error("Error initializing MediaSource buffer:", e);
        }
      });
      return true;
    }
    return false;
  }

  playVideoChunk(base64Chunk: string): void {
    if (!this.initialized) {
      this.initMediaSource("video_player");
    }

    const arrayBuffer = LiveAudioOutputManager.base64ToArrayBuffer(base64Chunk);
    this.chunkQueue.push(arrayBuffer);
    this.processQueue();

    const video = document.getElementById("video_player") as HTMLVideoElement;
    if (video && video.paused) {
      video.play().catch(() => {});
    }
  }

  private processQueue(): void {
    if (!this.initialized || !this.sourceBuffer) return;
    if (this.sourceBuffer.updating) return;

    if (this.chunkQueue.length > 0) {
      const chunk = this.chunkQueue.shift();
      if (chunk) {
        try {
          this.sourceBuffer.appendBuffer(chunk);
        } catch (e) {
          console.error("Error appending video buffer chunk:", e);
        }
      }
    }
  }
}
