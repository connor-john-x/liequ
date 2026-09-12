import { Link } from "react-router";
import { CategoryPill } from "./category-pill";
import { ReactionBar } from "./reaction-bar";
import { RiskBadge } from "./risk-badge";
import {
	accentOf,
	formatCount,
	formatMoney,
	formatRelative,
	parseTags,
	type Post,
} from "~/lib/types";

export function PostCard({
	post,
	liked = false,
	favorited = false,
	showReactions = true,
}: {
	post: Post;
	liked?: boolean;
	favorited?: boolean;
	showReactions?: boolean;
}) {
	const tags = parseTags(post.tags);
	const accent = accentOf(post.category_accent);

	return (
		<article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
			<span
				className={`absolute left-0 top-5 h-6 w-1 rounded-r-full ${accent.bar}`}
			/>

			<div className="flex flex-wrap items-center gap-2">
				<CategoryPill
					slug={post.category_slug}
					name={post.category_name}
					icon={post.category_icon}
					accent={post.category_accent}
				/>
				<RiskBadge level={post.risk_level} />
				{post.loss_amount > 0 ? (
					<span className="rounded-full bg-slate-900/5 px-2.5 py-1 text-xs font-medium text-slate-600">
						涉及 {formatMoney(post.loss_amount)}
					</span>
				) : null}
			</div>

			<h3 className="mt-3 text-lg font-semibold leading-snug text-slate-900">
				<Link
					to={`/posts/${post.slug}`}
					className="transition group-hover:text-brand-600"
				>
					{post.title}
				</Link>
			</h3>

			<p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
				{post.summary}
			</p>

			{tags.length > 0 ? (
				<div className="mt-3 flex flex-wrap gap-1.5">
					{tags.slice(0, 5).map((tag) => (
						<Link
							key={tag}
							to={`/posts?q=${encodeURIComponent(tag)}`}
							className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
						>
							#{tag}
						</Link>
					))}
				</div>
			) : null}

			<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-400">
				{post.region ? <span>📍 {post.region}</span> : null}
				{post.merchant_name ? <span>🏪 {post.merchant_name}</span> : null}
				<span>👤 {post.author_name}</span>
				<span>{formatRelative(post.created_at)}</span>
				<span className="ml-auto flex items-center gap-3">
					<span>👁 {formatCount(post.view_count)}</span>
					<span>💬 {post.comment_count}</span>
				</span>
			</div>

			{showReactions ? (
				<div className="mt-3">
					<ReactionBar
						postId={post.id}
						likeCount={post.like_count}
						favoriteCount={post.favorite_count}
						liked={liked}
						favorited={favorited}
						compact
					/>
				</div>
			) : null}
		</article>
	);
}
