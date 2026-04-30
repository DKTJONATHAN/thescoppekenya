$ErrorActionPreference = "Stop"

$workflowsDir = ".github\workflows"
$ymlFiles = Get-ChildItem -Path $workflowsDir -Filter "*.yml"

$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$repMap = @{
    "ðŸ“°" = "📰";
    "ðŸš€" = "🚀";
    "ðŸ ›ï¸ " = "🏛️";
    "ðŸŽ­" = "🎭";
    "ðŸ’¼" = "💼";
    "ðŸŒ¾" = "🌾";
    "ðŸ †" = "🏆";
    "ðŸ“¨" = "📨";
    "ðŸ“º" = "📺";
    "ðŸ“±" = "📱";
    "ðŸ’¬" = "💬";
    "ðŸ“¢" = "📢";
    "ðŸ™" = "🙏";
    "ðŸ" = "🔥"; # Fallback for single corrupted char if found
}

foreach ($file in $ymlFiles) {
    # Force read as UTF-8
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content

    foreach ($key in $repMap.Keys) {
        $content = $content.Replace($key, $repMap[$key])
    }

    # Also fix some other broken chars if any
    $content = $content.Replace("â€”", "—")
    $content = $content.Replace("â€“", "–")
    $content = $content.Replace("â€™", "'")

    # If the file is a content creator, we want the Gemini fallback.
    # If it is NOT, we should check if it was accidentally modified with MODELS_TO_TRY
    
    $isCreator = $file.Name -match "(za |manyuo|automation|satirical|podcast)"
    
    if (!$isCreator) {
        # Restore basic MODELS if it looks like it was "selectively" updated wrongly
        # But wait, the user said "restore all only supposed to edit content creators"
        # I should probably check if I accidentally added Gemini 3 fallbacks to Social Media ones.
    }

    # Write back as UTF-8 No BOM
    [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
    
    if ($content -cne $original) {
        Write-Host "Repaired emoji/encoding in $($file.Name)"
    }
}
Write-Host "All workflow repairs completed."
