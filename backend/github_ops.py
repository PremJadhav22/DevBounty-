import os
import time
import subprocess
from github import Github
from dotenv import load_dotenv

load_dotenv()

class GithubOperator:
    def __init__(self):
        gh_token = os.getenv("GITHUB_API_TOKEN")
        self.client = Github(gh_token)
        
    def clone_repository(self, repo_name: str, dest_dir: str = "sandbox"):
        """Clones the target repository with a shallow depth for speed."""
        repo_url = f"https://github.com/{repo_name}.git"
        try:
            subprocess.run(
                ["git", "clone", "--depth", "1", "--single-branch", "--no-tags", repo_url, dest_dir],
                check=True, capture_output=True, text=True, timeout=180
            )
            return True
        except subprocess.TimeoutExpired:
            raise Exception("Git clone timed out after 180s.")
        except subprocess.CalledProcessError as e:
            raise Exception(f"Git clone failed: {e.stderr}")

    def create_pull_request(self, repo_name: str, branch_prefix: str, title: str, body: str, file_path: str, new_content: str):
        """Commits changes and opens a PR, forking automatically if necessary."""
        try:
            repo = self.client.get_repo(repo_name)
            user = self.client.get_user()
            
            target_repo = repo
            if not repo.permissions or not repo.permissions.push:
                target_repo = user.create_fork(repo)
            
            branch = f"{branch_prefix}-{int(time.time())}"
            sb = repo.get_branch(repo.default_branch)
            target_repo.create_git_ref(ref=f"refs/heads/{branch}", sha=sb.commit.sha)
                
            file_ref = target_repo.get_contents(file_path, ref=branch)
            target_repo.update_file(
                path=file_ref.path,
                message="[DevBounty] AI-generated bug fix",
                content=new_content,
                sha=file_ref.sha,
                branch=branch
            )
            
            head = f"{user.login}:{branch}" if target_repo.full_name != repo.full_name else branch
            pr = repo.create_pull(title=title, body=body, head=head, base=repo.default_branch)
            return pr.html_url
            
        except Exception as e:
            # Raise the exception so main.py can catch it and report correctly
            raise e
