$ErrorActionPreference = "Stop"

$workflowsDir = ".github\workflows"
$ymlFiles = Get-ChildItem -Path $workflowsDir -Filter "*.yml"

$utf8NoBom = New-Object System.Text.UTF8Encoding $False

foreach ($file in $ymlFiles) {
    # Read as bytes to avoid any decoding issues
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    
    # Check for BOM (EF BB BF)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        Write-Host "Removing BOM from $($file.Name)"
        $bytes = $bytes[3..($bytes.Length-1)]
    }

    $content = [System.Text.Encoding]::UTF8.GetString($bytes)
    $original = $content

    # Fix emojis using hex sequences that represent the corrupted UTF-8 patterns
    # ðŸ“° is 0xC3 0xB0 0xC5 0xB8 0xE2 0u20ac 0u201c 0xC2 0xB0... no wait.
    
    # Let's try simple string replacement for the most common ones
    # Since I'm writing this script to a file, the literals might still be risky.
    # I'll use the [char] approach for the target strings.
    
    # ðŸ“° is often seen when UTF-8 bytes are read as Windows-1252
    # ð: 0xF0, Ÿ: 0x9F, “: 0x93, °: 0xB0
    # In Windows-1252: ð=0xF0, Ÿ=0x9F (invalid?), “=0x93, °=0xB0
    
    # Actually, I'll just use the literal strings but I'll escape them or use a different method.
    
    $reps = @(
        @{ find = "ðŸ“°"; replace = "📰" },
        @{ find = "ðŸš€"; replace = "🚀" },
        @{ find = "ðŸ ›ï¸ "; replace = "🏛️" },
        @{ find = "ðŸŽ­"; replace = "🎭" },
        @{ find = "ðŸ’¼"; replace = "💼" },
        @{ find = "ðŸŒ¾"; replace = "🌾" },
        @{ find = "ðŸ †"; replace = "🏆" }
    )

    foreach ($r in $reps) {
        $content = $content.Replace($r.find, $r.replace)
    }

    if ($content -cne $original) {
        Write-Host "Fixed emojis in $($file.Name)"
    }
    
    # Write back as UTF-8 No BOM
    [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
}
Write-Host "Done."
