<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>{{ t('signup.title') }}</h1>
        <p>{{ t('signup.subtitle') }}</p>
      </div>

      <form @submit.prevent="handleSignup" class="auth-form">
        <div class="form-group">
          <label for="username">{{ t('common.username') }}</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            :placeholder="t('common.username')"
            required
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="firstName">{{ t('common.firstName') }}</label>
            <input
              id="firstName"
              v-model="formData.firstName"
              type="text"
              :placeholder="t('common.firstName')"
              required
            />
            <span v-if="errors.firstName" class="error-message">{{ errors.firstName }}</span>
          </div>

          <div class="form-group">
            <label for="lastName">{{ t('common.lastName') }}</label>
            <input
              id="lastName"
              v-model="formData.lastName"
              type="text"
              :placeholder="t('common.lastName')"
              required
            />
            <span v-if="errors.lastName" class="error-message">{{ errors.lastName }}</span>
          </div>
        </div>

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

        <div class="form-group">
          <label for="confirmPassword">{{ t('common.confirmPassword') }}</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            :placeholder="t('common.confirmPassword')"
            required
          />
          <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
        </div>

        <div v-if="errors.general" class="error-banner">
          {{ errors.general }}
        </div>

        <div v-if="successMessage" class="success-banner">
          {{ successMessage }}
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? t('common.loading') : t('signup.signupButton') }}
        </button>
      </form>

      <div class="auth-links">
        <p class="signup-prompt">
          {{ t('signup.alreadyAccount') }}
          <router-link to="/login" class="link">{{ t('signup.loginLink') }}</router-link>
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
  name: 'Signup',
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    
    const formData = ref({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    
    const errors = ref({})
    const loading = ref(false)
    const successMessage = ref('')

    const validateForm = () => {
      errors.value = {}
      
      if (!formData.value.username) {
        errors.value.username = t('signup.errors.usernameRequired')
      }
      
      if (!formData.value.firstName) {
        errors.value.firstName = t('signup.errors.firstNameRequired')
      }
      
      if (!formData.value.lastName) {
        errors.value.lastName = t('signup.errors.lastNameRequired')
      }
      
      if (!formData.value.email) {
        errors.value.email = t('signup.errors.emailRequired')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
        errors.value.email = t('signup.errors.emailInvalid')
      }
      
      if (!formData.value.password) {
        errors.value.password = t('signup.errors.passwordRequired')
      } else if (formData.value.password.length < 8) {
        errors.value.password = t('signup.errors.passwordMinLength')
      }
      
      if (formData.value.password !== formData.value.confirmPassword) {
        errors.value.confirmPassword = t('signup.errors.passwordMismatch')
      }
      
      return Object.keys(errors.value).length === 0
    }

    const handleSignup = async () => {
      if (!validateForm()) return
      
      loading.value = true
      errors.value = {}
      successMessage.value = ''
      
      try {
        await keycloakService.signup({
          username: formData.value.username,
          firstName: formData.value.firstName,
          lastName: formData.value.lastName,
          email: formData.value.email,
          password: formData.value.password
        })
        
        successMessage.value = t('signup.success.accountCreated')
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login')
        }, 2000)
        
      } catch (error) {
        console.error('Signup error:', error)
        if (error.errorMessage?.includes('User exists')) {
          errors.value.general = t('signup.errors.userExists')
        } else {
          errors.value.general = t('signup.errors.serverError')
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
      handleSignup,
      t
    }
  }
}
</script>

<style scoped src="../assets/auth.css"></style>
