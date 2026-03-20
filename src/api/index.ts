import axios from 'axios'

const api = axios.create({
  baseURL: 'https://hot-api.yule.ink',
  timeout: 10000,
})

export interface RouteItem {
  name: string
  path: string | null
  message?: string
}

export interface AllRoutesResponse {
  code: number
  count: number
  routes: RouteItem[]
}

export interface HotItem {
  id?: string | number
  title: string
  desc?: string
  hot?: string | number | null
  url: string
  mobileUrl?: string
  author?: string
  timestamp?: number | null
  cover?: string
}

export interface HotResponse {
  code: number
  message?: string
  name?: string
  title?: string
  type?: string
  updateTime?: string
  link?: string
  data: HotItem[]
}

/**
 * 获取所有可用的数据源
 * 过滤掉 path 为 null 的接口
 */
export const getAllDataSources = async (): Promise<RouteItem[]> => {
  try {
    const response = await api.get<AllRoutesResponse>('/all')
    if (response.data.code === 200) {
      return response.data.routes.filter((route) => route.path !== null)
    }
    return []
  } catch {
    return []
  }
}

/**
 * 获取具体数据源的热搜数据
 * @param path 数据源路径 (例如: "/weibo")
 */
export const getHotSearch = async (path: string): Promise<HotResponse | null> => {
  try {
    const response = await api.get<HotResponse>(path)
    if (response.data.code === 200) {
      return response.data
    }
    return null
  } catch {
    return null
  }
}

export default api
