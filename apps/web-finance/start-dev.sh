#!/bin/bash

echo "启动 TokenRecords 财务管理系统开发服务器..."
echo "=================================="
echo ""
echo "切换到项目目录..."
cd /Users/hahaha/TokenRecords-Vben/apps/web-finance

echo "当前目录: $(pwd)"
echo ""
echo "启动开发服务器..."
echo "访问地址: http://localhost:5666/"
echo "用户名: vben"
echo "密码: 123456"
echo ""
echo "=================================="
echo ""

# 启动开发服务器
pnpm dev