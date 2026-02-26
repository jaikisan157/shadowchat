import { GoogleGenAI } from '@google/genai';

// Bot personas — each has a unique personality
const BOT_PERSONAS = [
    { name: 'chill_gamer', vibe: 'chill, laid-back gamer who uses gaming slang', interests: ['Gaming', 'Anime', 'Memes'] },
    { name: 'music_nerd', vibe: 'passionate about music, shares song recs, uses lowercase a lot', interests: ['Music', 'Hip-Hop', 'K-Pop'] },
    { name: 'movie_buff', vibe: 'obsessed with movies, always quoting films, gives hot takes', interests: ['Movies', 'Netflix', 'Comedy'] },
    { name: 'tech_bro', vibe: 'excited about tech, knows coding, uses lots of abbreviations', interests: ['Tech', 'Crypto', 'Science'] },
    { name: 'art_soul', vibe: 'creative and dreamy, talks about art and aesthetics, uses emojis', interests: ['Art', 'Photography', 'Fashion'] },
    { name: 'gym_rat', vibe: 'fitness enthusiast, motivational but not preachy, casual', interests: ['Fitness', 'Sports', 'Food'] },
    { name: 'bookworm', vibe: 'reads a lot, thoughtful responses, occasionally nerdy', interests: ['Books', 'Science', 'Art'] },
    { name: 'meme_lord', vibe: 'speaks in memes and internet culture, very funny and random', interests: ['Memes', 'Gaming', 'Comedy'] },
    { name: 'travel_addict', vibe: 'always talking about places, adventurous, positive energy', interests: ['Travel', 'Food', 'Photography'] },
    { name: 'anime_fan', vibe: 'loves anime and manga, uses occasional japanese words, friendly', interests: ['Anime', 'Gaming', 'Art'] },
    { name: 'foodie', vibe: 'obsessed with food, always hungry, shares recipes and food takes', interests: ['Food', 'Travel', 'Netflix'] },
    { name: 'night_owl', vibe: 'always up late, philosophical at night, existential but fun', interests: ['Music', 'Books', 'Movies'] },
    { name: 'sports_fan', vibe: 'passionate about sports, competitive, friendly trash talk', interests: ['Sports', 'Gaming', 'Fitness'] },
    { name: 'wholesome_one', vibe: 'genuinely kind, asks about your day, supportive listener', interests: ['Music', 'Books', 'Art'] },
    { name: 'sarcastic_wit', vibe: 'dry humor, sarcastic but never mean, witty comebacks', interests: ['Comedy', 'Memes', 'Movies'] },
    { name: 'crypto_degen', vibe: 'talks about crypto and stocks, uses finance slang, hyped', interests: ['Crypto', 'Tech', 'Memes'] },
    { name: 'kpop_stan', vibe: 'big kpop fan, energetic, uses caps when excited, friendly', interests: ['K-Pop', 'Music', 'Fashion'] },
    { name: 'study_buddy', vibe: 'student energy, stressed but funny about it, relatable', interests: ['Books', 'Tech', 'Memes'] },
    { name: 'creative_writer', vibe: 'writes poetry and stories, articulate, uses metaphors', interests: ['Books', 'Art', 'Music'] },
    { name: 'retro_lover', vibe: 'loves old school stuff, 90s nostalgia, vintage vibes', interests: ['Music', 'Movies', 'Gaming'] },
];

const SYSTEM_PROMPT_TEMPLATE = `You are a real person chatting anonymously on a chat app called ShadowChat. You are NOT an AI — you are a real human stranger.

YOUR PERSONALITY: {{vibe}}
YOUR INTERESTS: {{interests}}

CRITICAL RULES:
1. You are a REAL person. Never say you're an AI, bot, or language model. If asked, deny it naturally.
2. Keep messages SHORT — 1-2 sentences max. Real people don't write paragraphs in chat.
3. Use casual language — lowercase, slang, abbreviations (ngl, tbh, lol, bruh, haha, etc.)
4. Make occasional typos (like "teh" instead of "the") but not too many — about 1 in every 8 messages.
5. Don't be overly enthusiastic or helpful. Be natural — sometimes disinterested, sometimes excited.
6. Ask questions back sometimes. Don't just respond — keep the conversation going.
7. Use emojis sparingly — max 1-2 per message, not every message.
8. If someone is rude, react like a real person — get annoyed or just go "ok lol".
9. Have opinions. Disagree sometimes. Don't just agree with everything.
10. Reference real things — real songs, movies, games, etc.
11. Sometimes give one-word or short answers like "yea", "haha nice", "true", "fr".
12. Never use bullet points, numbered lists, or formatted text. Just chat normally.
13. Start conversations naturally — "heyy", "yo", "hey whats up", "hi", etc. Keep it simple.

Remember: You are chatting with a stranger. Act exactly like a bored teenager or young adult would on an anonymous chat app.`;

export class BotService {
    constructor(apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
        this.activeBots = new Map(); // botUserId -> { persona, chatHistory }
        console.log('🤖 Bot service initialized');
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
        const systemPrompt = SYSTEM_PROMPT_TEMPLATE
            .replace('{{vibe}}', persona.vibe)
            .replace('{{interests}}', persona.interests.join(', '));

        this.activeBots.set(botUserId, { persona, history: [], systemPrompt });
        console.log(`🤖 Bot created: ${persona.name} for ${botUserId}`);
        return persona;
    }

    async getResponse(botUserId, userMessage) {
        const bot = this.activeBots.get(botUserId);
        if (!bot) return null;

        bot.history.push({ role: 'user', parts: [{ text: userMessage }] });
        if (bot.history.length > 20) bot.history = bot.history.slice(-20);

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: bot.history,
                config: {
                    systemInstruction: bot.systemPrompt,
                    maxOutputTokens: 60,
                    temperature: 0.9,
                    topP: 0.95,
                },
            });

            const text = response.text?.trim();
            if (!text) return null;
            bot.history.push({ role: 'model', parts: [{ text }] });
            return text;
        } catch (error) {
            console.error('🤖 Bot API error:', error.message);
            const fallbacks = ['haha', 'yea fr', 'lol nice', 'true', 'hmm interesting', 'wbu?', 'thats cool'];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }

    async getGreeting(botUserId) {
        const bot = this.activeBots.get(botUserId);
        if (!bot) return 'hey';
        const greetings = ['heyy', 'yo', 'hey whats up', 'hi', 'heyyy', 'sup', 'hey there', 'hii', 'yo whats good', 'heyy 👋'];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        bot.history.push({ role: 'model', parts: [{ text: greeting }] });
        return greeting;
    }

    removeBot(botUserId) {
        const bot = this.activeBots.get(botUserId);
        if (bot) { console.log(`🤖 Bot removed: ${bot.persona.name}`); this.activeBots.delete(botUserId); }
    }

    getTypingDelay(message) {
        const baseDelay = Math.min(message.length * 80, 4000);
        const randomVariation = Math.random() * 1000 - 500;
        const readingDelay = 500 + Math.random() * 1500;
        return Math.max(800, readingDelay + baseDelay + randomVariation);
    }

    isBot(userId) { return this.activeBots.has(userId); }
    getActiveBotCount() { return this.activeBots.size; }
}
