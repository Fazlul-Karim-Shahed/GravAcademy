const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

export const formatBulkMcqWithGemini = async (text: string): Promise<any[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key এখনো configure করা হয়নি।');
  const numberedCount = (text.match(/^\s*(?:\d+\s*[.)]|প্রশ্ন\s*\d+\s*[.:)])/gim) || []).length;
  const expectedCount = numberedCount || text.split(/\n\s*\n+/).filter((block) => block.trim()).length;
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
