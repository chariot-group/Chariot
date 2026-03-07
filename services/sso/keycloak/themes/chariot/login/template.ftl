<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <#assign themeVersion=properties.themeVersion!'1'>
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <link rel="icon" href="${url.resourcesPath}/img/logo.svg" type="image/svg+xml" />
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}?v=${themeVersion}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}?v=${themeVersion}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}?v=${themeVersion}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="text/javascript">
        document.addEventListener('DOMContentLoaded', function() {
            const toggleBtns = document.querySelectorAll('.toggle-password');
            toggleBtns.forEach(function(toggleBtn) {
                toggleBtn.addEventListener('click', function() {
                    const passwordWrapper = this.closest('.password-wrapper');
                    const passwordInput = passwordWrapper.querySelector('input');
                    const eyeOpen = this.querySelector('.eye-open');
                    const eyeClosed = this.querySelector('.eye-closed');
                    
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        eyeOpen.style.display = 'none';
                        eyeClosed.style.display = 'block';
                        this.setAttribute('aria-label', 'Masquer le mot de passe');
                    } else {
                        passwordInput.type = 'password';
                        eyeOpen.style.display = 'block';
                        eyeClosed.style.display = 'none';
                        this.setAttribute('aria-label', 'Afficher le mot de passe');
                    }
                });
            });
        });
    </script>
</head>

<body class="${properties.kcBodyClass!}">
<div class="${properties.kcLoginClass!} login-pf-page">
    <!-- Logo en haut à droite -->
    <div class="logo-container">
        <img src="${url.resourcesPath}/img/logo.svg" width="87" height="34" alt="Chariot Logo" class="logo-image"/>
    </div>

    <div id="kc-container" class="${properties.kcContainerClass!}">
        <div id="kc-container-wrapper" class="${properties.kcContainerWrapperClass!}">
            
            <div id="kc-content">
                <div id="kc-content-wrapper">

                    <#-- App-initiated actions should not see warning messages about the need to complete the action -->
                    <#-- during login.                                                                               -->
                    <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                        <div class="alert alert-${message.type}">
                            <#if message.type = 'success'><span class="${properties.kcFeedbackSuccessIcon!}"></span></#if>
                            <#if message.type = 'warning'><span class="${properties.kcFeedbackWarningIcon!}"></span></#if>
                            <#if message.type = 'error'><span class="${properties.kcFeedbackErrorIcon!}"></span></#if>
                            <#if message.type = 'info'><span class="${properties.kcFeedbackInfoIcon!}"></span></#if>
                            <span class="kc-feedback-text">${kcSanitize(message.summary)?no_esc}</span>
                        </div>
                    </#if>

                    <div id="kc-form" class="${properties.kcFormCardClass!} card-pf">
                        <div id="kc-header" class="${properties.kcHeaderClass!}">
                            <div id="kc-header-wrapper" class="${properties.kcHeaderWrapperClass!}">
                                <#nested "header">
                            </div>
                        </div>
                        
                        <div id="kc-form-wrapper">
                            <#nested "form">

                            <#if displayInfo>
                                <div id="kc-info" class="${properties.kcSignUpClass!}">
                                    <div id="kc-info-wrapper" class="${properties.kcInfoAreaWrapperClass!}">
                                        <#nested "info">
                                    </div>
                                </div>
                            </#if>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    </div>
</div>
</body>
</html>
</#macro>
