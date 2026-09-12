export type RiskLevel = "high" | "medium" | "low";

export interface Category {
	id: number;
	slug: string;
	name: string;
	description: string;
	icon: string;
	accent: string;
	sort_order: number;
	post_count?: number;
}

export interface Post {
	id: number;
	slug: string;
	title: string;
	summary: string;
	content: string;
	category_id: number;
	region: string;
	merchant_name: string;
	risk_level: RiskLevel;
	tags: string;
	author_name: string;
	loss_amount: number;
	view_count: number;
	like_count: number;
	favorite_count: number;
	comment_count: number;
	status: string;
	created_at: string;
	updated_at: string;
	category_slug?: string;
	category_name?: string;
	category_icon?: string;
	category_accent?: string;
}

export interface Guide {
	id: number;
	slug: string;
	title: string;
	scenario: string;
	category_id: number | null;
	summary: string;
	risk_level: RiskLevel;
	steps: string;
	channels: string;
	legal_basis: string;
	script: string;
	created_at: string;
	category_slug?: string;
	category_name?: string;
	category_icon?: string;
	category_accent?: string;
}

export interface Comment {
	id: number;
	post_id: number;
	author_name: string;
	content: string;
	created_at: string;
}

export interface GuideChannel {
	name: string;
	contact: string;
	note?: string;
}

export interface GuideLegal {
	law: string;
	article: string;
	text: string;
}

export interface PostFilters {
	q?: string;
	category?: string;
	region?: string;
	risk?: string;
	sort?: string;
	page?: number;
}

export const RISK_META: Record<
	RiskLevel,
	{ label: string; badge: string; dot: string; description: string }
> = {
	high: {
		label: "高危避雷",
		badge: "bg-red-50 text-red-700 ring-red-200",
		dot: "bg-red-500",
		description: "金额损失大或性质恶劣，务必重点规避",
	},
	medium: {
		label: "中度提醒",
		badge: "bg-amber-50 text-amber-700 ring-amber-200",
		dot: "bg-amber-500",
		description: "存在明显套路，需谨慎对待",
	},
	low: {
		label: "轻度注意",
		badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		dot: "bg-emerald-500",
		description: "一般性消费提示，了解即可",
	},
};

export const ACCENTS: Record<
	string,
	{ chip: string; icon: string; hover: string; bar: string }
> = {
	rose: {
		chip: "bg-rose-50 text-rose-700 ring-rose-200",
		icon: "bg-rose-100 text-rose-600",
		hover: "hover:border-rose-300 hover:shadow-rose-100",
		bar: "bg-rose-500",
	},
	orange: {
		chip: "bg-orange-50 text-orange-700 ring-orange-200",
		icon: "bg-orange-100 text-orange-600",
		hover: "hover:border-orange-300 hover:shadow-orange-100",
		bar: "bg-orange-500",
	},
	sky: {
		chip: "bg-sky-50 text-sky-700 ring-sky-200",
		icon: "bg-sky-100 text-sky-600",
		hover: "hover:border-sky-300 hover:shadow-sky-100",
		bar: "bg-sky-500",
	},
	indigo: {
		chip: "bg-indigo-50 text-indigo-700 ring-indigo-200",
		icon: "bg-indigo-100 text-indigo-600",
		hover: "hover:border-indigo-300 hover:shadow-indigo-100",
		bar: "bg-indigo-500",
	},
	pink: {
		chip: "bg-pink-50 text-pink-700 ring-pink-200",
		icon: "bg-pink-100 text-pink-600",
		hover: "hover:border-pink-300 hover:shadow-pink-100",
		bar: "bg-pink-500",
	},
	violet: {
		chip: "bg-violet-50 text-violet-700 ring-violet-200",
		icon: "bg-violet-100 text-violet-600",
		hover: "hover:border-violet-300 hover:shadow-violet-100",
		bar: "bg-violet-500",
	},
	emerald: {
		chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		icon: "bg-emerald-100 text-emerald-600",
		hover: "hover:border-emerald-300 hover:shadow-emerald-100",
		bar: "bg-emerald-500",
	},
	amber: {
		chip: "bg-amber-50 text-amber-700 ring-amber-200",
		icon: "bg-amber-100 text-amber-600",
		hover: "hover:border-amber-300 hover:shadow-amber-100",
		bar: "bg-amber-500",
	},
	teal: {
		chip: "bg-teal-50 text-teal-700 ring-teal-200",
		icon: "bg-teal-100 text-teal-600",
		hover: "hover:border-teal-300 hover:shadow-teal-100",
		bar: "bg-teal-500",
	},
	slate: {
		chip: "bg-slate-100 text-slate-700 ring-slate-200",
		icon: "bg-slate-100 text-slate-600",
		hover: "hover:border-slate-300 hover:shadow-slate-100",
		bar: "bg-slate-500",
	},
};

export function accentOf(accent?: string) {
	return ACCENTS[accent ?? "slate"] ?? ACCENTS.slate;
}

export function riskOf(level?: string) {
	return RISK_META[(level as RiskLevel) ?? "medium"] ?? RISK_META.medium;
}

export function parseTags(tags: string): string[] {
	return tags
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);
}

export function parseList<T>(raw: string, fallback: T[] = []): T[] {
	try {
		const value = JSON.parse(raw);
		return Array.isArray(value) ? (value as T[]) : fallback;
	} catch {
		return fallback;
	}
}

function toDate(value: string): Date {
	const normalized = value.includes("T") ? value : value.replace(" ", "T") + "Z";
	return new Date(normalized);
}

export function formatDate(value: string): string {
	const date = toDate(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("zh-CN", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

export function formatDateTime(value: string): string {
	const date = toDate(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("zh-CN", {
		timeZone: "Asia/Shanghai",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

export function formatRelative(value: string): string {
	const date = toDate(value);
	if (Number.isNaN(date.getTime())) return value;
	const diff = Date.now() - date.getTime();
	const minute = 60 * 1000;
	const hour = 60 * minute;
	const day = 24 * hour;
	if (diff < minute) return "刚刚";
	if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
	if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
	if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
	return formatDate(value);
}

export function formatCount(value: number): string {
	if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
	if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
	return String(value);
}

export function formatMoney(value: number): string {
	if (!value) return "未披露";
	if (value >= 10000) return `¥${(value / 10000).toFixed(1)} 万`;
	return `¥${value.toLocaleString("zh-CN")}`;
}
