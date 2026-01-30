#!/usr/bin/env npx tsx
/**
 * Test script for Context Engineering Pipeline
 *
 * Run with: npx tsx scripts/test-pipeline.ts
 */

import { createPersona } from '../packages/agents/src';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

async function testPipeline() {
  console.log('🧪 Testing Context Engineering Pipeline\n');

  // Check API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not set in .env');
    process.exit(1);
  }

  console.log('✓ API key found\n');

  const forkDescription = `
    10 years ago, I chose to stay in my hometown and take a stable corporate job
    instead of moving to Berlin to join a friend's startup. The startup was in
    the renewable energy sector. I sometimes wonder what my life would have been
    like if I had taken that leap.
  `.trim();

  console.log('📝 Fork Description:');
  console.log(`   "${forkDescription.substring(0, 100)}..."\n`);

  console.log('🚀 Running Pipeline...\n');

  try {
    const result = await createPersona(forkDescription, (progress) => {
      const icon = progress.status === 'completed' ? '✓' : progress.status === 'error' ? '✗' : '⏳';
      console.log(`   ${icon} ${progress.stage}: ${progress.message}`);
    });

    console.log('\n✅ Pipeline completed!\n');

    // Display results
    console.log('📊 Results:\n');

    console.log('   Name:', result.name);
    console.log('   Summary:', result.summary?.substring(0, 200) + '...');
    console.log('   Initial Greeting:', result.initialGreeting?.substring(0, 150) + '...');

    console.log('\n   Interview Output:', result.interviewOutput ? '✓ Generated' : '✗ Missing');
    console.log('   Research Output:', result.researchOutput ? '✓ Generated' : '✗ Missing');
    console.log('   Persona Prompt:', result.personaPrompt ? `✓ Generated (${result.personaPrompt.length} chars)` : '✗ Missing');

    if (result.personaPrompt) {
      console.log('\n   📜 Persona Prompt Preview:');
      console.log('   ' + result.personaPrompt.substring(0, 500).replace(/\n/g, '\n   ') + '...');
    }

    console.log('\n✅ All pipeline tests passed!\n');
  } catch (error) {
    console.error('\n❌ Pipeline error:', error);
    process.exit(1);
  }
}

testPipeline().catch(console.error);
