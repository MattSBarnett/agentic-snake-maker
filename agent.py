from langchain_ollama import ChatOllama
from langchain_core.tools import tool
from langchain.agents import create_react_agent


@tool
def read_file(path: str) -> str:
    """Read a file from disk and return its contents."""
    with open(path, "r") as f:
        return f.read()


llm = ChatOllama(model="qwen3:14b")

agent = create_react_agent(llm, tools=[read_file])

response = agent.invoke(
    {"messages": [("user", "Read the file index.html and tell me what it does")]}
)

print(response["messages"][-1].content)
