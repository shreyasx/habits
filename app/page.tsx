import { Header } from "@/components/header";
import { HabitList } from "@/components/habit-list";

export default function Home() {
	return (
		<div className="min-h-screen bg-black text-white">
			<Header />
			<main className="px-4 pt-20 pb-4 pr-0">
				<HabitList />
			</main>
		</div>
	);
}
