<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  // 初始化时检查本地存储的token
  authStore.checkAuth()
})
</script>

<style scoped>
#app {
  min-height: 100vh;
}
</style> 