/**
 * 缓存数据结构
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_PREFIX = 'hot-search-cache-'
const CACH_EXPIRE = 30 * 60 * 1000 // 30分钟

/**
 * 获取缓存
 */
export const getCache = <T>(key: string): T | null => {
  const fullKey = CACHE_PREFIX + key
  const stored = localStorage.getItem(fullKey)
  if (!stored) return null

  try {
    const entry: CacheEntry<T> = JSON.parse(stored)
    const now = Date.now()
    if (now - entry.timestamp > CACH_EXPIRE) {
      localStorage.removeItem(fullKey)
      return null
    }
    return entry.data
  } catch {
    localStorage.removeItem(fullKey)
    return null
  }
}

/**
 * 设置缓存
 */
export const setCache = <T>(key: string, data: T): void => {
  const fullKey = CACHE_PREFIX + key
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  }
  localStorage.setItem(fullKey, JSON.stringify(entry))
}

/**
 * 清除缓存
 */
export const clearCache = (key: string): void => {
  localStorage.removeItem(CACHE_PREFIX + key)
}

/**
 * 获取缓存的时间戳
 */
export const getCacheTimestamp = (key: string): number | null => {
  const fullKey = CACHE_PREFIX + key
  const stored = localStorage.getItem(fullKey)
  if (!stored) return null

  try {
    const entry: CacheEntry<unknown> = JSON.parse(stored)
    return entry.timestamp
  } catch {
    return null
  }
}
