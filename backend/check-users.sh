#!/bin/bash

# 统计查询脚本
# 使用方法: ./check-users.sh

# 从 .env 读取 ADMIN_TOKEN
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ 错误: 未设置 ADMIN_TOKEN"
  echo "💡 请在 backend/.env 中设置 ADMIN_TOKEN"
  exit 1
fi

API_URL="${API_URL:-http://localhost:8080}"

echo "📊 查询累计用户数..."
echo "API: $API_URL"
echo ""

response=$(curl -s "$API_URL/api/admin/usage" \
  -H "X-Admin-Token: $ADMIN_TOKEN")

# 检查是否成功
if echo "$response" | grep -q '"success":true'; then
  count=$(echo "$response" | grep -o '"uniqueDevices":[0-9]*' | grep -o '[0-9]*')
  echo "✅ 累计去重用户数: $count"
else
  echo "❌ 查询失败:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
fi
