import OpenAI from 'openai';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    // Initialize with a dummy key if missing to prevent immediate crash
    // We will check for the actual key before making requests
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-init',
      dangerouslyAllowBrowser: true 
    });
  }

  async generateChatResponse(
    prompt: string,
    history: { role: 'user' | 'assistant' | 'system', content: string }[],
    systemInstruction?: string,
    model: string = 'gpt-4o'
  ) {
    if (!process.env.OPENAI_API_KEY) {
      return "Error: OpenAI API Key is not configured. Please add OPENAI_API_KEY to your .env file or switch back to the Gemini model in Settings.";
    }

    try {
      const messages: any[] = [];

      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }

      // Add history
      messages.push(...history);

      // Add current prompt
      messages.push({ role: 'user', content: prompt });

      const completion = await this.openai.chat.completions.create({
        messages: messages,
        model: model,
        max_tokens: 4096, // Large output support
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI Chat Error:", error);
      throw error;
    }
  }

  async generateImage(prompt: string, size: '1024x1024' = '1024x1024') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API Key is not configured. Please add OPENAI_API_KEY to your .env file or switch back to the Gemini model in Settings.");
    }

    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: size,
        response_format: "b64_json",
        quality: "hd",
        style: "vivid"
      });

      return `data:image/png;base64,${response.data[0].b64_json}`;
    } catch (error) {
      console.error("OpenAI Image Error:", error);
      throw error;
    }
  }
  
  // Note: OpenAI does not currently have a public video generation API (Sora is not public).
  // We will keep the Veo integration for video as it is the best available option in this environment.
}
