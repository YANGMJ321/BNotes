const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

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
                        mainWindow.loadURL('file://' + path.join(__dirname, '../dist/index.html') + '#/books/new');
                    }
                },
                { type: 'separator' },
                {
                    label: '导出PDF',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow.webContents.send('export-pdf');
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: '编辑',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: '视图',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
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
                            detail: '版本: 1.0.0\n一个简洁高效的读书笔记管理工具'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
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
