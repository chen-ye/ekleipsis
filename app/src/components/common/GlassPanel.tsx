import { Box } from '@radix-ui/themes';
import type { BoxProps } from '@radix-ui/themes';
import React from 'react';

type GlassPanelProps = BoxProps & {
    children: React.ReactNode;
};

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(({ style, ...props }, ref) => {
    return (
        <Box
            ref={ref}
            style={{
                background: 'var(--color-panel-translucent)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--gray-a4)',
                borderRadius: 'var(--radius-3)', // Default radius
                ...style,
            }}
            {...props}
        >
            {props.children}
        </Box>
    );
});

GlassPanel.displayName = "GlassPanel";
