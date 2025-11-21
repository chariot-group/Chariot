import { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Chariot",
    robots: {
        index: false,
        follow: false,
    },
};

export default async function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;


    return (
        <html
            lang={locale}
            suppressHydrationWarning={true}>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                    {children}
            </body>
        </html>
    );
}
