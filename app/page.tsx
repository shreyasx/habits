"use client";

import { Header } from "@/components/header";
import { HabitList } from "@/components/habit-list";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Home() {
	const { isSignedIn, isLoaded } = useUser();

	// Show loading state while Clerk is loading
	if (!isLoaded) {
		return (
			<div className="min-h-screen bg-black text-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	// Show sign-in page if not authenticated
	if (!isSignedIn) {
		return (
			<div className="min-h-screen bg-black text-white flex items-center justify-center">
				<div className="text-center max-w-md mx-auto px-4">
					<h1 className="text-4xl font-bold mb-2">Habits</h1>
					<p className="text-gray-400 mb-8 italic">
						&ldquo;excellence is not an act, but a habit&rdquo;
					</p>
					<p className="text-gray-300 mb-8">
						Sign in to start tracking your habits and building better routines.
					</p>
					<div className="flex flex-col gap-4">
						<SignInButton mode="modal">
							<button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
								Sign In
							</button>
						</SignInButton>
						<SignUpButton mode="modal">
							<button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
								Create Account
							</button>
						</SignUpButton>
					</div>
				</div>
			</div>
		);
	}

	// Show the main app if authenticated
	return (
		<div className="min-h-screen bg-black text-white">
			<Header />
			<main className="px-4 pt-20 pb-4 pr-0">
				<HabitList />
			</main>
		</div>
	);
}
