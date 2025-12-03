require('dotenv').config();
const axios = require('axios');

class EmbeddingClient {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.model = 'openai/text-embedding-3-small';
    
    if (!this.apiKey || this.apiKey === 'YOUR_KEY_HERE') {
      throw new Error('Please set your OPENROUTER_API_KEY in the .env file');
    }
  }

  async embed(text) {
    try {
      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          model: this.model,
          input: text,
          encoding_format: 'float'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Indikin RAG Embeddings'
          }
        }
      );

      return {
        success: true,
        embedding: response.data.data[0].embedding,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('Embedding API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async embedBatch(texts, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`Processing embedding batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`);
      
      try {
        const response = await axios.post(
          `${this.baseURL}/embeddings`,
          {
            model: this.model,
            input: batch,
            encoding_format: 'float'
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'Indikin RAG Embeddings'
            }
          }
        );

        const embeddings = response.data.data.map(item => item.embedding);
        results.push(...embeddings);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Batch embedding error:`, error.response?.data || error.message);
        throw error;
      }
    }

    return {
      success: true,
      embeddings: results,
      count: results.length
    };
  }
}

module.exports = EmbeddingClient;