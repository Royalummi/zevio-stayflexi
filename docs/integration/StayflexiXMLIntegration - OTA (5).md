**Stayflexi XML Integration API Documentation** 

This documentation explains Stayflexi XML Integration API which implements the web services  allowing a user to get and update inventory/rates. XML messages are used for the server and  client communication. In order to integrate with the API’s, the user is expected to have  experience with web-services and software development in general. There is no restriction in the  usage of language for the integration. You can develop the integration API’s in any language that  supports Web-Services. In order to access these API’s, you would require login credentials.  

**Update Room Inventory** 

Method: POST 

URL: TO be supplied by the consumer 

**Sample Request**: 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<UpdateRoomInventoryRQ HotelCode=”12353” Version=”1.0”\> 

\<RoomType\> 

\<RoomTypeCode\>12363\</RoomTypeCode\> 

\<StartDate format=”dd-mm-YYYY”\>20-10-2018\</StartDate\> 

\<EndDate format=”dd-mm-YYYY”\>20-10-2019\</StartDate\> 

\<Count\>30\</Count\> 

\</RoomType\> 

\<RoomType\> 

\<RoomTypeCode\>12364\</RoomTypeCode\> 

\<StartDate format=”dd-mm-YYYY”\>20-10-2018\</StartDate\> 

\<EndDate format=”dd-mm-YYYY”\>20-06-2019\</StartDate\> 

\<Count\>25\</Count\> 

\</RoomType\> 

\</UpdateRoomInventoryRQ \> 

*Notes:* 

• Only one property can be updated in a single request. However multiple room types can  be updated across multiple date ranges 

• RoomTypeCode, StartDate and EndDate are required parameters 

• Hotel code and Room Type codes are the ids maintained in the consumers database **Sample Success Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<SuccessRS/\>  
**Sample Error Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<ErrorRS Code="104"\> 

 \<Description\>Not authorized to access this information\</Description\> \</ErrorRS\> 

For a full list of errors and description, please refer to the end of the documentation 

**Update Room Rates** 

Method: POST 

URL: TO be supplied by the consumer 

**Sample Request**: 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<UpdateRoomRatesRQ HotelCode=”12353” Currency=”INR” Version=”1.0”\>  \<RatePlan\> 

\<RoomTypeCode\>12363\</RoomTypeCode\> 

\<RatePlanCode\>12354\</RatePlanCode\> 

\<StartDate format=”dd-mm-YYYY”\>20-10-2018\</StartDate\> 

\<EndDate format=”dd-mm-YYYY”\>20-10-2019\</StartDate\> 

\<Single\>1000\</Single\> 

\<Double\>2000\</Double\> 

\<Triple\>3000\</ Triple \> 

\<ExtraAdult\>1000\</ ExtraAdult \> 

\<ExtraChild\>500\</ ExtraChild \> 

 \</RatePlan\>  

\</UpdateRoomRatesRQ\> 

*Notes:* 

• Only one property can be updated in a single request. However multiple room types can  be updated across multiple date ranges and rate plans 

• RoomTypeCode, RatePlanCode, StartDate and EndDate are required parameters • For multiple room type / rate plan updates, the updates are applied serially within the  request 

• The currency has to match the hotel’s currency, else the request will not go through • All ids maintained in the consumers database 

**Sample Success Response:**  
\<?xml version="1.0" encoding="UTF-8" ?\> 

\<SuccessRS/\> 

**Sample Error Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<ErrorRS Code="104"\> 

 \<Description\>Not authorized to access this information\</Description\> \</ErrorRS\> 

For a full list of errors and description, please refer to the end of the documentation **Update Room Restrictions** 

Method: POST 

URL: TO be supplied by the consumer 

**Sample Request**: 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<UpdateRestrictionRQ HotelCode=”12353” Version=”1.0”\> 

 \<Restriction\> 

\<RoomTypeCode\>12363\</RoomTypeCode\> 

\<RatePlanCode\>12354\</RatePlanCode\> 

\<StopSell\>False\</StopSell\> 

\<StartDate format=”dd-mm-YYYY”\>20-10-2018\</StartDate\> 

\<EndDate format=”dd-mm-YYYY”\>20-10-2019\</StartDate\> 

\<ClosedOnArrival\>False\</ClosedOnArrival\> 

\<ClosedOnDeparture\>True\</ClosedOnDeparture\> 

\<MinLOS\>2\</MinLOS\> 

\<MaxLOS\>31\</MaxLOS\> 

 \</Restriction\>  

\</UpdateRestrictionRQ\> 

*Notes:* 

• Only one property can be updated in a single request. However multiple room types can  be updated across multiple date ranges and rate plans 

• RoomTypeCode, RatePlanCode, StartDate and EndDate are required parameters • For ClosedOnArrival, ClosedOnDeparture, MinLOS and MaxLOS \- RoomTypeCode,  RatePlanCode are mandatory parameters 

• To close room type (StopSell), specify RoomTypeCode and do not supply RatePlanCode. • To close rate plan (StopSell), specify both RoomTypeCode and RatePlanCode  
• All ids maintained in the consumers database 

**Sample Success Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<SuccessRS/\> 

**Sample Error Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<ErrorRS Code="104"\> 

 \<Description\>Not authorized to access this information\</Description\> \</ErrorRS\> 

For a full list of errors and description, please refer to the end of the documentation **Get Room Restrictions** 

Method: POST 

URL: TO be supplied by the consumer 

**Sample Request**: 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<GetRestrictionRQ HotelCode=”12353” Version=”1.0”\> 

\<RoomTypeCode\>12363\</RoomTypeCode\> 

\<RatePlanCode\>12354\</RatePlanCode\> 

\<StartDate format=”dd-mm-YYYY”\>20-10-2018\</StartDate\> 

\<EndDate format=”dd-mm-YYYY”\>21-10-2018\</StartDate\> 

\</GetRestrictionRQ\> 

**Sample Success Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<GetRestrictionRS HotelCode=”12353” RoomTypeCode=”12363” RatePlanCode=”12354”  Version=”1.0”\> 

\<Restriction Date=”20-10-2018”\> 

\<StopSell\>False\</StopSell\> 

\<ClosedOnArrival\>False\</ClosedOnArrival\> 

\<ClosedOnDeparture\>True\</ClosedOnDeparture\>  
\<MinLOS\>2\</MinLOS\> 

\<MaxLOS\>31\</MaxLOS\> 

\</Restriction\> 

\<Restriction Date=”21-10-2018”\> 

\<StopSell\>False\</StopSell\> 

\<ClosedOnArrival\>False\</ClosedOnArrival\> 

\<ClosedOnDeparture\>True\</ClosedOnDeparture\> 

\<MinLOS\>2\</MinLOS\> 

\<MaxLOS\>31\</MaxLOS\> 

\</Restriction\> 

\</GetRoomRateRS\> 

**Sample Error Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<ErrorRS Code="104"\> 

 \<Description\>Not authorized to access this information\</Description\> \</ErrorRS\> 

For a full list of errors and description, please refer to the end of the documentation 

**Get Room Inventory** 

Method: POST 

URL: TO be supplied by the consumer 

**Sample Request**: 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<GetRoomInventoryRQ HotelCode=”12353” Version=”1.0”\> 

\<RoomTypeCode\>12363\</RoomTypeCode\> 

\<StartDate format=”dd-mm-YYYY”\>20-10-2018\</StartDate\> 

\<EndDate format=”dd-mm-YYYY”\>25-10-2018\</StartDate\> 

\</GetRoomInventoryRQ\> 

*Notes:* 

• RoomTypeCode, StartDate and EndDate are required parameters • All ids maintained in the consumers database 

**Sample Success Response:**  
\<?xml version="1.0" encoding="UTF-8" ?\> 

\<GetRoomInventoryRS HotelCode=”12353” RoomTypeCode=”12363” Version=”1.0”\> \<Availability Date=”20-10-2018”\> 

\<Count\>20\</Count\> 

\</Availability\> 

\<Availability Date=”21-10-2018”\> 

\<Count\>19\</Count\> 

\</Availability\> 

\<Availability Date=”22-10-2018”\> 

\<Count\>17\</Count\> 

\</Availability\> 

\<Availability Date=”23-10-2018”\> 

\<Count\>17\</Count\> 

\</Availability\> 

\<Availability Date=”24-10-2018”\> 

\<Count\>12\</Count\> 

\</Availability\> 

\<Availability Date=”25-10-2018”\> 

\<Count\>15\</Count\> 

\</Availability\> 

\</GetRoomInventoryRS\> 

**Sample Error Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<ErrorRS Code="104"\> 

 \<Description\>Not authorized to access this information\</Description\> \</ErrorRS\> 

For a full list of errors and description, please refer to the end of the documentation **Get Room Rates**   
Method: POST 

URL: TO be supplied by the consumer 

**Sample Request**: 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<GetRoomRateRQ HotelCode=”12353” Version=”1.0”\> 

\<RoomTypeCode\>12363\</RoomTypeCode\> 

\<RatePlanCode\>12354\</RatePlanCode\> 

\<StartDate format=”dd-mm-YYYY”\>20-10-2018\</StartDate\>  
\<EndDate format=”dd-mm-YYYY”\>25-10-2018\</StartDate\> 

\</GetRoomRateRQ\> 

*Notes:* 

• RoomTypeCode, RatePlanCode, StartDate and EndDate are required parameters • All ids maintained in the consumers database 

**Sample Success Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<GetRoomRateRS HotelCode=”12353” RoomTypeCode=”12363” RatePlanCode=”12354”  Currency=”INR” Version=”1.0”\> 

\<Rate Date=”20-10-2018”\> 

\<Single\>1000\</Single\> 

\<Double\>2000\</Double\> 

\<Triple\>3000\</ Triple \> 

\<ExtraAdult\>1000\</ ExtraAdult \> 

\<ExtraChild\>500\</ ExtraChild \> 

\</Rate\> 

\<Rate Date=”21-10-2018”\> 

\<Single\>1000\</Single\> 

\<Double\>2000\</Double\> 

\<Triple\>3000\</ Triple \> 

\<ExtraAdult\>1000\</ ExtraAdult \> 

\<ExtraChild\>500\</ ExtraChild \> 

\</Rate\> 

\<Rate Date=”22-10-2018”\> 

\<Single\>1000\</Single\> 

\<Double\>2000\</Double\> 

\<Triple\>3000\</ Triple \> 

\<ExtraAdult\>1000\</ ExtraAdult \> 

\<ExtraChild\>500\</ ExtraChild \> 

\</Rate\> 

\<Rate Date=”23-10-2018”\> 

\<Single\>1000\</Single\> 

\<Double\>2000\</Double\> 

\<Triple\>3000\</ Triple \> 

\<ExtraAdult\>1000\</ ExtraAdult \> 

\<ExtraChild\>500\</ ExtraChild \> 

\</Rate\> 

\<Rate Date=”24-10-2018”\> 

\<Single\>1000\</Single\>  
\<Double\>2000\</Double\> 

\<Triple\>3000\</ Triple \> 

\<ExtraAdult\>1000\</ ExtraAdult \> 

\<ExtraChild\>500\</ ExtraChild \> 

\</Rate\> 

\<Rate Date=”25-10-2018”\> 

\<Single\>1000\</Single\> 

\<Double\>2000\</Double\> 

\<Triple\>3000\</ Triple \> 

\<ExtraAdult\>1000\</ ExtraAdult \> 

\<ExtraChild\>500\</ ExtraChild \> 

\</Rate\> 

\</GetRoomRateRS\> 

**Sample Error Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<ErrorRS Code="104"\> 

 \<Description\>Not authorized to access this information\</Description\> \</ErrorRS\> 

For a full list of errors and description, please refer to the end of the documentation 

**Get Hotel Detail** 

Method: POST 

URL: TO be supplied by the consumer 

**Sample Request**: 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<HotelDetailRQ Version=”1.0”\> 

\<HotelCode\>12353\</HotelCode\> 

\</HotelDetailRQ\> 

**Sample Success Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<HotelDetailRS Version=”1.0”\> 

\<HotelCode\>12353\</HotelCode\> 

\<RoomList\>  
\<Room\> 

\<RoomTypeCode\>12361\</RoomTypeCode\> 

\<RoomTypeName\>Deluxe Single\</RoomTypeName\> 

\<IsActive\>True\</IsActive\> 

\</Room\> 

\<Room\> 

\<RoomTypeCode\>12362\</RoomTypeCode\> 

\<RoomTypeName\>Deluxe Double\</RoomTypeName\> 

\<IsActive\>True\</IsActive\> 

\</Room\> 

\</RoomList\> 

\<RatePlanList\> 

\<RatePlan\> 

\<RoomTypeCode\>12361\</RoomTypeCode\> 

\<RoomTypeName\>Deluxe Single\</RoomTypeName\> 

\<RatePlanCode\>12353\</RatePlanCode\> 

\<RatePlanName\>Standard\</RatePlanName\> 

\<IsActive\>True\</IsActive\> 

\<RatePlan\> 

\<RatePlan\> 

\<RoomTypeCode\>12361\</RoomTypeCode\> 

\<RoomTypeName\>Deluxe Single\</RoomTypeName\> 

\<RatePlanCode\>12354\</RatePlanCode\> 

\<RatePlanName\>Bed And Breakfast\</RatePlanName\> 

\<IsActive\>True\</IsActive\> 

\<RatePlan\> 

\<RatePlan\> 

\<RoomTypeCode\>12362\</RoomTypeCode\> 

\<RoomTypeName\>Deluxe Double\</RoomTypeName\> 

\<RatePlanCode\>12353\</RatePlanCode\> 

\<RatePlanName\>Standard\</RatePlanName\> 

\<IsActive\>True\</IsActive\> 

\<RatePlan\> 

\<RatePlan\> 

\<RoomTypeCode\>12362\</RoomTypeCode\> 

\<RoomTypeName\>Deluxe Double\</RoomTypeName\> 

\<RatePlanCode\>12354\</RatePlanCode\> 

\<RatePlanName\>Bed And Breakfast\</RatePlanName\> 

\<IsActive\>True\</IsActive\> 

\<RatePlan\> 

\</RatePlanList\> 

\</HotelDetailRS\>  
**Sample Error Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<ErrorRS Code="104"\> 

 \<Description\>Not authorized to access this information\</Description\> \</ErrorRS\> 

For a full list of errors and description, please refer to the end of the documentation 

**Push Notification** 

Consumer will send Booking Confirmation / Booking Modification / Booking Cancellation  notifications to Stayflexi. In order to integrate: 

• We will expose an endpoint for you to push any reservation/modification/cancellation • The Content-Type of the request will be application/xml 

**Sample Push Notification Request**: 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<PushBookingRQ HotelCode=”12353” Version=”1.0”\> 

\<BookingId\>SFBOOKING\_12353\_12361\</BookingId\> 

\<BookingStatus\>CONFIRMED\</BookingStatus\> 

\<HotelCode\>12353\</HotelCode\> 

\<HotelName\>MGM Grand\</HotelName\> 

\<PayAtHotel\>False\</PayAtHotel\> 

\<Currency\>INR\</Currency\> 

\<GuestEmailId\>rajesh.shukla@gmail.com\</GuestEmailId\> 

\<GuestPhoneNum\>+919611140373\</GuestPhoneNum\> 

\<SpecialRequests\>Extra Bed\</SpecialRequests\> 

\<PricingDetails\> 

\<SellAmount\>3200\</SellAmount\> 

\<NettAmount\>3000\</NettAmount\> 

 \<TXMLlTaxes\>300\</TXMLlTaxes\> 

\<PayAtHotel\>false\</PayAtHotel\> 

\</PricingDetails\> 

\<RoomStay\> 

\<Room\> 

 \<GuestName\>Rajesh Shukla\</GuestName\> 

 \<RoomTypeName\>Deluxe Double\</RoomTypeName\> 

 \<RoomTypeCode\>12362\</RoomTypeCode\> 

 \<RatePlanName\>Bed and Breakfast\</RatePlanName\>  
 \<RatePlanCode\>12354\</RatePlanCode\> 

 \<NumAdults\>2\</NumAdults\> 

\<NumChildren\>1\</NumChildren\> 

\<Room\> 

\<Room\> 

 \<GuestName\>Gaurav Gupta\</GuestName\> 

 \<RoomTypeName\>Deluxe Double\</RoomTypeName\> 

 \<RoomTypeCode\>12362\</RoomTypeCode\> 

 \<RatePlanName\>Bed and Breakfast\</RatePlanName\> 

 \<RatePlanCode\>12354\</RatePlanCode\> 

 \<NumAdults\>2\</NumAdults\> 

\<NumChildren\>1\</NumChildren\> 

\<Room\> 

\</RoomStay\> 

\<NightStay\> 

\<CheckinDate\>20-08-2018\</CheckinDate\> 

\<NumNights\>1\</NumNights\> 

\</NightStay\> 

\</PushBookingRQ\> 

*Notes:* 

1\. The valid values for BookingStatus is CONFIRMED, MODIFIED and CANCELLED 2\. The consumer will, under no circumstances, reject a confirmed / modified booking 3\. Stayflexi will expect a SuccessRS message. On getting an error response, there will 2 more  

retries. If a success message is not obtained on 3 retires, an email will be sent to the  consumer admin citing the error response 

**Sample Success Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<SuccessRS/\> 

**Sample Error Response:** 

\<?xml version="1.0" encoding="UTF-8" ?\> 

\<ErrorRS Code="104"\> 

 \<Description\>Not authorized to access this information\</Description\> \</ErrorRS\> 

For a full list of errors and description, please refer to the end of the documentation  
**Error Codes**

| Code  | Description |
| :---- | :---- |
| 101  | The given hotel does not exist |
| 102  | The given room type does not exist |
| 103  | The given rate plan does not exist |
| 104  | Not authorized to access this information |
| 105  | Invalid credentials specified |
| 106  | You are not registered with stayflexi |
| 107  | Booking does not exist |
| 109  | Invalid version specified. Please check documentation |
| 110  | From date is invalid |
| 111  | To date is invalid |
| 112  | To date is lesser than from date |
| 113  | Availability not set for some dates |
| 114  | Updates only allowed from today to 600 days from now |
| 115  | Please specify a number greater than or equal to 0 for room count |
| 116  | Stop sell is either True or False |
| 117  | Internal error. Please report this problem or try again later |
| 118  | Invalid booking status specified |
| 119  | Invalid currency specified for the hotel |
| 120  | Please check the rates specified. Should be greater than 0 |

