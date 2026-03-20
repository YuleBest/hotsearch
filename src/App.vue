<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useColorMode } from '@vueuse/core'

useColorMode()
</script>

<template>
  <div
    class="min-h-screen bg-background font-sans text-foreground antialiased transition-colors duration-300"
  >
    <main class="container mx-auto px-6 sm:px-12 md:px-8 pt-12 pb-32 max-w-7xl">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <footer class="border-t border-border py-8 bg-muted/30">
      <div class="container mx-auto px-4 text-center max-w-7xl">
        <p class="text-sm text-muted-foreground">© 2026 热搜查看. 所有数据源均来自互联网.</p>
      </div>
    </footer>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

body {
  margin: 0;
}
</style>
