import TypeIt from 'typeit-react'

export function GreetingSection() {
  return (
    <div className="rounded-xl bg-zinc-700 p-2 text-center text-orange-50 shadow-sm [&_p]:leading-7">
      <TypeIt
        as="p"
        getBeforeInit={(instance) =>
          instance
            .type('helo')
            .move(-3)
            .delete(1)
            .type('H')
            .move(2)
            .type('l')
            .move(null, { to: 'END' })
            .type(', I am an artist')
            .delete(9)
            .type('a product manager')
            .delete(15)
            .type('frontend developer.')
        }
        options={{
          deleteSpeed: 75,
          loop: true,
          speed: 100,
        }}
      />
    </div>
  )
}
