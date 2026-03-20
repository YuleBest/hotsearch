<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useColorMode } from '@vueuse/core'
import { getHotSearch, type HotResponse } from '@/api'
import { useFavoritesStore } from '@/store/favorites'
import { getSourceTitle, getHideDesc, getFilterImages } from '@/hot-config'
import { getCache, setCache, getCacheTimestamp, clearCache } from '@/utils/cache'

import HotItemComponent from '@/components/HotItem.vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Star,
  ExternalLink,
  Clock,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

const route = useRoute()
const router = useRouter()
const favoritesStore = useFavoritesStore()

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

const sourcePath = computed(() => `/${route.params.source}`)
const sourceName = computed(() => route.params.source as string)

const displayTitle = computed(() => {
  return data.value?.title || getSourceTitle(sourceName.value)
})

const data = ref<HotResponse | null>(null)
const loading = ref(true)
const error = ref(false)
const lastRefreshTime = ref<number | null>(null)
const refreshCooldown = ref(0)
let cooldownTimer: number | null = null

const fetchData = async (force = false) => {
  if (!sourcePath.value) return

  // 检查缓存
  if (!force) {
    const cached = getCache<HotResponse>(sourcePath.value)
    if (cached) {
      data.value = cached
      lastRefreshTime.value = getCacheTimestamp(sourcePath.value)
      loading.value = false
      return
    }
  }

  loading.value = true
  error.value = false
  try {
    const response = await getHotSearch(sourcePath.value)
    if (response) {
      data.value = response
      setCache(sourcePath.value, response)
      lastRefreshTime.value = Date.now()
    } else {
      error.value = true
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
    setTimeout(() => {
      console.clear()
    }, 500)
  }
}

const handleManualRefresh = () => {
  if (refreshCooldown.value > 0 || loading.value) return

  clearCache(sourcePath.value)
  fetchData(true)
  startCooldown()
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

onMounted(() => {
  fetchData()
})

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

watch(
  () => route.params.source,
  () => {
    fetchData()
  },
)

const toggleFavorite = () => {
  favoritesStore.toggleFavorite(sourcePath.value)
}

const goBack = () => {
  router.push('/')
}

const formattedRefreshTime = computed(() => {
  if (!lastRefreshTime.value) return ''
  const date = new Date(lastRefreshTime.value)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
})

const formattedUpdateTime = computed(() => {
  if (!data.value?.updateTime) return ''
  const date = new Date(data.value.updateTime)
  return date.toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="flex items-center justify-between">
      <Button
        variant="ghost"
        size="sm"
        class="gap-1 px-2 text-muted-foreground hover:text-foreground hover:bg-accent"
        @click="goBack"
      >
        <ArrowLeft class="h-4 w-4" />
        返回
      </Button>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          @click="toggleTheme"
          class="h-9 w-9 rounded-full border-border bg-card"
          title="切换主题"
        >
          <Sun v-if="mode === 'light'" class="h-4 w-4 text-muted-foreground" />
          <Moon v-else-if="mode === 'dark'" class="h-4 w-4 text-muted-foreground" />
          <Monitor v-else class="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          @click="handleManualRefresh"
          :disabled="loading || refreshCooldown > 0"
          class="h-9 w-9 rounded-full border-border bg-card"
        >
          <RefreshCw class="h-4 w-4 text-muted-foreground" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="h-9 w-9 rounded-full border-border bg-card"
          :class="{
            'text-orange-500 border-orange-500/20 bg-orange-500/5':
              favoritesStore.isFavorite(sourcePath),
          }"
          @click="toggleFavorite"
        >
          <Star
            class="h-4 w-4"
            :fill="favoritesStore.isFavorite(sourcePath) ? 'currentColor' : 'none'"
          />
        </Button>
      </div>
    </div>

    <div class="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
      <div v-if="loading && !data" class="space-y-6">
        <div class="space-y-2">
          <Skeleton class="h-10 w-48" />
          <Skeleton class="h-4 w-32" />
        </div>
        <Separator class="my-6 bg-border" />
        <div class="space-y-4">
          <Skeleton v-for="i in 10" :key="i" class="h-12 w-full rounded-lg" />
        </div>
      </div>

      <div
        v-else-if="error && !data"
        class="flex flex-col items-center justify-center py-20 text-muted-foreground"
      >
        <p class="text-lg">加载详情失败</p>
        <Button
          variant="default"
          @click="fetchData(true)"
          class="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          重试
        </Button>
      </div>

      <div v-else-if="data" class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1.5 flex-1">
            <div class="flex items-center gap-3">
              <h1 class="text-3xl font-bold tracking-tight text-foreground">{{ displayTitle }}</h1>

              <Badge
                variant="secondary"
                class="bg-muted text-muted-foreground font-normal hover:bg-muted"
                >{{ data.type }}</Badge
              >
            </div>
            <div
              class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground/70 justify-between"
            >
              <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span v-if="formattedUpdateTime" class="flex items-center gap-1.5">
                  <Clock class="h-3.5 w-3.5" />
                  平台最后更新于 {{ formattedUpdateTime }}
                </span>
                <span v-if="refreshCooldown > 0" class="text-blue-500 dark:text-blue-400 text-xs">
                  刷新冷却中 ({{ refreshCooldown }}s)
                </span>
                <a
                  v-if="data.link"
                  :href="data.link"
                  target="_blank"
                  class="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ExternalLink class="h-3.5 w-3.5" />
                  原始链接
                </a>
              </div>
              <span v-if="formattedRefreshTime" class="text-[10px] text-muted-foreground/60">
                更新于 {{ formattedRefreshTime }}
              </span>
            </div>
          </div>
        </div>

        <Separator class="bg-border" />

        <ScrollArea class="h-[calc(100vh-20rem)] min-h-[400px] pr-4">
          <div class="space-y-1">
            <HotItemComponent
              v-for="(item, index) in data.data"
              :key="index"
              :item="item"
              :rank="index + 1"
              :hide-desc="getHideDesc(sourceName)"
              :max-desc-len="100"
              :expandable="true"
              :filter-images="getFilterImages(sourceName)"
              class="px-2 py-3 mb-1"
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  </div>
</template>
