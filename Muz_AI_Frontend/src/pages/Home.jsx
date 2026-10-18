import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../lib/supabaseClient";

const snarePitch = 38;

export const projects = [
	{
		id: "proj_001",
		name: "Midnight Dreams",
		tempo: 120,
		tracks: [
			{
				instrument: "synth",
				notes: [
					{ step: 0, pitch: 60, duration: 1 },
					{ step: 4, pitch: 64, duration: 1 },
					{ step: 8, pitch: 67, duration: 2 },
					{ step: 12, pitch: 72, duration: 1 },
				],
			},
			{
				instrument: "kick",
				notes: [
					{ step: 0, pitch: 36, duration: 1 },
					{ step: 4, pitch: 36, duration: 1 },
					{ step: 8, pitch: 36, duration: 1 },
					{ step: 12, pitch: 36, duration: 1 },
				],
			},
			{
				instrument: "bass",
				notes: [
					{ step: 0, pitch: 40, duration: 2 },
					{ step: 6, pitch: 43, duration: 2 },
					{ step: 10, pitch: 45, duration: 2 },
				],
			},
		],
	},
	{
		id: "proj_002",
		name: "Pixel Adventure",
		tempo: 140,
		tracks: [
			{
				instrument: "square",
				notes: [
					{ step: 0, pitch: 72, duration: 1 },
					{ step: 2, pitch: 76, duration: 1 },
					{ step: 4, pitch: 79, duration: 2 },
					{ step: 8, pitch: 84, duration: 1 },
					{ step: 10, pitch: 79, duration: 1 },
					{ step: 12, pitch: 76, duration: 2 },
				],
			},
			{
				instrument: "snare",
				notes: [
					{ step: 4, pitch: snarePitch, duration: 1 },
					{ step: 12, pitch: snarePitch, duration: 1 },
				],
			},
			{
				instrument: "triangle",
				notes: [
					{ step: 1, pitch: 80, duration: 1 },
					{ step: 5, pitch: 83, duration: 1 },
					{ step: 9, pitch: 86, duration: 1 },
					{ step: 13, pitch: 83, duration: 1 },
				],
			},
		],
	},
	{
		id: "proj_003",
		name: "Forest Rain",
		tempo: 85,
		tracks: [
			{
				instrument: "pad",
				notes: [
					{ step: 0, pitch: 60, duration: 4 },
					{ step: 4, pitch: 63, duration: 4 },
					{ step: 8, pitch: 67, duration: 4 },
					{ step: 12, pitch: 70, duration: 4 },
				],
			},
			{
				instrument: "bell",
				notes: [
					{ step: 2, pitch: 76, duration: 2 },
					{ step: 7, pitch: 79, duration: 2 },
					{ step: 10, pitch: 74, duration: 2 },
					{ step: 14, pitch: 81, duration: 2 },
				],
			},
			{
				instrument: "bass",
				notes: [
					{ step: 0, pitch: 36, duration: 4 },
					{ step: 8, pitch: 31, duration: 4 },
				],
			},
		],
	},
	{
		id: "proj_004",
		name: "Neon Highway",
		tempo: 128,
		tracks: [
			{
				instrument: "sawtooth",
				notes: [
					{ step: 0, pitch: 67, duration: 2 },
					{ step: 3, pitch: 71, duration: 2 },
					{ step: 6, pitch: 74, duration: 2 },
					{ step: 9, pitch: 79, duration: 2 },
					{ step: 12, pitch: 74, duration: 2 },
				],
			},
			{
				instrument: "kick",
				notes: [
					{ step: 0, pitch: 36, duration: 1 },
					{ step: 4, pitch: 36, duration: 1 },
					{ step: 8, pitch: 36, duration: 1 },
					{ step: 12, pitch: 36, duration: 1 },
				],
			},
			{
				instrument: "closed_hat",
				notes: [
					{ step: 2, pitch: 42, duration: 1 },
					{ step: 6, pitch: 42, duration: 1 },
					{ step: 10, pitch: 42, duration: 1 },
					{ step: 14, pitch: 42, duration: 1 },
				],
			},
		],
	},
	{
		id: "proj_005",
		name: "Lo-Fi Sunday",
		tempo: 92,
		tracks: [
			{
				instrument: "electric_piano",
				notes: [
					{ step: 0, pitch: 60, duration: 3 },
					{ step: 4, pitch: 64, duration: 3 },
					{ step: 8, pitch: 67, duration: 3 },
					{ step: 12, pitch: 64, duration: 3 },
				],
			},
			{
				instrument: "kick",
				notes: [
					{ step: 0, pitch: 36, duration: 1 },
					{ step: 7, pitch: 36, duration: 1 },
				],
			},
			{
				instrument: "snare",
				notes: [
					{ step: 4, pitch: 38, duration: 1 },
					{ step: 12, pitch: 38, duration: 1 },
				],
			},
			{
				instrument: "vinyl_noise",
				notes: [
					{ step: 0, pitch: 50, duration: 4 },
					{ step: 8, pitch: 50, duration: 4 },
				],
			},
		],
	},
];

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
					to="#new-project"
					className="mt-1 shrink-0 rounded-lg bg-[#35cbb8] px-3 py-2 text-sm font-semibold text-[#061412] no-underline transition-colors hover:bg-[#63dfce] sm:px-4"
				>
					<Plus aria-hidden="true" className="mr-1 inline size-4" />
					New Project
				</Link>
			</div>
		</header>
	);
}

function ProjectCard({ project }) {
	return (
		<Link
			to={`/projects/${project.id}`}
			aria-label={`Open project ${project.name}`}
			className="group relative flex h-full min-h-0 w-full items-end overflow-hidden rounded-[24px] border border-[#283444] bg-[#131c27] text-white no-underline transition-[transform,border-color,background-color] hover:-translate-y-1 hover:border-[#3a5661] hover:bg-[#172330] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#69e2d1]"
		>
			<div className="flex h-1/3 w-full items-center bg-gradient-to-r from-[#123b42]/95 to-[#1b3449]/95 px-4 opacity-90 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:px-5">
				<h2 className="text-base font-medium sm:text-lg">{project.name}</h2>
			</div>
		</Link>
	);
}

function ProjectsSection() {
	return (
		<section id="projects" aria-label="My projects" className="flex min-h-0 flex-1 flex-col">
			<div className="mb-2 flex shrink-0 justify-end">
				<Link
					to="/projects"
					className="font-mono text-xs text-white underline underline-offset-2"
				>
					view more →
				</Link>
			</div>
			<div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-3 sm:gap-4 md:grid-cols-3 md:grid-rows-2 lg:gap-5">
				{projects.map((project) => (
					<ProjectCard key={project.id} project={project} />
				))}
				<Link
					to="#new-project"
					id="new-project"
					aria-label="Create a new project"
					className="group relative grid h-full min-h-0 w-full place-items-center overflow-hidden rounded-[24px] border border-dashed border-[#3b4a5c] bg-[#111923] text-white no-underline transition-colors hover:border-[#69e2d1] hover:bg-[#15232a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#69e2d1]"
				>
					<span className="grid size-16 place-items-center rounded-full border border-[#69e2d1]/50 bg-[#172b32] text-[#69e2d1] transition-colors group-hover:bg-[#1e3a40]">
						<Plus aria-hidden="true" className="size-10 stroke-[2.5]" />
					</span>
					<span className="absolute inset-x-0 bottom-0 translate-y-full bg-[#0b1218]/90 px-4 py-3 text-center text-sm font-medium opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
						Create new project
					</span>
				</Link>
			</div>
		</section>
	);
}

export default function Home() {
	return (
		<main className="h-dvh overflow-hidden bg-[#090d12] font-[Geist,system-ui,sans-serif] text-slate-100">
			<div className="flex h-full min-h-0 flex-col md:flex-row">
				<Sidebar />
				<div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-4 pt-2 sm:px-6 md:px-8 md:py-0 md:pb-5 lg:px-[31px]">
					<DashboardHeader />
					<ProjectsSection />
				</div>
			</div>
		</main>
	);
}
