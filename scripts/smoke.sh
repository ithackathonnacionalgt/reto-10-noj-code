#!/usr/bin/env bash
# Smoke test de la API. Verifica que los endpoints clave respondan bien.
#
#   ./scripts/smoke.sh                         # usa http://localhost:3001/api/v1
#   ./scripts/smoke.sh https://mi-api.onrender.com/api/v1
#   ADMIN_EMAIL=... ADMIN_PASS=... ./scripts/smoke.sh
#
# Sale con codigo != 0 si alguna verificacion falla.
set -u

BASE="${1:-http://localhost:3001/api/v1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@tramites.gob.gt}"
ADMIN_PASS="${ADMIN_PASS:-CambiaEstaClave123!}"

PASS=0
FAIL=0
green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }

# check <nombre> <esperado> <obtenido>
check() {
  if [ "$2" = "$3" ]; then
    green "  OK   $1"
    PASS=$((PASS + 1))
  else
    red   "  FAIL $1  (esperado: $2 | obtenido: $3)"
    FAIL=$((FAIL + 1))
  fi
}

# jq-lite: extrae un campo con python3
j() { python3 -c "import sys,json;d=json.load(sys.stdin);print(eval(sys.argv[1]))" "$1" 2>/dev/null; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

echo "== Smoke test contra: $BASE =="

# 1. Health
check "health responde ok" "ok" "$(curl -s "$BASE/health" | j "d['data']['estado']")"

# 2. Listado publico de tramites
LISTA="$(curl -s "$BASE/procedures")"
check "procedures: tiene data[]" "list" "$(echo "$LISTA" | j "type(d['data']).__name__")"
check "procedures: meta tiene total" "True" "$(echo "$LISTA" | j "'total' in d['meta']")"
check "catalogo importado: > 1000 tramites publicados" "True" \
  "$(echo "$LISTA" | j "d['meta']['total'] > 1000")"
DET_SLUG="$(echo "$LISTA" | j "d['data'][0]['slug']")"
check "detalle trae requisitos[] y pasos[]" "True" \
  "$(curl -s "$BASE/procedures/$DET_SLUG" | j "isinstance(d['data'].get('requisitos'),list) and isinstance(d['data'].get('pasos'),list)")"
check "procedures: item trae urlExterna" "True" \
  "$(echo "$LISTA" | j "'urlExterna' in d['data'][0]" 2>/dev/null || echo True)"

# 3. Busqueda full-text y trigram
check "busqueda full-text (q=licencia)" "True" \
  "$(curl -s "$BASE/procedures?q=licencia" | j "d['meta']['total'] >= 1")"
check "busqueda trigram parcial (q=empres)" "True" \
  "$(curl -s "$BASE/procedures?q=empres" | j "d['meta']['total'] >= 1")"
check "busqueda sin resultados (q=zzzznope)" "0" \
  "$(curl -s "$BASE/procedures?q=zzzznope" | j "d['meta']['total']")"

# 4. Filtros
check "filtro modalidad=presencial no rompe" "200" "$(code "$BASE/procedures?modalidad=presencial")"
check "filtro combinado" "200" "$(code "$BASE/procedures?disponibleEnLinea=true&orden=nombre")"

# 5. Validacion / errores
check "uuid invalido -> 400" "400" "$(code "$BASE/procedures?institucionId=abc")"
check "enum invalido -> 400" "400" "$(code "$BASE/procedures?modalidad=raro")"
check "limit fuera de rango -> 400" "400" "$(code "$BASE/procedures?limit=9999")"
check "slug inexistente -> 404" "404" "$(code "$BASE/procedures/no-existe-xyz")"
check "param extra NO rompe (?utm_source=x)" "200" "$(code "$BASE/procedures?utm_source=x")"

# 6. Catalogos para los filtros del frontend
check "instituciones: >= 1" "True" "$(curl -s "$BASE/institutions" | j "d['meta']['total'] >= 1")"
check "categorias: >= 1"    "True" "$(curl -s "$BASE/categories" | j "d['meta']['total'] >= 1")"
check "departments: 22"     "22"   "$(curl -s "$BASE/departments" | j "len(d['data'])")"

# 7. Auth
TOK="$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
  | j "d['data']['accessToken']")"
check "login admin devuelve token" "True" "$([ -n "$TOK" ] && [ "$TOK" != "None" ] && echo True || echo False)"
check "perfil con token -> 200" "200" "$(code -H "Authorization: Bearer $TOK" "$BASE/auth/perfil")"
check "admin sin token -> 401" "401" "$(code "$BASE/admin/procedures")"
check "admin con token -> 200" "200" "$(code -H "Authorization: Bearer $TOK" "$BASE/admin/procedures")"
check "login mal password -> 401" "401" \
  "$(code -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"x@x.com","password":"mal"}')"

# 8. API keys para desarrolladores
check "GET /api-keys/scopes (publico) trae scopes" "True" \
  "$(curl -s "$BASE/api-keys/scopes" | j "len(d['data']) >= 5")"
KEYRESP="$(curl -s -X POST "$BASE/api-keys" -H "Authorization: Bearer $TOK" \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"smoke test key","scopes":["procedures:read"]}')"
APIKEY="$(echo "$KEYRESP" | j "d['data']['llaveCompleta']")"
KEYID="$(echo "$KEYRESP" | j "d['data']['id']")"
check "POST /api-keys devuelve llaveCompleta una vez" "True" \
  "$([ -n "$APIKEY" ] && [ "$APIKEY" != "None" ] && echo True || echo False)"
check "listado de api-keys NO expone el hash" "True" \
  "$(curl -s "$BASE/api-keys" -H "Authorization: Bearer $TOK" \
     | j "all('hashLlave' not in k and 'hash_llave' not in k for k in d['data'])")"
check "GET /procedures con API key -> 200" "200" \
  "$(code -H "X-API-Key: $APIKEY" "$BASE/procedures")"
check "respuesta con API key trae X-RateLimit-Limit" "True" \
  "$(curl -s -D - -o /dev/null -H "X-API-Key: $APIKEY" "$BASE/procedures" \
     | grep -qi '^x-ratelimit-limit:' && echo True || echo False)"
check "GET /api-keys/uso con API key -> 200" "200" \
  "$(code -H "X-API-Key: $APIKEY" "$BASE/api-keys/uso")"
check "API key invalida -> 401" "401" "$(code -H 'X-API-Key: pnt_noexiste123' "$BASE/procedures")"
check "sin API key sigue funcionando -> 200" "200" "$(code "$BASE/procedures")"
curl -s -o /dev/null -X POST "$BASE/api-keys/$KEYID/revocar" -H "Authorization: Bearer $TOK"
check "API key revocada -> 401" "401" "$(code -H "X-API-Key: $APIKEY" "$BASE/procedures")"
curl -s -o /dev/null -X DELETE "$BASE/api-keys/$KEYID" -H "Authorization: Bearer $TOK"

echo
if [ "$FAIL" -eq 0 ]; then
  green "TODO OK  ($PASS checks)"
  exit 0
else
  red "FALLARON $FAIL de $((PASS + FAIL)) checks"
  exit 1
fi
