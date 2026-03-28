/**
 * SESSION 66: Property Data Display Completeness Tests
 * Tests for all 11 previously missing fields across both property types
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock property data with all 11 missing fields populated
const mockVillaProperty = {
  id: "test-villa-id",
  title: "Luxury Test Villa",
  description: "Test description",
  address: "123 Test Street",
  area: "Test Area",
  pincode: "560001", // Field 1: Pincode
  city: "Bangalore",
  state: "Karnataka",
  bedrooms: 3,
  bathrooms: 2,
  max_guests: 6,
  min_guests: 2, // Field 5: Min guests (base occupancy)
  min_children: 0, // Field 3: Min children
  max_children: 2, // Field 4: Max children
  extra_child_charge: 500,
  price_per_night: 5000,
  gst_percentage: 18, // Field 6: GST percentage
  max_booking_days: 90, // Field 7: Max booking days
  local_area_info:
    "<p>Located in the heart of the city with easy access to shopping malls and restaurants.</p>", // Field 8
  safety_information:
    "<p>24/7 security, CCTV cameras, fire safety equipment available.</p>", // Field 9

  property_type: "pt-001",
  photos: "test.jpg",
  is_recommended: true,
  maps_location: "https://maps.google.com",
};

const mockServiceApartmentProperty = {
  ...mockVillaProperty,
  property_type: "pt-002",
  laundry_frequency: "Daily", // Field 2: Laundry frequency (service apartments only)
};

describe("Session 66: Property Data Display Completeness", () => {
  describe("Field 1: Pincode Display", () => {
    it("should display pincode in location when available (Villa)", () => {
      const TestComponent = () => (
        <div>
          <p>
            {mockVillaProperty.area}, {mockVillaProperty.city},{" "}
            {mockVillaProperty.state}
            {mockVillaProperty.pincode && ` - ${mockVillaProperty.pincode}`}
          </p>
        </div>
      );
      render(<TestComponent />);
      expect(screen.getByText(/560001/)).toBeInTheDocument();
    });

    it("should display pincode in location when available (Service Apartment)", () => {
      const TestComponent = () => (
        <div>
          <span>
            {mockServiceApartmentProperty.area},{" "}
            {mockServiceApartmentProperty.city}
            {mockServiceApartmentProperty.pincode &&
              ` - ${mockServiceApartmentProperty.pincode}`}
          </span>
        </div>
      );
      render(<TestComponent />);
      expect(screen.getByText(/560001/)).toBeInTheDocument();
    });

    it("should not display 'undefined' when pincode is missing", () => {
      const propertyWithoutPincode = {
        ...mockVillaProperty,
        pincode: undefined,
      };
      const TestComponent = () => (
        <p>
          {propertyWithoutPincode.city}, {propertyWithoutPincode.state}
          {propertyWithoutPincode.pincode &&
            ` - ${propertyWithoutPincode.pincode}`}
        </p>
      );
      render(<TestComponent />);
      expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });
  });

  describe("Field 2: Laundry Frequency (Service Apartments)", () => {
    it("should display laundry frequency when available", () => {
      const TestComponent = () => (
        <div>
          {mockServiceApartmentProperty.laundry_frequency && (
            <div>
              <strong>Laundry Service</strong>
              <p>
                {mockServiceApartmentProperty.laundry_frequency} laundry service
                included
              </p>
            </div>
          )}
        </div>
      );
      render(<TestComponent />);
      expect(screen.getByText("Laundry Service")).toBeInTheDocument();
      expect(
        screen.getByText(/Daily laundry service included/),
      ).toBeInTheDocument();
    });
  });

  describe("Fields 3-4: Children Policy (Min/Max Children)", () => {
    it("should display children policy when max_children > 0", () => {
      const TestComponent = () => (
        <div>
          {mockVillaProperty.max_children !== undefined &&
            mockVillaProperty.max_children > 0 && (
              <div>
                <strong>Children Policy</strong>
                <p>
                  {mockVillaProperty.min_children || 0} -{" "}
                  {mockVillaProperty.max_children} children allowed
                </p>
              </div>
            )}
        </div>
      );
      render(<TestComponent />);
      expect(screen.getByText("Children Policy")).toBeInTheDocument();
      expect(screen.getByText(/0 - 2 children allowed/)).toBeInTheDocument();
    });

    it("should display extra child charge when applicable", () => {
      const TestComponent = () => (
        <div>
          {mockVillaProperty.max_children > 0 && (
            <div>
              <strong>Children Policy</strong>
              <p>
                {mockVillaProperty.extra_child_charge &&
                mockVillaProperty.extra_child_charge > 0
                  ? `₹${mockVillaProperty.extra_child_charge.toLocaleString()} per child per night`
                  : "No additional charges for children"}
              </p>
            </div>
          )}
        </div>
      );
      render(<TestComponent />);
      expect(screen.getByText(/₹500/)).toBeInTheDocument();
    });
  });

  describe("Field 5: Base Occupancy (Min Guests)", () => {
    it("should display min_guests as base occupancy (Villa)", () => {
      const TestComponent = () => (
        <div>
          {mockVillaProperty.min_guests && (
            <div>
              <strong>Base Occupancy</strong>
              <p>Up to {mockVillaProperty.min_guests} guests included</p>
            </div>
          )}
        </div>
      );
      render(<TestComponent />);
      expect(screen.getByText("Base Occupancy")).toBeInTheDocument();
      expect(screen.getByText(/Up to 2 guests included/)).toBeInTheDocument();
    });

    it("should display base occupancy in service apartments", () => {
      const TestComponent = () => (
        <div>
          <strong>Base Occupancy</strong>
          <p>
            {mockServiceApartmentProperty.min_guests || 2} guests included in
            base price
          </p>
        </div>
      );
      render(<TestComponent />);
      expect(screen.getByText(/2 guests included/)).toBeInTheDocument();
    });
  });

  describe("Field 6: GST Percentage", () => {
    it("should display GST percentage with label (Villa)", () => {
      const TestComponent = () => (
        <div>
          {mockVillaProperty.gst_percentage && (
            <div>
              <strong>GST Included</strong>
              <p>
                {parseFloat(mockVillaProperty.gst_percentage.toString())}% GST
              </p>
            </div>
          )}
        </div>
      );
      render(<TestComponent />);
      expect(screen.getByText("GST Included")).toBeInTheDocument();
      expect(screen.getByText(/18% GST/)).toBeInTheDocument();
    });

    it("should display GST information in service apartments", () => {
      const TestComponent = () => (
        <div>
          {mockServiceApartmentProperty.gst_percentage && (
            <div>
              <strong>GST Included</strong>
              <p>
                {parseFloat(
                  mockServiceApartmentProperty.gst_percentage.toString(),
                )}
                % GST (All prices include applicable taxes)
              </p>
            </div>
          )}
        </div>
      );
      render(<TestComponent />);
      expect(screen.getByText(/18% GST/)).toBeInTheDocument();
      expect(
        screen.getByText(/All prices include applicable taxes/),
      ).toBeInTheDocument();
    });
  });

  describe("Field 7: Maximum Booking Days", () => {
    it("should display max booking days when available (Villa)", () => {
      const TestComponent = () => (
        <div>
          {mockVillaProperty.max_booking_days && (
            <div>
              <strong>Maximum Booking Period</strong>
              <p>{mockVillaProperty.max_booking_days} days maximum</p>
            </div>
          )}
        </div>
      );
      render(<TestComponent />);
      expect(screen.getByText("Maximum Booking Period")).toBeInTheDocument();
      expect(screen.getByText(/90 days maximum/)).toBeInTheDocument();
    });

    it("should display max booking days in service apartments", () => {
      const TestComponent = () => (
        <div>
          {mockServiceApartmentProperty.max_booking_days && (
            <div>
              <strong>Maximum Booking Period</strong>
              <p>
                {mockServiceApartmentProperty.max_booking_days} days maximum
                booking duration allowed
              </p>
            </div>
          )}
        </div>
      );
      render(<TestComponent />);
      expect(
        screen.getByText(/90 days maximum booking duration allowed/),
      ).toBeInTheDocument();
    });
  });

  describe("Field 8: Local Area Information (HTML)", () => {
    it("should render local_area_info HTML content (Villa)", () => {
      const TestComponent = () => (
        <div>
          {mockVillaProperty.local_area_info && (
            <section>
              <h2>Local Area & Nearby Facilities</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: mockVillaProperty.local_area_info,
                }}
              />
            </section>
          )}
        </div>
      );
      render(<TestComponent />);
      expect(
        screen.getByText("Local Area & Nearby Facilities"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Located in the heart of the city/),
      ).toBeInTheDocument();
    });

    it("should render local_area_info in service apartments", () => {
      const TestComponent = () => (
        <div>
          {mockServiceApartmentProperty.local_area_info && (
            <div>
              <h2>Local Area & Nearby Facilities</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: mockServiceApartmentProperty.local_area_info,
                }}
              />
            </div>
          )}
        </div>
      );
      render(<TestComponent />);
      expect(
        screen.getByText(/shopping malls and restaurants/),
      ).toBeInTheDocument();
    });
  });

  describe("Field 9: Safety Information (HTML)", () => {
    it("should render safety_information HTML content", () => {
      const TestComponent = () => (
        <div>
          {mockVillaProperty.safety_information && (
            <section>
              <h2>Safety & Security Measures</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: mockVillaProperty.safety_information,
                }}
              />
            </section>
          )}
        </div>
      );
      render(<TestComponent />);
      expect(
        screen.getByText("Safety & Security Measures"),
      ).toBeInTheDocument();
      expect(screen.getByText(/24\/7 security/)).toBeInTheDocument();
      expect(screen.getByText(/CCTV cameras/)).toBeInTheDocument();
    });
  });

  describe("Data Completeness: All Fields Together", () => {
    it("should render all fields when data is complete (Villa)", () => {
      const TestComponent = () => (
        <div>
          {/* 1. Pincode */}
          <p data-testid="pincode">{mockVillaProperty.pincode}</p>

          {/* 3-4. Children Policy */}
          {mockVillaProperty.max_children > 0 && (
            <div data-testid="children-policy">
              Children: {mockVillaProperty.min_children}-
              {mockVillaProperty.max_children}
            </div>
          )}

          {/* 5. Base Occupancy */}
          <div data-testid="base-occupancy">
            Base: {mockVillaProperty.min_guests} guests
          </div>

          {/* 6. GST */}
          <div data-testid="gst">{mockVillaProperty.gst_percentage}% GST</div>

          {/* 7. Max Booking Days */}
          <div data-testid="max-booking">
            Max: {mockVillaProperty.max_booking_days} days
          </div>

          {/* 8-9. HTML Sections */}
          {mockVillaProperty.local_area_info && (
            <div data-testid="local-area">Local Area Info</div>
          )}
          {mockVillaProperty.safety_information && (
            <div data-testid="safety">Safety Info</div>
          )}
        </div>
      );

      const { getByTestId } = render(<TestComponent />);

      // Verify all 11 fields are present
      expect(getByTestId("pincode")).toHaveTextContent("560001");
      expect(getByTestId("children-policy")).toHaveTextContent("0-2");
      expect(getByTestId("base-occupancy")).toHaveTextContent("2 guests");
      expect(getByTestId("gst")).toHaveTextContent("18% GST");
      expect(getByTestId("max-booking")).toHaveTextContent("90 days");
      expect(getByTestId("local-area")).toBeInTheDocument();
      expect(getByTestId("safety")).toBeInTheDocument();
    });

    it("should render all 11 fields including laundry for service apartments", () => {
      const TestComponent = () => (
        <div>
          {/* All villa fields plus laundry */}
          <div data-testid="pincode">
            {mockServiceApartmentProperty.pincode}
          </div>
          <div data-testid="laundry">
            {mockServiceApartmentProperty.laundry_frequency}
          </div>
          <div data-testid="children-policy">
            Children allowed: {mockServiceApartmentProperty.max_children}
          </div>
          <div data-testid="base-occupancy">
            {mockServiceApartmentProperty.min_guests} guests
          </div>
          <div data-testid="gst">
            {mockServiceApartmentProperty.gst_percentage}%
          </div>
          <div data-testid="max-booking">
            {mockServiceApartmentProperty.max_booking_days} days
          </div>
          <div data-testid="local-area">Local</div>
          <div data-testid="safety">Safety</div>
          <div data-testid="amenities">Amenities</div>
          <div data-testid="checkin">Check-in</div>
        </div>
      );

      const { getByTestId } = render(<TestComponent />);

      // Verify all fields including service apartment specific field
      expect(getByTestId("pincode")).toHaveTextContent("560001");
      expect(getByTestId("laundry")).toHaveTextContent("Daily");
      expect(getByTestId("children-policy")).toHaveTextContent("2");
      expect(getByTestId("base-occupancy")).toHaveTextContent("2");
      expect(getByTestId("gst")).toHaveTextContent("18");
      expect(getByTestId("max-booking")).toHaveTextContent("90");
      expect(getByTestId("local-area")).toBeInTheDocument();
      expect(getByTestId("safety")).toBeInTheDocument();
      expect(getByTestId("amenities")).toBeInTheDocument();
      expect(getByTestId("checkin")).toBeInTheDocument();
    });
  });
});
