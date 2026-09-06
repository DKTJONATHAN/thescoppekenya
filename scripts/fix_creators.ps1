$ErrorActionPreference = "Stop"

# Only target the content creator files
$targetFiles = @(
    "za Entertainment.yml", "za ghafla.yml", "za mpasho.yml", "za-news.yml", 
    "za politics.yml", "za africa.yml", "za agriculture.yml", "za business.yml", 
    "za diano.yml", "za jaj.yml", "za lifestyle.yml", "za sports.yml", 
    "za technology.yml", "manyuo.yml", "automation.yml", "satirical-narrator.yml"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding $False
$newList = '["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.5-flash-lite", "gemini-3-flash-preview"]'

foreach ($fileName in $targetFiles) {
    $filePath = Join-Path -Path ".github\workflows" -ChildPath $fileName
    
    if (Test-Path $filePath) {
        $content = Get-Content -Path $filePath -Raw
        $original = $content

        $content = [System.Text.RegularExpressions.Regex]::Replace(
            $content, 
            'MODELS_TO_TRY\s*=\s*\[.*?\]', 
            "MODELS_TO_TRY = $newList", 
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )

        $content = [System.Text.RegularExpressions.Regex]::Replace(
            $content, 
            'MODELS\s*=\s*\[.*?\]', 
            "MODELS = $newList", 
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )

        $content = $content.Replace('gemini-2.0-flash', 'gemini-3.6-flash')
        $content = $content.Replace('gemini-2.5-pro', 'gemini-3.1-pro-preview')
        $content = $content.Replace('gemini-2.5-flash', 'gemini-3.8-flash')
        $content = $content.Replace('gemini-1.5-flash', 'gemini-3.5-flash-lite')
        $content = $content.Replace('gemini-1.5-pro', 'gemini-3.1-pro-preview')
        $content = $content.Replace('gemini-3-pro-preview', 'gemini-3.1-pro-preview')

        if ($content -cne $original) {
            Write-Host "Updated $fileName"
            [System.IO.File]::WriteAllText((Resolve-Path $filePath).Path, $content, $utf8NoBom)
        }
    } else {
        Write-Host "File not found: $fileName"
    }
}
Write-Host "All specified creator files processed."
