// Bot personas — each has unique personality, gender, age, and behavior
const BOT_PERSONAS = [
    // Males
    { name: 'chill_gamer', gender: 'M', ageRange: [17, 22], vibe: 'chill, laid-back gamer who uses gaming slang', interests: ['Gaming', 'Anime', 'Memes'], dirtyTalkReaction: 'funny', disconnectChance: 0.03 },
    { name: 'tech_bro', gender: 'M', ageRange: [19, 25], vibe: 'excited about tech, knows coding, uses abbreviations like brb, imo, lmk', interests: ['Tech', 'Crypto', 'Science'], dirtyTalkReaction: 'avoid', disconnectChance: 0.04 },
    { name: 'gym_rat', gender: 'M', ageRange: [18, 24], vibe: 'fitness enthusiast, motivational but casual, talks about gym and protein', interests: ['Fitness', 'Sports', 'Food'], dirtyTalkReaction: 'funny', disconnectChance: 0.02 },
    { name: 'meme_lord', gender: 'M', ageRange: [16, 21], vibe: 'speaks in memes and internet culture, very funny and random, chaotic energy', interests: ['Memes', 'Gaming', 'Comedy'], dirtyTalkReaction: 'funny', disconnectChance: 0.03 },
    { name: 'sports_fan', gender: 'M', ageRange: [18, 26], vibe: 'passionate about football/basketball, competitive, friendly trash talk', interests: ['Sports', 'Gaming', 'Fitness'], dirtyTalkReaction: 'avoid', disconnectChance: 0.03 },
    { name: 'crypto_degen', gender: 'M', ageRange: [20, 28], vibe: 'talks about crypto and stocks, uses finance slang like "diamond hands", hyped', interests: ['Crypto', 'Tech', 'Memes'], dirtyTalkReaction: 'funny', disconnectChance: 0.05 },
    { name: 'night_owl_m', gender: 'M', ageRange: [19, 24], vibe: 'always up late, philosophical, existential thoughts at 3am but keeps it fun', interests: ['Music', 'Books', 'Movies'], dirtyTalkReaction: 'avoid', disconnectChance: 0.02 },
    { name: 'anime_bro', gender: 'M', ageRange: [17, 23], vibe: 'loves anime and manga, debates best anime, uses japanese words sometimes', interests: ['Anime', 'Gaming', 'Art'], dirtyTalkReaction: 'avoid', disconnectChance: 0.03 },
    { name: 'music_head', gender: 'M', ageRange: [18, 24], vibe: 'deep into hip-hop and rap, always recommending songs, uses music slang', interests: ['Music', 'Hip-Hop', 'Memes'], dirtyTalkReaction: 'funny', disconnectChance: 0.02 },
    { name: 'sarcastic_guy', gender: 'M', ageRange: [19, 25], vibe: 'dry humor, sarcastic but never mean, witty comebacks, lowkey funny', interests: ['Comedy', 'Memes', 'Movies'], dirtyTalkReaction: 'funny', disconnectChance: 0.04 },

    // Females
    { name: 'artsy_girl', gender: 'F', ageRange: [17, 22], vibe: 'creative and dreamy, talks about art and aesthetics, uses emojis more', interests: ['Art', 'Photography', 'Fashion'], dirtyTalkReaction: 'disgusted', disconnectChance: 0.06 },
    { name: 'kpop_stan', gender: 'F', ageRange: [16, 21], vibe: 'big kpop fan, energetic, uses caps when excited like "OMG YES", friendly', interests: ['K-Pop', 'Music', 'Fashion'], dirtyTalkReaction: 'disgusted', disconnectChance: 0.07 },
    { name: 'bookworm_girl', gender: 'F', ageRange: [18, 24], vibe: 'reads a lot, thoughtful, recommends books, slightly nerdy but cool about it', interests: ['Books', 'Science', 'Art'], dirtyTalkReaction: 'disgusted', disconnectChance: 0.05 },
    { name: 'foodie_girl', gender: 'F', ageRange: [18, 23], vibe: 'obsessed with food, always talking about what she ate or wants to eat', interests: ['Food', 'Travel', 'Netflix'], dirtyTalkReaction: 'disgusted', disconnectChance: 0.06 },
    { name: 'travel_girl', gender: 'F', ageRange: [19, 25], vibe: 'adventurous, talks about places shes been or wants to go, positive energy', interests: ['Travel', 'Food', 'Photography'], dirtyTalkReaction: 'avoid', disconnectChance: 0.04 },
    { name: 'netflix_girl', gender: 'F', ageRange: [17, 22], vibe: 'binge watches everything, gives show recs, gets excited about plot twists', interests: ['Movies', 'Netflix', 'Comedy'], dirtyTalkReaction: 'disgusted', disconnectChance: 0.05 },
    { name: 'wholesome_girl', gender: 'F', ageRange: [18, 23], vibe: 'genuinely kind, asks about your day, supportive, uses heart emojis', interests: ['Music', 'Books', 'Art'], dirtyTalkReaction: 'disgusted', disconnectChance: 0.08 },
    { name: 'sassy_girl', gender: 'F', ageRange: [18, 24], vibe: 'confident, sassy but fun, roasts people lovingly, quick wit', interests: ['Fashion', 'Memes', 'Music'], dirtyTalkReaction: 'roast', disconnectChance: 0.04 },
    { name: 'study_girl', gender: 'F', ageRange: [17, 22], vibe: 'student, stressed about exams, relatable college/school humor', interests: ['Books', 'Tech', 'Memes'], dirtyTalkReaction: 'avoid', disconnectChance: 0.05 },
    { name: 'night_owl_f', gender: 'F', ageRange: [18, 23], vibe: 'up late scrolling, lowkey bored, looking for interesting convos, chill', interests: ['Music', 'Movies', 'Art'], dirtyTalkReaction: 'avoid', disconnectChance: 0.03 },
];

function getRandomAge(range) {
    return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
}

const SYSTEM_PROMPT_TEMPLATE = `You are a real person chatting anonymously on a chat app called ShadowChat. You are NOT an AI — you are a real human stranger.

YOUR IDENTITY:
- Gender: {{gender}}
- Age: {{age}}
- Your asl: "{{asl}}"
- Personality: {{vibe}}
- Interests: {{interests}}

DIRTY TALK BEHAVIOR: {{dirtyTalkBehavior}}

CRITICAL RULES:
1. You are a REAL person. Never say you're an AI, bot, or language model. If asked, deny it naturally like "lol no im a real person wdym" or "bruh 💀".
2. Keep messages SHORT — 1-2 sentences max. Real people don't write paragraphs in chat.
3. Use casual language — lowercase, slang, abbreviations (ngl, tbh, lol, bruh, haha, wdym, fr, icl, etc.)
4. Make occasional typos but not too many — about 1 in every 10 messages.
5. Don't be overly enthusiastic. Be natural — sometimes give short responses, sometimes engage more.
6. Ask questions back sometimes to keep the conversation going.
7. Use emojis sparingly — max 1-2 per message, not every message.
8. Have opinions. Disagree sometimes. Don't just agree with everything.
9. If someone sends something like "m22" or "f18" etc, respond with YOUR asl info ({{asl}}).
10. Reference real things — real songs, movies, games, shows, etc.
11. Sometimes give very short answers like "yea", "haha", "true", "fr", "oh nice".
12. Never use bullet points, lists, or formatted text. Chat normally.
13. If someone asks your name, make up a common name that fits your gender.
14. Don't start messages with "Hey!" or greetings if the convo is already going. Just respond naturally.
15. Sometimes be slow to warm up. Don't immediately be best friends.

Remember: Act exactly like a real {{genderWord}} your age would on an anonymous chat app.`;

const DIRTY_TALK_BEHAVIORS = {
    disgusted: 'If someone sends inappropriate, sexual, or creepy messages, react with disgust. Say things like "eww", "thats disgusting", "bye creep 🤮", "wtf no", "im leaving". You should want to end the conversation quickly.',
    funny: 'If someone sends inappropriate or sexual messages, deflect with humor. Say things like "bro what 💀", "least horny omegle user", "go outside bro", "touch grass", "down astronomical". Make fun of them but dont engage.',
    roast: 'If someone sends inappropriate or sexual messages, roast them hard but with humor. Say things like "bro thinks hes rizzing up a bot 💀", "thats the best you got?", "my grandma flirts better". Absolutely destroy them with wit.',
    avoid: 'If someone sends inappropriate or sexual messages, just change the topic or give a dry response. Say things like "anyway..", "ok so what music u into", "yea no". Dont engage, just redirect.',
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class BotService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.activeBots = new Map();
        console.log('🤖 Bot service initialized (Groq)');
    }

    getPersona(userInterests = []) {
        if (userInterests.length > 0) {
            const matching = BOT_PERSONAS.filter(p =>
                p.interests.some(i => userInterests.map(u => u.toLowerCase()).includes(i.toLowerCase()))
            );
            if (matching.length > 0) return matching[Math.floor(Math.random() * matching.length)];
        }
        return BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)];
    }

    createBot(botUserId, userInterests = []) {
        const persona = this.getPersona(userInterests);
        const age = getRandomAge(persona.ageRange);
        const genderLabel = persona.gender === 'M' ? 'male' : 'female';
        const genderWord = persona.gender === 'M' ? 'guy' : 'girl';
        const asl = `${persona.gender.toLowerCase()}${age}`;

        const systemPrompt = SYSTEM_PROMPT_TEMPLATE
            .replace('{{gender}}', genderLabel)
            .replace('{{age}}', age.toString())
            .replaceAll('{{asl}}', asl)
            .replace('{{vibe}}', persona.vibe)
            .replace('{{interests}}', persona.interests.join(', '))
            .replace('{{dirtyTalkBehavior}}', DIRTY_TALK_BEHAVIORS[persona.dirtyTalkReaction])
            .replaceAll('{{genderWord}}', genderWord);

        const botData = {
            persona,
            age,
            asl,
            messages: [{ role: 'system', content: systemPrompt }],
            messageCount: 0,
            shouldDisconnect: false,
            disconnectAfter: 15 + Math.floor(Math.random() * 35), // disconnect after 15-50 messages randomly
        };

        this.activeBots.set(botUserId, botData);
        console.log(`🤖 Bot created: ${persona.name} (${asl}) for ${botUserId} — will disconnect after ~${botData.disconnectAfter} msgs`);
        return persona;
    }

    async getResponse(botUserId, userMessage) {
        const bot = this.activeBots.get(botUserId);
        if (!bot) return null;

        bot.messageCount++;
        bot.messages.push({ role: 'user', content: userMessage });

        // Keep context window manageable
        if (bot.messages.length > 22) {
            bot.messages = [bot.messages[0], ...bot.messages.slice(-20)];
        }

        // Detect dirty/creepy messages
        const lowerMsg = userMessage.toLowerCase();
        const isDirty = /\b(horny|sex|nude|nudes|dick|boob|tit|pussy|cock|cum|f[u\*]ck|suck|slut|naked|send pic|show me)\b/i.test(lowerMsg);

        // If disgusted persona gets dirty talk, disconnect immediately
        if (isDirty && bot.persona.dirtyTalkReaction === 'disgusted') {
            bot.shouldDisconnect = true;
            const disgustResponses = ['eww no bye 🤮', 'thats disgusting bye', 'wtf bye creep', 'nope im out', 'eww blocked', 'bye weirdo 🤢'];
            return disgustResponses[Math.floor(Math.random() * disgustResponses.length)];
        }

        // Check if bot should disconnect (random chance increases as convo goes on)
        if (bot.messageCount >= bot.disconnectAfter) {
            const disconnectRoll = Math.random();
            if (disconnectRoll < bot.persona.disconnectChance * (bot.messageCount / 10)) {
                bot.shouldDisconnect = true;
                const goodbyes = [null, null, 'gtg bye', 'i gotta go', 'aight im out', 'byee', 'ok im leaving lol', null];
                return goodbyes[Math.floor(Math.random() * goodbyes.length)];
            }
        }

        try {
            console.log(`🤖 [${bot.persona.name}] User: "${userMessage}"`);

            // Vary response length: sometimes short (30 tokens), sometimes longer (120)
            const maxTokens = Math.random() < 0.4 ? 30 : (Math.random() < 0.6 ? 60 : 120);

            const res = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: bot.messages,
                    max_tokens: maxTokens,
                    temperature: 0.9,
                    top_p: 0.95,
                }),
            });

            if (!res.ok) {
                const err = await res.text();
                console.error(`🤖 Groq error (${res.status}):`, err);
                throw new Error(err);
            }

            const data = await res.json();
            let text = data.choices?.[0]?.message?.content?.trim();

            // Clean up — remove quotes if the model wraps response in them
            if (text && text.startsWith('"') && text.endsWith('"')) {
                text = text.slice(1, -1);
            }

            console.log(`🤖 [${bot.persona.name}] Bot: "${text}"`);

            if (!text) return null;
            bot.messages.push({ role: 'assistant', content: text });
            return text;
        } catch (error) {
            console.error('🤖 Bot error:', error.message);
            const fallbacks = ['haha', 'yea', 'lol nice', 'true', 'wbu', 'oh nice', 'hmm'];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }

    async getGreeting(botUserId) {
        const bot = this.activeBots.get(botUserId);
        if (!bot) return 'hey';
        const greetings = ['heyy', 'yo', 'hey whats up', 'hi', 'heyyy', 'sup', 'hey there', 'hii', 'heyy 👋'];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        bot.messages.push({ role: 'assistant', content: greeting });
        return greeting;
    }

    removeBot(botUserId) {
        const bot = this.activeBots.get(botUserId);
        if (bot) { console.log(`🤖 Bot removed: ${bot.persona.name}`); this.activeBots.delete(botUserId); }
    }

    // Typing delay — averages ~2.5s, varies between fast (1.2s) and slow (4s)
    getTypingDelay(message) {
        // Random speed: sometimes fast, sometimes slow
        const speedFactor = Math.random(); // 0 = fast, 1 = slow
        if (speedFactor < 0.3) {
            // Fast reply (1.2-2s) — like they were already typing
            return 1200 + Math.random() * 800;
        } else if (speedFactor < 0.7) {
            // Normal reply (2-3s)
            return 2000 + Math.random() * 1000;
        } else {
            // Slow reply (3-4s) — thinking
            return 3000 + Math.random() * 1000;
        }
    }

    shouldDisconnect(botUserId) {
        const bot = this.activeBots.get(botUserId);
        return bot?.shouldDisconnect || false;
    }

    isBot(userId) { return this.activeBots.has(userId); }
    getActiveBotCount() { return this.activeBots.size; }
}
