import { GoogleGenerativeAI } from "@google/generative-ai";

type LogContext = "WordGen" | "Guess";

export async function callAIProvider<T>(prompt: string, context: LogContext): Promise<T> {
  const logPrefix = context === "WordGen" ? "[contextle]" : "[contextle][Guess]";

  // ── TIER 1: GOOGLE GEMINI ───────────────────────────────────────────
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    let attempts = 0;
    while (attempts < 2) {
      try {
        console.log(`${logPrefix} Tier 1 Gemini... (Attempt ${attempts + 1})`);
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
          systemInstruction: `You are a JSON API.
Return only valid JSON.
Never return markdown.
Never return explanations.
Never return code fences.`,
        });

        const result = await model.generateContent(prompt, { timeout: 8000 });
        const rawText = result.response.text().trim();
        console.log(`${logPrefix} Tier 1 Gemini raw response:`, rawText);

        const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        const parsed = JSON.parse(jsonText);
        console.log(`${logPrefix} Tier 1 Gemini parsed JSON:`, parsed);
        return parsed as T;
      } catch (error: any) {
        attempts++;
        console.warn(`${logPrefix} Tier 1 Gemini attempt ${attempts} failed.`, error.message);
        if (error.message && (error.message.includes("429") || error.message.includes("503") || error.message.includes("Quota") || error.message.includes("exhausted"))) {
          console.warn(`${logPrefix} Gemini capacity/quota exhausted. Fast-failing to Tier 2.`);
          break;
        }
      }
    }
  }

  // ── TIER 2: GROQ ────────────────────────────────────────────────────
  const groqApiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  if (groqApiKey) {
    let attempts = 0;
    while (attempts < 2) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        console.log(`${logPrefix} Tier 2 Groq... (Attempt ${attempts + 1})`);
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqApiKey}` },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "You are an API. Return ONLY a valid raw JSON object matching the requested schema. Never return markdown blocks, explanations, or code fences." },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Groq API returned status ${response.status}`);
        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content?.trim();
        if (!rawText) throw new Error("Groq API returned empty content.");
        console.log(`${logPrefix} Tier 2 Groq raw response:`, rawText);
        
        const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        const parsed = JSON.parse(jsonText);
        console.log(`${logPrefix} Tier 2 Groq parsed JSON:`, parsed);
        return parsed as T;
      } catch (error: any) {
        attempts++;
        console.warn(`${logPrefix} Tier 2 Groq attempt ${attempts} failed.`, error.message);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  // ── TIER 3: SAMBANOVA ───────────────────────────────────────────────
  const sambaNovaApiKey = process.env.SAMBANOVA_API_KEY;
  if (sambaNovaApiKey) {
    let attempts = 0;
    while (attempts < 2) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        console.log(`${logPrefix} Tier 3 SambaNova... (Attempt ${attempts + 1})`);
        const response = await fetch("https://api.sambanova.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sambaNovaApiKey}` },
          body: JSON.stringify({
            model: "Meta-Llama-3.1-70B-Instruct",
            messages: [
              { role: "system", content: "You are an API. Return ONLY a valid raw JSON object matching the requested schema. Never return markdown blocks, explanations, or code fences." },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`SambaNova API returned status ${response.status}`);
        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content?.trim();
        if (!rawText) throw new Error("SambaNova API returned empty content.");
        console.log(`${logPrefix} Tier 3 SambaNova raw response:`, rawText);
        
        const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        const parsed = JSON.parse(jsonText);
        console.log(`${logPrefix} Tier 3 SambaNova parsed JSON:`, parsed);
        return parsed as T;
      } catch (error: any) {
        attempts++;
        console.warn(`${logPrefix} Tier 3 SambaNova attempt ${attempts} failed.`, error.message);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  // ── TIER 4: CEREBRAS ────────────────────────────────────────────────
  const cerebrasApiKey = process.env.CEREBRAS_API_KEY;
  if (cerebrasApiKey) {
    let attempts = 0;
    while (attempts < 2) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        console.log(`${logPrefix} Tier 4 Cerebras... (Attempt ${attempts + 1})`);
        const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cerebrasApiKey}` },
          body: JSON.stringify({
            model: "llama3.1-70b",
            messages: [
              { role: "system", content: "You are an API. Return ONLY a valid raw JSON object matching the requested schema. Never return markdown blocks, explanations, or code fences." },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Cerebras API returned status ${response.status}`);
        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content?.trim();
        if (!rawText) throw new Error("Cerebras API returned empty content.");
        console.log(`${logPrefix} Tier 4 Cerebras raw response:`, rawText);
        
        const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        const parsed = JSON.parse(jsonText);
        console.log(`${logPrefix} Tier 4 Cerebras parsed JSON:`, parsed);
        return parsed as T;
      } catch (error: any) {
        attempts++;
        console.warn(`${logPrefix} Tier 4 Cerebras attempt ${attempts} failed.`, error.message);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  throw new Error("All AI providers exhausted.");
}
