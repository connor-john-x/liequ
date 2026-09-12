import { createCookie } from "react-router";

export const clientCookie = createCookie("lq_cid", {
	path: "/",
	httpOnly: true,
	sameSite: "lax",
	maxAge: 60 * 60 * 24 * 365,
	secure: import.meta.env.PROD,
});

export async function getClientId(request: Request): Promise<string> {
	const cookie = request.headers.get("Cookie");
	const value = await clientCookie.parse(cookie);
	if (typeof value === "string" && value.length > 0) {
		return value;
	}
	return crypto.randomUUID();
}

export async function resolveClientId(
	request: Request,
): Promise<{ id: string; isNew: boolean }> {
	const cookie = request.headers.get("Cookie");
	const value = await clientCookie.parse(cookie);
	if (typeof value === "string" && value.length > 0) {
		return { id: value, isNew: false };
	}
	return { id: crypto.randomUUID(), isNew: true };
}

export async function serializeClientId(id: string): Promise<string> {
	return clientCookie.serialize(id);
}
