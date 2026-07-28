import Hero from "@/components/landing/sections/hero";
import Features from "@/components/landing/sections/features";
import Process from "@/components/landing/sections/process";
import Pricing from "@/components/landing/sections/pricing";
import Faqs from "@/components/landing/sections/faqs";
import ScrollBar from "@/components/ui/scroll-bar";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Process />
      <Pricing />
      <Faqs />
      <ScrollBar />
    </>
  );
}