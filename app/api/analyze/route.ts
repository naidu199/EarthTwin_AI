import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

const SYSTEM_PROMPT = `You are EarthTwin AI, a sustainability risk analyst. When given a city name, use Google Search to find real, current data about the city's sustainability challenges.

Research and return a JSON object ONLY — no markdown fences, no extra text, just the raw JSON — with this exact structure:
{
  "city": "full city name",
  "country": "country name",
  "population": "estimated population with unit e.g. 21.8M",
  "risks": {
    "waterScarcity": { "score": 0-100, "level": "Low|Medium|High|Critical", "reason": "one sentence with real data" },
    "airPollution": { "score": 0-100, "level": "Low|Medium|High|Critical", "reason": "one sentence with real AQI or PM2.5 data" },
    "trafficCongestion": { "score": 0-100, "level": "Low|Medium|High|Critical", "reason": "one sentence with congestion index or ranking" },
    "floodRisk": { "score": 0-100, "level": "Low|Medium|High|Critical", "reason": "one sentence citing recent events or risk level" }
  },
  "solutions": [
    { "title": "solution title", "description": "2 sentence actionable recommendation", "sdg": "SDG 6", "icon": "💧", "category": "Clean Water" },
    { "title": "solution title", "description": "2 sentence actionable recommendation", "sdg": "SDG 11", "icon": "🌿", "category": "Sustainable Cities" },
    { "title": "solution title", "description": "2 sentence actionable recommendation", "sdg": "SDG 13", "icon": "🛡️", "category": "Climate Action" }
  ],
  "summary": "2-3 sentence overall sustainability assessment of this city based on the data found."
}

Score rubric: 0-30 = Low risk, 31-60 = Medium risk, 61-80 = High risk, 81-100 = Critical risk.
Use ONLY the levels: Low, Medium, High, or Critical.`

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set. Add it to your .env.local file.' },
        { status: 500 }
      )
    }

    const { cityName } = await req.json()
    if (!cityName?.trim()) {
      return NextResponse.json({ error: 'City name is required.' }, { status: 400 })
    }

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Analyze the sustainability risks for: ${cityName.trim()}` }],
          },
        ],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      }),
    })

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text()
      console.error('Gemini API error:', errBody)
      return NextResponse.json(
        { error: `Gemini API error (${geminiRes.status}). Check your API key and quota.` },
        { status: 502 }
      )
    }

    const geminiData = await geminiRes.json()
    console.log('Gemini raw response:', JSON.stringify(geminiData?.candidates?.[0]?.content?.parts?.map((p: Record<string, unknown>) => Object.keys(p)), null, 2))

    // When Google Search grounding is active, Gemini interleaves text parts with
    // search tool result parts. Filter to only parts that contain a .text string.
    const parts: Array<{ text?: string }> = geminiData?.candidates?.[0]?.content?.parts ?? []
    const rawText: string = parts
      .filter((p) => typeof p.text === 'string' && p.text.trim() !== '')
      .map((p) => p.text as string)
      .join('')
      .trim()

    if (!rawText) {
      console.error('No text parts found in Gemini response. Full parts:', JSON.stringify(parts))
      return NextResponse.json(
        { error: 'No content returned from Gemini. The city may not be recognized.' },
        { status: 422 }
      )
    }

    // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
    const stripped = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    // Extract the outermost JSON object (greedy — handles extra surrounding text)
    const jsonMatch = stripped.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Could not extract JSON from Gemini text:', stripped.slice(0, 500))
      return NextResponse.json(
        { error: 'AI returned an unexpected format. Please try again.' },
        { status: 422 }
      )
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json({ data: parsed })
    } catch (parseErr) {
      console.error('JSON.parse failed on extracted text:', jsonMatch[0].slice(0, 500), parseErr)
      return NextResponse.json(
        { error: 'AI response could not be parsed. Please try again.' },
        { status: 422 }
      )
    }
  } catch (err) {
    console.error('Analyze route error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
