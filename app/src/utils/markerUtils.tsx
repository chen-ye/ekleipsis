import type React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Generates a data URL for a marker image containing a Radix Icon on a colored circular background.
 * @param IconComponent The Radix Icon component to render.
 * @param color The CSS color string for the background circle.
 * @param size The diameter of the marker in pixels (default: 32).
 * @returns A data URL string representing the generated image.
 */
export const createMarkerImage = (
	IconComponent: React.FC<{ color?: string; width?: number; height?: number }>,
	color: string,
	size: number = 25,
): string => {
	// Render icon to SVG string; scale down to fit in circle
	const iconSize = size * 0.6;
	const svgString = renderToStaticMarkup(
		<IconComponent color="white" width={iconSize} height={iconSize} />,
	);

	const circledSvg = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}" />
            <g transform="translate(${(size - iconSize) / 2}, ${(size - iconSize) / 2})">
                ${svgString}
            </g>
        </svg>
    `;

	return (
		'data:image/svg+xml;base64,' +
		btoa(unescape(encodeURIComponent(circledSvg)))
	);
};
