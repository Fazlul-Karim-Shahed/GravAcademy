const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

export const formatBulkMcqWithGemini = async (text: string): Promise<any[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key এখনো configure করা হয়নি।');

  const prompt = `You are an expert multilingual MCQ exam parser for an educational platform in Bangladesh.
Your task is to parse and extract ALL multiple choice questions (MCQs) from the provided user text, regardless of formatting style, numbering, or language (Bangla, English, Math formulas, etc.).

Guidelines:
1. Question Detection:
   - Questions can be formatted in ANY style: English numbers (1., 2.), Bengali numbers (১., ২., ৩.), Roman numerals (i, ii), question prefixes ("প্রশ্ন ১:", "Q1."), or NO numbers at all.
   - Extract EVERY question found in the input. Do not omit, combine, or invent questions.
   - Remove leading question numbers, bullets, or "প্রশ্ন ১:" prefixes from questionText so only the clean question text remains.
   - Keep any mathematical notations, LaTeX formulas, or Bangla characters intact.

2. Options:
   - Options may be on separate lines or on the same line.
   - Option labels can be (A), (B), (C), (D) or A), B), C), D) or A., B., C., D. or (ক), (খ), (গ), (ঘ) or ক), খ), গ), ঘ) or ক., খ., গ., ঘ. or 1), 2), 3), 4).
   - Strip the option label prefix (e.g. "A)", "(ক)", "খ.") from the option text so only the clean option content remains.
   - Most questions have 4 options, but extract whatever options are provided (minimum 2).

3. Correct Answer Mapping:
   - Detect the correct answer from keys like "Ans: B", "Answer: A", "উত্তর: খ", "উত্তর: B", "সঠিক উত্তর: ৩", asterisks (e.g. *B*), bolding, or direct answer lines.
   - Map to correctOptionIndex (0-indexed integer corresponding to the index in options array):
     - 0 -> 1st option (A / ক / 1)
     - 1 -> 2nd option (B / খ / 2)
     - 2 -> 3rd option (C / গ / 3)
     - 3 -> 4th option (D / ঘ / 4)
   - If no answer is indicated anywhere for a question, default correctOptionIndex to 0.

4. Output format:
   - Return valid JSON ONLY with this exact structure:
{
  "questions": [
    {
      "questionText": "Question text here",
      "options": [
        { "text": "Option 1" },
        { "text": "Option 2" },
        { "text": "Option 3" },
        { "text": "Option 4" }
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "explanation": ""
    }
  ]
}

User text to parse:
${text}`;

  const request = (model: string) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

  let response = await request(GEMINI_MODEL);
  if (!response.ok && GEMINI_MODEL !== 'gemini-flash-lite-latest') {
    response = await request('gemini-flash-lite-latest');
  }
  if (!response.ok && (response.status === 429 || response.status >= 500)) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    response = await request('gemini-flash-lite-latest');
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('Gemini API Error:', response.status, errorBody);
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const payload: any = await response.json();
  const raw = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || '';

  // Extract JSON robustly
  const jsonStart = raw.search(/[{\[]/);
  const jsonEnd = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('AI থেকে সঠিক JSON ফরম্যাট পাওয়া যায়নি।');
  }

  const parsed = JSON.parse(raw.substring(jsonStart, jsonEnd + 1));
  const rawList = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.questions)
    ? parsed.questions
    : Array.isArray(parsed?.data?.questions)
    ? parsed.data.questions
    : [];

  if (!rawList.length) {
    throw new Error('AI কোনো প্রশ্ন চিহ্নিত করতে পারেনি। অনুগ্রহ করে টেক্সট ফরম্যাটটি পরীক্ষা করুন।');
  }

  const normalized = rawList
    .map((q: any) => {
      const questionText = String(q?.questionText || '').trim();
      const rawOptions = Array.isArray(q?.options) ? q.options : [];
      const options = rawOptions
        .map((o: any) => ({
          text: String(typeof o === 'string' ? o : o?.text || '').trim(),
        }))
        .filter((o: any) => Boolean(o.text));

      let correctIndex = Number(q?.correctOptionIndex);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }

      return {
        questionText,
        options,
        correctOptionIndex: correctIndex,
        marks: Number(q?.marks) > 0 ? Number(q.marks) : 1,
        explanation: String(q?.explanation || '').trim(),
      };
    })
    .filter((q: any) => q.questionText && q.options.length >= 2);

  if (!normalized.length) {
    throw new Error('AI থেকে পর্যাপ্ত অপশনসহ কোনো প্রশ্ন তৈরি করা সম্ভব হয়নি।');
  }

  return normalized;
};
