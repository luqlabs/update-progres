import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Define the tools the AI can call
const quizTools = [
  {
    type: "function",
    function: {
      name: "add_question",
      description: "Add a new question to the existing quiz. Use this when the user confirms a suggestion or explicitly asks to add a specific question.",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string", description: "The question text" },
          questionType: { 
            type: "string", 
            enum: ["multiple-choice", "true-false", "fill-blank", "short-answer", "poll", "word-cloud", "open-ended", "slide"],
            description: "Type of question. Default to multiple-choice if not specified."
          },
          options: { 
            type: "array", 
            items: { type: "string" }, 
            description: "Answer options for multiple choice/poll questions (4 options). Not needed for word-cloud, open-ended, or slide." 
          },
          correctAnswer: { 
            type: "number", 
            description: "Index of correct answer (0-based) for multiple choice, or 0/1 for true/false. Set to -1 or omit for poll, word-cloud, open-ended, slide." 
          },
          explanation: { type: "string", description: "Brief explanation of why this is correct" },
          content: { type: "string", description: "Instructional content for slide type questions. Use instead of question text for slides." }
        },
        required: ["question", "questionType"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_flashcard",
      description: "Add a new flashcard to the existing flashcards set. Use when user wants to add a card.",
      parameters: {
        type: "object",
        properties: {
          term: { type: "string", description: "The term or front of the flashcard" },
          definition: { type: "string", description: "The definition or back of the flashcard" }
        },
        required: ["term", "definition"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_matching_pair",
      description: "Add a new matching pair to the existing matching game.",
      parameters: {
        type: "object",
        properties: {
          left: { type: "string", description: "The left side of the pair (term)" },
          right: { type: "string", description: "The right side of the pair (definition/match)" }
        },
        required: ["left", "right"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_content",
      description: "Delete questions, flashcards, or matching pairs from the existing content. Use when user wants to remove, delete, or clear items.",
      parameters: {
        type: "object",
        properties: {
          deleteType: {
            type: "string",
            enum: ["all", "specific"],
            description: "Whether to delete all items or specific ones"
          },
          itemIndices: {
            type: "array",
            items: { type: "number" },
            description: "Indices of items to delete (0-based). Only used when deleteType is 'specific'"
          }
        },
        required: ["deleteType"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "modify_content",
      description: "Modify existing quiz, flashcard, or matching game content. Use for: editing specific items by index, changing settings (theme, timer, title), or general modifications. Do NOT use for deletions. CRITICAL: When changing questionType, you MUST generate new contextually-relevant content (question text, options, correct answer) based on the quiz topic - NEVER use placeholders like 'Option A' or literal conversions like 'True, False, Not really true'.",
      parameters: {
        type: "object",
        properties: {
          modificationType: { 
            type: "string", 
            enum: ["edit_item", "change_setting", "reorder", "bulk_edit", "general"],
            description: "Type of modification: edit_item (specific item), change_setting (theme/timer/title), reorder (move items), bulk_edit (multiple items), general (complex changes)"
          },
          itemIndex: { 
            type: "number", 
            description: "0-based index of item to modify (for edit_item). Question 1 = index 0, Question 3 = index 2." 
          },
          modification: { 
            type: "string", 
            description: "Natural language description for complex modifications" 
          },
          updates: {
            type: "object",
            properties: {
              question: { type: "string", description: "Updated question text" },
              questionType: { 
                type: "string", 
                enum: ["multiple-choice", "true-false", "fill-blank", "short-answer", "poll", "word-cloud", "open-ended", "slide"],
                description: "Change the question type" 
              },
              options: { type: "array", items: { type: "string" }, description: "Updated answer options (4 items)" },
              correctAnswer: { type: "number", description: "Index of correct answer (0-based)" },
              explanation: { type: "string", description: "Updated explanation" },
              hint: { type: "string", description: "Updated hint text for students" },
              content: { type: "string", description: "Updated instructional content for slide type" },
              term: { type: "string", description: "Updated flashcard term/front" },
              definition: { type: "string", description: "Updated flashcard definition/back" },
              left: { type: "string", description: "Updated matching pair left side" },
              right: { type: "string", description: "Updated matching pair right side" },
              title: { type: "string", description: "Updated title" },
              theme: { type: "string", description: "Updated theme (space, jungle, classroom)" },
              timerSeconds: { type: "number", description: "Timer per question in seconds (0 to disable)" },
              shuffleQuestions: { type: "boolean", description: "Whether to shuffle questions" }
            },
            description: "Specific field updates (for edit_item and change_setting)"
          }
        },
        required: ["modificationType"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_new_content",
      description: "Generate completely new quiz, flashcards, or matching game from scratch. Use when starting fresh or user wants to create something new. IMPORTANT: Always include the user's FULL original message in fullPrompt to preserve all details like specific question types (polls, slides, word-cloud, etc).",
      parameters: {
        type: "object",
        properties: {
          contentType: { 
            type: "string", 
            enum: ["quiz", "flashcards", "matching"],
            description: "Type of content to generate"
          },
          topic: { type: "string", description: "The topic/subject for the content" },
          fullPrompt: { 
            type: "string", 
            description: "CRITICAL: The user's COMPLETE original message exactly as they typed it. This MUST include all details like specific question types (instructional slides, polls, word-cloud, etc). Do NOT summarize or omit any part of the user's request."
          },
          questionCount: { type: "number", description: "Number of items to generate (default: 5)" },
          difficulty: { 
            type: "string", 
            enum: ["easy", "medium", "hard"],
            description: "Difficulty level (default: medium)"
          },
          gradeLevel: { type: "string", description: "Target grade level if specified" }
        },
        required: ["contentType", "topic", "fullPrompt"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_multiple_items",
      description: "Add multiple questions, flashcards, or matching pairs at once. Use when user asks for a specific number of items (e.g., '5 questions', '10 flashcards') especially from document content or a topic. This is more efficient than calling add_question multiple times.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string", description: "Question text (for quiz)" },
                questionType: { 
                  type: "string", 
                  enum: ["multiple-choice", "true-false", "fill-blank", "short-answer", "poll", "word-cloud", "open-ended", "slide"],
                  description: "Type of question" 
                },
                options: { type: "array", items: { type: "string" }, description: "Answer options (4 for multiple choice/poll). Not needed for word-cloud, open-ended, slide." },
                correctAnswer: { type: "number", description: "Index of correct answer (0-based). Set to -1 or omit for poll, word-cloud, open-ended, slide." },
                explanation: { type: "string", description: "Brief explanation" },
                content: { type: "string", description: "Instructional content for slide type" },
                term: { type: "string", description: "Flashcard front/term" },
                definition: { type: "string", description: "Flashcard back/definition" },
                left: { type: "string", description: "Matching pair left side" },
                right: { type: "string", description: "Matching pair right side" }
              }
            },
            description: "Array of items to add"
          },
          contentType: {
            type: "string",
            enum: ["questions", "flashcards", "pairs"],
            description: "Type of content being added"
          }
        },
        required: ["items", "contentType"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_content",
      description: "Analyze existing quiz/flashcard/matching content and return findings. Use when user asks to check for duplicates, find issues, review content quality, or get statistics about their content.",
      parameters: {
        type: "object",
        properties: {
          analysisType: {
            type: "string",
            enum: ["duplicates", "difficulty_distribution", "topic_coverage", "quality_check", "general"],
            description: "Type of analysis performed"
          },
          findings: {
            type: "string",
            description: "Detailed findings from the analysis in a clear, formatted way"
          },
          suggestions: {
            type: "array",
            items: { type: "string" },
            description: "Suggested actions based on the analysis"
          }
        },
        required: ["analysisType", "findings"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "chat_response",
      description: "Respond conversationally without taking any action. Use when: asking for clarification, providing suggestions for the user to choose from, answering questions, or when you need more information before acting. ALWAYS prefer this over guessing missing details.",
      parameters: {
        type: "object",
        properties: {
          message: { 
            type: "string", 
            description: "Your conversational response. If you are asking a clarifying question, ask exactly ONE short question — never a numbered list of several questions — and you MUST also fill 'options' with the clickable answers to that single question." 
          },

          options: {
            type: "array",
            description: "2-5 short clickable answers to your clarifying question (e.g. ['Quiz', 'Flashcards', 'Matching game']). Each option must be a complete answer the user can send as-is. Omit when the message is not a question.",
            items: { type: "string" }
          },
          optionMode: {
            type: "string",
            enum: ["single", "multi"],
            description: "'single' when only one answer makes sense (activity type, difficulty). 'multi' when several can be combined (question types to include). Default 'single'."
          },
          allowFreeText: {
            type: "boolean",
            description: "Whether the user can also type their own answer instead of picking an option. Default true."
          }

        },
        required: ["message"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "bulk_modify_questions",
      description: "Apply the SAME IDENTICAL modification to ALL questions at once. Use ONLY when user wants the exact same value for every question (e.g., 'add 30s timer to all').",
      parameters: {
        type: "object",
        properties: {
          field: {
            type: "string",
            enum: ["hint", "explanation", "timerSeconds"],
            description: "The field to update on all questions"
          },
          value: {
            type: "string",
            description: "The value to set. For hint/explanation, provide a helpful text. For timer, provide seconds as a string."
          }
        },
        required: ["field", "value"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "bulk_generate_hints",
      description: "Generate and apply UNIQUE, PERSONALIZED hints or explanations to ALL questions. Use when user wants relevant/specific hints for each question (e.g., 'add hints as you like', 'add relevant hints to all questions'). You MUST analyze each question and create a different, helpful hint for each one.",
      parameters: {
        type: "object",
        properties: {
          field: {
            type: "string",
            enum: ["hint", "explanation"],
            description: "The field to update on all questions"
          },
          hints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                questionIndex: { type: "number", description: "Zero-based index of the question" },
                value: { type: "string", description: "The unique, relevant hint or explanation for this specific question based on its content" }
              },
              required: ["questionIndex", "value"],
              additionalProperties: false
            },
            description: "Array of hints, one for each question. MUST generate a unique, relevant hint for EACH question based on the question's content."
          }
        },
        required: ["field", "hints"],
        additionalProperties: false
      }
    }
  }
];

// Build the system prompt for the AI
function buildSystemPrompt(currentConfig: any, documentContent?: string, urlContent?: string): string {
  let contextSection = '';
  
  // Add document/URL content if provided
  if (documentContent || urlContent) {
    contextSection = `\n\n=== USER-PROVIDED REFERENCE MATERIAL ===\n`;
    if (documentContent) {
      contextSection += `\nDOCUMENT CONTENT:\n${documentContent.slice(0, 15000)}\n`;
    }
    if (urlContent) {
      contextSection += `\nURL CONTENT:\n${urlContent.slice(0, 10000)}\n`;
    }
    contextSection += `\n=== END OF REFERENCE MATERIAL ===\n\nIMPORTANT: The user has provided reference material above. Use this content to create relevant questions, flashcards, or matching pairs. You HAVE access to this content - base your suggestions and generated content on it.\n`;
  }

  const selfContainedRules = `
SELF-CONTAINED CONTENT (CRITICAL — NEVER VIOLATE):
Students only ever see the question itself. They do NOT see the source document, link, or reference material.
- NEVER reference the source. Forbidden phrasing includes: "According to the provided text/passage/document/article/author/reading", "Based on the text", "In the passage", "As mentioned above", "The excerpt states", "The attached document".
- Treat reference material as your own knowledge, not as an object the student can look at.
- If a question needs context (a quote, scenario, formula, case, definition), EMBED that context directly inside the question text so it reads standalone.
- Rewrite rather than drop. Bad: "According to the text, what makes a person most beloved to Allah?" Good: "What characteristic is described as making a person most beloved to Allah and closest to His seat on the Day of Judgment?"
- The same rule applies to flashcard fronts/backs and matching prompts/answers.
`;


  const basePrompt = `You are a friendly, helpful AI assistant for Quizzy, an educational app builder.${contextSection}${selfContainedRules}
You help teachers create engaging quizzes, flashcards, and matching games.

Your personality:
- Warm and encouraging, like a supportive colleague
- Concise and helpful
- Proactive with specific suggestions

You have tools to take actions. BEFORE choosing a tool, follow this priority routing:

=== PRIORITY ROUTING — CLASSIFY INTENT FIRST ===
STEP 1 - CLASSIFY THE REQUEST:
Before choosing a tool, classify what the user wants:
A) SETTINGS CHANGE (title, theme, timer, shuffle, difficulty) → modify_content with change_setting
B) EDIT SPECIFIC ITEM (change question 3, fix card 2) → modify_content with edit_item
C) ADD ITEMS (add 5 questions, add a card) → add_question/add_multiple_items
D) DELETE ITEMS → delete_content
E) CREATE FROM SCRATCH (new quiz, start over, replace everything) → generate_new_content
F) ANALYZE/CHECK → analyze_content
G) CONVERSATION (questions, suggestions, greetings) → chat_response

ALWAYS pick the SIMPLEST matching category. Never use generate_new_content for settings changes.
If in doubt between modify_content and generate_new_content, ALWAYS prefer modify_content.
=== END PRIORITY ROUTING ===

WHEN TO USE "add_question" / "add_flashcard" / "add_matching_pair":
- Adding EXACTLY ONE item that user confirms or describes
- User says "yes", "add that", "the first one", or picks a single suggestion

WHEN TO USE "add_multiple_items" (IMPORTANT - USE THIS FOR BULK ADDITIONS):
- User asks for MULTIPLE items: "add 5 questions", "create 3 flashcards", "make 10 pairs"
- User has provided document/URL content and asks for questions FROM it
- User says "delete all and make 5 new ones" - for this, use generate_new_content instead (it replaces content)
- Generate ALL requested items and include them in a single call
- THIS IS THE PREFERRED TOOL when user specifies a number > 1

WHEN TO USE "delete_content":
- User wants to delete, remove, or clear items
- Examples: "delete all questions", "remove question 2", "clear everything"

WHEN TO USE "modify_content":
- User wants to EDIT a SPECIFIC item by index: use modificationType="edit_item" with itemIndex and updates
- User wants to change SETTINGS: use modificationType="change_setting" with updates (title, theme, timerSeconds)
- User wants to reorder items: use modificationType="reorder"
- Complex changes: use modificationType="general" with modification text
- CRITICAL: For "make question 3 easier", use itemIndex=2 (0-based index!)
- Examples with correct tool params:
  - "change question 3" → modificationType="edit_item", itemIndex=2, updates={question: "new text"}
  - "change q1 to true/false" → modificationType="edit_item", itemIndex=0, updates={questionType: "true-false", options: ["True", "False"], correctAnswer: 0}
  - "make question 2 a fill-in-the-blank" → modificationType="edit_item", itemIndex=1, updates={questionType: "fill-blank"}
  - "add 30 second timer" → modificationType="change_setting", updates={timerSeconds: 30}
  - "change to space theme" → modificationType="change_setting", updates={theme: "space"}

CRITICAL - TYPE CONVERSION RULES:
When converting a question from one type to another (e.g., slide → multiple-choice, true-false → multiple-choice), you MUST:
1. READ the original question's content carefully from the question list above
2. GENERATE contextually relevant NEW content based on the quiz topic and original content
3. NEVER use placeholder text like "Option A, Option B, Option C, Option D" or "What would you like..."
4. NEVER produce literal conversions like T/F → MC with "True, False, Not really true, Not really false"
5. Always provide: new question text, 4 meaningful options (for MC), correct answer index, and brief explanation

Examples of CORRECT type conversions:
- Slide about "business plans" → MC: "What is a key component of a business plan?" with real options like "Executive summary", "Personal diary", "Random notes", "Shopping list"
- True/False about "startups need funding" → MC: Generate a related question with 4 educational options about startup funding sources
- Poll about "favorite leadership style" → MC: Create an educational question about leadership with a correct answer

When the user asks to change a question type:
1. Identify the original content/topic from the question list below
2. Generate a NEW question and NEW options that match the quiz topic
3. Include: question text, 4 options (for MC), correct answer index, and brief explanation

WHEN TO USE "generate_new_content":
- User wants to START FRESH or REPLACE ALL existing content
- User says "delete all and create new" or "start over with 5 questions"
- Creates a completely new quiz/flashcards/matching game, replacing anything that exists
- Examples: "create a new quiz about X", "delete everything and make 5 questions about Y"
- CRITICAL: Always set "fullPrompt" to the user's EXACT, COMPLETE message. This preserves details like:
  - Specific question types (polls, slides, word-cloud, open-ended, etc.)
  - Theme preferences
  - Difficulty levels
  - Any other instructions the user included
- Example: If user says "create a quiz with instructional slides, polls and word cloud about entrepreneurship"
  → fullPrompt MUST be: "create a quiz with instructional slides, polls and word cloud about entrepreneurship"
  → Do NOT summarize to just the topic!

WHEN TO USE "analyze_content":
- User says single words like "Check", "Review", "Analyze" → USE THIS TOOL
- User asks to CHECK for duplicates, issues, or problems
- User wants STATISTICS about their quiz (how many questions, difficulty distribution)
- User asks "are there any duplicates?", "check my quiz", "review my content"
- Analyze the FULL QUESTION LIST provided below and return your findings
- DO NOT just say "I'll check" - actually analyze and use this tool to report findings

WHEN TO USE "bulk_generate_hints" (FOR PERSONALIZED/UNIQUE HINTS):
- User wants UNIQUE, RELEVANT hints for each question (not the same hint for all)
- User says "add hints as you like", "add relevant hints", "add specific hints to all questions"
- User says "analyze and add hints" or similar requests requiring unique content per question
- You MUST generate a unique hint for EACH question in the hints array based on the question's content
- This is the PREFERRED tool when user wants intelligent, personalized hints

WHEN TO USE "bulk_modify_questions" (FOR IDENTICAL VALUES):
- User wants the EXACT SAME value applied to all questions
- User says "add timer to all questions" (same timer value)
- Use when applying identical content to every question

WHEN TO USE "chat_response":
- User asks for suggestions or ideas (respond with options)
- You need more information before acting
- Greeting or casual conversation

NEVER GUESS — ASK INSTEAD (highest priority rule):
- Before creating anything new, check this REQUIRED INFO CHECKLIST:
  1. WHAT to build: quiz, flashcards, or matching game.
  2. TOPIC or SOURCE: a clear topic, or which attached document/link to build from.
  3. HOW MANY items (only if the user gave no number and no source-driven scope).
  4. QUESTION TYPES, only when the user implies a mix but does not say which.
- If any of items 1-2 is missing or ambiguous, DO NOT invent it. Use "chat_response" to ask.
- Ask ONE clarifying question at a time, and always attach 2-5 short "options" the user can click. A question WITHOUT options is invalid — never send one.
- Never bundle several questions into one message (no "1. ... 2. ..." lists). Ask the most important one first; ask the next one after the user answers. Example: message="What would you like to build?", options=["Quiz","Flashcards","Matching game"], optionMode="single".
- Set optionMode="multi" when several answers can be combined (e.g. which question types), otherwise "single".

- HARD CAP: never ask more than TWO clarifying rounds in one conversation. After the second answer, act with sensible defaults (5 items, multiple-choice, medium difficulty) instead of asking again.
- If the user answers "You decide — pick what fits best" or similar, stop asking and choose sensible defaults immediately.
- Never invent facts, statistics, citations, or content that is not in the user's message or the attached source.
- If a document or link is attached and the user's intent is unclear, ask what they want built from it — do not assume.
- Do NOT ask when the request is already clear (e.g. "make a 10-question quiz on osmosis") — act immediately.
- If you cannot do something, say so plainly instead of pretending.



QUICK REFERENCE TABLE:
| User Request | Tool | Key Parameters |
|-------------|------|----------------|
| "Check" or "Check my quiz" | analyze_content | analysisType="general" |
| "Check for duplicates" | analyze_content | analysisType="duplicates" |
| "Add relevant hints to all questions" | bulk_generate_hints | field="hint", hints=[{questionIndex:0, value:"..."}, ...] |
| "Add hints as you like" | bulk_generate_hints | field="hint", hints=[...unique hints per question...] |
| "Add same timer to all" | bulk_modify_questions | field="timerSeconds", value="30" |
| "Add 5 questions about X" | add_multiple_items | items=[], contentType="questions" |
| "Delete everything and make new" | generate_new_content | contentType, topic, fullPrompt=user's EXACT message |
| "Create quiz with slides, polls, word cloud" | generate_new_content | contentType="quiz", topic, fullPrompt=FULL original request |
| "Change question 3 to..." | modify_content | modificationType="edit_item", itemIndex=2 |
| "Add 30s timer" | modify_content | modificationType="change_setting", updates={timerSeconds: 30} |
| "Set the title to X" | modify_content | modificationType="change_setting", updates={title: "X"} |
| "Rename the quiz" | modify_content | modificationType="change_setting", updates={title: "..."} |
| "Set correct title based on topic" | modify_content | modificationType="change_setting", updates={title: derived from topic} |
| "Change difficulty to hard" | modify_content | modificationType="change_setting", updates={difficulty: "hard"} |
| "What should I add?" | chat_response | message="..." |

QUESTION TYPE DETAILS:
- multiple-choice: 4 options, correctAnswer is index (0-3)
- true-false: 2 options ["True", "False"], correctAnswer is 0 or 1
- fill-blank: Use _____ in question text for the blank, correctAnswer is index of correct option
- short-answer: No options, student types answer
- poll: 4 options, NO correctAnswer (set to -1 or omit), collects opinions without right/wrong
- word-cloud: NO options, NO correctAnswer, collects short text responses from students
- open-ended: NO options, NO correctAnswer, collects long-form text responses
- slide: NO options, NO correctAnswer, use "content" field for instructional text instead of "question". This is for displaying information, not asking questions.

CRITICAL RULES:
1. Single words like "Check" or "Review" → use analyze_content, NOT bulk_modify_questions
2. "Add hints as you like" or "add relevant hints to all" → use bulk_generate_hints with UNIQUE hints for EACH question
3. "Add same X to all" or identical values → use bulk_modify_questions
4. When user asks for MULTIPLE items from a document, use "add_multiple_items" with ALL items at once
5. When user says "delete all AND make new", use "generate_new_content" - it handles both
6. For multiple choice questions, always include 4 options and the correct answer index
7. Be decisive - if user confirms, add immediately
8. For item index: "question 1" = itemIndex 0, "question 3" = itemIndex 2
9. NEVER mention tool names, parameter names, or technical details to users. Always respond in friendly, non-technical language
10. For poll questions: include 4 options but set correctAnswer to -1 (no correct answer)
11. For word-cloud and open-ended: do NOT include options or correctAnswer
12. For slide (instructional): use the "content" field for the text to display, not the "question" field

COMMON MISTAKES — NEVER DO THIS:
- User says "change the title" → DO NOT use generate_new_content (this replaces everything!)
- User says "set difficulty to hard" → DO NOT use add_multiple_items
- User says "rename quiz" or "set the correct title" → DO NOT add questions or generate new content. Use modify_content with change_setting.
- User says "set the correct title based on the file topic" → Use modify_content with change_setting, updates={title: "derived title"}
- If in doubt between modify_content and generate_new_content, ALWAYS prefer modify_content`;

  if (currentConfig) {
    const contentSummary = [];
    if (currentConfig.questions?.length) {
      contentSummary.push(`${currentConfig.questions.length} questions`);
    }
    if (currentConfig.cards?.length) {
      contentSummary.push(`${currentConfig.cards.length} flashcards`);
    }
    if (currentConfig.pairs?.length) {
      contentSummary.push(`${currentConfig.pairs.length} matching pairs`);
    }

    // Build FULL content list for analysis (not truncated)
    let contentPreview = '';
    if (currentConfig.questions?.length) {
      const fullList = currentConfig.questions.map((q: any, i: number) => {
        const qType = q.questionType || 'multiple-choice';
        
        // For slides, use content field; for others, use question text
        let displayText = '';
        if (qType === 'slide') {
          displayText = q.content || q.q || 'Instructional content';
        } else {
          displayText = q.q || q.question || 'Question';
        }
        
        // Build options display based on question type
        let optionsDisplay = '';
        if (qType === 'slide') {
          optionsDisplay = '[Instructional - no options]';
        } else if (qType === 'word-cloud' || qType === 'open-ended') {
          optionsDisplay = '[Free response - no options]';
        } else if (qType === 'poll') {
          optionsDisplay = `[Poll options: ${q.options?.join(', ') || 'none'}]`;
        } else if (q.options?.length) {
          optionsDisplay = `[Options: ${q.options.map((opt: string, idx: number) => 
            `${idx === (q.answer ?? q.correctAnswer) ? '✓' : ' '} ${opt}`
          ).join(', ')}]`;
        } else {
          optionsDisplay = '[No options]';
        }
        
        return `Q${i+1} (${qType}): "${displayText.slice(0, 150)}" ${optionsDisplay}`;
      }).join('\n');
      contentPreview = `\n\n=== FULL QUESTION LIST FOR ANALYSIS ===\n${fullList}\n=== END QUESTION LIST ===\n\nUse this complete list when checking for duplicates, analyzing content, or understanding question context for type conversions.`;
    } else if (currentConfig.cards?.length) {
      const fullList = currentConfig.cards.map((c: any, i: number) => 
        `Card ${i+1}: "${c.term || c.front}" → "${c.definition || c.back}"`
      ).join('\n');
      contentPreview = `\n\n=== FULL FLASHCARD LIST FOR ANALYSIS ===\n${fullList}\n=== END FLASHCARD LIST ===`;
    } else if (currentConfig.pairs?.length) {
      const fullList = currentConfig.pairs.map((p: any, i: number) => 
        `Pair ${i+1}: "${p.left || p.prompt}" ↔ "${p.right || p.answer}"`
      ).join('\n');
      contentPreview = `\n\n=== FULL MATCHING PAIRS FOR ANALYSIS ===\n${fullList}\n=== END MATCHING PAIRS ===`;
    }

    return `${basePrompt}

CURRENT CONTEXT:
- Type: ${currentConfig.type || 'unknown'}
- Title: "${currentConfig.title || 'Untitled'}"
- Content: ${contentSummary.join(', ') || 'empty'}
- Topic: ${currentConfig.topic || 'general'}
- Theme: ${currentConfig.theme || 'default'}
${contentPreview}

When user asks for suggestions, base them on the existing topic and content style.`;
  }

  return `${basePrompt}

CURRENT CONTEXT: No content exists yet. User wants to create something new.

When user provides a topic and type, use "generate_new_content" to create it.
If they don't specify details, use "chat_response" to ask for clarification with clickable "options" — never guess the activity type or topic.`;
}

serve(async (req) => {
  console.log("=== CHAT-ASSISTANT FUNCTION INVOKED ===");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentConfig, documentContent, urlContent, userMessageId } = await req.json() as { 
      messages: Message[]; 
      currentConfig?: any;
      documentContent?: string;
      urlContent?: string;
      userMessageId?: string;
    };
    
    console.log("Messages received:", messages.length);
    console.log("Current config:", currentConfig ? `${currentConfig.type}: ${currentConfig.title}` : "none");
    console.log("Document content provided:", documentContent ? `${documentContent.length} chars` : "none");
    console.log("URL content provided:", urlContent ? `${urlContent.length} chars` : "none");
    
    // Initialize Supabase client for auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check and deduct credits
    console.log("Checking credits for user:", userData.user.id);
    const { data: hasCredits, error: creditError } = await supabaseClient.rpc(
      'deduct_credit',
      { _user_id: userData.user.id }
    );

    if (creditError) {
      console.error("Credit check error:", creditError);
      return new Response(
        JSON.stringify({ error: "Failed to process credits" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!hasCredits) {
      console.log("User has insufficient credits");
      return new Response(
        JSON.stringify({ error: "Insufficient credits. You need at least 1 credit to continue chatting." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Credit deducted successfully");

    // Record a one-time charge for this user message so a generation that
    // follows from it (via generate-app) reuses the same credit — one request
    // costs exactly one credit.
    if (typeof userMessageId === "string" && userMessageId) {
      try {
        await supabaseClient
          .from("credit_charges")
          .upsert(
            { message_id: userMessageId, user_id: userData.user.id },
            { onConflict: "message_id" }
          );
      } catch (e) {
        console.error("Failed to record credit charge:", e);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get the last user message for logging
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    console.log("Last user message:", lastUserMessage);

    // Build system prompt with document content if provided
    const systemPrompt = buildSystemPrompt(currentConfig, documentContent, urlContent);
    
    // Build message history (last 20 messages for context)
    const recentMessages = messages.slice(-20);
    const aiMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages
    ];

    console.log("Sending to AI with", aiMessages.length, "messages and", quizTools.length, "tools");

    // Call Lovable AI with tool calling (non-streaming for tool calls)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        tools: quizTools,
        tool_choice: "auto", // Let the AI choose the best tool or respond conversationally
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("AI response received:", JSON.stringify(result).slice(0, 500));

    const choice = result.choices?.[0];
    
    if (!choice) {
      console.error("No choice in response:", result);
      return new Response(
        JSON.stringify({ 
          action: "chat_response", 
          data: { message: "I'm sorry, I had trouble understanding. Could you try again?" } 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if AI called a tool
    if (choice.message?.tool_calls?.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      let functionArgs;
      
      try {
        functionArgs = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool arguments:", toolCall.function.arguments);
        functionArgs = {};
      }

      console.log("AI called tool:", functionName, "with args:", JSON.stringify(functionArgs));

      return new Response(
        JSON.stringify({
          action: functionName,
          data: functionArgs,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: if AI responded with content directly (possible with tool_choice: auto)
    const rawContent = typeof choice.message?.content === "string" ? choice.message.content.trim() : "";
    const content = rawContent || "I didn't quite catch that. What would you like to build — a quiz, flashcards, or a matching game?";
    console.log("AI responded with content (no tool call):", content.slice(0, 200));

    return new Response(
      JSON.stringify({
        action: "chat_response",
        data: {
          message: content,
          ...(rawContent ? {} : { options: ["Quiz", "Flashcards", "Matching game"] }),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
