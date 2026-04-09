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


llm = ChatOllama(model="qwen3:14b")

agent = create_react_agent(llm, tools=[read_file, write_file])

response = agent.invoke(
    {
        "messages": [
            ("user", "Read index.html and change the snake colour from green to blue")
        ]
    }
)

print(response["messages"][-1].content)
