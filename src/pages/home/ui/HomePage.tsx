import { RoughNotationGroup } from 'react-rough-notation'

import { AboutSection, BioSection, GreetingSection, ILikeSection, OnTheWebSection } from '~/pages/home'

export function HomePage() {
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
