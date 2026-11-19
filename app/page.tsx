import { Hero } from "@/components/home/hero";
import { FeaturedServices } from "@/components/home/featured-services";
import { Categories } from "@/components/home/categories";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedServices />
      <Categories />
    </>
  );
}
