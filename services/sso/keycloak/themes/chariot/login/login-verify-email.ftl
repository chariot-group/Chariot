<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "header">
        Vérifier votre email
    <#elseif section = "form">
        <p class="instruction">Un email contenant des instructions pour vérifier votre adresse email a été envoyé.</p>
        <p class="instruction">
            Vous n'avez pas reçu de code de vérification dans votre email ?
            <br/>
            <a href="${url.loginAction}">Cliquez ici</a> pour renvoyer l'email.
        </p>
    <#elseif section = "info">
    </#if>
</@layout.registrationLayout>
