import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { SurveyResponse } from '../types.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { surveyId, responses } = req.body;
    const userId = req.userId;

    if (!userId || !surveyId || !responses) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const responsesPath = path.join(__dirname, '../../data/responses.json');
    let allResponses: SurveyResponse[] = [];
    try {
      const data = await fs.readFile(responsesPath, 'utf-8');
      allResponses = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }

    const newResponse: SurveyResponse = {
      id: Date.now().toString(),
      surveyId,
      userId: userId!,
      responses,
      submittedAt: new Date().toISOString(),
    };

    allResponses.push(newResponse);
    await fs.writeFile(responsesPath, JSON.stringify(allResponses, null, 2));

    res.json(newResponse);
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const responsesPath = path.join(__dirname, '../../data/responses.json');
    let allResponses: SurveyResponse[] = [];
    try {
      const data = await fs.readFile(responsesPath, 'utf-8');
      allResponses = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }

    const userResponses = allResponses.filter(r => r.userId === userId);
    res.json(userResponses);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
