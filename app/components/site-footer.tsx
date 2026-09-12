import { Link } from "react-router";
import { SITE } from "~/lib/site";

const CATEGORIES = [
	{ to: "/posts?category=rent", label: "租房住宿" },
	{ to: "/posts?category=food", label: "餐饮美食" },
	{ to: "/posts?category=travel", label: "旅游出行" },
	{ to: "/posts?category=job", label: "求职招聘" },
	{ to: "/posts?category=shopping", label: "购物消费" },
];

const RESOURCES = [
	{ to: "/posts", label: "避雷墙" },
	{ to: "/guides", label: "维权指南" },
	{ to: "/submit", label: "我要曝光" },
];

export function SiteFooter() {
	return (
		<footer className="mt-16 border-t border-slate-200 bg-white sm:mt-20">
			<div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
				<div className="sm:col-span-2 lg:col-span-2">
					<div className="flex items-center gap-2">
						<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white">
							🛡️
						</span>
						<span className="text-lg font-bold text-slate-900">
							{SITE.name}
						</span>
					</div>
					<p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
						{SITE.description}
					</p>
					<p className="mt-4 max-w-md text-xs leading-relaxed text-slate-400">
						平台内容为用户自发分享，仅供参考，不构成法律意见。发布信息请确保真实客观，请勿泄露他人隐私或发布违法违规内容。
					</p>
					<a
						href={SITE.url}
						className="mt-4 inline-block text-xs font-medium text-brand-600 transition hover:text-brand-700"
					>
						{SITE.domain}
					</a>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">热门板块</h4>
					<ul className="mt-4 space-y-2.5">
						{CATEGORIES.map((item) => (
							<li key={item.to}>
								<Link
									to={item.to}
									className="text-sm text-slate-500 transition hover:text-brand-600"
								>
									{item.label}
								</Link>
							</li>
						))}
					</ul>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">快捷入口</h4>
					<ul className="mt-4 space-y-2.5">
						{RESOURCES.map((item) => (
							<li key={item.to}>
								<Link
									to={item.to}
									className="text-sm text-slate-500 transition hover:text-brand-600"
								>
									{item.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>
			<div className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
				© {new Date().getFullYear()} {SITE.name} · {SITE.domain} · 理性发声，依法维权
			</div>
		</footer>
	);
}
