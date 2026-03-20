<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HotItem } from '@/api'

const props = defineProps<{
  item: HotItem
  rank?: number
  hideDesc?: boolean
  maxDescLen?: number
  filterImages?: boolean
  expandable?: boolean
}>()

const isExpanded = ref(false)

const descriptionInfo = computed(() => {
  if (!props.item.desc) return { text: '', isTruncated: false }

  let desc = props.item.desc
  // 1. 过滤图片
  if (props.filterImages) {
    desc = desc.replace(/<img[^>]*>/g, '')
  }

  // 2. 剥离所有 HTML 标签以计算纯文本长度和安全截断
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = desc
  const plainText = tempDiv.textContent || tempDiv.innerText || ''

  const limit = props.maxDescLen || 0
  if (limit > 0 && plainText.length > limit && !isExpanded.value) {
    return {
      text: plainText.substring(0, limit) + '...',
      isTruncated: true,
    }
  }

  return {
    text: plainText,
    isTruncated: false,
  }
})

const shouldShowDesc = computed(() => {
  if (props.hideDesc) return false
  if (!props.item.desc) return false
  if (props.item.desc === '该视频暂无简介' || props.item.desc === '-') return false
  if (!descriptionInfo.value.text) return false
  return true
})

const toggleExpand = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  isExpanded.value = !isExpanded.value
}
const formattedHot = computed(() => {
  if (!props.item.hot) return ''
  const hotStr = props.item.hot.toString()

  // 如果已经是包含汉字（如“万”）的格式，保持原样
  if (/[一-龥]/.test(hotStr)) return hotStr

  const hotNum = parseFloat(hotStr)
  if (isNaN(hotNum)) return hotStr

  if (hotNum >= 1000) {
    return (hotNum / 1000).toFixed(1) + 'k'
  }

  return hotStr
})
</script>

<template>
  <a
    :href="item.url"
    target="_blank"
    class="flex items-center gap-2 py-2 px-1 hover:bg-accent rounded-md transition-colors group cursor-pointer min-h-[40px]"
  >
    <div v-if="rank !== undefined" class="shrink-0 w-6 text-center leading-none">
      <span
        class="text-sm font-medium"
        :class="[rank <= 3 ? 'text-orange-500' : 'text-muted-foreground/60']"
      >
        {{ rank }}
      </span>
    </div>
    <div class="flex-1 min-w-0 flex flex-col justify-center">
      <h4
        class="text-sm font-normal text-foreground group-hover:text-primary transition-colors wrap-break-word leading-tight"
        v-html="item.title"
      ></h4>
      <div v-if="shouldShowDesc" class="mt-1">
        <p
          class="text-xs text-muted-foreground wrap-break-word leading-relaxed"
          v-html="descriptionInfo.text"
        ></p>
        <button
          v-if="expandable && (descriptionInfo.isTruncated || isExpanded)"
          @click="toggleExpand"
          class="text-[10px] text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 mt-0.5 font-medium transition-colors"
        >
          {{ isExpanded ? '收起' : '展开' }}
        </button>
      </div>
    </div>

    <div v-if="item.hot" class="shrink-0 leading-none">
      <span class="text-[10px] text-muted-foreground/60">
        {{ formattedHot }}
      </span>
    </div>
  </a>
</template>
