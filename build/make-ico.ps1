# Generate a multi-size Windows .ico from a source PNG
# Usage: powershell -ExecutionPolicy Bypass -File build\make-ico.ps1 -SourcePng <png> -OutIco <ico>
param(
    [Parameter(Mandatory=$true)][string]$SourcePng,
    [Parameter(Mandatory=$true)][string]$OutIco
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sizes = 256, 128, 64, 48, 32, 16

$src = [System.Drawing.Bitmap]::new($SourcePng)
try {
    $entries  = New-Object System.Collections.Generic.List[byte[]]
    $dirItems = New-Object System.Collections.Generic.List[byte[]]
    $offset   = 6 + 16 * $sizes.Count

    foreach ($size in $sizes) {
        # Resize with high-quality bicubic
        $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($src, 0, 0, $size, $size)
        $g.Dispose()

        if ($size -eq 256) {
            # 256x256 stored as PNG (Vista+)
            $ms = New-Object System.IO.MemoryStream
            $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
            $data = $ms.ToArray()
            $ms.Dispose()
            $dirItems.Add([byte[]]@(0, 0, 0, 0, 1, 0, 32, 0) + [BitConverter]::GetBytes([uint32]$data.Length) + [BitConverter]::GetBytes([uint32]$offset))
        }
        else {
            # Smaller sizes stored as 32bpp BMP (double height: XOR + AND mask)
            $w = $size; $h = $size
            $pixelLen = $w * $h * 4
            $maskRow  = [math]::Ceiling($w / 8)
            $maskRow  = [math]::Ceiling($maskRow / 4) * 4
            $maskLen  = $maskRow * $h
            $data = New-Object byte[] (40 + $pixelLen + $maskLen)

            # BITMAPINFOHEADER (biHeight = 2*h)
            [BitConverter]::GetBytes([uint32]40).CopyTo($data, 0)
            [BitConverter]::GetBytes([int32]$w).CopyTo($data, 4)
            [BitConverter]::GetBytes([int32]($h * 2)).CopyTo($data, 8)
            [BitConverter]::GetBytes([uint16]1).CopyTo($data, 12)
            [BitConverter]::GetBytes([uint16]32).CopyTo($data, 14)
            [BitConverter]::GetBytes([uint32]($pixelLen + $maskLen)).CopyTo($data, 20)   # biSizeImage = XOR + AND

            # Pixel rows bottom-up, BGRA. GetPixel is slow but reliable.
            for ($yy = $h - 1; $yy -ge 0; $yy--) {
                $rowBase = 40 + (($h - 1 - $yy) * $w * 4)
                for ($xx = 0; $xx -lt $w; $xx++) {
                    $c = $bmp.GetPixel($xx, $yy)
                    $pos = $rowBase + $xx * 4
                    $data[$pos]     = $c.B
                    $data[$pos + 1] = $c.G
                    $data[$pos + 2] = $c.R
                    $data[$pos + 3] = $c.A
                }
            }
            # AND mask bytes stay zero (fully opaque icon)
            $dirItems.Add([byte[]]@($w, $h, 0, 0, 1, 0, 32, 0) + [BitConverter]::GetBytes([uint32]$data.Length) + [BitConverter]::GetBytes([uint32]$offset))
        }

        $entries.Add($data)
        $offset += $data.Length
        $bmp.Dispose()
    }
}
finally {
    $src.Dispose()
}

# Write ICO: ICONDIR + entries + data
$fs = [System.IO.File]::Create($OutIco)
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]$sizes.Count)
foreach ($d in $dirItems) { $bw.Write($d) }
foreach ($d in $entries)  { $bw.Write($d) }
$bw.Flush(); $bw.Dispose(); $fs.Dispose()

Write-Host "ICO written: $OutIco ($([math]::Round((Get-Item $OutIco).Length/1KB,1)) KB, $($sizes.Count) sizes)"
