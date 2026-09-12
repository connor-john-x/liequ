import { Link } from "react-router";
import { CategoryPill } from "~/components/category-pill";
import { CopyBlock } from "~/components/copy-block";
import { RiskBadge } from "~/components/risk-badge";
import { getDb, getGuideBySlug, listGuides } from "~/lib/db.server";
import { buildMeta } from "~/lib/meta";
import {
	parseList,
	riskOf,
	type GuideChannel,
	type GuideLegal,
} from "~/lib/types";
import type { Route } from "./+types/guide";

export function meta({ data, location }: Route.MetaArgs) {
	const guide = data?.guide;
	if (!guide) {
		return buildMeta({ title: "指南未找到", path: location.pathname });
	}
	return buildMeta({
		title: guide.title,
		description: guide.summary,
		path: location.pathname,
		type: "article",
	});
}

export async function loader({ params, context }: Route.LoaderArgs) {
	const slug = params.slug;
	const db = await getDb(context.cloudflare.env);
	const guide = slug ? await getGuideBySlug(db, slug) : null;

	if (!guide) {
		throw new Response("维权指南不存在", { status: 404 });
	}

	const all = await listGuides(db, {
		category: guide.category_slug ?? undefined,
	});
	const related = all.filter((item) => item.id !== guide.id).slice(0, 4);

	return { guide, related };
}

export default function GuideDetail({ loaderData }: Route.ComponentProps) {
	const { guide, related } = loaderData;
	const steps = parseList<string>(guide.steps);
	const channels = parseList<GuideChannel>(guide.channels);
	const legal = parseList<GuideLegal>(guide.legal_basis);
	const risk = riskOf(guide.risk_level);

	return (
		<div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
			<nav className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
				<Link to="/" className="hover:text-brand-600">
					首页
				</Link>
				<span>/</span>
				<Link to="/guides" className="hover:text-brand-600">
					维权指南
				</Link>
				{guide.category_name ? (
					<>
						<span>/</span>
						<Link
							to={`/guides?category=${guide.category_slug}`}
							className="hover:text-brand-600"
						>
							{guide.category_name}
						</Link>
					</>
				) : null}
			</nav>

			<div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
				<article className="min-w-0">
					<header className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
						<div className="flex flex-wrap items-center gap-2">
							<CategoryPill
								slug={guide.category_slug}
								name={guide.category_name}
								icon={guide.category_icon}
								accent={guide.category_accent}
							/>
							<RiskBadge level={guide.risk_level} />
						</div>
						<h1 className="mt-4 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
							{guide.title}
						</h1>
						<p className="mt-4 text-[15px] leading-relaxed text-slate-600">
							{guide.summary}
						</p>
						<div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
							<span className="font-medium text-slate-700">适用场景：</span>
							{guide.scenario}
						</div>
						<div
							className={`mt-4 rounded-2xl px-4 py-3 text-xs ring-1 ring-inset ${risk.badge}`}
						>
							{risk.description}
						</div>
					</header>

					<section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
						<h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
							<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
								1
							</span>
							处理步骤
						</h2>
						<ol className="mt-6 space-y-5">
							{steps.map((step, index) => (
								<li key={index} className="flex gap-4">
									<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
										{index + 1}
									</span>
									<p className="pt-0.5 text-sm leading-relaxed text-slate-600">
										{step}
									</p>
								</li>
							))}
						</ol>
					</section>

					{channels.length > 0 ? (
						<section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
							<h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
								<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
									2
								</span>
								投诉 / 求助渠道
							</h2>
							<div className="mt-6 grid gap-3 sm:grid-cols-2">
								{channels.map((channel, index) => (
									<div
										key={index}
										className="rounded-2xl border border-slate-200 p-4"
									>
										<div className="font-semibold text-slate-800">
											{channel.name}
										</div>
										<div className="mt-1 text-sm font-medium text-brand-600">
											{channel.contact}
										</div>
										{channel.note ? (
											<div className="mt-1 text-xs text-slate-400">
												{channel.note}
											</div>
										) : null}
									</div>
								))}
							</div>
						</section>
					) : null}

					{legal.length > 0 ? (
						<section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
							<h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
								<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
									3
								</span>
								法律依据
							</h2>
							<ul className="mt-6 space-y-4">
								{legal.map((item, index) => (
									<li
										key={index}
										className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600"
									>
										<div className="font-semibold text-slate-800">
											{item.law} {item.article}
										</div>
										<p className="mt-2">{item.text}</p>
									</li>
								))}
							</ul>
						</section>
					) : null}

					{guide.script ? (
						<section className="mt-6">
							<h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
								<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
									4
								</span>
								沟通话术模板
							</h2>
							<CopyBlock title="可直接复制发送给商家 / 平台" text={guide.script} />
							<p className="mt-3 text-xs text-slate-400">
								请根据实际情况修改 XXXX 处的金额、日期等信息后再发送。
							</p>
						</section>
					) : null}
				</article>

				<aside className="space-y-6">
					{related.length > 0 ? (
						<div className="rounded-2xl border border-slate-200 bg-white p-5">
							<h3 className="text-base font-bold text-slate-900">
								相关指南
							</h3>
							<ul className="mt-4 space-y-4">
								{related.map((item) => (
									<li key={item.id}>
										<Link
											to={`/guides/${item.slug}`}
											className="line-clamp-2 text-sm font-medium leading-snug text-slate-700 transition hover:text-brand-600"
										>
											{item.title}
										</Link>
									</li>
								))}
							</ul>
						</div>
					) : null}

					<div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
						<h3 className="text-base font-bold text-slate-900">
							🛡️ 遇到新套路？
						</h3>
						<p className="mt-2 text-xs leading-relaxed text-slate-500">
							把你的经历发到避雷墙，我们会持续补充对应的维权指南。
						</p>
						<Link
							to="/submit"
							className="mt-4 inline-flex rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
						>
							我要曝光 →
						</Link>
					</div>
				</aside>
			</div>
		</div>
	);
}
