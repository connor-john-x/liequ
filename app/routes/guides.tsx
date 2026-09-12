import { Form, Link } from "react-router";
import { CategoryPill } from "~/components/category-pill";
import { EmptyState } from "~/components/empty-state";
import { RiskBadge } from "~/components/risk-badge";
import { getDb, listCategories, listGuides } from "~/lib/db.server";
import { buildMeta } from "~/lib/meta";
import type { Route } from "./+types/guides";

export function meta({ location }: Route.MetaArgs) {
	return buildMeta({
		title: "维权指南",
		description:
			"针对押金不退、强制购物、预付卡跑路、培训贷等常见纠纷，提供投诉渠道、法律依据与沟通话术。",
		path: location.pathname,
	});
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const q = url.searchParams.get("q")?.trim() ?? "";
	const category = url.searchParams.get("category")?.trim() ?? "";

	const db = await getDb(context.cloudflare.env);
	const [guides, categories] = await Promise.all([
		listGuides(db, { q, category }),
		listCategories(db),
	]);

	return { guides, categories, filters: { q, category } };
}

export default function GuidesPage({ loaderData }: Route.ComponentProps) {
	const { guides, categories, filters } = loaderData;

	return (
		<div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
			<nav className="flex items-center gap-2 text-xs text-slate-400">
				<Link to="/" className="hover:text-brand-600">
					首页
				</Link>
				<span>/</span>
				<span className="text-slate-600">维权指南</span>
			</nav>

			<div className="mt-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 px-6 py-10 text-white sm:px-10">
				<h1 className="text-2xl font-bold sm:text-3xl">维权指南</h1>
				<p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
					遇到不公平，不要自己硬扛。这里按常见纠纷整理了可执行的处理步骤、官方投诉渠道、法律依据和沟通话术，照着做就能开始维权。
				</p>
				<Form
					method="get"
					action="/guides"
					className="mt-6 flex max-w-lg items-center gap-2 rounded-full bg-white p-1.5"
				>
					<input
						type="search"
						name="q"
						defaultValue={filters.q}
						placeholder="搜索纠纷类型，例如：押金 / 退款 / 培训贷"
						className="h-10 flex-1 rounded-full bg-transparent px-4 text-sm text-slate-700 outline-none"
					/>
					<button
						type="submit"
						className="h-10 shrink-0 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
					>
						搜索
					</button>
				</Form>
			</div>

			<div className="no-scrollbar mt-6 flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
				<Link
					to="/guides"
					className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
						!filters.category
							? "bg-slate-900 text-white"
							: "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100"
					}`}
				>
					全部
				</Link>
				{categories.map((category) => (
					<Link
						key={category.id}
						to={`/guides?category=${category.slug}`}
						className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
							filters.category === category.slug
								? "bg-slate-900 text-white"
								: "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100"
						}`}
					>
						<span>{category.icon}</span>
						{category.name}
					</Link>
				))}
			</div>

			{guides.length === 0 ? (
				<div className="mt-6">
					<EmptyState
						icon="📖"
						title="暂时没有匹配的指南"
						description="试试换个关键词，或浏览全部指南。"
					/>
				</div>
			) : (
				<div className="mt-6 grid gap-4 md:grid-cols-2">
					{guides.map((guide) => (
						<Link
							key={guide.id}
							to={`/guides/${guide.slug}`}
							className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
						>
							<div className="flex flex-wrap items-center gap-2">
								<CategoryPill
									slug={guide.category_slug}
									name={guide.category_name}
									icon={guide.category_icon}
									accent={guide.category_accent}
									asLink={false}
								/>
								<RiskBadge level={guide.risk_level} />
							</div>
							<h2 className="mt-4 text-lg font-semibold leading-snug text-slate-900 transition group-hover:text-brand-600">
								{guide.title}
							</h2>
							<p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
								{guide.summary}
							</p>
							<div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
								<span className="rounded-md bg-slate-100 px-2 py-0.5">
									适用场景
								</span>
								<span className="line-clamp-1">{guide.scenario}</span>
							</div>
							<span className="mt-5 text-xs font-medium text-brand-600">
								查看解决方案 →
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
