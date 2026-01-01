#!/bin/bash
echo "正在查询使用统计..."
http_proxy= https_proxy= curl -s \
  -H "x-admin-token: 2026lyan9e6r77rhegiueegegidpd-ehdye" \
  http://127.0.0.1:8080/api/admin/usage
echo ""
