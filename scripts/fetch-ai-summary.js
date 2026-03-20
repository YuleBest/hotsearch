import fs from 'node:fs'
import path from 'node:path'

// GitHub Action 版本，从环境变量读取 Token
const API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = 'stepfun/step-3.5-flash:free'
const OUTPUT_FILE = 'src/assets/ai-summary.json'

if (!API_KEY) {
  console.error('错误: 未找到 OPENROUTER_API_KEY 环境变量')
  process.exit(1)
}

// 优先级 > 90 的数据源
const SOURCES = [
  { name: '抖音', path: '/douyin' },
  { name: '哔哩哔哩', path: '/bilibili' },
  { name: '网易新闻', path: '/netease-news' },
  { name: '今日头条', path: '/toutiao' },
  { name: '历史上的今天', path: '/history' },
]

async function fetchHotData() {
  const allData = []
  for (const source of SOURCES) {
    try {
      const res = await fetch(`https://hot-api.yule.ink${source.path}`)
      const json = await res.json()
      if (json.code === 200 && json.data) {
        const top10 = json.data.slice(0, 10).map((item) => item.title)
        allData.push(`【${source.name}】: ${top10.join('、')}`)
      }
    } catch (e) {
      console.error(`获取 ${source.name} 失败:`, e)
    }
  }
  return allData.join('\n\n')
}

async function getAISummary(content) {
  const prompt = `以下是来自多个平台的实时热搜内容，请给出一个简短的综合总结，要求简洁明了，分点阐述。总字数150字左右，不得含有html，但可使用单个换行符(斜杠+n)，Markdown格式。使用纯文本、中文简体进行总结：\n\n${content}`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      reasoning: { enabled: true },
    }),
  })

  const result = await response.json()
  if (result.choices && result.choices[0] && result.choices[0].message) {
    return result.choices[0].message.content
  }
  throw new Error('AI 返回数据异常: ' + JSON.stringify(result))
}

async function main() {
  try {
    console.log('正在获取热搜数据 (GitHub Action)...')
    const content = await fetchHotData()

    if (!content) {
      console.log('未获取到有效数据，停止总结。')
      return
    }

    console.log('正在调用 OpenRouter 生成 AI 总结...')
    const summary = await getAISummary(content)

    const output = {
      summary,
      timestamp: Date.now(),
    }

    const fullPath = path.resolve(OUTPUT_FILE)
    const dir = path.dirname(fullPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(fullPath, JSON.stringify(output, null, 2))
    console.log('总结已保存至:', OUTPUT_FILE)
    console.log('总结内容:', summary)
  } catch (error) {
    console.error('运行失败:', error)
  }
}

main()
