<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>{{ t('login.title') }}</h1>
        <p>{{ t('login.subtitle') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">{{ t('common.email') }}</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            :placeholder="t('common.email')"
            required
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password">{{ t('common.password') }}</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            :placeholder="t('common.password')"
            required
          />
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <div v-if="errors.general" class="error-banner">
          {{ errors.general }}
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? t('common.loading') : t('login.loginButton') }}
        </button>
      </form>

      <div class="auth-links">
        <router-link to="/forgot-password" class="link">
          {{ t('login.forgotPassword') }}
        </router-link>
        <p class="signup-prompt">
          {{ t('login.noAccount') }}
          <router-link to="/signup" class="link">{{ t('login.signupLink') }}</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { keycloakService } from '../services/keycloak'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    
    const formData = ref({
      email: '',
      password: ''
    })
    
    const errors = ref({})
    const loading = ref(false)

    const validateForm = () => {
      errors.value = {}
      
      if (!formData.value.email) {
        errors.value.email = t('login.errors.emailRequired')
      }
      
      if (!formData.value.password) {
        errors.value.password = t('login.errors.passwordRequired')
      }
      
      return Object.keys(errors.value).length === 0
    }

    const handleLogin = async () => {
      if (!validateForm()) return
      
      loading.value = true
      errors.value = {}
      
      try {
        const response = await keycloakService.login(
          formData.value.email,
          formData.value.password
        )
        
        // Store tokens
        localStorage.setItem('access_token', response.access_token)
        localStorage.setItem('refresh_token', response.refresh_token)
        
        // Redirect to success page or dashboard
        console.log('Login successful', response)
        alert('Login successful!')
        
      } catch (error) {
        console.error('Login error:', error)
        errors.value.general = t('login.errors.invalidCredentials')
      } finally {
        loading.value = false
      }
    }

    return {
      formData,
      errors,
      loading,
      handleLogin,
      t
    }
  }
}
</script>

<style scoped src="../assets/auth.css"></style>
