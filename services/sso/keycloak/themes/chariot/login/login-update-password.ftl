<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>
    <#if section = "header">
        Réinitialiser votre mot de passe
    <#elseif section = "form">
        <form id="kc-form-card" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
            <div class="form-fields">
                <input type="text" id="username" name="username" value="${username}" autocomplete="username"
                    readonly="readonly" style="display:none;"/>
                <input type="password" id="password" name="password" autocomplete="current-password" style="display:none;"/>

                <div class="${properties.kcFormGroupClass!}">
                    <input type="password" id="password-new" name="password-new" 
                        autofocus autocomplete="new-password"
                        aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>"
                        placeholder="Nouveau mot de passe"
                    />

                    <#if messagesPerField.existsError('password')>
                        <span id="input-error-password" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('password'))?no_esc}
                        </span>
                    </#if>
                </div>

                <div class="${properties.kcFormGroupClass!}">
                    <input type="password" id="password-confirm" name="password-confirm"
                        class="${properties.kcInputClass!}"
                        autocomplete="new-password"
                        aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
                        placeholder="Confirmer le mot de passe"
                    />

                    <#if messagesPerField.existsError('password-confirm')>
                        <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                        </span>
                    </#if>
                </div>
            </div>

            <div class="form-submit">
                <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="Valider" />
            </div>
        </form>
    </#if>
</@layout.registrationLayout>
