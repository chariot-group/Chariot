<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        Connexion
    <#elseif section = "form">
        <#if realm.password>
            <form id="kc-form-card" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                
                <!-- Partie 1: Champs de saisie -->
                <div class="form-fields">
                    <div class="${properties.kcFormGroupClass!}">
                        <input tabindex="1" id="username" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="off"
                               aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
                               placeholder="Email"
                        />
                        <#if messagesPerField.existsError('username','password')>
                            <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                            </span>
                        </#if>
                    </div>

                    <div class="${properties.kcFormGroupClass!}">
                        <div class="password-wrapper">
                            <input tabindex="2" id="password" name="password" type="password" autocomplete="off"
                                   aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
                                   placeholder="Mot de passe"
                            />
                            <button type="button" class="toggle-password" aria-label="Afficher le mot de passe">
                                <svg class="eye-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path class="eye-open" d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5ZM12 17.5C9.24 17.5 7 15.26 7 12.5C7 9.74 9.24 7.5 12 7.5C14.76 7.5 17 9.74 17 12.5C17 15.26 14.76 17.5 12 17.5ZM12 9.5C10.34 9.5 9 10.84 9 12.5C9 14.16 10.34 15.5 12 15.5C13.66 15.5 15 14.16 15 12.5C15 10.84 13.66 9.5 12 9.5Z" fill="white"/>
                                    <path class="eye-closed" style="display: none;" d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.49 22.26 13.86 23 12C21.27 7.61 17 4.5 12 4.5C10.6 4.5 9.26 4.75 8.04 5.2L10.17 7.33C10.74 7.11 11.35 7 12 7ZM2 4.27L4.28 6.55L4.74 7.01C3.08 8.3 1.78 10.02 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.8 19.08L19.73 22L21 20.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8ZM11.84 9.02L14.99 12.17L15.01 12.01C15.01 10.35 13.67 9.01 12.01 9.01L11.84 9.02Z" fill="white"/>
                                </svg>
                            </button>
                        </div>
                        <div id="kc-form-options">
                            <#if realm.resetPasswordAllowed>
                                <span>Vous avez croisé un flageleur mental ? <a tabindex="5" href="${url.loginResetCredentialsUrl}">Mot de passe oublié</a></span>
                            </#if>
                        </div>
                    </div>
                </div>

                <!-- Partie 2: Bouton submit et inscription -->
                <div class="form-submit">
                    <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                    <input tabindex="4" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" 
                           name="login" id="kc-login" type="submit" value="Se connecter"/>
                    
                    <div id="kc-registration-container">
                        <div id="kc-registration">
                            <span>Vous n'avez pas de compte ? <a tabindex="6" href="${url.registrationUrl}">Inscrivez-vous</a></span>
                        </div>
                    </div>
                </div>
            </form>
        </#if>
    </#if>

</@layout.registrationLayout>
