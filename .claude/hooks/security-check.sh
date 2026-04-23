#!/usr/bin/env bash
# Git 커밋 전 보안 검사 훅

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# git commit 명령이 아니면 통과
if ! echo "$COMMAND" | grep -qE 'git[[:space:]]+commit'; then
  exit 0
fi

STAGED=$(git diff --cached --name-only 2>/dev/null)
if [ -z "$STAGED" ]; then
  exit 0
fi

ISSUES=()

# ── 민감한 파일명 차단 ──────────────────────────────────────
SENSITIVE_NAME_RE='(^|/)\.env(\.[^.]+)*$|\.pem$|\.key$|\.p12$|\.pfx$|(^|/)(id_rsa|id_dsa|id_ecdsa|id_ed25519)$|(^|/)aws_credentials$|credentials\.json$|serviceaccount\.json$'

while IFS= read -r file; do
  if echo "$file" | grep -qiE "$SENSITIVE_NAME_RE"; then
    if ! echo "$file" | grep -qi '\.example$'; then
      ISSUES+=("민감한 파일명: $file")
    fi
  fi
done <<< "$STAGED"

# ── 시크릿 콘텐츠 패턴 차단 ────────────────────────────────
SKIP_EXT_RE='\.(png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|lock|example|md)$'

check_diff() {
  local label="$1"
  local opts="$2"
  local pattern="$3"
  local file="$4"
  local diff="$5"
  if echo "$diff" | grep -q${opts}E "^\+.*${pattern}"; then
    ISSUES+=("${label}: $file")
    return 0
  fi
  return 1
}

while IFS= read -r file; do
  if echo "$file" | grep -qiE "$SKIP_EXT_RE"; then
    continue
  fi

  DIFF=$(git diff --cached -- "$file" 2>/dev/null)
  FOUND=0

  check_diff "AWS Access Key"       ""  'AKIA[0-9A-Z]{16}'                                              "$file" "$DIFF" && FOUND=1
  [ $FOUND -eq 0 ] && check_diff "AWS Secret Key"  "i" 'aws_secret_access_key[[:space:]]*[=:][[:space:]]*[A-Za-z0-9/+]{20,}'  "$file" "$DIFF" && FOUND=1
  [ $FOUND -eq 0 ] && check_diff "OpenAI Key"      ""  'sk-[a-zA-Z0-9]{32,}'                                                  "$file" "$DIFF" && FOUND=1
  [ $FOUND -eq 0 ] && check_diff "GitHub Token"    ""  'gh[ps]_[a-zA-Z0-9]{36}'                                               "$file" "$DIFF" && FOUND=1
  [ $FOUND -eq 0 ] && check_diff "Private Key"     ""  '-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----'                     "$file" "$DIFF" && FOUND=1
  [ $FOUND -eq 0 ] && check_diff "MongoDB 인증 URI" ""  'mongodb(\+srv)?://[^:[:space:]]+:[^@[:space:]]{4,}@'                  "$file" "$DIFF" && FOUND=1
  [ $FOUND -eq 0 ] && check_diff "Hardcoded 비밀번호" "i" '(password|passwd|pwd)[[:space:]]*[:=][[:space:]]*["'"'"'][^[:space:]"'"'"']{6,}'  "$file" "$DIFF" && FOUND=1
  [ $FOUND -eq 0 ] && check_diff "Hardcoded 시크릿"   "i" '(secret|api_key)[[:space:]]*[:=][[:space:]]*["'"'"'][^[:space:]"'"'"']{8,}'       "$file" "$DIFF"

done <<< "$STAGED"

# ── 결과 출력 ────────────────────────────────────────────────
if [ ${#ISSUES[@]} -gt 0 ]; then
  ISSUE_TEXT=""
  for issue in "${ISSUES[@]}"; do
    ISSUE_TEXT+="  • $issue\n"
  done

  printf '%b' "보안 검사 실패 — 커밋이 차단되었습니다.\n\n${ISSUE_TEXT}\n문제를 해결한 뒤 다시 커밋하세요." \
    | jq -Rs '{"continue": false, "stopReason": .}'
fi

exit 0
