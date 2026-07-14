import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { FastingWidget } from '@/components/health/fasting-widget'
import { FastingCompletionModal } from '@/components/health/fasting-completion-modal'
import { FastingFeeling } from '@/types/fasting'

export function FastingTab() {
  const { activeFastingStart, selectedProtocol, endFastingTimer } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingHours, setPendingHours] = useState(0)

  const handleEndFasting = () => {
    if (!activeFastingStart) return
    const elapsed = (Date.now() - new Date(activeFastingStart).getTime()) / 3600000
    setPendingHours(elapsed)
    setModalOpen(true)
  }

  const handleSelectFeeling = (feeling: FastingFeeling) => {
    endFastingTimer(feeling)
  }

  return (
    <>
      <FastingWidget onEndFasting={handleEndFasting} />
      <FastingCompletionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        actualHours={pendingHours}
        targetHours={selectedProtocol}
        onSelectFeeling={handleSelectFeeling}
      />
    </>
  )
}
