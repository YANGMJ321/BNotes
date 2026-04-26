<?php
class Category {
    private $db;
    private $table = 'categories';

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $stmt = $this->db->getPdo()->query("SELECT * FROM {$this->table} ORDER BY id");
        return ['code' => 200, 'data' => $stmt->fetchAll()];
    }

    public function create($data) {
        try {
            $stmt = $this->db->getPdo()->prepare("INSERT INTO {$this->table} (name, parent_id) VALUES (?, ?)");
            $stmt->execute([$data['name'], $data['parent_id'] ?? 0]);
            return ['code' => 201, 'message' => 'Category created', 'data' => ['id' => $this->db->getPdo()->lastInsertId()]];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    public function update($id, $data) {
        try {
            $stmt = $this->db->getPdo()->prepare("UPDATE {$this->table} SET name = ? WHERE id = ?");
            $stmt->execute([$data['name'], $id]);
            return ['code' => 200, 'message' => 'Category updated'];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    public function delete($id) {
        if ($id == 1) {
            return ['code' => 400, 'message' => 'Cannot delete default category'];
        }
        try {
            $pdo = $this->db->getPdo();
            $pdo->exec("UPDATE books SET category_id = 1 WHERE category_id = {$id}");
            $stmt = $pdo->prepare("DELETE FROM {$this->table} WHERE id = ?");
            $stmt->execute([$id]);
            return ['code' => 200, 'message' => 'Category deleted'];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }
}
