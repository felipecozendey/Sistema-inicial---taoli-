import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * AI PROXY GATEWAY (Fase 1 / Contrato para Fase 2)
 *
 * Contrato de chamada para integrações futuras (Fase 2):
 * supabase.functions.invoke('ai-proxy', {
 *   body: {
 *     provider?: 'openai' | 'gemini' | 'anthropic', // Opcional (usa o provedor ativo padrão)
 *     model?: string,                               // Opcional (usa o default_model do provedor)
 *     feature: string,                              // Obrigatório (ex.: 'resumo_prontuario', 'gerar_treino', etc.)
 *     prompt?: string,                              // Texto simples de prompt OU
 *     messages?: Array<{ role: 'system'|'user'|'assistant', content: string }>, // Formato chat
 *     max_tokens?: number,                          // Opcional
 *     temperature?: number                          // Opcional
 *   }
 * })
 * Retorno em caso de sucesso:
 * {
 *   ok: true,
 *   data: {
 *     content: string,
 *     provider: string,
 *     model: string,
 *     usage: {
 *       prompt_tokens: number,
 *       completion_tokens: number,
 *       total_tokens: number,
 *       cost_usd: number
 *     }
 *   }
 * }
 * Retorno em caso de erro / quota excedida:
 * { ok: false, error: string, code?: string }
 *
 * Ação administrativa para teste de chave:
 * { action: 'test_key', provider: 'openai' | 'gemini' | 'anthropic', api_key?: string }
 * Somente Master pode executar 'test_key'. Se 'api_key' for enviada no corpo, testa ela antes de salvar.
 * Se não for enviada, usa a que já está gravada em ai_provider_settings.
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AiProxyPayload {
  action?: 'invoke' | 'test_key'
  provider?: 'openai' | 'gemini' | 'anthropic'
  model?: string
  feature?: string
  prompt?: string
  messages?: ChatMessage[]
  max_tokens?: number
  temperature?: number
  api_key?: string // Apenas para action: 'test_key' executada pelo Master
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Variáveis de ambiente do backend não configuradas.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Autenticação necessária para acessar a IA.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Client autenticado do usuário chamador
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: callerUser },
      error: authError,
    } = await callerClient.auth.getUser()

    if (authError || !callerUser) {
      return new Response(JSON.stringify({ ok: false, error: 'Sessão inválida ou expirada.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Client com Service Role para ler configurações de provedores e gravar logs
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Obter perfil do usuário chamador para checagens de role e pro
    const { data: userProfile } = await adminClient
      .from('profiles')
      .select('id, role, is_professional, status')
      .eq('id', callerUser.id)
      .maybeSingle()

    const isMaster = userProfile?.role === 'master'
    const isPro = Boolean(userProfile?.is_professional || isMaster)

    if (userProfile?.status === 'suspended') {
      return new Response(JSON.stringify({ ok: false, error: 'Sua conta está suspensa.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let payload: AiProxyPayload
    try {
      payload = await req.json()
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'JSON inválido na requisição.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // -------------------------------------------------------------
    // ACTION: TEST_KEY (Apenas para Master validar chave de API)
    // -------------------------------------------------------------
    if (payload.action === 'test_key') {
      if (!isMaster) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Apenas usuários Master podem testar chaves de IA.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const targetProvider = payload.provider || 'openai'

      // Buscar configuração do provedor
      const { data: provData, error: provErr } = await adminClient
        .from('ai_provider_settings')
        .select('*')
        .eq('provider', targetProvider)
        .maybeSingle()

      if (provErr || !provData) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: `Configuração do provedor ${targetProvider} não encontrada.`,
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const apiKeyToTest =
        payload.api_key && payload.api_key.trim().length > 0
          ? payload.api_key.trim()
          : provData.api_key_encrypted

      if (!apiKeyToTest) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: `Nenhuma chave de API fornecida ou cadastrada para ${targetProvider}.`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Executa chamada mínima de teste
      const testModel = payload.model || provData.default_model
      const testResult = await executeProviderCall({
        provider: targetProvider,
        apiKey: apiKeyToTest,
        baseUrl: provData.base_url,
        model: testModel,
        messages: [{ role: 'user', content: 'Responda apenas: OK' }],
        maxTokens: 5,
        temperature: 0.1,
      })

      if (!testResult.ok) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: testResult.error || 'Falha ao testar conexão com o provedor.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      return new Response(
        JSON.stringify({
          ok: true,
          message: `Chave do ${provData.display_name} validada com sucesso! Provedor respondeu corretamente.`,
          data: {
            content: testResult.content,
            provider: targetProvider,
            model: testModel,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // -------------------------------------------------------------
    // ACTION: INVOKE (Gateway normal de IA)
    // -------------------------------------------------------------
    // 1. Validar ai_config global
    const { data: aiConfig, error: configError } = await adminClient
      .from('ai_config')
      .select('*')
      .eq('id', 'default')
      .maybeSingle()

    if (configError || !aiConfig) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Configuração global de IA não localizada.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Valida se a IA está ativa globalmente no app
    if (!aiConfig.ai_enabled) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: 'AI_DISABLED',
          error:
            'Os recursos de Inteligência Artificial estão temporariamente desativados pela moderação.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 2. Validar feature solicitada
    const featureKey = payload.feature?.trim()
    if (!featureKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'O parâmetro "feature" é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const featuresMap = (aiConfig.features_enabled || {}) as Record<
      string,
      { common?: boolean; pro?: boolean } | boolean
    >
    const featConfig = featuresMap[featureKey]

    let isFeatureAllowed = false
    if (typeof featConfig === 'boolean') {
      isFeatureAllowed = featConfig
    } else if (featConfig && typeof featConfig === 'object') {
      isFeatureAllowed = isPro ? Boolean(featConfig.pro) : Boolean(featConfig.common)
    }

    if (!isFeatureAllowed) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: 'FEATURE_DISABLED',
          error: isPro
            ? `O recurso de IA "${featureKey}" está desativado para o seu perfil no momento.`
            : `O recurso de IA "${featureKey}" está disponível apenas para assinantes Pro ou desativado.`,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 3. Determinar provedor e buscar credenciais
    let chosenProvider = payload.provider
    let providerRow: any = null

    if (chosenProvider) {
      const { data: pRow } = await adminClient
        .from('ai_provider_settings')
        .select('*')
        .eq('provider', chosenProvider)
        .maybeSingle()
      providerRow = pRow
    } else {
      // Procura o primeiro provedor habilitado com chave configurada
      const { data: activeList } = await adminClient
        .from('ai_provider_settings')
        .select('*')
        .eq('enabled', true)
        .not('api_key_encrypted', 'is', null)

      if (activeList && activeList.length > 0) {
        providerRow = activeList[0]
        chosenProvider = providerRow.provider
      }
    }

    if (!providerRow || !providerRow.enabled || !providerRow.api_key_encrypted) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: 'NO_PROVIDER_AVAILABLE',
          error: 'Nenhum provedor de IA ativo e configurado com chave válida.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 4. Validar Quotas do Usuário (diária e mensal)
    const dailyLimit = isPro ? aiConfig.quota_pro_daily : aiConfig.quota_common_daily
    const monthlyLimit = isPro ? aiConfig.quota_pro_monthly : aiConfig.quota_common_monthly

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Contar requisições do dia
    const { count: dailyCount } = await adminClient
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', callerUser.id)
      .eq('status', 'success')
      .gte('created_at', startOfDay)

    if (dailyLimit > 0 && (dailyCount ?? 0) >= dailyLimit) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: 'QUOTA_EXCEEDED_DAILY',
          error: `Você atingiu seu limite diário de ${dailyLimit} requisições de IA. Tente novamente amanhã!`,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Contar requisições do mês
    const { count: monthlyCount } = await adminClient
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', callerUser.id)
      .eq('status', 'success')
      .gte('created_at', startOfMonth)

    if (monthlyLimit > 0 && (monthlyCount ?? 0) >= monthlyLimit) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: 'QUOTA_EXCEEDED_MONTHLY',
          error: `Você atingiu seu limite mensal de ${monthlyLimit} requisições de IA. O limite se renovará no próximo mês.`,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 5. Montar mensagens para o provedor
    let messages: ChatMessage[] = []
    if (payload.messages && Array.isArray(payload.messages) && payload.messages.length > 0) {
      messages = payload.messages
    } else if (payload.prompt && payload.prompt.trim().length > 0) {
      messages = [{ role: 'user', content: payload.prompt.trim() }]
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: 'Prompt ou messages não fornecido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const modelToUse = payload.model || providerRow.default_model

    // 6. Chamar provedor
    const callResult = await executeProviderCall({
      provider: providerRow.provider,
      apiKey: providerRow.api_key_encrypted,
      baseUrl: providerRow.base_url,
      model: modelToUse,
      messages,
      maxTokens: payload.max_tokens,
      temperature: payload.temperature,
    })

    // 7. Calcular custo estimado a partir de ai_pricing
    let costUsd = 0
    if (callResult.ok) {
      const { data: pricingRow } = await adminClient
        .from('ai_pricing')
        .select('*')
        .eq('provider', providerRow.provider)
        .eq('model', modelToUse)
        .maybeSingle()

      if (pricingRow) {
        const inCost =
          ((callResult.usage?.prompt_tokens || 0) / 1000) * Number(pricingRow.input_usd_per_1k || 0)
        const outCost =
          ((callResult.usage?.completion_tokens || 0) / 1000) *
          Number(pricingRow.output_usd_per_1k || 0)
        costUsd = Number((inCost + outCost).toFixed(6))
      }
    }

    // 8. Gravar log em ai_usage_logs (sucesso ou erro)
    await adminClient.from('ai_usage_logs').insert({
      user_id: callerUser.id,
      provider: providerRow.provider,
      model: modelToUse,
      feature: featureKey,
      prompt_tokens: callResult.usage?.prompt_tokens || 0,
      completion_tokens: callResult.usage?.completion_tokens || 0,
      total_tokens: callResult.usage?.total_tokens || 0,
      cost_usd: costUsd,
      status: callResult.ok ? 'success' : 'error',
      error_message: callResult.ok ? null : callResult.error,
    })

    if (!callResult.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: callResult.error || 'Erro ao processar chamada com o provedor de IA.',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          content: callResult.content,
          provider: providerRow.provider,
          model: modelToUse,
          usage: {
            prompt_tokens: callResult.usage?.prompt_tokens || 0,
            completion_tokens: callResult.usage?.completion_tokens || 0,
            total_tokens: callResult.usage?.total_tokens || 0,
            cost_usd: costUsd,
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || 'Erro inesperado no servidor de IA.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

// -------------------------------------------------------------
// ADAPTERS PARA OS TRÊS PROVEDORES
// -------------------------------------------------------------

interface ProviderCallParams {
  provider: 'openai' | 'gemini' | 'anthropic'
  apiKey: string
  baseUrl: string
  model: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}

interface ProviderCallResult {
  ok: boolean
  content?: string
  error?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

async function executeProviderCall(params: ProviderCallParams): Promise<ProviderCallResult> {
  const { provider, apiKey, baseUrl, model, messages, maxTokens, temperature } = params

  if (provider === 'openai') {
    return await callOpenAi({ baseUrl, apiKey, model, messages, maxTokens, temperature })
  } else if (provider === 'gemini') {
    return await callGemini({ baseUrl, apiKey, model, messages, maxTokens, temperature })
  } else if (provider === 'anthropic') {
    return await callAnthropic({ baseUrl, apiKey, model, messages, maxTokens, temperature })
  }

  return { ok: false, error: `Provedor desconhecido: ${provider}` }
}

/** OpenAI Chat Completions API */
async function callOpenAi(params: {
  baseUrl: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}): Promise<ProviderCallResult> {
  try {
    const url = `${params.baseUrl.replace(/\/+$/, '')}/chat/completions`
    const body: Record<string, any> = {
      model: params.model,
      messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
    }
    if (params.maxTokens) body.max_tokens = params.maxTokens
    if (typeof params.temperature === 'number') body.temperature = params.temperature

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const json = await res.json()
    if (!res.ok) {
      return {
        ok: false,
        error: json?.error?.message || `OpenAI retornou erro HTTP ${res.status}`,
      }
    }

    const content = json.choices?.[0]?.message?.content || ''
    const usage = json.usage || {}

    return {
      ok: true,
      content,
      usage: {
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens:
          usage.total_tokens || (usage.prompt_tokens || 0) + (usage.completion_tokens || 0),
      },
    }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Falha de comunicação com OpenAI' }
  }
}

/** Google Gemini API (generateContent) */
async function callGemini(params: {
  baseUrl: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}): Promise<ProviderCallResult> {
  try {
    // URL padrão Gemini: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
    const cleanBase = params.baseUrl.replace(/\/+$/, '')
    const url = `${cleanBase}/models/${params.model}:generateContent?key=${encodeURIComponent(params.apiKey)}`

    // Separar system instructions e converter messages para o formato contents do Gemini
    const systemInstruction = params.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n')

    const contents = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Olá' }] })
    }

    const body: Record<string, any> = { contents }
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] }
    }

    const generationConfig: Record<string, any> = {}
    if (params.maxTokens) generationConfig.maxOutputTokens = params.maxTokens
    if (typeof params.temperature === 'number') generationConfig.temperature = params.temperature
    if (Object.keys(generationConfig).length > 0) {
      body.generationConfig = generationConfig
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const json = await res.json()
    if (!res.ok) {
      return {
        ok: false,
        error: json?.error?.message || `Gemini retornou erro HTTP ${res.status}`,
      }
    }

    const candidate = json.candidates?.[0]
    const content = candidate?.content?.parts?.map((p: any) => p.text || '').join('') || ''
    const usageMetadata = json.usageMetadata || {}

    return {
      ok: true,
      content,
      usage: {
        prompt_tokens: usageMetadata.promptTokenCount || 0,
        completion_tokens: usageMetadata.candidatesTokenCount || 0,
        total_tokens:
          usageMetadata.totalTokenCount ||
          (usageMetadata.promptTokenCount || 0) + (usageMetadata.candidatesTokenCount || 0),
      },
    }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Falha de comunicação com Gemini' }
  }
}

/** Anthropic Messages API */
async function callAnthropic(params: {
  baseUrl: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}): Promise<ProviderCallResult> {
  try {
    const url = `${params.baseUrl.replace(/\/+$/, '')}/messages`

    const systemPrompt = params.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n')

    const userAndAssistant = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))

    if (userAndAssistant.length === 0) {
      userAndAssistant.push({ role: 'user', content: 'Olá' })
    }

    const body: Record<string, any> = {
      model: params.model,
      messages: userAndAssistant,
      max_tokens: params.maxTokens || 1024,
    }
    if (systemPrompt) body.system = systemPrompt
    if (typeof params.temperature === 'number') body.temperature = params.temperature

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': params.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const json = await res.json()
    if (!res.ok) {
      return {
        ok: false,
        error: json?.error?.message || `Anthropic retornou erro HTTP ${res.status}`,
      }
    }

    const content =
      json.content
        ?.filter((c: any) => c.type === 'text')
        ?.map((c: any) => c.text || '')
        ?.join('') || ''

    const usage = json.usage || {}

    return {
      ok: true,
      content,
      usage: {
        prompt_tokens: usage.input_tokens || 0,
        completion_tokens: usage.output_tokens || 0,
        total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
      },
    }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Falha de comunicação com Anthropic' }
  }
}
