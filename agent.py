from langchain_ollama import ChatOllama
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

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
        ['node', 'smoke-test.js'],
        capture_output=True,
        text=True,
        env={**os.environ, 'AGENT_MODE': 'true'}
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


llm = ChatOllama(model="qwen3:14b")

agent = create_react_agent(llm, tools=[read_file, write_file, run_tests, git_commit])

response = agent.invoke(
    {
        "messages": [
            ("system", SYSTEM_PROMPT),
            ("user", "Start improving the Snake game"),
        ]
    }
)

print(response["messages"][-1].content)
