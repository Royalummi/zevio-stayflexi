"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const [searchData, setSearchData] = useState({
    location: "",
    checkIn: "",
    checkOut: "",
    guests: "1",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Build query params
    const params = new URLSearchParams();
    if (searchData.location) params.append("city", searchData.location);
    if (searchData.checkIn) params.append("checkIn", searchData.checkIn);
    if (searchData.checkOut) params.append("checkOut", searchData.checkOut);
    if (searchData.guests) params.append("guests", searchData.guests);

    // Navigate to properties page with filters
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-2xl shadow-lg p-4 max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            placeholder="Where are you going?"
            value={searchData.location}
            onChange={(e) =>
              setSearchData({ ...searchData, location: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Check-in */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check-in
          </label>
          <input
            type="date"
            value={searchData.checkIn}
            onChange={(e) =>
              setSearchData({ ...searchData, checkIn: e.target.value })
            }
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Check-out */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check-out
          </label>
          <input
            type="date"
            value={searchData.checkOut}
            onChange={(e) =>
              setSearchData({ ...searchData, checkOut: e.target.value })
            }
            min={searchData.checkIn || new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Guests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Guests
          </label>
          <select
            value={searchData.guests}
            onChange={(e) =>
              setSearchData({ ...searchData, guests: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? "Guest" : "Guests"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] shadow-md"
        >
          🔍 Search Properties
        </button>
      </div>
    </form>
  );
}
