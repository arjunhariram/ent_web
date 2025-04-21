import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const teamLogosPath = path.join(__dirname, "../../frontend/app/src/assets/Teamlogos");

router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(teamLogosPath, filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Error serving file: ${filePath}`, err);
      res.status(500).json({ error: 'Error serving file' });
    }
  });
});

export default router;
