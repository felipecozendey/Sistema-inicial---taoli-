import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'

export function EvolutionGallery() {
  const { bodyMetrics } = useAppStore()

  const photos = useMemo(() => {
    return bodyMetrics
      .filter((m) => m.photoUrls.length > 0)
      .flatMap((m) => m.photoUrls.map((url) => ({ url, date: m.date })))
  }, [bodyMetrics])

  if (photos.length === 0) return null

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-[#CE82FF]/15 flex items-center justify-center">
          <span className="text-xl">📸</span>
        </div>
        <h3 className="text-lg font-extrabold">Galeria de Evolução</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo, idx) => (
          <div key={idx} className="relative rounded-2xl overflow-hidden group">
            <img
              src={photo.url}
              alt={`Foto ${idx + 1}`}
              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <p className="text-xs font-bold text-white">
                {new Date(photo.date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
