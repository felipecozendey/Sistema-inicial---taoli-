import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkoutDashboard } from '@/components/health/workout-dashboard'
import { WorkoutPlans } from '@/components/health/workout-plans'
import { WorkoutHistoryView } from '@/components/health/workout-history-view'
import { MyJiuTab } from '@/components/health/my-jiu-tab'

export function ExercisesTab() {
  const [mode, setMode] = useState('musculacao')

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v)}
          className="gap-2 bg-muted p-1.5 rounded-2xl"
        >
          <ToggleGroupItem
            value="musculacao"
            className="rounded-xl font-extrabold px-5 py-2 data-[state=on]:bg-[#FF9600] data-[state=on]:text-white"
          >
            💪 Musculação
          </ToggleGroupItem>
          <ToggleGroupItem
            value="jiu"
            className="rounded-xl font-extrabold px-5 py-2 data-[state=on]:bg-[#1CB0F6] data-[state=on]:text-white"
          >
            🥋 Jiu-Jitsu (MyJiu)
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {mode === 'musculacao' ? (
        <Tabs defaultValue="dashboard">
          <TabsList className="w-full rounded-2xl">
            <TabsTrigger value="dashboard" className="rounded-xl font-bold">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="fichas" className="rounded-xl font-bold">
              Minhas Fichas
            </TabsTrigger>
            <TabsTrigger value="historico" className="rounded-xl font-bold">
              Histórico
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6">
            <WorkoutDashboard />
          </TabsContent>
          <TabsContent value="fichas" className="mt-6">
            <WorkoutPlans />
          </TabsContent>
          <TabsContent value="historico" className="mt-6">
            <WorkoutHistoryView />
          </TabsContent>
        </Tabs>
      ) : (
        <MyJiuTab />
      )}
    </div>
  )
}
