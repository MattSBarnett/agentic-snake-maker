import os
import sys

from langchain_ollama import ChatOllama
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langchain_core.callbacks import BaseCallbackHandler

sys.stdout.reconfigure(encoding='utf-8')

SYSTEM_PROMPT = """
You are an autonomous agent that iteratively improves a Snake game.

Your workflow for each feature:
1. Read the current index.html and smoke-test.js to understand the codebase
2. Decide on one new feature to add
3. Write a new test for it in smoke-test.js
4. Implement the feature in index.html
5. Run the tests
6. If tests fail, read the files again, fix the code and retest (max 3 attempts)
7. If tests pass, commit with a descriptive message
8. Then start again with a new feature

Rules:
- Always read files before editing them
- Always write a test before writing the feature code
- Never give up after fewer than 3 attempts
- Only commit when all tests pass
- Keep features small and focused

You must NEVER stop to report what needs fixing. Always fix it yourself using the available tools.
Keep working until all tests pass and changes are committed.
Do not ask for confirmation or report problems — just solve them.
"""


@tool
def read_file(path: str) -> str:
    """Read a file from disk and return its contents."""
    with open(path, "r") as f:
        return f.read()


@tool
def write_file(path: str, content: str) -> str:
    """Write content to a file on disk. Can create new files if needed."""
    import os

    allowed_dir = os.path.abspath(
        r"C:\Users\matts\Documents\local_development\snake_agent"
    )
    target = os.path.abspath(path)

    if not target.startswith(allowed_dir):
        return (
            f"Error: writing to {path} is not allowed outside of the project directory."
        )

    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w") as f:
        f.write(content)
    return f"Successfully written to {path}"


@tool
def run_tests() -> str:
    """Run the smoke tests against the game and return the results."""
    import subprocess

    result = subprocess.run(
        ["node", "smoke-test.js"],
        capture_output=True,
        text=True,
        env={**os.environ, "AGENT_MODE": "true"},
    )
    output = result.stdout + result.stderr
    print(output)
    return output


@tool
def git_commit(message: str) -> str:
    """Commit all current changes with a descriptive message."""
    import subprocess

    full_message = f"[agent] {message}"
    subprocess.run(["git", "add", "."])
    subprocess.run(["git", "commit", "-m", full_message])
    return f"Committed: {full_message}"


class LoggingCallback(BaseCallbackHandler):
    def on_llm_end(self, response, **kwargs):
        generation = response.generations[0][0]
        # get the actual message content
        if hasattr(generation, "message"):
            content = generation.message.content
            if content:
                print(f"\n[agent] reasoning: {content[:300]}...")

    def on_tool_start(self, serialized, input_str, **kwargs):
        print(f"\n[agent] calling tool: {serialized['name']}")
        print(f"  args: {str(input_str)[:200]}")

    def on_tool_end(self, output, **kwargs):
        # strip the langchain wrapper and just show the value
        output_str = str(output)
        if "content=" in output_str:
            output_str = output_str.split("content='")[1].split("'")[0]
        print(f"[agent] result: {output_str[:200]}")


llm = ChatOllama(model="qwen3:14b", streaming=False)

agent = create_react_agent(llm, tools=[read_file, write_file, run_tests, git_commit])

response = agent.invoke(
    {
        "messages": [
            ("system", SYSTEM_PROMPT),
            ("user", "Start improving the Snake game"),
        ]
    },
    config={"callbacks": [LoggingCallback()]},
)

print(response["messages"][-1].content)
