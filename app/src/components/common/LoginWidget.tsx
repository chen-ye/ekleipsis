import { PersonIcon } from '@radix-ui/react-icons';
import { Avatar, Button, DropdownMenu, IconButton } from '@radix-ui/themes';
import type { User } from 'firebase/auth';

interface LoginWidgetProps {
	user: User | null;
	onLogin: () => void;
	onLogout: () => void;
}

const TRIGGER_PROPS = {
	size: '2',
	variant: 'surface',
	radius: 'full',
	color: 'gray',
} as const;

const AVATAR_PROPS = {
	size: '2',
	radius: 'full',
} as const;

export const LoginWidget = ({ user, onLogin, onLogout, style }: LoginWidgetProps) => {
	if (user) {
		return (
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<IconButton {...TRIGGER_PROPS} style={style}>
						<Avatar
							{...AVATAR_PROPS}
							src={user.photoURL || undefined}
							fallback={user.email?.[0] || 'U'}
						/>
					</IconButton>
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
		);
	}

	return (
		<Button
			{...TRIGGER_PROPS}
			onClick={onLogin}
			style={{
				gap: 'var(--space-2)',
				paddingInlineStart: '0',
				...style,
			}}
		>
			<Avatar {...AVATAR_PROPS} fallback={<PersonIcon />} />
			Log in
		</Button>
	);
};
