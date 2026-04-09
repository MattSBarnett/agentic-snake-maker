from langchain_ollama import ChatOllama
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent


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

    result = subprocess.run(["node", "smoke-test.js"], capture_output=True, text=True)
    return result.stdout + result.stderr

@tool
def git_commit(message: str) -> str:
    """Commit all current changes with a descriptive message."""
    import subprocess
    full_message = f"[agent] {message}"
    subprocess.run(['git', 'add', '.'])
    subprocess.run(['git', 'commit', '-m', full_message])
    return f"Committed: {full_message}"


llm = ChatOllama(model="qwen3:14b")

agent = create_react_agent(llm, tools=[read_file, write_file, run_tests, git_commit])

response = agent.invoke(
    {
        "messages": [
            (
                "user",
                "Read index.html, change the snake colour to purple, then run the tests to verify nothing is broken, finally commit this work",
            )
        ]
    }
)

print(response["messages"][-1].content)
