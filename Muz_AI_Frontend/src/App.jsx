import { createBrowserRouter, Link, Navigate, RouterProvider, useParams } from "react-router";
import AuthPage from "./pages/AuthPage.jsx";
import Home, { projects } from "./pages/Home.jsx";
import ProdPage from "./pages/ProdPage.jsx";

function ProjectsComingSoon() {
	return (
		<main className="grid min-h-screen place-items-center bg-[#1f1e21] p-6 text-[#f4f1f7]">
			<section className="text-center">
				<h1 className="text-3xl font-semibold">My Projects</h1>
				<p className="mt-3 text-white/70">Your projects page is coming soon.</p>
			</section>
		</main>
	);
}

function ProjectComingSoon() {
	const { projectId } = useParams();
	const project = projects.find(({ id }) => id === projectId);

	return (
		<main className="grid min-h-screen place-items-center bg-[#1f1e21] p-6 text-[#f4f1f7]">
			<section className="text-center">
				<h1 className="text-3xl font-semibold">
					{project ? project.name : "Project not found"}
				</h1>
				<p className="mt-3 text-white/70">Project editing is coming soon.</p>
				<Link
					to="/home"
					className="mt-6 inline-block rounded-xl bg-[#606b91] px-4 py-2.5 text-white no-underline hover:bg-[#707cae]"
				>
					Back to Home
				</Link>
			</section>
		</main>
	);
}

const router = createBrowserRouter([
	{
		path: "/",
		element: <Navigate to="/home" replace />,
	},
	{
		path: "/home",
		element: <Home />,
	},
	{
		path: "/projects",
		element: <ProdPage />,
	},
	{
		path: "/projects/:projectId",
		element: <ProdPage />,
	},
	{
		path: "/authentication",
		element: <AuthPage />,
	},
	{
		path: "*",
		element: <Navigate to="/home" replace />,
	},
]);

function App() {
	return <RouterProvider router={router} />;
}

export default App;
