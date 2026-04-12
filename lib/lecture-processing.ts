type GenerationInput = {
  disciplineTitle: string;
  teacherName: string;
  lectureDate: string;
  rawText: string;
  cleanText?: string;
};

type Mentions = {
  books: string[];
  authors: string[];
  films: string[];
  dates: string[];
  terms: string[];
  other: string[];
};

export type GeneratedLecture = {
  generatedTitle: string;
  shortDescription: string;
  fullSummary: string;
  mainOutline: string;
  keyPoints: string[];
  tags: string[];
  mentions: Mentions;
  interestingNotes: string[];
};

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function cleanTranscriptText(text: string) {
  return text
    .replace(/\[(speaker|spk)[^\]]*\]/gi, " ")
    .replace(/\bSPEAKER[_\s-]?\d+\b/gi, " ")
    .replace(/\([^)]*(лек|пр|экз|зачет)[^)]*\)/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([.!?])([А-ЯA-Z])/g, "$1 $2")
    .trim();
}

function splitIntoChunks(text: string, chunkSize = 4500, overlap = 400) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= chunkSize) return [normalized];

  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    const end = Math.min(cursor + chunkSize, normalized.length);
    let cut = end;

    if (end < normalized.length) {
      const dot = normalized.lastIndexOf(".", end);
      const ex = normalized.lastIndexOf("!", end);
      const q = normalized.lastIndexOf("?", end);
      const best = Math.max(dot, ex, q);
      if (best > cursor + Math.floor(chunkSize * 0.6)) {
        cut = best + 1;
      }
    }

    chunks.push(normalized.slice(cursor, cut).trim());
    cursor = Math.max(cut - overlap, cut);
  }

  return chunks.filter(Boolean);
}

function fallbackGenerate(input: GenerationInput): GeneratedLecture {
  const baseText = input.cleanText ?? cleanTranscriptText(input.rawText);
  const sentences = splitSentences(baseText);
  const intro = sentences.slice(0, 2).join(" ") || "Лекция загружена. Добавьте более подробный TXT-транскрипт, чтобы улучшить итоговый конспект.";
  const keyPoints = sentences.slice(0, 6).map((s) => s.slice(0, 170));

  return {
    generatedTitle: `${input.disciplineTitle}: обзорная лекция`,
    shortDescription: intro.slice(0, 240),
    fullSummary: intro,
    mainOutline: [
      "1) Введение в тему",
      "2) Основные идеи и аргументы преподавателя",
      "3) Примеры из лекции",
      "4) Выводы и практические замечания"
    ].join("\n"),
    keyPoints,
    tags: keyPoints
      .slice(0, 4)
      .map((item) => item.split(" ").slice(0, 2).join(" ").toLowerCase()),
    mentions: {
      books: [],
      authors: [],
      films: [],
      dates: [input.lectureDate],
      terms: [],
      other: []
    },
    interestingNotes: sentences.slice(2, 5)
  };
}

function normalizeMentions(raw: unknown): Mentions {
  const base: Mentions = { books: [], authors: [], films: [], dates: [], terms: [], other: [] };
  if (!raw || typeof raw !== "object") return base;
  const source = raw as Record<string, unknown>;

  const toArray = (value: unknown) => (Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);

  return {
    books: toArray(source.books),
    authors: toArray(source.authors),
    films: toArray(source.films),
    dates: toArray(source.dates),
    terms: toArray(source.terms),
    other: toArray(source.other)
  };
}

function normalizeGeneratedResult(raw: unknown, input: GenerationInput): GeneratedLecture {
  if (!raw || typeof raw !== "object") {
    return fallbackGenerate(input);
  }

  const data = raw as Record<string, unknown>;
  const toStringArray = (value: unknown) =>
    Array.isArray(value) ? value.filter((item) => typeof item === "string").map((item) => item.trim()) : [];

  const safeResult: GeneratedLecture = {
    generatedTitle:
      typeof data.generatedTitle === "string" && data.generatedTitle.trim()
        ? data.generatedTitle.trim()
        : `${input.disciplineTitle}: ключевые идеи`,
    shortDescription:
      typeof data.shortDescription === "string" && data.shortDescription.trim()
        ? data.shortDescription.trim()
        : "Краткое описание будет уточнено после ручной правки.",
    fullSummary:
      typeof data.fullSummary === "string" && data.fullSummary.trim()
        ? data.fullSummary.trim()
        : "Система не смогла сгенерировать полное саммари. Откройте исходный текст и обновите запись вручную.",
    mainOutline:
      typeof data.mainOutline === "string" && data.mainOutline.trim()
        ? data.mainOutline.trim()
        : "1) Введение\n2) Ключевые идеи\n3) Выводы",
    keyPoints: toStringArray(data.keyPoints),
    tags: toStringArray(data.tags),
    mentions: normalizeMentions(data.mentions),
    interestingNotes: toStringArray(data.interestingNotes)
  };

  if (safeResult.keyPoints.length === 0) {
    safeResult.keyPoints = fallbackGenerate(input).keyPoints;
  }

  return safeResult;
}

async function callJsonModel(params: {
  apiKey: string;
  model: string;
  url: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(params.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: params.model,
        temperature: params.temperature ?? 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty LLM content");
    }

    return JSON.parse(content) as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

function mergeUnique(items: string[][], limit: number) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const list of items) {
    for (const raw of list) {
      const normalized = raw.trim();
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(normalized);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

function qualityScore(result: GeneratedLecture) {
  let score = 0;
  const penalties = ["speaker_", "[speaker", "ну вот", "линго-ринго", "эээ", "ммм"];
  const lower = `${result.fullSummary}\n${result.keyPoints.join(" ")}`.toLowerCase();

  if (result.fullSummary.length > 900) score += 2;
  if (result.keyPoints.length >= 8) score += 2;
  if (result.mainOutline.split("\n").length >= 4) score += 1;
  if (result.tags.length >= 5) score += 1;
  if (result.interestingNotes.length >= 3) score += 1;
  if (result.mentions.terms.length + result.mentions.authors.length + result.mentions.books.length >= 3) score += 1;

  for (const bad of penalties) {
    if (lower.includes(bad)) score -= 1;
  }
  return score;
}

export async function generateLectureSummary(input: GenerationInput): Promise<GeneratedLecture> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackGenerate(input);
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const chatCompletionsUrl = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const cleanedText = input.cleanText?.trim() ? input.cleanText : cleanTranscriptText(input.rawText);
  const chunks = splitIntoChunks(cleanedText, 4500, 350).slice(0, 12);
  if (!chunks.length) {
    return fallbackGenerate(input);
  }

  const mapSystem = [
    "Ты академический редактор конспектов на русском языке.",
    "Тебе дают фрагмент лекции с шумом транскрибации.",
    "Игнорируй мусор, междометия, повторяющиеся служебные фразы.",
    "Верни только JSON."
  ].join(" ");

  try {
    const chunkSummaries: string[] = [];
    const chunkKeyIdeas: string[][] = [];
    const chunkMentions: string[][] = [];

    for (let i = 0; i < chunks.length; i += 1) {
      const mapUser = `
Контекст лекции:
- Дисциплина: ${input.disciplineTitle}
- Преподаватель: ${input.teacherName}
- Дата: ${input.lectureDate}
- Фрагмент: ${i + 1} из ${chunks.length}

Верни JSON формата:
{
  "chunkSummary": "4-7 плотных предложений по существу",
  "keyIdeas": ["идея 1", "идея 2", "идея 3", "..."],
  "terms": ["ключевые термины, если есть"],
  "possibleMentions": ["книга/автор/термин/дата/фильм при наличии"]
}

Текст фрагмента:
${chunks[i]}
`.trim();

      const chunkResult = await callJsonModel({
        apiKey,
        model,
        url: chatCompletionsUrl,
        systemPrompt: mapSystem,
        userPrompt: mapUser,
        temperature: 0.1
      });

      const chunkSummary =
        typeof chunkResult.chunkSummary === "string" ? chunkResult.chunkSummary.trim() : "";

      if (chunkSummary) {
        chunkSummaries.push(chunkSummary);
      }
      const ideas = Array.isArray(chunkResult.keyIdeas)
        ? chunkResult.keyIdeas.filter((item): item is string => typeof item === "string")
        : [];
      if (ideas.length) {
        chunkKeyIdeas.push(ideas);
      }
      const mentions = Array.isArray(chunkResult.possibleMentions)
        ? chunkResult.possibleMentions.filter((item): item is string => typeof item === "string")
        : [];
      const terms = Array.isArray(chunkResult.terms)
        ? chunkResult.terms.filter((item): item is string => typeof item === "string")
        : [];
      if (mentions.length || terms.length) {
        chunkMentions.push([...terms, ...mentions]);
      }
    }

    const joinedChunkSummary = chunkSummaries.join("\n\n");
    if (!joinedChunkSummary.trim()) {
      return fallbackGenerate(input);
    }

    const reduceSystem = [
      "Ты научный редактор и делаешь итоговый конспект лекции для подготовки к экзамену.",
      "Пиши содержательно и структурно, не выдумывай факты, которых нет в исходном материале.",
      "Убери технический шум транскрибации.",
      "Верни строго JSON."
    ].join(" ");

    const reduceUser = `
Контекст:
- Дисциплина: ${input.disciplineTitle}
- Преподаватель: ${input.teacherName}
- Дата: ${input.lectureDate}

На основе сводок фрагментов собери ИТОГОВЫЙ конспект.

Формат JSON:
{
  "generatedTitle": "краткий точный заголовок",
  "shortDescription": "1-2 предложения",
  "fullSummary": "глубокое саммари 6-10 абзацев",
  "mainOutline": "структура с подзаголовками",
  "keyPoints": ["8-16 тезисов"],
  "tags": ["6-12 терминов/ключевых слов"],
  "mentions": {
    "books": [],
    "authors": [],
    "films": [],
    "dates": [],
    "terms": [],
    "other": []
  },
  "interestingNotes": ["4-10 содержательных наблюдений"]
}

Сводки фрагментов:
${joinedChunkSummary}

Ключевые идеи из фрагментов:
${mergeUnique(chunkKeyIdeas, 40).join("\n")}

Предварительные упоминания:
${mergeUnique(chunkMentions, 60).join("\n")}
`.trim();

    const finalResult = await callJsonModel({
      apiKey,
      model,
      url: chatCompletionsUrl,
      systemPrompt: reduceSystem,
      userPrompt: reduceUser,
      temperature: 0.15
    });

    const normalized = normalizeGeneratedResult(finalResult, { ...input, cleanText: cleanedText });
    const score = qualityScore(normalized);
    if (score < 3) {
      return fallbackGenerate({ ...input, cleanText: cleanedText });
    }
    return normalized;
  } catch (error) {
    console.error("[lecture-processing] generation failed", error);
    return fallbackGenerate({ ...input, cleanText: cleanedText });
  }
}
