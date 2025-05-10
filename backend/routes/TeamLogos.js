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
  
  // Sanitize filename: prevent path traversal by removing directory components
  // and only allow valid filename characters
  const sanitizedFilename = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '');
  
  if (!sanitizedFilename || sanitizedFilename !== filename) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  const filePath = path.join(teamLogosPath, sanitizedFilename);
  
  // Ensure the final path is within the allowed directory
  if (!filePath.startsWith(teamLogosPath)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Error serving file: ${filePath}`, err);
      res.status(500).json({ error: 'Error serving file' });
    }
  });
});

export default router;
