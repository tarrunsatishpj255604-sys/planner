import './Timeline.css'

const steps = [
  { n: '1', t: 'Set up your timetable', p: 'Add your subjects, lessons and lesson times in minutes.' },
  { n: '2', t: 'Add tasks & exams', p: 'Log homework, tests and exams with due dates and priorities.' },
  { n: '3', t: 'Enable Smart Revision', p: 'Cheon generates a study plan tailored to your assessments.' },
  { n: '4', t: 'Study & track progress', p: 'Follow your sessions, tick off tasks and watch your streak grow.' },
]

export default function Timeline() {
  return (
    <section className="section timeline-section">
      <div className="container">
        <span className="eyebrow">How it works</span>
        <h2 className="section-title">From chaos to organised in 4 steps</h2>
        <p className="section-sub">
          Get set up in minutes and let Cheon handle the planning from there.
        </p>
        <div className="timeline">
          {steps.map((s) => (
            <div key={s.n} className="tl-step">
              <div className="tl-node">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
