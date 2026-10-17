import { useEffect } from 'react'

import { RoughNotationGroup } from 'react-rough-notation'

import { AboutSection } from './AboutSection'
import { BioSection } from './BioSection'
import { GreetingSection } from './GreetingSection'
import { ILikeSection } from './ILikeSection'
import { OnTheWebSection } from './OnTheWebSection'

export function HomePage() {
  useEffect(() => {
    document.querySelectorAll('svg.rough-annotation').forEach((annotation) => {
      annotation.setAttribute('aria-hidden', 'true')
    })
  }, [])

  return (
    <RoughNotationGroup show>
      <GreetingSection />
      <AboutSection />
      <BioSection />
      <ILikeSection />
      <OnTheWebSection />
    </RoughNotationGroup>
  )
}
