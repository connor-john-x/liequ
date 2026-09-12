import { Form, Link, useSearchParams } from "react-router";
import { EmptyState } from "~/components/empty-state";
import { Pagination } from "~/components/pagination";
import { PostCard } from "~/components/post-card";
import { getClientId } from "~/lib/client-id.server";
import {
	getCategoryBySlug,
	getDb,
	getUserReactions,
	listCategories,
	listPosts,
	listRegions,
} from "~/lib/db.server";
import { buildMeta } from "~/lib/meta";
import type { Route } from "./+types/posts";

export function meta({ data, location }: Route.MetaArgs) {
	const name = data?.category?.name;
	return buildMeta({
		title: name ? `${name}避雷` : "避雷墙",
		description: name
			? `${name}相关的真实避雷经历与踩坑提醒。`
			: "浏览租房、饮食、旅游、求职、购物等各板块的真实避雷经历。",
		path: location.pathname,
	});
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const q = url.searchParams.get("q")?.trim() ?? "";
	const categorySlug = url.searchParams.get("category")?.trim() ?? "";
	const region = url.searchParams.get("region")?.trim() ?? "";
	const risk = url.searchParams.get("risk")?.trim() ?? "";
	const sort = url.searchParams.get("sort")?.trim() ?? "latest";
	const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

	const db = await getDb(context.cloudflare.env);
	const clientId = await getClientId(request);

	const [result, categories, regions, category] = await Promise.all([
		listPosts(db, { q, category: categorySlug, region, risk, sort, page }),
		listCategories(db),
		listRegions(db),
		categorySlug ? getCategoryBySlug(db, categorySlug) : Promise.resolve(null),
	]);

	const reactions = await getUserReactions(
		db,
		clientId,
		result.posts.map((p) => p.id),
	);

	return {
		...result,
		categories,
		regions,
		category,
		filters: { q, category: categorySlug, region, risk, sort },
		reactions: [...reactions],
	};
}

const SORTS = [
	{ value: "latest", label: "最新发布" },
	{ value: "hot", label: "最多浏览" },
	{ value: "likes", label: "最多赞同" },
	{ value: "loss", label: "金额最高" },
];

export default function PostsPage({ loaderData }: Route.ComponentProps) {
	const {
		posts,
		total,
		page,
		totalPages,
		categories,
		regions,
		category,
		filters,
		reactions,
	} = loaderData;
	const [searchParams] = useSearchParams();

	const buildQuery = (overrides: Record<string, string | number | null>) => {
		const params = new URLSearchParams(searchParams);
		for (const [key, value] of Object.entries(overrides)) {
			if (value === null || value === "" || value === undefined) {
				params.delete(key);
			} else {
				params.set(key, String(value));
			}
		}
		params.delete("page");
		const query = params.toString();
		return query ? `?${query}` : "";
	};

	const buildHref = (targetPage: number) => {
		const params = new URLSearchParams(searchParams);
		if (targetPage <= 1) params.delete("page");
		else params.set("page", String(targetPage));
		const query = params.toString();
		return `/posts${query ? `?${query}` : ""}`;
	};

	const hasFilters = Boolean(
		filters.q || filters.category || filters.region || filters.risk,
	);
	const isActive = (id: number, kind: string) =>
		reactions.includes(`${id}:${kind}`);

	return (
		<div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
			<div className="flex flex-col gap-2">
				<nav className="flex items-center gap-2 text-xs text-slate-400">
					<Link to="/" className="hover:text-brand-600">
						首页
					</Link>
					<span>/</span>
					<span className="text-slate-600">避雷墙</span>
					{category ? (
						<>
							<span>/</span>
							<span className="text-slate-600">{category.name}</span>
						</>
					) : null}
				</nav>
				<h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
					{category ? `${category.icon} ${category.name}避雷` : "避雷墙"}
				</h1>
				<p className="text-sm text-slate-500">
					{category?.description ||
						"汇集真实踩坑经历，支持按板块、地区、风险等级筛选。"}
					<span className="ml-1 text-slate-400">共 {total} 条</span>
				</p>
			</div>

			<Form
				method="get"
				action="/posts"
				className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center"
			>
				{filters.category ? (
					<input type="hidden" name="category" value={filters.category} />
				) : null}
				{filters.sort !== "latest" ? (
					<input type="hidden" name="sort" value={filters.sort} />
				) : null}
				<div className="relative">
					<input
						type="search"
						name="q"
						defaultValue={filters.q}
						placeholder="搜索商家、机构、地区、关键词…"
						className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
					/>
				</div>
				<div className="grid grid-cols-2 gap-3 sm:contents">
					<select
						name="region"
						defaultValue={filters.region}
						className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none focus:border-brand-400"
					>
						<option value="">全部地区</option>
						{regions.map((region) => (
							<option key={region} value={region}>
								{region}
							</option>
						))}
					</select>
					<select
						name="risk"
						defaultValue={filters.risk}
						className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none focus:border-brand-400"
					>
						<option value="">全部风险</option>
						<option value="high">高危避雷</option>
						<option value="medium">中度提醒</option>
						<option value="low">轻度注意</option>
					</select>
				</div>
				<button
					type="submit"
					className="h-11 w-full shrink-0 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700 sm:w-auto"
				>
					筛选
				</button>
			</Form>

			<div className="no-scrollbar mt-5 flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
				<Link
					to={`/posts${buildQuery({ category: null })}`}
					className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
						!filters.category
							? "bg-slate-900 text-white"
							: "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100"
					}`}
				>
					全部
				</Link>
				{categories.map((item) => (
					<Link
						key={item.id}
						to={`/posts${buildQuery({ category: item.slug })}`}
						className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
							filters.category === item.slug
								? "bg-slate-900 text-white"
								: "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100"
						}`}
					>
						<span>{item.icon}</span>
						{item.name}
					</Link>
				))}
			</div>

			<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
				<div className="flex flex-wrap items-center gap-1">
					{SORTS.map((item) => (
						<Link
							key={item.value}
							to={`/posts${buildQuery({ sort: item.value })}`}
							className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
								filters.sort === item.value
									? "bg-brand-50 text-brand-700"
									: "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
							}`}
						>
							{item.label}
						</Link>
					))}
				</div>
				{hasFilters ? (
					<Link
						to="/posts"
						className="text-xs text-slate-400 transition hover:text-red-500"
					>
						清除筛选 ×
					</Link>
				) : null}
			</div>

			{posts.length === 0 ? (
				<div className="mt-6">
					<EmptyState
						icon="🕳️"
						title="没有找到相关避雷帖"
						description="换个关键词或清除筛选条件试试，也欢迎你成为第一个曝光的人。"
						action={
							<Link
								to="/submit"
								className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
							>
								我要曝光
							</Link>
						}
					/>
				</div>
			) : (
				<>
					<div className="mt-6 grid gap-4 md:grid-cols-2">
						{posts.map((post) => (
							<PostCard
								key={post.id}
								post={post}
								liked={isActive(post.id, "like")}
								favorited={isActive(post.id, "favorite")}
							/>
						))}
					</div>
					<Pagination
						page={page}
						totalPages={totalPages}
						buildHref={buildHref}
					/>
				</>
			)}
		</div>
	);
}
