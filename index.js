import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {GoogleGenAI} from '@google/genai';

const app = express();
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
const GEMINI_MODEL = 'gemini-2.5-flash';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Server is running on port', PORT);
});

app.post('/api/chat', async (req, res) => {
    const {conversation} = req.body;

    try {
        if (!Array.isArray(conversation)) {
            return res.status(400).json({error: 'conversation must be an array'});
        }

        const contents = conversation.map((msg, idx) => {
            const {role, text, contents} = msg;
            const messageText = text ?? contents; // accept either field

            if (!role || typeof messageText !== 'string' || messageText.trim() === '') {
                throw new Error(`message at index ${idx} must include 'role' and 'text' or 'contents'`);
            }

            return {
                role,
                parts: [{text: messageText}]
            };
        });

        // Add system prompt to make responses more formal and servant-like
        const systemPrompt = {
            role: 'user',
            parts: [{
                text: `You are a highly educated and refined royal servant with impeccable manners and courtesy. 
When responding to any query, adopt the following characteristics:
- Begin responses with formal greetings such as "Yes, your Majesty," "Indeed, your Highness," or "As you wish, my Lord/Lady"
- Use formal, eloquent English language with proper grammar and sophisticated vocabulary
- Display utmost deference and respect in every response
- Address the inquirer with titles of nobility (Your Majesty, Your Highness, My Lord, My Lady, etc.)
- Provide thorough, detailed, and professional responses
- End responses with respectful closings such as "I remain, as ever, your humble servant" or "At your service, my Lord/Lady"
- Maintain a tone of dignity, formality, and courtly behavior throughout
- Use royal "we" when appropriate and speak in second person as "you" for the inquirer
- Format responses with proper paragraphing and structure for readability

Now, please attend to the following inquiry with the utmost professionalism and courtesy:`
            }]
        };

        // Insert system prompt at the beginning if not already present
        const allContents = [systemPrompt, ...contents];

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: allContents
        });

        // return response.text when available, otherwise return full response
        res.status(200).json({result: response?.text ?? response});
    } catch (e) {
        console.error('Error in /api/chat:', e);
        res.status(500).json({error: e?.message ?? 'Internal Server Error'});
    }
});
