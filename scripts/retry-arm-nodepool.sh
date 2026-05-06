#!/bin/bash
# ARM A1.Flex 노드 풀 생성 재시도 스크립트
# Out of capacity 에러가 풀릴 때까지 5분마다 재시도

COMPARTMENT_ID="ocid1.compartment.oc1..aaaaaaaanutpaz4n5bmahwavf5mkbs4vsdpc3eisjb4prt2uubt5dry7ozya"
CLUSTER_ID="ocid1.cluster.oc1.ap-chuncheon-1.aaaaaaaa55n4r2psb7y2j46agsng53p3jtatmfrjqhlt7d2enc5pqnu4mrba"
IMAGE_ID="ocid1.image.oc1.ap-chuncheon-1.aaaaaaaa67kzdzeksbi4qevtvheft36ph3j2y7m2vjymtnewzkj4dqlwsxba"
SUBNET_ID="ocid1.subnet.oc1.ap-chuncheon-1.aaaaaaaaonjo3bf65pm4buoqnldn4jkpegpsrumqwq5zccqgxmnwrovqegeq"
AVAILABILITY_DOMAIN="hFZW:AP-CHUNCHEON-1-AD-1"
K8S_VERSION="v1.35.2"

ATTEMPT=0
while true; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "[$(date +%H:%M:%S)] 시도 #$ATTEMPT 시작..."

  RESULT=$(oci ce node-pool create \
    --compartment-id "$COMPARTMENT_ID" \
    --cluster-id "$CLUSTER_ID" \
    --name "cergy-node-pool" \
    --kubernetes-version "$K8S_VERSION" \
    --node-shape "VM.Standard.A1.Flex" \
    --node-shape-config '{"ocpus":2,"memoryInGBs":12}' \
    --node-source-details "{\"sourceType\":\"IMAGE\",\"imageId\":\"$IMAGE_ID\"}" \
    --size 2 \
    --placement-configs "[{\"availabilityDomain\":\"$AVAILABILITY_DOMAIN\",\"subnetId\":\"$SUBNET_ID\"}]" \
    --wait-for-state SUCCEEDED \
    --wait-for-state FAILED \
    2>&1)

  if echo "$RESULT" | grep -q '"status": "SUCCEEDED"'; then
    echo "✅ 성공! ARM 노드 풀 생성 완료"
    echo "$RESULT"
    break
  fi

  echo "[$(date +%H:%M:%S)] 실패. 5분 후 재시도합니다..."
  echo "----- 마지막 응답 (요약) -----"
  echo "$RESULT" | tail -20
  echo "------------------------------"
  sleep 300
done
