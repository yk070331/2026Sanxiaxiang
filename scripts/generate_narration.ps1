param(
  [Parameter(Mandatory=$true)][string]$FfmpegPath,
  [Parameter(Mandatory=$true)][string]$WaveDirectory,
  [string]$VoiceName = 'Microsoft Huihui Desktop'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$projectRoot = Split-Path $PSScriptRoot -Parent
$audioDirectory = Join-Path $projectRoot 'miniprogram/audio'
New-Item -ItemType Directory -Force -Path $audioDirectory,$WaveDirectory | Out-Null
$scriptModule = Get-Content -LiteralPath (Join-Path $projectRoot 'miniprogram/utils/narrationScripts.js') -Raw -Encoding UTF8
$scripts = ($scriptModule -replace '^module\.exports\s*=\s*', '' -replace ';\s*$', '') | ConvertFrom-Json
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $synth.SelectVoice($VoiceName)
  $synth.Rate = -1
  $synth.Volume = 100
  foreach ($item in $scripts) {
    if ($item.id -notmatch '^story_[1-6]$') { throw 'Unexpected story id' }
    $wavePath = Join-Path $WaveDirectory ($item.id + '.wav')
    $mp3Path = Join-Path $audioDirectory ($item.id + '.mp3')
    $synth.SetOutputToWaveFile($wavePath)
    $synth.Speak($item.text)
    $synth.SetOutputToNull()
    & $FfmpegPath -hide_banner -loglevel error -y -i $wavePath -ac 1 -ar 22050 -codec:a libmp3lame -b:a 24k -metadata 'artist=AI synthetic guide (Microsoft Huihui Desktop)' -metadata 'comment=AI-generated narration; not an oral history recording' $mp3Path
    if ($LASTEXITCODE -ne 0) { throw "MP3 encoding failed: $($item.id)" }
    Write-Output "$($item.id): $((Get-Item -LiteralPath $mp3Path).Length) bytes"
  }
} finally { $synth.Dispose() }
