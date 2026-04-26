<?php
class Book {
    private $db;
    private $table = 'books';

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $stmt = $this->db->getPdo()->query("
            SELECT b.*, c.name as category_name,
                   GROUP_CONCAT(DISTINCT t.name) as tags,
                   GROUP_CONCAT(DISTINCT t.id) as tag_ids,
                   n.content, n.excerpts, n.reflections
            FROM {$this->table} b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN book_tags bt ON b.id = bt.book_id
            LEFT JOIN tags t ON bt.tag_id = t.id
            LEFT JOIN notes n ON b.id = n.book_id
            GROUP BY b.id
            ORDER BY b.updated_at DESC
        ");
        return ['code' => 200, 'data' => $stmt->fetchAll()];
    }

    public function getById($id) {
        $stmt = $this->db->getPdo()->prepare("
            SELECT b.*, c.name as category_name,
                   GROUP_CONCAT(DISTINCT t.name) as tags,
                   GROUP_CONCAT(DISTINCT t.id) as tag_ids
            FROM {$this->table} b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN book_tags bt ON b.id = bt.book_id
            LEFT JOIN tags t ON bt.tag_id = t.id
            WHERE b.id = ?
            GROUP BY b.id
        ");
        $stmt->execute([$id]);
        $book = $stmt->fetch();

        if ($book) {
            $noteStmt = $this->db->getPdo()->prepare("SELECT * FROM notes WHERE book_id = ?");
            $noteStmt->execute([$id]);
            $book['note'] = $noteStmt->fetch();

            $linksStmt = $this->db->getPdo()->prepare("
                SELECT nl.*, b.title as target_book_title
                FROM note_links nl
                JOIN books b ON nl.target_book_id = b.id
                WHERE nl.source_note_id = ?
            ");
            $linksStmt->execute([$book['note']['id'] ?? 0]);
            $book['links'] = $linksStmt->fetchAll();
        }

        return $book ? ['code' => 200, 'data' => $book] : ['code' => 404, 'message' => 'Book not found'];
    }

    public function create($data) {
        $pdo = $this->db->getPdo();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO {$this->table} (title, author, category_id, status, progress, read_date)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['title'] ?? '',
                $data['author'] ?? '',
                $data['category_id'] ?? 1,
                $data['status'] ?? 'want',
                $data['progress'] ?? 0,
                $data['read_date'] ?? null
            ]);

            $bookId = $pdo->lastInsertId();

            $noteStmt = $pdo->prepare("INSERT INTO notes (book_id) VALUES (?)");
            $noteStmt->execute([$bookId]);

            if (!empty($data['tags'])) {
                $this->saveTags($bookId, $data['tags']);
            }

            $pdo->commit();
            return ['code' => 201, 'message' => 'Book created', 'data' => ['id' => $bookId]];
        } catch (Exception $e) {
            $pdo->rollBack();
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    public function update($id, $data) {
        $pdo = $this->db->getPdo();
        $pdo->beginTransaction();
        try {
            $fields = [];
            $params = [];

            $allowedFields = ['title', 'author', 'category_id', 'status', 'progress', 'read_date'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "{$field} = ?";
                    $params[] = $data[$field];
                }
            }

            if (!empty($fields)) {
                $fields[] = "updated_at = CURRENT_TIMESTAMP";
                $params[] = $id;
                $stmt = $pdo->prepare("UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ?");
                $stmt->execute($params);
            }

            if (isset($data['tags'])) {
                $pdo->exec("DELETE FROM book_tags WHERE book_id = {$id}");
                $this->saveTags($id, $data['tags']);
            }

            if (isset($data['note'])) {
                $noteData = $data['note'];
                $noteFields = [];
                $noteParams = [];

                $allowedNoteFields = ['content', 'excerpts', 'reflections'];
                foreach ($allowedNoteFields as $field) {
                    if (isset($noteData[$field])) {
                        $noteFields[] = "{$field} = ?";
                        $noteParams[] = $noteData[$field];
                    }
                }

                if (!empty($noteFields)) {
                    $noteFields[] = "updated_at = CURRENT_TIMESTAMP";
                    $noteParams[] = $id;
                    $noteStmt = $pdo->prepare("UPDATE notes SET " . implode(', ', $noteFields) . " WHERE book_id = ?");
                    $noteStmt->execute($noteParams);
                }
            }

            if (isset($data['links'])) {
                $pdo->exec("DELETE FROM note_links WHERE source_note_id = (SELECT id FROM notes WHERE book_id = {$id})");
                foreach ($data['links'] as $link) {
                    $linkStmt = $pdo->prepare("INSERT INTO note_links (source_note_id, target_book_id, keyword) VALUES ((SELECT id FROM notes WHERE book_id = ?), ?, ?)");
                    $linkStmt->execute([$id, $link['target_book_id'], $link['keyword'] ?? '']);
                }
            }

            $pdo->commit();
            return ['code' => 200, 'message' => 'Book updated'];
        } catch (Exception $e) {
            $pdo->rollBack();
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    public function delete($id) {
        try {
            $stmt = $this->db->getPdo()->prepare("DELETE FROM {$this->table} WHERE id = ?");
            $stmt->execute([$id]);
            return ['code' => 200, 'message' => 'Book deleted'];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    public function search($keyword) {
        $stmt = $this->db->getPdo()->prepare("
            SELECT b.*, c.name as category_name,
                   GROUP_CONCAT(DISTINCT t.name) as tags
            FROM {$this->table} b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN book_tags bt ON b.id = bt.book_id
            LEFT JOIN tags t ON bt.tag_id = t.id
            WHERE b.title LIKE ? OR b.author LIKE ? OR n.content LIKE ? OR n.excerpts LIKE ?
            GROUP BY b.id
            ORDER BY b.updated_at DESC
        ");
        $likeKeyword = '%' . $keyword . '%';
        $stmt->execute([$likeKeyword, $likeKeyword, $likeKeyword, $likeKeyword]);
        return ['code' => 200, 'data' => $stmt->fetchAll()];
    }

    public function batchDelete($ids) {
        $pdo = $this->db->getPdo();
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        try {
            $stmt = $pdo->prepare("DELETE FROM {$this->table} WHERE id IN ({$placeholders})");
            $stmt->execute($ids);
            return ['code' => 200, 'message' => 'Books deleted'];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    public function batchMove($ids, $categoryId) {
        $pdo = $this->db->getPdo();
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        try {
            $stmt = $pdo->prepare("UPDATE {$this->table} SET category_id = ? WHERE id IN ({$placeholders})");
            array_unshift($ids, $categoryId);
            $stmt->execute($ids);
            return ['code' => 200, 'message' => 'Books moved'];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    private function saveTags($bookId, $tags) {
        $pdo = $this->db->getPdo();
        foreach ($tags as $tagName) {
            $tagName = trim($tagName);
            if (empty($tagName)) continue;

            $stmt = $pdo->prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
            $stmt->execute([$tagName]);

            $tagStmt = $pdo->prepare("SELECT id FROM tags WHERE name = ?");
            $tagStmt->execute([$tagName]);
            $tag = $tagStmt->fetch();

            if ($tag) {
                $linkStmt = $pdo->prepare("INSERT OR IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)");
                $linkStmt->execute([$bookId, $tag['id']]);
            }
        }
    }
}
