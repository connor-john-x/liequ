import { Link } from "react-router";

export function Pagination({
	page,
	totalPages,
	buildHref,
}: {
	page: number;
	totalPages: number;
	buildHref: (page: number) => string;
}) {
	if (totalPages <= 1) return null;

	const pages: number[] = [];
	const start = Math.max(1, page - 2);
	const end = Math.min(totalPages, page + 2);
	for (let i = start; i <= end; i += 1) pages.push(i);

	const base =
		"inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition";
	const idle =
		"border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600";
	const disabled = "border-slate-100 bg-slate-50 text-slate-300";

	return (
		<nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
			{page > 1 ? (
				<Link to={buildHref(page - 1)} className={`${base} ${idle}`}>
					上一页
				</Link>
			) : (
				<span className={`${base} ${disabled}`}>上一页</span>
			)}

			{start > 1 ? (
				<>
					<Link to={buildHref(1)} className={`${base} ${idle}`}>
						1
					</Link>
					{start > 2 ? <span className="text-slate-400">…</span> : null}
				</>
			) : null}

			{pages.map((p) =>
				p === page ? (
					<span
						key={p}
						className={`${base} border-brand-600 bg-brand-600 text-white`}
					>
						{p}
					</span>
				) : (
					<Link key={p} to={buildHref(p)} className={`${base} ${idle}`}>
						{p}
					</Link>
				),
			)}

			{end < totalPages ? (
				<>
					{end < totalPages - 1 ? (
						<span className="text-slate-400">…</span>
					) : null}
					<Link to={buildHref(totalPages)} className={`${base} ${idle}`}>
						{totalPages}
					</Link>
				</>
			) : null}

			{page < totalPages ? (
				<Link to={buildHref(page + 1)} className={`${base} ${idle}`}>
					下一页
				</Link>
			) : (
				<span className={`${base} ${disabled}`}>下一页</span>
			)}
		</nav>
	);
}
