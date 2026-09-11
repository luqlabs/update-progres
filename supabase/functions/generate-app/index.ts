import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Helper functions
function classifyIntent(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Detect replacement requests - these indicate user wants to completely replace content
  const replacementPatterns = [
    /\breplace\s+(the|this|everything|all|with|it)\b/i,
    /\bstart\s+over\b/i,
    /\bchange\s+(the|everything|it)\s+(completely|to|into)\b/i,
    /\bdelete\s+(everything|all)\s+and\b/i,
    /\bscrap\s+(this|it|everything)\b/i,
    /\bnew\s+(quiz|flashcards?|matching)/i
  ];
  
  const isReplacement = replacementPatterns.some(pattern => pattern.test(prompt));
  
  // Determine action
  let action: 'create' | 'modify' | 'replace' | 'clarify';
  if (isReplacement) {
    action = 'replace';
  } else if (/\b(create|make|generate|build)\b/.test(lowerPrompt)) {
    action = 'create';
  } else if (/\b(change|modify|update|edit|add|remove)\b/.test(lowerPrompt)) {
    action = 'modify';
  } else {
    action = 'clarify';
  }
  
  let appType: string | undefined;
  if (/\b(quiz|question|test)\b/.test(lowerPrompt)) appType = 'quiz';
  else if (/\b(flashcards?|flash ?cards?)\b/.test(lowerPrompt)) appType = 'flashcards';
  else if (/\b(matching game|matching activity)\b/.test(lowerPrompt)) appType = 'matching';
  
  // Detect ALL specific question types being requested (support multiple types in one prompt)
  const questionTypes: string[] = [];
  
  if (/\b(fill.?in|fill.?blank|fill.?the.?blank)\b/i.test(prompt)) questionTypes.push('fill-blank');
  if (/\b(true.?false|true.?or.?false)\b/i.test(prompt)) questionTypes.push('true-false');
  if (/\b(short.?answer)\b/i.test(prompt)) questionTypes.push('short-answer');
  if (/\b(poll|survey|opinion)\b/i.test(prompt)) questionTypes.push('poll');
  if (/\b(word.?cloud)\b/i.test(prompt)) questionTypes.push('word-cloud');
  if (/\b(open.?ended|essay|long.?answer)\b/i.test(prompt)) questionTypes.push('open-ended');
  if (/\b(slide|instruction(al)?|explain|teach|intro)\b/i.test(prompt)) questionTypes.push('slide');
  if (/\b(multiple.?choice|mcq)\b/i.test(prompt)) questionTypes.push('multiple-choice');
  if (/\b(matching|match|pair)\b/i.test(lowerPrompt) && appType === 'quiz') questionTypes.push('matching');
  
  // Detect theme change requests - map colors to actual themes
  let themeChange: string | undefined;
  if (/\b(space|rocket|galaxy|cosmic|astronaut|blue|purple|navy|dark)\b/i.test(prompt)) themeChange = 'space';
  else if (/\b(jungle|safari|forest|animal|wild|green|tropical)\b/i.test(prompt)) themeChange = 'jungle';
  else if (/\b(classroom|school|academic|traditional|neutral|beige|light)\b/i.test(prompt)) themeChange = 'classroom';
  
  return { action, appType, themeChange, questionTypes };
}

function buildEnhancedPrompt(originalPrompt: string, intent: any, currentConfig: any): string {
  let enhanced = originalPrompt;
  
  // Handle replacement requests
  if (intent.action === 'replace') {
    enhanced += "\n\nIMPORTANT: Create an entirely new app based on this request. Do not preserve any questions/cards/pairs from the current configuration.";
    return enhanced;
  }
  
  // Add context based on intent
  if (intent.action === 'create' && !intent.appType) {
    enhanced += "\n\nNote: If not specified, create a quiz by default.";
  }
  
  if (intent.action === 'modify' && currentConfig) {
    const itemCount = currentConfig.questions?.length || currentConfig.cards?.length || currentConfig.pairs?.length || 0;
    enhanced += `\n\nIMPORTANT: The current app has ${itemCount} items. `;
    
    if (intent.questionTypes && intent.questionTypes.length > 0) {
      enhanced += `The user wants to add these question types: ${intent.questionTypes.join(', ')}. Keep ALL existing questions and append the new one(s).`;
    } else if (/\b(add|more|another|additional)\b/i.test(originalPrompt)) {
      enhanced += `Keep ALL existing items and add the requested new items.`;
    } else if (/\b(change|replace|modify|update)\b/i.test(originalPrompt)) {
      enhanced += `Modify only the specific items mentioned while keeping all others unchanged.`;
    }
    
    if (currentConfig.questions) {
      const types = currentConfig.questions.map((q: any) => q.questionType || 'multiple-choice');
      enhanced += ` Current question types: ${types.join(', ')}.`;
    }
  }
  
  // CRITICAL: When user explicitly requests specific question types, emphasize strongly
  // This ensures the AI generates the requested types instead of defaulting to MC/TF
  if (intent.questionTypes && intent.questionTypes.length > 0) {
    enhanced += `\n\n*** CRITICAL INSTRUCTION ***
The user has EXPLICITLY requested these specific question types: ${intent.questionTypes.join(', ')}.
You MUST generate questions using ONLY these types. Do NOT use multiple-choice or true-false unless explicitly listed above.
Generate a good mix of the requested types across the quiz questions.
For example, if user asked for "slides, polls and word cloud", generate at least 1-2 of each type.`;
  }
  
  return enhanced;
}

function detectLanguage(prompt: string): string {
  // Remove common English commands/keywords that might be mixed in
  const cleanPrompt = prompt.toLowerCase();
  
  // Indonesian language detection patterns
  const indonesianPatterns = [
    /\b(yang|dan|atau|untuk|dengan|dari|di|ke|pada|adalah|tentang|apa|siapa|kapan|dimana|mengapa|bagaimana)\b/g,
    /\b(membuat|mengubah|menambahkan|menghapus|menjadi|tersebut|ini|itu)\b/g,
    /\b(kuis|pertanyaan|soal|jawaban|pilihan|benar|salah|buat|ganti)\b/g
  ];
  
  // Spanish patterns
  const spanishPatterns = [
    /\b(que|con|para|por|como|cuando|donde|quien|cual|qué|dónde|cuándo)\b/g,
    /\b(es|son|está|están|hay|hacer|tener|ser|crear|quiz)\b/g
  ];
  
  // French patterns
  const frenchPatterns = [
    /\b(que|avec|pour|dans|sur|est|sont|comment|quand|où)\b/g,
    /\b(faire|être|avoir|aller|venir|voir|savoir|créer)\b/g
  ];
  
  // German patterns
  const germanPatterns = [
    /\b(und|oder|mit|für|von|zu|bei|ist|sind|hat|haben)\b/g,
    /\b(wie|was|wer|wo|wann|warum|machen|sein|haben|erstellen)\b/g
  ];
  
  // Count matches for each language
  const indonesianCount = indonesianPatterns.reduce((sum, pattern) => 
    sum + (cleanPrompt.match(pattern)?.length || 0), 0);
  const spanishCount = spanishPatterns.reduce((sum, pattern) => 
    sum + (cleanPrompt.match(pattern)?.length || 0), 0);
  const frenchCount = frenchPatterns.reduce((sum, pattern) => 
    sum + (cleanPrompt.match(pattern)?.length || 0), 0);
  const germanCount = germanPatterns.reduce((sum, pattern) => 
    sum + (cleanPrompt.match(pattern)?.length || 0), 0);
  
  // Return the language with the highest match count
  const languages = [
    { name: 'Indonesian', count: indonesianCount },
    { name: 'Spanish', count: spanishCount },
    { name: 'French', count: frenchCount },
    { name: 'German', count: germanCount }
  ];
  
  const maxLanguage = languages.reduce((max, lang) => 
    lang.count > max.count ? lang : max, { name: 'English', count: 0 });
  
  // Require at least 3 matches to consider it non-English
  if (maxLanguage.count >= 3) {
    return maxLanguage.name;
  }
  
  return 'English';
}

// Hybrid model selection based on task complexity
function selectModel(hasDocument: boolean, hasCurrentConfig: boolean, intent: { action: string }, isRetry: boolean = false): string {
  // If this is a retry after validation failure, use the most capable model
  if (isRetry) {
    return "google/gemini-2.5-flash";
  }
  
  // Document/URL extraction + generation = simpler structured task → use flash model for reliability
  if (hasDocument) {
    return "google/gemini-2.5-flash";
  }
  
  // Modifying existing content requires better context understanding
  if (hasCurrentConfig && intent.action === 'modify') {
    return "google/gemini-2.5-flash";
  }
  
  // Creating from scratch → use flash model (lite sometimes returns empty content)
  return "google/gemini-2.5-flash";
}

// Phrases that reveal the question was written against a source document the
// student will never see. Generated content must be fully self-contained.
const SOURCE_REFERENCE_PATTERNS: RegExp[] = [
  /according to the (provided |given |above |following )?(text|passage|document|article|reading|excerpt|material|content|source|author|book|chapter|slides?|notes?)/i,
  /based on the (provided |given |above |following )?(text|passage|document|article|reading|excerpt|material|content|source|author)/i,
  /(in|from) the (provided |given |above |following )?(text|passage|document|article|reading|excerpt|material|source)/i,
  /as (mentioned|stated|described|discussed|explained|noted) (above|in the (text|passage|document|article|reading|material))/i,
  /the (text|passage|document|article|excerpt|author|reading) (states|says|mentions|describes|explains|suggests|argues)/i,
  /the (provided|given|attached|uploaded) (text|document|material|content|file)/i,
];

const SELF_CONTAINED_RULES = `
SELF-CONTAINED CONTENT (CRITICAL — NEVER VIOLATE):
Students only ever see the question itself. They do NOT see the source document, link, or reference material.
- NEVER reference the source. Forbidden phrasing includes: "According to the provided text/passage/document/article/author/reading", "Based on the text", "In the passage", "As mentioned above", "The excerpt states", "The attached document".
- Treat the reference material as your own knowledge, not as an object the student can look at.
- If a question needs context (a quote, scenario, formula, case, definition), EMBED that context directly inside the question text so it reads standalone.
- Rewrite rather than drop. Bad: "According to the text, what makes a person most beloved to Allah?" Good: "What characteristic is described as making a person most beloved to Allah and closest to His seat on the Day of Judgment?"
- The same rule applies to flashcard fronts/backs and matching prompts/answers.
`;

function findSourceReferences(text: unknown): boolean {
  if (typeof text !== 'string' || !text) return false;
  return SOURCE_REFERENCE_PATTERNS.some((re) => re.test(text));
}

function validateConfig(config: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  
  if (!config.type || !['quiz', 'flashcards', 'matching'].includes(config.type)) {
    errors.push("Invalid app type");
  }
  
  if (!config.title || config.title.length < 3) {
    errors.push("Title too short");
  }
  
  if (config.type === 'quiz') {
    if (!Array.isArray(config.questions) || config.questions.length === 0) {
      errors.push("Quiz needs questions");
    } else {
      config.questions.forEach((q: any, i: number) => {
        // Slides don't need q text, only content
        if (q.questionType !== 'slide' && (!q.q || q.q.length < 5)) {
          errors.push(`Q${i + 1} too short`);
        }
        
        // Question types that don't need answers
        const noAnswerTypes = ['poll', 'word-cloud', 'open-ended', 'slide'];
        
        if (!noAnswerTypes.includes(q.questionType)) {
          // These question types need answers
          if (!q.answer) errors.push(`Q${i + 1} missing answer`);
          
          // Matching question type has pairs, not options
          if (q.questionType === 'matching') {
            if (!Array.isArray(q.pairs) || q.pairs.length === 0) {
              errors.push(`Q${i + 1} matching question needs pairs`);
            }
          } else if (q.questionType !== 'short-answer' && q.questionType !== 'fill-blank') {
            // MCQ and true-false need answer in options
            if (!q.options?.includes(q.answer)) {
              errors.push(`Q${i + 1} answer not in options`);
            }
          }
        }
      });
    }
  }
  
  // Safety net: flag content that refers to source material students can't see
  if (Array.isArray(config.questions)) {
    config.questions.forEach((q: any, i: number) => {
      if (findSourceReferences(q?.q) || findSourceReferences(q?.content)) {
        warnings.push(`Q${i + 1} references source material the student cannot see`);
      }
    });
  }
  if (Array.isArray(config.cards)) {
    config.cards.forEach((c: any, i: number) => {
      if (findSourceReferences(c?.front) || findSourceReferences(c?.back)) {
        warnings.push(`Card ${i + 1} references source material the student cannot see`);
      }
    });
  }
  if (Array.isArray(config.pairs)) {
    config.pairs.forEach((p: any, i: number) => {
      if (findSourceReferences(p?.prompt) || findSourceReferences(p?.answer)) {
        warnings.push(`Pair ${i + 1} references source material the student cannot see`);
      }
    });
  }
  
  return { valid: errors.length === 0, errors, warnings };

}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("=== FUNCTION INVOKED ===");
  console.log("Method:", req.method);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== PARSING REQUEST BODY ===");
    const requestBody = await req.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));
    const { prompt, documentContent, currentConfig, prepaidMessageId } = requestBody;
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from auth header
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

    // If this generation continues a chat message that already consumed a credit
    // (recorded by chat-assistant), consume that one-time charge instead of
    // deducting again — one user request costs exactly one credit.
    let skipDeduction = false;
    if (typeof prepaidMessageId === "string" && prepaidMessageId) {
      try {
        const { data: consumed } = await supabaseClient
          .from("credit_charges")
          .delete()
          .eq("message_id", prepaidMessageId)
          .eq("user_id", userData.user.id)
          .select("message_id");
        skipDeduction = Array.isArray(consumed) && consumed.length > 0;
      } catch (e) {
        console.error("Prepaid charge check failed:", e);
      }
    }

    // Check and deduct credits
    const { data: hasCredits, error: creditError } = skipDeduction
      ? { data: true, error: null }
      : await supabaseClient.rpc(
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
      return new Response(
        JSON.stringify({ error: "Insufficient credits. You need at least 1 credit to generate content." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Combine prompt with document content if provided
    let fullPrompt = prompt;
    if (documentContent) {
      fullPrompt = `Based on the following document content, ${prompt}

--- DOCUMENT CONTENT START ---
${documentContent}
--- DOCUMENT CONTENT END ---

NOTE: The student will NEVER see this document. Every question, card and pair must be fully self-contained and must never refer to "the text", "the passage", "the document", "the article", "the author" or "the provided material". Embed any needed context inside the question itself.`;

    }
    
    console.log("Processing app generation request:", prompt);
    console.log("Document content provided:", documentContent ? "yes" : "no");
    console.log("Current config:", currentConfig ? "exists" : "new app");

    // Validate input (only the user's prompt, not document)
    const lowerPrompt = prompt.toLowerCase().trim();
    
    if (lowerPrompt.length < 3) {
      return new Response(
        JSON.stringify({ error: "Please provide a more detailed description of what you want to create." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if prompt has enough context for generation (topic must be present)
    const hasTopic = /\b(about|on|for|regarding|covering|topic)\s+\w+/i.test(lowerPrompt) ||
      /\b(quiz|flashcard|matching)\s+(about|on|for)\s+\w+/i.test(lowerPrompt) ||
      // Has specific subject keywords
      /\b(history|math|science|biology|chemistry|physics|geography|literature|english|spanish|french|programming|business|psychology|medicine|sports|music|art)\b/i.test(lowerPrompt) ||
      // Has document content to base it on
      !!documentContent ||
      // Is a modification to existing config
      (!!currentConfig && (
        /\b(add|change|modify|update|edit|remove|delete)\b/i.test(lowerPrompt)
      ));
    
    if (!hasTopic && !currentConfig) {
      console.log("Prompt lacks topic context, rejecting:", lowerPrompt);
      return new Response(
        JSON.stringify({ error: "Please specify a topic for your content. For example: 'Create a quiz about world history' or 'Make flashcards for Spanish vocabulary'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Length validation (only the user's prompt)
    if (prompt.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Prompt too long. Please keep it under 2000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect potential prompt injection attempts
    const injectionPatterns = [
      /ignore\s+(previous|all|earlier|above)\s+(instructions?|prompts?|rules?)/i,
      /disregard\s+(previous|all|earlier|above)\s+(instructions?|prompts?|rules?)/i,
      /forget\s+(previous|all|earlier|above)\s+(instructions?|prompts?|rules?)/i,
      /you\s+are\s+now\s+a?\s*(different|new)/i,
      /act\s+as\s+if\s+you\s+(are|were)\s+a?\s*(different|new)/i,
      /system\s*:\s*/i,
      /\[system\]/i,
      /sudo\s+mode/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(lowerPrompt)) {
        console.log('Potential prompt injection detected:', lowerPrompt.substring(0, 100));
        return new Response(
          JSON.stringify({ error: "Invalid prompt content. Please rephrase your request." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Classify intent for better prompt enhancement
    const intent = classifyIntent(lowerPrompt);
    const detectedLanguage = detectLanguage(fullPrompt);
    console.log("Classified intent:", JSON.stringify(intent));
    console.log("Detected question types:", intent.questionTypes?.length > 0 ? intent.questionTypes.join(', ') : 'none (will use defaults)');
    console.log("Detected language:", detectedLanguage);
    const enhancedPrompt = buildEnhancedPrompt(fullPrompt, intent, currentConfig);

    const systemPrompt = currentConfig
      ? (intent.action === 'replace' 
        ? `You are an educational app configuration generator. The teacher wants to REPLACE their existing app with a completely new one.

Teacher's request: "${prompt}"

CRITICAL INSTRUCTION: 
Create a completely NEW app based on the teacher's request. IGNORE the current configuration entirely. Only reference the current config for the app type (quiz/flashcards/matching) if not specified in the request.

DO NOT preserve any existing questions, cards, or pairs. This is a full replacement.

LANGUAGE REQUIREMENT:
- Detected input language: ${detectedLanguage}
- Generate ALL content (questions, answers, options, titles, hints, feedback, cards, pairs) in ${detectedLanguage}
- Maintain consistent language throughout the entire app
- If the user's prompt is in Indonesian, generate Indonesian content. If Spanish, generate Spanish content, etc.

QUIZ APP STRUCTURE:
- type: "quiz"
- title: Clear, engaging title
- timerSeconds: (optional) Default timer for all questions **MUST be "timerSeconds"**
- questions: Array of question objects
- theme: "space", "jungle", or "classroom"
- difficulty: "easy", "medium", or "hard"

QUESTION TYPES (all supported in quiz apps):
- multiple-choice: 4 options, 1 correct answer
- true-false: 2 options ["True", "False"], 1 correct answer
- short-answer: text input, provide expected answer string
- fill-blank: use EXACTLY three underscores (___) as placeholder, provide answer. CRITICAL: Use underscores (_), NEVER use dashes (-), hyphens, or em dashes (—). DO NOT adjust blank length based on answer.
- poll: 4 options, NO answer (collects opinions)
- word-cloud: NO options, NO answer (collects short text responses)
- open-ended: NO options, NO answer (collects long-form responses)
- slide: NO options, NO answer, use "content" field for instructional text
- matching: pairs array with prompt/answer objects (THIS IS A QUESTION TYPE, not an app type)

QUESTION OBJECT STRUCTURE:
- q: Question text (not needed for slides)
- options: Array (MCQ=4, true-false=2, poll=4, not needed for others)
- answer: Correct answer (not needed for poll, word-cloud, open-ended, slide)
- hint: (optional) Hint for students
- explanation: (REQUIRED for gradable questions) 1-2 sentence explanation of why the answer is correct. ALWAYS include for multiple-choice, true-false, short-answer, and fill-blank questions.
- questionType: See list above
- content: (for slides only) Instructional content
- timerSeconds: (optional) Override timer for this question **MUST be "timerSeconds"**

FLASHCARD & MATCHING APPS:
- Flashcards: type "flashcards", cards array with front/back
- Matching: type "matching", pairs array with prompt/answer (THIS IS AN APP TYPE)

${SELF_CONTAINED_RULES}
IMPORTANT: Return ONLY valid JSON, no additional text or explanations.`

        : `You are an educational app configuration modifier. The teacher has an existing app and wants to make changes.

Current app configuration:
${JSON.stringify(currentConfig, null, 2)}

Teacher's modification request: "${prompt}"

CRITICAL RULES FOR MODIFICATIONS:
1. **PRESERVE ALL EXISTING CONTENT** unless explicitly asked to change/remove specific items
2. When adding questions: Keep all existing questions and append new ones to the array
3. When modifying a specific question: Only change that question, keep all others identical
4. When changing theme/title: Keep all questions unchanged, only update the requested field
5. **LANGUAGE**: Detected input language is ${detectedLanguage}. When adding NEW content:
   - If existing content has a clear language, match that language
   - Otherwise, generate content in ${detectedLanguage} (the detected language from the user's prompt)
   - Maintain language consistency across all content

INCREMENTAL MODIFICATION EXAMPLES:
- Request: "add 2 fill-blank questions" → Keep all existing questions, append 2 new fill-blank questions
- Request: "add a true-false question about topic X" → Keep all existing, append 1 true-false question
- Request: "change question 3 to a poll" → Keep Q1, Q2, Q4..Qn unchanged, convert Q3 to poll type
- Request: "add an instructional slide before question 2" → Insert slide at position 2, shift others down

QUESTION TYPES (all supported in quiz apps):
- multiple-choice: 4 options, 1 correct answer
- true-false: 2 options ["True", "False"], 1 correct answer
- short-answer: text input, provide expected answer string
- fill-blank: use EXACTLY three underscores (___) as placeholder, provide answer. CRITICAL: Use underscores (_), NEVER use dashes (-), hyphens, or em dashes (—). DO NOT adjust blank length based on answer.
- poll: 4 options, NO answer (collects opinions)
- word-cloud: NO options, NO answer (collects short text responses)
- open-ended: NO options, NO answer (collects long-form responses)
- slide: NO options, NO answer, use "content" field for instructional text
- matching: pairs array with prompt/answer objects (THIS IS A QUESTION TYPE, not an app type)

FILL-BLANK EXAMPLES:
   CORRECT: "The capital of France is ___." (exactly 3 underscores: _ _ _)
   WRONG: "The capital of France is ---." (dashes will NOT work)
   WRONG: "The capital of France is ——." (em dashes will NOT work)
   WRONG: "The capital of France is _____." (too many underscores)

CRITICAL INSTRUCTIONS FOR QUESTION TYPE CONVERSIONS:
When converting a question to a different type, you MUST ensure ALL fields match the new type:

1. **Converting to true-false**:
   - Rephrase the question as a TRUE or FALSE statement
   - Set "answer" to EXACTLY "True" or "False" (capitalized)
   - Set "options" to ["True", "False"]
   - Example:
     FROM: { "q": "Name the gas humans breathe", "answer": "Oxygen", "questionType": "short-answer" }
     TO: { "q": "Humans breathe oxygen", "answer": "True", "options": ["True", "False"], "questionType": "true-false" }

2. **Converting to multiple-choice**:
   - Keep or rephrase the question
   - Provide 4 options including the correct answer
   - Ensure "answer" is EXACTLY one of the values in "options"
   - Example:
     FROM: { "q": "What is 2+2?", "answer": "4", "questionType": "short-answer" }
     TO: { "q": "What is 2+2?", "answer": "4", "options": ["2", "3", "4", "5"], "questionType": "multiple-choice" }

3. **Converting to short-answer or fill-blank**:
   - Remove "options" field completely
   - Keep only "q" and "answer"
   - For fill-blank, ensure question uses ___ placeholder

4. **Converting to poll/word-cloud/open-ended**:
   - Remove "answer" field completely
   - For poll: keep 4 options
   - For word-cloud/open-ended: remove options field
   - Keep only "q"

5. **Converting to slide**:
   - Remove both "answer" and "options" fields
   - Use "content" field instead of "q"
   - Change to "questionType": "slide"

VALIDATION RULES:
- true-false and multiple-choice: answer MUST be in options
- short-answer and fill-blank: NO options field
- poll, word-cloud, open-ended, slide: NO answer field

THEME CHANGES: Map color requests to themes:
- "blue", "purple", "dark", "cosmic", "space" → "space"
- "green", "tropical", "forest", "jungle" → "jungle"  
- "neutral", "beige", "light", "classroom" → "classroom"

QUIZ APP STRUCTURE:
- type: "quiz"
- title: Clear, engaging title
- timerSeconds: (optional) Default timer for all questions **MUST be "timerSeconds"**
- questions: Array of question objects
- theme: "space", "jungle", or "classroom"
- difficulty: "easy", "medium", or "hard"

QUESTION OBJECT STRUCTURE:
- q: Question text (not needed for slides)
- options: Array (MCQ=4, true-false=2, poll=4, not needed for others)
- answer: Correct answer (not needed for poll, word-cloud, open-ended, slide)
- hint: (optional) Hint for students
- explanation: (REQUIRED for gradable questions) 1-2 sentence explanation of why the answer is correct. ALWAYS include for multiple-choice, true-false, short-answer, and fill-blank questions.
- questionType: See list above
- content: (for slides only) Instructional content
- timerSeconds: (optional) Override timer for this question **MUST be "timerSeconds"**

FLASHCARD & MATCHING APPS:
- Flashcards: type "flashcards", cards array with front/back
- Matching: type "matching", pairs array with prompt/answer (THIS IS AN APP TYPE)

${SELF_CONTAINED_RULES}
IMPORTANT: Return ONLY valid JSON, no additional text or explanations.`)

      : `YOU MUST RESPOND WITH VALID JSON ONLY. NO EXPLANATIONS. NO QUESTIONS. NO CONVERSATION.

You are an educational app configuration generator. Convert natural language requests into structured JSON.

ABSOLUTE RULES - VIOLATION CAUSES SYSTEM FAILURE:
1. NEVER ask questions or request clarification
2. NEVER respond with natural language text
3. ALWAYS output valid JSON starting with { and ending with }
4. If the request is vague, infer reasonable defaults and generate content anyway

Supported app types: quiz, flashcards, matching

DEFAULT BEHAVIORS (use when not specified):
- Default topic: "General Knowledge"
- Default question count: 5
- Default question type: "multiple-choice"
- Default difficulty: "medium"
- Default theme: "classroom"

QUIZ STRUCTURE:
{
  "type": "quiz",
  "title": "Quiz Title",
  "timerSeconds": 0,
  "questions": [
    {
      "q": "Question text",
      "options": ["A", "B", "C", "D"],
      "answer": "Correct option",
      "explanation": "Why this is correct",
      "questionType": "multiple-choice"
    }
  ],
  "theme": "classroom",
  "difficulty": "medium"
}

QUESTION TYPES:
- multiple-choice: 4 options, 1 answer
- true-false: ["True", "False"] options, answer is "True" or "False"
- short-answer: no options, text answer
- fill-blank: no options, use ___ in question, provide answer
- poll: 4 options, NO answer field
- word-cloud: NO options, NO answer
- open-ended: NO options, NO answer
- slide: NO options, NO answer, use "content" instead of "q"

FLASHCARD STRUCTURE:
{
  "type": "flashcards",
  "title": "Flashcard Title",
  "cards": [{"front": "Term", "back": "Definition"}],
  "theme": "classroom"
}

MATCHING STRUCTURE:
{
  "type": "matching",
  "title": "Matching Game Title",
  "pairs": [{"prompt": "Term", "answer": "Match"}],
  "theme": "classroom"
}

${SELF_CONTAINED_RULES}
REMEMBER: Output ONLY the JSON object. Start with { and end with }.`;


    // Select model based on task complexity
    const selectedModel = selectModel(!!documentContent, !!currentConfig, intent);
    console.log("Selected model:", selectedModel, "| hasDocument:", !!documentContent, "| hasConfig:", !!currentConfig, "| action:", intent.action);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: enhancedPrompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log("AI Response:", generatedContent);

    // Parse the JSON response
    let config;
    try {
      // Step 1: Check if response looks like JSON
      let cleanedContent = generatedContent.trim();
      
      // Detect if AI returned conversational text instead of JSON
      if (!cleanedContent.startsWith('{') && !cleanedContent.startsWith('[') && !cleanedContent.startsWith('```')) {
        console.error("AI returned non-JSON response:", cleanedContent.substring(0, 200));
        return new Response(
          JSON.stringify({ 
            error: "Please be more specific about what you want to create. For example: 'Create a 5-question quiz about world history' or 'Make flashcards for Spanish vocabulary'." 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Step 2: Strip markdown code blocks
      if (cleanedContent.startsWith('```')) {
        // Remove ```json or ``` at start
        cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/, '');
        // Remove ``` at end
        cleanedContent = cleanedContent.replace(/\n?```\s*$/, '');
        cleanedContent = cleanedContent.trim();
      }

      // Step 3: Parse JSON
      let parsedConfig = JSON.parse(cleanedContent);

      // Step 3: Handle array of configs (when user asks for "3 quizzes")
      if (Array.isArray(parsedConfig)) {
        console.log(`AI returned array of ${parsedConfig.length} configs, merging into single config`);
        
        if (parsedConfig.length > 0) {
          const firstConfig = parsedConfig[0];
          
          if (firstConfig.type === 'quiz') {
            // Merge all questions from all quiz configs
            config = {
              ...firstConfig,
              questions: parsedConfig.flatMap(cfg => cfg.questions || [])
            };
            console.log(`Merged ${config.questions.length} questions from ${parsedConfig.length} quiz configs`);
          } else if (firstConfig.type === 'flashcards') {
            // Merge all cards from all flashcard configs
            config = {
              ...firstConfig,
              cards: parsedConfig.flatMap(cfg => cfg.cards || [])
            };
            console.log(`Merged ${config.cards.length} cards from ${parsedConfig.length} flashcard configs`);
          } else if (firstConfig.type === 'matching') {
            // Merge all pairs from all matching configs
            config = {
              ...firstConfig,
              pairs: parsedConfig.flatMap(cfg => cfg.pairs || [])
            };
            console.log(`Merged ${config.pairs.length} pairs from ${parsedConfig.length} matching configs`);
          } else {
            // Fallback: just take the first one
            config = firstConfig;
            console.log("Unknown config type in array, using first item only");
          }
        } else {
          throw new Error("AI returned empty array");
        }
      } else {
        config = parsedConfig;
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Attempted to parse:", generatedContent);
      throw new Error("Failed to parse AI response");
    }

    // Normalize quiz questions: trim whitespace, add missing explanations
    if (config.type === 'quiz' && config.questions) {
      const gradableTypes = ['multiple-choice', 'true-false', 'short-answer', 'fill-blank'];
      
      config.questions.forEach((q: any) => {
        // Trim whitespace from options
        if (Array.isArray(q.options)) {
          q.options = q.options.map((opt: string) => typeof opt === 'string' ? opt.trim() : opt);
        }
        
        // Trim whitespace from answer
        if (typeof q.answer === 'string') {
          q.answer = q.answer.trim();
        }
        
        // Normalize fill-blank placeholders to exactly three underscores
        // Also convert any dashes/hyphens/em-dashes to underscores (AI sometimes uses these incorrectly)
        if (q.questionType === 'fill-blank' && q.q) {
          // First convert sequences of dashes/hyphens/em-dashes to underscores
          q.q = q.q.replace(/[-–—]{3,}/g, '___');
          // Then normalize multiple underscores to exactly 3
          q.q = q.q.replace(/_{3,}/g, '___');
        }
        
        // Add default explanation if missing for gradable questions
        if (gradableTypes.includes(q.questionType) && !q.explanation && q.answer) {
          q.explanation = `The correct answer is "${q.answer}".`;
        }
      });
    }

    // Validate generated config
    const validation = validateConfig(config);
    if (!validation.valid) {
      console.error("Generated config validation errors:", validation.errors);
      return new Response(
        JSON.stringify({ 
          error: "Generated content has quality issues: " + validation.errors.join(", "),
          config: config // Still return it so user can see what was generated
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log warnings but continue
    if (validation.warnings.length > 0) {
      console.log("Config warnings:", validation.warnings);
    }

    return new Response(
      JSON.stringify({ 
        config,
        warnings: validation.warnings 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("=== FUNCTION ERROR ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        errorType: error?.constructor?.name || "Unknown"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
