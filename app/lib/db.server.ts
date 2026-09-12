import schemaSql from "../../migrations/0001_init.sql?raw";
import seedSql from "../../migrations/0002_seed.sql?raw";
import type {
	Category,
	Comment,
	Guide,
	Post,
	PostFilters,
	RiskLevel,
} from "./types";

let initPromise: Promise<void> | null = null;

function splitStatements(sql: string): string[] {
	return sql
		.split("\n")
		.filter((line) => !line.trim().startsWith("--"))
		.join("\n")
		.split(";")
		.map((statement) => statement.trim())
		.filter(Boolean);
}

/**
 * 首次访问时自动建表并写入种子数据。
 * 生产环境建议改用 `wrangler d1 migrations apply`，此处保证本地开箱即用。
 */
export function ensureDatabase(db: D1Database): Promise<void> {
	if (!initPromise) {
		initPromise = (async () => {
			for (const statement of splitStatements(schemaSql)) {
				await db.prepare(statement).run();
			}
			const row = await db
				.prepare("SELECT COUNT(*) AS total FROM categories")
				.first<{ total: number }>();
			if (!row || row.total === 0) {
				try {
					const statements = splitStatements(seedSql);
					await db.batch(statements.map((statement) => db.prepare(statement)));
				} catch (error) {
					console.error("seed failed", error);
				}
			}
		})().catch((error) => {
			initPromise = null;
			throw error;
		});
	}
	return initPromise;
}

export async function getDb(env: Env): Promise<D1Database> {
	await ensureDatabase(env.DB);
	return env.DB;
}

export async function listCategories(db: D1Database): Promise<Category[]> {
	const { results } = await db
		.prepare(
			`SELECT c.*, COUNT(p.id) AS post_count
			 FROM categories c
			 LEFT JOIN posts p ON p.category_id = c.id AND p.status = 'published'
			 GROUP BY c.id
			 ORDER BY c.sort_order ASC`,
		)
		.all<Category>();
	return results ?? [];
}

export async function getCategoryBySlug(
	db: D1Database,
	slug: string,
): Promise<Category | null> {
	return db
		.prepare("SELECT * FROM categories WHERE slug = ?")
		.bind(slug)
		.first<Category>();
}

export interface PostListResult {
	posts: Post[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export async function listPosts(
	db: D1Database,
	filters: PostFilters = {},
): Promise<PostListResult> {
	const page = Math.max(1, Number(filters.page) || 1);
	const pageSize = 8;
	const where: string[] = ["p.status = 'published'"];
	const params: unknown[] = [];

	if (filters.q) {
		where.push(
			"(p.title LIKE ? OR p.summary LIKE ? OR p.content LIKE ? OR p.merchant_name LIKE ? OR p.tags LIKE ?)",
		);
		const like = `%${filters.q}%`;
		params.push(like, like, like, like, like);
	}
	if (filters.category) {
		where.push("c.slug = ?");
		params.push(filters.category);
	}
	if (filters.region) {
		where.push("p.region LIKE ?");
		params.push(`%${filters.region}%`);
	}
	if (filters.risk && filters.risk !== "all") {
		where.push("p.risk_level = ?");
		params.push(filters.risk);
	}

	const whereSql = `WHERE ${where.join(" AND ")}`;
	const orderSql =
		filters.sort === "hot"
			? "p.view_count DESC, p.like_count DESC"
			: filters.sort === "likes"
				? "p.like_count DESC, p.favorite_count DESC"
				: filters.sort === "loss"
					? "p.loss_amount DESC"
					: "p.created_at DESC";

	const countRow = await db
		.prepare(
			`SELECT COUNT(*) AS total
			 FROM posts p JOIN categories c ON c.id = p.category_id
			 ${whereSql}`,
		)
		.bind(...params)
		.first<{ total: number }>();

	const { results } = await db
		.prepare(
			`SELECT p.*, c.slug AS category_slug, c.name AS category_name,
			        c.icon AS category_icon, c.accent AS category_accent
			 FROM posts p JOIN categories c ON c.id = p.category_id
			 ${whereSql}
			 ORDER BY ${orderSql}
			 LIMIT ? OFFSET ?`,
		)
		.bind(...params, pageSize, (page - 1) * pageSize)
		.all<Post>();

	const total = countRow?.total ?? 0;
	return {
		posts: results ?? [],
		total,
		page,
		pageSize,
		totalPages: Math.max(1, Math.ceil(total / pageSize)),
	};
}

export async function getPostBySlug(
	db: D1Database,
	slug: string,
): Promise<Post | null> {
	return db
		.prepare(
			`SELECT p.*, c.slug AS category_slug, c.name AS category_name,
			        c.icon AS category_icon, c.accent AS category_accent
			 FROM posts p JOIN categories c ON c.id = p.category_id
			 WHERE p.slug = ?`,
		)
		.bind(slug)
		.first<Post>();
}

export async function getPostById(
	db: D1Database,
	id: number,
): Promise<Post | null> {
	return db
		.prepare(
			`SELECT p.*, c.slug AS category_slug, c.name AS category_name,
			        c.icon AS category_icon, c.accent AS category_accent
			 FROM posts p JOIN categories c ON c.id = p.category_id
			 WHERE p.id = ?`,
		)
		.bind(id)
		.first<Post>();
}

export async function incrementViews(db: D1Database, id: number) {
	await db
		.prepare("UPDATE posts SET view_count = view_count + 1 WHERE id = ?")
		.bind(id)
		.run();
}

export async function listRelatedPosts(
	db: D1Database,
	categoryId: number,
	excludeId: number,
	limit = 4,
): Promise<Post[]> {
	const { results } = await db
		.prepare(
			`SELECT p.*, c.slug AS category_slug, c.name AS category_name,
			        c.icon AS category_icon, c.accent AS category_accent
			 FROM posts p JOIN categories c ON c.id = p.category_id
			 WHERE p.category_id = ? AND p.id != ? AND p.status = 'published'
			 ORDER BY p.created_at DESC LIMIT ?`,
		)
		.bind(categoryId, excludeId, limit)
		.all<Post>();
	return results ?? [];
}

export async function listHotPosts(
	db: D1Database,
	limit = 5,
): Promise<Post[]> {
	const { results } = await db
		.prepare(
			`SELECT p.*, c.slug AS category_slug, c.name AS category_name,
			        c.icon AS category_icon, c.accent AS category_accent
			 FROM posts p JOIN categories c ON c.id = p.category_id
			 WHERE p.status = 'published'
			 ORDER BY p.view_count DESC, p.like_count DESC LIMIT ?`,
		)
		.bind(limit)
		.all<Post>();
	return results ?? [];
}

export async function listRegions(db: D1Database): Promise<string[]> {
	const { results } = await db
		.prepare(
			`SELECT region, COUNT(*) AS total FROM posts
			 WHERE region != '' AND status = 'published'
			 GROUP BY region ORDER BY total DESC LIMIT 20`,
		)
		.all<{ region: string; total: number }>();
	return (results ?? []).map((r) => r.region);
}

export async function listComments(
	db: D1Database,
	postId: number,
): Promise<Comment[]> {
	const { results } = await db
		.prepare(
			"SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC",
		)
		.bind(postId)
		.all<Comment>();
	return results ?? [];
}

export async function addComment(
	db: D1Database,
	postId: number,
	authorName: string,
	content: string,
): Promise<void> {
	await db
		.prepare(
			"INSERT INTO comments (post_id, author_name, content) VALUES (?, ?, ?)",
		)
		.bind(postId, authorName || "匿名用户", content)
		.run();
	await db
		.prepare(
			"UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?",
		)
		.bind(postId)
		.run();
}

export type ReactionKind = "like" | "favorite";

export async function toggleReaction(
	db: D1Database,
	postId: number,
	clientId: string,
	kind: ReactionKind,
): Promise<{ active: boolean; count: number }> {
	const column = kind === "like" ? "like_count" : "favorite_count";
	const existing = await db
		.prepare(
			"SELECT id FROM reactions WHERE post_id = ? AND client_id = ? AND kind = ?",
		)
		.bind(postId, clientId, kind)
		.first<{ id: number }>();

	let active = false;
	if (existing) {
		await db
			.prepare("DELETE FROM reactions WHERE id = ?")
			.bind(existing.id)
			.run();
		await db
			.prepare(
				`UPDATE posts SET ${column} = MAX(${column} - 1, 0) WHERE id = ?`,
			)
			.bind(postId)
			.run();
		active = false;
	} else {
		await db
			.prepare(
				"INSERT INTO reactions (post_id, client_id, kind) VALUES (?, ?, ?)",
			)
			.bind(postId, clientId, kind)
			.run();
		await db
			.prepare(`UPDATE posts SET ${column} = ${column} + 1 WHERE id = ?`)
			.bind(postId)
			.run();
		active = true;
	}

	const row = await db
		.prepare(`SELECT ${column} AS count FROM posts WHERE id = ?`)
		.bind(postId)
		.first<{ count: number }>();
	return { active, count: row?.count ?? 0 };
}

export async function getUserReactions(
	db: D1Database,
	clientId: string,
	postIds: number[],
): Promise<Set<string>> {
	if (!clientId || postIds.length === 0) return new Set();
	const placeholders = postIds.map(() => "?").join(",");
	const { results } = await db
		.prepare(
			`SELECT post_id, kind FROM reactions
			 WHERE client_id = ? AND post_id IN (${placeholders})`,
		)
		.bind(clientId, ...postIds)
		.all<{ post_id: number; kind: string }>();
	return new Set((results ?? []).map((r) => `${r.post_id}:${r.kind}`));
}

export async function listGuides(
	db: D1Database,
	filters: { q?: string; category?: string } = {},
): Promise<Guide[]> {
	const where: string[] = ["1 = 1"];
	const params: unknown[] = [];
	if (filters.q) {
		where.push("(g.title LIKE ? OR g.summary LIKE ? OR g.scenario LIKE ?)");
		const like = `%${filters.q}%`;
		params.push(like, like, like);
	}
	if (filters.category) {
		where.push("c.slug = ?");
		params.push(filters.category);
	}
	const { results } = await db
		.prepare(
			`SELECT g.*, c.slug AS category_slug, c.name AS category_name,
			        c.icon AS category_icon, c.accent AS category_accent
			 FROM guides g LEFT JOIN categories c ON c.id = g.category_id
			 WHERE ${where.join(" AND ")}
			 ORDER BY g.created_at DESC`,
		)
		.bind(...params)
		.all<Guide>();
	return results ?? [];
}

export async function getGuideBySlug(
	db: D1Database,
	slug: string,
): Promise<Guide | null> {
	return db
		.prepare(
			`SELECT g.*, c.slug AS category_slug, c.name AS category_name,
			        c.icon AS category_icon, c.accent AS category_accent
			 FROM guides g LEFT JOIN categories c ON c.id = g.category_id
			 WHERE g.slug = ?`,
		)
		.bind(slug)
		.first<Guide>();
}

export interface Stats {
	posts: number;
	categories: number;
	guides: number;
	comments: number;
}export async function getStats(db: D1Database): Promise<Stats> {
	const row = await db
		.prepare(
			`SELECT
			   (SELECT COUNT(*) FROM posts WHERE status = 'published') AS posts,
			   (SELECT COUNT(*) FROM categories) AS categories,
			   (SELECT COUNT(*) FROM guides) AS guides,
			   (SELECT COUNT(*) FROM comments) AS comments`,
		)
		.first<Stats>();
	return row ?? { posts: 0, categories: 0, guides: 0, comments: 0 };
}

export interface SitemapData {
	posts: { slug: string; updated_at: string }[];
	guides: { slug: string }[];
	categories: { slug: string }[];
}

export async function listSitemapData(db: D1Database): Promise<SitemapData> {
	const [posts, guides, categories] = await Promise.all([
		db
			.prepare(
				"SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY created_at DESC",
			)
			.all<{ slug: string; updated_at: string }>(),
		db.prepare("SELECT slug FROM guides ORDER BY created_at DESC").all<{
			slug: string;
		}>(),
		db
			.prepare("SELECT slug FROM categories ORDER BY sort_order ASC")
			.all<{ slug: string }>(),
	]);
	return {
		posts: posts.results ?? [],
		guides: guides.results ?? [],
		categories: categories.results ?? [],
	};
}

export interface NewPostInput {
	title: string;
	content: string;
	categorySlug: string;
	region: string;
	merchantName: string;
	riskLevel: RiskLevel;
	tags: string;
	authorName: string;
	lossAmount: number;
}

export async function createPost(
	db: D1Database,
	input: NewPostInput,
): Promise<Post | null> {
	const category = await getCategoryBySlug(db, input.categorySlug);
	if (!category) return null;

	const slug = `post-${Date.now().toString(36)}-${Math.random()
		.toString(36)
		.slice(2, 6)}`;
	const summary = input.content.replace(/\s+/g, " ").trim().slice(0, 90);

	await db
		.prepare(
			`INSERT INTO posts
			 (slug, title, summary, content, category_id, region, merchant_name,
			  risk_level, tags, author_name, loss_amount)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			slug,
			input.title,
			summary,
			input.content,
			category.id,
			input.region,
			input.merchantName,
			input.riskLevel,
			input.tags,
			input.authorName || "匿名用户",
			input.lossAmount,
		)
		.run();

	return getPostBySlug(db, slug);
}
