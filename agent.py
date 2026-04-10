import os
import sys
import subprocess

from langchain_ollama import ChatOllama

sys.stdout.reconfigure(encoding="utf-8")

llm = ChatOllama(model="qwen3:14b", streaming=False)


def read_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_file(path: str, content: str) -> str:
    allowed_dir = os.path.abspath(
        r"C:\Users\matts\Documents\local_development\snake_agent"
    )
    target = os.path.abspath(path)
    if not target.startswith(allowed_dir):
        raise Exception(
            f"Writing to {path} is not allowed outside of the project directory."
        )
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w", encoding="utf-8") as f:
        f.write(content)


def run_tests() -> str:
    result = subprocess.run(
        ["node", "smoke-test.js"],
        capture_output=True,
        text=True,
        env={**os.environ, "AGENT_MODE": "true"},
    )
    return result.stdout + result.stderr


def git_commit(message: str):
    subprocess.run(["git", "add", "."])
    subprocess.run(["git", "commit", "-m", f"[agent] {message}"])


def step_decide_feature() -> str:
    print("\n[step 1] deciding on a new feature...")
    response = llm.invoke(
        f"""
Here is the current Snake game code:

{read_file('index.html')}

And the current tests:

{read_file('smoke-test.js')}

Decide on ONE small new feature to add to this Snake game.
Describe it in 2-3 sentences. Be specific about what it does and how it works.
Do not write any code yet.
"""
    )
    feature = response.content
    print(f"[step 1] feature decided: {feature[:200]}...")
    return feature


def step_write_test(feature: str) -> str:
    print("\n[step 2] writing test...")
    response = llm.invoke(
        f"""
Here is the current smoke-test.js:

{read_file('smoke-test.js')}

Write a new test function for this feature:
{feature}

Rules:
- Follow the exact same style as the existing tests
- Use window.setGameState() and window.getGameState() where needed
- Return the complete new test function only, no explanation
- Do not include the main() function or imports
- The function must be named test[FeatureName] and accept a page parameter
"""
    )
    test_code = response.content
    print(f"[step 2] test written: {test_code[:200]}...")
    return test_code


def step_add_test_to_file(test_code: str):
    print("\n[step 3] adding test to smoke-test.js...")
    response = llm.invoke(
        f"""
Here is the current smoke-test.js:

{read_file('smoke-test.js')}

Add this new test function to the file and add it to the results array in main():

{test_code}

Return the complete updated smoke-test.js file only, no explanation.
"""
    )
    write_file("smoke-test.js", response.content)
    print("[step 3] smoke-test.js updated")


def step_implement_feature(feature: str):
    print("\n[step 4] implementing feature in index.html...")
    response = llm.invoke(
        f"""
Here is the current Snake game code:

{read_file('index.html')}

Implement this feature:
{feature}

Return the complete updated index.html file only, no explanation.
"""
    )
    write_file("index.html", response.content)
    print("[step 4] index.html updated")


def step_run_and_fix() -> bool:
    print("\n[step 5] running tests...")
    for attempt in range(1, 4):
        output = run_tests()
        print(output)
        if "FAIL" not in output and "Error" not in output:
            print(f"[step 5] all tests passed on attempt {attempt}")
            return True
        print(f"[step 5] attempt {attempt} failed, fixing...")
        response = llm.invoke(
            f"""
The Snake game tests are failing. Here is the test output:

{output}

Here is the current index.html:

{read_file('index.html')}

Here is the current smoke-test.js:

{read_file('smoke-test.js')}

The failure could be in either the game code or the test code.
Fix whichever file needs fixing so all tests pass.
Return both files in this exact format:

INDEX_HTML:
<complete updated index.html here>

SMOKE_TEST:
<complete updated smoke-test.js here>
"""
        )
        content = response.content
        if "INDEX_HTML:" in content and "SMOKE_TEST:" in content:
            html = content.split("INDEX_HTML:")[1].split("SMOKE_TEST:")[0].strip()
            test = content.split("SMOKE_TEST:")[1].strip()
            write_file("index.html", html)
            write_file("smoke-test.js", test)
        else:
            write_file("index.html", content)
    print("[step 5] all attempts failed, skipping feature")
    return False


def run_pipeline():
    feature = step_decide_feature()
    test_code = step_write_test(feature)
    step_add_test_to_file(test_code)
    step_implement_feature(feature)
    passed = step_run_and_fix()
    if passed:
        git_commit(f"Add feature: {feature[:60]}")
        print("\n[done] feature complete and committed!")
    else:
        print("\n[done] feature failed after 3 attempts, changes not committed")


run_pipeline()
