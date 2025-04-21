import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDistPath = path.join(__dirname, "../../frontend/app/dist");

router.use(express.static(frontendDistPath));

router.get("/", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

export default router;
