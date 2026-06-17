**Stayflexi Channel Manager As A Service – API Documentation** 

This documentation explains Stayflexi Channel Manager API which implements the web services  exposing the APIs needed to connect to the OTAs. The OTAs supported are Goibibo/Makemytrip,  Yatra/Travelguru, Booking.com, Expedia and its Affliates, Agoda, Cleartrip, Easemytrip,  Via.com, Paytm, CTrip, Traveloka. We are working with many more OTAs (like Airbnb) and they  should get integrated soon with our channel manager. Stayflexi Channel Manager is continuously  expanding its portfolio and strives to connect with the major OTAs. JSON messages are used for the server and client communication. In order to integrate with the channel manager API’s, the  user is expected to have the experience with web-services and software development in general.  There is no restriction in the usage of language for the integration. You can develop the integration  API’s in any language that supports Web-Services. In order to access these API’s, you would  require login credentials. Please contact admin@stayflexi.com to request the same. 

**Web service URL for API access** 

The URL to access the Stayflexi Channel Manager APIs: 

https://stayflexi.com/apiv1/cmservice/\<API\>/?pmsId=\<pmsId\> 

**API\_HEADER’s:**   
X-SF-API-KEY:\<api\_key\> 

In order to get access to the channel manager API’s, the following credentials will be provided: • pmsId – Every API consumer will be given a unique pmsId 

• X-SF-API-KEY – Every API consumer will be given an api key which should be placed  in the header as explained above 

In order to authenticate a consumer we would validate both the pmsid and the api key. Both these  identities will be provided to the consumer. If you have not received the same, please get in touch  with us at admin@stayflexi.com. For any technical queries related to the API’s, please send us a  mail at admin@stayflexi.com 

**Onboarding:** Onboarding step involves mapping the hotelIds, roomTypeIds and ratePlanIds. All  the ids mentioned in the documentation represents Stayflexi Ids. PMS specific ids should be  converted to stayflexi ids (using the mapping done during onboarding) before using the below  APIs 

**1\. Get All Channel Registered For A Hotel** 

METHOD: GET   
http://beta.stayflexi.com/apiv1/cmservice/channels/?pmsId=\<pmsId\>\&hotelId=\<hotelId\> *Notes:*  
• This will return a list of all the channels connected with the Hotel. If the hotel is not  connected to any OTA, minimum it will return Stayflexi channel. 

• pmsId: Represents the unique id for the PMS given by Stayflexi 

• hotelId: Represents the Stayflexi hotel id 

Sample Success Response:   
\[ 

"Booking.com",   
"Expedia",   
"Stayflexi"   
\] 

**2\. Get Hotel Details** 

Method: GET   
http://beta.stayflexi.com/apiv1/cmservice/gethoteldetail/?pmsId=\<pmsId\>\&hotelId=\<hotelId\> Sample Response: 

{   
 "status": true,   
 "message": "Success",   
 "hotelId": "\<HotelId\>",   
 "hotelName": "\<HotelName\>",   
 "roomTypeList": \[   
 {   
 "roomTypeId": "12353",   
 "roomTypeName": "Single Room",   
 "defaultOccupancy": 1,   
 "maxOccupancy": 4,   
 "maxChildren": 1   
 },   
 {   
 "roomTypeId": "12354",   
 "roomTypeName": "Double Room",   
 "defaultOccupancy": 1,   
 "maxOccupancy": 4,   
 "maxChildren": 1   
 }   
 \],   
 "ratePlanList": \[   
 {   
 "ratePlanId": "12511",   
 "ratePlanName": "Standard Plan",   
 "roomTypes": \[   
 {   
 "roomTypeId": "12354",   
 "roomTypeName": "Double Room",   
 "defaultOccupancy": 1,   
 "maxOccupancy": 4,   
 "maxChildren": 1  
 },   
 {   
 "roomTypeId": "12353",   
 "roomTypeName": "Single Room",   
 "defaultOccupancy": 1,   
 "maxOccupancy": 4,   
 "maxChildren": 1   
 }   
 \]   
 },   
 {   
 "ratePlanId": "12512",   
 "ratePlanName": "Breakfast Plan",   
 "roomTypes": \[   
 {   
 "roomTypeId": "12354",   
 "roomTypeName": "Double Room",   
 "defaultOccupancy": 1,   
 "maxOccupancy": 4,   
 "maxChildren": 1   
 },   
 {   
 "roomTypeId": "12353",   
 "roomTypeName": "Single Room",   
 "defaultOccupancy": 1,   
 "maxOccupancy": 4,   
 "maxChildren": 1   
 }   
 \]   
 }   
 \]   
} 

*Notes:* 

• This will return all the room types and rate plans registered for this hotel. Hotel Id, room  type id and rate plan ids are all Stayflexi specific ids. During the onboarding step, it is  expected that the PMS which is integrating should map the stayflexi ids with their ids. • pmsId: Represents the unique id for the PMS given by Stayflexi 

• hotelId: Represents the Stayflexi hotel id 

**3\. GET Room Inventory** 

Method: GET   
http://beta.stayflexi.com/apiv1/cmservice/getroomcount/?pmsId=\<pmsId\>\&hotelId=\<hotelId\>& roomTypeId=\<roomTypeId\>\&fromDate=\<fromDate\>\&toDate=\<toDate\> 

Sample Response: 

{   
 "status": true,  
 "message": "Success",   
 "roomTypeId": "\<roomTypeId\>",   
 "hotelId": "\<hotelId\>",   
 "availability": {   
 "2019-08-30": 15,   
 "2019-07-20": 15,   
 "2019-08-11": 8,   
 "2019-08-12": 8,   
 "2019-07-22": 15,   
 "2019-08-31": 15,   
 "2019-07-21": 15   
 }   
} 

*Notes:* 

• This will return the current inventory for the hotel in the selected date range (fromDate to  toDate) 

• Format of fromDate and toDate: dd-MM-yyyy 

• pmsId: Represents the unique id for the PMS given by Stayflexi 

• hotelId: Represents the Stayflexi hotel id 

**4\. GET Room Rates** 

Method: GET   
http://beta.stayflexi.com/apiv1/cmservice/getroomrates/?pmsId=\<pmsId\>\&hotelId=\<hotelId\>\&r oomTypeId=\<roomTypeId\>\&ratePlanId=\<ratePlanId\>\&fromDate=\<fromDate\>\&toDate=\<toDat e\> 

Sample Response: 

{   
 "status": true,   
 "message": "Success",   
 "hotelId": "\<hotelId\>",   
 "roomTypeId": "\<roomTypeId\>",   
 "ratePlanId": "\<ratePlanId\>",   
 "rates": {   
 "01-08-2019": {   
 "1": 100,   
 "2": 200,   
 "3": 300,   
 "4": 400,   
 "c": 100   
 },   
 "18-08-2019": {   
 "1": 2000,   
 "2": 2200,   
 "3": 2400,   
 "4": 2600,   
 "c": 0   
 },  
 "21-07-2019": {   
 "1": 100,   
 "2": 200,   
 "3": 300,   
 "4": 400,   
 "c": 100   
 },   
 "02-08-2019": {   
 "1": 100,   
 "2": 200,   
 "3": 300,   
 "4": 400,   
 "c": 100   
 }   
 }   
}   
*Notes:* 

• This will return the current rates (occupancy based) for the hotel in the selected date range  (fromDate to toDate) 

• The key ‘c’ represents rates for extra child. In the above result, keys 1, 2, 3 and 4 represents  rates for single, double, triple and quadrupole occupancies. Number of occupants for a  given room type is defined during the hotel onboarding step. 

• Format of fromDate and toDate: dd-MM-yyyy 

• pmsId: Represents the unique id for the PMS given by Stayflexi 

• hotelId: Represents the Stayflexi hotel id 

**5\. Send Rate Updates** 

Method: POST   
http://beta.stayflexi.com/apiv1/cmservice/rates/?pmsId=\<pmsId\>\&hotelId=\<hotelId\>\&daysInclu ded=Sunday,Monday,.....,Saturday 

Sample Request: 

\[   
 {   
 "roomTypeId": "\<roomTypeId\>",   
 "ratePlanId": "\<ratePlanId\>",   
 "fromDate" : "20-05-2019",   
 "toDate" : "30-07-2019",   
 "currency" : "INR",   
 "roomRate" : {   
 "1" : 3000.0,   
 "2" : 4000.0,   
 "3" : 5000.0,   
 "4" : 5000.0,   
 "c" : 500.0   
 }   
 },   
 {  
 "roomTypeId": "\<roomTypeId\>",   
 "ratePlanId": "\<ratePlanId\>",   
 "fromDate" : "20-08-2019",   
 "toDate" : "30-09-2019",   
 "currency" : "INR",   
 "roomRate" : {   
 "1" : 2000.0,   
 "2" : 3000.0,   
 "3" : 4000.0,   
 "4" : 5000.0,   
 "c" : 500.0   
 }   
 }   
\] 

*Notes:* 

• This allows you to post occupancy based pricing for the given room type and rate plan • pmsId: Represents the unique id for the PMS given by Stayflexi 

• hotelId: Represents the Stayflexi hotel id 

• daysIncluded: Represents the days (Sunday, Monday, Tuesday, Wednesday, Thursday,  Friday, Saturday) for which the given rates will get broadcasted. This is optional. If not  passed, the rates will get broadcasted for all the days in the week 

• Format of fromDate and toDate is dd-mm-YYYY 

• Request payload represents a list of updates. roomTypeId and ratePlanId represents the ids  maintained by Stayflexi. roomRate represents the occupancy based pricing 

Sample Response 

{   
 "status" : true,   
 "message" : "Success"   
} 

**6\. Send Inventory Updates:** 

Method: POST   
http://beta.stayflexi.com/apiv1/cmservice/inventory/?pmsId=\<pmsId\>\&hotelId=\<hotelId\>\&days Included=Sunday,Monday,.....,Saturday 

Sample Request: 

\[   
 {   
 "roomTypeId" : "\<roomTypeId\>",   
 "fromDate" : "20-05-2019",   
 "toDate" : "30-07-2019",   
 "roomCount" : 10   
 },  
 {   
 "roomTypeId" : "roomTypeId",   
 "fromDate" : "20-08-2019",   
 "toDate" : "30-09-2019",   
 "roomCount" : 8   
 }   
\] 

*Notes:* 

• This request is used to post room inventories for the given roomtype 

• pmsId: Represents the unique id for the PMS given by Stayflexi 

• hotelId: Represents the Stayflexi hotel id 

• daysIncluded: Represents the days (Sunday, Monday, Tuesday, Wednesday, Thursday,  Friday, Saturday) for which the given rates will get broadcasted. This is optional. If not  passed, the rates will get broadcasted for all the days in the week 

• Format of fromDate and toDate is dd-mm-YYYY 

• Request payload represents a list of updates. roomTypeId represents the id maintained by  Stayflexi.  

Sample Response 

{   
 "status" : true,   
 "message" : "Success"   
} 

**7\. Send Restrictions:** 

METHOD: POST   
http://beta.stayflexi.com/apiv1/cmservice/sendrestriction/?pmsId=\<pmsId\>\&hotelId=\<hotelId\> \&daysIncluded=Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday 

Sample Request: 

{   
"roomTypeId" : "\<roomTypeId\>",   
"ratePlanId" : "\<ratePlanId\>",   
"fromDate" : "20-07-2019",   
"toDate" : "23-07-2019",   
"minLos" : 2,   
 "maxLos" :31,   
 "closedOnArrival" : true,   
 "closedOnDeparture" : false,   
 "stopSell" : false,   
 "stopRTSell" : false,   
} 

*Notes:* 

• This request is used to post restrictions for the given roomtype and rateplan  
• The restrictions are broadcasted to all the OTAs. Do note that not all OTAs support all the  restrictions above. We silently ignore the update of restriction to a given OTA if it is not  supported 

• pmsId: Represents the unique id for the PMS given by Stayflexi 

• use stopSell to close the rate plan. Use stopRTSell to close the entire room type • hotelId: Represents the Stayflexi hotel id 

• daysIncluded: Represents the days (Sunday, Monday, Tuesday, Wednesday, Thursday,  Friday, Saturday) for which the given rates will get broadcasted. This is optional. If not  passed, the rates will get broadcasted for all the days in the week 

• Format of fromDate and toDate is dd-mm-YYYY 

• Request payload represents a list of updates. roomTypeId represents the id maintained by  Stayflexi.  

Sample Response 

{   
 "status" : true,   
 "message" : "Success"   
} 

**8\. Get Restriction Info:**   
Method: GET   
http://beta.stayflexi.com/apiv1/cmservice/getrestriction/?pmsId=\<pmsId\>\&hotelId=\<hotelId\>\&r oomTypeId=\<roomTypeId\>\&ratePlanId=\<ratePlanId\>\&fromDate=\<fromDate\>\&toDate=\<toDat e\>\&channelName=\<channelName\> 

*Notes:* 

• pmsId: Represents the unique id for the PMS given by Stayflexi 

• hotelId: Represents the Stayflexi hotel id 

• The api returns the restriction info for the given OTA channel in the given date range. The  OTA channel should be one of the registered channel for the hotel. 

• Format of fromDate and toDate is dd-mm-YYYY hh:mm:ss 

Sample Response: 

{   
 "status" : true,   
 "message" : "Success",   
 "restrictionMessage" : \[   
 {   
 "startDate" : "21-07-2019",   
 "minLos" : "2",   
 "maxLos" : "31",   
 "closedOnArrival" : "true",   
 "closedOnDeparture" : "false",   
 "stopSell" : "true",  
 "stopRTSell" : "true",   
 },   
 {   
 "startDate" : "22-07-2019",   
 "minLos" : "1",   
 "maxLos" : "31",   
 "closedOnArrival" : "true",   
 "closedOnDeparture" : "false",   
 "stopSell" : "false",   
 "stopRTSell" : "false",   
 }   
 \]    
} 

**9\. Get Booking List:** 

Method: POST   
http://beta.stayflexi.com/apiv1/cmservice/bookinglist/?pmsId=\<pmsId\>\&hotelId=\<hotelId\> 

*Notes:* 

• pmsId: Represents the unique id for the PMS given by Stayflexi 

• hotelId: Represents the Stayflexi hotel id 

• This API will return all the bookings made within the past 30 days across all the OTAs registered with this hotel 

• If there are no bookings, it will return an empty list 

• checkin and checkout have the format: dd-mm-YYYY 

• bookingStatus can be either one of CREATED, MODIFIED or CANCELLED Sample Response: 

\[   
 {   
 "checkin" : "20-05-2019",   
 "checkout" : "21-05-2019",   
 "bookingId" : "SFBOOKING\_12363\_12353",   
 "bookingStatus" : "CREATED"   
 },   
 {   
 "checkin" : "23-05-2019",   
 "checkout" : "24-05-2019",   
 "bookingId" : "SFBOOKING\_12363\_12355",   
 "bookingStatus" : "CANCELLED"   
 }   
\] 

**10\. Get Booking Detail:** 

METHOD: GET   
http://beta.stayflexi.com/apiv1/cmservice/bookingdetail/?pmsId=\<pmsId\>\&hotelId=\<hotelId\>& bookingId=\<bookingId\>  
*Notes:* 

• pmsId: Represents the unique id for the PMS given by Stayflexi 

• hotelId: Represents the Stayflexi hotel id 

• bookingId: Represents the Stayflexi Booking Id 

• Format of checkin and checkout: dd-mm-YYYY HH:MM:SS 

• roomStays represents the rooms booked by the customer. In the below example, the  customer has booked 2 rooms. First room has 2 adults, 1 child, room type id: 12353 and  rate plan id is 12355\. These Ids are stayflexi ids 

• bookingId: This is the booking id maintained by Stayflexi for the given booking • channelBookingId: This is the booking id maintained by the given OTA 

Sample Success Response: 

{   
 "checkin": "30-03-2019 05:00:00",   
 "checkout": "30-03-2019 12:00:00",   
 "hotelId": "12353",   
 "finalRateAndTax": {   
 "rateAndTax": {   
 "rate": 800,   
 "tax": 0   
 },   
 "perDayPriceList": \[   
 {   
 "timestamp": 1590431400,   
 "date": "26-05-2020 00:00:00",   
 "rate": 400,   
 "tax": 0,   
 "hours": 7,   
 "numAdults": 1,   
 "numChildren": 1,   
 "roomTypeId": "12353",   
 "ratePlanId": "12355"   
 },   
 {   
 "timestamp": 1590431400,   
 "date": "26-05-2020 00:00:00",   
 "rate": 400,   
 "tax": 0,   
 "hours": 7,   
 "numAdults": 2,   
 "numChildren": 1,   
 "roomTypeId": "12353",   
 "ratePlanId": "12355"   
 }   
 \]  
 },   
 "roomStays": \[   
 {   
 "numAdults": 2,   
 "numChildren": 1,   
 "roomTypeId": "12353",   
 "ratePlanId": "12355"   
 },   
 {   
 "numAdults": 2,   
 "numChildren": 1,   
 "roomTypeId": "12354",   
 "ratePlanId": "12355"   
 }   
 \],   
 "customerDetails": {   
 "firstName": "Preetam Shetty",   
 "emailId": "preetammshetty@gmail.com",   
 "phoneNumber": "8185198890",   
 "country": "India"   
 },   
 "paymentDetails": {   
 "sellRate": 800,   
 "netRate": 800,   
 "payAtHotel": true   
 },   
 "specialRequests": "Extra bed",   
 "bookingStatus": "CREATED",   
 "bookingId": "SFBOOKING\_12353\_12368",   
 "channelBookingId": "32523452345",   
 "bookingSource": "Expedia",   
 "nightStay": {   
 "startDate": "29-03-2019",   
 "numNights": 1,   
 "numRooms": 2   
 }   
 "status": true,   
 "message": "Success"   
} 

**11\. Push Booking:** 

Stayflexi will send Booking Confirmation / Booking Cancellation notifications to the consumer.  In order to integrate:  
• Provide us an URL endpoint to which we can send these notifications. This should be a  fixed URL endpoint (Protocol: https) 

• The Content-Type of the request will be application/json 

• We request you to periodically poll the bookinglist API to avoid any notification misses • The complete flow would be:   
o Stayflexi sends the booking notification as and when there is a booking  confirmation / cancellation from our platform. 

o The consumer periodically calls the bookinglist and bookingdetail API for each  property a certain number of times per day to validate if all the notifications have  been successfully sent or not. 

**Sample Push Notification Request**: 

{   
 "checkin": "30-03-2019 05:00:00",   
 "checkout": "30-03-2019 12:00:00",   
 "hotelId": "12353",   
 "roomStays": \[   
 {   
 "numAdults": 2,   
 "numChildren": 1,   
 "roomTypeId": "12353",   
 "ratePlanId": "12355"   
 },   
 {   
 "numAdults": 2,   
 "numChildren": 1,   
 "roomTypeId": "12354",   
 "ratePlanId": "12355"   
 }   
 \],   
 "customerDetails": {   
 "firstName": "Preetam Shetty",   
 "emailId": "preetammshetty@gmail.com",   
 "phoneNumber": "8185198890",   
 "country": "India"   
 },   
 "paymentDetails": {   
 "sellRate": 800,   
 "netRate": 800,   
 "totalTaxes": 800,   
 "payAtHotel": true   
 },   
 "specialRequests": "Extra bed",   
 "bookingStatus": "CREATED",   
 "bookingId": "SFBOOKING\_12353\_12368",  
 "channelBookingId": "32523452345",   
 "bookingSource": "Expedia",   
 "nightStay": {   
 "startDate": "29-03-2019",   
 "numNights": 2,   
 "numRooms": 2   
 }   
} 

Success Response: 

{   
 "status" : true,   
 "message" : "Success"   
} 

*Notes:* 

• The valid values for BookingStatus is CREATED, MODIFIED, CANCELLED • The consumer will, under no circumstances, reject a confirmed booking • Stayflexi will expect a Success message. On getting an Failure response, there will 2 more    
retries. If a Success message is not obtained on 3 retires, an email will be sent to the  consumer admin citing the Failure response