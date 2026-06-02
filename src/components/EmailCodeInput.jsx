import { useRef, useEffect } from 'react'
import styles from './EmailCodeInput.module.css'

const LENGTH = 6

export function EmailCodeInput({ value, onChange, disabled, autoFocus }) {
  const refs = useRef([])
  const digits = value.padEnd(LENGTH, ' ').slice(0, LENGTH).split('')

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const update = (next) => onChange(next.replace(/\D/g, '').slice(0, LENGTH))

  const handleChange = (index, char) => {
    const d = char.replace(/\D/g, '')
    if (!d) {
      const arr = value.split('')
      arr[index] = ''
      update(arr.join(''))
      return
    }
    const arr = value.padEnd(index, ' ').slice(0, index).split('')
    while (arr.length < index) arr.push('')
    arr[index] = d.slice(-1)
    const joined = arr.join('').replace(/\s/g, '')
    update(joined)
    if (index < LENGTH - 1) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    if (pasted) {
      update(pasted)
      refs.current[Math.min(pasted.length, LENGTH - 1)]?.focus()
    }
  }

  return (
    <div className={styles.wrap} onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={`${styles.cell} ${d.trim() ? styles.cellFilled : ''}`}
          value={d.trim() ? d : ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
        />
      ))}
    </div>
  )
}
