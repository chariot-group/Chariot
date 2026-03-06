<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('username'); section>
    <#if section = "header">
        ${msg('resetPassword.header')}
    <#elseif section = "form">
        <form id="kc-form-card" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
            <div class="form-fields">
                <div class="${properties.kcFormGroupClass!}">

                    <input type="text" id="username" name="username"
                        autofocus value="${(auth.attemptedUsername!'')}"
                        aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                        placeholder="<#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>"
                    />

                    <#if messagesPerField.existsError('username')>
                        <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('username'))?no_esc}
                        </span>
                    </#if>
                </div>
            </div>


            <div class="form-submit button-row">
                <button type="button" class="cancel" onClick="location.href='${url.loginUrl}'">${msg('doCancel')}</button>
                <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg('doSubmit')}"/>
            </div>
            
        </form>
    <#elseif section = "info" >
        <p class="instruction">${msg('resetPassword.instruction')}</p>
    </#if>
</@layout.registrationLayout>
