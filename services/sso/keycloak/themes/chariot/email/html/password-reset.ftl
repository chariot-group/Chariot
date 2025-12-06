<!DOCTYPE html>
<html lang="${locale!"en"}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${msg("passwordResetSubject")}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #0C0C0C;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #19191C;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(170, 0, 255, 0.2);
        }
        .header {
            background: linear-gradient(135deg, #AA00FF 0%, #7700BB 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #FFFFFF;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
            color: #FFFFFF;
        }
        .content p {
            margin: 0 0 20px;
            line-height: 1.6;
            font-size: 16px;
            color: #FFFFFF;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #AA00FF 0%, #7700BB 100%);
            color: #FFFFFF !important;
            text-decoration: none;
            border-radius: 36px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(170, 0, 255, 0.4);
        }
        .footer {
            padding: 30px;
            text-align: center;
            background-color: #0C0C0C;
            border-top: 1px solid #2A2A2E;
            color: #888888;
            font-size: 14px;
        }
        .footer p {
            margin: 5px 0;
            color: #888888;
        }
        .footer a {
            color: #AA00FF;
            text-decoration: none;
        }
        .link-text {
            word-break: break-all;
            color: #AA00FF;
            font-size: 14px;
            margin-top: 20px;
        }
        .link-text a {
            color: #AA00FF;
            text-decoration: none;
        }
        .warning {
            background-color: #2A1A00;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning p {
            color: #FCD34D !important;
        }
        .warning strong {
            color: #FBBF24;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Chariot</h1>
        </div>
        <div class="content">
            <p>${msg("passwordResetBodyHtml")?no_esc}</p>
            
            <a href="${link}" class="button">${msg("passwordResetButton")}</a>
            
            <div class="warning">
                <p style="margin: 0; font-size: 14px;">
                    <strong>${msg("passwordResetWarning")}</strong><br>
                    ${msg("passwordResetWarningText")}
                </p>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #888888;">
                ${msg("passwordResetInfo")}
            </p>
            
            <div class="link-text">
                ${msg("passwordResetLinkLabel")}<br>
                <a href="${link}">${link}</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${.now?string("yyyy")} Chariot. ${msg("emailFooterCopyright")}</p>
            <p>${msg("emailFooterSupport")}</p>
        </div>
    </div>
</body>
</html>
