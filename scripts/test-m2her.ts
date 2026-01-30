#!/usr/bin/env npx tsx
/**
 * Test script for M2-Her client via OpenRouter
 *
 * Run with: npx tsx scripts/test-m2her.ts
 */

import { createM2HerClient } from '../packages/m2her/src';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

async function testM2Her() {
  console.log('🧪 Testing M2-Her Client via OpenRouter\n');

  // Check API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not set in .env');
    process.exit(1);
  }

  console.log('✓ API key found');

  // Create client
  const client = createM2HerClient();
  console.log('✓ Client created\n');

  // Test 1: Simple chat with user_system context
  console.log('📝 Test 1: Chat with user_system context (converted for OpenRouter)');
  try {
    const messages = client.buildForkMessages(
      'You are an alternate version of the user who moved to Berlin 10 years ago. You are confident, creative, and love the startup scene. You speak casually and with enthusiasm.',
      'The real user stayed in their hometown and works a corporate job. They sometimes wonder what life would have been like.',
      [],
      'Hey, how are you doing?',
      { alternateSelfName: 'Berlin You' }
    );

    console.log('   Sending message...');
    const response = await client.chat(messages, { maxTokens: 150 });
    console.log('   ✓ Response received:');
    console.log(`   "${response}"\n`);
  } catch (error) {
    console.error('   ❌ Error:', error);
    process.exit(1);
  }

  // Test 2: Conversation with history
  console.log('📝 Test 2: Conversation with history');
  try {
    const messages = client.buildForkMessages(
      'You are an alternate version of the user who became a professional musician instead of a software engineer. You tour with a band and live a bohemian lifestyle.',
      null,
      [
        { role: 'user', content: 'What instrument do you play?' },
        { role: 'alternate_self', content: 'Guitar! Been playing since I was 15. The calluses on my fingers are like badges of honor.' },
      ],
      'Do you ever regret not going into tech?',
      { alternateSelfName: 'Musician You' }
    );

    console.log('   Sending message...');
    const response = await client.chat(messages, { maxTokens: 150 });
    console.log('   ✓ Response received:');
    console.log(`   "${response}"\n`);
  } catch (error) {
    console.error('   ❌ Error:', error);
    process.exit(1);
  }

  // Test 3: Streaming
  console.log('📝 Test 3: Streaming response');
  try {
    const messages = client.buildForkMessages(
      'You are an alternate version of the user who opened a small cafe in Paris. You are warm, philosophical, and love discussing life over espresso.',
      'The real user works in finance and lives in New York.',
      [],
      'What made you decide to open a cafe?',
      { alternateSelfName: 'Paris You' }
    );

    console.log('   Streaming: ');
    process.stdout.write('   "');
    for await (const chunk of client.chatStream(messages, { maxTokens: 150 })) {
      process.stdout.write(chunk);
    }
    console.log('"\n');
  } catch (error) {
    console.error('   ❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ All M2-Her tests passed!\n');
}

testM2Her().catch(console.error);
