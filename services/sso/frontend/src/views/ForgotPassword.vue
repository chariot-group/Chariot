<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>{{ t('forgotPassword.title') }}</h1>
        <p>{{ t('forgotPassword.subtitle') }}</p>
      </div>

      <form @submit.prevent="handleResetPassword" class="auth-form">
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

        <div v-if="errors.general" class="error-banner">
          {{ errors.general }}
        </div>

        <div v-if="successMessage" class="success-banner">
          {{ successMessage }}
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? t('common.loading') : t('forgotPassword.resetButton') }}
        </button>
      </form>

      <div class="auth-links">
        <router-link to="/login" class="link">
          ← {{ t('forgotPassword.backToLogin') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { keycloakService } from '../services/keycloak'

export default {
  name: 'ForgotPassword',
  setup() {
    const { t } = useI18n()
    
    const formData = ref({
      email: ''
    })
    
    const errors = ref({})
    const loading = ref(false)
    const successMessage = ref('')

    const validateForm = () => {
      errors.value = {}
      
      if (!formData.value.email) {
        errors.value.email = t('forgotPassword.errors.emailRequired')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
        errors.value.email = t('forgotPassword.errors.emailInvalid')
      }
      
      return Object.keys(errors.value).length === 0
    }

    const handleResetPassword = async () => {
      if (!validateForm()) return
      
      loading.value = true
      errors.value = {}
      successMessage.value = ''
      
      try {
        await keycloakService.resetPassword(formData.value.email)
        successMessage.value = t('forgotPassword.success.emailSent')
        formData.value.email = ''
        
      } catch (error) {
        console.error('Reset password error:', error)
        if (error.message === 'User not found') {
          errors.value.general = t('forgotPassword.errors.userNotFound')
        } else {
          errors.value.general = t('forgotPassword.errors.serverError')
        }
      } finally {
        loading.value = false
      }
    }

    return {
      formData,
      errors,
      loading,
      successMessage,
      handleResetPassword,
      t
    }
  }
}
</script>

<style scoped src="../assets/auth.css"></style>
