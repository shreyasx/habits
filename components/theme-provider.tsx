"use client";

import * as React from "react";
import {
	ThemeProvider as NextThemesProvider,
	type Attribute,
} from "next-themes";

interface ThemeProviderProps {
	children: React.ReactNode;
	attribute?: Attribute | Attribute[];
	defaultTheme?: string;
	enableSystem?: boolean;
	disableTransitionOnChange?: boolean;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
