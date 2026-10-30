// Auth screens render fullscreen without the app sidebar.
// The shared background lives here so adding future auth pages
// (e.g. recover-password) inherits it automatically.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#FBF4EC]">{children}</div>;
}
