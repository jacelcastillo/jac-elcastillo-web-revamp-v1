#!/usr/bin/env bash
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
slug=jac-el-castillo-web
destino="$raiz/dist/$slug.zip"

mkdir -p "$raiz/dist"
rm -f "$destino"
cd "$raiz/wordpress"
zip -rq "$destino" "$slug" -x '*.DS_Store'
echo "$destino"
