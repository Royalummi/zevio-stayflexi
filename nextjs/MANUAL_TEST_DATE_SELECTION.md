# Manual Test: Service Apartment Date Selection

## Test Steps

1. **Navigate to Service Apartments**
   - Go to http://localhost:8000/service-apartments
   - Verify page loads correctly

2. **Select a Property**
   - Click on any service apartment card
   - Verify detail page opens

3. **Select Check-in Date**
   - Click on "Check-in" date picker
   - Select a future date (tomorrow or later)
   - Verify date is selected

4. **Select Check-out Date**
   - Click on "Check-out" date picker
   - Select a date 2-3 days after check-in
   - Verify date is selected

5. **Verify Price Calculation**
   - Wait for price breakdown to appear
   - Check browser console for errors
   - Look for "Cannot read properties of undefined (reading 'toLocaleString')" error
   - Verify all prices display correctly:
     - Base price shows: ₹X,XXX × N nights
     - Long-stay discount (if applicable)
     - GST amount
     - Total amount

6. **Expected Results**
   - ✅ No console errors
   - ✅ All prices display correctly formatted
   - ✅ Price breakdown shows all components
   - ✅ Reserve button is enabled

## Fixed Issues

### Issue 1: Undefined toLocaleString Error

**Root Cause**: Backend API returns nested `pricing` object but frontend expected flat structure

**Solution**: Added response mapping in `calculatePrice` function to transform:

- `apiData.pricing.base_price` → `breakdown.base_total`
- `apiData.pricing.gst.amount` → `breakdown.gst_amount`
- `apiData.pricing.total` → `breakdown.total_amount`

### Issue 2: Missing Null Checks

**Root Cause**: Properties could be undefined causing toLocaleString to fail

**Solution**: Added null coalescing operator `||` 0 to all numeric values:

```typescript
(property.price_per_night || 0)
  .toLocaleString("en-IN")(priceBreakdown.base_total || 0)
  .toLocaleString("en-IN")(priceBreakdown.gst_amount || 0)
  .toLocaleString("en-IN");
```

### Issue 3: Conditional Discount Display

**Root Cause**: Discounts shown even when amount is 0

**Solution**: Added amount check in conditional:

```typescript
{priceBreakdown.long_stay_discount && priceBreakdown.long_stay_discount.amount && (
  // render discount row
)}
```

## Backend API Response Structure

```json
{
  "success": true,
  "data": {
    "nights": 2,
    "pricing": {
      "base_price": 10000,
      "long_stay_discount": {
        "type": "none",
        "percentage": 0,
        "amount": 0
      },
      "corporate_discount": {
        "applicable": false,
        "percentage": 0,
        "amount": 0
      },
      "gst": {
        "percentage": 18,
        "amount": 1800
      },
      "total": 11800
    },
    "savings": {
      "total_discount": 0,
      "percentage_saved": 0
    }
  }
}
```

## Frontend PriceBreakdown Interface

```typescript
interface PriceBreakdown {
  nights: number;
  base_total: number;
  long_stay_discount?: {
    type: string;
    percentage: number;
    amount: number;
  };
  corporate_discount?: {
    percentage: number;
    amount: number;
  };
  gst_amount: number;
  total_amount: number;
  total_savings: number;
  savings_percentage: number;
}
```

## Test with Different Stay Durations

1. **Short Stay (1-6 nights)**: No discount
2. **Weekly (7-29 nights)**: 15% discount
3. **Monthly (30-89 nights)**: 25% discount
4. **Quarterly (90-179 nights)**: 30% discount
5. **Long-term (180+ nights)**: 35% discount

Each should calculate correctly without errors.
