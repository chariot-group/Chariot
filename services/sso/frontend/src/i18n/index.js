import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'
import es from './locales/es.json'

const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem('locale') || 'fr',
    fallbackLocale: 'fr',
    messages: {
        fr,
        en,
        es
    }
})

export default i18n
