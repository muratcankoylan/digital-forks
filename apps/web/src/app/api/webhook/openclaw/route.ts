import { NextRequest, NextResponse } from 'next/server';
import { createPersona } from '@forks/agents';
import { createM2HerClient } from '@forks/m2her';
import { users, forks, messages } from '@forks/db';
import {
  verifyWebhookAuth,
  parseIncomingMessage,
  parseCommand,
  formatResponse,
  type IncomingMessage,
  type Platform,
} from '@forks/openclaw';

/**
 * POST /api/webhook/openclaw - Handle incoming messages from OpenClaw
 *
 * This endpoint receives messages from WhatsApp/Telegram/Discord via OpenClaw
 * and routes them to the appropriate fork conversation.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook authentication (token-based)
    const webhookSecret = process.env.OPENCLAW_WEBHOOK_SECRET || '';
    if (!verifyWebhookAuth(request.headers, webhookSecret)) {
      console.warn('OpenClaw webhook authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: IncomingMessage = await request.json();
    const { sender, message, platform, replyTo } = body;

    // Parse message content for quoted replies and media placeholders
    const parsedMessage = parseIncomingMessage(message);

    if (!sender || !message || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create user
    const platformId = `${platform}:${sender}`;
    const user = await users.findOrCreate(platformId);

    // Use the clean message (without quoted reply context)
    const cleanMessage = parsedMessage.cleanMessage;

    // Check for commands using parseCommand utility
    const cmd = parseCommand(cleanMessage);

    if (cmd.isCommand) {
      switch (cmd.command) {
        case 'start':
          return NextResponse.json(formatResponse(
            `Hi! I'm Forks.\n\nI can help you explore alternate versions of your life - the paths you didn't take.\n\nTo create your first fork, tell me about a decision you made and the path you didn't take. For example:\n\n"10 years ago, I chose to stay in my hometown instead of moving to Berlin for a startup job."\n\nWhat fork would you like to explore?`,
            { platform }
          ));

        case 'help':
          return NextResponse.json(formatResponse(
            `Commands:\n- /new - Create a new fork\n- /list - List your forks\n- /switch [name] - Switch to a different fork\n- /help - Show this message\n\nOr just start chatting with your current alternate self!`,
            { platform }
          ));

        case 'new':
          if (cmd.args) {
            // User provided fork description with command
            return await handleForkCreation(user.id, cmd.args, platform);
          }
          return NextResponse.json(formatResponse(
            `Let's create a new fork!\n\nTell me about a decision you made and the path you didn't take. Be specific about:\n- What the decision was\n- When it happened\n- What the alternative was\n\nFor example: "I chose tech over medical school 10 years ago"`,
            { platform }
          ));

        case 'list': {
          const userForks = await forks.findByUserId(user.id);
          const activeForks = userForks.filter((f) => f.status === 'active');

          if (activeForks.length === 0) {
            return NextResponse.json(formatResponse(
              `You don't have any forks yet. Tell me about a life decision you'd like to explore!`,
              { platform }
            ));
          }

          const list = activeForks
            .map((f, i) => `${i + 1}. ${f.alternateSelfName || 'Unnamed'} (${f.messageCount} messages)`)
            .join('\n');

          return NextResponse.json(formatResponse(
            `Your forks:\n\n${list}\n\nReply with a number to switch, or keep chatting with your current fork.`,
            { platform }
          ));
        }

        case 'switch':
          // TODO: Implement fork switching logic
          return NextResponse.json(formatResponse(
            `Fork switching coming soon! For now, use /list to see your forks.`,
            { platform }
          ));
      }
    }

    // Check if user has an active fork
    const activeFork = await forks.findActiveByUserId(user.id);

    // If no active fork, check if message looks like a fork description
    if (!activeFork) {
      const lowerClean = cleanMessage.toLowerCase();
      const looksLikeForkDescription =
        cleanMessage.length > 20 &&
        (lowerClean.includes('chose') ||
          lowerClean.includes('decided') ||
          lowerClean.includes('instead of') ||
          lowerClean.includes('what if') ||
          lowerClean.includes('years ago'));

      if (looksLikeForkDescription) {
        // Create a new fork
        return await handleForkCreation(user.id, cleanMessage, platform);
      } else {
        return NextResponse.json(formatResponse(
          `I'm not sure what you mean. Would you like to:\n\n1. Create a new fork - tell me about a life decision you made\n2. Type /list to see your existing forks\n3. Type /help for more options`,
          { platform }
        ));
      }
    }

    // Continue conversation with active fork
    // Pass quoted reply context if present
    return await handleConversation(activeFork, cleanMessage, platform, {
      quotedReply: parsedMessage.quotedReply,
      hasMedia: !!parsedMessage.media,
      mediaType: parsedMessage.media?.type,
      replyTo,
    });
  } catch (error) {
    console.error('OpenClaw webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle creating a new fork from a messaging platform
 */
async function handleForkCreation(
  userId: string,
  forkDescription: string,
  platform: Platform
) {
  try {
    // Create the fork record
    const fork = await forks.create({
      userId,
      forkDescription,
      choiceMade: '',
      choiceNotMade: '',
    });

    // Run the pipeline (this might take a while)
    // For messaging, we might want to do this async and notify when ready
    const result = await createPersona(forkDescription);

    // Update the fork
    await forks.updatePipelineOutputs(fork.id, {
      interviewOutput: result.interviewOutput,
      researchOutput: result.researchOutput,
      personaPrompt: result.personaPrompt,
      alternateSelfName: result.name,
      alternateSelfSummary: result.summary,
    });

    const replyText = `I've created ${result.name}!\n\n${result.summary}\n\nTheir first words to you:\n"${result.initialGreeting}"\n\nStart chatting whenever you're ready. Type /list to see all your forks or /new to create another.`;

    return NextResponse.json(formatResponse(replyText, { platform }));
  } catch (error) {
    console.error('Fork creation error:', error);
    return NextResponse.json(formatResponse(
      `Sorry, I had trouble creating that fork. Please try again with a more detailed description of the decision and alternative path.`,
      { platform }
    ));
  }
}

interface ConversationContext {
  quotedReply?: {
    sender: string;
    messageId: string;
    text: string;
  };
  hasMedia?: boolean;
  mediaType?: string;
  replyTo?: string;
}

/**
 * Handle a conversation message
 */
async function handleConversation(
  fork: Awaited<ReturnType<typeof forks.findById>>,
  message: string,
  platform: Platform,
  context?: ConversationContext
) {
  if (!fork || !fork.personaPrompt) {
    return NextResponse.json(formatResponse(
      `This fork isn't ready yet. Please try again in a moment.`,
      { platform }
    ));
  }

  try {
    // Get conversation history
    const history = await messages.getRecentHistory(fork.id, 30);

    // Create M2-Her client
    const m2her = createM2HerClient();

    // Build context-aware message
    let contextualMessage = message;
    if (context?.quotedReply) {
      contextualMessage = `[Replying to their message: "${context.quotedReply.text}"]\n\n${message}`;
    }
    if (context?.hasMedia) {
      contextualMessage = `[User sent a ${context.mediaType || 'media'} attachment]\n\n${message}`;
    }

    // Build messages with alternate self name for better character consistency
    const m2herMessages = m2her.buildForkMessages(
      fork.personaPrompt,
      fork.userContext,
      history.map((m) => ({
        role: m.role as 'user' | 'alternate_self',
        content: m.content,
      })),
      contextualMessage,
      {
        alternateSelfName: fork.alternateSelfName || undefined,
      }
    );

    // Get response (non-streaming for webhook)
    const startTime = Date.now();
    const response = await m2her.chat(m2herMessages);
    const latencyMs = Date.now() - startTime;

    // Save messages
    await messages.createPair(fork.id, message, response, {
      platform,
      latencyMs,
    });

    // Format response with platform-specific handling (auto-chunking for WhatsApp)
    return NextResponse.json(formatResponse(response, {
      platform,
      replyTo: context?.replyTo,
    }));
  } catch (error) {
    console.error('Conversation error:', error);
    return NextResponse.json(formatResponse(
      `Sorry, I had trouble responding. Please try again.`,
      { platform }
    ));
  }
}
