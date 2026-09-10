import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ManageUsersRequest {
  action: 'create_user' | 'delete_user' | 'suspend_user' | 'reactivate_user' | 'set_role'
  email?: string
  display_name?: string
  password?: string | null
  send_email?: boolean
  user_id?: string
  target_user_id?: string
  role?: 'master' | 'user'
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

    console.log(
      `[manage-users] Ação solicitada: ${action} pelo Master ${callerUser.email} (${callerUser.id})`,
    )

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
      // If send_email is true AND we have email provider, email_confirm could depend, but let's confirm email if we handle delivery or let user login immediately
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
        console.error('[manage-users] Erro ao criar usuário:', createError)
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
      const { data: newProfile, error: profileUpsertError } = await adminClient
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

      if (profileUpsertError) {
        console.error('[manage-users] Erro ao gravar perfil:', profileUpsertError)
      }

      // If email provider exists and sendEmail requested, send email
      let emailSent = false
      if (sendEmail && resendApiKey) {
        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'VibeCoding <nao-responda@resend.dev>',
              to: [email],
              subject: 'Bem-vindo ao VibeCoding Tarefas!',
              html: `
                <div style="font-family: sans-serif; padding: 20px;">
                  <h2>Olá${displayName ? `, ${displayName}` : ''}!</h2>
                  <p>Sua conta no VibeCoding Tarefas foi criada por um administrador.</p>
                  <p><strong>E-mail:</strong> ${email}</p>
                  <p><strong>Senha temporária:</strong> <code>${password}</code></p>
                  <p>Recomendamos alterar sua senha após o primeiro acesso.</p>
                </div>
              `,
            }),
          })
          if (emailRes.ok) {
            emailSent = true
          } else {
            console.warn('[manage-users] Falha no disparo do e-mail Resend:', await emailRes.text())
          }
        } catch (err) {
          console.error('[manage-users] Erro de rede ao disparar Resend:', err)
        }
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
            // Return generated password if provider not available or if generated
            generated_password: !resendApiKey || passwordGenerated ? password : null,
            email_sent: emailSent,
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
        console.error('[manage-users] Erro ao deletar usuário:', deleteError)
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

      // Supabase ban duration: '876000h' (~100 years) or 'none' to unban
      const banDuration = isSuspend ? '876000h' : 'none'
      const { error: banError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        ban_duration: banDuration,
      })

      if (banError) {
        console.warn('[manage-users] Aviso ao atualizar ban_duration no Auth:', banError.message)
      }

      const newStatus = isSuspend ? 'suspended' : 'active'
      const { error: profileUpdateError } = await adminClient
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', targetUserId)

      if (profileUpdateError) {
        console.error('[manage-users] Erro ao atualizar status do perfil:', profileUpdateError)
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
        console.error('[manage-users] Erro ao atualizar papel:', roleUpdateError)
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
  } catch (err: any) {
    console.error('[manage-users] Erro interno:', err)
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || 'Erro interno no servidor.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
