import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { getSourcePriority } from '@/hot-config'

export const useFavoritesStore = defineStore('favorites', () => {
  // 使用 localStorage 持久化收藏的数据源路径
  const favorites = useLocalStorage<string[]>('hotsearch-favorites', [])

  /**
   * 判断是否已收藏
   */
  const isFavorite = (path: string) => {
    return favorites.value.includes(path)
  }

  /**
   * 切换收藏状态
   */
  const toggleFavorite = (path: string) => {
    const index = favorites.value.indexOf(path)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push(path)
    }
  }

  /**
   * 将数据源排序：收藏 > 优先级 > 默认
   */
  const sortWithFavorites = <T extends { path: string | null; name: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
      const aFav = a.path ? isFavorite(a.path) : false
      const bFav = b.path ? isFavorite(b.path) : false

      const aPriority = getSourcePriority(a.name)
      const bPriority = getSourcePriority(b.name)

      const aScore = (aFav ? 10000 : 0) + aPriority
      const bScore = (bFav ? 10000 : 0) + bPriority

      return bScore - aScore
    })
  }

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    sortWithFavorites,
  }
})
