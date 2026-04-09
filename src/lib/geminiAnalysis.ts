// ── Integração Gemini 2.0 Flash (gratuito via Google AI Studio) ──────────
// Documentação: https://ai.google.dev/gemini-api/docs
//
// Setup:
//   1. Acesse https://aistudio.google.com/app/apikey
//   2. Crie uma chave gratuita
//   3. Adicione ao .env.local: VITE_GEMINI_API_KEY=sua_chave

import { useState } from 'react'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

// ── Tipos ─────────────────────────────────────────────────────────────────

export type SkinAnalysisInput = {
  products: {
    name: string
    brand: string
    category: string
    actives: string[]
    usageFrequency: number   // usos nos últimos 30 dias
    period: 'manha' | 'noite' | 'ambos'
  }[]
  skinNotes: {             // notas do usage_log dos últimos 30 dias
    date: string
    notes: string
  }[]
  photos?: {               // fotos do skin_progress (base64 ou URL pública)
    date: string
    angle: 'frontal' | 'esquerdo' | 'direito'
    base64?: string        // se usar base64
    url?: string           // se usar URL pública do Supabase Storage
  }[]
  daysSinceStart: number   // dias desde o início da rotina atual
}

export type GeminiSuggestion = {
  type: 'increase' | 'reduce' | 'maintain' | 'avoid' | 'add'
  product?: string
  explanation: string
  priority: 'high' | 'medium' | 'low'
}

export type SkinAnalysisResult = {
  overallAssessment: string          // avaliação geral (1 parágrafo)
  skinReaction: 'positive' | 'neutral' | 'negative' | 'mixed'
  suggestions: GeminiSuggestion[]
  conflictsDetected: string[]        // conflitos identificados pela IA
  nextCheckInDays: number            // quando reavaliar (ex: 14)
  rawResponse?: string               // resposta bruta para debug
}

// ── Monta o prompt estruturado ────────────────────────────────────────────

function buildPrompt(input: SkinAnalysisInput): string {
  const productList = input.products
    .map((p) =>
      `- ${p.name} (${p.brand}) | Categoria: ${p.category} | Ativos: ${p.actives.join(', ') || 'não informado'} | Período: ${p.period} | Usos últimos 30 dias: ${p.usageFrequency}`
    )
    .join('\n')

  const notesList = input.skinNotes.length > 0
    ? input.skinNotes.map((n) => `[${n.date}] ${n.notes}`).join('\n')
    : 'Nenhuma nota registrada.'

  return `Você é uma dermatologista especializada em cosmética e skincare. Analise a rotina de cuidados com a pele abaixo e forneça recomendações precisas.

CONTEXTO:
- Dias de rotina ativa: ${input.daysSinceStart}
- Número de produtos em uso: ${input.products.length}
${input.photos && input.photos.length > 0 ? `- Fotos de evolução anexadas: ${input.photos.length} foto(s)` : '- Sem fotos de evolução anexadas'}
- Atenção especial ao campo "Período". Produtos com conflito de pH ou potencial de irritação (como AHA e Retinol) podem estar na mesma rotina, o que é um erro se usados no mesmo período (ex: ambos à noite), mas é aceitável se separados (ex: um de manhã, outro à noite). Analise essa separação antes de apontar conflitos.

PRODUTOS EM USO:
${productList}

NOTAS DE SENSIBILIDADE (últimos 30 dias):
${notesList}

INSTRUÇÕES:
Responda seguindo exatamente este schema JSON:

{
  "overallAssessment": "string — avaliação geral em 2-3 frases, tom amigável e encorajador",
  "skinReaction": "positive | neutral | negative | mixed",
  "suggestions": [
    {
      "type": "increase | reduce | maintain | avoid | add",
      "product": "nome do produto ou ativo (opcional)",
      "explanation": "explicação clara em 1-2 frases",
      "priority": "high | medium | low"
    }
  ],
  "conflictsDetected": ["string — descreva cada conflito identificado, considerando o período de uso"],
  "nextCheckInDays": number
}

Seja específica, baseie-se nos ativos e nas notas. Se houver fotos, descreva o que observou na pele. Limite a 5 sugestões no máximo.`
}

// ── Monta partes da requisição com ou sem imagens ─────────────────────────

function buildRequestParts(input: SkinAnalysisInput) {
  const textPart = { text: buildPrompt(input) }

  if (!input.photos || input.photos.length === 0) {
    return [textPart]
  }

  const imageParts = input.photos
    .filter((p) => p.base64)
    .map((p) => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: p.base64!.replace(/^data:image\/\w+;base64,/, ''),
      },
    }))

  return [...imageParts, textPart]
}

// ── Chamada à API Gemini ──────────────────────────────────────────────────

async function callGemini(input: SkinAnalysisInput): Promise<SkinAnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY não configurada no .env.local')

  const parts = buildRequestParts(input)

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.4,       // mais determinístico para recomendações médicas
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Gemini API error: ${err.error?.message ?? response.statusText}`)
  }

  const data = await response.json()
  const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  try {
    // responseMimeType: 'application/json' garante JSON puro — parse direto
    const parsed = JSON.parse(rawText) as SkinAnalysisResult
    return { ...parsed, rawResponse: rawText }
  } catch {
    throw new Error(`Resposta inválida do Gemini: ${rawText.slice(0, 200)}`)
  }
}

// ── Hook React ────────────────────────────────────────────────────────────

type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: SkinAnalysisResult }
  | { status: 'error'; message: string }

export function useGeminiAnalysis() {
  const [state, setState] = useState<AnalysisState>({ status: 'idle' })

  async function analyze(input: SkinAnalysisInput) {
    setState({ status: 'loading' })
    try {
      const result = await callGemini(input)
      setState({ status: 'success', result })
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }

  function reset() {
    setState({ status: 'idle' })
  }

  return { state, analyze, reset }
}
