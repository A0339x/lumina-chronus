// Local "Happy New Year" greetings mapped by city and region
// Falls back through: specific city -> region -> default

interface GreetingEntry {
  text: string;
  language: string;
}

// City-specific greetings (for major cities with distinct languages)
const cityGreetings: Record<string, GreetingEntry> = {
  // East Asia
  "Tokyo": { text: "明けましておめでとうございます", language: "Japanese" },
  "Osaka": { text: "明けましておめでとうございます", language: "Japanese" },
  "Kyoto": { text: "明けましておめでとうございます", language: "Japanese" },
  "Seoul": { text: "새해 복 많이 받으세요", language: "Korean" },
  "Busan": { text: "새해 복 많이 받으세요", language: "Korean" },
  "Pyongyang": { text: "새해 복 많이 받으세요", language: "Korean" },
  "Beijing": { text: "新年快乐", language: "Chinese" },
  "Shanghai": { text: "新年快乐", language: "Chinese" },
  "Hong Kong": { text: "新年快樂", language: "Cantonese" },
  "Taipei": { text: "新年快樂", language: "Chinese" },
  "Ulaanbaatar": { text: "Шинэ жилийн мэнд хүргэе", language: "Mongolian" },

  // Southeast Asia
  "Bangkok": { text: "สวัสดีปีใหม่", language: "Thai" },
  "Phuket": { text: "สวัสดีปีใหม่", language: "Thai" },
  "Jakarta": { text: "Selamat Tahun Baru", language: "Indonesian" },
  "Bali": { text: "Selamat Tahun Baru", language: "Indonesian" },
  "Denpasar": { text: "Selamat Tahun Baru", language: "Indonesian" },
  "Singapore": { text: "新年快乐", language: "Chinese/English" },
  "Kuala Lumpur": { text: "Selamat Tahun Baru", language: "Malay" },
  "Manila": { text: "Maligayang Bagong Taon", language: "Filipino" },
  "Ho Chi Minh City": { text: "Chúc Mừng Năm Mới", language: "Vietnamese" },
  "Hanoi": { text: "Chúc Mừng Năm Mới", language: "Vietnamese" },
  "Phnom Penh": { text: "រីករាយឆ្នាំថ្មី", language: "Khmer" },
  "Vientiane": { text: "ສະບາຍດີປີໃໝ່", language: "Lao" },
  "Yangon": { text: "နှစ်သစ်ကူးမင်္ဂလာပါ", language: "Burmese" },

  // South Asia
  "New Delhi": { text: "नया साल मुबारक हो", language: "Hindi" },
  "Mumbai": { text: "नवीन वर्षाच्या शुभेच्छा", language: "Marathi" },
  "Kolkata": { text: "শুভ নববর্ষ", language: "Bengali" },
  "Chennai": { text: "புத்தாண்டு வாழ்த்துக்கள்", language: "Tamil" },
  "Bengaluru": { text: "ಹೊಸ ವರ್ಷದ ಶುಭಾಶಯಗಳು", language: "Kannada" },
  "Hyderabad": { text: "నూతన సంవత్సర శుభాకాంక్షలు", language: "Telugu" },
  "Dhaka": { text: "শুভ নববর্ষ", language: "Bengali" },
  "Colombo": { text: "සුභ අලුත් අවුරුද්දක්", language: "Sinhala" },
  "Kathmandu": { text: "नयाँ वर्षको शुभकामना", language: "Nepali" },
  "Karachi": { text: "نیا سال مبارک", language: "Urdu" },
  "Islamabad": { text: "نیا سال مبارک", language: "Urdu" },
  "Kabul": { text: "سال نو مبارک", language: "Dari" },
  "Thimphu": { text: "ལོ་གསར་བཀྲ་ཤིས་བདེ་ལེགས", language: "Dzongkha" },

  // Central Asia
  "Tashkent": { text: "Yangi yil bilan", language: "Uzbek" },
  "Almaty": { text: "Жаңа жылыңызбен", language: "Kazakh" },
  "Astana": { text: "Жаңа жылыңызбен", language: "Kazakh" },
  "Bishkek": { text: "Жаңы жылыңыздар менен", language: "Kyrgyz" },
  "Dushanbe": { text: "Соли нав муборак", language: "Tajik" },
  "Ashgabat": { text: "Täze ýylyňyz gutly bolsun", language: "Turkmen" },

  // Middle East
  "Dubai": { text: "سنة جديدة سعيدة", language: "Arabic" },
  "Abu Dhabi": { text: "سنة جديدة سعيدة", language: "Arabic" },
  "Riyadh": { text: "سنة جديدة سعيدة", language: "Arabic" },
  "Tehran": { text: "سال نو مبارک", language: "Persian" },
  "Baghdad": { text: "سنة جديدة سعيدة", language: "Arabic" },
  "Jerusalem": { text: "שנה טובה", language: "Hebrew" },
  "Tel Aviv": { text: "שנה טובה", language: "Hebrew" },
  "Beirut": { text: "سنة جديدة سعيدة", language: "Arabic" },
  "Amman": { text: "سنة جديدة سعيدة", language: "Arabic" },
  "Damascus": { text: "سنة جديدة سعيدة", language: "Arabic" },
  "Istanbul": { text: "Mutlu Yıllar", language: "Turkish" },
  "Ankara": { text: "Mutlu Yıllar", language: "Turkish" },

  // Caucasus
  "Baku": { text: "Yeni iliniz mübarək", language: "Azerbaijani" },
  "Tbilisi": { text: "გილოცავთ ახალ წელს", language: "Georgian" },
  "Yerevan": { text: "Shnorhavor Nor Tari", language: "Armenian" },

  // Russia & Eastern Europe
  "Moscow": { text: "С Новым Годом", language: "Russian" },
  "Saint Petersburg": { text: "С Новым Годом", language: "Russian" },
  "Kyiv": { text: "З Новим Роком", language: "Ukrainian" },
  "Minsk": { text: "З Новым годам", language: "Belarusian" },
  "Warsaw": { text: "Szczęśliwego Nowego Roku", language: "Polish" },
  "Prague": { text: "Šťastný Nový Rok", language: "Czech" },
  "Budapest": { text: "Boldog Új Évet", language: "Hungarian" },
  "Bucharest": { text: "La Mulți Ani", language: "Romanian" },
  "Sofia": { text: "Честита Нова Година", language: "Bulgarian" },
  "Belgrade": { text: "Срећна Нова Година", language: "Serbian" },
  "Zagreb": { text: "Sretna Nova Godina", language: "Croatian" },
  "Ljubljana": { text: "Srečno Novo Leto", language: "Slovenian" },
  "Bratislava": { text: "Šťastný Nový Rok", language: "Slovak" },
  "Chisinau": { text: "La Mulți Ani", language: "Romanian" },
  "Tirana": { text: "Gëzuar Vitin e Ri", language: "Albanian" },
  "Skopje": { text: "Среќна Нова Година", language: "Macedonian" },

  // Western Europe
  "London": { text: "Happy New Year", language: "English" },
  "Edinburgh": { text: "Happy New Year", language: "English" },
  "Dublin": { text: "Athbhliain faoi Mhaise", language: "Irish" },
  "Paris": { text: "Bonne Année", language: "French" },
  "Berlin": { text: "Frohes Neues Jahr", language: "German" },
  "Munich": { text: "Frohes Neues Jahr", language: "German" },
  "Vienna": { text: "Frohes Neues Jahr", language: "German" },
  "Zurich": { text: "Frohes Neues Jahr", language: "German" },
  "Amsterdam": { text: "Gelukkig Nieuwjaar", language: "Dutch" },
  "Brussels": { text: "Bonne Année", language: "French" },
  "Rome": { text: "Buon Anno", language: "Italian" },
  "Milan": { text: "Buon Anno", language: "Italian" },
  "Madrid": { text: "Feliz Año Nuevo", language: "Spanish" },
  "Barcelona": { text: "Feliç Any Nou", language: "Catalan" },
  "Lisbon": { text: "Feliz Ano Novo", language: "Portuguese" },
  "Athens": { text: "Καλή Χρονιά", language: "Greek" },
  "Stockholm": { text: "Gott Nytt År", language: "Swedish" },
  "Copenhagen": { text: "Godt Nytår", language: "Danish" },
  "Oslo": { text: "Godt Nytt År", language: "Norwegian" },
  "Helsinki": { text: "Hyvää Uutta Vuotta", language: "Finnish" },
  "Tallinn": { text: "Head Uut Aastat", language: "Estonian" },
  "Riga": { text: "Laimīgu Jauno Gadu", language: "Latvian" },
  "Vilnius": { text: "Laimingų Naujųjų Metų", language: "Lithuanian" },
  "Reykjavik": { text: "Gleðilegt Nýtt Ár", language: "Icelandic" },

  // Africa
  "Cairo": { text: "سنة جديدة سعيدة", language: "Arabic" },
  "Nairobi": { text: "Heri ya Mwaka Mpya", language: "Swahili" },
  "Lagos": { text: "Eku Odun Titun", language: "Yoruba" },
  "Johannesburg": { text: "Gelukkige Nuwe Jaar", language: "Afrikaans" },
  "Cape Town": { text: "Happy New Year", language: "English" },
  "Addis Ababa": { text: "እንኳን ለአዲስ ዓመት በሰላም አደረሳችሁ", language: "Amharic" },
  "Casablanca": { text: "سنة جديدة سعيدة", language: "Arabic" },
  "Accra": { text: "Afe Nkɔ Mmɔ", language: "Akan" },
  "Dakar": { text: "Bonne Année", language: "French" },
  "Kinshasa": { text: "Bonne Année", language: "French" },
  "Antananarivo": { text: "Tratry ny Taona Vaovao", language: "Malagasy" },

  // Americas
  "New York": { text: "Happy New Year", language: "English" },
  "Los Angeles": { text: "Happy New Year", language: "English" },
  "Chicago": { text: "Happy New Year", language: "English" },
  "Toronto": { text: "Happy New Year", language: "English" },
  "Montreal": { text: "Bonne Année", language: "French" },
  "Mexico City": { text: "Feliz Año Nuevo", language: "Spanish" },
  "São Paulo": { text: "Feliz Ano Novo", language: "Portuguese" },
  "Rio de Janeiro": { text: "Feliz Ano Novo", language: "Portuguese" },
  "Buenos Aires": { text: "Feliz Año Nuevo", language: "Spanish" },
  "Lima": { text: "Feliz Año Nuevo", language: "Spanish" },
  "Bogotá": { text: "Feliz Año Nuevo", language: "Spanish" },
  "Santiago": { text: "Feliz Año Nuevo", language: "Spanish" },
  "Havana": { text: "Feliz Año Nuevo", language: "Spanish" },
  "San Juan": { text: "Feliz Año Nuevo", language: "Spanish" },
  "Caracas": { text: "Feliz Año Nuevo", language: "Spanish" },

  // Oceania
  "Sydney": { text: "Happy New Year", language: "English" },
  "Melbourne": { text: "Happy New Year", language: "English" },
  "Auckland": { text: "Happy New Year", language: "English" },
  "Wellington": { text: "Happy New Year", language: "English" },
  "Suva": { text: "Happy New Year", language: "English" },
  "Honolulu": { text: "Hauʻoli Makahiki Hou", language: "Hawaiian" },
  "Papeete": { text: "Ia Orana i te Matahiti Api", language: "Tahitian" },
  "Apia": { text: "Manuia le Tausaga Fou", language: "Samoan" },
  "Port Moresby": { text: "Happy New Year", language: "English" },

  // Pacific Islands
  "Nukuʻalofa": { text: "Monu ki he Taʻu Foʻou", language: "Tongan" },
  "Pago Pago": { text: "Manuia le Tausaga Fou", language: "Samoan" },
  "Kiritimati": { text: "Te Mauri, Te Raoi ao Te Tabomoa", language: "Gilbertese" },
};

// Region-level fallback greetings
const regionGreetings: Record<string, GreetingEntry> = {
  "Line Islands": { text: "Te Mauri, Te Raoi ao Te Tabomoa", language: "Gilbertese" },
  "Samoa & Tonga": { text: "Manuia le Tausaga Fou", language: "Samoan" },
  "Chatham Islands": { text: "Happy New Year", language: "English" },
  "New Zealand & Fiji": { text: "Happy New Year", language: "English" },
  "Solomon Is. & Vanuatu": { text: "Happy New Year", language: "English" },
  "Lord Howe Island": { text: "Happy New Year", language: "English" },
  "Eastern Australia": { text: "Happy New Year", language: "English" },
  "Central Australia": { text: "Happy New Year", language: "English" },
  "Japan & Korea": { text: "明けましておめでとうございます", language: "Japanese" },
  "Eucla": { text: "Happy New Year", language: "English" },
  "China & ASEAN": { text: "新年快乐", language: "Chinese" },
  "Indochina": { text: "สวัสดีปีใหม่", language: "Thai" },
  "Myanmar": { text: "နှစ်သစ်ကူးမင်္ဂလာပါ", language: "Burmese" },
  "Central Asia": { text: "শুভ নববর্ষ", language: "Bengali" },
  "Nepal": { text: "नयाँ वर्षको शुभकामना", language: "Nepali" },
  "India & Sri Lanka": { text: "नया साल मुबारक हो", language: "Hindi" },
  "Pakistan & West Asia": { text: "نیا سال مبارک", language: "Urdu" },
  "Afghanistan": { text: "سال نو مبارک", language: "Dari" },
  "Gulf & Caucasus": { text: "سنة جديدة سعيدة", language: "Arabic" },
  "Iran": { text: "سال نو مبارک", language: "Persian" },
  "Moscow & East Africa": { text: "С Новым Годом", language: "Russian" },
  "Eastern Europe": { text: "Happy New Year", language: "English" },
  "Central Europe": { text: "Frohes Neues Jahr", language: "German" },
  "UK & West Africa": { text: "Happy New Year", language: "English" },
  "Cape Verde": { text: "Feliz Ano Novo", language: "Portuguese" },
  "Mid-Atlantic": { text: "Happy New Year", language: "English" },
  "South America": { text: "Feliz Año Nuevo", language: "Spanish" },
  "Newfoundland": { text: "Happy New Year", language: "English" },
  "Atlantic Time": { text: "Happy New Year", language: "English" },
  "Eastern Time": { text: "Happy New Year", language: "English" },
  "Central Time": { text: "Happy New Year", language: "English" },
  "Mountain Time": { text: "Happy New Year", language: "English" },
  "Pacific Time": { text: "Happy New Year", language: "English" },
  "Alaska": { text: "Happy New Year", language: "English" },
  "Hawaii & Polynesia": { text: "Hauʻoli Makahiki Hou", language: "Hawaiian" },
  "American Samoa": { text: "Manuia le Tausaga Fou", language: "Samoan" },
};

// Default greeting
const defaultGreeting: GreetingEntry = { text: "Happy New Year", language: "English" };

/**
 * Get the local "Happy New Year" greeting for a city or region
 * Priority: specific city -> region -> default
 */
export const getLocalGreeting = (city?: string, region?: string): GreetingEntry => {
  // Try city-specific greeting first
  if (city && cityGreetings[city]) {
    return cityGreetings[city];
  }

  // Fall back to region greeting
  if (region && regionGreetings[region]) {
    return regionGreetings[region];
  }

  // Default
  return defaultGreeting;
};

export type { GreetingEntry };
