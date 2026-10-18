import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@base-ui/react/button";
import { Input } from "@base-ui/react/input";
import { supabase } from "../lib/supabaseClient";

export default function AuthPage() {
	const navigate = useNavigate();
	const [mode, setMode] = useState("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [notice, setNotice] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const isSignUp = mode === "signup";

	async function handleSubmit(event) {
		event.preventDefault();
		setNotice("");
		setError("");
		setLoading(true);

		try {
			const { error: authError } = isSignUp
				? await supabase.auth.signUp({ email, password })
				: await supabase.auth.signInWithPassword({ email, password });

			if (authError) throw authError;
			if (!isSignUp) {
				navigate("/home");
				return;
			}

			setNotice(
				"Account created. Check your email to confirm your account."
			);
		} catch (authError) {
			setError(authError.message || "Authentication failed. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	function toggleMode() {
		setMode(isSignUp ? "login" : "signup");
		setNotice("");
		setError("");
	}

	return (
		<main className="grid min-h-screen place-items-center bg-[#090d12] p-6 font-[Geist,system-ui,sans-serif] text-slate-100">
			<section className="box-border w-full max-w-[420px] rounded-2xl border border-[#283444] bg-[#111923] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:p-10">
				<div className="mb-7 text-lg font-bold tracking-tight text-[#69e2d1]">MuzeAI</div>
				<h1 className="m-0 text-[28px] font-semibold tracking-[-0.6px] text-slate-50">{isSignUp ? "Create your account" : "Welcome back"}</h1>
				<p className="my-2.5 mb-7 text-[15px] text-slate-400">
					{isSignUp ? "Sign up to get started." : "Log in to continue to your account."}
				</p>

				<form onSubmit={handleSubmit} className="flex flex-col">
					<label htmlFor="auth-email" className="mb-2 text-sm font-semibold text-slate-200">Email</label>
					<Input
						id="auth-email"
						type="email"
						autoComplete="email"
						placeholder="you@example.com"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						required
						className="mb-5 box-border w-full rounded-lg border border-[#344253] bg-[#090d12] px-3.5 py-3 text-[15px] text-white placeholder:text-slate-500 outline-none transition-colors focus:border-[#69e2d1] focus:ring-2 focus:ring-[#69e2d1]/20"
					/>

					<label htmlFor="auth-password" className="mb-2 text-sm font-semibold text-slate-200">Password</label>
					<Input
						id="auth-password"
						type="password"
						autoComplete={isSignUp ? "new-password" : "current-password"}
						placeholder="At least 6 characters"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						minLength={6}
						required
						className="mb-5 box-border w-full rounded-lg border border-[#344253] bg-[#090d12] px-3.5 py-3 text-[15px] text-white placeholder:text-slate-500 outline-none transition-colors focus:border-[#69e2d1] focus:ring-2 focus:ring-[#69e2d1]/20"
					/>

					{error && <p role="alert" className="-mt-2 mb-4 text-sm text-red-300">{error}</p>}
					{notice && <p role="status" className="-mt-2 mb-4 text-sm text-[#69e2a1]">{notice}</p>}

					<Button type="submit" disabled={loading} className="cursor-pointer rounded-lg border-0 bg-[#35cbb8] px-4 py-[13px] text-[15px] font-semibold text-[#061412] transition-colors hover:bg-[#63dfce] disabled:cursor-not-allowed disabled:opacity-60">
						{loading ? "Please wait…" : isSignUp ? "Create account" : "Log in"}
					</Button>
				</form>

				<p className="mt-6 text-center text-sm text-slate-400">
					{isSignUp ? "Already have an account? " : "New to MuzeAI? "}
					<button type="button" onClick={toggleMode} className="cursor-pointer border-0 bg-transparent p-0 font-inherit font-semibold text-[#69e2d1] hover:text-[#a1f4e7]">
						{isSignUp ? "Log in" : "Sign up"}
					</button>
				</p>
			</section>
		</main>
	);
}
