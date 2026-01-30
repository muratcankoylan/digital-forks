# Forks Viral Demo Script

## Tech Stack for Demo

- **Claude Opus 4.5**: Powers the three-agent pipeline (Interview → Research → Architect)
- **MiniMax M2-Her**: Powers the actual conversation with 100+ turn consistency
- **Web Search**: Research Agent grounds personas in real facts

---

## Setup Checklist

Before recording:
- [ ] Forks app running at `http://localhost:3001`
- [ ] Browser in dark mode, fullscreen
- [ ] Clear any existing forks (fresh start)
- [ ] Have a compelling fork story ready

---

## Demo Flow (2-3 minutes)

### Scene 1: The Hook (10 seconds)

**Show the landing page.**

Narration (text overlay or voiceover):
> "What if you could meet the version of you who made the other choice?"

Pause on the hero text: **"Meet the you who made the other choice"**

---

### Scene 2: Create the Fork (30 seconds)

1. Click **"Create Your First Fork"**
2. Type this **realistic scenario** that showcases web search:

```
In 2019, I turned down a software engineering offer from Stripe in San Francisco
to stay at my stable job in Austin. I was making $120k and was scared of the
Bay Area cost of living. Stripe went public in 2021. I've wondered ever since
what my life would be like if I'd taken that risk.
```

**Why this works for demo:**
- Real company (Stripe) → Research Agent can pull actual IPO details, culture, trajectory
- Real city (SF vs Austin) → Authentic cost of living, lifestyle comparisons
- Specific year (2019) → Creates believable timeline
- Real salary → Grounded financial context

3. Click **"Create My Alternate Self"**

---

### Scene 3: Watch the Magic (45 seconds)

**This is the "wow" moment.** Show the three-stage pipeline in real-time:

1. **Interview Agent** (Claude Opus 4.5)
   - "Extracting emotional context..."
   - Detects: Fear of risk, stability vs growth tension, financial anxiety

2. **Research Agent** (Claude Opus 4.5 + Web Search)
   - "Researching your alternate timeline..."
   - Pulls: Stripe's 2021 IPO at $95B valuation, SF engineering culture, typical equity packages
   - Grounds the persona in REAL facts

3. **Persona Architect** (Claude Opus 4.5)
   - "Creating your alternate self..."
   - Synthesizes: Personality, memories, voice with Big Five traits

**Key visual:** The progress indicators animate through each stage.

---

### Scene 4: Meet Your Alternate Self (60 seconds)

The alternate self appears with:
- Name: **"Stripe You"** or **"SF You"**
- Summary: "Software engineer at Stripe since 2019. Survived the IPO, navigated layoffs, now worth $2.3M on paper."
- Initial greeting with specific details from research

**Show the greeting message:**
> "Hey... so you're the one who stayed in Austin. I've thought about you,
> especially during the Series H crunch in 2020 when I was sleeping at the office.
> The IPO changed everything — $95 billion valuation. My RSUs vested.
> But I lost something too. I haven't been home for Thanksgiving in three years."

---

### Scene 5: The Conversation (60 seconds)

Have this emotionally charged conversation:

**You:** "Do you regret it? Was the money worth it?"

**Alternate Self (M2-Her):** (Streaming response appears)
> "Worth it? I'm sitting in a $4,200/month studio in SOMA, looking at a Robinhood
> account that says I'm worth $2.3 million. Paper money. Can't sell most of it
> for another year.
>
> Meanwhile, you probably own a house. You've seen mom more than twice since 2019.
> You didn't have to explain to her over FaceTime why you couldn't fly home for
> her surgery because of a product launch.
>
> The money is real. But so is the emptiness at 2 AM when I'm debugging payments
> infrastructure and wondering if anyone would notice if I just... stopped."

**You:** "What would you tell 2019 me if you could go back?"

**Alternate Self:**
> "I'd say take the job — but not for the reasons you think. Not for the money.
> Take it because you'll learn who you really are when you're pushed to your limits.
> I found out I'm someone who can ship code that moves billions of dollars.
>
> But also? Call mom every week. Don't skip that flight home. The IPO will still happen.
> Your regrets won't be about the features you didn't ship."

---

### Scene 6: The Emotional Close (15 seconds)

Zoom in on the conversation. Let it breathe.

End card:
> **Forks — Meet your alternate self**
> github.com/yourname/forks
> Powered by Claude Opus 4.5 + MiniMax M2-Her

---

## More Realistic Demo Scenarios

These scenarios leverage **web search** for authentic grounding:

### The Coinbase Decision (Crypto)
```
In 2017, I almost joined Coinbase as an early engineer but took a job at IBM instead.
I had 50,000 options on the table. I watched the 2021 direct listing from my cubicle.
I want to meet the version of me who took the leap into crypto.
```
**Research Agent pulls:** Coinbase IPO details, option values, crypto culture

### The Medical School Fork
```
I got accepted to Johns Hopkins medical school in 2015 but chose to pursue tech
because I was scared of $300k in debt. My best friend from undergrad is now
a resident there. I wonder who I'd be if I'd followed that path.
```
**Research Agent pulls:** JHU residency details, doctor salaries, medical training timeline

### The Spotify Move (Europe)
```
Spotify offered me a senior role in Stockholm in 2018. I turned it down because
my partner didn't want to leave Chicago. We broke up a year later anyway.
I want to talk to the version of me who moved to Sweden.
```
**Research Agent pulls:** Stockholm cost of living, Spotify culture, Swedish work-life balance

### The Netflix Opportunity
```
In 2016, I interviewed at Netflix for their streaming team but didn't get the offer.
I've always wondered what my career would look like if I'd been part of building
something that changed how the world watches TV.
```
**Research Agent pulls:** Netflix engineering culture, stock trajectory, streaming tech evolution

### The SpaceX Dream
```
I turned down a propulsion engineer role at SpaceX in 2015 because my wife was
pregnant and we didn't want to move to LA. I watched Falcon Heavy land from my
couch in Ohio. My daughter is 9 now. Who would I be if I'd chased the stars?
```
**Research Agent pulls:** SpaceX milestones, Hawthorne campus life, rocket launches timeline

---

## Why Specific Details Matter

The **Research Agent** (Claude Opus 4.5) uses web search to:

1. **Ground the timeline** - Real IPO dates, funding rounds, company milestones
2. **Authentic financial details** - Actual equity values, salary ranges, cost of living
3. **Cultural accuracy** - Company culture, city vibes, industry norms
4. **Emotional believability** - Real events the alternate self would have experienced

Generic prompts like "a startup" produce generic personas.
Specific prompts like "Stripe in 2019" produce **eerily accurate** alternate selves.

---

## Recording Tips

1. **Pace:** Let the AI responses stream naturally. Don't fast-forward.
2. **Sound:** Soft, contemplative background music (lo-fi, piano)
3. **Text overlays:** Minimal. Let the product speak.
4. **Resolution:** 1080p or 4K, dark mode looks cinematic
5. **Length:** Keep it under 3 minutes. People scroll.

---

## Viral Elements

- **Universal relatability:** Everyone has "what ifs"
- **Specific authenticity:** Real companies, real numbers = believable
- **Emotional resonance:** The conversation feels real, not chatbot-y
- **Technical impressiveness:** Three-agent pipeline with web search is visible
- **Shareable moment:** The alternate self's response is screenshot-worthy

---

## Social Media Captions

**Twitter/X:**
> I built an AI that lets you talk to alternate versions of yourself.
>
> Here's me meeting "Stripe Me" — the version who took that SF job in 2019.
>
> It researched Stripe's actual IPO, calculated my potential equity, and knew
> exactly how much I'd be paying for a SOMA apartment.
>
> Open source: github.com/yourname/forks

**LinkedIn:**
> What if you could have a conversation with the version of you who made a different choice?
>
> I built Forks — an AI that creates authentic alternate selves using:
> • Claude Opus 4.5 for deep emotional understanding
> • Web search for real-world grounding (actual companies, real timelines)
> • MiniMax M2-Her for 100+ turn character consistency
>
> The demo shows "Stripe Me" — the version of me who took that SF job in 2019.
> It knows about the $95B IPO. It knows about the sacrifices.
>
> What decision would you explore?

**TikTok/Reels:**
> POV: You're talking to the version of you who joined Stripe in 2019...
> [Show the streaming response with specific $ amounts and details]
> "I'm worth $2.3M on paper. Can't sell most of it for another year."

---

## Technical Showcase Points

For developer audiences, highlight:

1. **Claude Opus 4.5**: Highest-quality model for nuanced persona creation
2. **Three-agent pipeline**: Interview → Research → Architect
3. **Web search integration**: Real companies, real facts, real timelines
4. **MiniMax M2-Her**: 7 message roles, 100+ turn consistency
5. **Research-backed**: Big Five personality, drift prevention from Anthropic research
6. **Multi-platform**: Web + WhatsApp/Telegram via OpenClaw
7. **Open source**: MIT licensed, contributions welcome

---

*Last updated: January 2026*
