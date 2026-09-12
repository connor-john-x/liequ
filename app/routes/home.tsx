import { Form, Link } from "react-router";
import { CategoryPill } from "~/components/category-pill";
import { PostCard } from "~/components/post-card";
import { RiskBadge } from "~/components/risk-badge";
import { getClientId } from "~/lib/client-id.server";
import {
	getDb,
	getStats,
	getUserReactions,
	listCategories,
	listGuides,
	listHotPosts,
	listPosts,
	listRegions,
} from "~/lib/db.server";
import { buildMeta } from "~/lib/meta";
import { accentOf, formatCount, type Post } from "~/lib/types";
import type { Route } from "./+types/home";

export function meta({ location }: Route.MetaArgs) {
	return buildMeta({ path: location.pathname });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const db = await getDb(context.cloudflare.env);
	const clientId = await getClientId(request);

	const [categories, hotPosts, latest, guides, stats, regions] =
		await Promise.all([
			listCategories(db),
			listHotPosts(db, 5),
			listPosts(db, { sort: "latest" }),
			listGuides(db),
			getStats(db),
			listRegions(db),
		]);

	const ids = [...new Set([...hotPosts, ...latest.posts].map((p) => p.id))];
	const reactions = await getUserReactions(db, clientId, ids);

	return {
		categories,
		hotPosts,
		latest: latest.posts.slice(0, 6),
		guides: guides.slice(0, 3),
		stats,
		regions,
		reactions: [...reactions],
	};
}

function isActive(reactions: string[], id: number, kind: string) {
	return reactions.includes(`${id}:${kind}`);
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const { categories, hotPosts, latest, guides, stats, regions, reactions } =
		loaderData;

	return (
		<div>
			<section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-500 text-white">
				<div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_0%,white,transparent_30%)]" />
				<div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
					<div className="max-w-2xl">
						<span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-white/25">
							🛡️ 已收录 {formatCount(stats.posts)} 条真实避雷经历
						</span>
						<h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
							把踩过的坑说出来，
							<br className="hidden sm:block" />
							让后来的人少走弯路
						</h1>
						<p className="mt-5 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
							租房被扣押金、旅游被强制购物、求职遇上培训贷……在这里记录你看到或经历的不公平，提醒别人提前规避风险；已经踩坑的，也能找到可执行的维权路径。
						</p>

						<Form
							method="get"
							action="/posts"
							className="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-lg shadow-brand-900/20"
						>
							<input
								type="search"
								name="q"
								placeholder="搜索商家、机构、地区或关键词…"
								className="h-11 flex-1 rounded-full bg-transparent px-4 text-sm text-slate-700 outline-none"
							/>
							<button
								type="submit"
								className="h-11 shrink-0 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
							>
								搜索
							</button>
						</Form>

						<div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/80">
							<span>
								<strong className="text-lg font-bold text-white">
									{stats.posts}
								</strong>{" "}
								条避雷帖
							</span>
							<span>
								<strong className="text-lg font-bold text-white">
									{stats.categories}
								</strong>{" "}
								个板块
							</span>
							<span>
								<strong className="text-lg font-bold text-white">
									{stats.guides}
								</strong>{" "}
								篇维权指南
							</span>
							<span>
								<strong className="text-lg font-bold text-white">
									{stats.comments}
								</strong>{" "}
								条讨论
							</span>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
				<div className="flex items-end justify-between">
					<div>
						<h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
							按板块避雷
						</h2>
						<p className="mt-1.5 text-sm text-slate-500">
							覆盖生活消费的主要场景，点击进入对应避雷墙
						</p>
					</div>
					<Link
						to="/posts"
						className="hidden text-sm font-medium text-brand-600 hover:text-brand-700 sm:block"
					>
						查看全部 →
					</Link>
				</div>

				<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
					{categories.map((category) => {
						const accent = accentOf(category.accent);
						return (
							<Link
								key={category.id}
								to={`/posts?category=${category.slug}`}
								className={`group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md ${accent.hover}`}
							>
								<div
									className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${accent.icon}`}
								>
									{category.icon}
								</div>
								<div className="mt-3 font-semibold text-slate-900">
									{category.name}
								</div>
								<div className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
									{category.description}
								</div>
								<div className="mt-3 text-xs font-medium text-slate-400">
									{category.post_count ?? 0} 条避雷
								</div>
							</Link>
						);
					})}
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10 sm:pb-14">
				<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
					<div>
						<div className="flex items-end justify-between">
							<h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
								最新避雷
							</h2>
							<Link
								to="/posts?sort=latest"
								className="text-sm font-medium text-brand-600 hover:text-brand-700"
							>
								更多 →
							</Link>
						</div>
						<div className="mt-5 space-y-4">
							{latest.map((post) => (
								<PostCard
									key={post.id}
									post={post}
									liked={isActive(reactions, post.id, "like")}
									favorited={isActive(reactions, post.id, "favorite")}
								/>
							))}
						</div>
					</div>

					<aside className="space-y-6">
						<div className="rounded-2xl border border-slate-200 bg-white p-5">
							<h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
								🔥 热榜
							</h3>
							<ol className="mt-4 space-y-3">
								{hotPosts.map((post: Post, index) => (
									<li key={post.id} className="flex gap-3">
										<span
											className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
												index < 3
													? "bg-brand-600 text-white"
													: "bg-slate-100 text-slate-500"
											}`}
										>
											{index + 1}
										</span>
										<div className="min-w-0">
											<Link
												to={`/posts/${post.slug}`}
												className="line-clamp-2 text-sm font-medium leading-snug text-slate-700 transition hover:text-brand-600"
											>
												{post.title}
											</Link>
											<div className="mt-1 text-xs text-slate-400">
												👁 {formatCount(post.view_count)} · 💬{" "}
												{post.comment_count}
											</div>
										</div>
									</li>
								))}
							</ol>
						</div>

						<div className="rounded-2xl border border-slate-200 bg-white p-5">
							<h3 className="text-base font-bold text-slate-900">
								🧭 风险等级说明
							</h3>
							<ul className="mt-4 space-y-3 text-xs leading-relaxed text-slate-500">
								<li className="flex items-start gap-2">
									<RiskBadge level="high" />
									<span className="pt-0.5">
										金额损失大或性质恶劣，务必重点规避
									</span>
								</li>
								<li className="flex items-start gap-2">
									<RiskBadge level="medium" />
									<span className="pt-0.5">存在明显套路，需谨慎对待</span>
								</li>
								<li className="flex items-start gap-2">
									<RiskBadge level="low" />
									<span className="pt-0.5">一般性消费提示，了解即可</span>
								</li>
							</ul>
						</div>

						{regions.length > 0 ? (
							<div className="rounded-2xl border border-slate-200 bg-white p-5">
								<h3 className="text-base font-bold text-slate-900">
									📍 热门地区
								</h3>
								<div className="mt-4 flex flex-wrap gap-2">
									{regions.slice(0, 10).map((region) => (
										<Link
											key={region}
											to={`/posts?region=${encodeURIComponent(region)}`}
											className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
										>
											{region}
										</Link>
									))}
								</div>
							</div>
						) : null}

						<div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
							<h3 className="text-base font-bold">踩坑了？先别慌</h3>
							<p className="mt-2 text-xs leading-relaxed text-white/70">
								我们整理了常见纠纷的投诉渠道、法律依据和沟通话术，照着做就能开始维权。
							</p>
							<Link
								to="/guides"
								className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white/90"
							>
								查看维权指南 →
							</Link>
						</div>
					</aside>
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 sm:pb-16">
				<div className="flex items-end justify-between">
					<div>
						<h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
							维权指南
						</h2>
						<p className="mt-1.5 text-sm text-slate-500">
							按步骤操作，投诉渠道、法律依据、话术模板一次备齐
						</p>
					</div>
					<Link
						to="/guides"
						className="text-sm font-medium text-brand-600 hover:text-brand-700"
					>
						全部指南 →
					</Link>
				</div>

				<div className="mt-6 grid gap-4 md:grid-cols-3">
					{guides.map((guide) => (
						<Link
							key={guide.id}
							to={`/guides/${guide.slug}`}
							className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
						>
							<div className="flex items-center gap-2">
								<CategoryPill
									slug={guide.category_slug}
									name={guide.category_name}
									icon={guide.category_icon}
									accent={guide.category_accent}
									asLink={false}
								/>
								<RiskBadge level={guide.risk_level} />
							</div>
							<h3 className="mt-3 font-semibold leading-snug text-slate-900 transition group-hover:text-brand-600">
								{guide.title}
							</h3>
							<p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">
								{guide.summary}
							</p>
							<span className="mt-4 inline-block text-xs font-medium text-brand-600">
								查看解决方案 →
							</span>
						</Link>
					))}
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-4 sm:px-6 pb-4">
				<div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-brand-50 px-8 py-10 text-center sm:flex-row sm:text-left">
					<div>
						<h2 className="text-xl font-bold text-slate-900">
							你也遇到过不公平的事？
						</h2>
						<p className="mt-2 text-sm text-slate-600">
							花几分钟写下来，可能就帮别人省下几千块。你的经验对别人很重要。
						</p>
					</div>
					<Link
						to="/submit"
						className="shrink-0 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
					>
						我要曝光
					</Link>
				</div>
			</section>
		</div>
	);
}
