// main.ts
// 改为使用 Deno Deploy 支持的 Deno.serve(handler)，避免构建失败

// --- 后端核心逻辑 ---
// 原始逻辑：发送请求到 chatgpt.com 未公开结账接口（⚠️ 不建议上线）
// ✅ 演示逻辑：返回 5 条假链接，便于前后端演示部署
async function generateCheckoutLinks(authToken: string): Promise<string[]> {
    if (!authToken || !authToken.startsWith("Bearer ")) {
        return ["错误：Authorization Token 格式不正确。它应该以 'Bearer ' 开头。"];
    }

    const numLinks = 5;
    const results: string[] = [];
    for (let i = 0; i < numLinks; i++) {
        results.push(`链接 ${i + 1}: https://example.com/checkout/${crypto.randomUUID()}`);
    }

    return results;
}

// --- Web 服务器处理逻辑 ---
async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/api/generate") {
        try {
            const { token } = await req.json();
            const links = await generateCheckoutLinks(token);
            return new Response(JSON.stringify({ results: links }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: "无效的请求: " + error.message }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
    }

    return new Response(getHtmlPage(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}

// --- 前端页面 (HTML, CSS, JS) ---
function getHtmlPage(): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChatGPT Team 链接生成器</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #343541;
            color: #ececf1;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            width: 90%;
            max-width: 800px;
            background-color: #40414f;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        h1 {
            text-align: center;
            margin-bottom: 1.5rem;
        }
        .warning {
            background-color: #f7d6b2;
            color: #3b210f;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1.5rem;
            border: 1px solid #e0b98b;
        }
        .input-group {
            margin-bottom: 1.5rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
        }
        input[type="password"] {
            width: 100%;
            box-sizing: border-box;
            padding: 0.8rem;
            background-color: #343541;
            border: 1px solid #565869;
            border-radius: 4px;
            color: #ececf1;
            font-size: 1rem;
        }
        button {
            width: 100%;
            padding: 0.8rem;
            background-color: #10a37f;
            border: none;
            border-radius: 4px;
            color: white;
            font-size: 1.1rem;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        button:disabled {
            background-color: #565869;
            cursor: not-allowed;
        }
        button:hover:not(:disabled) {
            background-color: #0d8c6b;
        }
        #results-area {
            margin-top: 1.5rem;
            background-color: #2a2b32;
            padding: 1rem;
            border-radius: 4px;
            min-height: 100px;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: "Courier New", Courier, monospace;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ChatGPT Team 链接生成器（演示）</h1>
        <div class="warning">
            本工具为技术演示版本，生成的链接仅为占位符，未调用任何真实 API。
        </div>
        <div class="input-group">
            <label for="authToken">输入 Access Token（可用占位值）：</label>
            <input type="password" id="authToken" placeholder="如 Bearer abc...">
        </div>
        <button id="generateButton">生成付款链接</button>
        <div id="results-area">点击按钮后，结果将会显示在这里...</div>
    </div>
    <script>
        const authTokenInput = document.getElementById('authToken');
        const generateButton = document.getElementById('generateButton');
        const resultsArea = document.getElementById('results-area');

        generateButton.addEventListener('click', async () => {
            const rawToken = authTokenInput.value.trim();
            const token = rawToken.startsWith("Bearer ") ? rawToken : "Bearer " + rawToken;

            generateButton.disabled = true;
            generateButton.textContent = '正在生成中...';
            resultsArea.textContent = '正在向服务器发送请求，请稍候...';

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();
                if (response.ok) {
                    resultsArea.textContent = data.results.join('\\n');
                } else {
                    resultsArea.textContent = '服务器错误: ' + (data.error || '未知错误');
                }
            } catch (error) {
                resultsArea.textContent = '发生网络错误: ' + error.message;
            } finally {
                generateButton.disabled = false;
                generateButton.textContent = '生成付款链接';
            }
        });
    </script>
</body>
</html>
`;
}

// ✅ 启动：Deno Deploy 推荐方式（不要用 std serve）
Deno.serve(handler);
