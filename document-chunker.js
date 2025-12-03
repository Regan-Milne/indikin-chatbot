const fs = require('fs');

class DocumentChunker {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1000;
    this.overlap = options.overlap || 200;
  }

  chunkMarkdown(text) {
    // First split by major sections (headers)
    const sections = this.splitByHeaders(text);
    const chunks = [];
    
    for (const section of sections) {
      if (section.length <= this.chunkSize) {
        chunks.push({
          content: section.trim(),
          metadata: this.extractMetadata(section)
        });
      } else {
        // Recursively split large sections
        const subChunks = this.recursiveSplit(section);
        chunks.push(...subChunks);
      }
    }
    
    return chunks;
  }

  splitByHeaders(text) {
    // Split by markdown headers while preserving them
    const headerRegex = /^(#{1,6}\s.+)$/gm;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = headerRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const content = text.slice(lastIndex, match.index);
        if (content.trim()) {
          parts.push(content.trim());
        }
      }
      lastIndex = match.index;
    }

    // Add remaining content
    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex);
      if (remaining.trim()) {
        parts.push(remaining.trim());
      }
    }

    return parts.filter(part => part.trim().length > 0);
  }

  recursiveSplit(text) {
    if (text.length <= this.chunkSize) {
      return [{
        content: text.trim(),
        metadata: this.extractMetadata(text)
      }];
    }

    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= this.chunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) {
          chunks.push({
            content: currentChunk.trim(),
            metadata: this.extractMetadata(currentChunk)
          });
          
          // Add overlap from previous chunk
          const words = currentChunk.split(' ');
          const overlapWords = words.slice(-Math.floor(this.overlap / 6)); // Approx 6 chars per word
          currentChunk = overlapWords.join(' ') + ' ' + sentence;
        } else {
          currentChunk = sentence;
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: this.extractMetadata(currentChunk)
      });
    }

    return chunks;
  }

  extractMetadata(text) {
    const metadata = {};
    
    // Extract header level and text
    const headerMatch = text.match(/^(#{1,6})\s(.+)/m);
    if (headerMatch) {
      metadata.header_level = headerMatch[1].length;
      metadata.header_text = headerMatch[2];
      metadata.type = 'header_section';
    } else {
      metadata.type = 'content';
    }

    // Extract approximate word count
    metadata.word_count = text.split(/\s+/).length;
    
    // Check for specific content types
    if (text.includes('indikin.online') || text.includes('indikin.com')) {
      metadata.contains_urls = true;
    }
    
    if (text.match(/\$[A-Z]+/)) {
      metadata.contains_tokens = true;
    }

    return metadata;
  }

  async processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const chunks = this.chunkMarkdown(content);
      
      return {
        success: true,
        chunks: chunks,
        metadata: {
          source_file: filePath,
          total_chunks: chunks.length,
          original_length: content.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DocumentChunker;