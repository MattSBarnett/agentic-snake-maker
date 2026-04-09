from langchain_ollama import ChatOllama
from langchain_core.tools import tool

@tool
def read_file(path: str) -> str:
    """Read a file from disk and return its contents."""
    with open(path, 'r') as f:
        return f.read()

llm = ChatOllama(model="qwen3:14b")
llm_with_tools = llm.bind_tools([read_file])

response = llm_with_tools.invoke("Read the file index.html")
print(response)