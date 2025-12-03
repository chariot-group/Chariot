<template>
  <div class="language-switcher">
    <button 
      v-for="lang in languages" 
      :key="lang.code"
      @click="changeLanguage(lang.code)"
      :class="{ active: currentLocale === lang.code }"
      class="lang-btn"
    >
      {{ lang.label }}
    </button>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'LanguageSwitcher',
  setup() {
    const { locale } = useI18n()
    
    const languages = [
      { code: 'fr', label: 'FR' },
      { code: 'en', label: 'EN' },
      { code: 'es', label: 'ES' }
    ]

    const currentLocale = locale

    const changeLanguage = (lang) => {
      locale.value = lang
      localStorage.setItem('locale', lang)
    }

    return {
      languages,
      currentLocale,
      changeLanguage
    }
  }
}
</script>

<style scoped>
.language-switcher {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 1000;
}

.lang-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.lang-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.lang-btn.active {
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
  border-color: white;
}
</style>
