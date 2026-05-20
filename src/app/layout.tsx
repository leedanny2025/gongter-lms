import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "공터 영어 학원 - 학습 관리 시스템",
  description: "공터 영어 학원 학습 관리 시스템",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '공터 LMS',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ServiceWorkerRegister />
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
