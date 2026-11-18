const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

export const formatBulkMcqWithGemini = async (text: string): Promise<any[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key এখনো configure করা হয়নি।');
  const numberedCount = (text.match(/^\s*(?:\d+\s*[.)]|প্রশ্ন\s*\d+\s*[.:)])/gim) || []).length;
  const optionGroupCount = (text.match(/^\s*\((?:ক|a)\)\s+/gim) || []).length;
  const expectedCount = numberedCount || optionGroupCount || text.split(/\n\s*\n+/).filter((block) => block.trim()).length;
  const structuredBlocks = text.split(/(?=^\s*\d+\s*[.)]\s*)/m).map((block) => block.trim()).filter(Boolean);
  const structuredQuestions = structuredBlocks.map((block) => {
    const lines = block.split(/\r?\n/).map((line) => line.replace(/\\+$/g, '').trim()).filter(Boolean);
    const optionMatches = lines.map((line) => line.match(/^\s*\((ক|খ|গ|ঘ|a|b|c|d)\)\s*(.+)$/i)).filter(Boolean) as RegExpMatchArray[];
    const answerLine = lines.find((line) => /^(?:\*\*)?\s*(?:উত্তর|ans|answer)\s*:/i.test(line));
    if (optionMatches.length !== 4 || !answerLine) return null;
    const questionText = lines.slice(0, lines.findIndex((line) => /^\s*\((ক|খ|গ|ঘ|a|b|c|d)\)/i.test(line))).join(' ').replace(/^\s*\d+\s*[.)]\s*/, '').replace(/\*\*/g, '').trim();
    const answer = answerLine.match(/\((ক|খ|গ|ঘ|a|b|c|d)\)/i)?.[1]?.toLowerCase();
    const index = ['ক', 'খ', 'গ', 'ঘ', 'a', 'b', 'c', 'd'].indexOf(answer || '');
    return { questionText, options: optionMatches.map((match) => ({ text: match[2].replace(/\*\*/g, '').trim() })), correctOptionIndex: index >= 4 ? index - 4 : index, marks: 1 };
  }).filter(Boolean) as any[];
  if (structuredQuestions.length === expectedCount && structuredQuestions.every((q) => q.questionText && q.options.every((o: any) => o.text))) return structuredQuestions;
  const prompt = `You are a strict MCQ parser. Read the ENTIRE input before answering. Extract exactly ${expectedCount} question occurrences in the original order, including duplicates. Never merge questions and never omit a question. A question starts at a number such as 1., 2., etc. or a clear new question sentence; its four options start with (ক), (খ), (গ), (ঘ) or (a), (b), (c), (d). The answer line starts with Ans, Answer, উত্তর or উত্তর:. Remove only numbering, markdown bold markers and labels; preserve the actual Bangla text. Return JSON only in exactly this shape: {"questions":[{"questionText":"...","options":[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}],"correctOptionIndex":0,"marks":1}]}. correctOptionIndex must map ক/ক or a to 0, খ/b to 1, গ/c to 2, ঘ/d to 3. The array length MUST be exactly ${expectedCount}. Input follows:\n${text}`;
  const request = (model: string) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, responseMimeType: 'application/json' } }) });
  let response = await request(GEMINI_MODEL);
  if (!response.ok && GEMINI_MODEL !== 'gemini-flash-lite-latest') response = await request('gemini-flash-lite-latest');
  if (!response.ok && (response.status === 429 || response.status >= 500)) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    response = await request('gemini-flash-lite-latest');
  }
  if (!response.ok) throw new Error(`Gemini request failed (${response.status})`);
  const payload: any = await response.json();
  const raw = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || '';
  const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim());
  const questions = Array.isArray(parsed) ? parsed : parsed?.questions;
  if (!Array.isArray(questions) || questions.length !== expectedCount) throw new Error(`Gemini ${expectedCount}টির মধ্যে ${Array.isArray(questions) ? questions.length : 0}টি question দিয়েছে।`);
  const normalized = questions.map((q: any) => ({ questionText: String(q.questionText || '').trim(), options: Array.isArray(q.options) ? q.options.slice(0, 4).map((o: any) => ({ text: String(o?.text || '').trim() })) : [], correctOptionIndex: Number(q.correctOptionIndex), marks: Number(q.marks) || 1 }));
  if (normalized.some((q: any) => !q.questionText || q.options.length !== 4 || q.options.some((o: any) => !o.text) || q.correctOptionIndex < 0 || q.correctOptionIndex > 3)) throw new Error('Gemini output invalid.');
  return normalized;
};
