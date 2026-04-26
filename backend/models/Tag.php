<?php
class Tag {
    private $db;
    private $table = 'tags';

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $stmt = $this->db->getPdo()->query("SELECT * FROM {$this->table} ORDER BY name");
        return ['code' => 200, 'data' => $stmt->fetchAll()];
    }

    public function create($data) {
        try {
            $stmt = $this->db->getPdo()->prepare("INSERT INTO {$this->table} (name) VALUES (?)");
            $stmt->execute([$data['name']]);
            return ['code' => 201, 'message' => 'Tag created', 'data' => ['id' => $this->db->getPdo()->lastInsertId()]];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    public function update($id, $data) {
        try {
            $stmt = $this->db->getPdo()->prepare("UPDATE {$this->table} SET name = ? WHERE id = ?");
            $stmt->execute([$data['name'], $id]);
            return ['code' => 200, 'message' => 'Tag updated'];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }

    public function delete($id) {
        try {
            $pdo = $this->db->getPdo();
            $pdo->exec("DELETE FROM book_tags WHERE tag_id = {$id}");
            $stmt = $pdo->prepare("DELETE FROM {$this->table} WHERE id = ?");
            $stmt->execute([$id]);
            return ['code' => 200, 'message' => 'Tag deleted'];
        } catch (Exception $e) {
            return ['code' => 500, 'message' => $e->getMessage()];
        }
    }
}
