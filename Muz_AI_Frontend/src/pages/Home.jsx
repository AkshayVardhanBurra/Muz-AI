import { useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../lib/supabaseClient";

function Sidebar() {
	return (
		<aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#0d131b] px-3 py-2 text-slate-100 md:h-full md:w-[210px] md:border-b-0 md:border-r md:px-3 md:py-5">
			<Link
				to="/home"
				className="mb-2 self-center px-2 py-1 text-xl font-bold tracking-tight text-white no-underline md:mb-8 md:text-[22px]"
			>
				MuzAI
			</Link>

			<nav aria-label="Main navigation" className="flex flex-wrap gap-2 md:flex-col md:gap-2">
				<Link
					to="/home"
					aria-current="page"
					className="rounded-lg bg-[#163239] px-3 py-2 text-sm font-medium text-[#69e2d1] no-underline md:text-sm"
				>
					Home
				</Link>
				<Link
					to="/projects"
					className="rounded-lg px-3 py-2 text-sm text-slate-300 no-underline transition-colors hover:bg-white/[0.06] hover:text-white md:text-sm"
				>
					My Projects
				</Link>
				<a
					href="#settings"
					className="rounded-lg px-3 py-2 text-sm text-slate-300 no-underline transition-colors hover:bg-white/[0.06] hover:text-white md:text-sm"
				>
					Settings
				</a>
			</nav>
		</aside>
	);
}

function ProfileMenu() {
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const [error, setError] = useState("");

	async function handleSignOut() {
		setError("");
		const { error: signOutError } = await supabase.auth.signOut();

		if (signOutError) {
			setError(signOutError.message);
			return;
		}

		navigate("/authentication");
	}

	return (
		<div className="relative">
			<button
				type="button"
				aria-label="Open account menu"
				aria-expanded={isOpen}
				onClick={() => setIsOpen((open) => !open)}
				className="flex items-center gap-2 border-0 bg-transparent p-0 text-white"
			>
				<span className="size-10 rounded-full border border-white/15 bg-[#263342]" aria-hidden="true" />
				<ChevronDown aria-hidden="true" className="size-6 stroke-[2.5]" />
			</button>

			{isOpen && (
				<div className="absolute right-0 z-10 mt-3 w-52 rounded-xl border border-white/10 bg-[#111923] p-3 shadow-xl">
					{error && (
						<p role="alert" className="mb-2 text-sm text-red-300">
							{error}
						</p>
					)}
					<button
						type="button"
						onClick={handleSignOut}
						className="w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
					>
						Sign out
					</button>
				</div>
			)}
		</div>
	);
}

function DashboardHeader() {
	return (
		<header className="mb-5 flex shrink-0 flex-col sm:mb-6">
			<div className="flex h-10 shrink-0 items-center justify-end border-b border-white/10 sm:h-[54px]">
				<ProfileMenu />
			</div>
			<div className="flex items-center justify-between gap-4 pt-5 sm:pt-7">
				<h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-3xl md:text-[30px]">
					Welcome Back, What’s new?
				</h1>
				<Link
					to="/projects"
					className="mt-1 shrink-0 rounded-lg bg-[#35cbb8] px-3 py-2 text-sm font-semibold text-[#061412] no-underline transition-colors hover:bg-[#63dfce] sm:px-4"
				>
					<Plus aria-hidden="true" className="mr-1 inline size-4" />
					New Project
				</Link>
			</div>
		</header>
	);
}

function formatUpdatedDate(value) {
	if (!value) return "Updated date unavailable";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Updated date unavailable";

	return new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}

function ProjectCard({ project }) {
	const projectName = project.project_name || "Untitled project";

	return (
		<Link
			to={`/projects/${project.id}`}
			aria-label={`Open project ${projectName}`}
			className="group relative flex h-full min-h-[180px] w-full items-end overflow-hidden rounded-[24px] border border-[#283444] bg-[#131c27] text-white no-underline transition-[transform,border-color,background-color] hover:-translate-y-1 hover:border-[#3a5661] hover:bg-[#172330] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#69e2d1]"
		>
			{project.image && (
				<img
					src={project.image}
					alt=""
					className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>
			)}
			<div className="absolute inset-0 bg-gradient-to-t from-[#081016]/95 via-[#0b151d]/35 to-transparent" />
			<div className="relative z-[1] w-full px-4 pb-4 pt-10 sm:px-5">
				<h2 className="truncate text-base font-semibold sm:text-lg">
					{projectName}
				</h2>
				<p className="mt-1 text-xs text-slate-300">
					Updated {formatUpdatedDate(project.updated_at)}
				</p>
			</div>
		</Link>
	);
}

function ProjectsSection({ projects, isLoading, error }) {
	return (
		<section id="projects" aria-label="My projects" className="flex min-h-0 flex-1 flex-col">

			{isLoading ? (
				<p role="status" className="py-8 text-center text-sm text-slate-300">
					Loading your projects…
				</p>
			) : error ? (
				<p role="alert" className="py-8 text-center text-sm text-red-300">
					{error}
				</p>
			) : projects.length === 0 ? (
				<p className="py-8 text-center text-sm text-slate-300">
					You don’t have any projects yet.
				</p>
			) : (
				<div className="grid min-h-0 flex-1 auto-rows-[minmax(180px,1fr)] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:gap-4 md:grid-cols-3 lg:gap-5">
					{projects.map((project) => (
						<ProjectCard key={project.id} project={project} />
					))}
				</div>
			)}
		</section>
	);
}

export default function Home() {
	const navigate = useNavigate();
	const [projects, setProjects] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let isMounted = true;

		async function loadProjects() {
			try {
				const { data: { user }, error: userError } = await supabase.auth.getUser();
				if (userError) throw userError;

				if (!user) {
					navigate("/authentication", { replace: true });
					return;
				}

				const { data, error: projectsError } = await supabase
					.from("projects")
					.select("id, project_name, updated_at, image")
					.eq("user_id", user.id)
					.order("updated_at", { ascending: false });

				if (projectsError) throw projectsError;
				if (isMounted) setProjects(data ?? []);
			} catch (loadError) {
				if (isMounted) {
					setError(loadError.message || "Unable to load your projects.");
				}
			} finally {
				if (isMounted) setIsLoading(false);
			}
		}

		loadProjects();
		return () => {
			isMounted = false;
		};
	}, [navigate]);

	return (
		<main className="h-dvh overflow-hidden bg-[#090d12] font-[Geist,system-ui,sans-serif] text-slate-100">
			<div className="flex h-full min-h-0 flex-col md:flex-row">
				<Sidebar />
				<div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-4 pt-2 sm:px-6 md:px-8 md:py-0 md:pb-5 lg:px-[31px]">
					<DashboardHeader />
					<ProjectsSection projects={projects} isLoading={isLoading} error={error} />
				</div>
			</div>
		</main>
	);
}
