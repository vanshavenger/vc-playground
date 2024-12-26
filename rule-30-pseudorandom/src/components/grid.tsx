import { useEffect, useRef } from 'react'

interface GridProps {
	grid: boolean[][]
}

export const Grid = ({ grid }: GridProps) => {
	const scrollRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [grid])

	return (
		<div
			ref={scrollRef}
			className='h-96 overflow-auto border border-gray-200 bg-gray-100'
		>
			{grid.map((row, i) => (
				<div key={i} className='flex'>
					{row.map((cell, j) => (
						<div
							key={`${i}-${j}`}
							className={`w-4 h-4 border border-gray-300 ${
								cell ? 'bg-black' : 'bg-white'
							}`}
							style={{ aspectRatio: '1/1' }}
						/>
					))}
				</div>
			))}
		</div>
	)
}
