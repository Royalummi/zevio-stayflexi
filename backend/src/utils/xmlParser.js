import { XMLParser } from "fast-xml-parser";

const parserDefaults = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: true,
  parseAttributeValue: true,
};

export const parseXmlPayload = (xml, options = {}) => {
  if (typeof xml !== "string" || !xml.trim()) {
    throw new Error("XML payload is required");
  }

  const parser = new XMLParser({ ...parserDefaults, ...options });
  return parser.parse(xml);
};

export const getXmlRootName = (parsedPayload) => {
  if (!parsedPayload || typeof parsedPayload !== "object") {
    return "unknown_root";
  }

  const rootName = Object.keys(parsedPayload).find((key) => key !== "?xml");
  return rootName || "unknown_root";
};
