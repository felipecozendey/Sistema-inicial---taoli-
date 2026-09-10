import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ManageUsersRequest {
  action:
    | 'create_user'
    | 'delete_user'
    | 'suspend_user'
    | 'reactivate_user'
    | 'set_role'
    | 'update_user'
    | 'reset_password'
    | 'send_password_email'
    | 'resend_confirmation'
    | 'get_user_details'
    | 'set_user_override'
    | 'check_email_provider'
  email?: string
  display_name?: string
  password?: string | null
  send_email?: boolean
  user_id?: string
  target_user_id?: string
  role?: 'master' | 'user'
  status?: 'active' | 'suspended'
  feature_key?: string
  enabled?: boolean
}

function generateStrongPassword(length = 16): string {
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const numbers = '23456789'
  const symbols = '!@#$%^&*()_+~|}{[]:;?><,.-='
  const all = lowercase + uppercase + numbers + symbols

  let pwd = ''
  pwd += lowercase[Math.floor(Math.random() * lowercase.length)]
  pwd += uppercase[Math.floor(Math.random() * uppercase.length)]
  pwd += numbers[Math.floor(Math.random() * numbers.length)]
  pwd += symbols[Math.floor(Math.random() * symbols.length)]

  for (let i = 4; i < length; i++) {
    pwd += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle
  return pwd
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Variáveis de ambiente do servidor não configuradas.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: 'Token de autorização ausente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Authenticated caller client
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: callerUser },
      error: userAuthError,
    } = await callerClient.auth.getUser()

    if (userAuthError || !callerUser) {
      return new Response(JSON.stringify({ ok: false, error: 'Sessão inválida ou expirada.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if caller is master
    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, email, role, status')
      .eq('id', callerUser.id)
      .single()

    if (profileError || !callerProfile || callerProfile.role !== 'master') {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Acesso negado: apenas usuários Master podem executar esta ação.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (callerProfile.status === 'suspended') {
      return new Response(JSON.stringify({ ok: false, error: 'Conta do solicitante suspensa.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: ManageUsersRequest = await req.json()
    const { action } = body

    // ACTION: CHECK EMAIL PROVIDER
    if (action === 'check_email_provider') {
      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            has_email_provider: Boolean(resendApiKey),
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Helper to send email via Resend if available
    const sendResendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
      if (!resendApiKey) return false
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'VibeCoding <nao-responda@resend.dev>',
            to: [to],
            subject,
            html,
          }),
        })
        return res.ok
      } catch {
        return false
      }
    }

    // ACTION: CREATE USER
    if (action === 'create_user') {
      const email = body.email?.trim().toLowerCase()
      const displayName = body.display_name?.trim() || null
      let password = body.password?.trim() || null
      const sendEmail = Boolean(body.send_email)
      let passwordGenerated = false

      if (!email || !email.includes('@')) {
        return new Response(JSON.stringify({ ok: false, error: 'E-mail inválido.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!password) {
        password = generateStrongPassword(16)
        passwordGenerated = true
      } else if (password.length < 8) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'A senha informada deve ter no mínimo 8 caracteres.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Check if user already exists
      const { data: existingUser } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle()

      if (existingUser) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Já existe um usuário cadastrado com este e-mail.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Create user via Admin API
      const { data: createdUserData, error: createError } = await adminClient.auth.admin.createUser(
        {
          email,
          password,
          email_confirm: !sendEmail || !resendApiKey, // Auto-confirm if no email provider is configured
          user_metadata: {
            name: displayName || email.split('@')[0],
            display_name: displayName || email.split('@')[0],
          },
        },
      )

      if (createError || !createdUserData.user) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: createError?.message || 'Falha ao criar usuário no sistema de autenticação.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const newUserId = createdUserData.user.id

      // Upsert profile
      const { data: newProfile } = await adminClient
        .from('profiles')
        .upsert({
          id: newUserId,
          email,
          display_name: displayName || email.split('@')[0],
          role: 'user',
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      // If email provider exists and sendEmail requested, send email
      let emailSent = false
      if (sendEmail && resendApiKey) {
        emailSent = await sendResendEmail(
          email,
          'Bem-vindo ao VibeCoding Tarefas!',
          `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Olá${displayName ? `, ${displayName}` : ''}!</h2>
              <p>Sua conta no VibeCoding Tarefas foi criada por um administrador.</p>
              <p><strong>E-mail:</strong> ${email}</p>
              <p><strong>Senha temporária:</strong> <code>${password}</code></p>
              <p>Recomendamos alterar sua senha após o primeiro acesso.</p>
            </div>
          `,
        )
      }

      // Audit log
      await adminClient.from('admin_audit_logs').insert({
        actor_id: callerUser.id,
        actor_email: callerUser.email,
        action: 'create_user',
        target_user_id: newUserId,
        target_email: email,
        details: {
          display_name: displayName,
          send_email: sendEmail,
          email_sent: emailSent,
          password_generated: passwordGenerated,
          has_email_provider: Boolean(resendApiKey),
        },
      })

      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            user: newProfile || {
              id: newUserId,
              email,
              display_name: displayName,
              role: 'user',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            password_generated: passwordGenerated,
            generated_password: !resendApiKey || passwordGenerated ? password : null,
            email_sent: emailSent,
            has_email_provider: Boolean(resendApiKey),
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ACTION: UPDATE USER (Profile data: display_name, email, role, status)
    if (action === 'update_user') {
      const targetUserId = body.user_id || body.target_user_id
      const newEmail = body.email ? body.email.trim().toLowerCase() : undefined
      const newDisplayName = body.display_name !== undefined ? body.display_name.trim() : undefined
      const newRole = body.role
      const newStatus = body.status

      if (!targetUserId) {
        return new Response(JSON.stringify({ ok: false, error: 'ID do usuário obrigatório.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch existing profile
      const { data: targetProfile, error: targetError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle()

      if (targetError || !targetProfile) {
        return new Response(JSON.stringify({ ok: false, error: 'Usuário não encontrado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check self-demotion / self-suspension
      const isSelf = targetUserId === callerUser.id
      if (isSelf && newRole === 'user' && targetProfile.role === 'master') {
        return new Response(
          JSON.stringify({
            ok: false,
            error:
              'Auto-rebaixamento bloqueado: você não pode revogar seu próprio papel de Master.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      if (isSelf && newStatus === 'suspended') {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'Auto-suspensão bloqueada: você não pode suspender sua própria conta.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const auditChanges: Record<string, unknown> = {}

      // 1. If email changed: update auth.users and profiles
      if (newEmail && newEmail !== targetProfile.email) {
        const { error: authEmailErr } = await adminClient.auth.admin.updateUserById(targetUserId, {
          email: newEmail,
          email_confirm: true,
        })
        if (authEmailErr) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: authEmailErr.message || 'Falha ao atualizar e-mail de autenticação.',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
        auditChanges.old_email = targetProfile.email
        auditChanges.new_email = newEmail
      }

      // 2. If status changed: handle ban duration in auth
      if (newStatus && newStatus !== targetProfile.status) {
        const banDuration = newStatus === 'suspended' ? '876000h' : 'none'
        await adminClient.auth.admin.updateUserById(targetUserId, {
          ban_duration: banDuration,
        })
        auditChanges.old_status = targetProfile.status
        auditChanges.new_status = newStatus
      }

      // 3. If role changed
      if (newRole && newRole !== targetProfile.role) {
        auditChanges.old_role = targetProfile.role
        auditChanges.new_role = newRole
      }

      // 4. If display name changed
      if (newDisplayName !== undefined && newDisplayName !== targetProfile.display_name) {
        auditChanges.old_display_name = targetProfile.display_name
        auditChanges.new_display_name = newDisplayName
        // Also update auth user metadata
        await adminClient.auth.admin.updateUserById(targetUserId, {
          user_metadata: {
            display_name: newDisplayName,
            name: newDisplayName,
          },
        })
      }

      // 5. Update profiles table
      const profileUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }
      if (newEmail) profileUpdates.email = newEmail
      if (newDisplayName !== undefined) profileUpdates.display_name = newDisplayName
      if (newRole) profileUpdates.role = newRole
      if (newStatus) profileUpdates.status = newStatus

      const { data: updatedProfile, error: profileUpErr } = await adminClient
        .from('profiles')
        .update(profileUpdates)
        .eq('id', targetUserId)
        .select()
        .single()

      if (profileUpErr) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Falha ao salvar dados do perfil.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Log in audit
      if (Object.keys(auditChanges).length > 0) {
        await adminClient.from('admin_audit_logs').insert({
          actor_id: callerUser.id,
          actor_email: callerUser.email,
          action: 'update_user_profile',
          target_user_id: targetUserId,
          target_email: newEmail || targetProfile.email,
          details: auditChanges,
        })
      }

      return new Response(JSON.stringify({ ok: true, data: { user: updatedProfile } }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ACTION: RESET PASSWORD (Master defines new password OR generates strong password)
    if (action === 'reset_password') {
      const targetUserId = body.user_id || body.target_user_id
      let newPassword = body.password ? body.password.trim() : null
      let wasGenerated = false

      if (!targetUserId) {
        return new Response(JSON.stringify({ ok: false, error: 'ID do usuário obrigatório.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!newPassword) {
        newPassword = generateStrongPassword(16)
        wasGenerated = true
      } else if (newPassword.length < 8) {
        return new Response(
          JSON.stringify({ ok: false, error: 'A senha deve ter no mínimo 8 caracteres.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('id, email, display_name')
        .eq('id', targetUserId)
        .maybeSingle()

      if (!targetProfile) {
        return new Response(JSON.stringify({ ok: false, error: 'Usuário não encontrado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: pwdError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      })

      if (pwdError) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: pwdError.message || 'Falha ao redefinir senha do usuário.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Audit log: only metadata, NEVER the password
      await adminClient.from('admin_audit_logs').insert({
        actor_id: callerUser.id,
        actor_email: callerUser.email,
        action: 'reset_password',
        target_user_id: targetUserId,
        target_email: targetProfile.email,
        details: {
          was_generated: wasGenerated,
          length: newPassword.length,
        },
      })

      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            user_id: targetUserId,
            email: targetProfile.email,
            password: newPassword,
            was_generated: wasGenerated,
            has_email_provider: Boolean(resendApiKey),
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ACTION: SEND PASSWORD EMAIL
    if (action === 'send_password_email') {
      const targetUserId = body.user_id || body.target_user_id
      const password = body.password

      if (!targetUserId || !password) {
        return new Response(
          JSON.stringify({ ok: false, error: 'ID do usuário e senha são obrigatórios.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('id, email, display_name')
        .eq('id', targetUserId)
        .maybeSingle()

      if (!targetProfile) {
        return new Response(JSON.stringify({ ok: false, error: 'Usuário não encontrado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!resendApiKey) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'Envio de e-mail não configurado — copie a senha/link e envie manualmente.',
            code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
            has_email_provider: false,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const sent = await sendResendEmail(
        targetProfile.email,
        'Sua nova senha de acesso - VibeCoding',
        `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Olá${targetProfile.display_name ? `, ${targetProfile.display_name}` : ''}!</h2>
            <p>Sua senha de acesso no VibeCoding Tarefas foi redefinida pelo administrador.</p>
            <p><strong>E-mail:</strong> ${targetProfile.email}</p>
            <p><strong>Nova Senha:</strong> <code>${password}</code></p>
            <p>Recomendamos fazer login e alterar sua senha se desejar.</p>
          </div>
        `,
      )

      if (!sent) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'Falha ao enviar e-mail pelo provedor Resend.',
            has_email_provider: true,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      await adminClient.from('admin_audit_logs').insert({
        actor_id: callerUser.id,
        actor_email: callerUser.email,
        action: 'send_password_email',
        target_user_id: targetUserId,
        target_email: targetProfile.email,
        details: { sent_at: new Date().toISOString() },
      })

      return new Response(JSON.stringify({ ok: true, data: { email_sent: true } }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ACTION: RESEND CONFIRMATION / INVITE
    if (action === 'resend_confirmation') {
      const targetUserId = body.user_id || body.target_user_id

      if (!targetUserId) {
        return new Response(JSON.stringify({ ok: false, error: 'ID do usuário obrigatório.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('id', targetUserId)
        .maybeSingle()

      if (!targetProfile) {
        return new Response(JSON.stringify({ ok: false, error: 'Usuário não encontrado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Generate confirmation / magic link via Supabase admin
      let actionLink: string | null = null
      let linkErr: any = null

      const magicRes = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: targetProfile.email,
      })

      if (magicRes.data?.properties?.action_link) {
        actionLink = magicRes.data.properties.action_link
      } else {
        linkErr = magicRes.error
        // Fallback to recovery link if magiclink fails
        const recoveryRes = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: targetProfile.email,
        })
        if (recoveryRes.data?.properties?.action_link) {
          actionLink = recoveryRes.data.properties.action_link
          linkErr = null
        }
      }

      if (linkErr && !actionLink) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: linkErr.message || 'Falha ao gerar link de confirmação.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      let emailSent = false
      if (resendApiKey && actionLink) {
        emailSent = await sendResendEmail(
          targetProfile.email,
          'Confirmação de Acesso - VibeCoding Tarefas',
          `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Olá!</h2>
              <p>Recebemos uma solicitação de envio de link de confirmação para sua conta.</p>
              <p><a href="${actionLink}" style="display:inline-block;padding:12px 20px;background:#58CC02;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">Acessar minha conta</a></p>
              <p style="font-size:12px;color:#888;">Ou copie o link: ${actionLink}</p>
            </div>
          `,
        )
      }

      await adminClient.from('admin_audit_logs').insert({
        actor_id: callerUser.id,
        actor_email: callerUser.email,
        action: 'resend_confirmation',
        target_user_id: targetUserId,
        target_email: targetProfile.email,
        details: {
          has_email_provider: Boolean(resendApiKey),
          email_sent: emailSent,
        },
      })

      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            email_sent: emailSent,
            has_email_provider: Boolean(resendApiKey),
            action_link: !resendApiKey ? actionLink : null,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ACTION: SET USER OVERRIDE (permissions)
    if (action === 'set_user_override') {
      const targetUserId = body.user_id || body.target_user_id
      const featureKey = body.feature_key
      const enabled = Boolean(body.enabled)

      if (!targetUserId || !featureKey) {
        return new Response(
          JSON.stringify({ ok: false, error: 'user_id e feature_key são obrigatórios.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('id', targetUserId)
        .maybeSingle()

      const { error: overrideErr } = await adminClient.from('user_feature_overrides').upsert({
        user_id: targetUserId,
        feature_key: featureKey,
        enabled,
        updated_by: callerUser.id,
        updated_at: new Date().toISOString(),
      })

      if (overrideErr) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: overrideErr.message || 'Falha ao salvar override de permissão.',
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Log in audit (never content, only permission action)
      await adminClient.from('admin_audit_logs').insert({
        actor_id: callerUser.id,
        actor_email: callerUser.email,
        action: 'set_user_override',
        target_user_id: targetUserId,
        target_email: targetProfile?.email || null,
        details: {
          feature_key: featureKey,
          enabled,
        },
      })

      return new Response(
        JSON.stringify({
          ok: true,
          data: { user_id: targetUserId, feature_key: featureKey, enabled },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ACTION: GET USER DETAILS (audit logs for that user + overrides)
    if (action === 'get_user_details') {
      const targetUserId = body.user_id || body.target_user_id
      if (!targetUserId) {
        return new Response(JSON.stringify({ ok: false, error: 'ID do usuário obrigatório.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 1. User profile
      const { data: userProfile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle()

      // 2. Overrides
      const { data: overrides } = await adminClient
        .from('user_feature_overrides')
        .select('*')
        .eq('user_id', targetUserId)

      // 3. Admin audit logs involving this target user ONLY (never content!)
      const { data: logs } = await adminClient
        .from('admin_audit_logs')
        .select('*')
        .eq('target_user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(50)

      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            profile: userProfile,
            overrides: overrides || [],
            audit_logs: logs || [],
            has_email_provider: Boolean(resendApiKey),
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ACTION: DELETE USER
    if (action === 'delete_user') {
      const targetUserId = body.user_id || body.target_user_id

      if (!targetUserId) {
        return new Response(JSON.stringify({ ok: false, error: 'ID do usuário obrigatório.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (targetUserId === callerUser.id) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'Auto-exclusão bloqueada: você não pode excluir sua própria conta Master.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('id', targetUserId)
        .maybeSingle()

      const targetEmail = targetProfile?.email || 'desconhecido'

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId)

      if (deleteError) {
        return new Response(
          JSON.stringify({ ok: false, error: deleteError.message || 'Falha ao excluir usuário.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Cleanup profile explicitly if cascade didn't catch it
      await adminClient.from('profiles').delete().eq('id', targetUserId)

      await adminClient.from('admin_audit_logs').insert({
        actor_id: callerUser.id,
        actor_email: callerUser.email,
        action: 'delete_user',
        target_user_id: targetUserId,
        target_email: targetEmail,
        details: { deleted_at: new Date().toISOString() },
      })

      return new Response(
        JSON.stringify({ ok: true, data: { user_id: targetUserId, email: targetEmail } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ACTION: SUSPEND USER / REACTIVATE USER
    if (action === 'suspend_user' || action === 'reactivate_user') {
      const targetUserId = body.user_id || body.target_user_id
      const isSuspend = action === 'suspend_user'

      if (!targetUserId) {
        return new Response(JSON.stringify({ ok: false, error: 'ID do usuário obrigatório.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (isSuspend && targetUserId === callerUser.id) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'Auto-suspensão bloqueada: você não pode suspender sua própria conta.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('id, email, role, status')
        .eq('id', targetUserId)
        .maybeSingle()

      if (!targetProfile) {
        return new Response(JSON.stringify({ ok: false, error: 'Usuário não encontrado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const banDuration = isSuspend ? '876000h' : 'none'
      await adminClient.auth.admin.updateUserById(targetUserId, {
        ban_duration: banDuration,
      })

      const newStatus = isSuspend ? 'suspended' : 'active'
      const { error: profileUpdateError } = await adminClient
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', targetUserId)

      if (profileUpdateError) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Falha ao atualizar status do perfil.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      await adminClient.from('admin_audit_logs').insert({
        actor_id: callerUser.id,
        actor_email: callerUser.email,
        action: isSuspend ? 'suspend' : 'reactivate',
        target_user_id: targetUserId,
        target_email: targetProfile.email,
        details: { new_status: newStatus },
      })

      return new Response(
        JSON.stringify({ ok: true, data: { user_id: targetUserId, status: newStatus } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ACTION: SET ROLE
    if (action === 'set_role') {
      const targetUserId = body.user_id || body.target_user_id
      const targetRole = body.role

      if (!targetUserId || !targetRole || !['master', 'user'].includes(targetRole)) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Parâmetros inválidos para alteração de papel.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      if (targetUserId === callerUser.id && targetRole === 'user') {
        return new Response(
          JSON.stringify({
            ok: false,
            error:
              'Auto-rebaixamento bloqueado: você não pode revogar seu próprio papel de Master.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('id, email, role')
        .eq('id', targetUserId)
        .maybeSingle()

      if (!targetProfile) {
        return new Response(JSON.stringify({ ok: false, error: 'Usuário não encontrado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: roleUpdateError } = await adminClient
        .from('profiles')
        .update({ role: targetRole, updated_at: new Date().toISOString() })
        .eq('id', targetUserId)

      if (roleUpdateError) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Falha ao atualizar papel do perfil.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      await adminClient.from('admin_audit_logs').insert({
        actor_id: callerUser.id,
        actor_email: callerUser.email,
        action: 'set_role',
        target_user_id: targetUserId,
        target_email: targetProfile.email,
        details: { new_role: targetRole },
      })

      return new Response(
        JSON.stringify({ ok: true, data: { user_id: targetUserId, role: targetRole } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ ok: false, error: `Ação não reconhecida: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno no servidor.'
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
