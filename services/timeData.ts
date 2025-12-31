import { TimezoneData } from '../types';

// A curated list of major timezones and their cities with approximate coordinates
export const TIMEZONES: TimezoneData[] = [
  { 
    offset: 14, 
    name: "UTC+14", 
    regionName: "Line Islands", 
    cities: ["Kiritimati", "London (Kiribati)", "Banana", "Tabwakea", "Poland (Kiribati)"], 
    coords: { lat: 1.872, lng: -157.36 } 
  },
  { 
    offset: 13, 
    name: "UTC+13", 
    regionName: "Samoa & Tonga", 
    cities: ["Apia", "Nukuʻalofa", "Fakaofo", "Neiafu", "Mata-Utu", "Pangai", "Ohonua", "Hihifo"], 
    coords: { lat: -13.83, lng: -171.75 } 
  },
  { 
    offset: 12.75, 
    name: "UTC+12:45", 
    regionName: "Chatham Islands", 
    cities: ["Waitangi", "Kaingaroa", "Te One", "Owenga", "Pitt Island"], 
    coords: { lat: -43.95, lng: -176.55 } 
  },
  { 
    offset: 12, 
    name: "UTC+12", 
    regionName: "New Zealand & Fiji", 
    cities: ["Auckland", "Wellington", "Christchurch", "Suva", "Hamilton", "Dunedin", "Tauranga", "Nadi", "Funafuti", "Majuro", "Tarawa", "Yaren", "McMurdo Station", "Petropavlovsk-Kamchatsky", "Anadyr"], 
    coords: { lat: -36.85, lng: 174.76 } 
  },
  { 
    offset: 11, 
    name: "UTC+11", 
    regionName: "Solomon Is. & Vanuatu", 
    cities: ["Nouméa", "Honiara", "Port Vila", "Bougainville", "Magadan", "Sakhalin", "Srednekolymsk", "Buka", "Gizo", "Luganville", "Norfolk Island"], 
    coords: { lat: -9.44, lng: 159.95 } 
  },
  { 
    offset: 10.5, 
    name: "UTC+10:30", 
    regionName: "Lord Howe Island", 
    cities: ["Lord Howe Island"], 
    coords: { lat: -31.55, lng: 159.08 } 
  },
  { 
    offset: 10, 
    name: "UTC+10", 
    regionName: "Eastern Australia", 
    cities: ["Sydney", "Melbourne", "Brisbane", "Canberra", "Port Moresby", "Vladivostok", "Hobart", "Gold Coast", "Cairns", "Townsville", "Hagåtña", "Saipan", "Chuuk", "Khabarovsk", "Lae", "Wewak"], 
    coords: { lat: -33.86, lng: 151.20 } 
  },
  { 
    offset: 9.5, 
    name: "UTC+9:30", 
    regionName: "Central Australia", 
    cities: ["Adelaide", "Darwin", "Alice Springs", "Broken Hill", "Coober Pedy", "Tenant Creek", "Katherine", "Yulara"], 
    coords: { lat: -34.92, lng: 138.60 } 
  },
  { 
    offset: 9, 
    name: "UTC+9", 
    regionName: "Japan & Korea", 
    cities: ["Tokyo", "Seoul", "Osaka", "Kyoto", "Yokohama", "Sapporo", "Busan", "Pyongyang", "Fukuoka", "Nagoya", "Hiroshima", "Incheon", "Daegu", "Dili", "Yakutsk", "Koror", "Ambon"], 
    coords: { lat: 35.67, lng: 139.65 } 
  },
  { 
    offset: 8.75, 
    name: "UTC+8:45", 
    regionName: "Eucla", 
    cities: ["Eucla", "Mundrabilla", "Madura Station"], 
    coords: { lat: -31.67, lng: 128.88 } 
  },
  { 
    offset: 8, 
    name: "UTC+8", 
    regionName: "China & ASEAN", 
    cities: ["Beijing", "Shanghai", "Singapore", "Hong Kong", "Manila", "Kuala Lumpur", "Taipei", "Perth", "Ulaanbaatar", "Makassar", "Denpasar", "Chengdu", "Shenzhen", "Guangzhou", "Harbin", "Wuhan", "Chongqing", "Bandar Seri Begawan", "Kuching", "Irkutsk"], 
    coords: { lat: 39.90, lng: 116.40 } 
  },
  { 
    offset: 7, 
    name: "UTC+7", 
    regionName: "Indochina", 
    cities: ["Bangkok", "Jakarta", "Ho Chi Minh City", "Hanoi", "Phnom Penh", "Vientiane", "Novosibirsk", "Krasnoyarsk", "Surabaya", "Bandung", "Medan", "Chiang Mai", "Phuket", "Da Nang", "Siem Reap", "Christmas Island", "Pontianak", "Hovd"], 
    coords: { lat: 13.75, lng: 100.50 } 
  },
  { 
    offset: 6.5, 
    name: "UTC+6:30", 
    regionName: "Myanmar", 
    cities: ["Yangon", "Naypyidaw", "Mandalay", "Bagan", "Taunggyi", "Cocos (Keeling) Islands"], 
    coords: { lat: 16.84, lng: 96.17 } 
  },
  { 
    offset: 6, 
    name: "UTC+6", 
    regionName: "Central Asia", 
    cities: ["Dhaka", "Almaty", "Bishkek", "Thimphu", "Astana", "Omsk", "Chittagong", "Sylhet", "Khulna", "Osh", "Vostok Station", "Qostanay"], 
    coords: { lat: 23.81, lng: 90.41 } 
  },
  { 
    offset: 5.75, 
    name: "UTC+5:45", 
    regionName: "Nepal", 
    cities: ["Kathmandu", "Pokhara", "Lalitpur", "Biratnagar", "Bharatpur", "Lukla", "Namche Bazaar"], 
    coords: { lat: 27.71, lng: 85.32 } 
  },
  { 
    offset: 5.5, 
    name: "UTC+5:30", 
    regionName: "India & Sri Lanka", 
    cities: ["New Delhi", "Mumbai", "Bengaluru", "Kolkata", "Chennai", "Hyderabad", "Colombo", "Jaipur", "Ahmedabad", "Pune", "Surat", "Kandy", "Galle", "Jaffna", "Lucknow", "Varanasi"], 
    coords: { lat: 28.61, lng: 77.20 } 
  },
  { 
    offset: 5, 
    name: "UTC+5", 
    regionName: "Pakistan & West Asia", 
    cities: ["Karachi", "Islamabad", "Lahore", "Tashkent", "Yekaterinburg", "Ashgabat", "Dushanbe", "Malé", "Samarkand", "Peshawar", "Multan", "Faisalabad", "Quetta", "Aktobe", "Kerguelen Islands", "Mawson Station"], 
    coords: { lat: 33.68, lng: 73.04 } 
  },
  { 
    offset: 4.5, 
    name: "UTC+4:30", 
    regionName: "Afghanistan", 
    cities: ["Kabul", "Kandahar", "Herat", "Mazar-i-Sharif", "Jalalabad", "Bamyan"], 
    coords: { lat: 34.55, lng: 69.20 } 
  },
  { 
    offset: 4, 
    name: "UTC+4", 
    regionName: "Gulf & Caucasus", 
    cities: ["Dubai", "Abu Dhabi", "Baku", "Muscat", "Tbilisi", "Yerevan", "Samara", "Port Louis", "Saint-Denis (Réunion)", "Victoria (Seychelles)", "Astrakhan", "Ulyanovsk", "Saratov", "Izhevsk"], 
    coords: { lat: 25.20, lng: 55.27 } 
  },
  { 
    offset: 3.5, 
    name: "UTC+3:30", 
    regionName: "Iran", 
    cities: ["Tehran", "Mashhad", "Isfahan", "Shiraz", "Tabriz", "Karaj", "Ahvaz", "Qom"], 
    coords: { lat: 35.68, lng: 51.38 } 
  },
  { 
    offset: 3, 
    name: "UTC+3", 
    regionName: "Moscow & East Africa", 
    cities: ["Moscow", "Istanbul", "Riyadh", "Baghdad", "Nairobi", "Addis Ababa", "Saint Petersburg", "Minsk", "Doha", "Kuwait City", "Manama", "Amman", "Sana'a", "Aden", "Kampala", "Dar es Salaam", "Mogadishu", "Antananarivo", "Djibouti", "Asmara", "Moroni"], 
    coords: { lat: 55.75, lng: 37.61 } 
  },
  { 
    offset: 2, 
    name: "UTC+2", 
    regionName: "Eastern Europe", 
    cities: ["Cairo", "Athens", "Jerusalem", "Kyiv", "Johannesburg", "Bucharest", "Helsinki", "Sofia", "Beirut", "Damascus", "Nicosia", "Riga", "Tallinn", "Vilnius", "Chisinau", "Kharkiv", "Odesa", "Cape Town", "Pretoria", "Harare", "Tripoli", "Khartoum", "Windhoek", "Gaborone", "Maputo", "Lusaka", "Lilongwe", "Maseru", "Mbabane", "Kaliningrad"], 
    coords: { lat: 30.04, lng: 31.23 } 
  },
  { 
    offset: 1, 
    name: "UTC+1", 
    regionName: "Central Europe", 
    cities: ["Paris", "Berlin", "Rome", "Madrid", "Amsterdam", "Brussels", "Vienna", "Warsaw", "Prague", "Budapest", "Stockholm", "Copenhagen", "Oslo", "Zurich", "Belgrade", "Zagreb", "Sarajevo", "Ljubljana", "Bratislava", "Tirana", "Skopje", "Podgorica", "Valletta", "Lagos", "Kinshasa", "Algiers", "Tunis", "Rabat", "Luanda", "Douala", "Yaoundé", "Libreville", "Brazzaville", "N'Djamena", "Bangui", "Niamey", "Longyearbyen", "Vaduz", "Monaco"], 
    coords: { lat: 48.85, lng: 2.35 } 
  },
  { 
    offset: 0, 
    name: "UTC+0", 
    regionName: "UK & West Africa", 
    cities: ["London", "Dublin", "Lisbon", "Edinburgh", "Cardiff", "Belfast", "Reykjavik", "Accra", "Casablanca", "Dakar", "Abidjan", "Bamako", "Ouagadougou", "Lomé", "Freetown", "Monrovia", "Conakry", "Nouakchott", "Banjul", "Bissau", "Timbuktu", "Saint Helena", "São Tomé", "Danmarkshavn"], 
    coords: { lat: 51.50, lng: -0.12 } 
  },
  { 
    offset: -1, 
    name: "UTC-1", 
    regionName: "Cape Verde", 
    cities: ["Praia", "Mindelo", "Santa Maria", "Ponta Delgada", "Angra do Heroísmo", "Ittoqqortoormiit"], 
    coords: { lat: 14.93, lng: -23.51 } 
  },
  { 
    offset: -2, 
    name: "UTC-2", 
    regionName: "Mid-Atlantic", 
    cities: ["King Edward Point", "Grytviken", "Nuuk (Summer)", "Noronha"], 
    coords: { lat: -54.28, lng: -36.50 } 
  },
  { 
    offset: -3, 
    name: "UTC-3", 
    regionName: "South America", 
    cities: ["São Paulo", "Buenos Aires", "Rio de Janeiro", "Brasília", "Santiago", "Montevideo", "Salvador", "Fortaleza", "Recife", "Belo Horizonte", "Curitiba", "Porto Alegre", "Rosario", "Mendoza", "Córdoba", "Punta Arenas", "Cayenne", "Paramaribo", "Nuuk", "Rothera Station", "Palmer Station", "Stanley"], 
    coords: { lat: -34.60, lng: -58.38 } 
  },
  { 
    offset: -3.5, 
    name: "UTC-3:30", 
    regionName: "Newfoundland", 
    cities: ["St. John's", "Mount Pearl", "Corner Brook", "Gander", "Labrador City", "Mary's Harbour", "Bonavista"], 
    coords: { lat: 47.56, lng: -52.71 } 
  },
  { 
    offset: -4, 
    name: "UTC-4", 
    regionName: "Atlantic Time", 
    cities: ["Halifax", "San Juan", "Santo Domingo", "Caracas", "La Paz", "Manaus", "Asunción", "Georgetown", "Port of Spain", "Bridgetown", "Castries", "Kingstown", "Roseau", "Saint John's", "Basseterre", "Hamilton (Bermuda)", "Thule Air Base", "Charlottetown", "Fredericton", "Moncton"], 
    coords: { lat: 44.64, lng: -63.57 } 
  },
  { 
    offset: -5, 
    name: "UTC-5", 
    regionName: "Eastern Time", 
    cities: ["New York", "Toronto", "Miami", "Washington D.C.", "Atlanta", "Philadelphia", "Boston", "Detroit", "Montreal", "Ottawa", "Quebec City", "Bogotá", "Lima", "Quito", "Havana", "Nassau", "Kingston", "Port-au-Prince", "Panama City", "Cancún", "Iqaluit"], 
    coords: { lat: 40.71, lng: -74.00 } 
  },
  { 
    offset: -6, 
    name: "UTC-6", 
    regionName: "Central Time", 
    cities: ["Chicago", "Mexico City", "Houston", "Dallas", "Austin", "San Antonio", "New Orleans", "Nashville", "St. Louis", "Minneapolis", "Winnipeg", "Regina", "Saskatoon", "San José", "Guatemala City", "Tegucigalpa", "San Salvador", "Managua", "Belmopan", "Galápagos Islands", "Easter Island"], 
    coords: { lat: 41.87, lng: -87.62 } 
  },
  { 
    offset: -7, 
    name: "UTC-7", 
    regionName: "Mountain Time", 
    cities: ["Denver", "Phoenix", "Salt Lake City", "Calgary", "Edmonton", "Albuquerque", "El Paso", "Boise", "Billings", "Cheyenne", "Santa Fe", "Chihuahua", "Ciudad Juárez", "Hermosillo", "Mazatlán", "Culiacán", "Yellowknife", "Inuvik"], 
    coords: { lat: 39.73, lng: -104.99 } 
  },
  { 
    offset: -8, 
    name: "UTC-8", 
    regionName: "Pacific Time", 
    cities: ["Los Angeles", "San Francisco", "Seattle", "Vancouver", "San Diego", "Las Vegas", "Portland", "Sacramento", "San Jose", "Tijuana", "Mexicali", "Ensenada", "Victoria", "Whitehorse", "Pitcairn Islands"], 
    coords: { lat: 34.05, lng: -118.24 } 
  },
  { 
    offset: -9, 
    name: "UTC-9", 
    regionName: "Alaska", 
    cities: ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan", "Nome", "Utqiaġvik", "Gambier Islands"], 
    coords: { lat: 61.21, lng: -149.90 } 
  },
  { 
    offset: -10, 
    name: "UTC-10", 
    regionName: "Hawaii & Polynesia", 
    cities: ["Honolulu", "Papeete", "Hilo", "Kahului", "Kailua-Kona", "Rarotonga", "Bora Bora", "Moorea", "Adak"], 
    coords: { lat: 21.30, lng: -157.85 } 
  },
  { 
    offset: -11, 
    name: "UTC-11", 
    regionName: "American Samoa", 
    cities: ["Pago Pago", "Alofi", "Midway Atoll", "Jarvis Island", "Palmyra Atoll"], 
    coords: { lat: -14.27, lng: -170.70 } 
  },
];