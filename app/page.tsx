import { Hero } from "@/components/home/hero";
import { FeaturedServices } from "@/components/home/featured-services";
import { Categories } from "@/components/home/categories";
import { WhyChoose } from "@/components/home/why-choose";
import { HowItWorks } from "@/components/home/how-it-works";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedServices />
      <Categories />
      <WhyChoose />
      <HowItWorks />
    </>
  );
}
