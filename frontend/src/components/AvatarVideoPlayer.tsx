"use client";

import React, { useEffect, useRef, useState } from "react";

interface AvatarVideoPlayerProps {
  isRecording: boolean;
  rmsLevel: number;
  isSpeaking: boolean;
}

export function AvatarVideoPlayer({ isRecording, rmsLevel, isSpeaking }: AvatarVideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const jayImgRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Store live state in mutable refs so the animation loop never tears down
  const rmsRef = useRef(rmsLevel);
  const isSpeakingRef = useRef(isSpeaking);
  const isRecordingRef = useRef(isRecording);

  useEffect(() => {
    rmsRef.current = rmsLevel;
    isSpeakingRef.current = isSpeaking;
    isRecordingRef.current = isRecording;
  }, [rmsLevel, isSpeaking, isRecording]);

  useEffect(() => {
    const img = new Image();
    img.src = "/avatars/jay.png";
    img.onload = () => {
      jayImgRef.current = img;
      setImageLoaded(true);
    };
  }, []);

  useEffect(() => {
    if (!imageLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    canvas.width = 540;
    canvas.height = 340;

    let frameCount = 0;
    let animId: number;
    let currentMouthOpen = 0;

    const render = () => {
      frameCount++;
      const currentRms = rmsRef.current;
      const currentlySpeaking = isSpeakingRef.current || currentRms > 0.05;
      const currentlyRecording = isRecordingRef.current;

      // Smooth breathing physics & subtle head sway
      const breathY = Math.sin(frameCount * 0.03) * 2;
      const headTilt = Math.sin(frameCount * 0.015) * 0.5;
      const speakingScale = currentlySpeaking ? 1 + Math.min(0.03, currentRms * 0.06) : 1;

      // Dynamic mouth aperture sync
      const targetMouth = currentlySpeaking
        ? Math.min(10, Math.max(1, currentRms * 14 + Math.sin(frameCount * 0.5) * 4))
        : 0;
      currentMouthOpen += (targetMouth - currentMouthOpen) * 0.35;

      // 1. Futuristic Automotive Virtual Studio Backdrop
      const bgGrad = ctx.createRadialGradient(270, 170, 40, 270, 170, 300);
      bgGrad.addColorStop(0, "#0B1528");
      bgGrad.addColorStop(0.5, "#060B16");
      bgGrad.addColorStop(1, "#020408");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 540, 340);

      // Studio grid illumination
      ctx.strokeStyle = "rgba(0, 229, 255, 0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < 540; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 340);
        ctx.stroke();
      }

      // Dynamic Speaking Halo behind Jay
      if (currentlySpeaking || currentlyRecording) {
        const glowRadius = 140 + (currentlySpeaking ? currentRms * 50 : 15);
        const glowGrad = ctx.createRadialGradient(270, 150, 30, 270, 150, glowRadius);
        glowGrad.addColorStop(0, "rgba(0, 229, 255, 0.35)");
        glowGrad.addColorStop(0.6, "rgba(37, 99, 235, 0.15)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(270, 150, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Render Official Photorealistic Jay Avatar with Real-time Lip Movements
      if (jayImgRef.current && jayImgRef.current.complete) {
        ctx.save();
        ctx.translate(270, 170 + breathY);
        ctx.rotate((headTilt * Math.PI) / 180);
        ctx.scale(speakingScale, speakingScale);

        const img = jayImgRef.current;
        const targetW = 280;
        const targetH = (targetW * img.height) / img.width;

        // Base Jay portrait
        ctx.drawImage(img, -targetW / 2, -targetH * 0.32, targetW, targetH);

        // Realistic Lip Movement Aperture Layer
        if (currentMouthOpen > 1.8) {
          ctx.save();
          const mouthX = 0;
          const mouthY = -targetH * 0.32 + targetH * 0.395; // Exact mouth Y coordinate on Jay's portrait

          // Natural inner mouth shadow
          ctx.fillStyle = "#2D0A0E";
          ctx.beginPath();
          ctx.ellipse(mouthX, mouthY, 7.5, currentMouthOpen * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();

          // Subtle upper teeth reflection
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.fillRect(mouthX - 4, mouthY - currentMouthOpen * 0.45 + 0.5, 8, Math.min(2.5, currentMouthOpen * 0.25));

          // Natural lower lip tone
          ctx.strokeStyle = "rgba(180, 100, 85, 0.5)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(mouthX, mouthY + 0.5, 8, currentMouthOpen * 0.45 + 0.8, 0, 0, Math.PI);
          ctx.stroke();

          ctx.restore();
        }

        ctx.restore();
      }

      // 3. Top-Left Live Video HUD Overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(12, 12, 170, 26);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(12, 12, 170, 26);

      // Live Pulsing Dot
      ctx.fillStyle = currentlySpeaking ? "#00E5FF" : currentlyRecording ? "#10B981" : "#94A3B8";
      ctx.beginPath();
      ctx.arc(24, 25, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText(
        currentlySpeaking ? "JAY (KABIR SPEAKING)" : currentlyRecording ? "JAY (KABIR LISTENING)" : "JAY (STANDBY)",
        36,
        29
      );

      // Top-Right Model & Modality Badge
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(400, 12, 128, 26);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.strokeRect(400, 12, 128, 26);

      ctx.fillStyle = "#38BDF8";
      ctx.font = "bold 10px monospace";
      ctx.fillText("LIVE AVATAR 60FPS", 408, 29);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, [imageLoaded]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl bg-[#020408]">
      {/* HTML5 Live Video Element for Vertex AI Gemini 3.1 Live Avatar Video Stream */}
      <video
        id="video_player"
        autoPlay
        playsInline
        muted={false}
        className="w-full h-full object-cover rounded-2xl z-10"
      />
      {/* Standby Canvas overlay if video stream is initializing */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover rounded-2xl pointer-events-none -z-0"
      />
    </div>
  );
}
