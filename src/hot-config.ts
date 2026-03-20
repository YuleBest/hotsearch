/**
 * 热搜数据源配置
 *
 * douyin, bilibili, netease-news 优先级最高
 */
export const SOURCE_CONFIG: Record<
  string,
  {
    title: string
    priority: number
    hideDesc?: boolean
    maxDescLen?: number
    filterImages?: boolean
  }
> = {
  douyin: { title: '抖音', priority: 100 },
  bilibili: { title: '哔哩哔哩', priority: 99 },
  'netease-news': { title: '网易新闻', priority: 98 },
  baidu: { title: '百度', priority: 50 },
  weibo: { title: '微博', priority: 80 },
  zhihu: { title: '知乎', priority: 80 },
  tieba: { title: '贴吧', priority: 60 },
  toutiao: { title: '今日头条', priority: 70 },
  v2ex: { title: 'V2EX', priority: 90, hideDesc: true },
  ifanr: { title: '爱范儿', priority: 40, maxDescLen: 20, filterImages: true },
  juejin: { title: '稀土掘金', priority: 30 },
  sspai: { title: '少数派', priority: 30 },
  ithome: { title: 'IT之家', priority: 40 },
  '36kr': { title: '36氪', priority: 40 },
  acfun: { title: 'AcFun', priority: 50 },
  // 可以在此继续添加更多数据源...
}

export const getSourceTitle = (name: string): string => {
  return SOURCE_CONFIG[name]?.title || name
}

export const getSourcePriority = (name: string): number => {
  return SOURCE_CONFIG[name]?.priority || 0
}

export const getHideDesc = (name: string): boolean => {
  return SOURCE_CONFIG[name]?.hideDesc || false
}

export const getMaxDescLen = (name: string): number | undefined => {
  return SOURCE_CONFIG[name]?.maxDescLen
}

export const getFilterImages = (name: string): boolean => {
  return SOURCE_CONFIG[name]?.filterImages || false
}
