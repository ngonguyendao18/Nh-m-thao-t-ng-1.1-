
import { GoogleGenAI, Modality } from "@google/genai";
import { getApiErrorMessage } from "../utils/errorUtils";

// Audio context và source hiện tại được quản lý ở đây để đảm bảo chỉ một âm thanh phát tại một thời điểm.
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
const audioCache = new Map<string, Blob>();

/**
 * Giải mã chuỗi base64 thành Uint8Array.
 * Manual implementation as per Gemini API guidelines.
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Chuyển đổi dữ liệu PCM thô thành AudioBuffer.
 * Tuân thủ hướng dẫn giải mã âm thanh của Gemini API.
 */
async function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Ghi một chuỗi vào DataView.
 */
function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

/**
 * Tạo một Blob file WAV từ dữ liệu PCM thô.
 * Dùng để hỗ trợ tính năng tải về (Download).
 */
function createWavBlob(pcmData: Int16Array): Blob {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = pcmData.length * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write PCM data
    for (let i = 0; i < pcmData.length; i++) {
        view.setInt16(44 + i * 2, pcmData[i], true);
    }

    return new Blob([view], { type: 'audio/wav' });
}

/**
 * Dừng bất kỳ âm thanh nào đang phát.
 */
export function stopCurrentSpeech() {
    if (currentSource) {
        try {
            currentSource.stop();
        } catch (e) {
            console.warn("Could not stop audio source, it may have already finished.", e);
        }
        currentSource.disconnect();
        currentSource = null;
    }
}

/**
 * Tạo một Blob âm thanh từ văn bản.
 * @param text Văn bản cần chuyển đổi.
 * @returns Blob của file WAV.
 */
export async function generateSpeechBlob(text: string): Promise<Blob> {
    try {
        if (audioCache.has(text)) {
            return audioCache.get(text)!;
        }

        if (!text.trim()) {
            throw new Error("Text is empty.");
        }

        // Khởi tạo GoogleGenAI ngay trước khi gọi API để đảm bảo key mới nhất
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Kore' }, 
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("Không nhận được dữ liệu âm thanh từ API.");
        }
        
        const audioBytes = decode(base64Audio);
        const pcmData = new Int16Array(audioBytes.buffer);
        const wavBlob = createWavBlob(pcmData);

        audioCache.set(text, wavBlob);
        return wavBlob;
    } catch (error) {
        console.error("Error generating speech blob:", error);
        throw new Error(getApiErrorMessage(error, "Lỗi tạo file âm thanh."));
    }
}


/**
 * Tạo và phát âm thanh từ văn bản được cung cấp.
 * @param text Văn bản cần đọc.
 * @param onFinish Callback được gọi khi âm thanh phát xong.
 */
export async function generateAndPlaySpeech(text: string, onFinish: () => void): Promise<void> {
    stopCurrentSpeech(); // Dừng âm thanh trước đó

    if (!text.trim()) return;
    
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        let audioBytes: Uint8Array;

        // Kiểm tra cache để tránh gọi API lặp lại
        if (audioCache.has(text)) {
            const blob = audioCache.get(text)!;
            const arrayBuffer = await blob.arrayBuffer();
            // Bỏ qua header WAV 44 bytes để lấy PCM thô
            audioBytes = new Uint8Array(arrayBuffer.slice(44));
        } else {
            // Khởi tạo GoogleGenAI ngay trước khi gọi API để đảm bảo context đúng
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                          prebuiltVoiceConfig: { voiceName: 'Kore' }, 
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) {
                throw new Error("Không nhận được dữ liệu âm thanh từ API.");
            }
            
            audioBytes = decode(base64Audio);
            // Lưu vào cache dưới dạng WAV để hỗ trợ download đồng bộ
            const pcmData = new Int16Array(audioBytes.buffer);
            audioCache.set(text, createWavBlob(pcmData));
        }

        // Sử dụng giải mã PCM thủ công theo hướng dẫn của Gemini API thay vì AudioContext.decodeAudioData
        const audioBuffer = await pcmToAudioBuffer(audioBytes, audioContext, 24000, 1);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
            onFinish();
            if (currentSource === source) {
                currentSource = null;
            }
        };
        
        source.start();
        currentSource = source;
    } catch (error) {
        console.error("Error in generateAndPlaySpeech:", error);
        onFinish();
        throw error;
    }
}
