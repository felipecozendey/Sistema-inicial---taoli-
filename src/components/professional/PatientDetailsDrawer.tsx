import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProfessionalStore, PatientLink, PatientReadData } from '@/stores/useProfessionalStore'
import {
  Scale,
  Activity,
  FileText,
  CheckCircle2,
  ListTodo,
  UserX,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { safeFormatDate } from '@/lib/date-utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PatientDetailsDrawerProps {
  patient: PatientLink | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PatientDetailsDrawer({ patient, open, onOpenChange }: PatientDetailsDrawerProps) {
  const { fetchPatientSharedData, endPatientLink } = useProfessionalStore()
  const [data, setData] = useState<PatientReadData | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    if (patient && open) {
      setLoading(true)
      fetchPatientSharedData(patient.patient_id).then((res) => {
        setData(res)
        setLoading(false)
      })
    }
  }, [patient, open, fetchPatientSharedData])

  if (!patient) return null

  const handleEndLink = async () => {
    setEnding(true)
    const ok = await endPatientLink(patient.id)
    setEnding(false)
    if (ok) {
      setConfirmEndOpen(false)
      onOpenChange(false)
    }
  }

  const latest = data?.latest_metrics
  const goals = data?.goals

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b bg-[#1CB0F6]/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {(patient.patient_name || patient.patient_email || 'P')[0].toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                    <span>{patient.patient_name || 'Paciente'}</span>
                    <Badge className="bg-[#1CB0F6] text-white text-[10px] font-extrabold uppercase">
                      {patient.status === 'active' ? 'Ativo' : patient.status}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {patient.patient_email} • Vínculo desde {safeFormatDate(patient.created_at)}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#1CB0F6]" />
                <p className="text-xs font-bold text-muted-foreground">
                  Carregando dados autorizados do paciente...
                </p>
              </div>
            ) : !data ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Não foi possível carregar os dados compartilhados deste paciente.
              </div>
            ) : (
              <>
                {/* Metas e Últimas Medidas */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-wider">
                    <Scale className="w-4 h-4 text-[#1CB0F6]" />
                    Métricas Corporais e Metas
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-2xl border-2 bg-card">
                      <div className="text-[10px] font-bold text-muted-foreground">Peso Atual</div>
                      <div className="text-base font-black text-foreground mt-0.5">
                        {latest?.weight ? `${latest.weight} kg` : '—'}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl border-2 bg-card">
                      <div className="text-[10px] font-bold text-muted-foreground">
                        Meta de Peso
                      </div>
                      <div className="text-base font-black text-[#1CB0F6] mt-0.5">
                        {goals?.target_weight ? `${goals.target_weight} kg` : '—'}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl border-2 bg-card">
                      <div className="text-[10px] font-bold text-muted-foreground">
                        % Gordura Atual
                      </div>
                      <div className="text-base font-black text-foreground mt-0.5">
                        {latest?.body_fat_percentage ? `${latest.body_fat_percentage}%` : '—'}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl border-2 bg-card">
                      <div className="text-[10px] font-bold text-muted-foreground">
                        Meta % Gordura
                      </div>
                      <div className="text-base font-black text-[#1CB0F6] mt-0.5">
                        {goals?.target_body_fat ? `${goals.target_body_fat}%` : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes antropométricos se existirem */}
                  {latest && (
                    <div className="p-3.5 rounded-2xl border bg-muted/20 text-xs space-y-2">
                      <div className="font-bold text-foreground flex items-center justify-between">
                        <span>Última avaliação:</span>
                        <span className="text-muted-foreground font-medium">
                          {safeFormatDate(latest.date || latest.created_at)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                        <div>
                          Massa Magra:{' '}
                          <strong className="text-foreground">
                            {latest.muscle_mass
                              ? `${latest.muscle_mass} kg`
                              : latest.lean_mass
                                ? `${latest.lean_mass} kg`
                                : '—'}
                          </strong>
                        </div>
                        <div>
                          Pressão Arterial:{' '}
                          <strong className="text-foreground">
                            {latest.blood_pressure || '—'}
                          </strong>
                        </div>
                        <div>
                          Glicose:{' '}
                          <strong className="text-foreground">
                            {latest.glucose ? `${latest.glucose} mg/dL` : '—'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Aderência a Hábitos e Tarefas (Agregados / Privacidade) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-wider">
                    <Activity className="w-4 h-4 text-[#58CC02]" />
                    Aderência de Rotina (Dados Agregados)
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl border-2 bg-card flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-muted-foreground">
                          Hábitos Rastreados
                        </div>
                        <div className="text-lg font-black text-foreground">
                          {data.habits_count}{' '}
                          <span className="text-xs font-medium text-muted-foreground">ativos</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border-2 bg-card flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center shrink-0">
                        <ListTodo className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-muted-foreground">
                          Tarefas Concluídas
                        </div>
                        <div className="text-lg font-black text-foreground">
                          {data.tasks_completed_count}{' '}
                          <span className="text-xs font-medium text-muted-foreground">
                            / {data.tasks_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exames Médicos Anexados */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-wider">
                    <FileText className="w-4 h-4 text-[#FFC800]" />
                    Exames Clínicos Compartilhados ({data.medical_exams.length})
                  </h4>

                  {data.medical_exams.length === 0 ? (
                    <div className="p-4 rounded-2xl border bg-muted/20 text-center text-xs text-muted-foreground">
                      Nenhum exame anexado pelo paciente até o momento.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {data.medical_exams.map((exam: any) => (
                        <div
                          key={exam.id}
                          className="p-3 rounded-2xl border bg-card flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-foreground truncate">{exam.title}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {safeFormatDate(exam.date || exam.created_at)}
                            </div>
                          </div>
                          {exam.file_url ? (
                            <a
                              href={exam.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-[#1CB0F6] text-white font-black text-[11px] border-b-2 border-[#1899d6] hover:bg-[#1899d6]"
                            >
                              Ver Exame
                            </a>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              Sem anexo
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ação de Encerrar Vínculo */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground">
                    O paciente pode revogar o compartilhamento a qualquer momento.
                  </div>
                  {patient.status === 'active' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmEndOpen(true)}
                      className="rounded-2xl border-2 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs h-10 px-4 flex items-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-950"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Encerrar vínculo</span>
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de encerramento */}
      <AlertDialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
        <AlertDialogContent className="rounded-3xl border-2 p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-foreground">
              Encerrar vínculo com este paciente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Você deixará de ter acesso às medições, exames e dados compartilhados de{' '}
              <strong>{patient.patient_name || patient.patient_email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndLink}
              disabled={ending}
              className="rounded-2xl font-black bg-rose-600 hover:bg-rose-700 text-white border-b-4 border-rose-800"
            >
              {ending ? 'Encerrando...' : 'Sim, encerrar vínculo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
