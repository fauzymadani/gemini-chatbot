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

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents
        });

        // return response.text when available, otherwise return full response
        res.status(200).json({result: response?.text ?? response});
    } catch (e) {
        console.error('Error in /api/chat:', e);
        res.status(500).json({error: e?.message ?? 'Internal Server Error'});
    }
});
