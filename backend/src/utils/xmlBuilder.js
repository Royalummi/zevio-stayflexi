import { XMLBuilder } from "fast-xml-parser";

const builderDefaults = {
  ignoreAttributes: false,
  format: true,
  suppressBooleanAttributes: false,
};

export const buildXmlResponse = (payload, options = {}) => {
  const builder = new XMLBuilder({ ...builderDefaults, ...options });
  return builder.build(payload);
};

export const buildChannelManagerAckXml = ({
  providerKey,
  status = "success",
  message = "Webhook received",
  eventId = null,
}) => {
  return buildXmlResponse({
    response: {
      provider: providerKey,
      status,
      message,
      event_id: eventId,
      timestamp: new Date().toISOString(),
    },
  });
};

export const buildStayflexiSuccessXml = () => {
  return buildXmlResponse({ SuccessRS: "" });
};

export const buildStayflexiErrorXml = ({ code = "500", description }) => {
  return buildXmlResponse({
    ErrorRS: {
      "@_Code": String(code),
      Description: description || "Internal server error",
    },
  });
};

export const buildStayflexiInventoryResponseXml = ({
  hotelCode,
  roomTypeCode,
  version = "1.0",
  availability,
}) => {
  return buildXmlResponse({
    GetRoomInventoryRS: {
      "@_HotelCode": String(hotelCode),
      "@_RoomTypeCode": String(roomTypeCode),
      "@_Version": String(version),
      Availability: availability.map((entry) => ({
        "@_Date": entry.date,
        Count: Number(entry.count),
      })),
    },
  });
};

export const buildStayflexiRateResponseXml = ({
  hotelCode,
  roomTypeCode,
  ratePlanCode,
  currency = "INR",
  version = "1.0",
  rates,
}) => {
  return buildXmlResponse({
    GetRoomRateRS: {
      "@_HotelCode": String(hotelCode),
      "@_RoomTypeCode": String(roomTypeCode),
      "@_RatePlanCode": String(ratePlanCode),
      "@_Currency": String(currency),
      "@_Version": String(version),
      Rate: rates.map((entry) => ({
        "@_Date": entry.date,
        Single: Number(entry.single),
        Double: Number(entry.double),
        Triple: Number(entry.triple),
        ExtraAdult: Number(entry.extraAdult),
        ExtraChild: Number(entry.extraChild),
      })),
    },
  });
};

export const buildStayflexiRestrictionResponseXml = ({
  hotelCode,
  roomTypeCode,
  ratePlanCode,
  version = "1.0",
  restrictions,
}) => {
  const toTextBool = (value) => (value ? "True" : "False");

  return buildXmlResponse({
    GetRestrictionRS: {
      "@_HotelCode": String(hotelCode),
      "@_RoomTypeCode": String(roomTypeCode),
      "@_RatePlanCode": String(ratePlanCode),
      "@_Version": String(version),
      Restriction: restrictions.map((entry) => ({
        "@_Date": entry.date,
        StopSell: toTextBool(entry.stopSell),
        ClosedOnArrival: toTextBool(entry.closedOnArrival),
        ClosedOnDeparture: toTextBool(entry.closedOnDeparture),
        MinLOS: Number(entry.minLos),
        MaxLOS: Number(entry.maxLos),
      })),
    },
  });
};

export const buildStayflexiHotelDetailResponseXml = ({
  hotelCode,
  version = "1.0",
  rooms,
  ratePlans,
}) => {
  const toTextBool = (value) => (value ? "True" : "False");

  return buildXmlResponse({
    HotelDetailRS: {
      "@_Version": String(version),
      HotelCode: String(hotelCode),
      RoomList: {
        Room: rooms.map((room) => ({
          RoomTypeCode: String(room.roomTypeCode),
          RoomTypeName: String(room.roomTypeName),
          IsActive: toTextBool(room.isActive),
        })),
      },
      RatePlanList: {
        RatePlan: ratePlans.map((plan) => ({
          RoomTypeCode: String(plan.roomTypeCode),
          RoomTypeName: String(plan.roomTypeName),
          RatePlanCode: String(plan.ratePlanCode),
          RatePlanName: String(plan.ratePlanName),
          IsActive: toTextBool(plan.isActive),
        })),
      },
    },
  });
};
