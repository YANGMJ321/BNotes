<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/models/Book.php';
require_once __DIR__ . '/models/Note.php';
require_once __DIR__ . '/models/Category.php';
require_once __DIR__ . '/models/Tag.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

$basePath = '/api';
$path = parse_url($requestUri, PHP_URL_PATH);
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

$db = Database::getInstance();
$response = ['code' => 404, 'message' => 'Not Found'];

try {
    if ($path === '/books' || $path === '/books/') {
        $model = new Book($db);
        if ($requestMethod === 'GET') {
            $id = $_GET['id'] ?? null;
            $response = $id ? $model->getById($id) : $model->getAll();
        } elseif ($requestMethod === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $response = $model->create($data);
        } elseif ($requestMethod === 'PUT') {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? null;
            $response = $id ? $model->update($id, $data) : ['code' => 400, 'message' => 'Missing id'];
        } elseif ($requestMethod === 'DELETE') {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? null;
            $response = $id ? $model->delete($id) : ['code' => 400, 'message' => 'Missing id'];
        }
    } elseif (preg_match('#^/books/(\d+)$#', $path, $matches)) {
        $model = new Book($db);
        $id = (int)$matches[1];
        if ($requestMethod === 'GET') {
            $response = $model->getById($id);
        } elseif ($requestMethod === 'PUT') {
            $data = json_decode(file_get_contents('php://input'), true);
            $response = $model->update($id, $data);
        } elseif ($requestMethod === 'DELETE') {
            $response = $model->delete($id);
        }
    } elseif ($path === '/notes' || $path === '/notes/') {
        $model = new Note($db);
        if ($requestMethod === 'GET') {
            $bookId = $_GET['book_id'] ?? null;
            $response = $bookId ? $model->getByBookId($bookId) : $model->getAll();
        } elseif ($requestMethod === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $response = $model->create($data);
        } elseif ($requestMethod === 'PUT') {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? null;
            $response = $id ? $model->update($id, $data) : ['code' => 400, 'message' => 'Missing id'];
        } elseif ($requestMethod === 'DELETE') {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? null;
            $response = $id ? $model->delete($id) : ['code' => 400, 'message' => 'Missing id'];
        }
    } elseif (preg_match('#^/notes/(\d+)$#', $path, $matches)) {
        $model = new Note($db);
        $id = (int)$matches[1];
        if ($requestMethod === 'GET') {
            $response = $model->getById($id);
        } elseif ($requestMethod === 'PUT') {
            $data = json_decode(file_get_contents('php://input'), true);
            $response = $model->update($id, $data);
        } elseif ($requestMethod === 'DELETE') {
            $response = $model->delete($id);
        }
    } elseif ($path === '/categories' || $path === '/categories/') {
        $model = new Category($db);
        if ($requestMethod === 'GET') {
            $response = $model->getAll();
        } elseif ($requestMethod === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $response = $model->create($data);
        } elseif ($requestMethod === 'PUT') {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? null;
            $response = $id ? $model->update($id, $data) : ['code' => 400, 'message' => 'Missing id'];
        } elseif ($requestMethod === 'DELETE') {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? null;
            $response = $id ? $model->delete($id) : ['code' => 400, 'message' => 'Missing id'];
        }
    } elseif ($path === '/tags' || $path === '/tags/') {
        $model = new Tag($db);
        if ($requestMethod === 'GET') {
            $response = $model->getAll();
        } elseif ($requestMethod === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $response = $model->create($data);
        } elseif ($requestMethod === 'PUT') {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? null;
            $response = $id ? $model->update($id, $data) : ['code' => 400, 'message' => 'Missing id'];
        } elseif ($requestMethod === 'DELETE') {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? null;
            $response = $id ? $model->delete($id) : ['code' => 400, 'message' => 'Missing id'];
        }
    } elseif ($path === '/search' || $path === '/search/') {
        $keyword = $_GET['keyword'] ?? '';
        $model = new Book($db);
        $response = $model->search($keyword);
    } elseif ($path === '/export/pdf' || $path === '/export/pdf/') {
        require_once __DIR__ . '/services/PdfExport.php';
        $data = json_decode(file_get_contents('php://input'), true);
        $pdf = new PdfExport($db);
        $response = $pdf->export($data);
    } elseif ($path === '/batch/delete' || $path === '/batch/delete/') {
        $data = json_decode(file_get_contents('php://input'), true);
        $ids = $data['ids'] ?? [];
        $type = $data['type'] ?? 'books';
        $model = $type === 'books' ? new Book($db) : new Note($db);
        $response = $model->batchDelete($ids);
    } elseif ($path === '/batch/move' || $path === '/batch/move/') {
        $data = json_decode(file_get_contents('php://input'), true);
        $ids = $data['ids'] ?? [];
        $categoryId = $data['category_id'] ?? null;
        $model = new Book($db);
        $response = $model->batchMove($ids, $categoryId);
    }
} catch (Exception $e) {
    $response = ['code' => 500, 'message' => $e->getMessage()];
}

http_response_code($response['code'] ?? 200);
echo json_encode($response, JSON_UNESCAPED_UNICODE);
