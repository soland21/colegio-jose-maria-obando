
$ErrorActionPreference = 'Stop'

$envFile = Join-Path $PSScriptRoot '.env.local'

if (-not (Test-Path -LiteralPath $envFile)) {
    $example = Join-Path $PSScriptRoot '.env.local.example'

    # Generar una clave JWT aleatoria y segura
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

    try {
        $secretBytes = New-Object byte[] 32
        $rng.GetBytes($secretBytes)
        $jwtSecret = [Convert]::ToBase64String($secretBytes)
    }
    finally {
        $rng.Dispose()
    }

    # Crear la configuración local
    (Get-Content -LiteralPath $example -Raw).Replace(
        'REEMPLAZA_POR_UNA_CLAVE_BASE64_DE_32_BYTES',
        $jwtSecret
    ) | Set-Content -LiteralPath $envFile -Encoding utf8
}

# Cargar las variables de entorno
Get-Content -LiteralPath $envFile | ForEach-Object {
    $line = $_.Trim()

    if ($line -and -not $line.StartsWith('#')) {
        $pair = $line -split '=', 2

        if ($pair.Count -eq 2) {
            [Environment]::SetEnvironmentVariable(
                $pair[0].Trim(),
                $pair[1].Trim(),
                'Process'
            )
        }
    }
}

# Comprobar que exista la clave JWT
if (-not $env:JWT_SECRET) {
    throw 'Falta JWT_SECRET en backend/.env.local.'
}

# Iniciar Spring Boot
Set-Location -LiteralPath $PSScriptRoot

if (Get-Command mvn -ErrorAction SilentlyContinue) {
    mvn spring-boot:run
} else {
    $backendJar = Join-Path $PSScriptRoot 'target\colegio-backend-0.0.1-SNAPSHOT.jar'
    if (-not (Test-Path -LiteralPath $backendJar)) {
        throw 'No se encontró Maven ni el backend compilado. Instala Maven o compila el proyecto con mvn package.'
    }
    $java = Get-Command java -ErrorAction SilentlyContinue
    $javaPath = if ($java) { $java.Source } else { $null }
    if (-not $javaPath) {
        $javaCandidates = @(Get-ChildItem 'C:\Program Files\Eclipse Adoptium\jdk-17*\bin\java.exe' -ErrorAction SilentlyContinue)
        if ($javaCandidates.Count -gt 0) { $javaPath = $javaCandidates[0].FullName }
    }
    if (-not $javaPath) {
        throw 'No se encontró Java 17+. Instala Java o agrégalo al PATH.'
    }
    & $javaPath -jar $backendJar
}
