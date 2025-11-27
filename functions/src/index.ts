import * as functions from 'firebase-functions/v1'
import * as admin from 'firebase-admin'

// Lazy init to avoid double-initialization
try { admin.app() } catch { admin.initializeApp() }

// Using dynamic import to avoid bundling issues if SDK isn't installed yet
async function getGenAI() {
  // Prefer runtime env (e.g., from Secret Manager) and fall back to Functions config
  const envKey = process.env.GEMINI_API_KEY
  const config = functions.config()
  const cfgKey: string | undefined = config?.gemini?.key
  const apiKey: string | undefined = envKey || cfgKey
  if (!apiKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Gemini API key not configured. Provide env GEMINI_API_KEY (Secret Manager) or set: firebase functions:config:set gemini.key="YOUR_KEY"'
    )
  }
  const mod = await import("@google/generative-ai")
  const { GoogleGenerativeAI } = mod as typeof import("@google/generative-ai")
  return new GoogleGenerativeAI(apiKey)
}

type CallablePayload = {
  actionType?: string
  projectId?: string
  // legacy
  promptText?: string
  styleOptions?: string[]
  harmonizeOptions?: string[]
  // new structured fields
  style?: string
  sketchDataUrl?: string
  canvasInfluence?: number
  metalColor?: string
  primaryStone?: string
  secondaryStone?: string
  userContext?: string
}

export const generateDesignImage = functions
  .region("asia-south1")
  .runWith({ secrets: ["GEMINI_API_KEY"] })
  .https.onCall(async (data: CallablePayload, context: functions.https.CallableContext) => {
  // TEMP: Allow unauthenticated calls for testing; tag as 'anon'
  // TEMP: unauthenticated testing allowed
  const {
    actionType,
    projectId,
    promptText,
    // legacy fields kept for backward compatibility (ignored)
    styleOptions: _styleOptions = [],
    harmonizeOptions: _harmonizeOptions = [],
    style = 'Temple Jewellery',
    sketchDataUrl = '',
    canvasInfluence = 80,
    metalColor = 'None',
    primaryStone = 'None',
    secondaryStone = 'None',
    userContext = ''
  } = data || {}

  if (!projectId || !actionType) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: actionType, projectId')
  }

  // Compose prompt (verbatim promptText from client, with optional templating)
  function buildStylePrompt(s: string) {
    const baseSketchToRender = `
Render a photorealistic, studio-quality jewelry visualization.
Source Image Interpretation:
- Use the uploaded image as the definitive source for the 3D FORM, SHAPE, and STRUCTURE.
- Fidelity to this form should be ${canvasInfluence}%.
Material & Color Interpretation (CRITICAL HIERARCHY):
1) User Context (highest priority): ${userContext || 'None'}
2) UI Dropdowns:
- metalColor: ${metalColor}
- primaryStone: ${primaryStone}
- secondaryStone: ${secondaryStone}
Rules:
- If a dropdown is NOT 'None', you MUST apply it (override sketch colors).
- Only when a dropdown is 'None', intelligently infer from the sketch.
Material Realism:
- Realistic settings (prongs/bezel/pavé), accurate metallic reflections, proper gemstone faceting/refraction.
Output:
- Plain white background, realistic soft studio shadows.`.trim()

    const prompts: Record<string, string> = {
      'Temple Jewellery': `${baseSketchToRender}

Temple Jewellery (authentic, high‑detail)
- Metal & Finish (RULE OVERRIDE): MUST be 22‑karat yellow gold with antique/reddish‑matte finish (override metalColor).
- Sculptural, chunky, three‑dimensional.
- Traditional techniques: repoussé and granulation.
- Motifs: temple figural/architectural (deities, peacocks, lotuses).
- Gemstones (USER CHOICE): cabochon Kemp; default to cabochon red/green + pearls if unspecified.`.trim(),

      'Jadau Jewellery': `${baseSketchToRender}

Jadau Jewellery (authentic)
- Metal & Finish (RULE OVERRIDE): 22k/24k high‑karat yellow gold, burnished/high‑polish.
- Chilayi engraved gold surfaces around stones.
- Stone Setting (Jadai): CLOSED (Kundan). No prongs. Visible 24k foil lip; stones slightly raised over lac base.
- Gemstones: Polki or cabochon colored stones; reverse side has intricate Meenakari.`.trim(),

      'Polki Open Setting': `${baseSketchToRender}

Polki Open Setting (Vilandi)
- Metal & Finish: modern 18k/22k; if 'None' + no sketch color, default Yellow Gold; bright high‑polish.
- Stones: primary=Polki (uncut, soft glow), secondary=modern brilliant‑cut.
- Setting: OPEN BACK; no lac/foil; thin collet or thin collet + delicate prongs (~6).`.trim(),

      'Kundan Meenakari': `${baseSketchToRender}

Kundan Meenakari
- Metal & Finish (RULE OVERRIDE): 22k/24k high‑karat yellow gold, burnished/high‑polish.
- Front (Kundan): CLOSED setting; no prongs; visible 24k foil lip; stones set into lac base; prefer colored glass/cabochon.
- Reverse (Meenakari): vibrant multi‑color enamel floral/bird patterns.`.trim(),

      'Victorian Jewellery': `${baseSketchToRender}

Indian Victorian
- Metal & Finish: typically 18k; if 'None' + no sketch color, default Yellow Gold; apply antique blackish oxidized finish.
- Stones: primary=Polki (uncut), secondary=modern brilliant‑cut diamonds.
- Setting: NOT Kundan/Jadau; Polki in open‑back thin collet + delicate prongs; brilliant‑cut in modern pavé or bezel.`.trim(),

      'Antique Jewellery': `${baseSketchToRender}

Antique
- Metal & Finish: MUST use user's metalColor; antique/blackish oxidized finish (satin‑like lustre; dark crevices).
- Stones: antique cuts (diamonds=rose/old European; colored stones=deeper vintage coloration).
- Setting: accent in bead/grain; center in heavy antique prongs (claw/fishtail). Vintage/heirloom character.`.trim()
    }

    const legacy = (promptText && promptText.trim()) ? `\n\n${promptText.trim()}` : ''
    return (prompts[s] || baseSketchToRender) + legacy
  }

  const fullPrompt = buildStylePrompt(style)

  // Call Gemini image generation
  const genAI = await getGenAI()
  // Primary: Gemini image-capable model per request
  let buffer: Buffer | null | undefined = null
  let mimeType = 'image/png'

  const tryGeminiImageModel = async (modelName: string) => {
    const model = genAI.getGenerativeModel({ model: modelName })
    let generation
    try {
      const parts: any[] = []
      if (sketchDataUrl && sketchDataUrl.startsWith('data:')) {
        const comma = sketchDataUrl.indexOf(',')
        const mime = sketchDataUrl.substring(sketchDataUrl.indexOf(':') + 1, sketchDataUrl.indexOf(';')) || 'image/png'
        const b64 = sketchDataUrl.substring(comma + 1)
        parts.push({ inlineData: { data: b64, mimeType: mime } })
      }
      parts.push({ text: fullPrompt })

      generation = await model.generateContent({
        contents: [ { role: 'user', parts } ]
      })
    } catch (error) {
      const errObj = error as unknown as {
        message?: string
        statusText?: string
        response?: { error?: { message?: string } }
      }
      const errorMessage = errObj?.response?.error?.message || errObj?.statusText || errObj?.message || `Gemini (${modelName}) image generation failed`
      console.error(`Gemini (${modelName}) image generation failed`, error)
      throw new functions.https.HttpsError('internal', errorMessage, errorMessage)
    }

    type AnyPart = { inlineData?: { data?: string; mimeType?: string }; fileData?: { fileUri?: string; mimeType?: string }; text?: string }
    const candidates = generation.response?.candidates ?? []
    const parts = candidates.flatMap(c => (c.content?.parts as AnyPart[]) ?? [])
    const imagePart = parts.find(p => p.inlineData?.data)
    if (!imagePart?.inlineData?.data) {
      const previewText = typeof generation.response?.text === 'function' ? generation.response.text() : undefined
      console.error(`No image data returned from ${modelName}; preview text:`, previewText)
      throw new functions.https.HttpsError('failed-precondition', `No image data returned from ${modelName}. ${previewText || ''}`.trim())
    }
    mimeType = imagePart.inlineData.mimeType ?? 'image/png'
    buffer = Buffer.from(imagePart.inlineData.data, 'base64')
  }

  // Use only gemini-2.5-flash-image (no fallback). If it returns no image, we surface the preview text.
  await tryGeminiImageModel('gemini-2.5-flash-image')

  if (!buffer || (buffer as Buffer).length === 0) {
    throw new functions.https.HttpsError('internal', 'Generated image was empty')
  }

  // TEMP: Skip Storage. Return data URL directly for testing
  const base64 = (buffer as Buffer).toString('base64')
  const dataUrl = `data:${mimeType};base64,${base64}`
  return { downloadURL: dataUrl }
})

// Aura Assist: Return a short (<= 40 words) expert review based on sketch
export const auraAssist = functions
  .region("asia-south1")
  .runWith({ secrets: ["GEMINI_API_KEY"] })
  .https.onCall(async (data: { sketchDataUrl?: string }, _context) => {
    const { sketchDataUrl } = data || {}

    if (!sketchDataUrl || !sketchDataUrl.startsWith('data:')) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid sketchDataUrl')
    }

    const genAI = await getGenAI()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const inlineData = {
      inlineData: {
        data: sketchDataUrl.split(',')[1],
        mimeType: sketchDataUrl.substring(sketchDataUrl.indexOf(':') + 1, sketchDataUrl.indexOf(';')) || 'image/png'
      }
    }

    const prompt = [
      {
        text:
          'Based on this sketch please share a short up to 40 word review on how this jewellery sketch can further be enhanced. '
          + 'If it already looks good enough say so; you do not have to give improvement suggestions even if the design looks too good, just validate. '
          + 'When you share suggestions to further enhance, always be polite and think like an expert jewellery designer updated on current and past trends and all styles of jewellery.'
      }
    ]

    try {
      const res = await model.generateContent({
        contents: [{ role: 'user', parts: [inlineData as any, ...prompt as any] }]
      })

      const text = typeof res.response?.text === 'function' ? res.response.text() : undefined
      const suggestion = (text || '').trim()
      if (!suggestion) {
        throw new functions.https.HttpsError('failed-precondition', 'Model returned no text suggestion')
      }
      // Optionally trim to ~40 words
      const words = suggestion.split(/\s+/)
      const trimmed = words.length > 40 ? words.slice(0, 40).join(' ') + '…' : suggestion
      return { suggestion: trimmed }
    } catch (error) {
      const errObj = error as { message?: string }
      const msg = errObj?.message || 'Failed to get suggestion'
      throw new functions.https.HttpsError('internal', msg)
    }
  })


