<?php
class Note {
    private $db;
    private $table = 'notes';

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $stmt = $this->db->getPdo()->query("
            SELECT n.*, b.title as book_title, b.author as book_author
            FROM {$this->table} n
            JOIN books b ON n.book_id = b.id
            ORDER BY n.updated_at DESC
        ");
        return ['code' => 200, 'data' => $stmt->fetchAll()];
    }

    public function getById($id) {
        $stmt = $this->db->getPdo()->prepare("
            SELECT n.*, b.title as book_title, b.author as book_author
            FROM {$this->table} n
            JOIN books b ON n.book_id = b.id
            WHERE n.id = ?
        ");
        $stmt->execute([$id]);
        $note = $stmt->fetch();
        return $note ? ['code' => 200, 'data' => $note] : ['code' => 404, 'message' => 'Note not found'];
    }

    public function getByBookId($bookId) {
        $stmt = $this->db->getPdo()->prepare("SELECT * FROM {$this->table} WHERE book_id = ?");
        $stmt->execute([$bookId]);
        return ['code' => 200, 'data' => $stmt->fetch()];
    }

    public function create($data) {
        try {
            $stmt = $this->db->getPdo()->prepare("
                INSERT INTO {$this->table} (book_id, content, excerpts, reflections)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['book_id'],
                $data['content'] ?? '',
                $data['excerpts'] ?? '',
                $data['reflections'] ?? ''
            ]);
            return ['code' => 201, 'message' => 'Note created', 'data' => ['id' => $this->db->getPdo()->lastInsertId()]];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    public function update($id, $data) {
        try {
            $fields = [];
            $params = [];

            $allowedFields = ['content', 'excerpts', 'reflections'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "{$field} = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($fields)) {
                return ['code' => 400, 'message' => 'No fields to update'];
            }

            $fields[] = "updated_at = CURRENT_TIMESTAMP";
            $params[] = $id;

            $stmt = $this->db->getPdo()->prepare("UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($params);
            return ['code' => 200, 'message' => 'Note updated'];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    public function delete($id) {
        try {
            $stmt = $this->db->getPdo()->prepare("DELETE FROM {$this->table} WHERE id = ?");
            $stmt->execute([$id]);
            return ['code' => 200, 'message' => 'Note deleted'];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    public function batchDelete($ids) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        try {
            $stmt = $this->db->getPdo()->prepare("DELETE FROM {$this->table} WHERE id IN ({$placeholders})");
            $stmt->execute($ids);
            return ['code' => 200, 'message' => 'Notes deleted'];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }
}
