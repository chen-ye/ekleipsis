import { useCesium } from 'resium';
import { JulianDate, ClockRange, ClockStep } from 'cesium';
import { useEffect, useState, useCallback } from 'react';
import './TimelineControl.css';

// Fixed date for the eclipse: Aug 12, 2026
// Range: 16:00 UTC to 20:00 UTC (Partial start to end approx for Mallorca)
// Actually, let's give a wider range: 12:00 UTC to 22:00 UTC
const START_TIME_ISO = '2026-08-12T16:00:00Z';
const END_TIME_ISO = '2026-08-12T20:00:00Z';

const START_JD = JulianDate.fromIso8601(START_TIME_ISO);
const END_JD = JulianDate.fromIso8601(END_TIME_ISO);
const DURATION_SECONDS = JulianDate.secondsDifference(END_JD, START_JD);

export default function TimelineControl() {
  const { viewer } = useCesium();
  const [progress, setProgress] = useState(0.5); // 0 to 1

  // Update slider when clock ticks (if playing)
  useEffect(() => {
    if (!viewer) return;

    const onTick = () => {
      const current = viewer.clock.currentTime;
      const diff = JulianDate.secondsDifference(current, START_JD);
      const newProgress = Math.max(0, Math.min(1, diff / DURATION_SECONDS));
      setProgress(newProgress);
    };

    viewer.clock.onTick.addEventListener(onTick);
    return () => {
      viewer.clock.onTick.removeEventListener(onTick);
    };
  }, [viewer]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!viewer) return;
    const val = parseFloat(e.target.value);
    setProgress(val);

    // Set clock time
    const seconds = val * DURATION_SECONDS;
    const newDate = JulianDate.addSeconds(START_JD, seconds, new JulianDate());
    viewer.clock.currentTime = newDate;
  }, [viewer]);

  if (!viewer) return null;

  return (
    <div className="timeline-control">
      <div className="timeline-info">
        <span>18:00 Local</span>
        <span>Eclipse Phase</span>
        <span>22:00 Local</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={progress}
        onChange={handleChange}
        className="timeline-slider"
      />
    </div>
  );
}
