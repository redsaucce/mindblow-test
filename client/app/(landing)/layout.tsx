import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import LegalModal from "@/components/landing/modal/legal";
import AuthModal from "@/components/landing/modal/auth";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
      <Footer showNewsletter />
      <LegalModal />
      <AuthModal />
    </>
  );
}