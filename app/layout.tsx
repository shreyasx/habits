import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Habits",
	description: "A simple habit tracker.",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Habits",
	},
	other: {
		"mobile-web-app-capable": "yes",
		"apple-mobile-web-app-capable": "yes",
		"apple-mobile-web-app-status-bar-style": "default",
		"apple-mobile-web-app-title": "Habits",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: "#000000",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider>
			<html lang="en" suppressHydrationWarning>
				<head>
					<link rel="manifest" href="/manifest.json" />
					<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
					<meta name="apple-mobile-web-app-capable" content="yes" />
					<meta
						name="apple-mobile-web-app-status-bar-style"
						content="default"
					/>
					<meta name="apple-mobile-web-app-title" content="Habits" />
					<meta name="mobile-web-app-capable" content="yes" />
					<meta name="theme-color" content="#000000" />
					<script
						dangerouslySetInnerHTML={{
							__html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `,
						}}
					/>
				</head>
				<body
					className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				>
					<ThemeProvider
						attribute="class"
						defaultTheme="dark"
						enableSystem
						disableTransitionOnChange
					>
						{children}
					</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
