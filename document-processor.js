const DocumentChunker = require('./document-chunker');
const EmbeddingClient = require('./embedding-client');
const fs = require('fs');
const path = require('path');

class DocumentProcessor {
  constructor() {
    this.chunker = new DocumentChunker({
      chunkSize: 1200,
      overlap: 250
    });
    this.embedder = new EmbeddingClient();
  }

  async processDocument(filePath) {
    console.log(`📄 Processing document: ${filePath}`);
    
    // Step 1: Chunk the document
    const chunkResult = await this.chunker.processFile(filePath);
    if (!chunkResult.success) {
      throw new Error(`Chunking failed: ${chunkResult.error}`);
    }

    console.log(`📝 Created ${chunkResult.chunks.length} chunks`);
    
    // Step 2: Create embeddings
    const texts = chunkResult.chunks.map(chunk => chunk.content);
    console.log(`🔢 Creating embeddings for ${texts.length} chunks...`);
    
    const embeddingResult = await this.embedder.embedBatch(texts);
    if (!embeddingResult.success) {
      throw new Error(`Embedding failed: ${embeddingResult.error}`);
    }

    console.log(`✅ Generated ${embeddingResult.embeddings.length} embeddings`);

    // Step 3: Combine chunks with embeddings
    const processedChunks = chunkResult.chunks.map((chunk, index) => ({
      content: chunk.content,
      embedding: embeddingResult.embeddings[index],
      metadata: {
        ...chunk.metadata,
        source_file: path.basename(filePath),
        chunk_index: index,
        created_at: new Date().toISOString()
      }
    }));

    return {
      success: true,
      chunks: processedChunks,
      metadata: {
        ...chunkResult.metadata,
        embedding_model: 'openai/text-embedding-3-small',
        processed_at: new Date().toISOString()
      }
    };
  }

  async processDirectory(dirPath) {
    const results = [];
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      if (file.endsWith('.md') || file.endsWith('.txt')) {
        const filePath = path.join(dirPath, file);
        try {
          const result = await this.processDocument(filePath);
          results.push(result);
        } catch (error) {
          console.error(`❌ Failed to process ${file}:`, error.message);
        }
      }
    }
    
    return results;
  }

  async saveProcessedData(processedData, outputPath = 'processed_documents.json') {
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
    console.log(`💾 Saved processed data to ${outputPath}`);
  }
}

// CLI usage
if (require.main === module) {
  const processor = new DocumentProcessor();
  
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node document-processor.js <file_or_directory_path>');
    process.exit(1);
  }

  const targetPath = args[0];
  
  (async () => {
    try {
      let results;
      
      if (fs.statSync(targetPath).isDirectory()) {
        console.log(`📁 Processing directory: ${targetPath}`);
        results = await processor.processDirectory(targetPath);
      } else {
        console.log(`📄 Processing file: ${targetPath}`);
        results = await processor.processDocument(targetPath);
      }
      
      await processor.saveProcessedData(results);
      console.log('🎉 Processing complete!');
      
    } catch (error) {
      console.error('❌ Processing failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = DocumentProcessor;