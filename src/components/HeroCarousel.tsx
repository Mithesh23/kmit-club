import { useState, useEffect } from 'react';

interface HeroCarouselProps {
  images: string[];
  interval?: number;
}

export const HeroCarousel = ({ images, interval = 5000 }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((image, index) => (
        <div
          key={index}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${image})`,
            opacity: currentIndex === index ? 1 : 0,
            zIndex: currentIndex === index ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
};
