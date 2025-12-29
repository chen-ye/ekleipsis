import { PersonIcon } from '@radix-ui/react-icons';
import { Avatar, Box, Button, DropdownMenu } from '@radix-ui/themes';
import type { User } from 'firebase/auth';

interface LoginWidgetProps {
	user: User | null;
	onLogin: () => void;
	onLogout: () => void;
}

export const LoginWidget = ({ user, onLogin, onLogout }: LoginWidgetProps) => {
	return (
		<Box
			style={{
				background: 'var(--color-panel-translucent)',
				backdropFilter: 'blur(16px)',
				borderRadius: '9999px', // Pill shape
				border: '1px solid var(--gray-a4)',
				overflow: 'hidden',
			}}
		>
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
						<DropdownMenu.Label>
							{user.displayName || user.email}
						</DropdownMenu.Label>
						<DropdownMenu.Item color="red" onClick={onLogout}>
							Log out
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			) : (
				<Button
					size="2"
					variant="surface"
					onClick={onLogin}
					style={{
						gap: '8px',
						paddingInlineStart: '0',
						color: 'var(--gray-12)',
					}}
				>
					<Avatar
						size="2"
						radius="full"
						fallback={<PersonIcon />}
					/>
					Log in
				</Button>
			)}
		</Box>
	);
};
