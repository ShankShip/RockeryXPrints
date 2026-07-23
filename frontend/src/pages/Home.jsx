// src/pages/Home.jsx — Landing page shell with randomized database products
import { useState, useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import CollectionsShowcase from '../components/landing/CollectionsShowcase';
import FeaturedProducts from '../components/landing/FeaturedProducts';
import BentoAbout from '../components/landing/BentoAbout';
import Footer from '../components/landing/Footer';
import ServerWarmupBanner from '../components/ServerWarmupBanner';
import { getProducts } from '../services/api';
import { mockProducts } from '../data/mockData';

// Helper function to shuffle array
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts()
      .then((res) => {
        const data = res.data?.data?.docs || res.data?.data?.products || res.data?.data;
        const fetchedProducts = Array.isArray(data) ? data : [];
        
        if (fetchedProducts.length > 0) {
          let randomized = shuffle(fetchedProducts);
          if (randomized.length < 7) {
            const shuffledMocks = shuffle(mockProducts);
            shuffledMocks.forEach(mp => {
              if (randomized.length < 7 && !randomized.some(p => p.slug === mp.slug)) {
                randomized.push(mp);
              }
            });
          }
          setProducts(randomized.slice(0, 7));
        } else {
          const shuffled = shuffle(mockProducts);
          setProducts(shuffled.slice(0, 7));
        }
      })
      .catch(() => {
        const shuffled = shuffle(mockProducts);
        setProducts(shuffled.slice(0, 7));
      });
  }, []);

  // Split selected products: 3 for Hero stack, 4 for FeaturedProducts grid
  const heroProducts = products.slice(0, 3);
  const featuredProducts = products.slice(3, 7);

  return (
    <div id="home" className="min-h-screen bg-white text-black font-space selection:bg-black selection:text-white overflow-x-hidden antialiased">
      <ServerWarmupBanner />
      <Navbar />
      <main className="pt-20">
        <CollectionsShowcase />
        <Hero products={heroProducts} />
        <FeaturedProducts products={featuredProducts} />
        <BentoAbout />
      </main>
      <Footer />
    </div>
  );
}