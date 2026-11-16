import { sound, useMuted } from '../sound'

export function SoundToggle({ className = '' }: { className?: string }) {
  const muted = useMuted()
  return (
    <button
      type="button"
      className={`sound-toggle ${className}`}
      onClick={() => sound.setMuted(!muted)}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      title={muted ? 'Sound off' : 'Sound on'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
