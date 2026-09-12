import {
	Form,
	Link,
	redirect,
	useActionData,
	useNavigation,
} from "react-router";
import { CategoryPill } from "~/components/category-pill";
import { ReactionBar } from "~/components/reaction-bar";
import { RiskBadge } from "~/components/risk-badge";
import { getClientId } from "~/lib/client-id.server";
import {
	addComment,
	getDb,
	getPostBySlug,
	getUserReactions,
	incrementViews,
	listComments,
	listRelatedPosts,
} from "~/lib/db.server";
import { buildMeta } from "~/lib/meta";
import {
	formatDateTime,
	formatMoney,
	parseTags,
	riskOf,
	type Post,
} from "~/lib/types";
import type { Route } from "./+types/post";

export function meta({ data, location }: Route.MetaArgs) {
	const post = data?.post;
	if (!post) {
		return buildMeta({ title: "帖子未找到", path: location.pathname });
	}
	return buildMeta({
		title: post.title,
		description: post.summary || post.content.slice(0, 100),
		path: location.pathname,
		type: "article",
	});
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const slug = params.slug;
	const db = await getDb(context.cloudflare.env);
	const post = slug ? await getPostBySlug(db, slug) : null;

	if (!post) {
		throw new Response("帖子不存在或已被删除", { status: 404 });
	}

	const clientId = await getClientId(request);
	const [comments, related, reactions] = await Promise.all([
		listComments(db, post.id),
		listRelatedPosts(db, post.category_id, post.id, 4),
		getUserReactions(db, clientId, [post.id]),
	]);

	await incrementViews(db, post.id);

	return {
		post,
		comments,
		related,
		liked: reactions.has(`${post.id}:like`),
		favorited: reactions.has(`${post.id}:favorite`),
	};
}

export async function action({ request, params, context }: Route.ActionArgs) {
	const slug = params.slug;
	const db = await getDb(context.cloudflare.env);
	const post = slug ? await getPostBySlug(db, slug) : null;
	if (!post) {
		throw new Response("帖子不存在", { status: 404 });
	}

	const formData = await request.formData();
	const authorName = String(formData.get("authorName") ?? "").trim();
	const content = String(formData.get("content") ?? "").trim();

	if (content.length < 2) {
		return { error: "评论内容太短了，至少写 2 个字。" };
	}
	if (content.length > 1000) {
		return { error: "评论太长了，请控制在 1000 字以内。" };
	}

	await addComment(db, post.id, authorName.slice(0, 24), content.slice(0, 1000));
	return redirect(`/posts/${post.slug}#comments`);
}

export default function PostDetail({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { post, comments, related, liked, favorited } = loaderData;
	const tags = parseTags(post.tags);
	const risk = riskOf(post.risk_level);
	const navigation = useNavigation();
	const submitting =
		navigation.state === "submitting" &&
		navigation.formAction?.includes(post.slug);

	return (
		<div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
			<nav className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
				<Link to="/" className="hover:text-brand-600">
					首页
				</Link>
				<span>/</span>
				<Link to="/posts" className="hover:text-brand-600">
					避雷墙
				</Link>
				<span>/</span>
				<Link
					to={`/posts?category=${post.category_slug}`}
					className="hover:text-brand-600"
				>
					{post.category_name}
				</Link>
			</nav>

			<div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
				<article className="min-w-0">
					<div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
						<div className="flex flex-wrap items-center gap-2">
							<CategoryPill
								slug={post.category_slug}
								name={post.category_name}
								icon={post.category_icon}
								accent={post.category_accent}
							/>
							<RiskBadge level={post.risk_level} />
						</div>

						<h1 className="mt-4 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
							{post.title}
						</h1>

						<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
							<span>👤 {post.author_name}</span>
							<span>🕒 {formatDateTime(post.created_at)}</span>
							<span>👁 {post.view_count} 次浏览</span>
						</div>

						<div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3">
							<div>
								<div className="text-xs text-slate-400">涉及商家 / 机构</div>
								<div className="mt-1 text-sm font-medium text-slate-800">
									{post.merchant_name || "未填写"}
								</div>
							</div>
							<div>
								<div className="text-xs text-slate-400">所在地区</div>
								<div className="mt-1 text-sm font-medium text-slate-800">
									{post.region || "未填写"}
								</div>
							</div>
							<div>
								<div className="text-xs text-slate-400">涉及金额</div>
								<div className="mt-1 text-sm font-medium text-slate-800">
									{formatMoney(post.loss_amount)}
								</div>
							</div>
						</div>

						<div className="mt-6 whitespace-pre-wrap text-[15px] leading-8 text-slate-700">
							{post.content}
						</div>

						{tags.length > 0 ? (
							<div className="mt-6 flex flex-wrap gap-2">
								{tags.map((tag) => (
									<Link
										key={tag}
										to={`/posts?q=${encodeURIComponent(tag)}`}
										className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-500 transition hover:bg-slate-200"
									>
										#{tag}
									</Link>
								))}
							</div>
						) : null}

						<div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
							<ReactionBar
								postId={post.id}
								likeCount={post.like_count}
								favoriteCount={post.favorite_count}
								liked={liked}
								favorited={favorited}
							/>
							<div
								className={`rounded-xl px-4 py-2 text-xs ${risk.badge} ring-1 ring-inset`}
							>
								{risk.description}
							</div>
						</div>
					</div>

					<section id="comments" className="mt-6 scroll-mt-24">
						<div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
							<h2 className="text-lg font-bold text-slate-900">
								讨论 · {post.comment_count}
							</h2>

							{comments.length === 0 ? (
								<p className="mt-6 rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
									还没有人讨论，来说说你的看法或补充经历吧。
								</p>
							) : (
								<ul className="mt-6 space-y-5">
									{comments.map((comment) => (
										<li key={comment.id} className="flex gap-3">
											<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
												{comment.author_name.slice(0, 1)}
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2 text-sm">
													<span className="font-medium text-slate-800">
														{comment.author_name}
													</span>
													<span className="text-xs text-slate-400">
														{formatDateTime(comment.created_at)}
													</span>
												</div>
												<p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
													{comment.content}
												</p>
											</div>
										</li>
									))}
								</ul>
							)}

							<Form
								method="post"
								className="mt-8 space-y-3 border-t border-slate-100 pt-6"
							>
								<input
									name="authorName"
									placeholder="昵称（选填，默认匿名用户）"
									maxLength={24}
									className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
								/>
								<textarea
									name="content"
									required
									rows={4}
									maxLength={1000}
									placeholder="分享你的经历或建议，理性讨论…"
									className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
								/>
								{actionData?.error ? (
									<p className="text-sm text-red-500">{actionData.error}</p>
								) : null}
								<div className="flex items-center justify-between gap-3">
									<p className="text-xs text-slate-400">
										请勿发布人身攻击、隐私信息或违法内容。
									</p>
									<button
										type="submit"
										disabled={submitting}
										className="shrink-0 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
									>
										{submitting ? "发布中…" : "发表评论"}
									</button>
								</div>
							</Form>
						</div>
					</section>
				</article>

				<aside className="space-y-6">
					{related.length > 0 ? (
						<div className="rounded-2xl border border-slate-200 bg-white p-5">
							<h3 className="text-base font-bold text-slate-900">
								同类避雷
							</h3>
							<ul className="mt-4 space-y-4">
								{related.map((item: Post) => (
									<li key={item.id}>
										<Link
											to={`/posts/${item.slug}`}
											className="line-clamp-2 text-sm font-medium leading-snug text-slate-700 transition hover:text-brand-600"
										>
											{item.title}
										</Link>
										<div className="mt-1 text-xs text-slate-400">
											{item.region} · 👁 {item.view_count}
										</div>
									</li>
								))}
							</ul>
						</div>
					) : null}

					<div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
						<h3 className="text-base font-bold">我也踩了同样的坑？</h3>
						<p className="mt-2 text-xs leading-relaxed text-white/70">
							别自己硬扛。看看维权指南里的投诉渠道和话术模板，按步骤就能开始处理。
						</p>
						<Link
							to="/guides"
							className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white/90"
						>
							查看维权指南 →
						</Link>
					</div>

					<Link
						to="/submit"
						className="block rounded-2xl border border-brand-200 bg-brand-50 p-5 transition hover:border-brand-300"
					>
						<h3 className="text-base font-bold text-slate-900">
							✍️ 我也要曝光
						</h3>
						<p className="mt-2 text-xs leading-relaxed text-slate-500">
							把你遇到的坑写下来，帮更多人提前避开。
						</p>
					</Link>
				</aside>
			</div>
		</div>
	);
}
