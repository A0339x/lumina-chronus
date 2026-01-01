// METAR Weather Service - Real airport temperatures from aviation weather data
// ~500 major international airports worldwide

export interface Airport {
  icao: string;
  lat: number;
  lng: number;
  name: string;
}

export type WeatherCondition = "thunderstorm" | "snow" | "rain" | "fog" | "freezing" | null;

export interface NearestAirportInfo {
  airport: Airport;
  temp: number;
  condition: WeatherCondition;
  distance: number; // in degrees (approximate)
}

// Top 500 international airports by passenger traffic and geographic coverage
const AIRPORTS: Airport[] = [
  // UNITED STATES - Major Hubs
  { icao: "KATL", lat: 33.64, lng: -84.43, name: "Atlanta Hartsfield-Jackson" },
  { icao: "KLAX", lat: 33.94, lng: -118.41, name: "Los Angeles International" },
  { icao: "KORD", lat: 41.98, lng: -87.90, name: "Chicago O'Hare" },
  { icao: "KDFW", lat: 32.90, lng: -97.04, name: "Dallas/Fort Worth" },
  { icao: "KDEN", lat: 39.86, lng: -104.67, name: "Denver International" },
  { icao: "KJFK", lat: 40.64, lng: -73.78, name: "New York JFK" },
  { icao: "KSFO", lat: 37.62, lng: -122.38, name: "San Francisco International" },
  { icao: "KSEA", lat: 47.45, lng: -122.31, name: "Seattle-Tacoma" },
  { icao: "KLAS", lat: 36.08, lng: -115.15, name: "Las Vegas Harry Reid" },
  { icao: "KMCO", lat: 28.43, lng: -81.31, name: "Orlando International" },
  { icao: "KEWR", lat: 40.69, lng: -74.17, name: "Newark Liberty" },
  { icao: "KMIA", lat: 25.80, lng: -80.29, name: "Miami International" },
  { icao: "KPHX", lat: 33.43, lng: -112.01, name: "Phoenix Sky Harbor" },
  { icao: "KIAH", lat: 29.98, lng: -95.34, name: "Houston George Bush" },
  { icao: "KBOS", lat: 42.36, lng: -71.01, name: "Boston Logan" },
  { icao: "KMSP", lat: 44.88, lng: -93.22, name: "Minneapolis-St Paul" },
  { icao: "KFLL", lat: 26.07, lng: -80.15, name: "Fort Lauderdale" },
  { icao: "KDTW", lat: 42.21, lng: -83.35, name: "Detroit Metropolitan" },
  { icao: "KPHL", lat: 39.87, lng: -75.24, name: "Philadelphia International" },
  { icao: "KLGA", lat: 40.78, lng: -73.87, name: "New York LaGuardia" },
  { icao: "KBWI", lat: 39.18, lng: -76.67, name: "Baltimore/Washington" },
  { icao: "KSLC", lat: 40.79, lng: -111.98, name: "Salt Lake City" },
  { icao: "KDCA", lat: 38.85, lng: -77.04, name: "Washington Reagan" },
  { icao: "KIAD", lat: 38.94, lng: -77.46, name: "Washington Dulles" },
  { icao: "KSAN", lat: 32.73, lng: -117.19, name: "San Diego International" },
  { icao: "KTPA", lat: 27.98, lng: -82.53, name: "Tampa International" },
  { icao: "KPDX", lat: 45.59, lng: -122.60, name: "Portland International" },
  { icao: "KSTL", lat: 38.75, lng: -90.37, name: "St Louis Lambert" },
  { icao: "KHNL", lat: 21.32, lng: -157.92, name: "Honolulu Daniel K. Inouye" },
  { icao: "KMEM", lat: 35.04, lng: -89.98, name: "Memphis International" },
  { icao: "KAUS", lat: 30.19, lng: -97.67, name: "Austin-Bergstrom" },
  { icao: "KBNA", lat: 36.12, lng: -86.68, name: "Nashville International" },
  { icao: "KRDU", lat: 35.88, lng: -78.79, name: "Raleigh-Durham" },
  { icao: "KCLT", lat: 35.21, lng: -80.94, name: "Charlotte Douglas" },
  { icao: "KSMF", lat: 38.70, lng: -121.59, name: "Sacramento International" },
  { icao: "KSJC", lat: 37.36, lng: -121.93, name: "San Jose International" },
  { icao: "KOAK", lat: 37.72, lng: -122.22, name: "Oakland International" },
  { icao: "KCLE", lat: 41.41, lng: -81.85, name: "Cleveland Hopkins" },
  { icao: "KMKE", lat: 42.95, lng: -87.90, name: "Milwaukee Mitchell" },
  { icao: "KPIT", lat: 40.50, lng: -80.23, name: "Pittsburgh International" },
  { icao: "KIND", lat: 39.72, lng: -86.29, name: "Indianapolis International" },
  { icao: "KCVG", lat: 39.05, lng: -84.67, name: "Cincinnati/Northern Kentucky" },
  { icao: "KMCI", lat: 39.30, lng: -94.71, name: "Kansas City International" },
  { icao: "KSAT", lat: 29.53, lng: -98.47, name: "San Antonio International" },
  { icao: "KHOU", lat: 29.65, lng: -95.28, name: "Houston Hobby" },
  { icao: "KDAL", lat: 32.85, lng: -96.85, name: "Dallas Love Field" },
  { icao: "KMDW", lat: 41.79, lng: -87.75, name: "Chicago Midway" },
  { icao: "PANC", lat: 61.17, lng: -150.00, name: "Anchorage Ted Stevens" },
  { icao: "PAFA", lat: 64.82, lng: -147.86, name: "Fairbanks International" },

  // CANADA
  { icao: "CYYZ", lat: 43.68, lng: -79.63, name: "Toronto Pearson" },
  { icao: "CYVR", lat: 49.19, lng: -123.18, name: "Vancouver International" },
  { icao: "CYUL", lat: 45.47, lng: -73.74, name: "Montreal Trudeau" },
  { icao: "CYYC", lat: 51.11, lng: -114.02, name: "Calgary International" },
  { icao: "CYEG", lat: 53.31, lng: -113.58, name: "Edmonton International" },
  { icao: "CYOW", lat: 45.32, lng: -75.67, name: "Ottawa Macdonald-Cartier" },
  { icao: "CYWG", lat: 49.91, lng: -97.24, name: "Winnipeg James Richardson" },
  { icao: "CYHZ", lat: 44.88, lng: -63.51, name: "Halifax Stanfield" },
  { icao: "CYQB", lat: 46.79, lng: -71.39, name: "Quebec Jean Lesage" },
  { icao: "CYYJ", lat: 48.65, lng: -123.43, name: "Victoria International" },
  { icao: "CYLW", lat: 49.96, lng: -119.38, name: "Kelowna International" },
  { icao: "CYXE", lat: 52.17, lng: -106.70, name: "Saskatoon John G. Diefenbaker" },
  { icao: "CYQR", lat: 50.43, lng: -104.67, name: "Regina International" },
  { icao: "CYZF", lat: 62.46, lng: -114.44, name: "Yellowknife" },
  { icao: "CYXY", lat: 60.71, lng: -135.07, name: "Whitehorse Erik Nielsen" },
  { icao: "CYQT", lat: 48.37, lng: -89.32, name: "Thunder Bay" },
  { icao: "CYYT", lat: 47.62, lng: -52.75, name: "St. John's International" },

  // MEXICO & CENTRAL AMERICA
  { icao: "MMMX", lat: 19.44, lng: -99.07, name: "Mexico City Benito Juarez" },
  { icao: "MMUN", lat: 21.04, lng: -86.87, name: "Cancun International" },
  { icao: "MMGL", lat: 20.52, lng: -103.31, name: "Guadalajara Miguel Hidalgo" },
  { icao: "MMMY", lat: 25.78, lng: -100.11, name: "Monterrey International" },
  { icao: "MMTJ", lat: 32.54, lng: -116.97, name: "Tijuana International" },
  { icao: "MMSM", lat: 19.07, lng: -104.56, name: "Puerto Vallarta" },
  { icao: "MMMD", lat: 20.94, lng: -89.66, name: "Merida International" },
  { icao: "MMCZ", lat: 20.52, lng: -86.93, name: "Cozumel International" },
  { icao: "MMSD", lat: 23.15, lng: -109.72, name: "Los Cabos International" },
  { icao: "MGGT", lat: 14.58, lng: -90.53, name: "Guatemala City La Aurora" },
  { icao: "MSLP", lat: 13.44, lng: -89.06, name: "San Salvador International" },
  { icao: "MHTG", lat: 14.06, lng: -87.22, name: "Tegucigalpa Toncontin" },
  { icao: "MNMG", lat: 12.14, lng: -86.17, name: "Managua International" },
  { icao: "MROC", lat: 9.99, lng: -84.21, name: "San Jose Juan Santamaria" },
  { icao: "MPTO", lat: 9.07, lng: -79.38, name: "Panama City Tocumen" },
  { icao: "MKJP", lat: 17.94, lng: -76.79, name: "Kingston Norman Manley" },
  { icao: "TNCM", lat: 18.04, lng: -63.11, name: "St Maarten Princess Juliana" },
  { icao: "TBPB", lat: 13.07, lng: -59.49, name: "Barbados Grantley Adams" },
  { icao: "TTPP", lat: 10.60, lng: -61.34, name: "Port of Spain Piarco" },
  { icao: "MWCR", lat: 19.29, lng: -81.36, name: "Grand Cayman Owen Roberts" },
  { icao: "MUHA", lat: 22.99, lng: -82.41, name: "Havana Jose Marti" },
  { icao: "MDSD", lat: 18.43, lng: -69.67, name: "Santo Domingo Las Americas" },
  { icao: "MDPP", lat: 19.76, lng: -70.57, name: "Puerto Plata International" },
  { icao: "MTPP", lat: 18.58, lng: -72.29, name: "Port-au-Prince Toussaint" },
  { icao: "TJSJ", lat: 18.44, lng: -66.00, name: "San Juan Luis Munoz Marin" },
  { icao: "TIST", lat: 18.34, lng: -64.97, name: "St Thomas Cyril E. King" },
  { icao: "TLPL", lat: 14.02, lng: -60.99, name: "St Lucia Hewanorra" },
  { icao: "TAPA", lat: 17.14, lng: -61.79, name: "Antigua V.C. Bird" },

  // SOUTH AMERICA
  { icao: "SBGR", lat: -23.43, lng: -46.47, name: "Sao Paulo Guarulhos" },
  { icao: "SBGL", lat: -22.81, lng: -43.25, name: "Rio de Janeiro Galeao" },
  { icao: "SBBR", lat: -15.87, lng: -47.92, name: "Brasilia International" },
  { icao: "SBCF", lat: -19.63, lng: -43.97, name: "Belo Horizonte Confins" },
  { icao: "SBSV", lat: -12.91, lng: -38.33, name: "Salvador International" },
  { icao: "SBRF", lat: -8.13, lng: -34.92, name: "Recife Guararapes" },
  { icao: "SBPA", lat: -29.99, lng: -51.17, name: "Porto Alegre Salgado Filho" },
  { icao: "SBCT", lat: -25.53, lng: -49.17, name: "Curitiba Afonso Pena" },
  { icao: "SBFZ", lat: -3.78, lng: -38.53, name: "Fortaleza Pinto Martins" },
  { icao: "SCEL", lat: -33.39, lng: -70.79, name: "Santiago Arturo Merino" },
  { icao: "SAEZ", lat: -34.82, lng: -58.54, name: "Buenos Aires Ezeiza" },
  { icao: "SABE", lat: -34.56, lng: -58.42, name: "Buenos Aires Aeroparque" },
  { icao: "SACO", lat: -31.32, lng: -64.21, name: "Cordoba Ambrosio Taravella" },
  { icao: "SAME", lat: -32.83, lng: -68.79, name: "Mendoza El Plumerillo" },
  { icao: "SLLP", lat: -16.51, lng: -68.19, name: "La Paz El Alto" },
  { icao: "SLVR", lat: -17.64, lng: -63.14, name: "Santa Cruz Viru Viru" },
  { icao: "SPJC", lat: -12.02, lng: -77.11, name: "Lima Jorge Chavez" },
  { icao: "SEQM", lat: -0.13, lng: -78.36, name: "Quito Mariscal Sucre" },
  { icao: "SEGU", lat: -2.16, lng: -79.88, name: "Guayaquil Jose Joaquin" },
  { icao: "SKBO", lat: 4.70, lng: -74.15, name: "Bogota El Dorado" },
  { icao: "SKMR", lat: 7.93, lng: -72.51, name: "Cucuta Camilo Daza" },
  { icao: "SKCL", lat: 3.54, lng: -76.38, name: "Cali Alfonso Bonilla" },
  { icao: "SKMD", lat: 6.22, lng: -75.59, name: "Medellin Jose Maria" },
  { icao: "SKRG", lat: 6.16, lng: -75.42, name: "Medellin Rionegro" },
  { icao: "SVMI", lat: 10.60, lng: -66.99, name: "Caracas Simon Bolivar" },
  { icao: "SUMU", lat: -34.84, lng: -56.03, name: "Montevideo Carrasco" },
  { icao: "SGAS", lat: -25.24, lng: -57.52, name: "Asuncion Silvio Pettirossi" },
  { icao: "SBBV", lat: 2.85, lng: -60.69, name: "Boa Vista Internacional" },
  { icao: "SMJP", lat: 5.45, lng: -55.19, name: "Paramaribo Johan Pengel" },
  { icao: "SYCJ", lat: 6.50, lng: -58.25, name: "Georgetown Cheddi Jagan" },

  // EUROPE - UK & IRELAND
  { icao: "EGLL", lat: 51.47, lng: -0.46, name: "London Heathrow" },
  { icao: "EGKK", lat: 51.15, lng: -0.19, name: "London Gatwick" },
  { icao: "EGSS", lat: 51.89, lng: 0.24, name: "London Stansted" },
  { icao: "EGLC", lat: 51.51, lng: 0.05, name: "London City" },
  { icao: "EGCC", lat: 53.35, lng: -2.27, name: "Manchester" },
  { icao: "EGBB", lat: 52.45, lng: -1.75, name: "Birmingham" },
  { icao: "EGPH", lat: 55.95, lng: -3.36, name: "Edinburgh" },
  { icao: "EGPF", lat: 55.87, lng: -4.43, name: "Glasgow" },
  { icao: "EGGW", lat: 51.87, lng: -0.37, name: "London Luton" },
  { icao: "EGNX", lat: 52.83, lng: -1.33, name: "East Midlands" },
  { icao: "EGNT", lat: 55.04, lng: -1.69, name: "Newcastle" },
  { icao: "EGGP", lat: 53.33, lng: -2.85, name: "Liverpool John Lennon" },
  { icao: "EGHI", lat: 50.95, lng: -1.36, name: "Southampton" },
  { icao: "EGGD", lat: 51.38, lng: -2.72, name: "Bristol" },
  { icao: "EGPD", lat: 57.20, lng: -2.20, name: "Aberdeen" },
  { icao: "EGAA", lat: 54.66, lng: -6.22, name: "Belfast International" },
  { icao: "EIDW", lat: 53.42, lng: -6.27, name: "Dublin" },
  { icao: "EICK", lat: 51.84, lng: -8.49, name: "Cork" },
  { icao: "EINN", lat: 52.70, lng: -8.92, name: "Shannon" },

  // EUROPE - FRANCE
  { icao: "LFPG", lat: 49.01, lng: 2.55, name: "Paris Charles de Gaulle" },
  { icao: "LFPO", lat: 48.72, lng: 2.36, name: "Paris Orly" },
  { icao: "LFML", lat: 43.44, lng: 5.22, name: "Marseille Provence" },
  { icao: "LFLL", lat: 45.73, lng: 5.09, name: "Lyon Saint-Exupery" },
  { icao: "LFMN", lat: 43.66, lng: 7.22, name: "Nice Cote d'Azur" },
  { icao: "LFBD", lat: 44.83, lng: -0.72, name: "Bordeaux Merignac" },
  { icao: "LFBO", lat: 43.63, lng: 1.37, name: "Toulouse Blagnac" },
  { icao: "LFRS", lat: 47.15, lng: -1.61, name: "Nantes Atlantique" },
  { icao: "LFSB", lat: 47.59, lng: 7.53, name: "Basel-Mulhouse-Freiburg" },
  { icao: "LFPB", lat: 48.97, lng: 2.44, name: "Paris Le Bourget" },

  // EUROPE - GERMANY
  { icao: "EDDF", lat: 50.03, lng: 8.57, name: "Frankfurt" },
  { icao: "EDDM", lat: 48.35, lng: 11.79, name: "Munich" },
  { icao: "EDDB", lat: 52.38, lng: 13.52, name: "Berlin Brandenburg" },
  { icao: "EDDL", lat: 51.29, lng: 6.77, name: "Dusseldorf" },
  { icao: "EDDH", lat: 53.63, lng: 10.01, name: "Hamburg" },
  { icao: "EDDK", lat: 50.87, lng: 7.14, name: "Cologne Bonn" },
  { icao: "EDDS", lat: 48.69, lng: 9.22, name: "Stuttgart" },
  { icao: "EDDW", lat: 53.05, lng: 8.79, name: "Bremen" },
  { icao: "EDDN", lat: 49.50, lng: 11.08, name: "Nuremberg" },
  { icao: "EDDV", lat: 52.46, lng: 9.69, name: "Hannover" },
  { icao: "EDDP", lat: 51.42, lng: 12.24, name: "Leipzig/Halle" },

  // EUROPE - SPAIN & PORTUGAL
  { icao: "LEMD", lat: 40.47, lng: -3.56, name: "Madrid Barajas" },
  { icao: "LEBL", lat: 41.30, lng: 2.08, name: "Barcelona El Prat" },
  { icao: "LEPA", lat: 39.55, lng: 2.74, name: "Palma de Mallorca" },
  { icao: "LEMG", lat: 36.68, lng: -4.50, name: "Malaga Costa del Sol" },
  { icao: "LEVC", lat: 39.49, lng: -0.48, name: "Valencia" },
  { icao: "LEAL", lat: 38.29, lng: -0.56, name: "Alicante Elche" },
  { icao: "LEZL", lat: 37.42, lng: -5.89, name: "Seville" },
  { icao: "GCLP", lat: 27.93, lng: -15.39, name: "Gran Canaria" },
  { icao: "GCTS", lat: 28.04, lng: -16.57, name: "Tenerife South" },
  { icao: "GCLA", lat: 28.61, lng: -17.76, name: "La Palma" },
  { icao: "GCFV", lat: 28.45, lng: -13.86, name: "Fuerteventura" },
  { icao: "LPPT", lat: 38.77, lng: -9.13, name: "Lisbon Humberto Delgado" },
  { icao: "LPPR", lat: 41.24, lng: -8.68, name: "Porto Francisco Sa Carneiro" },
  { icao: "LPFR", lat: 37.01, lng: -7.97, name: "Faro" },
  { icao: "LPMA", lat: 32.70, lng: -16.78, name: "Madeira Cristiano Ronaldo" },

  // EUROPE - ITALY
  { icao: "LIRF", lat: 41.80, lng: 12.25, name: "Rome Fiumicino" },
  { icao: "LIMC", lat: 45.63, lng: 8.72, name: "Milan Malpensa" },
  { icao: "LIME", lat: 45.67, lng: 9.70, name: "Milan Bergamo" },
  { icao: "LIPZ", lat: 45.51, lng: 12.35, name: "Venice Marco Polo" },
  { icao: "LIRN", lat: 40.89, lng: 14.29, name: "Naples Capodichino" },
  { icao: "LIML", lat: 45.45, lng: 9.28, name: "Milan Linate" },
  { icao: "LIPE", lat: 44.53, lng: 11.29, name: "Bologna Guglielmo Marconi" },
  { icao: "LICC", lat: 37.47, lng: 15.07, name: "Catania Fontanarossa" },
  { icao: "LICJ", lat: 38.18, lng: 13.10, name: "Palermo Falcone-Borsellino" },
  { icao: "LIRA", lat: 41.80, lng: 12.59, name: "Rome Ciampino" },
  { icao: "LIRP", lat: 43.68, lng: 10.39, name: "Pisa Galileo Galilei" },
  { icao: "LIMF", lat: 45.20, lng: 7.65, name: "Turin Caselle" },
  { icao: "LIEO", lat: 40.90, lng: 9.52, name: "Olbia Costa Smeralda" },
  { icao: "LIEE", lat: 39.25, lng: 9.05, name: "Cagliari Elmas" },

  // EUROPE - NETHERLANDS, BELGIUM, SWITZERLAND
  { icao: "EHAM", lat: 52.31, lng: 4.76, name: "Amsterdam Schiphol" },
  { icao: "EHRD", lat: 51.96, lng: 4.44, name: "Rotterdam The Hague" },
  { icao: "EHEH", lat: 51.45, lng: 5.37, name: "Eindhoven" },
  { icao: "EBBR", lat: 50.90, lng: 4.48, name: "Brussels" },
  { icao: "EBCI", lat: 50.46, lng: 4.45, name: "Brussels South Charleroi" },
  { icao: "ELLX", lat: 49.63, lng: 6.22, name: "Luxembourg Findel" },
  { icao: "LSZH", lat: 47.46, lng: 8.55, name: "Zurich" },
  { icao: "LSGG", lat: 46.24, lng: 6.11, name: "Geneva" },
  { icao: "LSZB", lat: 46.91, lng: 7.50, name: "Bern" },

  // EUROPE - AUSTRIA, CZECH, POLAND
  { icao: "LOWW", lat: 48.11, lng: 16.57, name: "Vienna" },
  { icao: "LOWS", lat: 47.79, lng: 13.00, name: "Salzburg" },
  { icao: "LOWG", lat: 46.99, lng: 15.44, name: "Graz" },
  { icao: "LOWI", lat: 47.26, lng: 11.34, name: "Innsbruck" },
  { icao: "LKPR", lat: 50.10, lng: 14.26, name: "Prague Vaclav Havel" },
  { icao: "EPWA", lat: 52.17, lng: 20.97, name: "Warsaw Chopin" },
  { icao: "EPKK", lat: 50.08, lng: 19.79, name: "Krakow John Paul II" },
  { icao: "EPGD", lat: 54.38, lng: 18.47, name: "Gdansk Lech Walesa" },
  { icao: "EPWR", lat: 51.10, lng: 16.89, name: "Wroclaw" },
  { icao: "EPPO", lat: 52.42, lng: 16.83, name: "Poznan Lawica" },

  // EUROPE - NORDIC
  { icao: "EKCH", lat: 55.62, lng: 12.66, name: "Copenhagen Kastrup" },
  { icao: "ESSA", lat: 59.65, lng: 17.94, name: "Stockholm Arlanda" },
  { icao: "ENGM", lat: 60.19, lng: 11.10, name: "Oslo Gardermoen" },
  { icao: "EFHK", lat: 60.32, lng: 24.96, name: "Helsinki Vantaa" },
  { icao: "BIKF", lat: 63.99, lng: -22.62, name: "Reykjavik Keflavik" },
  { icao: "ESGG", lat: 57.67, lng: 12.29, name: "Gothenburg Landvetter" },
  { icao: "ESMS", lat: 55.54, lng: 13.36, name: "Malmo" },
  { icao: "ENBR", lat: 60.29, lng: 5.22, name: "Bergen Flesland" },
  { icao: "ENZV", lat: 58.88, lng: 5.63, name: "Stavanger Sola" },
  { icao: "ENTC", lat: 69.68, lng: 18.92, name: "Tromso Langnes" },
  { icao: "EFOU", lat: 64.93, lng: 25.35, name: "Oulu" },
  { icao: "EFRO", lat: 66.56, lng: 25.83, name: "Rovaniemi" },

  // EUROPE - GREECE, TURKEY, CYPRUS
  { icao: "LGAV", lat: 37.94, lng: 23.94, name: "Athens Eleftherios Venizelos" },
  { icao: "LGTS", lat: 40.52, lng: 22.97, name: "Thessaloniki Macedonia" },
  { icao: "LGIR", lat: 35.34, lng: 25.18, name: "Heraklion Nikos Kazantzakis" },
  { icao: "LGKR", lat: 39.60, lng: 19.91, name: "Corfu Ioannis Kapodistrias" },
  { icao: "LGRP", lat: 36.41, lng: 28.09, name: "Rhodes Diagoras" },
  { icao: "LGSR", lat: 36.40, lng: 25.48, name: "Santorini" },
  { icao: "LGMK", lat: 37.44, lng: 25.35, name: "Mykonos" },
  { icao: "LTFM", lat: 41.26, lng: 28.74, name: "Istanbul" },
  { icao: "LTBA", lat: 40.98, lng: 28.82, name: "Istanbul Ataturk" },
  { icao: "LTFJ", lat: 40.90, lng: 29.31, name: "Istanbul Sabiha Gokcen" },
  { icao: "LTAI", lat: 36.90, lng: 30.80, name: "Antalya" },
  { icao: "LTAC", lat: 40.13, lng: 32.99, name: "Ankara Esenboga" },
  { icao: "LTBJ", lat: 38.29, lng: 27.16, name: "Izmir Adnan Menderes" },
  { icao: "LTBS", lat: 36.71, lng: 28.79, name: "Dalaman" },
  { icao: "LTFE", lat: 37.04, lng: 27.43, name: "Bodrum Milas" },
  { icao: "LCLK", lat: 34.88, lng: 33.63, name: "Larnaca" },
  { icao: "LCPH", lat: 34.72, lng: 32.49, name: "Paphos" },

  // EUROPE - EASTERN EUROPE
  { icao: "LHBP", lat: 47.44, lng: 19.26, name: "Budapest Ferenc Liszt" },
  { icao: "LROP", lat: 44.57, lng: 26.09, name: "Bucharest Henri Coanda" },
  { icao: "LBSF", lat: 42.70, lng: 23.41, name: "Sofia" },
  { icao: "LYBE", lat: 44.82, lng: 20.31, name: "Belgrade Nikola Tesla" },
  { icao: "LDZA", lat: 45.74, lng: 16.07, name: "Zagreb Franjo Tudman" },
  { icao: "LDDU", lat: 42.56, lng: 18.27, name: "Dubrovnik" },
  { icao: "LDSP", lat: 43.54, lng: 16.30, name: "Split" },
  { icao: "LJLJ", lat: 46.22, lng: 14.46, name: "Ljubljana Joze Pucnik" },
  { icao: "LWSK", lat: 41.96, lng: 21.62, name: "Skopje" },
  { icao: "LATI", lat: 41.41, lng: 19.72, name: "Tirana" },
  { icao: "UKBB", lat: 50.35, lng: 30.89, name: "Kyiv Boryspil" },
  { icao: "UKLL", lat: 49.81, lng: 23.96, name: "Lviv Danylo Halytskyi" },
  { icao: "UUEE", lat: 55.97, lng: 37.41, name: "Moscow Sheremetyevo" },
  { icao: "UUDD", lat: 55.41, lng: 37.91, name: "Moscow Domodedovo" },
  { icao: "UUWW", lat: 55.60, lng: 37.27, name: "Moscow Vnukovo" },
  { icao: "ULLI", lat: 59.80, lng: 30.26, name: "St Petersburg Pulkovo" },
  { icao: "UWWW", lat: 53.50, lng: 50.16, name: "Samara Kurumoch" },
  { icao: "USSS", lat: 56.74, lng: 60.80, name: "Yekaterinburg Koltsovo" },
  { icao: "UNNT", lat: 55.01, lng: 82.65, name: "Novosibirsk Tolmachevo" },
  { icao: "UUOB", lat: 51.82, lng: 107.44, name: "Ulan-Ude" },
  { icao: "UHWW", lat: 43.40, lng: 132.15, name: "Vladivostok" },
  { icao: "UUOB", lat: 52.03, lng: 113.31, name: "Chita Kadala" },
  { icao: "UEEE", lat: 62.09, lng: 129.77, name: "Yakutsk" },

  // MIDDLE EAST
  { icao: "OMDB", lat: 25.25, lng: 55.36, name: "Dubai International" },
  { icao: "OMDW", lat: 24.90, lng: 55.17, name: "Dubai Al Maktoum" },
  { icao: "OMAA", lat: 24.43, lng: 54.65, name: "Abu Dhabi International" },
  { icao: "OMSJ", lat: 25.33, lng: 55.52, name: "Sharjah International" },
  { icao: "OTHH", lat: 25.26, lng: 51.61, name: "Doha Hamad" },
  { icao: "OERK", lat: 24.96, lng: 46.70, name: "Riyadh King Khalid" },
  { icao: "OEJN", lat: 21.68, lng: 39.16, name: "Jeddah King Abdulaziz" },
  { icao: "OEDF", lat: 26.47, lng: 49.80, name: "Dammam King Fahd" },
  { icao: "OEMA", lat: 24.55, lng: 39.71, name: "Madinah Prince Mohammad" },
  { icao: "OKBK", lat: 29.23, lng: 47.97, name: "Kuwait International" },
  { icao: "OBBI", lat: 26.27, lng: 50.64, name: "Bahrain International" },
  { icao: "OOMS", lat: 23.59, lng: 58.28, name: "Muscat International" },
  { icao: "OYAA", lat: 15.48, lng: 44.22, name: "Sanaa International" },
  { icao: "OIIE", lat: 35.42, lng: 51.15, name: "Tehran Imam Khomeini" },
  { icao: "OIII", lat: 35.69, lng: 51.31, name: "Tehran Mehrabad" },
  { icao: "OISS", lat: 29.54, lng: 52.59, name: "Shiraz International" },
  { icao: "OIKB", lat: 27.22, lng: 56.38, name: "Bandar Abbas" },
  { icao: "OIAW", lat: 31.34, lng: 48.76, name: "Ahvaz" },
  { icao: "OIKK", lat: 30.27, lng: 56.96, name: "Kerman" },
  { icao: "OICC", lat: 34.35, lng: 47.16, name: "Kermanshah" },
  { icao: "LLBG", lat: 32.01, lng: 34.89, name: "Tel Aviv Ben Gurion" },
  { icao: "OLBA", lat: 33.82, lng: 35.49, name: "Beirut Rafic Hariri" },
  { icao: "OJAM", lat: 31.72, lng: 35.99, name: "Amman Queen Alia" },
  { icao: "ORBI", lat: 33.26, lng: 44.24, name: "Baghdad International" },
  { icao: "ORER", lat: 36.24, lng: 43.13, name: "Erbil International" },

  // AFRICA - NORTH
  { icao: "GMMN", lat: 33.37, lng: -7.59, name: "Casablanca Mohammed V" },
  { icao: "GMME", lat: 33.93, lng: -6.75, name: "Rabat-Sale" },
  { icao: "GMMX", lat: 31.61, lng: -8.04, name: "Marrakech Menara" },
  { icao: "GMTT", lat: 35.73, lng: -5.92, name: "Tangier Ibn Battouta" },
  { icao: "GMFF", lat: 33.93, lng: -4.98, name: "Fes-Saiss" },
  { icao: "GMAD", lat: 30.33, lng: -9.41, name: "Agadir Al Massira" },
  { icao: "DAAG", lat: 36.69, lng: 3.22, name: "Algiers Houari Boumediene" },
  { icao: "DAOO", lat: 35.62, lng: -0.62, name: "Oran Ahmed Ben Bella" },
  { icao: "DTTA", lat: 36.85, lng: 10.23, name: "Tunis Carthage" },
  { icao: "DTMB", lat: 35.76, lng: 10.75, name: "Monastir Habib Bourguiba" },
  { icao: "DTTJ", lat: 33.88, lng: 10.78, name: "Djerba Zarzis" },
  { icao: "HECA", lat: 30.12, lng: 31.41, name: "Cairo International" },
  { icao: "HEGN", lat: 27.18, lng: 33.80, name: "Hurghada International" },
  { icao: "HESH", lat: 27.98, lng: 34.39, name: "Sharm El Sheikh" },
  { icao: "HEBA", lat: 25.92, lng: 32.82, name: "Luxor International" },
  { icao: "HEAX", lat: 31.18, lng: 29.95, name: "Alexandria Borg El Arab" },
  { icao: "HLLT", lat: 32.89, lng: 13.28, name: "Tripoli Mitiga" },

  // AFRICA - WEST
  { icao: "DNMM", lat: 6.58, lng: 3.32, name: "Lagos Murtala Muhammed" },
  { icao: "DNAA", lat: 9.01, lng: 7.26, name: "Abuja Nnamdi Azikiwe" },
  { icao: "DGAA", lat: 5.61, lng: -0.17, name: "Accra Kotoka" },
  { icao: "DIAP", lat: 5.26, lng: -3.93, name: "Abidjan Felix Houphouet" },
  { icao: "GOBD", lat: 14.67, lng: -17.07, name: "Dakar Blaise Diagne" },
  { icao: "GABS", lat: 13.34, lng: -16.65, name: "Banjul Yundum" },
  { icao: "GVNP", lat: 14.95, lng: -23.49, name: "Praia Nelson Mandela" },
  { icao: "GBYD", lat: 8.49, lng: -13.20, name: "Freetown Lungi" },
  { icao: "GLRB", lat: 6.23, lng: -10.36, name: "Monrovia Roberts" },
  { icao: "DXXX", lat: 6.17, lng: 1.25, name: "Lome Gnassingbe Eyadema" },
  { icao: "DBBB", lat: 6.36, lng: 2.38, name: "Cotonou Cadjehoun" },

  // AFRICA - EAST
  { icao: "HKJK", lat: -1.32, lng: 36.93, name: "Nairobi Jomo Kenyatta" },
  { icao: "HKMO", lat: -4.03, lng: 39.59, name: "Mombasa Moi" },
  { icao: "HTDA", lat: -6.88, lng: 39.20, name: "Dar es Salaam Julius Nyerere" },
  { icao: "HTKJ", lat: -3.43, lng: 37.07, name: "Kilimanjaro International" },
  { icao: "HUEN", lat: 0.04, lng: 32.44, name: "Entebbe International" },
  { icao: "HRYR", lat: -1.97, lng: 30.14, name: "Kigali International" },
  { icao: "HAAB", lat: 8.98, lng: 38.80, name: "Addis Ababa Bole" },
  { icao: "HDAM", lat: 11.55, lng: 43.16, name: "Djibouti Ambouli" },
  { icao: "HCMM", lat: 2.01, lng: 45.31, name: "Mogadishu Aden Adde" },
  { icao: "OYSN", lat: 12.63, lng: 53.91, name: "Socotra" },
  { icao: "FMEE", lat: -20.89, lng: 55.52, name: "Reunion Roland Garros" },
  { icao: "FIMP", lat: -20.43, lng: 57.68, name: "Mauritius Sir Seewoosagur" },
  { icao: "FMCH", lat: -11.53, lng: 43.27, name: "Moroni Prince Said Ibrahim" },
  { icao: "FMMI", lat: -18.80, lng: 47.48, name: "Antananarivo Ivato" },
  { icao: "FSIA", lat: -4.67, lng: 55.52, name: "Mahe Seychelles" },

  // AFRICA - CENTRAL
  { icao: "FKKD", lat: 4.01, lng: 9.72, name: "Douala International" },
  { icao: "FKYS", lat: 3.72, lng: 11.55, name: "Yaounde Nsimalen" },
  { icao: "FOOL", lat: -0.46, lng: 9.41, name: "Libreville Leon M'ba" },
  { icao: "FZAA", lat: -4.39, lng: 15.44, name: "Kinshasa N'djili" },
  { icao: "FCBB", lat: -4.25, lng: 15.25, name: "Brazzaville Maya-Maya" },
  { icao: "FLLK", lat: -14.46, lng: 28.45, name: "Lusaka Kenneth Kaunda" },
  { icao: "FVHA", lat: -17.93, lng: 31.09, name: "Harare Robert Mugabe" },
  { icao: "FLLS", lat: -15.33, lng: 28.45, name: "Livingstone Harry Mwanga" },
  { icao: "FYWH", lat: -22.48, lng: 17.47, name: "Windhoek Hosea Kutako" },
  { icao: "FBSK", lat: -24.56, lng: 25.92, name: "Gaborone Sir Seretse Khama" },

  // AFRICA - SOUTH
  { icao: "FAOR", lat: -26.13, lng: 28.23, name: "Johannesburg O.R. Tambo" },
  { icao: "FACT", lat: -33.97, lng: 18.60, name: "Cape Town International" },
  { icao: "FALE", lat: -29.61, lng: 31.12, name: "Durban King Shaka" },
  { icao: "FAPE", lat: -33.98, lng: 25.62, name: "Port Elizabeth" },
  { icao: "FQMA", lat: -25.92, lng: 32.57, name: "Maputo International" },
  { icao: "FWKI", lat: -13.79, lng: 33.78, name: "Lilongwe Kamuzu" },

  // ASIA - CHINA
  { icao: "ZBAA", lat: 40.08, lng: 116.58, name: "Beijing Capital" },
  { icao: "ZBAD", lat: 39.51, lng: 116.41, name: "Beijing Daxing" },
  { icao: "ZSPD", lat: 31.14, lng: 121.81, name: "Shanghai Pudong" },
  { icao: "ZSSS", lat: 31.20, lng: 121.34, name: "Shanghai Hongqiao" },
  { icao: "ZGGG", lat: 23.39, lng: 113.30, name: "Guangzhou Baiyun" },
  { icao: "VHHH", lat: 22.31, lng: 113.91, name: "Hong Kong International" },
  { icao: "ZGSZ", lat: 22.64, lng: 113.81, name: "Shenzhen Bao'an" },
  { icao: "ZUUU", lat: 30.58, lng: 103.95, name: "Chengdu Shuangliu" },
  { icao: "ZUCK", lat: 29.72, lng: 106.64, name: "Chongqing Jiangbei" },
  { icao: "ZHCC", lat: 34.52, lng: 113.84, name: "Zhengzhou Xinzheng" },
  { icao: "ZLXY", lat: 34.45, lng: 108.75, name: "Xi'an Xianyang" },
  { icao: "ZWSH", lat: 43.91, lng: 87.47, name: "Urumqi Diwopu" },
  { icao: "ZYHB", lat: 45.62, lng: 126.25, name: "Harbin Taiping" },
  { icao: "ZYTX", lat: 41.64, lng: 123.48, name: "Shenyang Taoxian" },
  { icao: "ZSAM", lat: 24.54, lng: 118.13, name: "Xiamen Gaoqi" },
  { icao: "ZGKL", lat: 25.22, lng: 110.04, name: "Guilin Liangjiang" },
  { icao: "ZSNJ", lat: 31.74, lng: 118.86, name: "Nanjing Lukou" },
  { icao: "ZSHC", lat: 30.23, lng: 120.43, name: "Hangzhou Xiaoshan" },
  { icao: "ZPPP", lat: 25.10, lng: 102.93, name: "Kunming Changshui" },
  { icao: "ZBTJ", lat: 39.12, lng: 117.35, name: "Tianjin Binhai" },
  { icao: "VMMC", lat: 22.15, lng: 113.59, name: "Macau International" },

  // ASIA - JAPAN
  { icao: "RJTT", lat: 35.55, lng: 139.78, name: "Tokyo Haneda" },
  { icao: "RJAA", lat: 35.76, lng: 140.39, name: "Tokyo Narita" },
  { icao: "RJBB", lat: 34.43, lng: 135.24, name: "Osaka Kansai" },
  { icao: "RJOO", lat: 34.79, lng: 135.44, name: "Osaka Itami" },
  { icao: "RJCC", lat: 42.77, lng: 141.69, name: "Sapporo New Chitose" },
  { icao: "RJFF", lat: 33.58, lng: 130.45, name: "Fukuoka" },
  { icao: "RJGG", lat: 34.86, lng: 136.80, name: "Nagoya Chubu Centrair" },
  { icao: "ROAH", lat: 26.20, lng: 127.65, name: "Okinawa Naha" },
  { icao: "RJSS", lat: 38.14, lng: 140.92, name: "Sendai" },
  { icao: "RJSN", lat: 37.94, lng: 139.10, name: "Niigata" },
  { icao: "RJOK", lat: 33.55, lng: 133.67, name: "Kochi Ryoma" },

  // ASIA - KOREA
  { icao: "RKSI", lat: 37.46, lng: 126.44, name: "Seoul Incheon" },
  { icao: "RKSS", lat: 37.56, lng: 126.79, name: "Seoul Gimpo" },
  { icao: "RKPK", lat: 35.18, lng: 128.94, name: "Busan Gimhae" },
  { icao: "RKPC", lat: 33.51, lng: 126.49, name: "Jeju International" },
  { icao: "RKTN", lat: 35.90, lng: 128.66, name: "Daegu" },
  { icao: "ZKPY", lat: 39.22, lng: 125.67, name: "Pyongyang Sunan" },

  // ASIA - SOUTHEAST ASIA
  { icao: "WSSS", lat: 1.35, lng: 103.99, name: "Singapore Changi" },
  { icao: "WMKK", lat: 2.75, lng: 101.71, name: "Kuala Lumpur International" },
  { icao: "WMKP", lat: 5.30, lng: 100.26, name: "Penang International" },
  { icao: "WBKK", lat: 5.93, lng: 116.05, name: "Kota Kinabalu International" },
  { icao: "WBGG", lat: 1.49, lng: 110.35, name: "Kuching International" },
  { icao: "VTBS", lat: 13.69, lng: 100.75, name: "Bangkok Suvarnabhumi" },
  { icao: "VTBD", lat: 13.91, lng: 100.61, name: "Bangkok Don Mueang" },
  { icao: "VTSP", lat: 8.11, lng: 98.32, name: "Phuket International" },
  { icao: "VTCC", lat: 18.77, lng: 98.96, name: "Chiang Mai International" },
  { icao: "VTSS", lat: 7.23, lng: 100.51, name: "Hat Yai International" },
  { icao: "VTUK", lat: 12.68, lng: 101.01, name: "U-Tapao International" },
  { icao: "VVNB", lat: 21.22, lng: 105.81, name: "Hanoi Noi Bai" },
  { icao: "VVTS", lat: 10.82, lng: 106.65, name: "Ho Chi Minh City Tan Son Nhat" },
  { icao: "VVDN", lat: 16.04, lng: 108.20, name: "Da Nang International" },
  { icao: "VVCR", lat: 12.23, lng: 109.19, name: "Nha Trang Cam Ranh" },
  { icao: "VDPP", lat: 11.55, lng: 104.84, name: "Phnom Penh International" },
  { icao: "VDSR", lat: 13.41, lng: 103.81, name: "Siem Reap Angkor" },
  { icao: "VLVT", lat: 17.99, lng: 102.56, name: "Vientiane Wattay" },
  { icao: "VLLB", lat: 19.90, lng: 102.16, name: "Luang Prabang International" },
  { icao: "VYYY", lat: 16.91, lng: 96.13, name: "Yangon International" },
  { icao: "VYMD", lat: 21.70, lng: 95.98, name: "Mandalay International" },
  { icao: "VGHS", lat: 23.84, lng: 90.40, name: "Dhaka Hazrat Shahjalal" },
  { icao: "VGCG", lat: 22.25, lng: 91.81, name: "Chittagong Shah Amanat" },
  { icao: "VECC", lat: 22.65, lng: 88.45, name: "Kolkata Netaji Subhas Chandra" },
  { icao: "VRMM", lat: 4.19, lng: 73.53, name: "Male Velana" },
  { icao: "VCBI", lat: 7.18, lng: 79.88, name: "Colombo Bandaranaike" },

  // ASIA - INDONESIA & PHILIPPINES
  { icao: "WIII", lat: -6.13, lng: 106.66, name: "Jakarta Soekarno-Hatta" },
  { icao: "WADD", lat: -8.75, lng: 115.17, name: "Bali Ngurah Rai" },
  { icao: "WARR", lat: -7.38, lng: 112.79, name: "Surabaya Juanda" },
  { icao: "WIHH", lat: -5.87, lng: 106.14, name: "Jakarta Halim Perdanakusuma" },
  { icao: "WIMM", lat: 3.56, lng: 98.67, name: "Medan Kualanamu" },
  { icao: "WIBB", lat: 0.15, lng: 104.11, name: "Batam Hang Nadim" },
  { icao: "WAFF", lat: -5.06, lng: 119.55, name: "Makassar Sultan Hasanuddin" },
  { icao: "WICC", lat: -6.90, lng: 107.58, name: "Bandung Husein Sastranegara" },
  { icao: "WASS", lat: -2.54, lng: 140.72, name: "Jayapura Sentani" },
  { icao: "RPLL", lat: 14.51, lng: 121.02, name: "Manila Ninoy Aquino" },
  { icao: "RPLC", lat: 15.19, lng: 120.56, name: "Clark International" },
  { icao: "RPVM", lat: 10.31, lng: 123.98, name: "Cebu Mactan" },
  { icao: "RPVD", lat: 7.13, lng: 125.65, name: "Davao Francisco Bangoy" },
  { icao: "RPVK", lat: 11.68, lng: 122.38, name: "Kalibo International" },
  { icao: "WBSB", lat: 4.94, lng: 114.93, name: "Brunei International" },
  { icao: "WBLL", lat: 5.27, lng: 115.05, name: "Labuan" },

  // ASIA - INDIA
  { icao: "VIDP", lat: 28.57, lng: 77.09, name: "Delhi Indira Gandhi" },
  { icao: "VABB", lat: 19.09, lng: 72.87, name: "Mumbai Chhatrapati Shivaji" },
  { icao: "VOBL", lat: 13.20, lng: 77.71, name: "Bangalore Kempegowda" },
  { icao: "VOMM", lat: 12.99, lng: 80.18, name: "Chennai International" },
  { icao: "VEBS", lat: 22.65, lng: 88.45, name: "Kolkata Netaji Subhash" },
  { icao: "VOHY", lat: 17.23, lng: 78.43, name: "Hyderabad Rajiv Gandhi" },
  { icao: "VAAH", lat: 23.07, lng: 72.63, name: "Ahmedabad Sardar Vallabhbhai" },
  { icao: "VOCI", lat: 9.94, lng: 76.27, name: "Kochi International" },
  { icao: "VAGO", lat: 15.38, lng: 73.83, name: "Goa Dabolim" },
  { icao: "VOTP", lat: 10.49, lng: 76.92, name: "Tiruchirappalli International" },
  { icao: "VIAR", lat: 31.71, lng: 74.80, name: "Amritsar Raja Sansi" },
  { icao: "VIJP", lat: 26.82, lng: 75.81, name: "Jaipur International" },
  { icao: "VELR", lat: 27.30, lng: 88.59, name: "Bagdogra" },
  { icao: "VOCL", lat: 11.14, lng: 75.95, name: "Calicut International" },
  { icao: "VOTV", lat: 8.48, lng: 76.92, name: "Trivandrum International" },
  { icao: "VEPT", lat: 25.59, lng: 85.09, name: "Patna Jay Prakash Narayan" },
  { icao: "VNKT", lat: 27.70, lng: 85.36, name: "Kathmandu Tribhuvan" },
  { icao: "OPKC", lat: 24.91, lng: 67.16, name: "Karachi Jinnah" },
  { icao: "OPLA", lat: 31.52, lng: 74.40, name: "Lahore Allama Iqbal" },
  { icao: "OPIS", lat: 33.62, lng: 73.10, name: "Islamabad International" },

  // ASIA - TAIWAN & OTHER
  { icao: "RCTP", lat: 25.08, lng: 121.23, name: "Taipei Taoyuan" },
  { icao: "RCSS", lat: 25.07, lng: 121.55, name: "Taipei Songshan" },
  { icao: "RCMQ", lat: 24.26, lng: 120.62, name: "Taichung International" },
  { icao: "RCKH", lat: 22.58, lng: 120.35, name: "Kaohsiung International" },
  { icao: "RCNN", lat: 22.95, lng: 120.21, name: "Tainan" },

  // AUSTRALIA & NEW ZEALAND
  { icao: "YSSY", lat: -33.95, lng: 151.18, name: "Sydney Kingsford Smith" },
  { icao: "YMML", lat: -37.67, lng: 144.84, name: "Melbourne Tullamarine" },
  { icao: "YBBN", lat: -27.38, lng: 153.12, name: "Brisbane" },
  { icao: "YPPH", lat: -31.94, lng: 115.97, name: "Perth" },
  { icao: "YPAD", lat: -34.94, lng: 138.53, name: "Adelaide" },
  { icao: "YBCG", lat: -28.16, lng: 153.50, name: "Gold Coast Coolangatta" },
  { icao: "YBCS", lat: -16.89, lng: 145.75, name: "Cairns" },
  { icao: "YSCB", lat: -35.31, lng: 149.19, name: "Canberra" },
  { icao: "YMHB", lat: -42.84, lng: 147.51, name: "Hobart" },
  { icao: "NZAA", lat: -37.01, lng: 174.79, name: "Auckland" },
  { icao: "NZWN", lat: -41.33, lng: 174.81, name: "Wellington" },
  { icao: "NZCH", lat: -43.49, lng: 172.53, name: "Christchurch" },
  { icao: "NZQN", lat: -45.02, lng: 168.74, name: "Queenstown" },
  { icao: "NZDN", lat: -45.93, lng: 170.20, name: "Dunedin" },
  { icao: "NFFN", lat: -17.76, lng: 177.44, name: "Nadi International" },
  { icao: "NWWW", lat: -22.01, lng: 166.21, name: "Noumea La Tontouta" },
  { icao: "NTAA", lat: -17.55, lng: -149.61, name: "Tahiti Faaa" },
  { icao: "NSFA", lat: -13.85, lng: -171.99, name: "Apia Faleolo" },
  { icao: "NIUE", lat: -19.08, lng: -169.93, name: "Niue Hanan" },
  { icao: "PGSN", lat: 15.12, lng: 145.73, name: "Saipan International" },
  { icao: "PGUM", lat: 13.48, lng: 144.80, name: "Guam Antonio B. Won Pat" },
  { icao: "PHOG", lat: 20.90, lng: -156.43, name: "Maui Kahului" },
  { icao: "PHKO", lat: 19.74, lng: -156.05, name: "Kona International" },
  { icao: "PHLH", lat: 21.98, lng: -159.34, name: "Lihue" },
];

// Hardcoded temperatures and weather conditions - auto-updated by GitHub Actions
// Last updated: 2026-01-01T13:51:21.386Z
// Coverage: 476 airports, 0 with active weather
interface AirportWeather { temp: number; condition: WeatherCondition; }
const HARDCODED_WEATHER: Record<string, AirportWeather> = {
  "KATL":{temp:3,condition:null},"KLAX":{temp:15,condition:null},"KORD":{temp:-12,condition:null},"KDFW":{temp:5,condition:null},"KDEN":{temp:5,condition:null},"KJFK":{temp:-4,condition:null},"KSFO":{temp:11,condition:null},"KSEA":{temp:2,condition:null},"KLAS":{temp:8,condition:null},"KMCO":{temp:8,condition:null},
  "KEWR":{temp:-4,condition:null},"KMIA":{temp:11,condition:null},"KPHX":{temp:14,condition:null},"KIAH":{temp:4,condition:null},"KBOS":{temp:-2,condition:null},"KMSP":{temp:-15,condition:null},"KFLL":{temp:11,condition:null},"KDTW":{temp:-14,condition:null},"KPHL":{temp:-3,condition:null},"KLGA":{temp:-4,condition:null},
  "KBWI":{temp:-2,condition:null},"KSLC":{temp:2,condition:null},"KDCA":{temp:-2,condition:null},"KIAD":{temp:-3,condition:null},"KSAN":{temp:17,condition:null},"KTPA":{temp:8,condition:null},"KPDX":{temp:4,condition:null},"KSTL":{temp:0,condition:null},"KHNL":{temp:23,condition:null},"KMEM":{temp:3,condition:null},
  "KAUS":{temp:5,condition:null},"KBNA":{temp:1,condition:null},"KRDU":{temp:3,condition:null},"KCLT":{temp:3,condition:null},"KSMF":{temp:8,condition:null},"KSJC":{temp:11,condition:null},"KOAK":{temp:11,condition:null},"KCLE":{temp:-12,condition:null},"KMKE":{temp:-15,condition:null},"KPIT":{temp:-13,condition:null},
  "KIND":{temp:-5,condition:null},"KCVG":{temp:-4,condition:null},"KMCI":{temp:-1,condition:null},"KSAT":{temp:3,condition:null},"KHOU":{temp:5,condition:null},"KDAL":{temp:7,condition:null},"KMDW":{temp:-11,condition:null},"PANC":{temp:-9,condition:null},"PAFA":{temp:-38,condition:null},"CYYZ":{temp:-14,condition:null},
  "CYVR":{temp:3,condition:null},"CYUL":{temp:-11,condition:null},"CYYC":{temp:-6,condition:null},"CYEG":{temp:-8,condition:null},"CYOW":{temp:-16,condition:null},"CYWG":{temp:-19,condition:null},"CYHZ":{temp:0,condition:null},"CYQB":{temp:-9,condition:null},"CYYJ":{temp:4,condition:null},"CYLW":{temp:-3,condition:null},
  "CYXE":{temp:-21,condition:null},"CYQR":{temp:-14,condition:null},"CYZF":{temp:-31,condition:null},"CYXY":{temp:-24,condition:null},"CYQT":{temp:-26,condition:null},"CYYT":{temp:2,condition:null},"MMMX":{temp:7,condition:null},"MMUN":{temp:17,condition:null},"MMGL":{temp:13,condition:null},"MMMY":{temp:9,condition:null},
  "MMTJ":{temp:16,condition:null},"MMSM":{temp:26,condition:null},"MMMD":{temp:18,condition:null},"MMCZ":{temp:20,condition:null},"MMSD":{temp:20,condition:null},"MGGT":{temp:13,condition:null},"MSLP":{temp:25,condition:null},"MHTG":{temp:20,condition:null},"MNMG":{temp:24,condition:null},"MROC":{temp:25,condition:null},
  "MPTO":{temp:27,condition:null},"MKJP":{temp:26,condition:null},"TNCM":{temp:26,condition:null},"TBPB":{temp:27,condition:null},"TTPP":{temp:29,condition:null},"MWCR":{temp:22,condition:null},"MUHA":{temp:18,condition:null},"MDSD":{temp:24,condition:null},"MDPP":{temp:25,condition:null},"MTPP":{temp:26,condition:null},
  "TJSJ":{temp:26,condition:null},"TIST":{temp:26,condition:null},"TLPL":{temp:28,condition:null},"TAPA":{temp:26,condition:null},"SBGR":{temp:29,condition:null},"SBGL":{temp:36,condition:null},"SBBR":{temp:27,condition:null},"SBCF":{temp:29,condition:null},"SBSV":{temp:29,condition:null},"SBRF":{temp:32,condition:null},
  "SBPA":{temp:31,condition:null},"SBCT":{temp:25,condition:null},"SBFZ":{temp:31,condition:null},"SCEL":{temp:27,condition:null},"SAEZ":{temp:24,condition:null},"SABE":{temp:24,condition:null},"SACO":{temp:31,condition:null},"SAME":{temp:30,condition:null},"SLLP":{temp:11,condition:null},"SLVR":{temp:26,condition:null},
  "SPJC":{temp:18,condition:null},"SEQM":{temp:14,condition:null},"SEGU":{temp:25,condition:null},"SKBO":{temp:14,condition:null},"SKMR":{temp:29,condition:null},"SKCL":{temp:22,condition:null},"SKMD":{temp:25,condition:null},"SKRG":{temp:16,condition:null},"SVMI":{temp:27,condition:null},"SUMU":{temp:26,condition:null},
  "SGAS":{temp:27,condition:null},"SBBV":{temp:30,condition:null},"SMJP":{temp:28,condition:null},"SYCJ":{temp:27,condition:null},"EGLL":{temp:6,condition:null},"EGKK":{temp:5,condition:null},"EGSS":{temp:5,condition:null},"EGLC":{temp:6,condition:null},"EGCC":{temp:6,condition:null},"EGBB":{temp:6,condition:null},
  "EGPH":{temp:4,condition:null},"EGPF":{temp:5,condition:null},"EGGW":{temp:4,condition:null},"EGNX":{temp:6,condition:null},"EGNT":{temp:3,condition:null},"EGGP":{temp:7,condition:null},"EGHI":{temp:7,condition:null},"EGGD":{temp:5,condition:null},"EGPD":{temp:2,condition:null},"EGAA":{temp:5,condition:null},
  "EIDW":{temp:6,condition:null},"EICK":{temp:6,condition:null},"EINN":{temp:8,condition:null},"LFPG":{temp:4,condition:null},"LFPO":{temp:3,condition:null},"LFML":{temp:10,condition:null},"LFLL":{temp:4,condition:null},"LFMN":{temp:12,condition:null},"LFBD":{temp:3,condition:null},"LFBO":{temp:4,condition:null},
  "LFRS":{temp:2,condition:null},"LFSB":{temp:1,condition:null},"LFPB":{temp:4,condition:null},"EDDF":{temp:3,condition:null},"EDDM":{temp:2,condition:null},"EDDB":{temp:2,condition:null},"EDDL":{temp:3,condition:null},"EDDH":{temp:2,condition:null},"EDDK":{temp:4,condition:null},"EDDS":{temp:3,condition:null},
  "EDDW":{temp:3,condition:null},"EDDN":{temp:1,condition:null},"EDDV":{temp:3,condition:null},"EDDP":{temp:3,condition:null},"LEMD":{temp:6,condition:null},"LEBL":{temp:12,condition:null},"LEPA":{temp:13,condition:null},"LEMG":{temp:15,condition:null},"LEVC":{temp:14,condition:null},"LEAL":{temp:14,condition:null},
  "LEZL":{temp:14,condition:null},"GCLP":{temp:22,condition:null},"GCTS":{temp:18,condition:null},"GCLA":{temp:19,condition:null},"GCFV":{temp:23,condition:null},"LPPT":{temp:13,condition:null},"LPPR":{temp:10,condition:null},"LPFR":{temp:17,condition:null},"LPMA":{temp:17,condition:null},"LIRF":{temp:11,condition:null},
  "LIMC":{temp:4,condition:null},"LIME":{temp:3,condition:null},"LIPZ":{temp:4,condition:null},"LIRN":{temp:10,condition:null},"LIML":{temp:4,condition:null},"LIPE":{temp:7,condition:null},"LICC":{temp:12,condition:null},"LICJ":{temp:15,condition:null},"LIRA":{temp:10,condition:null},"LIRP":{temp:7,condition:null},
  "LIMF":{temp:5,condition:null},"LIEO":{temp:14,condition:null},"LIEE":{temp:14,condition:null},"EHAM":{temp:6,condition:null},"EHRD":{temp:6,condition:null},"EHEH":{temp:4,condition:null},"EBBR":{temp:4,condition:null},"EBCI":{temp:3,condition:null},"ELLX":{temp:0,condition:null},"LSZH":{temp:1,condition:null},
  "LSGG":{temp:5,condition:null},"LSZB":{temp:1,condition:null},"LOWW":{temp:5,condition:null},"LOWS":{temp:0,condition:null},"LOWG":{temp:3,condition:null},"LOWI":{temp:1,condition:null},"LKPR":{temp:0,condition:null},"EPWA":{temp:1,condition:null},"EPKK":{temp:1,condition:null},"EPGD":{temp:0,condition:null},
  "EPWR":{temp:2,condition:null},"EPPO":{temp:1,condition:null},"EKCH":{temp:4,condition:null},"ESSA":{temp:1,condition:null},"ENGM":{temp:-2,condition:null},"EFHK":{temp:-11,condition:null},"BIKF":{temp:4,condition:null},"ESGG":{temp:2,condition:null},"ESMS":{temp:3,condition:null},"ENBR":{temp:1,condition:null},
  "ENZV":{temp:6,condition:null},"ENTC":{temp:-11,condition:null},"EFOU":{temp:-19,condition:null},"EFRO":{temp:-19,condition:null},"LGAV":{temp:6,condition:null},"LGTS":{temp:5,condition:null},"LGIR":{temp:9,condition:null},"LGKR":{temp:10,condition:null},"LGRP":{temp:8,condition:null},"LGSR":{temp:8,condition:null},
  "LGMK":{temp:7,condition:null},"LTFM":{temp:1,condition:null},"LTBA":{temp:2,condition:null},"LTFJ":{temp:2,condition:null},"LTAI":{temp:8,condition:null},"LTAC":{temp:-4,condition:null},"LTBJ":{temp:3,condition:null},"LTBS":{temp:10,condition:null},"LTFE":{temp:5,condition:null},"LCLK":{temp:15,condition:null},
  "LCPH":{temp:14,condition:null},"LHBP":{temp:3,condition:null},"LROP":{temp:0,condition:null},"LBSF":{temp:0,condition:null},"LYBE":{temp:5,condition:null},"LDZA":{temp:6,condition:null},"LDDU":{temp:7,condition:null},"LDSP":{temp:8,condition:null},"LJLJ":{temp:4,condition:null},"LWSK":{temp:2,condition:null},
  "LATI":{temp:7,condition:null},"UKBB":{temp:-11,condition:null},"UKLL":{temp:-2,condition:null},"UUEE":{temp:-11,condition:null},"UUDD":{temp:-11,condition:null},"UUWW":{temp:-11,condition:null},"ULLI":{temp:-9,condition:null},"UWWW":{temp:-10,condition:null},"USSS":{temp:-10,condition:null},"UNNT":{temp:-9,condition:null},
  "UUOB":{temp:-30,condition:null},"UHWW":{temp:-14,condition:null},"UEEE":{temp:-26,condition:null},"OMDB":{temp:21,condition:null},"OMDW":{temp:21,condition:null},"OMAA":{temp:21,condition:null},"OMSJ":{temp:21,condition:null},"OTHH":{temp:20,condition:null},"OERK":{temp:23,condition:null},"OEJN":{temp:28,condition:null},
  "OEDF":{temp:21,condition:null},"OEMA":{temp:25,condition:null},"OKBK":{temp:19,condition:null},"OBBI":{temp:20,condition:null},"OOMS":{temp:22,condition:null},"OYAA":{temp:18,condition:null},"OIIE":{temp:7,condition:null},"OIII":{temp:7,condition:null},"OISS":{temp:11,condition:null},"OIKB":{temp:20,condition:null},
  "OIAW":{temp:16,condition:null},"OIKK":{temp:12,condition:null},"OICC":{temp:8,condition:null},"LLBG":{temp:16,condition:null},"OLBA":{temp:15,condition:null},"OJAM":{temp:13,condition:null},"ORBI":{temp:16,condition:null},"ORER":{temp:7,condition:null},"GMMN":{temp:23,condition:null},"GMME":{temp:22,condition:null},
  "GMMX":{temp:23,condition:null},"GMTT":{temp:18,condition:null},"GMFF":{temp:18,condition:null},"GMAD":{temp:25,condition:null},"DAAG":{temp:17,condition:null},"DAOO":{temp:17,condition:null},"DTTA":{temp:17,condition:null},"DTMB":{temp:16,condition:null},"DTTJ":{temp:16,condition:null},"HECA":{temp:20,condition:null},
  "HEGN":{temp:23,condition:null},"HESH":{temp:22,condition:null},"HEBA":{temp:24,condition:null},"HEAX":{temp:16,condition:null},"HLLT":{temp:17,condition:null},"DNMM":{temp:33,condition:null},"DNAA":{temp:37,condition:null},"DGAA":{temp:31,condition:null},"DIAP":{temp:30,condition:null},"GOBD":{temp:33,condition:null},
  "GABS":{temp:34,condition:null},"GVNP":{temp:29,condition:null},"GBYD":{temp:29,condition:null},"GLRB":{temp:28,condition:null},"DXXX":{temp:32,condition:null},"DBBB":{temp:32,condition:null},"HKJK":{temp:22,condition:null},"HKMO":{temp:31,condition:null},"HTDA":{temp:29,condition:null},"HTKJ":{temp:27,condition:null},
  "HUEN":{temp:26,condition:null},"HRYR":{temp:27,condition:null},"HAAB":{temp:21,condition:null},"HDAM":{temp:26,condition:null},"HCMM":{temp:30,condition:null},"OYSN":{temp:23,condition:null},"FMEE":{temp:26,condition:null},"FIMP":{temp:23,condition:null},"FMCH":{temp:30,condition:null},"FMMI":{temp:23,condition:null},
  "FSIA":{temp:28,condition:null},"FKKD":{temp:29,condition:null},"FKYS":{temp:30,condition:null},"FOOL":{temp:29,condition:null},"FZAA":{temp:28,condition:null},"FCBB":{temp:27,condition:null},"FLLK":{temp:27,condition:null},"FVHA":{temp:27,condition:null},"FLLS":{temp:27,condition:null},"FYWH":{temp:28,condition:null},
  "FBSK":{temp:33,condition:null},"FAOR":{temp:24,condition:null},"FACT":{temp:26,condition:null},"FALE":{temp:24,condition:null},"FAPE":{temp:25,condition:null},"FQMA":{temp:32,condition:null},"FWKI":{temp:23,condition:null},"ZBAA":{temp:-5,condition:null},"ZBAD":{temp:-6,condition:null},"ZSPD":{temp:5,condition:null},
  "ZSSS":{temp:3,condition:null},"ZGGG":{temp:13,condition:null},"VHHH":{temp:17,condition:null},"ZGSZ":{temp:16,condition:null},"ZUUU":{temp:7,condition:null},"ZUCK":{temp:9,condition:null},"ZHCC":{temp:0,condition:null},"ZLXY":{temp:0,condition:null},"ZWSH":{temp:-11,condition:null},"ZYHB":{temp:-21,condition:null},
  "ZYTX":{temp:-15,condition:null},"ZSAM":{temp:13,condition:null},"ZGKL":{temp:5,condition:null},"ZSNJ":{temp:1,condition:null},"ZSHC":{temp:4,condition:null},"ZPPP":{temp:8,condition:null},"ZBTJ":{temp:-5,condition:null},"VMMC":{temp:16,condition:null},"RJTT":{temp:6,condition:null},"RJAA":{temp:3,condition:null},
  "RJBB":{temp:7,condition:null},"RJOO":{temp:3,condition:null},"RJCC":{temp:-13,condition:null},"RJFF":{temp:4,condition:null},"RJGG":{temp:6,condition:null},"ROAH":{temp:18,condition:null},"RJSS":{temp:0,condition:null},"RJSN":{temp:3,condition:null},"RJOK":{temp:5,condition:null},"RKSI":{temp:-7,condition:null},
  "RKSS":{temp:-10,condition:null},"RKPK":{temp:-4,condition:null},"RKPC":{temp:4,condition:null},"RKTN":{temp:-7,condition:null},"ZKPY":{temp:-14,condition:null},"WSSS":{temp:26,condition:null},"WMKK":{temp:26,condition:null},"WMKP":{temp:29,condition:null},"WBKK":{temp:28,condition:null},"WBGG":{temp:24,condition:null},
  "VTBS":{temp:28,condition:null},"VTBD":{temp:27,condition:null},"VTSP":{temp:28,condition:null},"VTCC":{temp:21,condition:null},"VTSS":{temp:27,condition:null},"VTUK":{temp:26,condition:null},"VVNB":{temp:18,condition:null},"VVTS":{temp:25,condition:null},"VVDN":{temp:19,condition:null},"VVCR":{temp:21,condition:null},
  "VDPP":{temp:25,condition:null},"VDSR":{temp:23,condition:null},"VLVT":{temp:22,condition:null},"VLLB":{temp:21,condition:null},"VYYY":{temp:25,condition:null},"VYMD":{temp:21,condition:null},"VGHS":{temp:16,condition:null},"VGCG":{temp:20,condition:null},"VECC":{temp:18,condition:null},"VRMM":{temp:27,condition:null},
  "VCBI":{temp:27,condition:null},"WIII":{temp:26,condition:null},"WADD":{temp:29,condition:null},"WARR":{temp:27,condition:null},"WIHH":{temp:27,condition:null},"WIMM":{temp:26,condition:null},"WIBB":{temp:28,condition:null},"WAFF":{temp:27,condition:null},"WICC":{temp:23,condition:null},"WASS":{temp:28,condition:null},
  "RPLL":{temp:27,condition:null},"RPLC":{temp:24,condition:null},"RPVM":{temp:25,condition:null},"RPVD":{temp:26,condition:null},"RPVK":{temp:24,condition:null},"WBSB":{temp:26,condition:null},"WBLL":{temp:27,condition:null},"VIDP":{temp:14,condition:null},"VABB":{temp:25,condition:null},"VOBL":{temp:23,condition:null},
  "VOMM":{temp:25,condition:null},"VEBS":{temp:18,condition:null},"VOHY":{temp:22,condition:null},"VAAH":{temp:23,condition:null},"VOCI":{temp:28,condition:null},"VAGO":{temp:26,condition:null},"VOTP":{temp:24,condition:null},"VIAR":{temp:13,condition:null},"VIJP":{temp:18,condition:null},"VELR":{temp:12,condition:null},
  "VOCL":{temp:27,condition:null},"VOTV":{temp:28,condition:null},"VEPT":{temp:15,condition:null},"VNKT":{temp:11,condition:null},"OPKC":{temp:23,condition:null},"OPLA":{temp:13,condition:null},"OPIS":{temp:12,condition:null},"RCTP":{temp:16,condition:null},"RCSS":{temp:15,condition:null},"RCMQ":{temp:15,condition:null},
  "RCKH":{temp:18,condition:null},"RCNN":{temp:17,condition:null},"YSSY":{temp:14,condition:null},"YMML":{temp:14,condition:null},"YBBN":{temp:23,condition:null},"YPPH":{temp:28,condition:null},"YPAD":{temp:19,condition:null},"YBCG":{temp:20,condition:null},"YBCS":{temp:24,condition:null},"YSCB":{temp:12,condition:null},
  "YMHB":{temp:14,condition:null},"NZAA":{temp:19,condition:null},"NZWN":{temp:17,condition:null},"NZCH":{temp:14,condition:null},"NZQN":{temp:14,condition:null},"NZDN":{temp:12,condition:null},"NFFN":{temp:26,condition:null},"NWWW":{temp:26,condition:null},"NTAA":{temp:27,condition:null},"NSFA":{temp:28,condition:null},
  "NIUE":{temp:27,condition:null},"PGSN":{temp:27,condition:null},"PGUM":{temp:27,condition:null},"PHOG":{temp:23,condition:null},"PHKO":{temp:26,condition:null},"PHLH":{temp:20,condition:null},
};

// Convert to Map for faster lookups
const WEATHER_MAP = new Map(Object.entries(HARDCODED_WEATHER));

// Haversine distance approximation (returns degrees for simplicity)
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

// Find nearest airport with temperature data
export function getNearestAirportTemp(lat: number, lng: number): NearestAirportInfo | null {
  let nearest: Airport | null = null;
  let nearestDist = Infinity;

  for (const airport of AIRPORTS) {
    const dist = getDistance(lat, lng, airport.lat, airport.lng);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = airport;
    }
  }

  if (!nearest) return null;

  const weather = WEATHER_MAP.get(nearest.icao);
  if (weather === undefined) {
    // No weather data for this airport, estimate based on latitude and season
    const month = new Date().getMonth();
    const isWinter = month < 3 || month > 9;
    const latFactor = Math.abs(nearest.lat) / 90;
    const baseTemp = 25 - (latFactor * 50);
    const seasonalAdj = isWinter ? (nearest.lat > 0 ? -15 : 15) : (nearest.lat > 0 ? 15 : -15);
    return {
      airport: nearest,
      temp: Math.round(baseTemp + seasonalAdj * latFactor),
      condition: null,
      distance: nearestDist
    };
  }

  return {
    airport: nearest,
    temp: weather.temp,
    condition: weather.condition,
    distance: nearestDist
  };
}

// Get all airports for the map
export function getAllAirports(): Airport[] {
  return AIRPORTS;
}

// Get temperature for a specific airport
export function getAirportTemp(icao: string): number | null {
  const weather = WEATHER_MAP.get(icao);
  return weather?.temp ?? null;
}

// Get weather condition for a specific airport
export function getAirportCondition(icao: string): WeatherCondition {
  const weather = WEATHER_MAP.get(icao);
  return weather?.condition ?? null;
}

// Alias for backwards compatibility
export function getAirports(): Airport[] {
  return AIRPORTS;
}

// Alias for backwards compatibility - returns same as getNearestAirportTemp
export function getNearestAirportInfo(lat: number, lng: number): NearestAirportInfo | null {
  return getNearestAirportTemp(lat, lng);
}

// Get temperature with fallback estimation
export function getTempWithFallback(lat: number, lng: number): number {
  const info = getNearestAirportTemp(lat, lng);
  if (info) return info.temp;

  // Fallback: estimate based on latitude and season
  const month = new Date().getMonth();
  const isWinter = month < 3 || month > 9;
  const latFactor = Math.abs(lat) / 90;
  const baseTemp = 25 - (latFactor * 50);
  const seasonalAdj = isWinter ? (lat > 0 ? -15 : 15) : (lat > 0 ? 15 : -15);
  return Math.round(baseTemp + seasonalAdj * latFactor);
}

// METAR cache - temperatures are hardcoded, so always ready
let metarCacheReady = true;

export function isMetarCacheReady(): boolean {
  return metarCacheReady;
}

// Fetch all METAR data - no-op since we use hardcoded temps from GitHub Actions
export async function fetchAllMetar(): Promise<void> {
  // Temperatures are pre-fetched by GitHub Actions and hardcoded
  // This function exists for API compatibility
  metarCacheReady = true;
}
