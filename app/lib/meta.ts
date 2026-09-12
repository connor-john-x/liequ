import { SITE } from "./site";

interface MetaOptions {
	title?: string;
	description?: string;
	path?: string;
	type?: string;
}

export function buildMeta({
	title,
	description,
	path = "/",
	type = "website",
}: MetaOptions = {}) {
	const fullTitle = title
		? `${title} · ${SITE.name}`
		: `${SITE.name} · ${SITE.tagline}`;
	const desc = description || SITE.description;
	const url = `${SITE.url}${path === "/" ? "" : path}`;

	return [
		{ title: fullTitle },
		{ name: "description", content: desc },
		{ tagName: "link" as const, rel: "canonical", href: url },
		{ name: "theme-color", content: "#4f46e5" },
		{ property: "og:site_name", content: SITE.name },
		{ property: "og:type", content: type },
		{ property: "og:title", content: fullTitle },
		{ property: "og:description", content: desc },
		{ property: "og:url", content: url },
		{ property: "og:locale", content: "zh_CN" },
		{ name: "twitter:card", content: "summary" },
	];
}
