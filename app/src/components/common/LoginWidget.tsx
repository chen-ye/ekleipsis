import { Box, Button, Avatar, DropdownMenu } from '@radix-ui/themes';
import { PersonIcon } from '@radix-ui/react-icons';
import type { User } from 'firebase/auth';

interface LoginWidgetProps {
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
}

export const LoginWidget = ({ user, onLogin, onLogout }: LoginWidgetProps) => {
    return (
        <Box style={{
            background: 'var(--color-panel-translucent)',
            backdropFilter: 'blur(16px)',
            borderRadius: '9999px', // Pill shape
            border: '1px solid var(--gray-a4)',
            overflow: 'hidden'
        }}>
            {user ? (
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <Avatar
                            src={user.photoURL || undefined}
                            fallback={user.email?.[0] || 'U'}
                            radius="full"
                            size="2"
                            style={{ cursor: 'pointer', display: 'block' }}
                        />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <DropdownMenu.Label>{user.displayName || user.email}</DropdownMenu.Label>
                        <DropdownMenu.Item color="red" onClick={onLogout}>
                            Log out
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            ) : (
                <Button
                    size="2"
                    variant="ghost"
                    onClick={onLogin}
                    style={{
                        padding: '4px 12px 4px 8px',
                        height: 'auto',
                        gap: '8px',
                        color: 'var(--gray-12)'
                    }}
                >
                    <Box style={{
                        background: 'var(--gray-a4)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px'
                    }}>
                         <PersonIcon width="14" height="14" />
                    </Box>
                    Log in
                </Button>
            )}
        </Box>
    );
};
