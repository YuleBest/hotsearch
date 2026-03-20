<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Star, ChevronRight } from 'lucide-vue-next'
import { getHotSearch, type HotItem, type RouteItem, type HotResponse } from '@/api'
import { useFavoritesStore } from '@/store/favorites'
import { getSourceTitle, getHideDesc, getMaxDescLen, getFilterImages } from '@/hot-config'
import { getCache, setCache } from '@/utils/cache'

import HotItemComponent from './HotItem.vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps<{
  source: RouteItem
  readyToLoad?: boolean
  searchQuery?: string
}>()

const emit = defineEmits<{
  (e: 'state-change', path: string, isAvailable: boolean): void
  (e: 'loaded', path: string, items: HotItem[]): void
}>()

const router = useRouter()
const favoritesStore = useFavoritesStore()
const items = ref<HotItem[]>([])
const loading = ref(true)
const error = ref(false)
const apiTitle = ref('')

const displayTitle = computed(() => {
  return apiTitle.value || getSourceTitle(props.source.name)
})

const filteredItems = computed(() => {
  if (!props.searchQuery) return items.value
  const query = props.searchQuery.toLowerCase()
  return items.value.filter((item) => item.title.toLowerCase().includes(query))
})

const isAvailable = computed(() => {
  if (loading.value) return true // 加载中先认为可用
  return !error.value && items.value.length >= 3
})

watch(isAvailable, (val) => {
  if (props.source.path) {
    emit('state-change', props.source.path, val)
  }
})

const fetchData = async (force = false) => {
  if (!props.source.path) return

  // 检查缓存
  if (!force) {
    const cached = getCache<HotResponse>(props.source.path)
    if (cached) {
      items.value = cached.data.slice(0, 10)
      apiTitle.value = cached.title || ''
      loading.value = false
      emit('loaded', props.source.path, items.value)
      return
    }
  }

  loading.value = true
  error.value = false
  try {
    const response = await getHotSearch(props.source.path)
    if (response && response.data && response.data.length > 0) {
      items.value = response.data.slice(0, 10)
      apiTitle.value = response.title || ''
      setCache(props.source.path, response)
    } else {
      error.value = true
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
    if (props.source.path) {
      emit('loaded', props.source.path, items.value)
    }
  }
}

onMounted(() => {
  if (props.readyToLoad) {
    fetchData()
  }
})

watch(
  () => props.readyToLoad,
  (val) => {
    if (val && loading.value && items.value.length === 0 && !error.value) {
      fetchData()
    }
  },
)

const navigateToDetail = () => {
  const path = props.source.path?.replace('/', '')
  if (path) {
    router.push(`/${path}`)
  }
}

const toggleFavorite = () => {
  if (props.source.path) {
    favoritesStore.toggleFavorite(props.source.path)
  }
}
</script>

<template>
  <Card
    v-if="isAvailable"
    class="h-full border-border shadow-sm hover:shadow-md dark:shadow-neutral-950/20 transition-all duration-300 bg-card group/card overflow-hidden flex flex-col gap-0 py-0"
  >
    <CardHeader class="pt-3 pb-0 px-4 flex flex-row items-center justify-between space-y-0">
      <CardTitle
        class="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1 group/title"
        @click="navigateToDetail"
      >
        {{ displayTitle }}
        <ChevronRight
          class="h-3.5 w-3.5 text-muted-foreground/50 group-hover/title:text-primary transition-colors"
        />
      </CardTitle>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7 text-muted-foreground/50 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
        :class="{ 'text-orange-500': favoritesStore.isFavorite(source.path!) }"
        @click="toggleFavorite"
      >
        <Star
          class="h-3.5 w-3.5"
          :fill="favoritesStore.isFavorite(source.path!) ? 'currentColor' : 'none'"
        />
      </Button>
    </CardHeader>

    <CardContent class="px-3 pb-3 pt-1 flex-1 overflow-hidden flex flex-col">
      <div v-if="loading && items.length === 0" class="space-y-2 mt-0">
        <Skeleton v-for="i in 5" :key="i" class="h-7 w-full rounded-md" />
      </div>

      <TransitionGroup v-else name="stagger" tag="div" class="space-y-0 flex-1 relative">
        <HotItemComponent
          v-for="item in filteredItems"
          :key="item.title"
          :item="item"
          :rank="items.indexOf(item) + 1"
          :hide-desc="getHideDesc(source.name)"
          :max-desc-len="getMaxDescLen(source.name) || 20"
          :filter-images="getFilterImages(source.name)"
        />
      </TransitionGroup>
    </CardContent>
  </Card>
</template>

<style scoped>
.stagger-move,
.stagger-enter-active,
.stagger-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.stagger-enter-from,
.stagger-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

.stagger-leave-active {
  position: absolute;
  width: calc(100% - 24px);
}
</style>
