import type { BoxProps } from '@radix-ui/themes';
import { Box } from '@radix-ui/themes';
import React from 'react';

type GlassPanelProps = BoxProps & {
	children: React.ReactNode;
};

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
	({ style, ...props }, ref) => {
		return (
			<Box
				ref={ref}
				style={{
					background: 'var(--color-panel-translucent)',
					WebkitBackdropFilter: 'blur(16px)',
					backdropFilter: 'blur(16px)',
					border: '1px solid var(--gray-a4)',
					borderRadius: 'var(--radius-3)', // Default radius
					isolation: 'isolate',
					transform: 'translateZ(0)',
					willChange: 'transform',
					...style,
				}}
				{...props}
			>
				{props.children}
			</Box>
		);
	},
);

GlassPanel.displayName = 'GlassPanel';
