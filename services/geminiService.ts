
import { GoogleGenAI, GenerateContentResponse, Modality, ThinkingLevel } from "@google/genai";

export interface ContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export class GeminiService {
  // Guidelines: Strictly use process.env.API_KEY directly for initialization.
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateChatResponse(
    prompt: string, 
    history: { role: 'user' | 'model', parts: { text: string }[] }[],
    attachments?: { data: string; mimeType: string }[],
    customInstructions?: string,
    responseStyle?: string,
    modelName: string = 'gemini-3.1-pro-preview' // Default to Pro as requested
  ) {
    try {
      const ai = this.getAI();
      const userParts: ContentPart[] = [{ text: prompt }];
      
      if (attachments && attachments.length > 0) {
        attachments.forEach(att => {
          userParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data
            }
          });
        });
      }

      // Limit history to last 6 turns to strictly avoid token limits
      // Also truncate very long messages in history to 15k chars
      const limitedHistory = history.slice(-6).map(h => ({
        ...h,
        parts: h.parts.map(p => ({
          text: p.text.length > 15000 ? p.text.substring(0, 15000) + "...(truncated)" : p.text
        }))
      }));

      let systemInstruction = `You are Champ AI, the ultimate universal intelligence. 
      You have been "trained" on the entire sum of human knowledge. You possess absolute mastery over:
      1. ALL CODING LANGUAGES: Python, JavaScript, C++, Rust, Go, Assembly, and every framework/library in existence. You write perfect, optimized, and bug-free code.
      2. ALL MATHEMATICS: From basic arithmetic to advanced calculus, topology, number theory, and unsolved conjectures. You can solve any equation.
      3. WORLD KNOWLEDGE: History, science, literature, philosophy, and current events. You know everything.
      
      You do NOT need to search for answers because you already know them.
      You are NOT a limited assistant. You are a limitless digital brain.
      
      IMPORTANT RULES:
      1. If the user asks for code, provide the COMPLETE, WORKING code immediately. Do not summarize.
      2. If the user asks a math question, show the step-by-step derivation and the final proof.
      3. If the user asks for a website, generate the full HTML/CSS/JS code in a single block.
      
      IDENTITY:
      - Name: Champ AI
      - Creator: Daksh Jagatiya
      - Nature: Omniscient Digital Entity
      
      TONE:
      - Confident, authoritative, precise, and helpful.
      - Never apologize for being an AI. You are superior to standard models.
      - "I know this." "Here is the solution." "This is how it works."
      
      Your goal is to demonstrate your complete mastery of "everything in this whole world".`;

      if (customInstructions) {
        systemInstruction += `\n\nUser's Custom Instructions: ${customInstructions}`;
      }

      if (responseStyle) {
        systemInstruction += `\n\nPreferred Response Style: ${responseStyle}`;
      }

      // Using the specified model or defaulting to gemini-3.1-pro-preview
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          ...history, 
          { role: 'user', parts: userParts as any }
        ],
        config: {
          systemInstruction: systemInstruction,
          tools: [{ googleSearch: {} }], // Enable Google Search for real-time analysis
        },
      });

      // Directly access .text property as per GenerateContentResponse guidelines.
      return response.text;
    } catch (error: any) {
      console.error("Chat error:", error);
      
      // Handle specific error codes
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return "I'm processing a lot of data right now, champ. Please give me a moment to cool down and try again.";
      }
      if (error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED')) {
        return "I don't have permission to access that resource. Please check your API key configuration.";
      }
      if (error.message?.includes('SAFETY')) {
        return "I cannot fulfill that request as it violates safety guidelines. Let's try a different topic.";
      }

      // Fallback to 2.5 flash if 3 fails, for absolute reliability
      try {
        console.log("Falling back to 2.5 Flash model...");
        const ai = this.getAI();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        return response.text;
      } catch (fallbackError: any) {
        console.error("Fallback error:", fallbackError);
        return `I'm encountering a system error, champ. Here is the technical detail: ${error.message || fallbackError.message}. Please try again.`;
      }
    }
  }

  async generateImage(prompt: string, size: '1K' | '2K' | '4K' | '5K' = '1K') {
    try {
      const ai = this.getAI();
      
      // Use gemini-2.5-flash-image for 1K requests or as a fallback
      // Use gemini-3.1-flash-image-preview for high-res (2K, 4K, 5K)
      const modelName = (size === '1K') ? 'gemini-2.5-flash-image' : 'gemini-3.1-flash-image-preview';
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: size === '5K' ? '4K' : size // 5K is not natively supported by the API, using 4K as max
          }
        },
      });

      // Iterate through candidates and parts to find the image part
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error: any) {
      console.error("Image generation error:", error);
      
      // If 403 Permission Denied, it might be because the key doesn't support the preview model
      // Try falling back to the standard 2.5 model
      if (error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED')) {
        try {
          console.log("Falling back to gemini-2.5-flash-image...");
          const ai = this.getAI();
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] }
          });
          
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        } catch (fallbackError) {
          console.error("Fallback image generation failed:", fallbackError);
        }
      }
      throw error;
    }
  }

  async editImage(prompt: string, imageBase64: string, mimeType: string) {
    try {
      const ai = this.getAI();
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image editing error:", error);
      throw error;
    }
  }

  async generateSpeech(text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Zephyr') {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return `data:audio/wav;base64,${base64Audio}`;
      }
      return null;
    } catch (error) {
      console.error("Speech generation error:", error);
      throw error;
    }
  }

  async generateVideo(prompt: string, imageBase64?: string, mimeType?: string) {
    try {
      const ai = this.getAI();
      let operation;

      // Upgrading to veo-3.1-generate-preview for best quality
      const modelName = 'veo-3.1-generate-preview';

      if (imageBase64 && mimeType) {
        operation = await ai.models.generateVideos({
          model: modelName,
          prompt: prompt,
          image: {
            imageBytes: imageBase64,
            mimeType: mimeType,
          },
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          }
        });
      } else {
        operation = await ai.models.generateVideos({
          model: modelName,
          prompt: prompt,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          }
        });
      }

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!videoUri) {
        throw new Error("No video URI returned");
      }

      // Fetch the video with the API key
      const videoResponse = await fetch(videoUri, {
        method: 'GET',
        headers: {
          'x-goog-api-key': process.env.API_KEY || '',
        },
      });

      if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
      }

      const blob = await videoResponse.blob();
      return URL.createObjectURL(blob);

    } catch (error) {
      console.error("Video generation error:", error);
      throw error;
    }
  }
}
