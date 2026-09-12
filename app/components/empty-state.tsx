import type { ReactNode } from "react";

export function EmptyState({
	icon = "🔍",
	title,
	description,
	action,
}: {
	icon?: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
			<div className="text-4xl">{icon}</div>
			<h3 className="mt-4 text-base font-semibold text-slate-800">{title}</h3>
			{description ? (
				<p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
			) : null}
			{action ? <div className="mt-6">{action}</div> : null}
		</div>
	);
}
