${msg("emailVerificationSubject")}

${msg("emailVerificationBody",link, linkExpiration, realmName, linkExpirationFormatter(linkExpiration))}

${msg("emailVerificationButton")}:
${link}

${msg("emailVerificationInfo")}

---
© ${.now?string("yyyy")} Chariot. ${msg("emailFooterCopyright")}
${msg("emailFooterSupport")}
