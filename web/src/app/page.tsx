import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ProductStage from "@/components/ProductStage";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProductStage />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
