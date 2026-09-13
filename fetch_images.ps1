$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Search-Pexels {
    param([string]$Query)
    $url = "https://www.pexels.com/search/$([uri]::EscapeDataString($Query))/"
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
        $matches = [regex]::Matches($response.Content, 'https://images.pexels.com/photos/\d+/pexels-photo-\d+\.jpeg')
        if ($matches.Count -gt 0) {
            return $matches[0].Value + "?auto=compress&cs=tinysrgb&w=800"
        }
    } catch {
        return "Error"
    }
    return "Not found"
}

Write-Host "PDF: " (Search-Pexels "pdf document reading")
Write-Host "WORD: " (Search-Pexels "typing document laptop")
Write-Host "WEB: " (Search-Pexels "reading website laptop")
Write-Host "PPT: " (Search-Pexels "presentation projector meeting")
