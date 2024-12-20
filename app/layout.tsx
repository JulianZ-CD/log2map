import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Log2Map",
  description: "Visualize Location Data in 3D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col items-center">
              <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                  <div className="flex gap-5 items-center font-semibold">
                    <Link href={"/"}>Home</Link>
                    <Link href={"/location-parser"}>Location Parser</Link>
                    <Link href={"/3d-map"}>3D Google Map</Link>
                    {/* <Link href={"/distance-calculator"}>
                      Distance Calculator
                    </Link> */}
                    <Link href={"/leaflet-2d-map"}>2D Leaflet Map</Link>
                  </div>
                  {/* TODO: Add authentication in the future */}
                  {/* {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />} */}
                </div>
                <div className="flex gap-5 items-center">
                  <ThemeSwitcher />
                </div>
              </nav>
              <div className="flex flex-col max-w-5xl p-5 flex-grow">
                {children}
              </div>

              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-4 py-4">
                <p>
                  Hello. This is a project by Julian.{" "}
                  <a
                    href="https://github.com/JulianZ-CD/log2map"
                    target="_blank"
                    className="font-bold hover:underline"
                    rel="noreferrer"
                  >
                    Github
                  </a>
                </p>
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
