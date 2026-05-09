import os
import re
import ast
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class AIAgent:
    def __init__(self):
        """Initializes the AI agent. Supports Gemini or Groq."""
        self.provider = os.getenv("AI_PROVIDER", "groq").lower().strip()
        self.model_name = os.getenv("AI_MODEL", "llama-3.3-70b-versatile").strip()
        
        if self.provider == "gemini":
            api_key = os.getenv("GEMINI_API_KEY", "").strip()
            if not api_key:
                print("⚠️ WARNING: GEMINI_API_KEY is missing!")
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            
        elif self.provider == "groq":
            api_key = os.getenv("GROQ_API_KEY", "").strip()
            if not api_key:
                print("⚠️ WARNING: GROQ_API_KEY is missing!")
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            )

    def _call(self, prompt: str) -> str:
        """Executes a call to the selected AI provider."""
        if self.provider == "gemini":
            response = self.model.generate_content(prompt)
            if not response or not response.text:
                raise ValueError("Gemini returned an empty response.")
            return response.text
        
        elif self.provider == "groq":
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
            
        raise ValueError(f"Unsupported provider: {self.provider}")

    def analyze_issue(self, issue_title: str, issue_body: str, repo_code: str):
        """Analyzes the bug report and codebase to find the root cause."""
        prompt = f"""
        Analyze this GitHub issue and the code. What is causing the bug?
        ISSUE: {issue_title}
        BODY: {issue_body}
        CODE:
        {repo_code[:3000]}
        
        Provide a clear technical explanation.
        """
        return self._call(prompt)

    def write_fix(self, buggy_file_content: str, analysis_result: str, feedback: str = ""):
        """Writes the fixed code. Returns (code, thought_process)."""
        feedback_prompt = f"\nFEEDBACK: {feedback}\n" if feedback else ""
        prompt = f"""
        Based on: "{analysis_result}"
        {feedback_prompt}
        Fix this code. 
        RULES:
        1. Reasoning inside <thought_process> tags.
        2. Comment at top: "# [DevBounty AI]: File optimized for resolution."
        3. Raw code ONLY after tags.
        
        ORIGINAL:
        {buggy_file_content[:5000]}
        """
        full_text = self._call(prompt).strip()
        thought_process = ""
        match = re.search(r"<(?:thought_process|thought)>(.*?)</(?:thought_process|thought)>", full_text, re.DOTALL | re.IGNORECASE)
        if match:
            thought_process = match.group(1).strip()
            code = full_text.replace(match.group(0), "").strip()
        else:
            code = full_text

        code = re.sub(r"^```[a-zA-Z]*\n", "", code)
        code = re.sub(r"\n```$", "", code)
        return code.strip(), thought_process

    def review_code(self, original_code: str, proposed_fix: str, analysis: str):
        """Critiques the fix. Returns (is_approved, feedback, thought_process)."""
        prompt = f"""
        Review this fix for: {analysis}
        FIX: {proposed_fix[:5000]}
        1. Critique inside <thought_process> tags.
        2. Output 'APPROVED' if good.
        3. Otherwise 'REJECTED' + feedback.
        """
        full_text = self._call(prompt).strip()
        thought_process = ""
        match = re.search(r"<(?:thought_process|thought)>(.*?)</(?:thought_process|thought)>", full_text, re.DOTALL | re.IGNORECASE)
        if match:
            thought_process = match.group(1).strip()
            result = full_text.replace(match.group(0), "").strip()
        else:
            result = full_text

        if "APPROVED" in result.upper()[:15]:
            return True, "", thought_process
        return False, re.sub(r"^REJECTED\b", "", result, flags=re.IGNORECASE).strip(), thought_process

    def check_syntax(self, code: str, language: str = "python"):
        """Validates Python syntax."""
        if language.lower() != "python": return True, ""
        try:
            ast.parse(code)
            return True, ""
        except SyntaxError as e:
            return False, f"SyntaxError line {e.lineno}: {e.msg}"
