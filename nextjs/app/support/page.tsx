"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiChevronDown, FiChevronUp, FiMail, FiPhone } from "react-icons/fi";
import "./support.css";

const faqs = [
  {
    category: "Booking & Reservations",
    questions: [
      {
        question: "How do I book a villa?",
        answer:
          "Booking a villa is simple! Search for your destination, select check-in/check-out dates, choose the number of guests, and browse available properties. Once you find your perfect villa, click 'Reserve Now', complete the booking form, and make a secure payment. You'll receive instant confirmation via email.",
      },
      {
        question: "Can I modify or cancel my booking?",
        answer:
          "Yes, you can modify or cancel your booking based on the property's cancellation policy. Most properties offer flexible cancellation (free cancellation up to 48 hours after booking, 50% refund up to 7 days before check-in). To modify or cancel, log into your account, go to 'My Bookings', and select the booking you want to change.",
      },
      {
        question: "When will I receive booking confirmation?",
        answer:
          "You'll receive booking confirmation instantly via email after completing your payment. The confirmation includes your booking ID, property details, check-in instructions, and host contact information. If you don't receive it within 5 minutes, check your spam folder or contact our support team.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit/debit cards (Visa, Mastercard, American Express), UPI, net banking, and digital wallets. All payments are processed through secure payment gateways with SSL encryption to protect your financial information.",
      },
    ],
  },
  {
    category: "Property & Amenities",
    questions: [
      {
        question: "Are the property photos accurate?",
        answer:
          "Absolutely! All property photos are verified by our team during the inspection process. We ensure that photos accurately represent the property's current condition, amenities, and surroundings. If you find any discrepancies upon arrival, please contact us immediately for assistance.",
      },
      {
        question: "What amenities are included?",
        answer:
          "Each property listing includes a detailed amenities section. Common amenities include Wi-Fi, air conditioning, private pool, kitchen, parking, and housekeeping. Premium villas may include additional services like personal chef, concierge, and airport transfers. Check the specific property page for complete details.",
      },
      {
        question: "Are pets allowed?",
        answer:
          "Pet policies vary by property. Some villas welcome pets with prior approval, while others don't allow them. Check the 'House Rules' section on the property page for pet policies. If pets are allowed, additional cleaning fees may apply.",
      },
      {
        question: "Is housekeeping included?",
        answer:
          "Most properties include daily housekeeping during your stay. The frequency and timing are mentioned in the property description. Some luxury villas also offer chef services, laundry, and caretaker assistance. Contact the host for specific details about housekeeping schedules.",
      },
    ],
  },
  {
    category: "Check-in & Check-out",
    questions: [
      {
        question: "What are the check-in and check-out times?",
        answer:
          "Standard check-in time is 2:00 PM and check-out is 11:00 AM. However, times may vary by property. Exact timings are mentioned on each property page and in your booking confirmation. Early check-in or late check-out may be available upon request (subject to availability and additional charges).",
      },
      {
        question: "How do I check in?",
        answer:
          "After booking, you'll receive check-in instructions via email. Typically, the property caretaker or host will meet you at the villa. You'll need to present a valid government ID and your booking confirmation. Some properties offer self-check-in with lockbox or digital keys.",
      },
      {
        question: "What documents do I need for check-in?",
        answer:
          "You'll need government-issued photo ID (Aadhaar card, passport, driver's license, or PAN card) for all guests above 18 years. Your booking confirmation (digital or printed) is also required. International guests need a valid passport and visa.",
      },
    ],
  },
  {
    category: "Pricing & Payments",
    questions: [
      {
        question: "What is included in the price?",
        answer:
          "The displayed price includes accommodation for the specified number of guests and nights. Basic amenities like Wi-Fi, parking, and housekeeping are typically included. Additional services like meals, extra guests, pet fees, or special requests may incur extra charges. GST (18%) is added at checkout.",
      },
      {
        question: "Are there any hidden charges?",
        answer:
          "No hidden charges! All applicable fees (cleaning fee, service fee, GST) are clearly displayed during booking before you make payment. The final amount shown at checkout is what you'll pay. Any additional services you request during your stay will be charged separately.",
      },
      {
        question: "Do you offer refunds?",
        answer:
          "Refunds are processed according to the property's cancellation policy. For flexible cancellation: free cancellation within 48 hours of booking, 50% refund if cancelled 7+ days before check-in. Cleaning fees are refundable, service fees are refundable if cancelled within 48 hours. Refunds are processed within 5-7 business days.",
      },
    ],
  },
  {
    category: "Safety & Support",
    questions: [
      {
        question: "Are properties verified for safety?",
        answer:
          "Yes! Every property undergoes rigorous safety and quality checks by our team. We verify ownership documents, inspect fire safety equipment, check electrical and plumbing systems, and ensure secure locks on all entry points. Host identity is also verified.",
      },
      {
        question: "What if I face issues during my stay?",
        answer:
          "Our 24/7 support team is always available to assist you. Contact us immediately if you face any issues. We'll work with the host to resolve problems quickly. If issues can't be resolved, we'll help you find alternative accommodation with full refund support.",
      },
      {
        question: "Is travel insurance included?",
        answer:
          "Travel insurance is not included in the booking price. We recommend purchasing travel insurance separately to cover unforeseen circumstances like medical emergencies, trip cancellations, or lost baggage. We can recommend trusted insurance providers upon request.",
      },
    ],
  },
];

export default function SupportPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFAQ = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="support-page">
      {/* Hero Section */}
      <section className="support-hero">
        <div className="hero-content">
          <h1 className="hero-title">How Can We Help You?</h1>
          <p className="hero-description">
            Find answers to common questions or contact our support team for
            personalized assistance.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          <div className="section-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Browse common questions organized by topic
            </p>
          </div>

          <div className="faq-categories">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="faq-category">
                <h3 className="category-title">{category.category}</h3>
                <div className="faq-list">
                  {category.questions.map((faq, questionIndex) => {
                    const key = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openIndex === key;

                    return (
                      <div
                        key={questionIndex}
                        className={`faq-item ${isOpen ? "open" : ""}`}
                      >
                        <button
                          className="faq-question"
                          onClick={() =>
                            toggleFAQ(categoryIndex, questionIndex)
                          }
                        >
                          <span>{faq.question}</span>
                          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                        {isOpen && (
                          <div className="faq-answer">{faq.answer}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Contact Section */}
      <section className="quick-contact-section">
        <div className="section-header">
          <h2 className="section-title">Still Have Questions?</h2>
          <p className="section-subtitle">
            Our support team is here to help. Reach out and we&apos;ll get back
            to you within 24 hours.
          </p>
        </div>
        <div className="quick-contact-container">
          <div className="contact-card">
            <div className="contact-icon">
              <FiMail />
            </div>
            <h3 className="contact-title">Email Support</h3>
            <p className="contact-description">support@zevio.com</p>
            <button
              className="contact-button"
              onClick={() => router.push("/contact")}
            >
              Send Email
            </button>
          </div>
          <div className="contact-card">
            <div className="contact-icon">
              <FiPhone />
            </div>
            <h3 className="contact-title">Phone Support</h3>
            <p className="contact-description">Available 24/7</p>
            <a href="tel:+919876543210" className="contact-button">
              Call Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
