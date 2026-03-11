import { useState, useRef } from 'react'
import styles from './LessonTest.module.css'

const AUTOMATION_QUESTIONS = [
  {
    question: 'Что такое автоматизация в контексте бизнес-процессов?',
    options: ['Ручное выполнение задач', 'Выполнение повторяющихся задач с помощью инструментов без постоянного участия человека', 'Только программирование на Python', 'Только no-code платформы'],
    correct: 1,
  },
  {
    question: 'Какой тип инструментов чаще используют для быстрой автоматизации без кода?',
    options: ['Только API', 'No-code/Low-code платформы и конструкторы', 'Только скрипты на JavaScript', 'Только базы данных'],
    correct: 1,
  },
  {
    question: 'Что такое пайплайн в автоматизации?',
    options: ['Один скрипт', 'Цепочка шагов (действий), выполняемых по порядку', 'Только уведомления', 'Только интеграция с почтой'],
    correct: 1,
  },
  {
    question: 'Зачем нужна интеграция сервисов в автоматизации?',
    options: ['Только для отчётов', 'Чтобы связывать данные и действия разных систем в одном сценарии', 'Только для хранения файлов', 'Только для рассылок'],
    correct: 1,
  },
  {
    question: 'Что обычно делают после настройки автоматизации?',
    options: ['Ничего', 'Мониторят работу, проверяют ошибки и при необходимости дорабатывают сценарий', 'Только перезапускают вручную', 'Удаляют все настройки'],
    correct: 1,
  },
]

export function LessonTest({ courseId, onPass }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)
  const [passed, setPassed] = useState(false)
  const lastSelectedRef = useRef(null)

  const questions = courseId === 'automation' ? AUTOMATION_QUESTIONS : AUTOMATION_QUESTIONS
  const current = questions[step]

  const handleAnswer = (optionIndex) => {
    lastSelectedRef.current = optionIndex
    setAnswers((a) => ({ ...a, [step]: optionIndex }))
  }

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep((s) => s + 1)
    } else {
      const finalAnswer = lastSelectedRef.current ?? answers[step]
      const finalAnswers = { ...answers, [step]: finalAnswer }
      const correctCount = questions.reduce((acc, q, i) => acc + (finalAnswers[i] === q.correct ? 1 : 0), 0)
      setDone(true)
      if (correctCount >= 4) {
        setPassed(true)
        onPass?.()
      }
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  if (done) {
    const correctCount = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0)
    return (
      <div className={styles.wrap}>
        <h3 className={styles.title}>
          {passed ? 'Тест пройден' : 'Тест не пройден'}
        </h3>
        <p className={styles.result}>
          Правильных ответов: {correctCount} из {questions.length}.
          {passed && ' ДЗ за первый урок засчитано. Следующий урок откроется после проверки.'}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>Тест после 1-го урока</h3>
      <p className={styles.subtitle}>Ответьте на 5 вопросов. После успешного прохождения ДЗ будет засчитано.</p>
      <div className={styles.progress}>
        Вопрос {step + 1} из {questions.length}
      </div>
      <p className={styles.question}>{current.question}</p>
      <ul className={styles.options}>
        {current.options.map((opt, i) => (
          <li key={i}>
            <label className={styles.option}>
              <input
                type="radio"
                name="q"
                checked={answers[step] === i}
                onChange={() => handleAnswer(i)}
              />
              <span>{opt}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className={styles.buttons}>
        {step > 0 && (
          <button type="button" className={styles.prevBtn} onClick={handlePrev}>Назад</button>
        )}
        <button
          type="button"
          className={styles.nextBtn}
          onClick={handleNext}
          disabled={answers[step] === undefined}
        >
          {step < questions.length - 1 ? 'Далее' : 'Завершить'}
        </button>
      </div>
    </div>
  )
}
