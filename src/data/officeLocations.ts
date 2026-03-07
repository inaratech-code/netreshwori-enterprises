/**
 * Office coordinates for the map pins.
 * To get exact coordinates: open your Google Maps link (goo.gl), right-click the location → "What's here?" to see lat,lng.
 */

export type OfficeLocation = {
    name: string;
    lat: number;
    lng: number;
    mapsUrl: string;
};

export const OFFICE_LOCATIONS: OfficeLocation[] = [
    {
        name: "Head Office",
        lat: 28.7014,
        lng: 80.596,
        mapsUrl: "https://maps.app.goo.gl/1Cyx947pjRU4y4TGA",
    },
    {
        name: "Branch Office",
        lat: 28.71,
        lng: 80.605,
        mapsUrl: "https://maps.app.goo.gl/7ZgxgjEoXcspz5SD9",
    },
];
