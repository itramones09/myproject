import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "My Web App",
  description: "Next.js frontend with FastAPI backend and Gemini AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            display: "flex",
            gap: "20px",
            padding: "16px 24px",
            borderBottom: "1px solid #ddd",
            alignItems: "center",
          }}
        >
          <Link href="/">Home</Link>
          <Link href="/todos">Todo List</Link>
          <Link href="/health-assistant">Health Assistant</Link>
          <Link href="/users">Users</Link>
          <Link href="/about">About</Link>
          <Link href="/login">Login</Link>
          <Link href="/signup">Signup</Link>
        </nav>

        {children}
      </body>
    </html>
  );
}