import { Link } from "react-router";

export default function Home() {
	return (
		<main className="grid min-h-screen place-items-center p-6">
			<section className="text-center">
				<h1 className="m-0 text-4xl font-bold">Welcome to Muz AI</h1>
				<p className="mt-4">Your home page is ready.</p>
				<Link
					to="/authentication"
					className="mt-6 inline-block rounded-lg bg-[#635bff] px-4 py-3 font-semibold text-white no-underline"
				>
					Go to authentication
				</Link>
			</section>
		</main>
	);
}