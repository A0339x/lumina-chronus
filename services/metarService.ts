// METAR Weather Service - Real airport temperatures from aviation weather data

export interface Airport {
  icao: string;
  lat: number;
  lng: number;
  name: string;
}

export interface NearestAirportInfo {
  airport: Airport;
  temp: number;
  distance: number; // in degrees (approximate)
}

// Major airports worldwide covering all inhabited areas
const AIRPORTS: Airport[] = [
  // UTC+14 to UTC+12 - Pacific Islands & New Zealand
  { icao: "NZAA", lat: -37.01, lng: 174.79, name: "Auckland" },
  { icao: "NZWN", lat: -41.33, lng: 174.81, name: "Wellington" },
  { icao: "NZCH", lat: -43.49, lng: 172.53, name: "Christchurch" },
  { icao: "NFFN", lat: -17.75, lng: 177.44, name: "Nadi" },
  { icao: "UHPP", lat: 53.17, lng: 158.45, name: "Petropavlovsk" },

  // UTC+11 - Solomon Islands, Vanuatu
  { icao: "NVVV", lat: -17.70, lng: 168.32, name: "Port Vila" },
  { icao: "AGGH", lat: -9.43, lng: 160.05, name: "Honiara" },
  { icao: "NWWW", lat: -22.27, lng: 166.47, name: "Nouméa" },
  { icao: "UHMM", lat: 59.91, lng: 150.72, name: "Magadan" },

  // UTC+10 - Eastern Australia, Papua New Guinea
  { icao: "YSSY", lat: -33.95, lng: 151.18, name: "Sydney" },
  { icao: "YMML", lat: -37.67, lng: 144.84, name: "Melbourne" },
  { icao: "YBBN", lat: -27.38, lng: 153.12, name: "Brisbane" },
  { icao: "AYPY", lat: -5.86, lng: 145.39, name: "Port Moresby" },
  { icao: "UHWW", lat: 43.40, lng: 132.15, name: "Vladivostok" },
  { icao: "PGUM", lat: 13.48, lng: 144.80, name: "Guam" },

  // UTC+9:30 - Central Australia
  { icao: "YPAD", lat: -34.94, lng: 138.53, name: "Adelaide" },
  { icao: "YPDN", lat: -12.41, lng: 130.88, name: "Darwin" },

  // UTC+9 - Japan, Korea
  { icao: "RJTT", lat: 35.55, lng: 139.78, name: "Tokyo Haneda" },
  { icao: "RJAA", lat: 35.76, lng: 140.39, name: "Tokyo Narita" },
  { icao: "RJBB", lat: 34.43, lng: 135.24, name: "Osaka Kansai" },
  { icao: "RKSI", lat: 37.47, lng: 126.45, name: "Seoul Incheon" },
  { icao: "RKSS", lat: 37.56, lng: 126.79, name: "Seoul Gimpo" },
  { icao: "RKPK", lat: 35.18, lng: 128.94, name: "Busan" },
  { icao: "RJCC", lat: 42.77, lng: 141.69, name: "Sapporo" },
  { icao: "UEEE", lat: 62.09, lng: 129.77, name: "Yakutsk" },

  // UTC+8 - China, Singapore, Philippines, Malaysia, Western Australia
  { icao: "ZBAA", lat: 40.08, lng: 116.58, name: "Beijing" },
  { icao: "ZSPD", lat: 31.14, lng: 121.81, name: "Shanghai Pudong" },
  { icao: "ZGGG", lat: 23.39, lng: 113.30, name: "Guangzhou" },
  { icao: "ZGSZ", lat: 22.64, lng: 113.81, name: "Shenzhen" },
  { icao: "VHHH", lat: 22.31, lng: 113.92, name: "Hong Kong" },
  { icao: "RCTP", lat: 25.08, lng: 121.23, name: "Taipei" },
  { icao: "WSSS", lat: 1.36, lng: 103.99, name: "Singapore" },
  { icao: "RPLL", lat: 14.51, lng: 121.02, name: "Manila" },
  { icao: "WMKK", lat: 2.74, lng: 101.70, name: "Kuala Lumpur" },
  { icao: "YPPH", lat: -31.94, lng: 115.97, name: "Perth" },
  { icao: "ZMUB", lat: 47.84, lng: 106.77, name: "Ulaanbaatar" },
  { icao: "UIII", lat: 52.27, lng: 104.39, name: "Irkutsk" },

  // UTC+7 - Thailand, Vietnam, Indonesia
  { icao: "VTBS", lat: 13.69, lng: 100.75, name: "Bangkok" },
  { icao: "VVNB", lat: 21.22, lng: 105.80, name: "Hanoi" },
  { icao: "VVTS", lat: 10.82, lng: 106.65, name: "Ho Chi Minh City" },
  { icao: "WIII", lat: -6.13, lng: 106.66, name: "Jakarta" },
  { icao: "UNNT", lat: 55.01, lng: 82.65, name: "Novosibirsk" },
  { icao: "UNKL", lat: 56.17, lng: 92.49, name: "Krasnoyarsk" },

  // UTC+6:30 - Myanmar
  { icao: "VYYY", lat: 16.91, lng: 96.13, name: "Yangon" },

  // UTC+6 - Bangladesh, Central Asia
  { icao: "VGHS", lat: 23.84, lng: 90.40, name: "Dhaka" },
  { icao: "UAAA", lat: 43.35, lng: 77.04, name: "Almaty" },
  { icao: "UACC", lat: 51.02, lng: 71.47, name: "Astana" },
  { icao: "UTTT", lat: 41.26, lng: 69.28, name: "Tashkent" },
  { icao: "UNOO", lat: 55.01, lng: 73.31, name: "Omsk" },

  // UTC+5:45 - Nepal
  { icao: "VNKT", lat: 27.70, lng: 85.36, name: "Kathmandu" },

  // UTC+5:30 - India, Sri Lanka
  { icao: "VIDP", lat: 28.57, lng: 77.09, name: "Delhi" },
  { icao: "VABB", lat: 19.09, lng: 72.87, name: "Mumbai" },
  { icao: "VOBL", lat: 13.20, lng: 77.71, name: "Bengaluru" },
  { icao: "VECC", lat: 22.65, lng: 88.45, name: "Kolkata" },
  { icao: "VOMM", lat: 12.99, lng: 80.17, name: "Chennai" },
  { icao: "VCBI", lat: 7.18, lng: 79.88, name: "Colombo" },

  // UTC+5 - Pakistan, Uzbekistan
  { icao: "OPKC", lat: 24.91, lng: 67.16, name: "Karachi" },
  { icao: "OPRN", lat: 33.62, lng: 73.10, name: "Islamabad" },
  { icao: "OPLA", lat: 31.52, lng: 74.40, name: "Lahore" },
  { icao: "USSS", lat: 56.74, lng: 60.80, name: "Yekaterinburg" },

  // UTC+4:30 - Afghanistan
  { icao: "OAKB", lat: 34.57, lng: 69.21, name: "Kabul" },

  // UTC+4 - UAE, Gulf, Caucasus
  { icao: "OMDB", lat: 25.25, lng: 55.36, name: "Dubai" },
  { icao: "OMAA", lat: 24.44, lng: 54.65, name: "Abu Dhabi" },
  { icao: "OOMS", lat: 23.60, lng: 58.28, name: "Muscat" },
  { icao: "UBBB", lat: 40.47, lng: 50.05, name: "Baku" },
  { icao: "UGGG", lat: 41.67, lng: 44.95, name: "Tbilisi" },
  { icao: "UDYZ", lat: 40.15, lng: 44.40, name: "Yerevan" },
  { icao: "FIMP", lat: -20.43, lng: 57.68, name: "Mauritius" },
  { icao: "FMEE", lat: -20.89, lng: 55.52, name: "Réunion" },

  // UTC+3:30 - Iran
  { icao: "OIIE", lat: 35.69, lng: 51.31, name: "Tehran" },
  { icao: "OIMM", lat: 36.24, lng: 59.64, name: "Mashhad" },

  // UTC+3 - Moscow, East Africa, Middle East
  { icao: "UUEE", lat: 55.97, lng: 37.41, name: "Moscow Sheremetyevo" },
  { icao: "UUDD", lat: 55.41, lng: 37.91, name: "Moscow Domodedovo" },
  { icao: "ULLI", lat: 59.80, lng: 30.26, name: "St. Petersburg" },
  { icao: "LTFM", lat: 41.26, lng: 28.74, name: "Istanbul" },
  { icao: "OERK", lat: 24.96, lng: 46.70, name: "Riyadh" },
  { icao: "OEJN", lat: 21.68, lng: 39.16, name: "Jeddah" },
  { icao: "ORBI", lat: 33.26, lng: 44.23, name: "Baghdad" },
  { icao: "OTHH", lat: 25.26, lng: 51.61, name: "Doha" },
  { icao: "OKBK", lat: 29.23, lng: 47.97, name: "Kuwait" },
  { icao: "HKJK", lat: -1.32, lng: 36.93, name: "Nairobi" },
  { icao: "HAAB", lat: 8.98, lng: 38.80, name: "Addis Ababa" },
  { icao: "HTDA", lat: -6.88, lng: 39.20, name: "Dar es Salaam" },
  { icao: "FMMI", lat: -18.80, lng: 47.48, name: "Antananarivo" },

  // UTC+2 - Eastern Europe, Southern Africa
  { icao: "HECA", lat: 30.11, lng: 31.40, name: "Cairo" },
  { icao: "LGAV", lat: 37.94, lng: 23.94, name: "Athens" },
  { icao: "LLBG", lat: 32.01, lng: 34.89, name: "Tel Aviv" },
  { icao: "UKBB", lat: 50.34, lng: 30.89, name: "Kyiv Boryspil" },
  { icao: "LROP", lat: 44.57, lng: 26.09, name: "Bucharest" },
  { icao: "EFHK", lat: 60.32, lng: 24.96, name: "Helsinki" },
  { icao: "LBSF", lat: 42.69, lng: 23.41, name: "Sofia" },
  { icao: "FAOR", lat: -26.13, lng: 28.24, name: "Johannesburg" },
  { icao: "FACT", lat: -33.97, lng: 18.60, name: "Cape Town" },
  { icao: "FVHA", lat: -17.93, lng: 31.09, name: "Harare" },

  // UTC+1 - Central Europe, West Africa
  { icao: "LFPG", lat: 49.01, lng: 2.55, name: "Paris CDG" },
  { icao: "EDDF", lat: 50.03, lng: 8.57, name: "Frankfurt" },
  { icao: "EDDM", lat: 48.35, lng: 11.79, name: "Munich" },
  { icao: "LIRF", lat: 41.80, lng: 12.25, name: "Rome" },
  { icao: "LEMD", lat: 40.47, lng: -3.56, name: "Madrid" },
  { icao: "LEBL", lat: 41.30, lng: 2.08, name: "Barcelona" },
  { icao: "EHAM", lat: 52.31, lng: 4.77, name: "Amsterdam" },
  { icao: "EBBR", lat: 50.90, lng: 4.48, name: "Brussels" },
  { icao: "LOWW", lat: 48.11, lng: 16.57, name: "Vienna" },
  { icao: "EPWA", lat: 52.17, lng: 20.97, name: "Warsaw" },
  { icao: "LKPR", lat: 50.10, lng: 14.26, name: "Prague" },
  { icao: "LHBP", lat: 47.44, lng: 19.26, name: "Budapest" },
  { icao: "ESSA", lat: 59.65, lng: 17.92, name: "Stockholm" },
  { icao: "EKCH", lat: 55.62, lng: 12.66, name: "Copenhagen" },
  { icao: "ENGM", lat: 60.19, lng: 11.10, name: "Oslo" },
  { icao: "LSZH", lat: 47.46, lng: 8.55, name: "Zurich" },
  { icao: "DNMM", lat: 6.58, lng: 3.32, name: "Lagos" },
  { icao: "DAAG", lat: 36.69, lng: 3.22, name: "Algiers" },
  { icao: "DTTA", lat: 36.85, lng: 10.23, name: "Tunis" },

  // UTC+0 - UK, Portugal, West Africa
  { icao: "EGLL", lat: 51.47, lng: -0.46, name: "London Heathrow" },
  { icao: "EGKK", lat: 51.15, lng: -0.18, name: "London Gatwick" },
  { icao: "EIDW", lat: 53.43, lng: -6.27, name: "Dublin" },
  { icao: "LPPT", lat: 38.77, lng: -9.13, name: "Lisbon" },
  { icao: "BIKF", lat: 63.99, lng: -22.61, name: "Reykjavik" },
  { icao: "DGAA", lat: 5.61, lng: -0.17, name: "Accra" },
  { icao: "GOBD", lat: 14.67, lng: -17.07, name: "Dakar" },
  { icao: "GMMN", lat: 33.37, lng: -7.59, name: "Casablanca" },

  // UTC-1 - Cape Verde, Azores
  { icao: "GVNP", lat: 14.92, lng: -23.49, name: "Praia" },
  { icao: "LPAZ", lat: 36.97, lng: -25.17, name: "Ponta Delgada" },

  // UTC-3 - Brazil, Argentina
  { icao: "SBGR", lat: -23.43, lng: -46.47, name: "São Paulo" },
  { icao: "SBGL", lat: -22.81, lng: -43.25, name: "Rio de Janeiro" },
  { icao: "SBBR", lat: -15.87, lng: -47.92, name: "Brasília" },
  { icao: "SAEZ", lat: -34.82, lng: -58.54, name: "Buenos Aires" },
  { icao: "SUMU", lat: -34.84, lng: -56.03, name: "Montevideo" },
  { icao: "SCEL", lat: -33.39, lng: -70.79, name: "Santiago" },
  { icao: "SLLP", lat: -16.51, lng: -68.19, name: "La Paz" },
  { icao: "SGAS", lat: -25.24, lng: -57.52, name: "Asunción" },

  // UTC-3:30 - Newfoundland
  { icao: "CYYT", lat: 47.62, lng: -52.75, name: "St. John's" },

  // UTC-4 - Atlantic Canada, Caribbean
  { icao: "CYHZ", lat: 44.88, lng: -63.51, name: "Halifax" },
  { icao: "CYQM", lat: 46.11, lng: -64.68, name: "Moncton" },
  { icao: "CYFC", lat: 45.87, lng: -66.53, name: "Fredericton" },
  { icao: "CYYG", lat: 46.29, lng: -63.12, name: "Charlottetown" },
  { icao: "CYQX", lat: 48.94, lng: -54.57, name: "Gander" },
  { icao: "TJSJ", lat: 18.44, lng: -66.00, name: "San Juan" },
  { icao: "MDSD", lat: 18.43, lng: -69.67, name: "Santo Domingo" },
  { icao: "SVMI", lat: 10.60, lng: -66.99, name: "Caracas" },
  { icao: "SBBV", lat: 2.84, lng: -60.69, name: "Boa Vista" },

  // UTC-5 - Eastern US/Canada, Colombia, Peru
  { icao: "KJFK", lat: 40.64, lng: -73.78, name: "New York JFK" },
  { icao: "KLGA", lat: 40.78, lng: -73.87, name: "New York LaGuardia" },
  { icao: "KEWR", lat: 40.69, lng: -74.17, name: "Newark" },
  { icao: "KORD", lat: 41.97, lng: -87.91, name: "Chicago O'Hare" },
  { icao: "KATL", lat: 33.64, lng: -84.43, name: "Atlanta" },
  { icao: "KMIA", lat: 25.80, lng: -80.29, name: "Miami" },
  { icao: "KBOS", lat: 42.36, lng: -71.01, name: "Boston" },
  { icao: "KDCA", lat: 38.85, lng: -77.04, name: "Washington Reagan" },
  { icao: "KIAD", lat: 38.95, lng: -77.46, name: "Washington Dulles" },
  { icao: "KPHL", lat: 39.87, lng: -75.24, name: "Philadelphia" },
  { icao: "KDTW", lat: 42.21, lng: -83.35, name: "Detroit" },
  { icao: "CYYZ", lat: 43.68, lng: -79.63, name: "Toronto" },
  { icao: "CYUL", lat: 45.47, lng: -73.74, name: "Montreal" },
  { icao: "CYOW", lat: 45.32, lng: -75.67, name: "Ottawa" },
  { icao: "CYQB", lat: 46.79, lng: -71.39, name: "Quebec City" },
  { icao: "CYQT", lat: 48.37, lng: -89.32, name: "Thunder Bay" },
  { icao: "CYHM", lat: 43.17, lng: -79.93, name: "Hamilton" },
  { icao: "CYFB", lat: 63.76, lng: -68.56, name: "Iqaluit" },
  { icao: "SKBO", lat: 4.70, lng: -74.15, name: "Bogotá" },
  { icao: "SPJC", lat: -12.02, lng: -77.11, name: "Lima" },
  { icao: "SEQM", lat: -0.13, lng: -78.36, name: "Quito" },
  { icao: "MUHA", lat: 22.99, lng: -82.41, name: "Havana" },
  { icao: "MKJP", lat: 17.94, lng: -76.79, name: "Kingston" },
  { icao: "MPTO", lat: 9.07, lng: -79.38, name: "Panama City" },

  // UTC-6 - Central US, Mexico, Central America
  { icao: "KDFW", lat: 32.90, lng: -97.04, name: "Dallas" },
  { icao: "KIAH", lat: 30.00, lng: -95.34, name: "Houston" },
  { icao: "KAUS", lat: 30.19, lng: -97.67, name: "Austin" },
  { icao: "KMSP", lat: 44.88, lng: -93.22, name: "Minneapolis" },
  { icao: "KSTL", lat: 38.75, lng: -90.37, name: "St. Louis" },
  { icao: "KMSY", lat: 29.99, lng: -90.26, name: "New Orleans" },
  { icao: "CYWG", lat: 49.91, lng: -97.24, name: "Winnipeg" },
  { icao: "CYQR", lat: 50.43, lng: -104.67, name: "Regina" },
  { icao: "CYXE", lat: 52.17, lng: -106.70, name: "Saskatoon" },
  { icao: "MMMX", lat: 19.44, lng: -99.07, name: "Mexico City" },
  { icao: "MMUN", lat: 21.04, lng: -86.87, name: "Cancún" },
  { icao: "MGGT", lat: 14.58, lng: -90.53, name: "Guatemala City" },
  { icao: "MHTG", lat: 14.06, lng: -87.22, name: "Tegucigalpa" },
  { icao: "MSSS", lat: 13.44, lng: -89.06, name: "San Salvador" },
  { icao: "MNMG", lat: 12.14, lng: -86.17, name: "Managua" },
  { icao: "MROC", lat: 9.99, lng: -84.21, name: "San José CR" },

  // UTC-7 - Mountain US/Canada, Mexico
  { icao: "KDEN", lat: 39.86, lng: -104.67, name: "Denver" },
  { icao: "KPHX", lat: 33.44, lng: -112.01, name: "Phoenix" },
  { icao: "KSLC", lat: 40.79, lng: -111.98, name: "Salt Lake City" },
  { icao: "KABQ", lat: 35.04, lng: -106.61, name: "Albuquerque" },
  { icao: "KELP", lat: 31.81, lng: -106.38, name: "El Paso" },
  { icao: "KBOI", lat: 43.57, lng: -116.22, name: "Boise" },
  { icao: "CYYC", lat: 51.11, lng: -114.02, name: "Calgary" },
  { icao: "CYEG", lat: 53.31, lng: -113.58, name: "Edmonton" },
  { icao: "CYZF", lat: 62.46, lng: -114.44, name: "Yellowknife" },
  { icao: "CYXY", lat: 60.71, lng: -135.07, name: "Whitehorse" },
  { icao: "MMCU", lat: 28.70, lng: -105.96, name: "Chihuahua" },
  { icao: "MMHO", lat: 29.10, lng: -111.05, name: "Hermosillo" },

  // UTC-8 - Pacific US/Canada
  { icao: "KLAX", lat: 33.94, lng: -118.41, name: "Los Angeles" },
  { icao: "KSFO", lat: 37.62, lng: -122.38, name: "San Francisco" },
  { icao: "KSEA", lat: 47.45, lng: -122.31, name: "Seattle" },
  { icao: "KSAN", lat: 32.73, lng: -117.19, name: "San Diego" },
  { icao: "KLAS", lat: 36.08, lng: -115.15, name: "Las Vegas" },
  { icao: "KPDX", lat: 45.59, lng: -122.60, name: "Portland" },
  { icao: "CYVR", lat: 49.19, lng: -123.18, name: "Vancouver" },
  { icao: "CYYJ", lat: 48.65, lng: -123.43, name: "Victoria" },
  { icao: "CYLW", lat: 49.96, lng: -119.38, name: "Kelowna" },
  { icao: "MMTJ", lat: 32.54, lng: -116.97, name: "Tijuana" },

  // UTC-9 - Alaska
  { icao: "PANC", lat: 61.17, lng: -150.00, name: "Anchorage" },
  { icao: "PAFA", lat: 64.81, lng: -147.86, name: "Fairbanks" },
  { icao: "PAJN", lat: 58.36, lng: -134.58, name: "Juneau" },

  // UTC-10 - Hawaii, Tahiti
  { icao: "PHNL", lat: 21.32, lng: -157.92, name: "Honolulu" },
  { icao: "PHOG", lat: 20.90, lng: -156.43, name: "Kahului" },
  { icao: "NTAA", lat: -17.55, lng: -149.61, name: "Papeete" },

  // UTC-11 - American Samoa
  { icao: "NSTU", lat: -14.33, lng: -170.71, name: "Pago Pago" },
];

// Hardcoded temperatures - auto-updated every 6 hours by GitHub Actions
// Last updated: 2026-01-01T11:18:54.232Z
const HARDCODED_TEMPS: Record<string, number> = {
  // UTC+14 to UTC+12 - Pacific Islands & New Zealand
  "NZAA": 19, "NZWN": 18, "NZCH": 14, "NFFN": 27, "UHPP": -3,

  // UTC+11 - Solomon Islands, Vanuatu
  "NVVV": 26, "AGGH": 28, "NWWW": 28, "UHMM": -16,

  // UTC+10 - Eastern Australia, Papua New Guinea
  "YSSY": 15, "YMML": 14, "YBBN": 24, "AYPY": 15, "UHWW": -13, "PGUM": 28,

  // UTC+9:30 - Central Australia
  "YPAD": 20, "YPDN": 29,

  // UTC+9 - Japan, Korea
  "RJTT": 7, "RJAA": 4, "RJBB": 7, "RKSI": -5, "RKSS": -8, "RKPK": -3, "RJCC": -11, "UEEE": -27,

  // UTC+8 - China, Singapore, Philippines, Malaysia, Western Australia
  "ZBAA": -3, "ZSPD": 5, "ZGGG": 14, "ZGSZ": 18, "VHHH": 19, "RCTP": 16, "WSSS": 27, "RPLL": 28, "WMKK": 28, "YPPH": 31, "ZMUB": -25, "UIII": -18,

  // UTC+7 - Thailand, Vietnam, Indonesia
  "VTBS": 30, "VVNB": 21, "VVTS": 28, "WIII": 27, "UNNT": -8, "UNKL": -1,

  // UTC+6:30 - Myanmar
  "VYYY": 28,

  // UTC+6 - Bangladesh, Central Asia
  "VGHS": 19, "UAAA": 1, "UACC": -9, "UTTT": 5, "UNOO": -13,

  // UTC+5:45 - Nepal
  "VNKT": 15,

  // UTC+5:30 - India, Sri Lanka
  "VIDP": 16, "VABB": 25, "VOBL": 27, "VECC": 21, "VOMM": 26, "VCBI": 27,

  // UTC+5 - Pakistan
  "OPKC": 25, "OPRN": 14, "OPLA": 16, "USSS": -10,

  // UTC+4:30 - Afghanistan
  "OAKB": 6,

  // UTC+4 - UAE, Gulf, Caucasus
  "OMDB": 22, "OMAA": 22, "OOMS": 24, "UBBB": 6, "UGGG": 5, "UDYZ": 0, "FIMP": 26, "FMEE": 28,

  // UTC+3:30 - Iran
  "OIIE": 9, "OIMM": 11,

  // UTC+3 - Moscow, East Africa, Middle East
  "UUEE": -10, "UUDD": -10, "ULLI": -7, "LTFM": 2, "OERK": 23, "OEJN": 29, "ORBI": 17, "OTHH": 21, "OKBK": 21, "HKJK": 23, "HAAB": 23, "HTDA": 30, "FMMI": 25,

  // UTC+2 - Eastern Europe, Southern Africa
  "HECA": 20, "LGAV": 6, "LLBG": 16, "UKBB": -9, "LROP": -1, "EFHK": -13, "LBSF": -1, "FAOR": 26, "FACT": 27, "FVHA": 27,

  // UTC+1 - Central Europe, West Africa
  "LFPG": 2, "EDDF": 2, "EDDM": 0, "LIRF": 10, "LEMD": 3, "LEBL": 11, "EHAM": 6, "EBBR": 4, "LOWW": 4, "EPWA": 0, "LKPR": 0, "LHBP": 3, "ESSA": 1, "EKCH": 4, "ENGM": -1, "LSZH": -1, "DNMM": 31, "DAAG": 15, "DTTA": 15,

  // UTC+0 - UK, Portugal, West Africa
  "EGLL": 4, "EGKK": 3, "EIDW": 4, "LPPT": 11, "BIKF": 4, "DGAA": 31, "GOBD": 29, "GMMN": 19,

  // UTC-1 - Cape Verde, Azores
  "GVNP": 28, "LPAZ": 16,

  // UTC-3 - Brazil, Argentina
  "SBGR": 25, "SBGL": 30, "SBBR": 24, "SAEZ": 20, "SUMU": 24, "SCEL": 22, "SLLP": 6, "SGAS": 25,

  // UTC-3:30 - Newfoundland
  "CYYT": 2,

  // UTC-4 - Atlantic Canada, Caribbean
  "CYHZ": -3, "TJSJ": 19, "MDSD": 24, "SVMI": 28, "SBBV": 26,

  // UTC-5 - Eastern US/Canada, Colombia, Peru
  "KJFK": 2, "KLGA": -2, "KEWR": -2, "KORD": -11, "KATL": 1, "KMIA": 7, "KBOS": -1, "KDCA": 0, "KIAD": -2, "KPHL": 0, "KDTW": -12, "CYYZ": -15, "CYUL": -13, "CYOW": -15, "SKBO": 10, "SPJC": 18, "SEQM": 10, "MUHA": 16, "MKJP": 23, "MPTO": 26,

  // UTC-6 - Central US, Mexico, Central America
  "KDFW": 6, "KIAH": 5, "KAUS": 7, "KMSP": -14, "KSTL": -2, "KMSY": 4, "CYWG": -19, "MMMX": 8, "MMUN": 15, "MGGT": 13, "MHTG": 19, "MSSS": 22, "MNMG": 23, "MROC": 22,

  // UTC-7 - Mountain US/Canada, Mexico
  "KDEN": 4, "KPHX": 14, "KSLC": -1, "KABQ": 4, "KELP": 10, "KBOI": -2, "CYYC": -6, "CYEG": -8, "MMCU": 10, "MMHO": 18,

  // UTC-8 - Pacific US/Canada
  "KLAX": 14, "KSFO": 11, "KSEA": 2, "KSAN": 16, "KLAS": 8, "KPDX": 2, "CYVR": 3, "MMTJ": 16,

  // UTC-9 - Alaska
  "PANC": -9, "PAFA": -38, "PAJN": 1,

  // UTC-10 - Hawaii, Tahiti
  "PHNL": 23, "PHOG": 23, "NTAA": 27,

  // UTC-11 - American Samoa
  "NSTU": 29,

};

// Convert to Map for faster lookups
const tempCache = new Map<string, number>(Object.entries(HARDCODED_TEMPS));

// No-op function - no API calls needed with hardcoded data
export const fetchAllMetar = async (): Promise<void> => {
  // Temperatures are hardcoded, no fetching needed
  return;
};

// Get temperature for a location (finds nearest airport)
export const getMetarTemp = (lat: number, lng: number): number | null => {
  // Find nearest airport within reasonable distance
  let nearestAirport: Airport | null = null;
  let nearestDist = Infinity;

  for (const airport of AIRPORTS) {
    // Simple distance calculation (good enough for finding nearest)
    const dLat = airport.lat - lat;
    const dLng = airport.lng - lng;
    // Adjust for longitude wrapping
    const adjDLng = Math.min(Math.abs(dLng), 360 - Math.abs(dLng));
    const dist = Math.sqrt(dLat * dLat + adjDLng * adjDLng);

    if (dist < nearestDist) {
      nearestDist = dist;
      nearestAirport = airport;
    }
  }

  // Only use if within ~15 degrees (roughly one timezone width)
  if (nearestAirport && nearestDist < 15) {
    const temp = tempCache.get(nearestAirport.icao);
    if (temp !== undefined) {
      return temp;
    }
  }

  return null;
};

// Get all airport data for direct access
export const getAirports = (): Airport[] => AIRPORTS;

// Check if cache is populated (always true with hardcoded data)
export const isMetarCacheReady = (): boolean => {
  return tempCache.size > 0;
};

// Get temperature with fallback to estimate
export const getTempWithFallback = (lat: number, lng: number): number => {
  const metarTemp = getMetarTemp(lat, lng);
  if (metarTemp !== null) {
    return metarTemp;
  }

  // Fallback: estimate based on latitude and season (December 31st)
  const absLat = Math.abs(lat);
  let tempC: number;

  if (lat >= 0) {
    // Northern Hemisphere - WINTER
    if (absLat > 60) tempC = -30;
    else if (absLat > 45) tempC = -5;
    else if (absLat > 30) tempC = 10;
    else if (absLat > 15) tempC = 20;
    else tempC = 28;
  } else {
    // Southern Hemisphere - SUMMER
    if (absLat > 60) tempC = 0;
    else if (absLat > 45) tempC = 15;
    else if (absLat > 30) tempC = 25;
    else if (absLat > 15) tempC = 32;
    else tempC = 28;
  }

  return tempC;
};

// Get nearest airport with its temperature info
export const getNearestAirportInfo = (lat: number, lng: number): NearestAirportInfo | null => {
  let nearestAirport: Airport | null = null;
  let nearestDist = Infinity;

  for (const airport of AIRPORTS) {
    const dLat = airport.lat - lat;
    const dLng = airport.lng - lng;
    const adjDLng = Math.min(Math.abs(dLng), 360 - Math.abs(dLng));
    const dist = Math.sqrt(dLat * dLat + adjDLng * adjDLng);

    if (dist < nearestDist) {
      nearestDist = dist;
      nearestAirport = airport;
    }
  }

  if (!nearestAirport) return null;

  // Get temperature from cache or estimate
  let temp = tempCache.get(nearestAirport.icao);
  if (temp === undefined) {
    temp = getTempWithFallback(nearestAirport.lat, nearestAirport.lng);
  }

  return {
    airport: nearestAirport,
    temp,
    distance: nearestDist
  };
};
