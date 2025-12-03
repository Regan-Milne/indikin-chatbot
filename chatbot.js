const readline = require('readline');
const OpenRouterClient = require('./openrouter-client');

class Chatbot {
  constructor() {
    this.client = new OpenRouterClient();
    this.conversationHistory = [];
    this.totalCost = 0;
    this.totalTokens = 0;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  start() {
    console.log('🤖 Indikin Chatbot powered by Qwen');
    console.log('Type "exit" or "quit" to end the conversation');
    console.log('Type "cost" to see usage statistics\n');
    
    this.askQuestion();
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

      if (input.trim() === '') {
        this.askQuestion();
        return;
      }

      console.log('\n🤖 Thinking...');
      
      const response = await this.client.chat(input, this.conversationHistory);
      
      if (response.success) {
        console.log(`\nBot: ${response.message}\n`);
        
        // Track usage and costs
        if (response.usage) {
          this.totalTokens += response.usage.total_tokens || 0;
          if (response.usage.total_cost) {
            this.totalCost += response.usage.total_cost;
          }
        }
        
        // Add to conversation history
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
    console.log(`Messages in history: ${this.conversationHistory.length / 2}\n`);
  }

  showFinalStats() {
    if (this.totalTokens > 0 || this.totalCost > 0) {
      console.log('\n📊 Final Session Statistics:');
      console.log(`Total tokens used: ${this.totalTokens.toLocaleString()}`);
      console.log(`Total cost: $${this.totalCost.toFixed(6)}`);
      console.log(`Total messages: ${this.conversationHistory.length / 2}`);
    }
  }
}

// Start the chatbot if this file is run directly
if (require.main === module) {
  try {
    const chatbot = new Chatbot();
    chatbot.start();
  } catch (error) {
    console.error('❌ Failed to start chatbot:', error.message);
    process.exit(1);
  }
}

module.exports = Chatbot;