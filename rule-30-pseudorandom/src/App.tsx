import { useCallback, useEffect, useState } from 'react'
import {
	applyRule30,
	generateSeedRow,
	generateWithoutSeedRow,
} from '@/lib/utils'
import { GRID_SIZE } from '@/constants'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Grid } from '@/components/grid'
import { Button } from '@/components/ui/button'
import {
	PauseIcon,
	PlayIcon,
	RotateCcwIcon,
	StepForwardIcon,
} from 'lucide-react'

function App() {
	const [grid, setGrid] = useState<boolean[][]>([[]])
	const [isRunning, setIsRunning] = useState<boolean>(false)
	const [useSeed, setUseSeed] = useState<boolean>(true)
	const [generatedRowNumber, setGeneratedRowNumber] = useState<number>(0)

	const initialzeGrid = useCallback(() => {
		const initialRow = useSeed
			? generateSeedRow(GRID_SIZE)
			: generateWithoutSeedRow(GRID_SIZE)

		setGrid([initialRow])
		setGeneratedRowNumber(0)
	}, [useSeed])

	useEffect(() => {
		initialzeGrid()
	}, [initialzeGrid])

	const eachRowSimulation = useCallback(() => {
		setGrid(prevGrid => {
			const lastRow = prevGrid[prevGrid.length - 1]
			const newRow = applyRule30(lastRow)
			return [...prevGrid, newRow]
		})
		setGeneratedRowNumber(prev => prev + 1)
	}, [])

	useEffect(() => {
		let interval: NodeJS.Timeout
		if (isRunning) {
			interval = setInterval(eachRowSimulation, 100)
		}
		return () => clearInterval(interval)
	}, [isRunning, eachRowSimulation])

	const handleStartStop = () => {
		setIsRunning(prev => !prev)
	}

	const handleStep = () => {
		setIsRunning(false)
		eachRowSimulation()
	}

	const handleReset = () => {
		setIsRunning(false)
		initialzeGrid()
	}

	const handleSeedToggle = (checked: boolean) => {
		setUseSeed(checked)
		setIsRunning(false)
		initialzeGrid()
	}

	return (
		<div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
			<h2 className='text-2xl font-bold mb-4'>Rule 30 simple implementation</h2>
			<div className='flex items-center space-x-4 mb-4'>
				<Switch
					id={'seed-mode'}
					checked={useSeed}
					onCheckedChange={handleSeedToggle}
				/>
				<Label htmlFor={'seed-mode'}>Use random seed</Label>
			</div>
			<div className='mb-4 w-full max-w-5xl overflow-y-auto'>
				<Grid grid={grid} />
			</div>
			<div className='flex  flex-wrap justify-center gap-2 mb-4'>
				<Button className='transition-all' onClick={handleStartStop}>
					{isRunning ? (
						<PauseIcon className='mr-2 h-4 w-4' />
					) : (
						<PlayIcon className='mr-2 h-4 w-4' />
					)}
					{isRunning ? 'Stop' : 'Start'}
				</Button>
				<Button onClick={handleStep} disabled={isRunning}>
					<StepForwardIcon className='mr-2 h-4 w-4' />
					Step
				</Button>
				<Button onClick={handleReset}>
					<RotateCcwIcon className='mr-2 h-4 w-4' />
					Reset
				</Button>
			</div>
			<div className='text-lg font-semibold mb-2'>
				Generation: {generatedRowNumber}
			</div>
		</div>
	)
}

export default App
