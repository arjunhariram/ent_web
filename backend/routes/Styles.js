import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stylesPath = path.join(__dirname, "../../frontend/app/src/styles/");

// Define allowed file extensions
const allowedExtensions = ['.css', '.scss', '.less', '.sass', '.styl'];

router.get('/:filename', (req, res) => {
  let { filename } = req.params;
  
  // Validate filename to prevent path traversal
  if (!filename || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // Get just the basename and prevent directory traversal
  filename = path.basename(filename);
  
  // Check if file extension is allowed
  const extension = path.extname(filename).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  
  const filePath = path.join(stylesPath, filename);
  
  // Ensure the resolved path is within the styles directory
  if (!filePath.startsWith(stylesPath)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if file exists before sending
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // File exists and is safe to serve
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error serving file: ${filePath}`, err);
        res.status(500).json({ error: 'Error serving file' });
      }
    });
  });
});

export default router;
