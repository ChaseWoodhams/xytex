"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote:
      "Xytex made our dream of becoming parents a reality. The staff was incredibly supportive throughout our journey, and having access to adult photos of our donor meant so much to us. Our daughter is now 3 years old, and we couldn't be happier.",
    author: "Sarah & Emily",
    location: "Portland, OR",
    type: "Same-sex couple",
    rating: 5,
  },
  {
    id: 2,
    quote:
      "As a single mother by choice, I had so many questions and concerns. Xytex's team took the time to walk me through everything—from choosing a donor to understanding the shipping process. The identity disclosure option was crucial for me, knowing my son will have that choice when he's older.",
    author: "Jennifer M.",
    location: "Austin, TX",
    type: "Single mother by choice",
    rating: 5,
  },
  {
    id: 3,
    quote:
      "After years of infertility struggles, we finally found hope with Xytex. The comprehensive genetic testing gave us peace of mind, and being able to see both baby and adult photos helped us feel connected to our donor. Now we're expecting twins!",
    author: "Maria & David",
    location: "Chicago, IL",
    type: "Couple with infertility",
    rating: 5,
  },
  {
    id: 4,
    quote:
      "The 50% buyback guarantee was what initially drew us to Xytex, but we stayed because of their exceptional service. We purchased extra vials for future siblings, and the free storage gave us flexibility in our family planning.",
    author: "Amanda & Rachel",
    location: "Denver, CO",
    type: "Same-sex couple",
    rating: 5,
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <section 
      className="section-padding bg-white"
      aria-labelledby="testimonials-heading"
    >
      <div className="container-custom">
        {/* Section Header - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="text-gold-600 font-medium text-sm uppercase tracking-wider">
            Success Stories
          </span>
          <h2 
            id="testimonials-heading"
            className="mt-4 text-navy-900"
          >
            Trusted by Families in 35+ Countries
          </h2>
          <div className="divider-gold mx-auto mt-6" />
          <p className="mt-8 text-lg text-navy-700 max-w-2xl mx-auto leading-relaxed">
            Real stories from families who have built their dreams with Xytex.
          </p>
        </motion.div>

        {/* Testimonial Carousel - Enhanced */}
        <div className="relative max-w-4xl mx-auto">
          {/* Quote Icon */}
          <div className="absolute -top-6 left-0 md:left-12 z-10" aria-hidden="true">
            <div className="w-16 h-16 rounded-2xl bg-gold-500 flex items-center justify-center shadow-lg">
              <Quote className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Testimonial Card - Enhanced spacing */}
          <div className="relative bg-cream-50 rounded-3xl p-8 md:p-12 lg:p-16 pt-20 overflow-hidden shadow-lg">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" aria-hidden="true" />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="relative z-10"
              >
                {/* Stars - Enhanced */}
                <div className="flex gap-1 mb-6" aria-label={`${testimonials[currentIndex].rating} out of 5 stars`}>
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-gold-500 fill-gold-500"
                      aria-hidden="true"
                    />
                  ))}
                </div>

                {/* Quote - Enhanced typography */}
                <blockquote className="text-xl md:text-2xl lg:text-3xl text-navy-900 font-heading leading-relaxed mb-10">
                  &ldquo;{testimonials[currentIndex].quote}&rdquo;
                </blockquote>

                {/* Author - Enhanced */}
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-xl shadow-md"
                    aria-hidden="true"
                  >
                    {testimonials[currentIndex].author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-navy-900">
                      {testimonials[currentIndex].author}
                    </div>
                    <div className="text-sm text-navy-600 mt-1">
                      {testimonials[currentIndex].type} •{" "}
                      {testimonials[currentIndex].location}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation - Enhanced */}
          <div className="flex items-center justify-between mt-10">
            {/* Dots */}
            <div className="flex gap-2" role="tablist" aria-label="Testimonial navigation">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-gold-500 w-8"
                      : "bg-navy-200 hover:bg-navy-300"
                  }`}
                  aria-label={`Go to testimonial ${index + 1} of ${testimonials.length}`}
                  aria-selected={index === currentIndex}
                  role="tab"
                />
              ))}
            </div>

            {/* Arrows - Enhanced */}
            <div className="flex gap-3">
              <button
                onClick={prev}
                className="w-12 h-12 rounded-full border-2 border-navy-200 flex items-center justify-center text-navy-600 hover:border-gold-500 hover:text-gold-600 hover:bg-gold-50 transition-all shadow-sm"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                onClick={next}
                className="w-12 h-12 rounded-full border-2 border-navy-200 flex items-center justify-center text-navy-600 hover:border-gold-500 hover:text-gold-600 hover:bg-gold-50 transition-all shadow-sm"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
