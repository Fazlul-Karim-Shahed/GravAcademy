const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

export const formatBulkMcqWithGemini = async (text: string): Promise<any[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key এখনো configure করা হয়নি।');
  const numberedCount = (text.match(/^\s*(?:\d+\s*[.)]|প্রশ্ন\s*\d+\s*[.:)])/gim) || []).length;
  const expectedCount = numberedCount || text.split(/\n\s*\n+/).filter((block) => block.trim()).length;
  const prompt = `Return JSON only with exactly ${expectedCount} question objects. Preserve every question occurrence in order, including duplicates. Each object needs questionText, exactly 4 options with text, correctOptionIndex (0-3), and marks. Preserve Bangla and use given answers. Input:\n${text}`;
  const request = (model: string) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, responseMimeType: 'application/json' } }) });
  let response = await request(GEMINI_MODEL);
  if (!response.ok && GEMINI_MODEL !== 'gemini-flash-lite-latest') response = await request('gemini-flash-lite-latest');
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
