import { RoughNotation } from 'react-rough-notation'

export function AboutSection() {
  return (
    <section className="space-y-4">
      <h2 className="w-max border-b-4 border-zinc-600 pb-2 font-mono text-3xl font-semibold tracking-tight">About</h2>

      <p className="indent-4 leading-7 text-balance [&_span]:whitespace-nowrap [&_svg]:text-zinc-950 dark:[&_svg]:text-zinc-100">
        Alibek is a{' '}
        <RoughNotation order={1} padding={4} type="underline">
          frontend developer
        </RoughNotation>{' '}
        from Tashkent who transforms ideas into digital products. He is inspired by the creation process - from initial
        concepts to finished solutions that bring real-life benefits. He confidently guides products throughout the
        entire development journey and often thinks like a{' '}
        <RoughNotation order={2} padding={4} type="circle">
          product manager
        </RoughNotation>
        . Previously, he worked on the{' '}
        <a
          className="text-blue-500 hover:underline hover:underline-offset-4 dark:text-blue-300"
          href="https://my.proweb.uz/"
          rel="noopener,noreferrer"
          target="_blank"
        >
          Proweb Students
        </a>{' '}
        platform, which is a leader in IT education in Uzbekistan. Currently, he is involved in developing interfaces
        for the payment service as part of the{' '}
        <a
          className="text-green-500 hover:underline hover:underline-offset-4 dark:text-green-300"
          href="https://foyda.paynet.uz/"
          rel="noopener,noreferrer"
          target="_blank"
        >
          Paynet Foyda
        </a>{' '}
        project.
      </p>
    </section>
  )
}
