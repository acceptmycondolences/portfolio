import { BIO_LIST } from '~/pages/home'

export function BioSection() {
  return (
    <section className="space-y-4">
      <h2 className="w-max border-b-4 pb-2 font-mono text-3xl font-semibold tracking-tight">Bio</h2>

      <ul className="flex flex-col gap-4">
        {BIO_LIST.map((bioItem) => (
          <li className="flex items-center gap-4" key={bioItem.date}>
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
