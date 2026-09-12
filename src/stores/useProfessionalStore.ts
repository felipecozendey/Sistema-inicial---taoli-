import { create } from './create-store'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface ProfessionalProfile {
  id: string
  user_id: string
  profession: string
  register_code: string | null
  specialty: string | null
  phone: string | null
  bio: string | null
  clinic_name: string | null
  created_at: string
  updated_at: string
}

export type ConsentScope = 'tarefas' | 'saude' | 'financas' | 'estudos'

export interface PatientLink {
  id: string
  professional_id: string
  patient_id: string
  status: 'pending' | 'active' | 'rejected' | 'ended'
  requested_by: string
  created_at: string
  responded_at: string | null
  granted_pages: string[]
  patient_name?: string
  patient_email?: string
  professional_name?: string
  professional_email?: string
  professional_profession?: string
  professional_register?: string
  professional_specialty?: string | null
  professional_clinic?: string | null
}

export interface Appointment {
  id: string
  professional_id: string
  patient_id: string
  title: string | null
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'done' | 'canceled' | 'no_show'
  notes: string | null
  created_at: string
  updated_at: string
  patient_name?: string
}

export interface ClinicalNote {
  id: string
  professional_id: string
  patient_id: string
  appointment_id: string | null
  content: string
  created_at: string
  updated_at: string
  patient_name?: string
}

export interface PatientReadData {
  patient_id: string
  goals: any | null
  latest_metrics: any | null
  metrics_history: any[]
  medical_exams: any[]
  habits_count: number
  habits_adherence_pct: number
  tasks_count: number
  tasks_completed_count: number
}

export interface PatientTarefasData {
  tasks: any[]
  habits: any[]
  checklist: any[]
  pending_tasks: number
  completed_tasks: number
  recent_tasks: any[]
  habits_summary: {
    id: string
    title: string
    frequency: string
    streak: number
    completion_rate_pct: number
    weekly_progress_pct: number
  }[]
}

export interface PatientSaudeData {
  goals: any | null
  latest_metrics: any | null
  metrics_history: any[]
  medical_exams: any[]
  meal_logs: any[]
  metabolic_logs: any[]
  diet_plans: any[]
  recipes: any[]
  workout_routines: any[]
}

export interface PatientFinancasData {
  bank_accounts: any[]
  recent_transactions: any[]
  monthly_income: number
  monthly_expense: number
  balance: number
  total_invested: number
  total_current_invested: number
  investments: any[]
  pending_billings: any[]
  pending_billings_total: number
}

export interface PatientEstudosData {
  notebooks: any[]
  notes: any[]
  decks: any[]
  flashcards_count: number
  review_logs_count: number
  recent_reviews: any[]
}

export interface ActivePatientContext {
  id: string
  displayName: string
  grantedPages: string[]
}

interface ProfessionalState {
  profile: ProfessionalProfile | null
  patients: PatientLink[]
  incomingInvites: PatientLink[]
  myProfessionals: PatientLink[]
  appointments: Appointment[]
  notes: ClinicalNote[]
  loading: boolean
  error: string | null
  activePatient: ActivePatientContext | null
  professionalNamesCache: Map<string, string>

  // Methods
  setActivePatient: (patient: ActivePatientContext | null) => void
  getProfessionalNames: (ids: string[]) => Promise<Map<string, string>>
  loadProfessionalData: () => Promise<void>
  loadPatientConsentData: () => Promise<void>
  upsertClinicProfile: (data: Partial<ProfessionalProfile>) => Promise<boolean>

  // Patient link management
  invitePatientByEmail: (email: string) => Promise<boolean>
  respondPatientInvite: (
    linkId: string,
    accept: boolean,
    grantedPages?: string[],
  ) => Promise<boolean>
  updateGrantedPages: (linkId: string, grantedPages: string[]) => Promise<boolean>
  endPatientLink: (linkId: string) => Promise<boolean>

  // Appointments
  createAppointment: (data: {
    patient_id: string
    title?: string
    scheduled_at: string
    duration_minutes?: number
    notes?: string
  }) => Promise<boolean>
  updateAppointmentStatus: (
    id: string,
    status: 'scheduled' | 'done' | 'canceled' | 'no_show',
  ) => Promise<boolean>
  deleteAppointment: (id: string) => Promise<boolean>

  // Notes
  createClinicalNote: (data: {
    patient_id: string
    appointment_id?: string | null
    content: string
  }) => Promise<boolean>
  updateClinicalNote: (id: string, content: string) => Promise<boolean>
  deleteClinicalNote: (id: string) => Promise<boolean>

  // Patient details reader
  fetchPatientSharedData: (patientId: string) => Promise<PatientReadData | null>
  fetchPatientTarefas: (patientId: string) => Promise<PatientTarefasData | null>
  fetchPatientSaude: (patientId: string) => Promise<PatientSaudeData | null>
  fetchPatientFinancas: (patientId: string) => Promise<PatientFinancasData | null>
  fetchPatientEstudos: (patientId: string) => Promise<PatientEstudosData | null>
}

export const useProfessionalStore = create<ProfessionalState>((set, get) => ({
  profile: null,
  patients: [],
  incomingInvites: [],
  myProfessionals: [],
  appointments: [],
  notes: [],
  loading: false,
  error: null,
  activePatient: null,
  professionalNamesCache: new Map<string, string>(),

  setActivePatient: (patient: ActivePatientContext | null) => {
    set({ activePatient: patient })
  },

  getProfessionalNames: async (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
    if (uniqueIds.length === 0) return new Map<string, string>()

    const cache = new Map(get().professionalNamesCache)
    const missing = uniqueIds.filter((id) => !cache.has(id))

    if (missing.length > 0) {
      try {
        const [profilesRes, clinicRes] = await Promise.all([
          supabase.from('profiles').select('id, display_name, email').in('id', missing),
          supabase
            .from('professional_profiles')
            .select('user_id, profession')
            .in('user_id', missing),
        ])

        const clinicMap = new Map<string, string>()
        if (clinicRes.data) {
          clinicRes.data.forEach((c: any) => {
            clinicMap.set(c.user_id, c.profession || '')
          })
        }

        if (profilesRes.data) {
          profilesRes.data.forEach((p: any) => {
            const rawName = (p.display_name || p.email?.split('@')[0] || '').trim()
            if (!rawName) {
              cache.set(p.id, 'Profissional')
              return
            }
            const parts = rawName.split(/\s+/)
            const formatted = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0]
            const profession = clinicMap.get(p.id) || ''
            const prefix = profession.toLowerCase().includes('nutri')
              ? 'Nutri'
              : profession.toLowerCase().includes('médic') ||
                  profession.toLowerCase().includes('medic')
                ? 'Dr.'
                : 'Dr(a).'
            cache.set(p.id, `${prefix} ${formatted}`)
          })
        }

        // Fill any remaining with fallback
        missing.forEach((id) => {
          if (!cache.has(id)) cache.set(id, 'Profissional')
        })

        set({ professionalNamesCache: cache })
      } catch (e) {
        console.error('Error fetching professional names:', e)
      }
    }

    return cache
  },

  loadProfessionalData: async () => {
    set({ loading: true, error: null })
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return
      }

      // Fetch professional profile, patient links, appointments, notes
      const [profRes, linksRes, apptsRes, notesRes] = await Promise.all([
        supabase.from('professional_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('professional_patients')
          .select('*')
          .eq('professional_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('professional_appointments')
          .select('*')
          .eq('professional_id', user.id)
          .order('scheduled_at', { ascending: true }),
        supabase
          .from('professional_notes')
          .select('*')
          .eq('professional_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      const rawLinks = linksRes.data || []
      const rawAppts = apptsRes.data || []
      const rawNotes = notesRes.data || []

      // Collect patient ids to fetch display names / emails
      const patientIds = Array.from(
        new Set([
          ...rawLinks.map((l: any) => l.patient_id),
          ...rawAppts.map((a: any) => a.patient_id),
          ...rawNotes.map((n: any) => n.patient_id),
        ]),
      )

      let patientProfilesMap: Record<string, { name: string; email: string }> = {}
      if (patientIds.length > 0) {
        const { data: pProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', patientIds)

        if (pProfiles) {
          pProfiles.forEach((p: any) => {
            patientProfilesMap[p.id] = {
              name: p.display_name || p.email.split('@')[0],
              email: p.email,
            }
          })
        }
      }

      const enrichedLinks: PatientLink[] = rawLinks.map((l: any) => ({
        ...l,
        granted_pages: Array.isArray(l.granted_pages) ? l.granted_pages : [],
        patient_name: patientProfilesMap[l.patient_id]?.name || 'Paciente',
        patient_email: patientProfilesMap[l.patient_id]?.email || '',
      }))

      const enrichedAppts: Appointment[] = rawAppts.map((a: any) => ({
        ...a,
        patient_name: patientProfilesMap[a.patient_id]?.name || 'Paciente',
      }))

      const enrichedNotes: ClinicalNote[] = rawNotes.map((n: any) => ({
        ...n,
        patient_name: patientProfilesMap[n.patient_id]?.name || 'Paciente',
      }))

      set({
        profile: profRes.data as ProfessionalProfile | null,
        patients: enrichedLinks,
        appointments: enrichedAppts,
        notes: enrichedNotes,
        loading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados do consultório'
      set({ error: message, loading: false })
      toast.error(message)
    }
  },

  loadPatientConsentData: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Find links where current user is the patient
      const { data: links } = await supabase
        .from('professional_patients')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })

      if (!links || links.length === 0) {
        set({ incomingInvites: [], myProfessionals: [] })
        return
      }

      // Collect professional user ids
      const profUserIds = Array.from(new Set(links.map((l: any) => l.professional_id)))
      const [profProfilesRes, clinicProfilesRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name, email').in('id', profUserIds),
        supabase.from('professional_profiles').select('*').in('user_id', profUserIds),
      ])

      const profMap: Record<string, { name: string; email: string }> = {}
      const clinicMap: Record<string, any> = {}

      if (profProfilesRes.data) {
        profProfilesRes.data.forEach((p: any) => {
          const emailPrefix = p.email ? p.email.split('@')[0] : ''
          profMap[p.id] = {
            name: p.display_name?.trim()
              ? p.display_name
              : emailPrefix || p.email || 'Profissional',
            email: p.email || '',
          }
        })
      }
      if (clinicProfilesRes.data) {
        clinicProfilesRes.data.forEach((c: any) => {
          clinicMap[c.user_id] = c
        })
      }

      const incoming: PatientLink[] = []
      const activeOrEnded: PatientLink[] = []

      links.forEach((l: any) => {
        const profInfo = profMap[l.professional_id]
        const clinicInfo = clinicMap[l.professional_id]
        const item: PatientLink = {
          ...l,
          granted_pages: Array.isArray(l.granted_pages) ? l.granted_pages : [],
          professional_name: profInfo?.name || profInfo?.email || 'Profissional',
          professional_email: profInfo?.email || '',
          professional_profession: clinicInfo?.profession || 'Profissional da Saúde',
          professional_register: clinicInfo?.register_code || null,
          professional_specialty: clinicInfo?.specialty || null,
          professional_clinic: clinicInfo?.clinic_name || null,
        }
        if (l.status === 'pending' && l.requested_by !== user.id) {
          incoming.push(item)
        } else if (l.status === 'active' || l.status === 'ended') {
          activeOrEnded.push(item)
        }
      })

      set({
        incomingInvites: incoming,
        myProfessionals: activeOrEnded,
      })
    } catch (err) {
      console.error('Error loading patient consent data:', err)
    }
  },

  upsertClinicProfile: async (data: Partial<ProfessionalProfile>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const current = get().profile
      const payload = {
        user_id: user.id,
        profession: data.profession || 'Nutricionista',
        register_code: data.register_code || null,
        specialty: data.specialty || null,
        phone: data.phone || null,
        bio: data.bio || null,
        clinic_name: data.clinic_name || null,
      }

      let res
      if (current?.id) {
        res = await supabase
          .from('professional_profiles')
          .update(payload)
          .eq('user_id', user.id)
          .select()
          .single()
      } else {
        res = await supabase.from('professional_profiles').insert(payload).select().single()
      }

      if (res.error) throw res.error

      set({ profile: res.data as ProfessionalProfile })
      toast.success('Consultório configurado com sucesso!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar consultório'
      toast.error(message)
      return false
    }
  },

  invitePatientByEmail: async (email: string) => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Informe um e-mail válido.')
      return false
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // Look up target profile by email
      const { data: targetProfile, error: searchErr } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (searchErr || !targetProfile) {
        toast.error('Nenhum usuário encontrado com este e-mail no sistema.')
        return false
      }

      if (targetProfile.id === user.id) {
        toast.error('Você não pode convidar a si mesmo como paciente.')
        return false
      }

      // Check if already invited or linked
      const existing = get().patients.find((p) => p.patient_id === targetProfile.id)
      if (existing) {
        if (existing.status === 'active') {
          toast.info('Este paciente já possui vínculo ativo com você.')
          return false
        }
        if (existing.status === 'pending') {
          toast.info('Já existe um convite pendente para este paciente.')
          return false
        }
      }

      const { data: created, error: insertErr } = await supabase
        .from('professional_patients')
        .upsert(
          {
            professional_id: user.id,
            patient_id: targetProfile.id,
            status: 'pending',
            requested_by: user.id,
          },
          { onConflict: 'professional_id,patient_id' },
        )
        .select()
        .single()

      if (insertErr) throw insertErr

      const newLink: PatientLink = {
        ...(created as any),
        patient_name: targetProfile.display_name || targetProfile.email.split('@')[0],
        patient_email: targetProfile.email,
      }

      set((state) => ({
        patients: [newLink, ...state.patients.filter((p) => p.id !== newLink.id)],
      }))

      toast.success(`Convite enviado para ${targetProfile.email}!`)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao convidar paciente'
      toast.error(message)
      return false
    }
  },

  respondPatientInvite: async (
    linkId: string,
    accept: boolean,
    grantedPages: string[] = ['tarefas', 'saude'],
  ) => {
    const prevIncoming = get().incomingInvites
    const prevMyProfessionals = get().myProfessionals
    const target = prevIncoming.find((l) => l.id === linkId)
    if (!target) return false

    const newStatus = accept ? 'active' : 'rejected'
    const pagesToSave = accept ? grantedPages : []

    // Optimistic
    set((state) => ({
      incomingInvites: state.incomingInvites.filter((l) => l.id !== linkId),
      myProfessionals: accept
        ? [
            {
              ...target,
              status: 'active',
              granted_pages: pagesToSave,
              responded_at: new Date().toISOString(),
            },
            ...state.myProfessionals,
          ]
        : state.myProfessionals,
    }))

    try {
      const { error } = await supabase
        .from('professional_patients')
        .update({
          status: newStatus,
          granted_pages: pagesToSave,
          responded_at: new Date().toISOString(),
        })
        .eq('id', linkId)

      if (error) throw error

      toast.success(
        accept
          ? 'Convite aceito! Seu profissional agora tem acesso às áreas liberadas.'
          : 'Convite recusado.',
      )
      return true
    } catch (err) {
      set({ incomingInvites: prevIncoming, myProfessionals: prevMyProfessionals })
      const message = err instanceof Error ? err.message : 'Erro ao responder convite'
      toast.error(message)
      return false
    }
  },

  updateGrantedPages: async (linkId: string, grantedPages: string[]) => {
    const prevMyProfessionals = get().myProfessionals
    const target = prevMyProfessionals.find((l) => l.id === linkId)
    if (!target) return false

    // Optimistic
    set((state) => ({
      myProfessionals: state.myProfessionals.map((l) =>
        l.id === linkId ? { ...l, granted_pages: grantedPages } : l,
      ),
    }))

    try {
      const { error } = await supabase
        .from('professional_patients')
        .update({ granted_pages: grantedPages })
        .eq('id', linkId)

      if (error) throw error

      toast.success('Permissões de acesso atualizadas!')
      return true
    } catch (err) {
      set({ myProfessionals: prevMyProfessionals })
      const message = err instanceof Error ? err.message : 'Erro ao atualizar permissões'
      toast.error(message)
      return false
    }
  },

  endPatientLink: async (linkId: string) => {
    const prevPatients = get().patients
    const prevMyProfessionals = get().myProfessionals

    // Optimistic
    set((state) => ({
      patients: state.patients.map((p) => (p.id === linkId ? { ...p, status: 'ended' } : p)),
      myProfessionals: state.myProfessionals.map((p) =>
        p.id === linkId ? { ...p, status: 'ended' } : p,
      ),
    }))

    try {
      const { error } = await supabase
        .from('professional_patients')
        .update({
          status: 'ended',
          responded_at: new Date().toISOString(),
        })
        .eq('id', linkId)

      if (error) throw error

      toast.success('Vínculo profissional encerrado.')
      return true
    } catch (err) {
      set({ patients: prevPatients, myProfessionals: prevMyProfessionals })
      const message = err instanceof Error ? err.message : 'Erro ao encerrar vínculo'
      toast.error(message)
      return false
    }
  },

  createAppointment: async (data) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const patient = get().patients.find((p) => p.patient_id === data.patient_id)

      const payload = {
        professional_id: user.id,
        patient_id: data.patient_id,
        title: data.title || 'Consulta',
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes || 50,
        status: 'scheduled',
        notes: data.notes || null,
      }

      const { data: created, error } = await supabase
        .from('professional_appointments')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      const enriched: Appointment = {
        ...(created as any),
        patient_name: patient?.patient_name || 'Paciente',
      }

      set((state) => ({
        appointments: [...state.appointments, enriched].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
        ),
      }))

      toast.success('Consulta agendada com sucesso!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar consulta'
      toast.error(message)
      return false
    }
  },

  updateAppointmentStatus: async (id, status) => {
    const prev = get().appointments
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
    }))

    try {
      const { error } = await supabase
        .from('professional_appointments')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      toast.success('Status da consulta atualizado!')
      return true
    } catch (err) {
      set({ appointments: prev })
      const message = err instanceof Error ? err.message : 'Erro ao atualizar consulta'
      toast.error(message)
      return false
    }
  },

  deleteAppointment: async (id) => {
    const prev = get().appointments
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== id),
    }))

    try {
      const { error } = await supabase.from('professional_appointments').delete().eq('id', id)
      if (error) throw error
      toast.success('Consulta removida!')
      return true
    } catch (err) {
      set({ appointments: prev })
      const message = err instanceof Error ? err.message : 'Erro ao remover consulta'
      toast.error(message)
      return false
    }
  },

  createClinicalNote: async (data) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const patient = get().patients.find((p) => p.patient_id === data.patient_id)

      const payload = {
        professional_id: user.id,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id || null,
        content: data.content,
      }

      const { data: created, error } = await supabase
        .from('professional_notes')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      const enriched: ClinicalNote = {
        ...(created as any),
        patient_name: patient?.patient_name || 'Paciente',
      }

      set((state) => ({
        notes: [enriched, ...state.notes],
      }))

      toast.success('Anotação clínica salva!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar anotação clínica'
      toast.error(message)
      return false
    }
  },

  updateClinicalNote: async (id, content) => {
    const prev = get().notes
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, content, updated_at: new Date().toISOString() } : n,
      ),
    }))

    try {
      const { error } = await supabase.from('professional_notes').update({ content }).eq('id', id)

      if (error) throw error
      toast.success('Anotação atualizada!')
      return true
    } catch (err) {
      set({ notes: prev })
      const message = err instanceof Error ? err.message : 'Erro ao atualizar anotação'
      toast.error(message)
      return false
    }
  },

  deleteClinicalNote: async (id) => {
    const prev = get().notes
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }))

    try {
      const { error } = await supabase.from('professional_notes').delete().eq('id', id)
      if (error) throw error
      toast.success('Anotação removida!')
      return true
    } catch (err) {
      set({ notes: prev })
      const message = err instanceof Error ? err.message : 'Erro ao remover anotação'
      toast.error(message)
      return false
    }
  },

  fetchPatientSharedData: async (patientId: string) => {
    try {
      const [goalsRes, metricsRes, examsRes, habitsRes, tasksRes] = await Promise.all([
        supabase.from('patient_goals').select('*').eq('user_id', patientId).maybeSingle(),
        supabase
          .from('body_metrics')
          .select('*')
          .eq('user_id', patientId)
          .order('date', { ascending: false })
          .limit(20),
        supabase
          .from('medical_exams')
          .select('*')
          .eq('user_id', patientId)
          .order('date', { ascending: false })
          .limit(20),
        supabase.from('habits').select('id, week_days, completions').eq('user_id', patientId),
        supabase.from('tasks').select('id, completed').eq('user_id', patientId),
      ])

      const metricsList = metricsRes.data || []
      const latestMetric = metricsList[0] || null

      const habits = habitsRes.data || []
      const tasks = tasksRes.data || []

      // Calculate aggregate adherence
      let totalHabitCompletions = 0
      habits.forEach((h: any) => {
        if (Array.isArray(h.completions)) {
          totalHabitCompletions += h.completions.length
        }
      })

      const completedTasksCount = tasks.filter((t: any) => t.completed).length

      return {
        patient_id: patientId,
        goals: goalsRes.data || null,
        latest_metrics: latestMetric,
        metrics_history: metricsList,
        medical_exams: examsRes.data || [],
        habits_count: habits.length,
        habits_adherence_pct:
          habits.length > 0
            ? Math.min(100, Math.round((totalHabitCompletions / (habits.length * 7 || 1)) * 100))
            : 0,
        tasks_count: tasks.length,
        tasks_completed_count: completedTasksCount,
      }
    } catch (err) {
      console.error('Error fetching patient shared data:', err)
      return null
    }
  },

  fetchPatientTarefas: async (patientId: string) => {
    try {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [tasksRes, habitsRes, checklistRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', patientId)
          .or(`created_at.gte.${sevenDaysAgo},completed.eq.false`)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('habits').select('*').eq('user_id', patientId).limit(50),
        supabase
          .from('daily_checklist')
          .select('*')
          .eq('user_id', patientId)
          .order('date', { ascending: false })
          .limit(7),
      ])

      const tasks = tasksRes.data || []
      const habits = habitsRes.data || []
      const checklist = checklistRes.data || []

      const pendingCount = tasks.filter((t: any) => !t.completed).length
      const completedCount = tasks.filter((t: any) => t.completed).length

      const todayStr = now.toISOString().slice(0, 10)

      const habitsSummary = habits.map((h: any) => {
        const completions: string[] = Array.isArray(h.completions) ? h.completions : []
        const last7DaysCompletions = completions.filter((c) => {
          try {
            const d = new Date(c).getTime()
            return d >= new Date(sevenDaysAgo).getTime()
          } catch {
            return false
          }
        }).length

        // Simple streak
        let streak = 0
        const sorted = [...new Set(completions.map((d) => d.slice(0, 10)))].sort().reverse()
        let checkDate = new Date(todayStr)
        // Check if done today or yesterday to start streak
        const yesterday = new Date(checkDate)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().slice(0, 10)

        if (sorted.includes(todayStr) || sorted.includes(yesterdayStr)) {
          let curr = sorted.includes(todayStr) ? new Date(todayStr) : yesterday
          while (true) {
            const cStr = curr.toISOString().slice(0, 10)
            if (sorted.includes(cStr)) {
              streak++
              curr.setDate(curr.getDate() - 1)
            } else {
              break
            }
          }
        }

        const weeklyGoal = h.weekly_goal || 7
        const weeklyProgress = Math.min(100, Math.round((last7DaysCompletions / weeklyGoal) * 100))
        const totalPossible = 7
        const completionRate = Math.min(
          100,
          Math.round((last7DaysCompletions / totalPossible) * 100),
        )

        return {
          id: h.id,
          title: h.title,
          frequency: h.frequency || 'daily',
          streak,
          completion_rate_pct: completionRate,
          weekly_progress_pct: weeklyProgress,
        }
      })

      return {
        tasks,
        habits,
        checklist,
        pending_tasks: pendingCount,
        completed_tasks: completedCount,
        recent_tasks: tasks.slice(0, 10),
        habits_summary: habitsSummary,
      }
    } catch (err) {
      console.error('Error fetching patient tarefas:', err)
      return null
    }
  },

  fetchPatientSaude: async (patientId: string) => {
    try {
      const [
        goalsRes,
        metricsRes,
        examsRes,
        mealsRes,
        metabolicRes,
        dietRes,
        recipesRes,
        workoutsRes,
      ] = await Promise.all([
        supabase.from('patient_goals').select('*').eq('user_id', patientId).maybeSingle(),
        supabase
          .from('body_metrics')
          .select('*')
          .eq('user_id', patientId)
          .order('date', { ascending: false })
          .limit(50),
        supabase
          .from('medical_exams')
          .select('*')
          .eq('user_id', patientId)
          .order('date', { ascending: false })
          .limit(15),
        supabase
          .from('meal_logs')
          .select('*')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('metabolic_logs')
          .select('*')
          .eq('user_id', patientId)
          .order('date', { ascending: false })
          .limit(20),
        supabase
          .from('diet_plans')
          .select('*, diet_plan_items(*)')
          .eq('user_id', patientId)
          .order('order_index', { ascending: true }),
        supabase
          .from('nutrition_recipes')
          .select('*, recipe_ingredients(*, custom_foods(*))')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('workout_routines')
          .select('*')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false }),
      ])

      const metricsList = metricsRes.data || []
      return {
        goals: goalsRes.data || null,
        latest_metrics: metricsList[0] || null,
        metrics_history: metricsList,
        medical_exams: examsRes.data || [],
        meal_logs: mealsRes.data || [],
        metabolic_logs: metabolicRes.data || [],
        diet_plans: dietRes.data || [],
        recipes: recipesRes.data || [],
        workout_routines: workoutsRes.data || [],
      }
    } catch (err) {
      console.error('Error fetching patient saude:', err)
      return null
    }
  },

  fetchPatientFinancas: async (patientId: string) => {
    try {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const lastDayOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      ).toISOString()

      const [accountsRes, txRes, invRes, billingsRes] = await Promise.all([
        supabase.from('bank_accounts').select('*').eq('user_id', patientId),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', patientId)
          .gte('date', firstDayOfMonth)
          .lte('date', lastDayOfMonth)
          .order('date', { ascending: false })
          .limit(100),
        supabase.from('investments').select('*').eq('user_id', patientId),
        supabase
          .from('billings')
          .select('*')
          .eq('user_id', patientId)
          .eq('status', 'pending')
          .order('due_date', { ascending: true })
          .limit(20),
      ])

      const accounts = accountsRes.data || []
      const transactions = txRes.data || []
      const investments = invRes.data || []
      const billings = billingsRes.data || []

      let monthlyIncome = 0
      let monthlyExpense = 0
      transactions.forEach((t: any) => {
        const amt = Number(t.amount) || 0
        if (t.type === 'income') monthlyIncome += amt
        if (t.type === 'expense') monthlyExpense += amt
      })

      let totalInvested = 0
      let totalCurrentInvested = 0
      investments.forEach((inv: any) => {
        totalInvested += Number(inv.invested_amount || inv.initial_amount || 0)
        totalCurrentInvested += Number(inv.current_amount || 0)
      })

      const pendingBillingsTotal = billings.reduce(
        (acc: number, b: any) => acc + (Number(b.amount) || 0),
        0,
      )

      return {
        bank_accounts: accounts,
        recent_transactions: transactions.slice(0, 10),
        monthly_income: monthlyIncome,
        monthly_expense: monthlyExpense,
        balance: monthlyIncome - monthlyExpense,
        total_invested: totalInvested,
        total_current_invested: totalCurrentInvested,
        investments,
        pending_billings: billings,
        pending_billings_total: pendingBillingsTotal,
      }
    } catch (err) {
      console.error('Error fetching patient financas:', err)
      return null
    }
  },

  fetchPatientEstudos: async (patientId: string) => {
    try {
      const [notebooksRes, notesRes, decksRes, flashcardsRes, reviewsRes] = await Promise.all([
        supabase
          .from('notebooks')
          .select('*')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('notes')
          .select('id, notebook_id, title, emoji, created_at, updated_at')
          .eq('user_id', patientId)
          .order('updated_at', { ascending: false })
          .limit(20),
        supabase
          .from('decks')
          .select('*')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false }),
        supabase.from('flashcards').select('id, deck_id').eq('user_id', patientId),
        supabase
          .from('review_logs')
          .select('*')
          .eq('user_id', patientId)
          .order('reviewed_at', { ascending: false })
          .limit(20),
      ])

      return {
        notebooks: notebooksRes.data || [],
        notes: notesRes.data || [],
        decks: decksRes.data || [],
        flashcards_count: (flashcardsRes.data || []).length,
        review_logs_count: (reviewsRes.data || []).length,
        recent_reviews: (reviewsRes.data || []).slice(0, 10),
      }
    } catch (err) {
      console.error('Error fetching patient estudos:', err)
      return null
    }
  },
}))
