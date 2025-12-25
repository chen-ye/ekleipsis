import { IconButton } from '@radix-ui/themes';
import type { IconButtonProps } from '@radix-ui/themes';
import React from 'react';

interface ActionIconButtonProps extends IconButtonProps {}

export const ActionIconButton = React.forwardRef<HTMLButtonElement, ActionIconButtonProps>(({ style, ...props }, ref) => {
    return (
        <IconButton
            ref={ref}
            size="3"
            variant="surface"
            color="gray"
            style={{
                backdropFilter: 'blur(16px)',
                background: 'var(--color-panel-translucent)',
                border: '1px solid var(--gray-a4)',
                boxShadow: 'none',
                ...style
            }}
            {...props}
        />
    );
});

ActionIconButton.displayName = "ActionIconButton";
