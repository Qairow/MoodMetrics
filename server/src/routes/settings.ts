import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Settings {
  anonymityThreshold: number;
  remindersEnabled: boolean;
}

let settings: Settings = {
  anonymityThreshold: 7,
  remindersEnabled: true,
};

router.get('/', authenticate, (req, res) => {
  res.json(settings);
});

router.put('/', authenticate, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { anonymityThreshold, remindersEnabled } = req.body;

    if (anonymityThreshold !== undefined) {
      settings.anonymityThreshold = Number(anonymityThreshold);
    }
    if (remindersEnabled !== undefined) {
      settings.remindersEnabled = Boolean(remindersEnabled);
    }

    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
