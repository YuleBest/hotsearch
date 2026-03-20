<script setup lang="ts">
import { ref, onMounted, computed, reactive, onUnmounted } from 'vue'
import { useColorMode, refDebounced } from '@vueuse/core'

import { getAllDataSources, type RouteItem, type HotItem, type HotResponse } from '@/api'
import { useFavoritesStore } from '@/store/favorites'
import { getSourceTitle } from '@/hot-config'
import { getCache } from '@/utils/cache'

import DataSourceCard from '@/components/DataSourceCard.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Search, RefreshCw, EyeOff, Sun, Moon, Monitor, Sparkles } from 'lucide-vue-next'
import aiSummary from '@/assets/ai-summary.json'

const favoritesStore = useFavoritesStore()
const allSources = ref<RouteItem[]>([])
const loading = ref(true)
const error = ref(false)
const searchQuery = ref('')
const debouncedSearchQuery = refDebounced(searchQuery, 200)

// 主题模式管理
const mode = useColorMode({
  selector: 'html',
  attribute: 'class',
  modes: {
    dark: 'dark',
    light: '',
  },
})

const toggleTheme = () => {
  mode.value = mode.value === 'dark' ? 'light' : 'dark'
}

// 用于追踪每个数据源的可用性状态
const sourceAvailability = reactive<Record<string, boolean>>({})
// 存储每个数据源加载到的具体条目标题，用于全局搜索
const sourceData = reactive<Record<string, HotItem[]>>({})

// 从缓存初始化搜索库
const initSearchCache = (sources: RouteItem[]) => {
  sources.forEach((s) => {
    if (s.path) {
      const cached = getCache<HotResponse>(s.path)
      if (cached && cached.data) {
        sourceData[s.path] = cached.data.slice(0, 10)
      }
    }
  })
}

// 加载队列管理
const readyToLoadMap = reactive<Record<string, boolean>>({})
const loadingQueue = ref<string[]>([])
const runningCount = ref(0)
const MAX_CONCURRENT = 5

// 刷新状态管理
const refreshCooldown = ref(0)
const lastRefreshed = ref<number | null>(null)
let cooldownTimer: number | null = null

const fetchSources = async (force = false) => {
  loading.value = true
  error.value = false

  if (force) {
    // 清除所有缓存
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('hot-search-cache-')) {
        localStorage.removeItem(key)
      }
    })
    // 同时清空当前的搜索数据
    Object.keys(sourceData).forEach((k) => delete sourceData[k])
    startCooldown()
  }

  // 重置队列状态
  runningCount.value = 0
  loadingQueue.value = []
  Object.keys(readyToLoadMap).forEach((k) => delete readyToLoadMap[k])

  try {
    const sources = await getAllDataSources()
    allSources.value = sources

    // 初始化可用性状态
    sources.forEach((s) => {
      if (s.path && sourceAvailability[s.path] === undefined) {
        sourceAvailability[s.path] = true
      }
    })

    // 初始化搜索缓存
    initSearchCache(sources)

    // 初始化并启动加载队列
    initLoadingQueue()
    lastRefreshed.value = Date.now()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

const startCooldown = () => {
  refreshCooldown.value = 5
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = window.setInterval(() => {
    refreshCooldown.value--
    if (refreshCooldown.value <= 0) {
      if (cooldownTimer) clearInterval(cooldownTimer)
    }
  }, 1000)
}

const initLoadingQueue = () => {
  const sorted = favoritesStore.sortWithFavorites([...allSources.value])
  loadingQueue.value = sorted.map((s) => s.path).filter((p): p is string => !!p)
  processQueue()
}

const processQueue = () => {
  while (runningCount.value < MAX_CONCURRENT && loadingQueue.value.length > 0) {
    const path = loadingQueue.value.shift()
    if (path) {
      readyToLoadMap[path] = true
      runningCount.value++
    }
  }
}

const handleSourceLoaded = (path: string, items: HotItem[]) => {
  sourceData[path] = items
  runningCount.value = Math.max(0, runningCount.value - 1)
  processQueue()

  if (loadingQueue.value.length === 0 && runningCount.value === 0) {
    setTimeout(() => {
      console.clear()
    }, 500)
  }
}

onMounted(() => {
  fetchSources()
})

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

const updateAvailability = (path: string, isAvailable: boolean) => {
  sourceAvailability[path] = isAvailable
}

const filteredSources = computed(() => {
  let sources = allSources.value.filter((s) => s.path && sourceAvailability[s.path])

  if (debouncedSearchQuery.value) {
    const query = debouncedSearchQuery.value.toLowerCase()

    sources = sources.filter((s) => {
      // 1. 匹配数据源标题/名称
      const title = getSourceTitle(s.name).toLowerCase()
      const name = s.name.toLowerCase()
      if (title.includes(query) || name.includes(query)) return true

      // 2. 匹配具体的热搜条目标题
      const items = sourceData[s.path!]
      if (items && items.length > 0) {
        return items.some((item) => item.title.toLowerCase().includes(query))
      }

      return false
    })
  }

  return favoritesStore.sortWithFavorites(sources)
})

const hiddenCount = computed(() => {
  return allSources.value.filter((s) => s.path && sourceAvailability[s.path] === false).length
})

const formattedTime = computed(() => {
  if (!lastRefreshed.value) return ''
  const date = new Date(lastRefreshed.value)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
})

const formattedAiTime = computed(() => {
  if (!aiSummary?.timestamp) return ''
  const date = new Date(aiSummary.timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
})
</script>

<template>
  <div class="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="flex items-center justify-between gap-3 mb-6">
      <div class="space-y-0">
        <h1 class="text-xl sm:text-3xl font-bold tracking-tight text-foreground whitespace-nowrap">
          实时热点
        </h1>
        <p class="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">紧跟时事不掉队</p>
      </div>

      <div class="flex flex-col items-end gap-1 flex-1 min-w-0">
        <div class="flex items-center gap-2 w-full justify-end">
          <div class="relative w-full max-w-[120px] sm:max-w-none sm:w-48 md:w-64">
            <Search
              class="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索热搜"
              class="w-full bg-card border border-border rounded-xl py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/5 transition-all shadow-sm"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              @click="toggleTheme"
              class="rounded-xl border-border h-9 w-9 bg-card"
              title="切换主题"
            >
              <Sun v-if="mode === 'light'" class="h-4 w-4 text-muted-foreground" />
              <Moon v-else-if="mode === 'dark'" class="h-4 w-4 text-muted-foreground" />
              <Monitor v-else class="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              @click="fetchSources(true)"
              :disabled="loading || refreshCooldown > 0"
              class="rounded-xl border-border h-9 w-9 bg-card"
              title="刷新数据"
            >
              <RefreshCw
                class="h-4 w-4 text-muted-foreground"
                :class="{ 'animate-spin': loading }"
              />
            </Button>
          </div>
        </div>
        <span v-if="formattedTime" class="text-[10px] text-muted-foreground/60 leading-none">
          更新于 {{ formattedTime }}
          <span v-if="refreshCooldown > 0">({{ refreshCooldown }}s)</span>
        </span>
      </div>
    </div>

    <!-- AI 总结区域 -->
    <div
      v-if="aiSummary?.summary"
      class="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-6 flex gap-3 items-start relative overflow-hidden group/ai shadow-sm hover:shadow-md transition-all duration-300 ml-0.5 mr-0.5"
    >
      <div class="bg-primary/10 p-2 rounded-xl text-primary shrink-0">
        <Sparkles class="h-4 w-4" />
      </div>
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <h3
            class="text-[10px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-widest"
          >
            AI 总结
          </h3>
          <span v-if="formattedAiTime" class="text-[9px] text-primary/40 font-mono">
            {{ formattedAiTime }}
          </span>
        </div>
        <p class="text-sm text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap">
          {{ aiSummary.summary }}
        </p>
      </div>

      <div
        class="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl group-hover/ai:bg-primary/10 transition-colors"
      ></div>
    </div>

    <div
      v-if="loading && allSources.length === 0"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
    >
      <Skeleton v-for="i in 12" :key="i" class="h-72 w-full rounded-2xl" />
    </div>

    <div
      v-else-if="error && allSources.length === 0"
      class="flex flex-col items-center justify-center py-20 text-muted-foreground"
    >
      <p class="text-lg font-medium">获取数据源失败</p>
      <Button
        variant="default"
        @click="fetchSources"
        class="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6"
      >
        重试
      </Button>
    </div>

    <div
      v-else-if="filteredSources.length === 0"
      class="flex flex-col items-center justify-center py-20 text-muted-foreground"
    >
      <p class="text-lg">未找到相关内容</p>
    </div>

    <TransitionGroup
      v-else
      name="list"
      tag="div"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
    >
      <DataSourceCard
        v-for="source in filteredSources"
        :key="source.path!"
        :source="source"
        :ready-to-load="readyToLoadMap[source.path!]"
        :search-query="debouncedSearchQuery"
        @state-change="updateAvailability"
        @loaded="handleSourceLoaded"
      />
    </TransitionGroup>
    <div
      v-if="hiddenCount > 0 && !loading"
      class="flex items-center justify-center gap-2 text-muted-foreground/60 text-xs py-4"
    >
      <EyeOff class="h-3 w-3" />
      <span>已隐藏 {{ hiddenCount }} 个不可用数据源</span>
    </div>
  </div>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* 确保移动中的元素在离开时不占据网格空间 */
.list-leave-active {
  position: absolute;
}
</style>
