import { getDb, listSitemapData } from "~/lib/db.server";
import { SITE } from "~/lib/site";
import type { Route } from "./+types/sitemap";

function escapeXml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

interface Entry {
	loc: string;
	lastmod?: string;
	changefreq: string;
	priority: string;
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = await getDb(context.cloudflare.env);
	const { posts, guides, categories } = await listSitemapData(db);

	const entries: Entry[] = [
		{ loc: "/", changefreq: "daily", priority: "1.0" },
		{ loc: "/posts", changefreq: "daily", priority: "0.9" },
		{ loc: "/guides", changefreq: "weekly", priority: "0.8" },
		...categories.map((category) => ({
			loc: `/posts?category=${category.slug}`,
			changefreq: "weekly",
			priority: "0.6",
		})),
		...posts.map((post) => ({
			loc: `/posts/${post.slug}`,
			lastmod: post.updated_at.slice(0, 10),
			changefreq: "weekly",
			priority: "0.7",
		})),
		...guides.map((guide) => ({
			loc: `/guides/${guide.slug}`,
			changefreq: "monthly",
			priority: "0.6",
		})),
	];

	const body = entries
		.map((entry) =>
			[
				"  <url>",
				`    <loc>${escapeXml(`${SITE.url}${entry.loc}`)}</loc>`,
				entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
				`    <changefreq>${entry.changefreq}</changefreq>`,
				`    <priority>${entry.priority}</priority>`,
				"  </url>",
			]
				.filter(Boolean)
				.join("\n"),
		)
		.join("\n");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
