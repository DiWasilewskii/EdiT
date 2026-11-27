# Збирає малюнки Тайгера з img/tiger/*.svg у js/tiger-art.js.
#
# Навіщо: щоб Тайгер рухався (кліпав, водив очима за курсором, махав лапою),
# SVG має бути вбудований у сторінку, а не підключений як <img>. Файл js/tiger-art.js
# працює навіть коли сайт відкрито подвійним кліком по index.html (без сервера).
#
# Як запускати після зміни будь-якого img/tiger/*.svg (з кореня репозиторію):
#   powershell -ExecutionPolicy Bypass -File tools/build-tiger.ps1
#
# Що робить: <g id="назва"> → <g class="t-назва"> (за цими класами працюють
# анімації в css/style.css), прибирає решту id і коментарі, стискає в один рядок.
# Важливо: групи eye-l/eye-r і pupil-l/pupil-r потрібні для очей — не видаляйте їх у Figma.

$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$poses = 'hello', 'happy', 'oops', 'think', 'tip'

$out = New-Object System.Text.StringBuilder
[void]$out.Append("/* Згенеровано tools/build-tiger.ps1 з img/tiger/*.svg. Не редагуйте вручну. */`n")
[void]$out.Append("window.TIGER_ART = {`n")

foreach ($pose in $poses) {
  $svg = [IO.File]::ReadAllText((Join-Path $root "img/tiger/$pose.svg"), $utf8)
  $svg = [regex]::Replace($svg, '<!--[\s\S]*?-->', '')
  $svg = $svg -replace '<g id="Generated illustration">', '<g class="t-body">'
  $svg = [regex]::Replace($svg, '<g id="([\w-]+)">', '<g class="t-$1">')
  $svg = [regex]::Replace($svg, '\s+id="[^"]*"', '')
  $svg = [regex]::Replace($svg, '<svg\s+width="\d+"\s+height="\d+"',
    "<svg class=""tiger-svg t-pose-$pose"" aria-hidden=""true"" focusable=""false""")
  $svg = [regex]::Replace($svg, '>\s+<', '><').Trim()
  $svg = $svg -replace "'", "\'"
  [void]$out.Append("  $pose`: '$svg',`n")
}
[void]$out.Append("};`n")

[IO.File]::WriteAllText((Join-Path $root 'js/tiger-art.js'), $out.ToString(), $utf8)
Write-Output "js/tiger-art.js: $($poses.Count) poses"
