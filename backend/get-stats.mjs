#!/usr/bin/env node

const url = 'http://127.0.0.1:8080/api/admin/usage';
const token = '2026lyan9e6r77rhegiueegegidpd-ehdye';

fetch(url, {
  headers: { 'x-admin-token': token },
  signal: AbortSignal.timeout(5000)
})
  .then(res => res.json())
  .then(data => {
    console.log('\n📊 使用统计');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log('独立设备数:', data.data.uniqueDevices);
    console.log('━━━━━━━━━━━━━━━━━━━━━━\n');
  })
  .catch(err => console.error('❌ 错误:', err.message));
