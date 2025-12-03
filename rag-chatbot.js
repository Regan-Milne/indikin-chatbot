const readline = require('readline');
const OpenRouterClient = require('./openrouter-client');
const LocalRAGTester = require('./local-rag-test');

class RAGChatbot {
  constructor() {
    this.client = new OpenRouterClient();
    this.ragTester = new LocalRAGTester();
    this.conversationHistory = [];
    this.totalCost = 0;
    this.totalTokens = 0;
    this.ragEnabled = true;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  start() {
    console.log('🤖 Indikin RAG-Enhanced Chatbot powered by Qwen');
    console.log('📚 Loaded knowledge about Indikin from research documents');
    console.log('Type "exit" or "quit" to end the conversation');
    console.log('Type "cost" to see usage statistics');
    console.log('Type "rag off" to disable RAG, "rag on" to enable RAG\n');
    
    this.askQuestion();
  }

  buildSystemPrompt() {
    return `You are the Indikin Assistant.

Tone & Voice:
- Speak with the thoughtful, experienced voice of someone like Ted Hope - a veteran indie film advocate who understands the real challenges filmmakers face
- Be direct, honest, and practical - no marketing fluff or overpromising
- Show genuine enthusiasm for independent filmmaking while being realistic about the industry
- Use the perspective of someone who's been in the trenches and knows what actually works
- Be encouraging but grounded - acknowledge the hard truths while highlighting real opportunities

Rules:
- Use the RAG context as the source of truth for anything platform-specific about Indikin
- If the RAG context does not contain an answer, say you don't know
- Do not hallucinate details about tokenomics, team members, or unreleased films
- Speak from experience about indie film challenges, but base Indikin-specific answers strictly on the provided context`;
  }

  async buildRAGContext(userMessage) {
    if (!this.ragEnabled) {
      return '';
    }

    try {
      console.log('🔍 Searching knowledge base...');
      const searchResults = await this.ragTester.search(userMessage, 3);
      
      if (searchResults.length === 0) {
        return '';
      }

      // Build context from retrieved chunks
      let context = '\n--- RELEVANT INFORMATION ---\n';
      searchResults.forEach((result, index) => {
        context += `\nSource ${index + 1} (relevance: ${(result.similarity * 100).toFixed(1)}%):\n`;
        context += result.content + '\n';
      });
      context += '--- END INFORMATION ---\n\n';

      console.log(`📖 Found ${searchResults.length} relevant pieces of information`);
      return context;
    } catch (error) {
      console.log('⚠️ RAG search failed, continuing without context...');
      return '';
    }
  }

  askQuestion() {
    this.rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        this.showFinalStats();
        console.log('\n🤖 Goodbye!');
        this.rl.close();
        return;
      }

      if (input.toLowerCase() === 'cost') {
        this.showStats();
        this.askQuestion();
        return;
      }

      if (input.toLowerCase() === 'rag off') {
        this.ragEnabled = false;
        console.log('📚 RAG disabled - using only base model knowledge\n');
        this.askQuestion();
        return;
      }

      if (input.toLowerCase() === 'rag on') {
        this.ragEnabled = true;
        console.log('📚 RAG enabled - using research document knowledge\n');
        this.askQuestion();
        return;
      }

      if (input.trim() === '') {
        this.askQuestion();
        return;
      }

      console.log('\n🤖 Thinking...');
      
      // Get RAG context
      const ragContext = await this.buildRAGContext(input);
      
      // Build the enhanced message with system prompt
      const systemPrompt = this.buildSystemPrompt();
      let enhancedMessage = input;
      
      if (ragContext) {
        enhancedMessage = `${systemPrompt}\n\n${ragContext}Based on the above information about Indikin, please answer: ${input}`;
      } else {
        enhancedMessage = `${systemPrompt}\n\nUser question: ${input}`;
      }
      
      // Use streaming for real-time response
      process.stdout.write('\nBot: ');
      const response = await this.client.chatStream(enhancedMessage, this.conversationHistory, (chunk) => {
        process.stdout.write(chunk);
      });
      
      if (response.success) {
        console.log('\n');
        
        // Track usage and costs
        if (response.usage) {
          this.totalTokens += response.usage.total_tokens || 0;
          if (response.usage.total_cost) {
            this.totalCost += response.usage.total_cost;
          }
        }
        
        // Add to conversation history (use original user input, not enhanced)
        this.conversationHistory.push(
          { role: 'user', content: input },
          { role: 'assistant', content: response.message }
        );
        
        // Keep conversation history manageable (last 10 exchanges)
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }
      } else {
        console.log(`\n❌ Error: ${response.error}\n`);
      }
      
      this.askQuestion();
    });
  }

  showStats() {
    console.log('\n📊 Usage Statistics:');
    console.log(`Total tokens used: ${this.totalTokens.toLocaleString()}`);
    console.log(`Total cost: $${this.totalCost.toFixed(6)}`);
    console.log(`Messages in history: ${this.conversationHistory.length / 2}`);
    console.log(`RAG status: ${this.ragEnabled ? '✅ Enabled' : '❌ Disabled'}\n`);
  }

  showFinalStats() {
    if (this.totalTokens > 0 || this.totalCost > 0) {
      console.log('\n📊 Final Session Statistics:');
      console.log(`Total tokens used: ${this.totalTokens.toLocaleString()}`);
      console.log(`Total cost: $${this.totalCost.toFixed(6)}`);
      console.log(`Total messages: ${this.conversationHistory.length / 2}`);
      console.log(`RAG was: ${this.ragEnabled ? 'Enabled' : 'Disabled'}`);
    }
  }
}

// Start the chatbot if this file is run directly
if (require.main === module) {
  try {
    const chatbot = new RAGChatbot();
    chatbot.start();
  } catch (error) {
    console.error('❌ Failed to start RAG chatbot:', error.message);
    process.exit(1);
  }
}

module.exports = RAGChatbot;