# BNotes 自动化构建脚本

## 使用说明

### 快速构建（开发版）
```powershell
.\build.ps1
```

### 构建正式版
```powershell
.\build.ps1 -Release
```

### 仅构建网页版
```powershell
.\build.ps1 -WebOnly
```

### 仅构建桌面版
```powershell
.\build.ps1 -DesktopOnly
```

## 构建流程

1. 清理旧构建文件
2. 构建前端 Vue 应用
3. 复制静态文件到 dist
4. 使用 electron-builder 打包
5. 生成版本信息文件
6. 输出到 dist/release 目录

## 版本号自动递增规则

- `-Patch`: 修订号 +1 (1.0.0 → 1.0.1)
- `-Minor`: 次版本 +1 (1.0.0 → 1.1.0)
- `-Major`: 主版本 +1 (1.0.0 → 2.0.0)
- 无参数: 仅构建，不递增版本

## 示例

```powershell
# 构建并递增修订版本号
.\build.ps1 -Patch

# 构建并递增次版本号
.\build.ps1 -Minor

# 发布正式版
.\build.ps1 -Major
```

## 输出目录

```
dist/
├── release/
│   ├── BNotes-1.0.0-portable.exe    # 便携版
│   └── BNotes-1.0.0-setup.exe       # 安装版
└── version.json                      # 版本信息
```
