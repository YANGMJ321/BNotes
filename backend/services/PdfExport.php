<?php
require_once __DIR__ . '/../database.php';

class PdfExport {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function export($data) {
        $bookIds = $data['book_ids'] ?? [];

        if (empty($bookIds)) {
            return ['code' => 400, 'message' => 'No books selected'];
        }

        $placeholders = implode(',', array_fill(0, count($bookIds), '?'));
        $pdo = $this->db->getPdo();

        $stmt = $pdo->prepare("
            SELECT b.*, c.name as category_name, n.content, n.excerpts, n.reflections
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN notes n ON b.id = n.book_id
            WHERE b.id IN ({$placeholders})
        ");
        $stmt->execute($bookIds);
        $books = $stmt->fetchAll();

        $html = '<html><head><meta charset="UTF-8"><style>
            body { font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif; padding: 20px; }
            .book { margin-bottom: 40px; page-break-after: always; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            .meta { color: #999; font-size: 14px; }
            .content { line-height: 1.8; }
            .excerpts { background: #f5f5f5; padding: 15px; border-left: 4px solid #333; margin: 20px 0; }
            .reflections { background: #fff; padding: 15px; border-left: 4px solid #666; margin: 20px 0; }
            .progress { color: #666; }
        </style></head><body>';

        foreach ($books as $book) {
            $tagsStmt = $pdo->prepare("
                SELECT t.name FROM tags t
                JOIN book_tags bt ON t.id = bt.tag_id
                WHERE bt.book_id = ?
            ");
            $tagsStmt->execute([$book['id']]);
            $tags = $tagsStmt->fetchAll(PDO::FETCH_COLUMN);
            $tagsStr = implode(', ', $tags);

            $statusMap = ['want' => '想读', 'reading' => '在读', 'done' => '已读'];
            $statusText = $statusMap[$book['status']] ?? $book['status'];

            $html .= '<div class="book">';
            $html .= '<h1>' . htmlspecialchars($book['title']) . '</h1>';
            $html .= '<p class="meta">作者：' . htmlspecialchars($book['author']) . ' | ';
            $html .= '分类：' . htmlspecialchars($book['category_name']) . ' | ';
            $html .= '标签：' . htmlspecialchars($tagsStr) . ' | ';
            $html .= '状态：' . $statusText;

            if ($book['status'] === 'reading' && $book['progress'] > 0) {
                $html .= ' | 进度：' . $book['progress'] . '%';
            }

            $html .= '</p>';

            if (!empty($book['read_date'])) {
                $html .= '<p class="meta">阅读日期：' . $book['read_date'] . '</p>';
            }

            if (!empty($book['excerpts'])) {
                $html .= '<h2>金句摘录</h2>';
                $html .= '<div class="excerpts">' . nl2br(htmlspecialchars($book['excerpts'])) . '</div>';
            }

            if (!empty($book['reflections'])) {
                $html .= '<h2>读后感</h2>';
                $html .= '<div class="reflections">' . nl2br(htmlspecialchars($book['reflections'])) . '</div>';
            }

            if (!empty($book['content'])) {
                $html .= '<h2>笔记内容</h2>';
                $html .= '<div class="content">' . nl2br(htmlspecialchars($book['content'])) . '</div>';
            }

            $html .= '</div>';
        }

        $html .= '</body></html>';

        $filename = 'BNotes_Export_' . date('Ymd_His') . '.html';
        $filepath = __DIR__ . '/../../exports/' . $filename;

        if (!file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }

        file_put_contents($filepath, $html);

        return ['code' => 200, 'message' => 'Export successful', 'data' => ['filename' => $filename, 'path' => '/exports/' . $filename]];
    }
}
