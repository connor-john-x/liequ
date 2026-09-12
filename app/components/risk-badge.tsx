import { riskOf } from "~/lib/types";

export function RiskBadge({
	level,
	className = "",
}: {
	level?: string;
	className?: string;
}) {
	const meta = riskOf(level);
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.badge} ${className}`}
		>
			<span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
			{meta.label}
		</span>
	);
}
