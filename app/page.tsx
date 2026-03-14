import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">OrixLink AI</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#how-it-works" className="text-slate-400 hover:text-white text-sm transition-colors">
            How it works
          </Link>
          <Link href="/assessment" className="bg-teal-600 hover:bg-teal-500 text-white text-sm px-4 py-2 rounded-md transition-colors">
            Start Assessment
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block bg-teal-950 border border-teal-800 text-teal-400 text-xs font-medium px-3 py-1 rounded-full mb-8">
          Rohimaya Health AI — Universal Triage Intelligence
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
          Where every symptom<br />
          <span className="text-teal-400">finds its answer</span>
        </h1>
        <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          AI-powered triage and differential diagnosis for anyone.
          Any symptom. Any person. Any moment.
          No prior diagnosis required.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/assessment" className="bg-teal-600 hover:bg-teal-500 text-white px-8 py-3 rounded-md font-medium transition-colors text-lg">
            Start Free Assessment
          </Link>
          <Link href="#how-it-works" className="border border-slate-700 hover:border-slate-500 text-slate-300 px-8 py-3 rounded-md font-medium transition-colors text-lg">
            How it works
          </Link>
        </div>
        <p className="text-slate-600 text-sm mt-6">No account required to run your first assessment</p>
      </section>

      {/* Value props */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="w-10 h-10 bg-teal-950 border border-teal-800 rounded-md flex items-center justify-center mb-4">
              <span className="text-teal-400 text-lg font-bold">+</span>
            </div>
            <h3 className="font-semibold mb-2">Clinical Intelligence</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Ranked differential diagnoses, red flag tracking, and urgency assessment — adapted to clinicians and families alike.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="w-10 h-10 bg-teal-950 border border-teal-800 rounded-md flex items-center justify-center mb-4">
              <span className="text-teal-400 text-lg font-bold">A</span>
            </div>
            <h3 className="font-semibold mb-2">Easy to Understand</h3>
            <p className="text-slate-400 text-sm leading-relaxed">No medical jargon for patients and families. Clear language, one action, exactly what to say when you arrive.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="w-10 h-10 bg-teal-950 border border-teal-800 rounded-md flex items-center justify-center mb-4">
              <span className="text-teal-400 text-lg font-bold">↺</span>
            </div>
            <h3 className="font-semibold mb-2">Living Conversation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Add symptoms, ask follow-ups, update as things change. OrixLink updates its assessment in real time.</p>
          </div>
        </div>
      </section>
      {/* How it works */}
      <section id="how-it-works" className="border-t border-slate-800 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">1</div>
              <h3 className="font-semibold mb-2">Describe the situation</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Tell OrixLink who is asking, what the situation is, and what symptoms are present. No medical knowledge required.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">2</div>
              <h3 className="font-semibold mb-2">Get a clear assessment</h3>
              <p className="text-slate-400 text-sm leading-relaxed">OrixLink returns an urgency level, ranked differential diagnoses, red flag tracking, and exactly what to do next.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">3</div>
              <h3 className="font-semibold mb-2">Keep the conversation going</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Add new symptoms, ask questions, update as things change. The assessment updates with every message.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get an answer?</h2>
          <p className="text-slate-400 mb-8">No account needed. Start your assessment in seconds.</p>
          <Link href="/assessment" className="bg-teal-600 hover:bg-teal-500 text-white px-10 py-3 rounded-md font-medium transition-colors text-lg inline-block">
            Start Free Assessment
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">O</span>
            </div>
            <span className="text-slate-400 text-sm">OrixLink AI — Rohimaya Health AI — Pagade Ventures</span>
          </div>
          <p className="text-slate-600 text-xs">
            AI-generated clinical support only. Not a diagnosis. Not a substitute for professional medical evaluation.
          </p>
        </div>
      </footer>

    </main>
  )
}