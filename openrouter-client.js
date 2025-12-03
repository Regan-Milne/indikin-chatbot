require('dotenv').config();
const axios = require('axios');

class OpenRouterClient {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.modelName = process.env.MODEL_NAME || 'qwen/qwen-3-235b-a22b-instruct';
    this.baseURL = 'https://openrouter.ai/api/v1';
    
    if (!this.apiKey || this.apiKey === 'YOUR_KEY_HERE') {
      throw new Error('Please set your OPENROUTER_API_KEY in the .env file. Get one at https://openrouter.ai/');
    }
  }

  async chatStream(message, conversationHistory = [], onChunk) {
    try {
      const messages = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.modelName,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Indikin Chatbot'
          },
          responseType: 'stream'
        }
      );

      let fullMessage = '';
      let usage = null;

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                resolve({
                  success: true,
                  message: fullMessage,
                  usage: usage
                });
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  const content = parsed.choices[0].delta.content;
                  fullMessage += content;
                  if (onChunk) onChunk(content);
                }
                
                if (parsed.usage) {
                  usage = parsed.usage;
                }
              } catch (e) {
                // Skip malformed JSON chunks
              }
            }
          }
        });

        response.data.on('end', () => {
          resolve({
            success: true,
            message: fullMessage,
            usage: usage
          });
        });

        response.data.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('OpenRouter API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.response?.data?.error || error.message
      };
    }
  }

  async chat(message, conversationHistory = []) {
    try {
      const messages = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.modelName,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Indikin Chatbot'
          }
        }
      );

      return {
        success: true,
        message: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('OpenRouter API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = OpenRouterClient;