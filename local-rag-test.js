const fs = require('fs');
const EmbeddingClient = require('./embedding-client');

class LocalRAGTester {
  constructor() {
    this.embedder = new EmbeddingClient();
    this.chunks = [];
    this.loadProcessedDocument();
  }

  loadProcessedDocument() {
    try {
      const data = JSON.parse(fs.readFileSync('processed_documents.json', 'utf-8'));
      this.chunks = data.chunks;
      console.log(`📚 Loaded ${this.chunks.length} chunks for testing`);
    } catch (error) {
      console.error('❌ Failed to load processed document:', error.message);
      process.exit(1);
    }
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  async search(query, topK = 5) {
    console.log(`🔍 Searching for: "${query}"`);
    
    // Get embedding for the query
    const queryEmbedding = await this.embedder.embed(query);
    if (!queryEmbedding.success) {
      throw new Error(`Failed to embed query: ${queryEmbedding.error}`);
    }

    console.log(`🔢 Generated query embedding`);

    // Calculate similarities
    const similarities = this.chunks.map((chunk, index) => ({
      index,
      content: chunk.content,
      metadata: chunk.metadata,
      similarity: this.cosineSimilarity(queryEmbedding.embedding, chunk.embedding)
    }));

    // Sort by similarity and return top results
    const results = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results;
  }

  async testQuery(query, topK = 3) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 TESTING QUERY: "${query}"`);
    console.log(`${'='.repeat(60)}`);

    try {
      const results = await this.search(query, topK);
      
      console.log(`\n📊 Top ${topK} Results:`);
      results.forEach((result, index) => {
        console.log(`\n${index + 1}. Similarity: ${result.similarity.toFixed(4)}`);
        console.log(`   Metadata: ${JSON.stringify(result.metadata, null, 2)}`);
        console.log(`   Content Preview: ${result.content.substring(0, 200)}...`);
        console.log(`   ${'-'.repeat(50)}`);
      });

      return results;
    } catch (error) {
      console.error('❌ Search failed:', error.message);
      return [];
    }
  }
}

// Test queries
async function runTests() {
  const tester = new LocalRAGTester();
  
  const testQueries = [
    "What is Indikin?",
    "How does filmmaker funding work?",
    "What is the Indikin token?",
    "Tell me about IndiFlix",
    "What problems does Indikin solve?",
    "How do filmmakers earn money?"
  ];

  for (const query of testQueries) {
    await tester.testQuery(query);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = LocalRAGTester;