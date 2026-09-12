import { data } from "react-router";
import { resolveClientId, serializeClientId } from "~/lib/client-id.server";
import { getDb, toggleReaction, type ReactionKind } from "~/lib/db.server";
import type { Route } from "./+types/api.reactions";

export async function action({ request, context }: Route.ActionArgs) {
	if (request.method !== "POST") {
		return data({ error: "Method Not Allowed" }, { status: 405 });
	}

	const formData = await request.formData();
	const postId = Number(formData.get("postId"));
	const kind = String(formData.get("kind") ?? "") as ReactionKind;

	if (!Number.isInteger(postId) || postId <= 0) {
		return data({ error: "缺少有效的帖子 ID" }, { status: 400 });
	}
	if (kind !== "like" && kind !== "favorite") {
		return data({ error: "不支持的互动类型" }, { status: 400 });
	}

	const db = await getDb(context.cloudflare.env);
	const { id, isNew } = await resolveClientId(request);
	const result = await toggleReaction(db, postId, id, kind);

	const headers = new Headers();
	if (isNew) {
		headers.append("Set-Cookie", await serializeClientId(id));
	}

	return data({ kind, active: result.active, count: result.count }, { headers });
}
