/**
 * 数据源配置
 * name: API 返回的英文名/ID
 * title: 中文显示名
 * priority: 优先级，数字越大优先级越高
 */
export const SOURCE_CONFIG: Record<string, { title: string; priority: number }> = {
  douyin: { title: '抖音', priority: 100 },
  bilibili: { title: '哔哩哔哩', priority: 100 },
  'netease-news': { title: '网易新闻', priority: 100 },
  baidu: { title: '百度', priority: 50 },
  weibo: { title: '微博', priority: 80 },
  zhihu: { title: '知乎', priority: 80 },
  tieba: { title: '贴吧', priority: 60 },
  toutiao: { title: '今日头条', priority: 70 },
  v2ex: { title: 'V2EX', priority: 40 },
  juejin: { title: '稀土掘金', priority: 30 },
  sspai: { title: '少数派', priority: 30 },
  ithome: { title: 'IT之家', priority: 40 },
  '36kr': { title: '36氪', priority: 40 },
  acfun: { title: 'AcFun', priority: 50 },
}

export const getSourceTitle = (name: string): string => {
  return SOURCE_CONFIG[name]?.title || name
}

export const getSourcePriority = (name: string): number => {
  return SOURCE_CONFIG[name]?.priority || 0
}
