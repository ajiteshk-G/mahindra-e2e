"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LiveAudioOutputManager, LiveVideoOutputManager } from "@/lib/audioManager";

export interface LiveMessage {
  id: string;
  speaker: "customer" | "mia" | "system";
  text: string;
  timestamp: string;
  toolCall?: string;
  language?: string;
}

export const KABIR_AUDIO_GREETING =
  "Namaste! Welcome to Mahindra Virtual Showroom. I am Kabir, your AI Showroom Specialist. Ask me anything about our SUV lineup or speak with me in your preferred language!";

export function useLiveVoice(onUiEvent?: (event: any) => void) {
  const [isConnected, setIsConnected] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [rmsLevel, setRmsLevel] = useState(0);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [activeLanguage, setActiveLanguage] = useState("Hinglish");

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef<string>(`SESS-${Date.now()}`);
  const audioOutputManagerRef = useRef<LiveAudioOutputManager | null>(null);
  const videoOutputManagerRef = useRef<LiveVideoOutputManager | null>(null);

  useEffect(() => {
    audioOutputManagerRef.current = new LiveAudioOutputManager();
    videoOutputManagerRef.current = new LiveVideoOutputManager();
  }, []);

  const playAudioGreeting = useCallback((customGreeting?: string, customerName?: string) => {
    // Send prompt to Gemini Live WebSocket if connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "USER_CHAT",
          text: `Greet the customer ${customerName || "there"} as Kabir.`
        })
      );
    }
  }, []);

  const onUiEventRef = useRef(onUiEvent);
  useEffect(() => {
    onUiEventRef.current = onUiEvent;
  }, [onUiEvent]);

  const activeLanguageRef = useRef(activeLanguage);
  useEffect(() => {
    activeLanguageRef.current = activeLanguage;
  }, [activeLanguage]);

  const getWebSocketUrl = () => {
    if (typeof window === "undefined") return null;
    if (process.env.NEXT_PUBLIC_WS_URL) {
      return process.env.NEXT_PUBLIC_WS_URL;
    }

    const hostname = window.location.hostname;
    // Direct WebSocket is only supported on direct local loopback (port 8000).
    // In web preview / proxy / remote environments, we use HTTP REST streaming fallback to avoid browser connection errors.
    const isLocalLoopback = hostname === "localhost" || hostname === "127.0.0.1";
    if (!isLocalLoopback) {
      return null;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//127.0.0.1:8000/ws/live-audio`;
  };

  const connectWebSocket = useCallback(() => {
    if (socketRef.current) {
      if (
        socketRef.current.readyState === WebSocket.CONNECTING ||
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        return;
      }
    }

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      setIsConnected(true);
      return;
    }

    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "VIDEO_CHUNK" && payload.video_b64) {
            videoOutputManagerRef.current?.playVideoChunk(payload.video_b64);
          } else if (payload.type === "AUDIO_CHUNK" && payload.audio_b64) {
            audioOutputManagerRef.current?.playAudioChunk(payload.audio_b64);
            setRmsLevel(0.35 + Math.random() * 0.45);
          } else if (payload.type === "SESSION_INIT" || payload.type === "SESSION_INITIALIZED") {
            if (payload.session_id) sessionIdRef.current = payload.session_id;
          } else if (payload.type === "USER_TRANSCRIPTION" && payload.message) {
            setMessages((prev) => {
              if (prev.length > 0) {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg.speaker === "customer") {
                  let newText = "";
                  if (payload.message.startsWith(lastMsg.text)) {
                    newText = payload.message;
                  } else if (lastMsg.text.startsWith(payload.message)) {
                    newText = lastMsg.text;
                  } else {
                    const sep = (lastMsg.text.endsWith(" ") || payload.message.startsWith(" ")) ? "" : " ";
                    newText = lastMsg.text + sep + payload.message;
                  }
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...lastMsg,
                    text: newText.trim()
                  };
                  return updated;
                }
              }
              return [
                ...prev,
                {
                  id: (Date.now() + Math.random()).toString(),
                  speaker: "customer",
                  text: payload.message.trim(),
                  timestamp: new Date().toLocaleTimeString()
                }
              ];
            });
          } else if (payload.type === "ASSISTANT_RESPONSE" && payload.message) {
            const detectedLang = payload.language || activeLanguageRef.current;
            if (payload.language) {
              setActiveLanguage(payload.language);
            }
            setMessages((prev) => {
              if (prev.length > 0) {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg.speaker === "mia") {
                  let newText = "";
                  if (payload.message.startsWith(lastMsg.text)) {
                    newText = payload.message;
                  } else if (lastMsg.text.startsWith(payload.message)) {
                    newText = lastMsg.text;
                  } else if (payload.is_delta || payload.message.length < 40) {
                    const sep = (lastMsg.text.endsWith(" ") || payload.message.startsWith(" ")) ? "" : " ";
                    newText = lastMsg.text + sep + payload.message;
                  } else {
                    newText = payload.message;
                  }

                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...lastMsg,
                    text: newText.trim(),
                    toolCall: payload.tool_call || lastMsg.toolCall,
                    language: detectedLang
                  };
                  return updated;
                }
              }
              return [
                ...prev,
                {
                  id: (Date.now() + Math.random()).toString(),
                  speaker: "mia",
                  text: payload.message.trim(),
                  timestamp: new Date().toLocaleTimeString(),
                  toolCall: payload.tool_call,
                  language: detectedLang
                }
              ];
            });

            // Speak greeting and responses with Web Speech API if PCM audio stream is not present
            if (typeof window !== "undefined" && "speechSynthesis" in window && !payload.audio_b64) {
              try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(payload.message);
                utterance.lang = (detectedLang === "English" || detectedLang === "en-IN") ? "en-IN" : "hi-IN";
                utterance.rate = 1.02;
                utterance.pitch = 1.0;
                utterance.onstart = () => setRmsLevel(0.45);
                utterance.onend = () => setRmsLevel(0);
                utterance.onerror = () => setRmsLevel(0);
                window.speechSynthesis.speak(utterance);
              } catch (ttsErr) {
                console.debug("TTS notice:", ttsErr);
              }
            }

            const words = (payload.message || "").split(/\s+/).length;
            const durationMs = Math.min(8000, Math.max(2500, words * 170));
            const startT = performance.now();
            const animLip = () => {
              const elapsed = performance.now() - startT;
              if (elapsed < durationMs) {
                setRmsLevel(0.4 + Math.sin(elapsed * 0.015) * 0.35);
                requestAnimationFrame(animLip);
              } else {
                setRmsLevel(0);
              }
            };
            animLip();
          } else if (payload.type === "UI_ACTION") {
            if (onUiEventRef.current) {
              onUiEventRef.current(payload);
            }
          } else if (payload.type === "AUDIO_ENERGY") {
            setRmsLevel(payload.rms * 2.5);
          }
        } catch (e) {
          // silently handle
        }
      };

      socket.onerror = () => {
        setIsConnected(true);
      };

      socket.onclose = () => {
        setIsRecording(false);
      };

      socketRef.current = socket;
    } catch (e) {
      setIsConnected(true);
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connectWebSocket]);

  const sendTextMessage = async (text: string) => {
    if (!text.trim()) return;

    if (audioOutputManagerRef.current) {
      audioOutputManagerRef.current.interrupt();
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        speaker: "customer",
        text,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "USER_CHAT",
          text
        })
      );
      return;
    }

    // Seamless REST Fallback with TTS
    try {
      const res = await fetch("/api/live/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: sessionIdRef.current,
          language: activeLanguage
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session_id) sessionIdRef.current = data.session_id;
        const detectedLang = data.language || activeLanguage;
        if (data.language) setActiveLanguage(data.language);

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            speaker: "mia",
            text: data.message,
            timestamp: new Date().toLocaleTimeString(),
            toolCall: data.tool_call,
            language: detectedLang
          }
        ]);

        const words = (data.message || "").split(/\s+/).length;
        const durationMs = Math.min(8000, Math.max(2500, words * 170));
        const startT = performance.now();
        const animLip = () => {
          const elapsed = performance.now() - startT;
          if (elapsed < durationMs) {
            setRmsLevel(0.4 + Math.sin(elapsed * 0.015) * 0.35);
            requestAnimationFrame(animLip);
          } else {
            setRmsLevel(0);
          }
        };
        animLip();

        if (data.tool_call && onUiEvent) {
          onUiEvent({
            type: "UI_ACTION",
            tool_name: data.tool_call,
            tool_args: data.tool_args || {}
          });
        }
      }
    } catch (err) {
      console.debug("REST fallback notice:", err);
    }
  };

  const startVoiceRecording = async (customerName?: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);

      // 1. Prefer modern AudioWorkletNode over deprecated ScriptProcessorNode
      try {
        await audioCtx.audioWorklet.addModule("/audio-recorder-worklet.js");
        const workletNode = new AudioWorkletNode(audioCtx, "audio-recorder-processor");
        workletNodeRef.current = workletNode;

        workletNode.port.onmessage = (e) => {
          const { pcm16, rms } = e.data;
          setRmsLevel(rms * 3.0);

          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(pcm16);
          }
        };

        source.connect(workletNode);
        workletNode.connect(audioCtx.destination);
      } catch (workletError) {
        // Fallback for older browsers
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(inputData.length);
          let sumSquares = 0;
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            sumSquares += s * s;
          }

          const rms = Math.sqrt(sumSquares / inputData.length);
          setRmsLevel(rms * 3.0);

          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(pcm16.buffer);
          }
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
      }

      // Browser speech recognition for live speech-to-text ONLY during REST fallback (when WebSocket is not open)
      const isWsActive = socketRef.current && socketRef.current.readyState === WebSocket.OPEN;
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!isWsActive && SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;

          const langMap: Record<string, string> = {
            Hindi: "hi-IN",
            Marathi: "mr-IN",
            Tamil: "ta-IN",
            Telugu: "te-IN",
            Kannada: "kn-IN",
            Malayalam: "ml-IN",
            Bengali: "bn-IN",
            Gujarati: "gu-IN",
            Punjabi: "pa-IN",
            Odia: "or-IN",
            Urdu: "ur-IN",
            Assamese: "as-IN",
            English: "en-IN",
            Hinglish: "hi-IN"
          };
          recognition.lang = langMap[activeLanguage] || "hi-IN";

          recognition.onresult = (event: any) => {
            // Guard: Ignore microphone input if Kabir is actively speaking through TTS
            if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
              return;
            }
            const transcript = event.results[event.results.length - 1][0].transcript;
            if (transcript && transcript.trim()) {
              sendTextMessage(transcript.trim());
            }
          };

          recognition.onerror = (e: any) => {
            if (e.error !== "no-speech" && e.error !== "aborted") {
              console.debug("Speech recognition notice:", e.error);
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {}
      }

      // Trigger dynamic greeting from Kabir on starting live session if no messages yet
      if (messages.length === 0) {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              type: "START_SESSION",
              customer_name: customerName || "there",
              language: activeLanguageRef.current
            })
          );
        } else {
          // If WebSocket is not ready, fetch dynamic greeting via REST immediately
          (async () => {
            try {
              const res = await fetch("/api/live/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: `Please give a warm, dynamic, non-static spoken greeting to ${customerName || "there"} as Kabir, introducing yourself as Mahindra's AI Showroom Specialist.`,
                  session_id: sessionIdRef.current,
                  language: activeLanguageRef.current
                })
              });
              if (res.ok) {
                const data = await res.json();
                const detectedLang = data.language || activeLanguageRef.current;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    speaker: "mia",
                    text: data.message,
                    timestamp: new Date().toLocaleTimeString(),
                    toolCall: data.tool_call,
                    language: detectedLang
                  }
                ]);

                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  try {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(data.message);
                    utterance.lang = (detectedLang === "English" || detectedLang === "en-IN") ? "en-IN" : "hi-IN";
                    utterance.rate = 1.02;
                    utterance.pitch = 1.0;
                    utterance.onstart = () => setRmsLevel(0.45);
                    utterance.onend = () => setRmsLevel(0);
                    utterance.onerror = () => setRmsLevel(0);
                    window.speechSynthesis.speak(utterance);
                  } catch (ttsErr) {
                    console.debug("TTS notice:", ttsErr);
                  }
                }
              }
            } catch (err) {
              console.debug("Initial greeting REST notice:", err);
            }
          })();
        }
      }

      setIsRecording(true);
    } catch (err) {
      setIsRecording(true);
    }
  };

  const stopVoiceRecording = () => {
    if (workletNodeRef.current) {
      try {
        workletNodeRef.current.disconnect();
      } catch (e) {}
      workletNodeRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {}
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (socketRef.current) {
      try {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: "END_CALL" }));
        }
        socketRef.current.close();
      } catch (e) {}
      socketRef.current = null;
    }
    if (audioOutputManagerRef.current) {
      audioOutputManagerRef.current.interrupt();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    const video = typeof document !== "undefined" ? (document.getElementById("video_player") as HTMLVideoElement | null) : null;
    if (video) {
      try {
        video.pause();
        video.currentTime = 0;
      } catch (e) {}
    }
    setIsRecording(false);
    setRmsLevel(0);

    setMessages((prev) => [
      ...prev,
      {
        id: `end-${Date.now()}`,
        speaker: "system",
        text: "Voice consultation ended.",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const switchLanguage = (lang: string) => {
    setActiveLanguage(lang);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "SWITCH_LANGUAGE",
          language: lang
        })
      );
    }
  };

  return {
    isConnected,
    isRecording,
    rmsLevel,
    messages,
    activeLanguage,
    startVoiceRecording,
    stopVoiceRecording,
    sendTextMessage,
    switchLanguage,
    playAudioGreeting
  };
}
