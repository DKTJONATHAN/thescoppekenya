$ErrorActionPreference = "Stop"

$workflowsDir = ".github\workflows"
$ymlFiles = Get-ChildItem -Path $workflowsDir -Filter "*.yml"

$utf8NoBom = New-Object System.Text.UTF8Encoding $False

foreach ($file in $ymlFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $original = $content
    
    # Example Target: .get('description', '')[:160]
    # We replace any slice [:160], [:155] or [:145] with nothing, or just change it to a safer length.
    # Actually, let's just regex replace `\[:1[4-6][0-9]\]` with `` only if it's attached to `get('description'` or `get('excerpt'`
    
    $content = [System.Text.RegularExpressions.Regex]::Replace(
        $content, 
        "\.get\('description',\s*''\)\[:\d+\]", 
        ".get('description', '')"
    )

    if ($content -cne $original) {
        Write-Host "Updated $($file.Name)"
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
    }
}
Write-Host "All description slicing removed."
