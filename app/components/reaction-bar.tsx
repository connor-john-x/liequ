import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

interface ReactionResponse {
	kind: "like" | "favorite";
	active: boolean;
	count: number;
}

export function ReactionBar({
	postId,
	likeCount,
	favoriteCount,
	liked = false,
	favorited = false,
	compact = false,
}: {
	postId: number;
	likeCount: number;
	favoriteCount: number;
	liked?: boolean;
	favorited?: boolean;
	compact?: boolean;
}) {
	const fetcher = useFetcher<ReactionResponse>();
	const [state, setState] = useState({
		likeCount,
		favoriteCount,
		liked,
		favorited,
	});

	useEffect(() => {
		setState({ likeCount, favoriteCount, liked, favorited });
	}, [postId, likeCount, favoriteCount, liked, favorited]);

	useEffect(() => {
		const data = fetcher.data;
		if (!data) return;
		setState((prev) =>
			data.kind === "like"
				? { ...prev, liked: data.active, likeCount: data.count }
				: { ...prev, favorited: data.active, favoriteCount: data.count },
		);
	}, [fetcher.data]);

	const busy = fetcher.state !== "idle";
	const base = compact
		? "gap-1 rounded-lg px-2 py-1 text-xs"
		: "gap-1.5 rounded-full px-3.5 py-2 text-sm";

	const react = (kind: "like" | "favorite") => {
		fetcher.submit(
			{ postId: String(postId), kind },
			{ method: "post", action: "/api/reactions" },
		);
	};

	return (
		<div className="flex items-center gap-2" data-busy={busy}>
			<button
				type="button"
				onClick={() => react("like")}
				disabled={busy}
				className={`inline-flex items-center font-medium transition disabled:opacity-60 ${base} ${
					state.liked
						? "bg-red-50 text-red-600"
						: "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
				}`}
				aria-pressed={state.liked}
			>
				<svg
					viewBox="0 0 24 24"
					className="h-4 w-4"
					fill={state.liked ? "currentColor" : "none"}
					stroke="currentColor"
					strokeWidth="2"
				>
					<path
						d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				<span>有用 {state.likeCount}</span>
			</button>

			<button
				type="button"
				onClick={() => react("favorite")}
				disabled={busy}
				className={`inline-flex items-center font-medium transition disabled:opacity-60 ${base} ${
					state.favorited
						? "bg-amber-50 text-amber-600"
						: "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
				}`}
				aria-pressed={state.favorited}
			>
				<svg
					viewBox="0 0 24 24"
					className="h-4 w-4"
					fill={state.favorited ? "currentColor" : "none"}
					stroke="currentColor"
					strokeWidth="2"
				>
					<path
						d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				<span>收藏 {state.favoriteCount}</span>
			</button>
		</div>
	);
}
