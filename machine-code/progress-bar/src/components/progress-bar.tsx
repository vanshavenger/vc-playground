import { useEffect, useState } from 'react'

const Bar = ({ progress }: { progress: number }) => {
  const [val, setVal] = useState(0)

  useEffect(() => {
    setVal(progress)
  }, [progress])

  return (
    <div className='progress-outer'>
      <div
        role='progressbar'
        aria-valuemax={100}
        aria-valuemin={0}
        style={{ transform: `translateX(${val - 100}%)` }}
        className='progress-inner'
      >
        <span className='progress-label'>{val}%</span>
      </div>
    </div>
  )
}

const ProgressBar = () => {
  return (
    <div className='progress-container'>
      <h1>Progress bar</h1>
      <Bar progress={50} />
    </div>
  )
}

export default ProgressBar
