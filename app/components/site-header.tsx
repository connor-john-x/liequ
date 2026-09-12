import { useState } from "react";
import { Form, Link, NavLink } from "react-router";
import { SITE } from "~/lib/site";

const NAV = [
	{ to: "/", label: "首页", end: true },
	{ to: "/posts", label: "避雷墙" },
	{ to: "/guides", label: "维权指南" },
];

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="7" />
			<path d="m20 20-3.5-3.5" strokeLinecap="round" />
		</svg>
	);
}

export function SiteHeader() {
	const [searchOpen, setSearchOpen] = useState(false);

	return (
		<header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<div className="flex h-16 items-center gap-3">
					<Link to="/" className="flex shrink-0 items-center gap-2">
						<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white shadow-sm shadow-brand-200">
							🛡️
						</span>
						<span className="flex flex-col leading-none">
							<span className="text-lg font-bold tracking-tight text-slate-900">
								{SITE.name}
							</span>
							<span className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">
								{SITE.tagline}
							</span>
						</span>
					</Link>

					<nav className="hidden items-center gap-1 md:flex">
						{NAV.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								end={item.end}
								className={({ isActive }) =>
									`rounded-lg px-3 py-2 text-sm font-medium transition ${
										isActive
											? "bg-brand-50 text-brand-700"
											: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
									}`
								}
							>
								{item.label}
							</NavLink>
						))}
					</nav>

					<div className="ml-auto flex items-center gap-2">
						<Form
							method="get"
							action="/posts"
							className="hidden w-64 lg:block"
						>
							<div className="relative">
								<SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
								<input
									type="search"
									name="q"
									placeholder="搜索商家、地区、关键词…"
									className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
								/>
							</div>
						</Form>

						<button
							type="button"
							onClick={() => setSearchOpen((value) => !value)}
							aria-label="搜索"
							aria-expanded={searchOpen}
							className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:bg-slate-200 lg:hidden"
						>
							<SearchIcon className="h-5 w-5" />
						</button>

						<Link
							to="/submit"
							className="shrink-0 rounded-full bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:bg-brand-800 sm:px-4"
						>
							+ 我要曝光
						</Link>
					</div>
				</div>

				{searchOpen ? (
					<Form method="get" action="/posts" className="pb-3 lg:hidden">
						<div className="relative">
							<SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<input
								type="search"
								name="q"
								autoFocus
								placeholder="搜索商家、机构、地区或关键词…"
								className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
							/>
						</div>
					</Form>
				) : null}

				<nav className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-2.5 md:hidden">
					{NAV.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.end}
							className={({ isActive }) =>
								`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
									isActive
										? "bg-brand-50 text-brand-700"
										: "text-slate-600 hover:bg-slate-100"
								}`
							}
						>
							{item.label}
						</NavLink>
					))}
				</nav>
			</div>
		</header>
	);
}
