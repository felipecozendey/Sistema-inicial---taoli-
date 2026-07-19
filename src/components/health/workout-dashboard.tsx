import { useMemo, useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dumbbell, TrendingUp, Weight } from 'lucide-react'
import type { ExerciseItem } from '@/components/health/workout-types'

export function WorkoutDashboard() {
  const workoutHistory = useAppStore((s) => s.workoutHistory)
  const fetchWorkoutRoutines = useAppStore((s) => s.fetchWorkoutRoutines)
  const fetchWorkoutHistory = useAppStore((s) => s.fetchWorkoutHistory)
  const [selectedExercise, setSelectedExercise] = useState('')

  useEffect(() => {
    fetchWorkoutRoutines()
    fetchWorkoutHistory()
  }, [fetchWorkoutRoutines, fetchWorkoutHistory])

  const allExercises = useMemo(() => {
    const names = new Set<string>()
    workoutHistory.forEach((h) => {
      const exercises = (h.data?.exercises || []) as unknown as ExerciseItem[]
      exercises.forEach((e) => {
        if (e.name) names.add(e.name)
      })
    })
    return Array.from(names)
  }, [workoutHistory])

  useEffect(() => {
    if (allExercises.length > 0 && !selectedExercise) setSelectedExercise(allExercises[0])
  }, [allExercises, selectedExercise])

  const constancyData = useMemo(() => {
    const weeks: { week: string; treinos: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      end.setDate(end.getDate() - i * 7)
      const start = new Date(end)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      const count = workoutHistory.filter((h) => {
        const d = new Date(h.completedAt)
        return d >= start && d <= end
      }).length
      weeks.push({
        week: `${start.getDate()}/${String(start.getMonth() + 1).padStart(2, '0')}`,
        treinos: count,
      })
    }
    return weeks
  }, [workoutHistory])

  const overloadData = useMemo(() => {
    if (!selectedExercise) return []
    return workoutHistory
      .filter((h) => {
        const exercises = (h.data?.exercises || []) as unknown as ExerciseItem[]
        return exercises.some((e) => e.name === selectedExercise)
      })
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .map((h) => {
        const exercises = (h.data?.exercises || []) as unknown as ExerciseItem[]
        const ex = exercises.find((e) => e.name === selectedExercise)
        return {
          date: new Date(h.completedAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          }),
          weight: ex?.weightKg || 0,
        }
      })
  }, [workoutHistory, selectedExercise])

  const weeklyVolume = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    return workoutHistory
      .filter((h) => new Date(h.completedAt) >= weekStart)
      .reduce((sum, h) => sum + (h.totalVolumeKg || 0), 0)
  }, [workoutHistory])

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF9600]/15 flex items-center justify-center">
            <Weight className="w-6 h-6 text-[#FF9600]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground">Volume Semanal</p>
            <p className="text-3xl font-extrabold text-[#FF9600]">
              {(weeklyVolume / 1000).toFixed(2)} <span className="text-lg">Ton</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="w-5 h-5 text-[#58CC02]" strokeWidth={2.5} />
          <h3 className="text-lg font-extrabold">Constância de Treinos</h3>
        </div>
        <div className="h-48">
          <ChartContainer config={{}} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={constancyData}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={25}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="treinos" name="Treinos" fill="#58CC02" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1CB0F6]" strokeWidth={2.5} />
            <h3 className="text-lg font-extrabold">Sobrecarga Progressiva</h3>
          </div>
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="w-44 rounded-xl font-bold text-sm h-9">
              <SelectValue placeholder="Exercício" />
            </SelectTrigger>
            <SelectContent>
              {allExercises.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {overloadData.length > 0 ? (
          <div className="h-48">
            <ChartContainer config={{}} className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overloadData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    unit="kg"
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Carga (kg)"
                    stroke="#1CB0F6"
                    strokeWidth={3}
                    dot={{ fill: '#1CB0F6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <p className="text-center py-12 text-sm font-bold text-muted-foreground">
            Selecione um exercício para ver a evolução
          </p>
        )}
      </div>
    </div>
  )
}
