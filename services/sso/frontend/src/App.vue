<template>
  <div id="app">
    <LanguageSwitcher />
    <router-view />
  </div>
</template>

<script>
import LanguageSwitcher from './components/LanguageSwitcher.vue'

export default {
  name: 'App',
  components: {
    LanguageSwitcher
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
