"use client";

import { AlertCircle } from "lucide-react";

interface MedicalDisclaimerProps {
  variant?: "default" | "compact" | "footer";
  className?: string;
}

export default function MedicalDisclaimer({ 
  variant = "default",
  className = "" 
}: MedicalDisclaimerProps) {
  const content = {
    default: (
      <>
        <strong className="text-white">Important:</strong> Xytex is a registered tissue bank. 
        All donor samples are screened according to FDA regulations. Results are not guaranteed. 
        Please consult with your healthcare provider before making decisions about fertility treatment.
      </>
    ),
    compact: (
      <>
        <strong>Important:</strong> Xytex is FDA registered. Results not guaranteed. 
        Consult your healthcare provider.
      </>
    ),
    footer: (
      <>
        Xytex is a registered tissue bank. All samples are FDA screened. 
        Results are not guaranteed. Consult your healthcare provider.
      </>
    ),
  };

  const styles = {
    default: "flex items-start gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10",
    compact: "flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200",
    footer: "text-xs text-navy-400 leading-relaxed",
  };

  const textStyles = {
    default: "text-sm text-navy-200 leading-relaxed",
    compact: "text-sm text-amber-900 leading-relaxed",
    footer: "text-xs text-navy-400 leading-relaxed",
  };

  if (variant === "footer") {
    return (
      <p className={`${textStyles.footer} ${className}`}>
        {content.footer}
      </p>
    );
  }

  return (
    <div 
      className={`${styles[variant]} ${className}`}
      role="alert"
      aria-label="Medical disclaimer"
    >
      <AlertCircle 
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
          variant === "compact" ? "text-amber-600" : "text-gold-400"
        }`}
        aria-hidden="true"
      />
      <p className={textStyles[variant]}>
        {content[variant]}
      </p>
    </div>
  );
}

