/** The one drawn icon: a plain arrow in the text's colour, turned to point back when `back` is set. */
export default function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg
      className={back ? 'arrow arrow-back' : 'arrow'}
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 10h13M11 4.5 16.5 10 11 15.5" />
    </svg>
  )
}
