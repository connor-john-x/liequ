import {
	Form,
	Link,
	redirect,
	useActionData,
	useNavigation,
} from "react-router";
import { getDb, createPost, listCategories } from "~/lib/db.server";
import { buildMeta } from "~/lib/meta";
import type { RiskLevel } from "~/lib/types";
import type { Route } from "./+types/submit";

export function meta({ location }: Route.MetaArgs) {
	return buildMeta({
		title: "我要曝光",
		description: "写下你看到或经历的不公平事情，帮助更多人提前规避风险。",
		path: location.pathname,
	});
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = await getDb(context.cloudflare.env);
	const categories = await listCategories(db);
	return { categories };
}

const RISK_LEVELS: { value: RiskLevel; label: string }[] = [
	{ value: "high", label: "高危避雷（损失大 / 性质恶劣）" },
	{ value: "medium", label: "中度提醒（存在明显套路）" },
	{ value: "low", label: "轻度注意（一般消费提示）" },
];

export async function action({ request, context }: Route.ActionArgs) {
	const formData = await request.formData();
	const title = String(formData.get("title") ?? "").trim();
	const content = String(formData.get("content") ?? "").trim();
	const categorySlug = String(formData.get("category") ?? "").trim();
	const region = String(formData.get("region") ?? "").trim();
	const merchantName = String(formData.get("merchantName") ?? "").trim();
	const riskLevel = String(formData.get("riskLevel") ?? "medium") as RiskLevel;
	const tags = String(formData.get("tags") ?? "").trim();
	const authorName = String(formData.get("authorName") ?? "").trim();
	const lossAmount = Math.max(
		0,
		Math.round(Number(formData.get("lossAmount")) || 0),
	);

	const errors: Record<string, string> = {};
	if (title.length < 6) errors.title = "标题至少 6 个字，说清楚发生了什么。";
	if (title.length > 80) errors.title = "标题请控制在 80 字以内。";
	if (content.length < 30)
		errors.content = "正文至少 30 个字，把时间、地点、经过写清楚更有参考价值。";
	if (!categorySlug) errors.category = "请选择一个板块。";
	if (!["high", "medium", "low"].includes(riskLevel))
		errors.riskLevel = "风险等级不合法。";

	if (Object.keys(errors).length > 0) {
		return { errors, values: { title, content, categorySlug, region } };
	}

	const db = await getDb(context.cloudflare.env);
	const post = await createPost(db, {
		title,
		content,
		categorySlug,
		region,
		merchantName,
		riskLevel,
		tags,
		authorName,
		lossAmount,
	});

	if (!post) {
		return {
			errors: { category: "所选板块不存在，请重新选择。" },
			values: { title, content, categorySlug, region },
		};
	}

	return redirect(`/posts/${post.slug}`);
}

export default function SubmitPage({ loaderData, actionData }: Route.ComponentProps) {
	const { categories } = loaderData;
	const navigation = useNavigation();
	const submitting = navigation.state === "submitting";
	const errors = actionData?.errors ?? {};

	const fieldClass =
		"w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100";

	return (
		<div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
			<nav className="flex items-center gap-2 text-xs text-slate-400">
				<Link to="/" className="hover:text-brand-600">
					首页
				</Link>
				<span>/</span>
				<span className="text-slate-600">我要曝光</span>
			</nav>

			<div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
						曝光你遇到的坑
					</h1>
					<p className="mt-2 text-sm text-slate-500">
						尽量写清时间、地点、商家、经过和结果。真实、具体的经历最有参考价值。
					</p>

					<Form
						method="post"
						className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"
					>
						<div>
							<label className="block text-sm font-medium text-slate-700">
								标题 <span className="text-red-500">*</span>
							</label>
							<input
								name="title"
								defaultValue={actionData?.values?.title}
								placeholder="例如：退租时房东以墙面划痕为由扣光押金"
								maxLength={80}
								className={`${fieldClass} mt-2 h-11`}
							/>
							{errors.title ? (
								<p className="mt-1.5 text-xs text-red-500">{errors.title}</p>
							) : null}
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="block text-sm font-medium text-slate-700">
									所属板块 <span className="text-red-500">*</span>
								</label>
								<select
									name="category"
									defaultValue={actionData?.values?.categorySlug}
									className={`${fieldClass} mt-2 h-11`}
								>
									<option value="">请选择板块</option>
									{categories.map((category) => (
										<option key={category.id} value={category.slug}>
											{category.icon} {category.name}
										</option>
									))}
								</select>
								{errors.category ? (
									<p className="mt-1.5 text-xs text-red-500">
										{errors.category}
									</p>
								) : null}
							</div>

							<div>
								<label className="block text-sm font-medium text-slate-700">
									风险等级 <span className="text-red-500">*</span>
								</label>
								<select
									name="riskLevel"
									defaultValue="medium"
									className={`${fieldClass} mt-2 h-11`}
								>
									{RISK_LEVELS.map((level) => (
										<option key={level.value} value={level.value}>
											{level.label}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="block text-sm font-medium text-slate-700">
									地区
								</label>
								<input
									name="region"
									defaultValue={actionData?.values?.region}
									placeholder="例如：杭州 · 拱墅区"
									className={`${fieldClass} mt-2 h-11`}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-700">
									商家 / 机构名称
								</label>
								<input
									name="merchantName"
									placeholder="例如：XX 公寓 / XX 海鲜大排档"
									className={`${fieldClass} mt-2 h-11`}
								/>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="block text-sm font-medium text-slate-700">
									涉及金额（元）
								</label>
								<input
									name="lossAmount"
									type="number"
									min="0"
									placeholder="没有可留空"
									className={`${fieldClass} mt-2 h-11`}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-700">
									标签
								</label>
								<input
									name="tags"
									placeholder="用逗号分隔，例如：押金,二房东"
									className={`${fieldClass} mt-2 h-11`}
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700">
								详细经过 <span className="text-red-500">*</span>
							</label>
							<textarea
								name="content"
								defaultValue={actionData?.values?.content}
								rows={10}
								placeholder="建议按以下结构写：&#10;1. 事情经过（时间、地点、人物）&#10;2. 关键坑点 / 套路&#10;3. 我是怎么处理的，结果如何&#10;4. 给后来人的建议"
								className={`${fieldClass} mt-2 p-4 leading-relaxed`}
							/>
							{errors.content ? (
								<p className="mt-1.5 text-xs text-red-500">{errors.content}</p>
							) : null}
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700">
								昵称（选填）
							</label>
							<input
								name="authorName"
								placeholder="默认显示为「匿名用户」"
								maxLength={24}
								className={`${fieldClass} mt-2 h-11`}
							/>
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
							<p className="text-xs text-slate-400">
								发布即表示你确认内容真实客观，并愿意为内容负责。
							</p>
							<button
								type="submit"
								disabled={submitting}
								className="rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
							>
								{submitting ? "发布中…" : "发布避雷帖"}
							</button>
						</div>
					</Form>
				</div>

				<aside className="space-y-6">
					<div className="rounded-2xl border border-slate-200 bg-white p-5">
						<h3 className="text-base font-bold text-slate-900">
							📝 怎么写更有用
						</h3>
						<ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-500">
							<li>1. 写清时间、地点、商家全称，方便他人核对。</li>
							<li>2. 描述套路的关键细节，比如话术、合同条款。</li>
							<li>3. 说明你的处理方式和最终结果。</li>
							<li>4. 给后来人一条可执行的建议。</li>
						</ul>
					</div>

					<div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
						<h3 className="text-base font-bold text-amber-800">
							⚠️ 发布须知
						</h3>
						<ul className="mt-3 space-y-2 text-xs leading-relaxed text-amber-700">
							<li>· 内容需真实客观，避免情绪化人身攻击。</li>
							<li>· 请勿泄露他人身份证、电话、住址等隐私。</li>
							<li>· 请勿发布违法、诽谤或虚假信息。</li>
							<li>· 平台内容不构成法律意见，维权请咨询专业人士。</li>
						</ul>
					</div>

					<div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
						<h3 className="text-base font-bold">已经踩坑了？</h3>
						<p className="mt-2 text-xs leading-relaxed text-white/70">
							先看维权指南，里面有投诉渠道、法律依据和沟通话术。
						</p>
						<Link
							to="/guides"
							className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white/90"
						>
							查看维权指南 →
						</Link>
					</div>
				</aside>
			</div>
		</div>
	);
}
