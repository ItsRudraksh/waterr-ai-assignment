const { GoogleGenAI } = require('@google/genai');

// Initialize API client with provided credentials
const genAI = new GoogleGenAI({ apiKey: "AIzaSyAp6P4kS90No_57oiWsgOdJrpU-Da" });

/**
 * Parse meeting transcript using Gemini to extract structured data
 * @param {string} transcript - Raw meeting transcript
 * @returns {Object} Parsed data with participants, roles, and action items
 */
async function parseTranscript(transcript) {
  try {
    console.log('🤖 Sending transcript to Gemini for parsing...');

    const model = "gemini-2.5-flash";

    const prompt = `You are a helpful assistant that analyzes meeting transcripts and extracts structured data.
    Extract the following information from meeting transcripts:
    1. Participants: Name and role (if mentioned in parentheses)
    2. Action Items: Tasks with assignee, description, and due date (if mentioned)

    Return the data in this exact JSON format:
    {
      "participants": [
        {
          "name": "Full Name",
          "role": "Job Title or Role",
          "mentions": 1
        }
      ],
      "actionItems": [
        {
          "assignee": "Person Name",
          "task": "Description of the task",
          "dueDate": "Due date if mentioned, or null",
          "priority": "high|medium|low"
        }
      ],
      "summary": "Brief summary of the meeting",
      "keyTopics": ["topic1", "topic2", "topic3"]
    }

    Rules:
    - Extract names and roles from format "Name (Role):"
    - Look for action items with keywords like "Action:", "I'll", "I will", "by [date]"
    - If no due date is mentioned, set dueDate to null
    - Priority is based on urgency keywords or context
    - Return valid JSON only, no additional text

    Please analyze this meeting transcript and extract the structured data:
    ${transcript}`;

    const result = await genAI.models.generateContent({
      model: model,
      config: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
        responseMimeType: "application/json",
      },
      contents: [{
        role: "user",
        parts: [{
          text: prompt,
        }]
      }]
    })
    const responseText = result.text;
    console.log('🤖 Raw Gemini response:', responseText);

    // Clean and parse JSON response
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const parsedData = JSON.parse(cleanedResponse);

    // Validate and enhance the parsed data
    const validatedData = validateAndEnhanceData(parsedData, transcript);

    console.log('✅ Successfully parsed transcript');
    console.log(`📊 Found ${validatedData.participants.length} participants, ${validatedData.actionItems.length} action items`);

    return validatedData;

  } catch (error) {
    console.error('❌ Error calling Gemini API:', error);
    console.log('🔄 Falling back to regex-based parsing...');
    return fallbackRegexParsing(transcript);
  }
}

/**
 * Validate and enhance data from the AI model
 */
function validateAndEnhanceData(data, transcript) {
  const enhanced = {
    participants: [],
    actionItems: [],
    summary: data.summary || 'Meeting summary not available',
    keyTopics: data.keyTopics || [],
    extractedAt: new Date().toISOString()
  };

  if (data.participants && Array.isArray(data.participants)) {
    enhanced.participants = data.participants.map(p => ({
      name: p.name || 'Unknown',
      role: p.role || 'Not specified',
      mentions: p.mentions || 1
    }));
  }

  if (data.actionItems && Array.isArray(data.actionItems)) {
    enhanced.actionItems = data.actionItems.map(item => ({
      assignee: item.assignee || 'Unassigned',
      task: item.task || 'Task description not available',
      dueDate: item.dueDate || null,
      priority: item.priority || 'medium',
      status: 'pending'
    }));
  }

  if (enhanced.participants.length === 0) {
    enhanced.participants = extractParticipantsRegex(transcript);
  }

  if (enhanced.actionItems.length === 0) {
    enhanced.actionItems = extractActionItemsRegex(transcript);
  }

  return enhanced;
}

/**
 * Fallback regex-based parsing when the API fails
 */
function fallbackRegexParsing(transcript) {
  console.log('🔧 Using fallback regex parsing...');
  return {
    participants: extractParticipantsRegex(transcript),
    actionItems: extractActionItemsRegex(transcript),
    summary: 'Generated using fallback parsing',
    keyTopics: extractKeyTopicsRegex(transcript),
    extractedAt: new Date().toISOString(),
    parseMethod: 'regex-fallback'
  };
}

/**
 * Extract participants using regex patterns
 */
function extractParticipantsRegex(transcript) {
  const participants = [];
  const lines = transcript.split('\n');
  for (const line of lines) {
    const match = line.match(/^([A-Za-z\s]+)\(([^)]+)\):/);
    if (match) {
      const name = match[1].trim();
      const role = match[2].trim();
      const existing = participants.find(p => p.name === name);
      if (existing) {
        existing.mentions++;
      } else {
        participants.push({ name, role, mentions: 1 });
      }
    }
  }
  return participants;
}

/**
 * Extract action items using regex patterns
 */
function extractActionItemsRegex(transcript) {
  const actionItems = [];
  const lines = transcript.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('action:') || line.toLowerCase().includes("i'll") || line.toLowerCase().includes("i will")) {
      const assigneeMatch = line.match(/^([A-Za-z\s]+)\(/);
      const assignee = assigneeMatch ? assigneeMatch[1].trim() : 'Unknown';
      let task = line;
      if (line.toLowerCase().includes('action:')) {
        task = line.split(/action:/i)[1].trim();
      }
      const dueDateMatch = task.match(/by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|eod|end of day|\w+day)/i);
      const dueDate = dueDateMatch ? dueDateMatch[1] : null;
      task = task.replace(/by\s+\w+/i, '').trim();
      actionItems.push({ assignee, task, dueDate, priority: 'medium', status: 'pending' });
    }
  }
  return actionItems;
}

/**
 * Extract key topics using simple keyword analysis
 */
function extractKeyTopicsRegex(transcript) {
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'you', 'we', 'they', 'it', 'is', 'are', 'was', 'were', 'will', 'would', 'could', 'should'];
  const words = transcript.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(word => word.length > 3 && !commonWords.includes(word));
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  return Object.entries(wordCount).sort(([, a], [, b]) => b - a).slice(0, 5).map(([word]) => word);
}

module.exports = {
  parseTranscript,
  fallbackRegexParsing
};