import Link from 'next/link'

const TOOLS = [
  {
    href: '/blob-gradient',
    title: 'Blob Gradient Builder',
    description: 'WebGL shader-based gradient designer with live controls',
    preview: {
      bg: '#08080f',
      blobs: [
        { x: 28, y: 52, color: '#6366f1', r: 55 },
        { x: 72, y: 65, color: '#ec4899', r: 45 },
        { x: 50, y: 20, color: '#06b6d4', r: 40 },
      ],
    },
  },
]

function GradientPreview({ bg, blobs }: typeof TOOLS[0]['preview']) {
  const gradients = blobs
    .map(b => `radial-gradient(circle at ${b.x}% ${b.y}%, ${b.color} 0%, transparent ${b.r}%)`)
    .join(', ')

  return (
    <div className="relative h-44 overflow-hidden" style={{ background: bg }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-20%',
          filter: 'blur(48px)',
          background: gradients,
        }}
      />
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 px-12 py-16">
      <header className="mb-14">
        <p className="text-neutral-600 text-sm uppercase tracking-widest mb-3">zSpace</p>
        <h1 className="text-5xl font-semibold text-white tracking-tight">
          Internal Design Tools
        </h1>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {TOOLS.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group block rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-all duration-200 hover:-translate-y-0.5"
          >
            <GradientPreview {...tool.preview} />
            <div className="px-4 py-3">
              <h2 className="text-white text-sm font-medium">{tool.title}</h2>
              <p className="text-neutral-500 text-xs mt-0.5 leading-relaxed">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
