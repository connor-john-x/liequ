import { useState } from "react";

export function CopyBlock({
	title,
	text,
}: {
	title: string;
	text: string;
}) {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200">
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
				<span className="text-sm font-semibold text-slate-700">{title}</span>
				<button
					type="button"
					onClick={copy}
					className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-brand-50 hover:text-brand-600"
				>
					{copied ? "已复制 ✓" : "复制话术"}
				</button>
			</div>
			<pre className="whitespace-pre-wrap bg-white p-4 text-sm leading-relaxed text-slate-600">
				{text}
			</pre>
		</div>
	);
}
