# Indikin RAG Chatbot (Qwen-Powered)

This repository contains a Retrieval-Augmented Generation (RAG) chatbot designed for the Indikin platform.
It uses:

* Qwen3 235B A22B Instruct (OpenRouter) for generation
* OpenAI text-embedding-3-small for embeddings
* Local JSON-based vector store (easily swappable for Supabase pgvector)

The project provides a complete, working reference implementation of a modern RAG pipeline — chunking, embeddings, similarity search, context injection, and LLM response.

## ✨ Features

* End-to-end RAG pipeline
* Qwen-powered chatbot with markdown formatting
* Chunking + embedding of Indikin research documents
* Local vector store (processed_documents.json) for easy testing
* Swappable embedding providers (OpenAI or local)
* Swappable generation providers (OpenRouter → Qwen)
* Optional Supabase integration for production deployment
* Clear code structure for easy modification or extension

This repository is meant as a developer-friendly blueprint:
You can run everything locally OR integrate with Supabase / your production backend.

## 📂 Project Structure
```
data/
  documents/
    Indikin_research.md         # Base knowledge document
node_modules/

.env.example                    # Environment variables template
.env                            # (ignored) Populate with API keys

document-processor.js           # Loads & normalizes markdown documents
document-chunker.js             # Splits documents into chunks
embedding-client.js             # Embeds chunks via OpenAI
processed_documents.json        # Final RAG knowledge base (local)

local-rag-test.js               # Simple local similarity search tester
openrouter-client.js            # Qwen model wrapper for generation
rag-chatbot.js                  # Full RAG chatbot pipeline
chatbot.js                      # Non-RAG fallback chatbot

package.json
README.md
```

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Create your .env
```bash
cp .env.example .env
```

Then fill in:
```
OPENROUTER_API_KEY=your-key-here
OPENROUTER_MODEL=qwen/qwen-3-235b-a22b-instruct-2507

EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
OPENAI_API_KEY=your-openai-key
```

(Only the embedding model uses OpenAI — cost is pennies.)

## 🧠 Running the Chatbot (RAG Mode)

Start the RAG-enhanced chatbot:

```bash
node rag-chatbot.js
```

You'll see:

```
🤖 Indikin RAG-Enhanced Chatbot
📚 Loaded knowledge about Indikin
Type 'exit' to quit
```

Examples you can try:

* tell me about Indikin
* how do filmmaker tokens work?
* what films are available?
* what is the mission of Indikin?

## 🧩 How the RAG Pipeline Works
```
Indikin_research.md
   ↓
document-processor.js
   ↓
document-chunker.js
   ↓
embedding-client.js
   ↓
processed_documents.json    ← stored locally
   ↓
rag-chatbot.js
   ↓
Qwen model
```

**Chunking details:**
* Chunk size: ~1,000 chars
* Overlap: ~200 chars
* Markdown-aware splitting

**Retrieval:**
* Embed user query
* Compare to stored embeddings
* Return top-k relevant chunks

**Generation:**
* Inject context → Qwen model
* Model produces grounded answer

## 🔧 Rebuilding the RAG Knowledge Base

If you update the Indikin research document or add new sources, run:

```bash
node document-processor.js
node document-chunker.js
node embedding-client.js
```

This regenerates processed_documents.json.

## 🗄️ Optional: Using Supabase (Production Setup)

This repo ships with a local JSON vector store, but you can easily replace it with Supabase pgvector.

Basic SQL schema:

```sql
create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(1536),
  doc_type text,
  title text,
  section text,
  url text
);

create index on documents using ivfflat (embedding vector_cosine_ops);
```

Then modify the retrieval logic in local-rag-test.js or rag-chatbot.js to query Supabase instead of the local file.

If you want, you can also move:
* chunk embeddings
* metadata
* film data
* platform docs

…into Supabase for long-term scaling.

## 🧪 Local RAG Testing Utility

You can manually test retrieval WITHOUT calling Qwen:

```bash
node local-rag-test.js
```

This prints:
* query embedding
* retrieved chunk IDs
* chunk content previews

Useful for evaluating chunk quality and RAG effectiveness.

## 🤝 Developer Notes

* This repository is a working reference implementation.
* You can extend, replace, or productionize any layer (RAG, LLM provider, embeddings, or vector DB).
* Supabase integration is optional and can be added easily.
* The entire architecture is provider-agnostic and modular.

## 📝 License

MIT — feel free to use, modify, and extend.

## 🙌 Credits

Developed by Regan Milne as part of an AI assistant prototype for Indikin.
Includes a full RAG pipeline, embeddings, Qwen integration, and knowledge-base processing.