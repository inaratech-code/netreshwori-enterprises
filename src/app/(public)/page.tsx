import dynamic from "next/dynamic";
import HeroSlider from "@/components/home/HeroSlider";

const FeaturedCategories = dynamic(() => import("@/components/home/FeaturedCategories"), { ssr: true });
const DealershipPartners = dynamic(() => import("@/components/home/DealershipPartners"), { ssr: true });
const Testimonials = dynamic(() => import("@/components/home/Testimonials"), { ssr: true });

export default function Home() {
    return (
        <>
            <HeroSlider />
            <FeaturedCategories />
            <DealershipPartners />
            <Testimonials />
        </>
    );
}
