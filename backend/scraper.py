import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Large or complex repos to skip for the hackathon demo speed
BLOCKED_REPOS = {
    "NVIDIA-NeMo/Automodel", "NVIDIA-NeMo/NeMo", "pytorch/pytorch",
    "tensorflow/tensorflow", "microsoft/vscode", "facebook/react",
    "kubernetes/kubernetes", "golang/go", "rust-lang/rust",
    "llvm/llvm-project", "apple/swift", "torvalds/linux",
    "dotnet/runtime", "chromium/chromium", "opencv/opencv",
    "home-assistant/core", "django/django", "scipy/scipy",
    "numpy/numpy", "pandas-dev/pandas", "scikit-learn/scikit-learn",
}

MAX_REPO_SIZE_KB = 300_000

class BugScraper:
    def __init__(self):
        self.github_token = os.getenv("GITHUB_API_TOKEN")
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "DevBounty-Agent",
        }
        if self.github_token:
            self.headers["Authorization"] = f"token {self.github_token}"

    def _get_repo_size(self, repo_name: str) -> int:
        """Fetches repo size in KB via GitHub API."""
        try:
            resp = requests.get(f"https://api.github.com/repos/{repo_name}", headers=self.headers, timeout=5)
            return resp.json().get("size", 0) if resp.ok else 0
        except: return 0

    def find_good_first_issues(self, language="python"):
        """Search GitHub for issues with fallback levels to ensure results."""
        search_levels = [
            f"is:issue label:\"good first issue\" label:bug language:{language} state:open",
            f"is:issue label:bug language:{language} state:open",
            f"is:issue language:{language} state:open fix in:title"
        ]

        for query in search_levels:
            try:
                response = requests.get("https://api.github.com/search/issues", headers=self.headers, params={"q": query, "sort": "updated", "order": "desc", "per_page": 50}, timeout=10)
                response.raise_for_status()
                data = response.json()

                issues = []
                for item in data.get("items", []):
                    repo_name = item.get("repository_url", "").replace("https://api.github.com/repos/", "")
                    if repo_name in BLOCKED_REPOS or self._get_repo_size(repo_name) > MAX_REPO_SIZE_KB:
                        continue

                    issues.append({
                        "repo": repo_name,
                        "issue_title": item.get("title", ""),
                        "issue_body": (item.get("body", "") or "")[:2000],
                        "issue_url": item.get("html_url", "")
                    })
                    if len(issues) >= 10: break

                if issues: return issues
            except: continue
        return []
