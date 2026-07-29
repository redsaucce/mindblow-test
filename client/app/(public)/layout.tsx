import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import LegalModal from "@/components/public/modal/legal";
import AuthModal from "@/components/public/modal/auth";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <LegalModal />
      <AuthModal />
    </>
  );
}