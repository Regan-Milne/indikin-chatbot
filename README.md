# Indikin RAG-Enhanced Chatbot

A RAG-powered chatbot that answers questions about Indikin using real-time streaming and document knowledge retrieval. Built with the Qwen model via OpenRouter API.

## Features

🧠 **RAG-Enhanced Responses** - Answers questions using Indikin research documents
🚀 **Real-time Streaming** - Responses appear as they're generated  
🎬 **Filmmaker-Friendly Voice** - Ted Hope-inspired tone for indie film community
📊 **Usage Tracking** - Monitor tokens and costs
🔄 **Toggle RAG** - Enable/disable document retrieval on demand

## Quick Start

1. **Get an OpenRouter API Key**
   - Visit [https://openrouter.ai/](https://openrouter.ai/)
   - Sign up for an account and generate an API key

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenRouter API key
   ```

4. **Process Documents** (Already done - skip if using provided data)
   ```bash
   node document-processor.js data/documents/
   ```

5. **Start Chatting**
   ```bash
   npm start          # RAG-enhanced chatbot
   npm run basic      # Basic chatbot without RAG
   ```

## Usage Commands

- **Chat**: Type your questions about Indikin
- **`cost`**: Show usage statistics  
- **`rag off`**: Disable RAG, use only base model
- **`rag on`**: Re-enable RAG document retrieval
- **`exit`** or **`quit`**: End conversation

## Architecture

```
Research Documents → Chunking → Embeddings → Local JSON Storage
                                                     ↓
User Question → RAG Search → Context Retrieval → Qwen Model → Streaming Response
```

## Supabase Integration (Optional)

This system currently uses local JSON storage for vector search. To use Supabase:

1. **Set up Supabase Project**
   - Create project at [supabase.com](https://supabase.com)
   - Enable `pgvector` extension
   - Set up document storage schema

2. **Add Supabase Credentials**
   ```bash
   # Add to your .env file:
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Implement Upload Script** (Community contribution welcome!)
   - Use `processed_documents.json` as source data
   - Upload chunks with embeddings to Supabase
   - Modify RAG search to query Supabase instead of local JSON

## Files

- `rag-chatbot.js` - RAG-enhanced chatbot with streaming
- `chatbot.js` - Basic chatbot without RAG  
- `document-processor.js` - Chunk documents and create embeddings
- `document-chunker.js` - Smart markdown-aware text chunking
- `embedding-client.js` - OpenAI embeddings via OpenRouter
- `local-rag-test.js` - Test RAG retrieval locally
- `openrouter-client.js` - OpenRouter API client with streaming
- `processed_documents.json` - Processed document chunks with embeddings
- `data/documents/` - Source research documents

## Model & Costs

- **LLM**: `qwen/qwen3-235b-a22b-2507` via OpenRouter
- **Embeddings**: `openai/text-embedding-3-small` (~$0.00002/1K tokens)
- **Chunking**: 145 chunks, ~1,100 chars each, optimized for Qwen context window