import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// CESIUM_BASE_URL is defined in vite.config.ts
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Theme
			accentColor="iris"
			grayColor="slate"
			radius="large"
			appearance="dark"
		>
			<App />
		</Theme>
	</StrictMode>,
);
