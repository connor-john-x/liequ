-- 雷区 leiqu.org · 数据库结构
-- 板块
CREATE TABLE IF NOT EXISTS categories (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	slug TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	icon TEXT NOT NULL DEFAULT '📌',
	accent TEXT NOT NULL DEFAULT 'slate',
	sort_order INTEGER NOT NULL DEFAULT 0
);

-- 避雷帖
CREATE TABLE IF NOT EXISTS posts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	slug TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL,
	summary TEXT NOT NULL DEFAULT '',
	content TEXT NOT NULL,
	category_id INTEGER NOT NULL REFERENCES categories(id),
	region TEXT NOT NULL DEFAULT '',
	merchant_name TEXT NOT NULL DEFAULT '',
	risk_level TEXT NOT NULL DEFAULT 'medium',
	tags TEXT NOT NULL DEFAULT '',
	author_name TEXT NOT NULL DEFAULT '匿名用户',
	loss_amount INTEGER NOT NULL DEFAULT 0,
	view_count INTEGER NOT NULL DEFAULT 0,
	like_count INTEGER NOT NULL DEFAULT 0,
	favorite_count INTEGER NOT NULL DEFAULT 0,
	comment_count INTEGER NOT NULL DEFAULT 0,
	status TEXT NOT NULL DEFAULT 'published',
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_region ON posts(region);

-- 评论
CREATE TABLE IF NOT EXISTS comments (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	author_name TEXT NOT NULL DEFAULT '匿名用户',
	content TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);

-- 匿名互动（点赞 / 收藏），通过浏览器 client_id 去重
CREATE TABLE IF NOT EXISTS reactions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	client_id TEXT NOT NULL,
	kind TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE (post_id, client_id, kind)
);

-- 维权指南
CREATE TABLE IF NOT EXISTS guides (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	slug TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL,
	scenario TEXT NOT NULL DEFAULT '',
	category_id INTEGER REFERENCES categories(id),
	summary TEXT NOT NULL DEFAULT '',
	risk_level TEXT NOT NULL DEFAULT 'medium',
	steps TEXT NOT NULL DEFAULT '[]',
	channels TEXT NOT NULL DEFAULT '[]',
	legal_basis TEXT NOT NULL DEFAULT '[]',
	script TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
