import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import { SiteFooter } from "~/components/site-footer";
import { SiteHeader } from "~/components/site-header";
import { buildMeta } from "~/lib/meta";
import type { Route } from "./+types/root";
import "./app.css";

export function meta({ location }: Route.MetaArgs) {
	return buildMeta({ path: location.pathname });
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="zh-CN">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="flex min-h-screen flex-col overflow-x-hidden">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<>
			<SiteHeader />
			<main className="flex-1">
				<Outlet />
			</main>
			<SiteFooter />
		</>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let title = "出错了";
	let details = "页面遇到了意外问题，请稍后重试。";

	if (isRouteErrorResponse(error)) {
		if (error.status === 404) {
			title = "404 · 页面走丢了";
			details = "你要找的帖子或页面不存在，可能已被删除。";
		} else {
			title = `${error.status} · ${error.statusText || "请求失败"}`;
			details = error.data || details;
		}
	} else if (import.meta.env.DEV && error instanceof Error) {
		details = error.message;
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
			<div className="text-5xl">🛡️</div>
			<h1 className="mt-6 text-2xl font-bold text-slate-900">{title}</h1>
			<p className="mt-3 max-w-md text-sm text-slate-500">{details}</p>
			<a
				href="/"
				className="mt-8 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
			>
				返回首页
			</a>
		</div>
	);
}
