const pdfParse = require("pdf-parse");
const aiService = require("../services/aiService");

const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      console.error("[Resume] No file in request");
      return res.status(400).json({ message: "No resume file uploaded. Please upload a PDF." });
    }

    const dataBuffer = req.file.buffer;
    
    if (!dataBuffer || dataBuffer.length === 0) {
      console.error("[Resume] Empty file buffer");
      return res.status(400).json({ message: "The uploaded file is empty." });
    }

    console.log("[Resume] Processing file:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    let data;
    try {
      data = await pdfParse(dataBuffer);
      
      if (!data || !data.text) {
        throw new Error("PDF parsing returned no text");
      }
      
      console.log("[Resume] PDF parsed successfully, text length:", data.text.length);
    } catch (parseError) {
      console.error("[Resume] PDF Parsing Error:", parseError.message);
      return res.status(400).json({ 
        message: "Failed to parse PDF. Please ensure it is a valid PDF document.",
        details: parseError.message 
      });
    }

    const resumeText = data.text.trim();
    if (resumeText.length < 50) {
      console.warn("[Resume] Extracted text too short:", resumeText.length);
      return res.status(400).json({ message: "Resume appears to be empty or not readable (scanned images are not supported yet)." });
    }

    console.log("[Resume] Sending to AI for analysis...");
    const analysis = await aiService.analyzeResume(resumeText);

    res.json({
      ...analysis,
      resumeText,
    });
  } catch (error) {
    console.error("[Resume] Global Analysis error:", error);
    res.status(500).json({ message: "An error occurred while analyzing the resume." });
  }
};

module.exports = {
  analyzeResume,
};
