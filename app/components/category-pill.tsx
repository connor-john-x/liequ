import { Link } from "react-router";
import { accentOf } from "~/lib/types";

export function CategoryPill({
	slug,
	name,
	icon,
	accent,
	asLink = true,
}: {
	slug?: string;
	name?: string;
	icon?: string;
	accent?: string;
	asLink?: boolean;
}) {
	const styles = accentOf(accent);
	const content = (
		<>
			{icon ? <span>{icon}</span> : null}
			{name}
		</>
	);
	const className = `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles.chip}`;

	if (asLink && slug) {
		return (
			<Link to={`/posts?category=${slug}`} className={className}>
				{content}
			</Link>
		);
	}
	return <span className={className}>{content}</span>;
}
