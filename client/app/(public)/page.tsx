import Hero from "@/components/public/sections/hero";
import Features from "@/components/public/sections/features";
import Process from "@/components/public/sections/process";
import Pricing from "@/components/public/sections/pricing";
import Faqs from "@/components/public/sections/faqs";
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