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


// Helper function to shuffle array
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

import { Helmet } from 'react-helmet-async';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((res) => {
        const data = res.data?.data?.docs || res.data?.data?.products || res.data?.data;
        const fetchedProducts = Array.isArray(data) ? data : [];
        if (fetchedProducts.length > 0) {
          setProducts(shuffle(fetchedProducts).slice(0, 7));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Split selected products: 3 for Hero stack, 4 for FeaturedProducts grid
  const heroProducts = products.slice(0, 3);
  const featuredProducts = products.slice(3, 7);

  return (
    <div id="home" className="min-h-screen bg-white text-black font-space selection:bg-black selection:text-white overflow-x-hidden antialiased">
      <Helmet>
        <title>RockeryXPrints | Premium Art Prints & Collections</title>
        <meta name="description" content="Discover premium, brutalist-inspired art prints. High-quality posters, canvases, and limited edition collections." />
        <meta property="og:title" content="RockeryXPrints | Premium Art Prints" />
        <meta property="og:description" content="Discover premium, brutalist-inspired art prints. High-quality posters and limited edition collections." />
        <meta property="og:type" content="website" />
      </Helmet>
      <ServerWarmupBanner />
      <Navbar />
      <main className="pt-20">
        <CollectionsShowcase />
        <div className="hidden md:block">
          <Hero products={heroProducts} loading={loading} />
        </div>
        <FeaturedProducts products={featuredProducts} loading={loading} />
        <BentoAbout />
      </main>
      <Footer />
    </div>
  );
}