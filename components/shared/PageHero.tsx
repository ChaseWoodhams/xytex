"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  titleHighlight?: string;
  description: string;
  primaryCTA?: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  trustItems?: string[];
  children?: ReactNode;
  variant?: "default" | "centered";
}

export default function PageHero({
  eyebrow,
  title,
  titleHighlight,
  description,
  primaryCTA,
  secondaryCTA,
  trustItems,
  children,
  variant = "default",
}: PageHeroProps) {
  return (
    <section className="relative min-h-[70vh] flex items-center bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212,165,116,0.3) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950/50 via-transparent to-gold-900/20" />

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl max-w-[calc(100vw-5rem)] max-h-[calc(100vw-5rem)]" />
      <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-navy-400/10 blur-3xl max-w-[calc(100vw-5rem)] max-h-[calc(100vw-5rem)]" />

      <div className="container-custom relative z-10 pt-24 lg:pt-28 xl:pt-32 pb-16 lg:pb-20">
        <div
          className={`${
            variant === "centered" ? "max-w-3xl mx-auto text-center" : "max-w-3xl"
          }`}
        >
          {/* Eyebrow */}
          {eyebrow && (
            <div
              className={`animate-fade-in-up ${variant === "centered" ? "flex justify-center mb-6" : "mb-6"}`}
              style={{ animationDelay: "0ms" }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-gold-500/30 text-gold-300 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-gold-400" />
                {eyebrow}
              </span>
            </div>
          )}

          {/* Main Headline */}
          <h1
            className="text-white mb-6 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            {title}
            {titleHighlight && (
              <>
                <br />
                <span className="text-gradient">{titleHighlight}</span>
              </>
            )}
          </h1>

          {/* Description */}
          <p
            className="text-xl text-navy-200 mb-8 leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            {description}
          </p>

          {/* CTAs */}
          {(primaryCTA || secondaryCTA) && (
            <div
              className={`flex flex-wrap gap-4 mb-10 animate-fade-in-up ${
                variant === "centered" ? "justify-center" : ""
              }`}
              style={{ animationDelay: "300ms" }}
            >
              {primaryCTA && (
                <Link
                  href={primaryCTA.href}
                  className="btn btn-primary text-base px-8 py-4"
                >
                  {primaryCTA.text}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              {secondaryCTA && (
                <Link
                  href={secondaryCTA.href}
                  className="btn btn-white text-base px-8 py-4"
                >
                  {secondaryCTA.text}
                </Link>
              )}
            </div>
          )}

          {/* Trust Items */}
          {trustItems && trustItems.length > 0 && (
            <div
              className={`flex flex-wrap gap-6 animate-fade-in-up ${
                variant === "centered" ? "justify-center" : ""
              }`}
              style={{ animationDelay: "400ms" }}
            >
              {trustItems.map((item, index) => (
                <div
                  key={index}
                  className="trust-badge"
                >
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Additional Content */}
          {children}
        </div>
      </div>
    </section>
  );
}
