#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 website/ 下的站点文件部署到 ECS 服务器。

凭据不写在代码里，从同目录的 .env 读取（.env 已被 .gitignore 忽略，切勿提交）。
先复制 .env.example 为 .env 并填入真实值。

用法：
    python deploy.py              # 按白名单上传全部文件
    python deploy.py index.html   # 只上传指定文件（相对 website/ 的路径）
"""
import io
import os
import sys
from pathlib import Path

try:
    import paramiko
    from scp import SCPClient
except ImportError:
    sys.exit("缺少依赖，请先执行：pip install paramiko scp")

# Windows 控制台 GBK 兼容
if sys.stdout.encoding and sys.stdout.encoding.upper() in ("GBK", "GB2312", "CP936"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).parent.resolve()
WEBSITE = ROOT / "website"

# 需要上传的文件（相对 website/）—— 图片/视频/PDF 走 OSS，不在这里
TO_UPLOAD = [
    # 页面
    "index.html", "courses.html", "gallery.html",
    "library.html", "verify.html", "contact.html", "apply.html",
    # 搜索引擎 / AI 爬虫
    "robots.txt", "sitemap.xml",
    "llms.txt", "llms-full.txt",
    ".well-known/ai.txt",
    "ai/summary.json", "ai/faq.json",
    # 样式与脚本
    "css/style.css", "js/main.js",
]


def load_env():
    path = ROOT / ".env"
    if not path.exists():
        sys.exit(f"未找到 {path}\n请先复制 .env.example 为 .env 并填入真实值。")
    cfg = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        cfg[k.strip()] = v.strip().strip('"').strip("'")
    return cfg


def main():
    cfg = load_env()
    host = cfg.get("ECS_HOST")
    port = int(cfg.get("ECS_PORT", "22"))
    user = cfg.get("ECS_USER")
    password = cfg.get("ECS_PASSWORD")
    remote = cfg.get("ECS_REMOTE_DIR")
    if not all([host, user, password, remote]):
        sys.exit(".env 缺少必要字段：ECS_HOST / ECS_USER / ECS_PASSWORD / ECS_REMOTE_DIR")

    targets = sys.argv[1:] or TO_UPLOAD
    for rel in targets:
        if not (WEBSITE / rel).exists():
            sys.exit(f"本地文件不存在：website/{rel}")

    print(f"目标 {user}@{host}:{remote}")
    print(f"待上传 {len(targets)} 个文件\n")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port, user, password, timeout=15)
    print("SSH 已连接")

    # 上传前记录远端 MD5，便于核对
    _, out, _ = ssh.exec_command(f"cd {remote} && md5sum {' '.join(targets)} 2>/dev/null")
    print("\n--- 上传前远端 ---")
    print(out.read().decode("utf-8", "replace").strip())

    with SCPClient(ssh.get_transport()) as scp:
        for rel in targets:
            local_file = WEBSITE / rel
            remote_file = f"{remote}/{rel}"
            ssh.exec_command(f"mkdir -p {'/'.join(remote_file.split('/')[:-1])}")
            scp.put(str(local_file), remote_file)
            print(f"  已上传 {rel}  ({local_file.stat().st_size} bytes)")

    _, out, _ = ssh.exec_command(f"cd {remote} && md5sum {' '.join(targets)} 2>/dev/null")
    print("\n--- 上传后远端 ---")
    print(out.read().decode("utf-8", "replace").strip())

    # 与本地对照
    import hashlib
    print("\n--- 本地 MD5（应与上面一致）---")
    for rel in targets:
        h = hashlib.md5((WEBSITE / rel).read_bytes()).hexdigest()
        print(f"{h}  {rel}")

    ssh.close()
    print("\n✅ 部署完成")
    print("⚠️  静态资源有 30 天缓存，验收时请用 Ctrl+Shift+R 强制刷新。")


if __name__ == "__main__":
    main()
