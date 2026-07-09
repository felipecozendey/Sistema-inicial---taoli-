export type SoundProfile = 'ding' | 'pop' | 'tibetan'

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    if (!audioContext) {
      audioContext = new AudioContext()
    }
    return audioContext
  } catch {
    return null
  }
}

function playDing(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 880
  osc.type = 'sine'
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.5)
}

function playPop(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.setValueAtTime(600, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)
  osc.type = 'sine'
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.15)
}

function playTibetanBell(ctx: AudioContext) {
  const frequencies = [220, 330, 440]
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    const startTime = ctx.currentTime + i * 0.1
    gain.gain.setValueAtTime(0.2, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2)
    osc.start(startTime)
    osc.stop(startTime + 2)
  })
}

export function playFocusSound(profile: SoundProfile) {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  switch (profile) {
    case 'ding':
      playDing(ctx)
      break
    case 'pop':
      playPop(ctx)
      break
    case 'tibetan':
      playTibetanBell(ctx)
      break
  }
}
