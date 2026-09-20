param(
  [Parameter(Mandatory=$true)][string]$SourceDirectory,
  [Parameter(Mandatory=$true)][string]$ArchiveDirectory
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path $PSScriptRoot -Parent
$outputDirectory = Join-Path $repoRoot 'miniprogram/contributions/images'
$thumbnailDirectory = Join-Path $repoRoot 'miniprogram/images/contributed'
New-Item -ItemType Directory -Force -Path $outputDirectory,$thumbnailDirectory,$ArchiveDirectory | Out-Null
$items = @(
  @('0e9945e3cef7fd983a39a3ad69eeb9ac.jpg','huangyangjie_inscription'),
  @('8dcc40ac73a8fa6b751aa2f3a55d464f.jpg','huangyangjie_poem'),
  @('a65f8b27463131a0ee9f47f2d5a3fb01.jpg','huangyangjie_monument'),
  @('893052a10d5fc965853a3d2da6413401.jpg','well_inscription'),
  @('db01df6a38b79955ee8ce5e516680f80.jpg','rural_slogan'),
  @('b22af1b68134b2d2881d85ee6264a8d1.png','forest_steps'),
  @('3adb106b04e16f137d08482f60b553b9.png','bamboo_path'),
  @('3478367d95355fd424245066a895524f.png','bamboo_canopy'),
  @('65c21e69130828efbe264d106cda255d.jpg','terraces'),
  @('5d212928df16e0c6e7e10ad3c0624aba.jpg','qiaolin_branch_interior'),
  @('330cdd1fbff00b54c7acae70cda6b847.jpg','qiaolin_branch_sign'),
  @('4dfac933544f57cf2c1bbea7d6d7686c.jpg','reservoir'),
  @('2fd7b9e0d6ccd21490e97d107850d9a5.jpg','aerial_village')
)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$records = @()
foreach ($item in $items) {
  $source = Join-Path $SourceDirectory $item[0]
  $archive = Join-Path $ArchiveDirectory $item[0]
  if (-not (Test-Path -LiteralPath $archive)) { Copy-Item -LiteralPath $source -Destination $archive }
  $original = [System.Drawing.Image]::FromFile($source)
  try {
    $edge = 1100
    $quality = 82
    do {
      $scale = [Math]::Min([double]1.0, [double]$edge / [Math]::Max($original.Width, $original.Height))
      $width = [int][Math]::Round($original.Width * $scale)
      $height = [int][Math]::Round($original.Height * $scale)
      $bitmap = New-Object System.Drawing.Bitmap($width,$height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $stream = New-Object System.IO.MemoryStream
      $parameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
      try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($original, 0, 0, $width, $height)
        $parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
        $bitmap.Save($stream, $codec, $parameters)
        $bytes = $stream.ToArray()
      } finally { $parameters.Dispose(); $stream.Dispose(); $graphics.Dispose(); $bitmap.Dispose() }
      if ($bytes.Length -le 180KB) { break }
      if ($quality -gt 52) { $quality -= 6 } else { $edge = [int]($edge * 0.85) }
    } while ($edge -ge 600)
    if ($bytes.Length -gt 180KB) { throw "Unable to fit image: $($item[0])" }
    $destination = Join-Path $outputDirectory ($item[1] + '.jpg')
    [System.IO.File]::WriteAllBytes($destination, $bytes)
    $thumbnailScale = [Math]::Min([double]1.0, [double]360 / [Math]::Max($original.Width, $original.Height))
    $thumbnail = New-Object System.Drawing.Bitmap([int][Math]::Round($original.Width * $thumbnailScale),[int][Math]::Round($original.Height * $thumbnailScale))
    $thumbGraphics = [System.Drawing.Graphics]::FromImage($thumbnail)
    $thumbParameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $thumbnailPath = Join-Path $thumbnailDirectory ($item[1] + '.jpg')
    try {
      $thumbGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $thumbGraphics.DrawImage($original,0,0,$thumbnail.Width,$thumbnail.Height)
      $thumbParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[long]72)
      $thumbnail.Save($thumbnailPath,$codec,$thumbParameters)
    } finally { $thumbParameters.Dispose(); $thumbGraphics.Dispose(); $thumbnail.Dispose() }
    $records += [ordered]@{
      id = $item[1]; receivedDate = '2026-09-20'; originalFile = $item[0]
      originalSha256 = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
      originalBytes = (Get-Item -LiteralPath $source).Length
      outputPath = "miniprogram/contributions/images/$($item[1]).jpg"
      sha256 = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
      bytes = $bytes.Length; width = $width; height = $height; jpegQuality = $quality
      thumbnailPath = "miniprogram/images/contributed/$($item[1]).jpg"
      thumbnailSha256 = (Get-FileHash -LiteralPath $thumbnailPath -Algorithm SHA256).Hash.ToLowerInvariant()
      processing = '等比例缩小与JPEG编码；未裁切、修复、补绘或修改题字。'
    }
    Write-Output "$($item[1]): $width x $height, $($bytes.Length) bytes"
  } finally { $original.Dispose() }
}
$recordPath = Join-Path $repoRoot '参赛材料/用户补充照片记录.json'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($recordPath, ($records | ConvertTo-Json -Depth 5), $utf8)
