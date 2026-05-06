#!/usr/bin/env bash
set -euo pipefail

COMPARTMENT_ID="ocid1.compartment.oc1..aaaaaaaanutpaz4n5bmahwavf5mkbs4vsdpc3eisjb4prt2uubt5dry7ozya"
CLUSTER_ID="ocid1.cluster.oc1.ap-chuncheon-1.aaaaaaaa55n4r2psb7y2j46agsng53p3jtatmfrjqhlt7d2enc5pqnu4mrba"
KEEP_ID="ocid1.nodepool.oc1.ap-chuncheon-1.aaaaaaaa4f7ry3bfqncsukqkjhgzl3j3uxfyai3ffyis6nbx3ntbjrgnmmqa"

if [[ -z "${COMPARTMENT_ID:-}" || -z "${CLUSTER_ID:-}" ]]; then
  echo "오류: COMPARTMENT_ID 또는 CLUSTER_ID 환경변수가 설정되지 않았습니다."
  exit 1
fi

echo "노드풀 목록 조회 중..."
ALL_IDS=$(oci ce node-pool list \
  --compartment-id "$COMPARTMENT_ID" \
  --cluster-id "$CLUSTER_ID" \
  --query 'data[].id' \
  --raw-output)

TOTAL=$(echo "$ALL_IDS" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
echo "총 ${TOTAL}개 노드풀 발견"
echo "유지: ${KEEP_ID}"
echo ""

python3 -c "
import json, subprocess

keep_id = '${KEEP_ID}'
ids = json.loads('''${ALL_IDS}''')
to_delete = [i for i in ids if i != keep_id]

print(f'{len(to_delete)}개 삭제 시작...\n')

for idx, node_id in enumerate(to_delete, 1):
    print(f'[{idx}/{len(to_delete)}] 삭제: ...{node_id[-30:]}')
    result = subprocess.run(
        ['oci', 'ce', 'node-pool', 'delete', '--node-pool-id', node_id, '--force'],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f'  경고: {result.stderr.strip()[:100]}')

print('\n삭제 요청 완료. 실제 삭제까지 수분 소요될 수 있습니다.')
"
