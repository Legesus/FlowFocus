import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';

interface Subtask {
  description: string;
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
}

interface ParsedResult {
  title: string;
  deadline: string | null;
  description: string;
  subtasks: Subtask[];
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      filter: (part) => {
        return part.mimetype === 'application/pdf';
      }
    });

    const [fields, files] = await form.parse(req);
    const file = files.pdf?.[0];
    const apiKey = fields.apiKey?.[0];
    const model = fields.model?.[0];

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    if (!model) {
      return res.status(400).json({ error: "Model selection is required" });
    }

    if (!file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    if (file.size === 0) {
      await fs.unlink(file.filepath);
      return res.status(400).json({ error: "Empty file uploaded" });
    }

    let fileData: Buffer;
    try {
      fileData = await fs.readFile(file.filepath);
    } catch (error) {
      return res.status(500).json({ error: "Failed to read uploaded file" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const aiModel = genAI.getGenerativeModel({ model });

    const prompt = `Analyze this PDF and extract the following information:
1. Task title/name
2. Deadline (if any, in YYYY-MM-DD format)
3. Description
4. Key subtasks (2-4 items)

The response MUST be in this exact JSON format:
{
  "title": "Task title",
  "deadline": "YYYY-MM-DD" or null,
  "description": "Task description",
  "subtasks": [
    {
      "description": "Subtask description",
      "estimatedTime": estimated_minutes,
      "priority": "high|medium|low"
    }
  ]
}`;

    const result = await aiModel.generateContent([
      prompt,
      {
        inlineData: {
          data: fileData.toString('base64'),
          mimeType: 'application/pdf'
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract and validate JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    let parsedResult: ParsedResult;
    try {
      const rawResult = JSON.parse(jsonMatch[0]);
      
      // Validate the structure of the parsed result
      if (!rawResult.title || typeof rawResult.title !== 'string') {
        throw new Error('Invalid or missing title in AI response');
      }
      
      if (rawResult.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(rawResult.deadline)) {
        rawResult.deadline = null;
      }
      
      if (!Array.isArray(rawResult.subtasks)) {
        rawResult.subtasks = [];
      }
      
      // Validate and clean up each subtask
      const validatedSubtasks = rawResult.subtasks
        .filter((subtask: unknown): subtask is Subtask => {
          if (!subtask || typeof subtask !== 'object') return false;
          const s = subtask as any;
          return (
            typeof s.description === 'string' &&
            typeof s.estimatedTime === 'number' &&
            ['high', 'medium', 'low'].includes(s.priority)
          );
        })
        .map((subtask: Subtask) => ({
          ...subtask,
          estimatedTime: Math.max(1, Math.round(subtask.estimatedTime))
        }));

      parsedResult = {
        title: rawResult.title,
        deadline: rawResult.deadline,
        description: typeof rawResult.description === 'string' ? rawResult.description : '',
        subtasks: validatedSubtasks
      };

    } catch (error) {
      throw new Error('Failed to parse AI response');
    }
    
    // Clean up the temporary file
    await fs.unlink(file.filepath);
    
    return res.status(200).json(parsedResult);

  } catch (error) {
    // Clean up any temporary files in case of error
    if (req.body?.filepath) {
      try {
        await fs.unlink(req.body.filepath);
      } catch (unlinkError) {
        console.error('Failed to clean up temporary file:', unlinkError);
      }
    }

    console.error("Error parsing PDF:", error);
    return res.status(500).json({ 
      error: "Failed to parse PDF", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}