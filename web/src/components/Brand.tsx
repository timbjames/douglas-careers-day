import { useState } from 'react'
import { brand } from '../brand'

/** Shows an image, or falls back to `fallback` if the file hasn't been added yet. */
function LogoImage({ src, alt, height, fallback }: { src: string; alt: string; height: number; fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <>{fallback}</>
  return <img src={src} alt={alt} style={{ height }} className="logo-img" onError={() => setFailed(true)} />
}

export function CompanyLogo({ height = 40 }: { height?: number }) {
  return (
    <LogoImage
      src={brand.company.logo}
      alt={brand.company.name}
      height={height}
      fallback={
        <span className="logo-text logo-text--company" style={{ fontSize: height * 0.8 }}>
          {brand.company.name}
        </span>
      }
    />
  )
}

export function SchoolCrest({ height = 40, showName = true }: { height?: number; showName?: boolean }) {
  return (
    <span className="school">
      <LogoImage src={brand.school.crest} alt={`${brand.school.name} crest`} height={height} fallback={null} />
      {showName && (
        <span className="school__text">
          <span className="school__name" style={{ fontSize: Math.max(14, height * 0.42) }}>
            {brand.school.name}
          </span>
          <span className="school__place">{brand.school.place}</span>
        </span>
      )}
    </span>
  )
}

/** "LRQA × Douglas Academy" lock-up used on the home page and big screen. */
export function CoBrand({ height = 40, className = '' }: { height?: number; className?: string }) {
  return (
    <div className={`cobrand ${className}`}>
      <CompanyLogo height={height} />
      <span className="cobrand__x" aria-hidden="true">
        ×
      </span>
      <SchoolCrest height={height * 1.15} />
    </div>
  )
}
