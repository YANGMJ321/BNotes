const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');

// 检测是否在打包环境中运行
const isPackaged = __dirname.startsWith(process.resourcesPath);

// 打包模式下，将 userData 设置到 exe 同级目录，避免写入 C 盘
if (isPackaged) {
    const exeDir = path.dirname(process.execPath);
    app.setPath('userData', path.join(exeDir, 'userdata'));
    app.setPath('appData', exeDir);
}

// 捕获未处理的异常
process.on('uncaughtException', (err) => {
    console.error('[BNotes] Uncaught Exception:', err);
});

let mainWindow;

const SERVER_PORT = 18765;

async function startServer() {
    // 设置环境变量
    const exeDir = isPackaged
        ? path.dirname(process.execPath)
        : path.join(__dirname, '..');

    const dataDir = isPackaged
        ? path.join(exeDir, 'data')
        : path.join(__dirname, '..', 'data');
    const exportsDir = isPackaged
        ? path.join(exeDir, 'exports')
        : path.join(__dirname, '..', 'exports');

    process.env.BNOTES_DATA_DIR = dataDir;
    process.env.BNOTES_PORT = String(SERVER_PORT);
    process.env.BNOTES_EXPORTS_DIR = exportsDir;

    console.log('[BNotes] Data dir:', dataDir);
    console.log('[BNotes] Exports dir:', exportsDir);

    // 在主进程中直接启动 Express 服务器
    const { start } = require(path.join(__dirname, '..', 'backend-node', 'server'));
    try {
        await start();
        console.log('[BNotes] 后端服务已启动');
    } catch (err) {
        console.error('[BNotes] 后端服务启动失败:', err);
    }
}

// 等待服务器就绪（带重试）
function waitForServer(maxRetries = 20, interval = 500) {
    return new Promise((resolve, reject) => {
        let retries = 0;
        function check() {
            const req = http.get(`http://localhost:${SERVER_PORT}/api/health`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log('[BNotes] Server health check passed');
                    resolve(true);
                });
            });
            req.on('error', () => {
                retries++;
                if (retries >= maxRetries) {
                    console.error('[BNotes] Server health check failed after', maxRetries, 'retries');
                    reject(new Error('Server not ready'));
                } else {
                    setTimeout(check, interval);
                }
            });
            req.setTimeout(2000, () => {
                req.destroy();
                retries++;
                if (retries >= maxRetries) {
                    reject(new Error('Server not ready'));
                } else {
                    setTimeout(check, interval);
                }
            });
        }
        check();
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        title: 'BNotes - 读书笔记',
        icon: path.join(__dirname, 'icon.png')
    });

    const menuTemplate = [
        {
            label: '文件',
            submenu: [
                {
                    label: '新建书籍',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.loadURL(`http://localhost:${SERVER_PORT}/#/books/new`);
                    }
                },
                { type: 'separator' },
                {
                    label: '导出',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow.webContents.send('export-pdf');
                    }
                },
                { type: 'separator' },
                {
                    label: '退出',
                    accelerator: 'CmdOrCtrl+Q',
                    role: 'quit'
                }
            ]
        },
        {
            label: '编辑',
            submenu: [
                { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: '重做', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
                { type: 'separator' },
                { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
                { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
            ]
        },
        {
            label: '视图',
            submenu: [
                { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
                { label: '开发者工具', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' },
                { type: 'separator' },
                { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
                { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                { type: 'separator' },
                { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于 BNotes',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '关于 BNotes',
                            message: 'BNotes - 读书笔记管理系统',
                            detail: '版本: 1.4.0\n一个简洁高效的读书笔记管理工具'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // 从 Express 服务器加载页面
    mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    await startServer();

    // 等待服务器真正就绪再创建窗口
    try {
        await waitForServer();
    } catch (e) {
        console.error('[BNotes] 服务器未就绪，尝试继续启动...');
    }

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
