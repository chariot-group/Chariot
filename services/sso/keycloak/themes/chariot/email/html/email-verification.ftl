<!DOCTYPE html>
<html lang="${locale!"en"}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${msg("emailVerificationSubject")}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
            color: #1a1a1a;
        }
        .content p {
            margin: 0 0 20px;
            line-height: 1.6;
            font-size: 16px;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .footer {
            padding: 30px;
            text-align: center;
            background-color: #f9f9f9;
            border-top: 1px solid #e5e5e5;
            color: #666666;
            font-size: 14px;
        }
        .footer p {
            margin: 5px 0;
        }
        .footer a {
            color: #6366f1;
            text-decoration: none;
        }
        .link-text {
            word-break: break-all;
            color: #6366f1;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Chariot</h1>
        </div>
        <div class="content">
            <p>${msg("emailVerificationBodyHtml",link, linkExpiration, realmName, linkExpirationFormatter(linkExpiration))}</p>
            
            <a href="${link}" class="button">${msg("emailVerificationButton")}</a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666666;">
                ${msg("emailVerificationInfo")}
            </p>
            
            <div class="link-text">
                ${msg("emailVerificationLinkLabel")}<br>
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
