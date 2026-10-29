import { env } from "../config/env.js";

export class AiClientService {
  private static baseUrl = env.AI_SERVICE_URL;

  /**
   * Submits image bytes for multimodal deepfake detection, face localization, and tampering analysis.
   */
  static async analyzeImage(buffer: Buffer, filename: string): Promise<any> {
    const startTime = Date.now();
    const formData = new FormData();
    const blob = new Blob([buffer], { type: "image/jpeg" });
    formData.append("file", blob, filename);

    try {
      const res = await fetch(`${AiClientService.baseUrl}/detect/image`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(30000)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`AI service image inference failed (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      return {
        ...data,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      throw new Error(`AI Service connection error: ${err.message}`);
    }
  }

  /**
   * Submits video bytes for frame-by-frame forensics and temporal timeline analysis.
   */
  static async analyzeVideo(buffer: Buffer, filename: string, maxFrames: number = 50): Promise<any> {
    const startTime = Date.now();
    const formData = new FormData();
    const blob = new Blob([buffer], { type: "video/mp4" });
    formData.append("file", blob, filename);
    formData.append("max_frames", maxFrames.toString());

    try {
      const res = await fetch(`${AiClientService.baseUrl}/detect/video`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(60000)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`AI service video inference failed (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      return {
        ...data,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      throw new Error(`AI Service connection error: ${err.message}`);
    }
  }

  /**
   * Submits audio bytes for synthetic speech and voice cloning detection.
   */
  static async analyzeAudio(buffer: Buffer, filename: string): Promise<any> {
    const startTime = Date.now();
    const formData = new FormData();
    const blob = new Blob([buffer], { type: "audio/wav" });
    formData.append("file", blob, filename);

    try {
      const res = await fetch(`${AiClientService.baseUrl}/detect/audio`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(30000)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`AI service audio inference failed (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      return {
        ...data,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      throw new Error(`AI Service connection error: ${err.message}`);
    }
  }

  /**
   * Checks runtime health and active models of the Python AI service.
   */
  static async checkHealth(): Promise<any> {
    try {
      const res = await fetch(`${AiClientService.baseUrl}/health`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        return await res.json();
      }
      return { status: "degraded", httpStatus: res.status };
    } catch (err: any) {
      return { status: "offline", error: err.message };
    }
  }

  /**
   * Fetches the registered AI model catalog from the AI service.
   */
  static async getModelCatalog(): Promise<any[]> {
    try {
      const res = await fetch(`${AiClientService.baseUrl}/models`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch {
      return [];
    }
  }
}
