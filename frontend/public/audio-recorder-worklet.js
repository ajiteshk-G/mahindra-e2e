/**
 * AudioWorkletProcessor for 16kHz PCM audio recording
 */
class AudioRecorderProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0 && input[0]) {
      const inputData = input[0];
      const pcm16 = new Int16Array(inputData.length);
      let sumSquares = 0;

      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        sumSquares += s * s;
      }

      const rms = Math.sqrt(sumSquares / inputData.length);
      this.port.postMessage({
        pcm16: pcm16.buffer,
        rms: rms
      }, [pcm16.buffer]);
    }
    return true;
  }
}

registerProcessor("audio-recorder-processor", AudioRecorderProcessor);
