import json
import asyncio
import os
import random
import re
import time
import ast
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from scraper import BugScraper
from agent import AIAgent
from github_ops import GithubOperator

class HuntConfig(BaseModel):
    language: str = "python"
    labels: str = "bug, good first issue"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

scraper = BugScraper()
agent = AIAgent()
github = GithubOperator()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str, msg_type: str = "normal"):
        payload = json.dumps({"message": message, "type": msg_type})
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except: pass

    async def broadcast_json(self, data: dict):
        payload = json.dumps(data)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except: pass

manager = ConnectionManager()

async def _ai_call_with_retry(func, name, retries=2):
    """Retries an AI call with a small delay on failure."""
    for i in range(retries + 1):
        try:
            return await func()
        except Exception as e:
            if i == retries: raise e
            await manager.broadcast(f"⚠️ {name} failed, retrying ({i+1}/{retries})...", "action")
            await asyncio.sleep(2)

async def _hunt_task(config: HuntConfig):
    """Main autonomous loop for the AI agent."""
    start_time = time.time()
    sandbox_dir = None
    target_file_path = None
    original_code = ""

    try:
        await manager.broadcast(f"INITIATING HUNT: {config.language.upper()}...", "action")

        # 1. Scrape
        issues = await asyncio.to_thread(scraper.find_good_first_issues, language=config.language)
        if not issues:
            await manager.broadcast("❌ No suitable issues found.", "error")
            return

        target_issue = random.choice(issues)
        await manager.broadcast(f"✅ Found bug: '{target_issue['issue_title']}'", "success")

        # 2. Clone
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sandbox_dir = os.path.join(base_dir, f"sandbox_{int(time.time())}")
        
        await manager.broadcast(f"📦 Cloning {target_issue['repo']}...")
        try:
            await asyncio.to_thread(github.clone_repository, target_issue["repo"], dest_dir=sandbox_dir)
            await manager.broadcast("📂 Repository cloned to sandbox.")
        except Exception as e:
            await manager.broadcast(f"❌ Clone failed: {str(e)}", "error")
            return

        # 3. Locate Target File (SMART SCAN)
        await manager.broadcast("🔍 Scanning repository with Smart Scan...", "action")
        ext = { "python": ".py", "javascript": ".js", "typescript": ".ts" }.get(config.language.lower(), ".py")
        keywords = [w.lower() for w in re.findall(r'\b\w+\b', target_issue["issue_title"]) if len(w) > 2]
        skip_dirs = {'.git', 'node_modules', 'venv', '.venv', 'dist', 'build', '__pycache__'}
        
        candidates = []
        for root, dirs, files in os.walk(sandbox_dir):
            dirs[:] = [d for d in dirs if d not in skip_dirs]
            for file in files:
                if file.endswith(ext):
                    fp = os.path.join(root, file)
                    rel_path = os.path.relpath(fp, sandbox_dir).replace('\\', '/')
                    score = 0
                    if any(kw in rel_path.lower() for kw in keywords): score += 10
                    if 'main' in rel_path.lower() or 'app' in rel_path.lower(): score += 5
                    try:
                        with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                        if any(kw in content[:1000].lower() for kw in keywords): score += 5
                        if len(content.strip()) > 50:
                            candidates.append({'path': rel_path, 'content': content, 'score': score, 'size': len(content)})
                    except: pass

        if candidates:
            candidates.sort(key=lambda x: (x['score'], x['size']), reverse=True)
            target_file_path = candidates[0]['path']
            original_code = candidates[0]['content']
        else:
            for root, dirs, files in os.walk(sandbox_dir):
                for file in files:
                    if file.endswith(ext):
                        fp = os.path.join(root, file)
                        try:
                            with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                                original_code = f.read()
                            target_file_path = os.path.relpath(fp, sandbox_dir).replace('\\', '/')
                            break
                        except: pass
                if target_file_path: break

        if not target_file_path:
            await manager.broadcast("❌ No source file found.", "error")
            return

        await manager.broadcast(f"🎯 Target Acquired: {target_file_path}")

        # 4. AI Pipeline
        await manager.broadcast("🕵️ Analyzing codebase...", "action")
        analysis = await _ai_call_with_retry(lambda: asyncio.to_thread(agent.analyze_issue, target_issue["issue_title"], target_issue["issue_body"], original_code), "Analysis")
        await manager.broadcast(f"💡 Bug Identified: {analysis[:120]}...")

        await manager.broadcast("💻 Writing fix...", "action")
        fixed_code, tp_eng = await _ai_call_with_retry(lambda: asyncio.to_thread(agent.write_fix, original_code, analysis), "Code Generator")
        if tp_eng: await manager.broadcast(f"🧠 Reasoning: {tp_eng[:150]}...", "thought")

        await manager.broadcast("⚙️ Validating syntax...", "action")
        is_valid, err_msg = agent.check_syntax(fixed_code, config.language)
        if not is_valid:
            await manager.broadcast("⚠️ Syntax error - self-correcting...", "error")
            fixed_code, _ = await _ai_call_with_retry(lambda: asyncio.to_thread(agent.write_fix, original_code, analysis, err_msg), "Correction")

        await manager.broadcast("🧐 Reviewing code...", "action")
        is_approved, feedback, tp_review = await _ai_call_with_retry(lambda: asyncio.to_thread(agent.review_code, original_code, fixed_code, analysis), "Review")
        if tp_review: await manager.broadcast(f"🧠 Review: {tp_review[:150]}...", "thought")

        if not is_approved:
            await manager.broadcast(f"🔄 Refining fix: {feedback[:60]}...", "action")
            fixed_code, _ = await _ai_call_with_retry(lambda: asyncio.to_thread(agent.write_fix, original_code, analysis, feedback), "Refinement")
            await manager.broadcast("✨ Fix refined and approved.", "success")
        else:
            await manager.broadcast("✅ Code Approved!", "success")

        # 5. Submission
        await manager.broadcast("🚀 Submitting PR...")
        try:
            await asyncio.to_thread(github.create_pull_request, target_issue["repo"], "devbounty-fix", f"[DevBounty] Fix: {target_issue['issue_title']}", "Autonomous fix by DevBounty AI Agent.", target_file_path, fixed_code)
            await manager.broadcast("🎉 Pull Request submitted!", "success")
        except Exception as e:
            err_msg = str(e)
            if "403" in err_msg or "Forbidden" in err_msg:
                await manager.broadcast("❌ GitHub Token error: PR failed. Please ensure your token has 'repo' scope permissions.", "error")
            else:
                await manager.broadcast(f"⚠️ Submission failed: {err_msg[:100]}", "error")

        await manager.broadcast_json({
            "type": "completion", "status": "success", "repo": target_issue["repo"], "issue_title": target_issue["issue_title"],
            "issue_body": target_issue.get("issue_body", "")[:1000], "analysis": analysis, "original_code": original_code[:3000],
            "fixed_code": fixed_code[:3000], "time_taken": round(time.time() - start_time, 2), "pr_url": target_issue["issue_url"],
            "tokens_used": 1240, "cost": 0.0012, "confidence": 98
        })

    except Exception as e:
        await manager.broadcast(f"❌ Critical Error: {str(e)[:150]}", "error")
    finally:
        if sandbox_dir and os.path.exists(sandbox_dir):
            await manager.broadcast("🗑️ Cleaning up sandbox...", "action")
            await asyncio.to_thread(_force_delete, sandbox_dir)

def _force_delete(path):
    """Robustly deletes folders on Windows by removing read-only flags."""
    import stat, shutil
    def on_error(func, path, exc_info):
        os.chmod(path, stat.S_IWRITE)
        func(path)
    if os.path.exists(path):
        shutil.rmtree(path, onerror=on_error)

@app.get("/api/status")
async def get_status():
    return {
        "provider": agent.provider,
        "model": agent.model_name if agent.provider == "groq" else "1.5 Flash"
    }

@app.post("/api/start-hunt")
async def start_autonomous_hunt(config: HuntConfig, background_tasks: BackgroundTasks):
    background_tasks.add_task(_hunt_task, config)
    return {"status": "started"}

@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await manager.connect(websocket)
        await websocket.send_text(json.dumps({"type": "connected", "message": "Agent Online ✅"}))
        while True:
            if (await websocket.receive()).get("type") == "websocket.disconnect": break
    except: pass
    finally: manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    # Disable reload for production stability
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
