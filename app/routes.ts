import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("posts", "routes/posts.tsx"),
	route("posts/:slug", "routes/post.tsx"),
	route("submit", "routes/submit.tsx"),
	route("guides", "routes/guides.tsx"),
	route("guides/:slug", "routes/guide.tsx"),
	route("api/reactions", "routes/api.reactions.tsx"),
	route("sitemap.xml", "routes/sitemap.tsx"),
] satisfies RouteConfig;
