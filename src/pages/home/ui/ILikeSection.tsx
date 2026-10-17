export function ILikeSection() {
  return (
    <section className="space-y-4">
      <h2 className="w-max border-b-4 pb-2 font-mono text-3xl font-semibold tracking-tight">I like</h2>

      <p className="indent-4 leading-7">
        <a
          className="text-purple-500 hover:underline hover:underline-offset-4 dark:text-purple-300"
          href="https://www.artic.edu/collection/"
          rel="noopener,noreferrer"
          target="_blank"
        >
          Art
        </a>
        , Enjoying creativity,{' '}
        <a
          className="text-orange-500 hover:underline hover:underline-offset-4 dark:text-orange-300"
          href="https://open.spotify.com/album/0K4CiyPKkJvujNWuYVKWmV/"
          rel="noopener,noreferrer"
          target="_blank"
        >
          Music
        </a>
        , Listening to music,{' '}
        <a
          className="text-indigo-500 hover:underline hover:underline-offset-4 dark:text-indigo-300"
          href="https://kaptainsunshine.com/"
          rel="noopener,noreferrer"
          target="_blank"
        >
          Fashion
        </a>
        , Wearing minimalist clothing,{' '}
        <a
          className="text-sky-500 hover:underline hover:underline-offset-4 dark:text-sky-300"
          href="https://1fit.app/"
          rel="noopener,noreferrer"
          target="_blank"
        >
          Sports
        </a>
        , Going to the gym.
      </p>
    </section>
  )
}
