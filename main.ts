// main.ts
// 导入 Deno 标准库中的 serve 函数，用于创建 HTTP 服务器
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

// --- 后端核心逻辑 ---
// 此函数负责向 OpenAI API 发送请求以生成链接
async function generateCheckoutLinks(authToken: string): Promise<string[]> {
    if (!authToken || !authToken.startsWith("Bearer ")) {
        return ["错误：Authorization Token 格式不正确。它应该以 'Bearer ' 开头。"];
    }

    // OpenAI API 端点
    const apiEndpoint = 'https://chatgpt.com/backend-api/payments/checkout';

    // 请求标头 (Headers)
    const headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'authorization': authToken, // 使用从前端传来的 Token
        'content-type': 'application/json',
        'origin': 'https://chatgpt.com',
        'referer': 'https://chatgpt.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
    };

    // 请求主体 (Body)
    const jsonData = {
        'plan_name': 'chatgptteamplan',
        'team_plan_data': {
            'workspace_name': 'MyAwesomeTeam',
            'price_interval': 'month',
            'seat_quantity': 5,
        },
        'billing_details': {
            'country': 'JP',
            'currency': 'USD',
        },
        'cancel_url': 'https://chatgpt.com/',
        'promo_campaign': 'team-1-month-free',
        'checkout_ui_mode': 'redirect',
    };

    const numLinks = 5;
    const results: string[] = [];

    console.log(`正在为 Token: ${authToken.substring(0, 15)}... 生成 ${numLinks} 个链接...`);

    for (let i = 0; i < numLinks; i++) {
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(jsonData),
            });

            if (!response.ok) {
                // 如果 API 响应错误，记录错误信息
                const errorText = await response.text();
                results.push(`链接 ${i + 1} 生成失败: HTTP ${response.status} - ${errorText}`);
                continue;
            }

            const responseData = await response.json();
            const sessionId = responseData["checkout_session_id"];
            if (sessionId) {
                const url = `https://chatgpt.com/checkout/openai_llc/${sessionId}`;
                results.push(`链接 ${i + 1}: ${url}`);
            } else {
                results.push(`链接 ${i + 1} 生成失败: 响应中找不到 checkout_session_id`);
            }
        } catch (error) {
            results.push(`链接 ${i + 1} 生成时发生网络错误: ${error.message}`);
        }
    }
    
    console.log("生成完毕。");
    return results;
}

// --- Web 服务器处理逻辑 ---
async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // 如果是 POST 请求到 /api/generate，则处理链接生成
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

    // 对于所有其他请求，返回 HTML 前端页面
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
            background-color: #f7b2b2;
            color: #5c1a1a;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1.5rem;
            border: 1px solid #e08b8b;
        }
        .warning a {
            color: #3b0f0f;
            font-weight: bold;
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
        <h1>ChatGPT Team 链接生成器</h1>
        <div class="warning">
            <strong>警告：</strong> 你的 Authorization Token 非常敏感，相当于账户密码。请勿泄露给任何人。此工具仅为技术展示，使用它可能违反 OpenAI 服务条款，并可能导致账户被封锁。请自行承担风险。
            <br/>请先访问 <a href=" " target="_blank">这个链接</a >，然后将页面中的 "accessToken" 的值完整复制到下面的输入框。
        </div>
        <div class="input-group">
            <label for="authToken">输入你的 Access Token:</label>
            <input type="password" id="authToken" placeholder="请粘贴从 session 链接中获取的 accessToken 值">
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
            if (!rawToken) {
                resultsArea.textContent = "错误：请先输入你的 Access Token。";
                return;
            }

            // 自动为 Token 添加 'Bearer ' 前缀
            const token = 'Bearer ' + rawToken;

            // 禁用按钮并显示加载信息
            generateButton.disabled = true;
            generateButton.textContent = '正在生成中...';
            resultsArea.textContent = '正在向服务器发送请求，请稍候...';

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token })
                });

                const data = await response.json();

                if (response.ok) {
                    resultsArea.textContent = data.results.join('\\n');
                } else {
                    resultsArea.textContent = '服务器错误: ' + (data.error || '未知错误');
                }

            } catch (error) {
                resultsArea.textContent = '发生网络错误，无法连接到服务器: ' + error.message;
            } finally {
                // 重新启用按钮
                generateButton.disabled = false;
                generateButton.textContent = '生成付款链接';
            }
        });
    </script>
</body>
</html>
`;
}

// 启动服务器
console.log("服务器正在 http://localhost:8000/ 上运行");
serve(handler);