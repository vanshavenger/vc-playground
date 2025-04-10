import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'

const OTP_DIGIT = 6
const OTP = () => {
  const [otp, setOtp] = useState(new Array(OTP_DIGIT).fill(''))
  const inputRefs = useRef<HTMLInputElement[]>([])

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value
    if (isNaN(Number(value))) return

    const newOtp = [...otp]

    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    if (value && index < OTP_DIGIT - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (
      e.key === 'Backspace' &&
      !otp[index] &&
      index > 0 &&
      inputRefs.current[index - 1]
    ) {
      inputRefs.current[index - 1].focus()
    }
  }
  return (
    <div>
      <h1> Validate Input</h1>
      {otp.map((digit, index) => {
        return (
          <input
            className='otp-input'
            key={index}
            type='text'
            inputMode='numeric'
            value={digit}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onChange={(e) => handleOnChange(e, index)}
            ref={(el) => {
              if (el) inputRefs.current[index] = el
            }}
          />
        )
      })}
    </div>
  )
}

export default OTP
