# Drasa AI - SVG to WebP Converter
# Requires ImageMagick to be installed

Write-Host "🚀 Drasa AI Asset Converter" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if ImageMagick is installed
try {
    $magickVersion = magick --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Host "✅ ImageMagick found" -ForegroundColor Green
} catch {
    Write-Host "❌ ImageMagick not found!" -ForegroundColor Red
    Write-Host "📥 Please install from: https://imagemagick.org/script/download.php" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "📂 Converting SVG files to WebP..." -ForegroundColor Yellow
Write-Host ""

$conversions = @(
    @{ Input = "icons\logo.svg"; Output = "images\logo.webp"; Size = 128 },
    @{ Input = "icons\welcome-icon.svg"; Output = "images\welcome-icon.webp"; Size = 240 },
    @{ Input = "icons\user-avatar.svg"; Output = "images\user-avatar.webp"; Size = 72 },
    @{ Input = "icons\ai-avatar.svg"; Output = "images\ai-avatar.webp"; Size = 72 },
    @{ Input = "icons\space.svg"; Output = "images\space.webp"; Size = 120 },
    @{ Input = "icons\creative.svg"; Output = "images\creative.webp"; Size = 120 },
    @{ Input = "icons\learn.svg"; Output = "images\learn.webp"; Size = 120 },
    @{ Input = "icons\coding.svg"; Output = "images\coding.webp"; Size = 120 }
)

$successCount = 0
$failCount = 0

foreach ($item in $conversions) {
    $inputFile = $item.Input
    $outputFile = $item.Output
    $size = $item.Size
    
    if (Test-Path $inputFile) {
        try {
            magick $inputFile -resize "${size}x${size}" -quality 90 $outputFile
            if ($LASTEXITCODE -eq 0) {
                $fileSize = [math]::Round((Get-Item $outputFile).Length / 1KB, 2)
                Write-Host "✅ $(Split-Path $inputFile -Leaf) → $(Split-Path $outputFile -Leaf) ($fileSize KB)" -ForegroundColor Green
                $successCount++
            } else {
                throw "Conversion failed"
            }
        } catch {
            Write-Host "❌ Failed to convert $(Split-Path $inputFile -Leaf)" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host "⚠️  File not found: $inputFile" -ForegroundColor Yellow
        $failCount++
    }
}

Write-Host ""
Write-Host "🎉 Conversion Complete!" -ForegroundColor Cyan
Write-Host "   ✅ Success: $successCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "   ❌ Failed: $failCount" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
