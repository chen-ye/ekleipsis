import { Card } from '@radix-ui/themes';
import { AxisBottom } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { localPoint } from '@visx/event';
import { LinearGradient } from '@visx/gradient';
import { ParentSize } from '@visx/responsive';
import { scaleLinear, scaleTime } from '@visx/scale';
import { AreaClosed, Bar, Line } from '@visx/shape';
import { JulianDate } from 'cesium';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCesium } from 'resium';

export interface DataPoint {
	date: Date;
	coverage: number;
}

interface TimelineControlProps {
	startTime: Date;
	endTime: Date;
	totalityStartTime?: Date;
	totalityEndTime?: Date;
	data: DataPoint[];
}

export default function TimelineControl({
	startTime,
	endTime,
	totalityStartTime,
	totalityEndTime,
	data,
}: TimelineControlProps) {
	const { viewer } = useCesium();
	const [currentTime, setCurrentTime] = useState<Date>(startTime);
	const [isDragging, setIsDragging] = useState(false);

	// Sync state with Cesium clock
	useEffect(() => {
		if (!viewer) return;

		const onTick = () => {
			// If dragging, we don't update from clock to avoid fighting
			if (isDragging) return;

			const currentJD = viewer.clock.currentTime;
			// Convert JulianDate to JS Date
			// This is a bit approximate but fine for UI
			const jsDate = JulianDate.toDate(currentJD);
			setCurrentTime(jsDate);
		};

		viewer.clock.onTick.addEventListener(onTick);
		return () => {
			viewer.clock.onTick.removeEventListener(onTick);
		};
	}, [viewer, isDragging]);

	const setClockTime = useCallback(
		(time: Date) => {
			if (!viewer) return;
			const jd = JulianDate.fromDate(time);
			viewer.clock.currentTime = jd;
			setCurrentTime(time);
		},
		[viewer],
	);

	if (!viewer) return null;

	return (
		<Card
			style={{
				position: 'absolute',
				bottom: '40px',
				left: 20,
				right: 20,
				zIndex: 100,
				overflow: 'hidden', // changed to hidden to prevent spillover
				padding: 0,
				backgroundColor: 'var(--black-a6)', // Radix translucent panel
				backdropFilter: 'blur(16px)', // Enhance glass effect
			}}
		>
			<div
				style={{
					height: 'min(140px, 15svh)',
					width: '100%',
					position: 'relative',
				}}
			>
				<ParentSize>
					{({ width, height }) => (
						<EclipseGraph
							width={width}
							height={height}
							data={data}
							currentTime={currentTime}
							startTime={startTime}
							endTime={endTime}
							totalityStartTime={totalityStartTime}
							totalityEndTime={totalityEndTime}
							onTimeChange={(t) => {
								setClockTime(t);
							}}
							onDragStateChange={setIsDragging}
						/>
					)}
				</ParentSize>
			</div>
		</Card>
	);
}

interface EclipseGraphProps {
	width: number;
	height: number;
	data: DataPoint[];
	currentTime: Date;
	startTime: Date;
	endTime: Date;
	totalityStartTime?: Date;
	totalityEndTime?: Date;
	onTimeChange: (time: Date) => void;
	onDragStateChange: (isDragging: boolean) => void;
}

function EclipseGraph({
	width,
	height,
	data,
	currentTime,
	startTime,
	endTime,
	totalityStartTime,
	totalityEndTime,
	onTimeChange,
	onDragStateChange,
}: EclipseGraphProps) {
	const margin = { top: 20, bottom: 30, left: 0, right: 0 };
	const xMax = width;
	const yMax = height - margin.bottom;

	const maxCoverage = Math.max(...data.map((d) => d.coverage));

	const xScale = useMemo(
		() =>
			scaleTime({
				domain: [startTime, endTime],
				range: [margin.left, xMax - margin.right],
			}),
		[startTime, endTime, xMax],
	);

	const yScale = useMemo(
		() =>
			scaleLinear({
				domain: [0, maxCoverage || 1],
				range: [yMax, margin.top],
			}),
		[maxCoverage, yMax],
	);

	const handlePointer = useCallback(
		(event: React.PointerEvent) => {
			const { x } = localPoint(event) || { x: 0 };
			// Clamp x to range
			const clampedX = Math.min(Math.max(x, margin.left), xMax - margin.right);
			const newDate = xScale.invert(clampedX);
			onTimeChange(newDate);
		},
		[xScale, xMax, onTimeChange],
	);

	const currentX = xScale(currentTime) ?? margin.left;
	// Clamp currentX for display safety
	const displayX = Math.min(
		Math.max(currentX, margin.left),
		xMax - margin.right,
	);

	// Format time for label
	const timeLabel = currentTime.toLocaleTimeString([], {
		timeZone: 'Europe/Madrid',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});

	// CSS Variable access helpers
	const axisColor = 'var(--gray-a6)';
	const playheadColor = 'var(--gray-a10)';
	const axisTextColor = 'var(--gray-11)';
	const overlayBg = 'var(--gray-a4)';
	const overlayBorder = 'var(--gray-a4)';

	if (width < 10) return null;
	return (
		<div style={{ position: 'relative', width, height }}>
			<svg
				width={width}
				height={height}
				style={{ overflow: 'visible', touchAction: 'none' }}
				onPointerDown={(e) => {
					(e.target as Element).setPointerCapture(e.pointerId);
					onDragStateChange(true);
					handlePointer(e);
				}}
				onPointerMove={(e) => {
					if (e.buttons > 0) {
						handlePointer(e);
					}
				}}
				onPointerUp={(e) => {
					(e.target as Element).releasePointerCapture(e.pointerId);
					onDragStateChange(false);
				}}
			>
				<title>Eclipse Timeline Graph</title>
				{/* Define gradient using CSS vars */}
				<LinearGradient
					id="eclipse-gradient"
					from="var(--amber-1)"
					to="var(--amber-9)"
					toOpacity={0.1}
					fromOpacity={0.6}
				/>
				<LinearGradient
					id="totality-gradient"
					from="var(--black-12)"
					to="var(--black-11)"
					toOpacity={0.5}
					fromOpacity={0.1}
				/>

				{/* Background Data Graph */}
				<AreaClosed<DataPoint>
					data={data}
					x={(d) => xScale(d.date) ?? 0}
					y={(d) => yScale(d.coverage) ?? 0}
					yScale={yScale}
					strokeWidth={2}
					stroke="url(#eclipse-gradient)"
					fill="url(#eclipse-gradient)"
					curve={curveMonotoneX}
				/>

				{/* Totality Band (Rendered ON TOP of AreaClosed to show "special black area") */}
				{totalityStartTime && totalityEndTime && (
					<Bar
						x={xScale(totalityStartTime) ?? 0}
						y={margin.top}
						width={Math.max(
							1,
							(xScale(totalityEndTime) ?? 0) - (xScale(totalityStartTime) ?? 0),
						)}
						height={yMax - margin.top}
						fill="url(#totality-gradient)"
					/>
				)}

				{/* Axis */}
				<AxisBottom
					scale={xScale}
					top={yMax}
					stroke={axisColor}
					tickStroke={axisColor}
					tickLabelProps={() => ({
						fill: axisTextColor,
						fontSize: 10,
						textAnchor: 'middle',
						fontFamily: 'var(--default-font-family)',
					})}
					tickFormat={(val) => {
						if (val instanceof Date) {
							return val.toLocaleTimeString([], {
								timeZone: 'Europe/Madrid',
								hour: '2-digit',
								minute: '2-digit',
							});
						}
						return '';
					}}
				/>

				{/* Playhead Line */}
				<Line
					from={{ x: displayX, y: margin.top }}
					to={{ x: displayX, y: yMax }}
					stroke={playheadColor}
					strokeWidth={1}
					pointerEvents="none"
					strokeDasharray="4 4"
				/>

				{/* Interactive Overlay */}
				<Bar
					x={margin.left}
					y={0}
					width={Math.max(0, xMax - margin.left - margin.right)}
					height={height}
					fill="transparent"
					rx={14}
				/>
			</svg>

			{/* Glassmorphic Time Scrim Overlaying Axis */}
			<div
				style={{
					position: 'absolute',
					left: displayX - 40, // Center horizontally
					top: yMax - 12, // Center vertically on axis
					width: '80px',
					height: '24px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: overlayBg,
					backdropFilter: 'blur(8px)',
					borderRadius: '12px',
					border: `1px solid ${overlayBorder}`,
					boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
					color: 'var(--gray-12)',
					fontSize: '11px',
					fontWeight: 400,
					fontFamily: 'var(--default-font-family)',
					textBoxTrim: 'trim-both',
					pointerEvents: 'none',
					userSelect: 'none',
					zIndex: 10,
				}}
			>
				{timeLabel}
			</div>
		</div>
	);
}
