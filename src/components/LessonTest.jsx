import { useState, useRef, useMemo } from 'react'
import styles from './LessonTest.module.css'

const DEFAULT_QUESTIONS = [
  {
    question: 'Что такое автоматизация в контексте бизнес-процессов?',
    questionEn: 'What is automation in business processes?',
    options: ['Ручное выполнение задач', 'Выполнение повторяющихся задач с помощью инструментов', 'Только Python', 'Только no-code'],
    optionsEn: ['Manual tasks', 'Repeating tasks with tools', 'Python only', 'No-code only'],
    correct: 1,
  },
]

export function LessonTest({ questions, lang = 'ru', onPass, passThreshold = 0.8 }) {
  const normalized = useMemo(() => {
    const src = Array.isArray(questions) && questions.length ? questions : DEFAULT_QUESTIONS
    return src.map((q) => ({
      question: lang === 'en' && q.questionEn ? q.questionEn : q.question,
      options: lang === 'en' && q.optionsEn ? q.optionsEn : q.options,
      correct: q.correct ?? 0,
    }))
  }, [questions, lang])

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)
  const [passed, setPassed] = useState(false)
  const lastSelectedRef = useRef(null)
  const current = normalized[step]
  const minCorrect = Math.ceil(normalized.length * passThreshold)

  const handleAnswer = (optionIndex) => {
    lastSelectedRef.current = optionIndex
    setAnswers((a) => ({ ...a, [step]: optionIndex }))
  }

  const handleNext = () => {
    if (step < normalized.length - 1) {
      setStep((s) => s + 1)
    } else {
      const finalAnswers = { ...answers, [step]: lastSelectedRef.current ?? answers[step] }
      const correctCount = normalized.reduce((acc, q, i) => acc + (finalAnswers[i] === q.correct ? 1 : 0), 0)
      setDone(true)
      if (correctCount >= minCorrect) {
        setPassed(true)
        onPass?.()
      }
    }
  }

  if (done) {
    const correctCount = normalized.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0)
    return (
      <div className={styles.wrap}>
        <h3 className={styles.title}>{passed ? (lang === 'ru' ? 'Тест пройден' : 'Test passed') : (lang === 'ru' ? 'Тест не пройден' : 'Test failed')}</h3>
        <p className={styles.result}>
          {lang === 'ru' ? 'Правильных ответов' : 'Correct'}: {correctCount} / {normalized.length}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>{lang === 'ru' ? 'Тест урока' : 'Lesson test'}</h3>
      <div className={styles.progress}>{lang === 'ru' ? 'Вопрос' : 'Question'} {step + 1} / {normalized.length}</div>
      <p className={styles.question}>{current.question}</p>
      <ul className={styles.options}>
        {current.options.map((opt, i) => (
          <li key={i}>
            <label className={styles.option}>
              <input type="radio" name="q" checked={answers[step] === i} onChange={() => handleAnswer(i)} />
              <span>{opt}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className={styles.buttons}>
        {step > 0 && <button type="button" className={styles.prevBtn} onClick={() => setStep((s) => s - 1)}>{lang === 'ru' ? 'Назад' : 'Back'}</button>}
        <button type="button" className={styles.nextBtn} onClick={handleNext} disabled={answers[step] === undefined}>
          {step < normalized.length - 1 ? (lang === 'ru' ? 'Далее' : 'Next') : (lang === 'ru' ? 'Завершить' : 'Finish')}
        </button>
      </div>
    </div>
  )
}
