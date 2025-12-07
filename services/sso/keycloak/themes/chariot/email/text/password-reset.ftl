${msg("passwordResetSubject")}

${msg("passwordResetBody",link, linkExpiration, realmName, linkExpirationFormatter(linkExpiration))}

${msg("passwordResetButton")}:
${link}

${msg("passwordResetWarning")}
${msg("passwordResetWarningText")}

${msg("passwordResetInfo")}

---
© ${.now?string("yyyy")} Chariot. ${msg("emailFooterCopyright")}
${msg("emailFooterSupport")}
