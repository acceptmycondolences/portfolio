import type { JSX } from 'react'

import { RoughNotation } from 'react-rough-notation'

interface BioListItem {
  date: string
  description: () => JSX.Element
  id: number
}

const BIO_LIST: BioListItem[] = [
  {
    date: '28.09.2003',
    description: () => (
      <>
        I was born in{' '}
        <RoughNotation order={3} padding={4} type="crossed-off">
          Nukus
        </RoughNotation>
        , but due to my father's promotion, our family relocated to{' '}
        <RoughNotation order={4} padding={4} type="box">
          Tashkent
        </RoughNotation>
        , where I have been living since 2007.
      </>
    ),
    id: 1,
  },
  {
    date: '15.01.2023',
    description: () => (
      <>
        I completed a ten-month "Frontend Developer" course at{' '}
        <RoughNotation brackets={['left', 'right']} order={5} padding={2} type="bracket">
          Yandex
        </RoughNotation>
        , as well as an eight-month training program at{' '}
        <RoughNotation order={6} padding={4} type="underline">
          Skillbox
        </RoughNotation>
        , one of the leading international specialized IT education centers.
      </>
    ),
    id: 2,
  },
  {
    date: '01.08.2025',
    description: () => (
      <>
        I graduated from{' '}
        <RoughNotation order={7} padding={4} type="circle">
          Webster University
        </RoughNotation>
        , a prestigious American institution, with a{' '}
        <RoughNotation order={8} padding={4} type="box">
          degree in economics
        </RoughNotation>
        . My choice of major was influenced by my family background and personal interest in finance and economics.
      </>
    ),
    id: 3,
  },
  {
    date: 'Currently',
    description: () => (
      <>
        I am developing my career in the{' '}
        <RoughNotation brackets={['left', 'right']} order={9} padding={2} type="bracket">
          IT field
        </RoughNotation>{' '}
        as a frontend developer, participating in projects for{' '}
        <RoughNotation order={10} padding={4} type="underline">
          major companies
        </RoughNotation>{' '}
        and applying modern web development technologies.
      </>
    ),
    id: 4,
  },
]

export function BioSection() {
  return (
    <section className="space-y-4">
      <h2 className="w-max border-b-4 pb-2 font-mono text-3xl font-semibold tracking-tight">Bio</h2>

      <ul className="flex flex-col gap-4">
        {BIO_LIST.map((bioItem) => (
          <li className="flex items-center gap-4" key={bioItem.id}>
            <span className="min-w-22 font-mono">{bioItem.date}</span>
            <p className="leading-7 text-balance [&_span]:whitespace-nowrap [&_svg]:text-zinc-950 dark:[&_svg]:text-zinc-100">
              {bioItem.description()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
