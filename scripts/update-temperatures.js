// Script to fetch live temperatures and update the hardcoded values
// Run by GitHub Actions every 30 minutes

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AIRPORTS = [
  // UTC+14 to UTC+12 - Pacific Islands & New Zealand
  { icao: "NZAA", lat: -37.01, lng: 174.79 },
  { icao: "NZWN", lat: -41.33, lng: 174.81 },
  { icao: "NZCH", lat: -43.49, lng: 172.53 },
  { icao: "NZQN", lat: -45.02, lng: 168.74 },
  { icao: "NFFN", lat: -17.75, lng: 177.44 },
  { icao: "NFNA", lat: -18.04, lng: 178.56 },
  { icao: "UHPP", lat: 53.17, lng: 158.45 },
  { icao: "PLCH", lat: 1.98, lng: -157.35 },
  { icao: "NGTA", lat: 1.38, lng: 173.15 },
  { icao: "NGFU", lat: -0.53, lng: 176.32 },
  { icao: "NLWW", lat: -13.24, lng: -176.20 },
  { icao: "NSFA", lat: -13.83, lng: -171.78 },
  { icao: "NFTF", lat: -21.24, lng: -175.15 },

  // UTC+11 - Solomon Islands, Vanuatu, New Caledonia
  { icao: "NVVV", lat: -17.70, lng: 168.32 },
  { icao: "AGGH", lat: -9.43, lng: 160.05 },
  { icao: "NWWW", lat: -22.27, lng: 166.47 },
  { icao: "UHMM", lat: 59.91, lng: 150.72 },
  { icao: "ANYN", lat: -0.55, lng: 166.92 },
  { icao: "PTKK", lat: 7.46, lng: 151.84 },
  { icao: "PTPN", lat: 6.98, lng: 158.21 },

  // UTC+10 - Eastern Australia, Papua New Guinea, Micronesia
  { icao: "YSSY", lat: -33.95, lng: 151.18 },
  { icao: "YMML", lat: -37.67, lng: 144.84 },
  { icao: "YBBN", lat: -27.38, lng: 153.12 },
  { icao: "YBCS", lat: -16.89, lng: 145.76 },
  { icao: "YBCG", lat: -28.16, lng: 153.51 },
  { icao: "AYPY", lat: -5.86, lng: 145.39 },
  { icao: "UHWW", lat: 43.40, lng: 132.15 },
  { icao: "PGUM", lat: 13.48, lng: 144.80 },
  { icao: "PGSN", lat: 15.12, lng: 145.73 },
  { icao: "PTRO", lat: 7.33, lng: 134.54 },
  { icao: "PWAK", lat: 19.28, lng: 166.64 },

  // UTC+9:30 - Central Australia
  { icao: "YPAD", lat: -34.94, lng: 138.53 },
  { icao: "YPDN", lat: -12.41, lng: 130.88 },

  // UTC+9 - Japan, Korea
  { icao: "RJTT", lat: 35.55, lng: 139.78 },
  { icao: "RJAA", lat: 35.76, lng: 140.39 },
  { icao: "RJBB", lat: 34.43, lng: 135.24 },
  { icao: "RKSI", lat: 37.47, lng: 126.45 },
  { icao: "RKSS", lat: 37.56, lng: 126.79 },
  { icao: "RKPK", lat: 35.18, lng: 128.94 },
  { icao: "RJCC", lat: 42.77, lng: 141.69 },
  { icao: "UEEE", lat: 62.09, lng: 129.77 },

  // UTC+8 - China, Singapore, Philippines, Malaysia, Western Australia
  { icao: "ZBAA", lat: 40.08, lng: 116.58 },
  { icao: "ZSPD", lat: 31.14, lng: 121.81 },
  { icao: "ZGGG", lat: 23.39, lng: 113.30 },
  { icao: "ZGSZ", lat: 22.64, lng: 113.81 },
  { icao: "VHHH", lat: 22.31, lng: 113.92 },
  { icao: "RCTP", lat: 25.08, lng: 121.23 },
  { icao: "WSSS", lat: 1.36, lng: 103.99 },
  { icao: "RPLL", lat: 14.51, lng: 121.02 },
  { icao: "WMKK", lat: 2.74, lng: 101.70 },
  { icao: "YPPH", lat: -31.94, lng: 115.97 },
  { icao: "ZMUB", lat: 47.84, lng: 106.77 },
  { icao: "UIII", lat: 52.27, lng: 104.39 },

  // UTC+7 - Thailand, Vietnam, Indonesia
  { icao: "VTBS", lat: 13.69, lng: 100.75 },
  { icao: "VVNB", lat: 21.22, lng: 105.80 },
  { icao: "VVTS", lat: 10.82, lng: 106.65 },
  { icao: "WIII", lat: -6.13, lng: 106.66 },
  { icao: "UNNT", lat: 55.01, lng: 82.65 },
  { icao: "UNKL", lat: 56.17, lng: 92.49 },

  // UTC+6:30 - Myanmar
  { icao: "VYYY", lat: 16.91, lng: 96.13 },

  // UTC+6 - Bangladesh, Central Asia
  { icao: "VGHS", lat: 23.84, lng: 90.40 },
  { icao: "UAAA", lat: 43.35, lng: 77.04 },
  { icao: "UACC", lat: 51.02, lng: 71.47 },
  { icao: "UTTT", lat: 41.26, lng: 69.28 },
  { icao: "UNOO", lat: 55.01, lng: 73.31 },

  // UTC+5:45 - Nepal
  { icao: "VNKT", lat: 27.70, lng: 85.36 },

  // UTC+5:30 - India, Sri Lanka
  { icao: "VIDP", lat: 28.57, lng: 77.09 },
  { icao: "VABB", lat: 19.09, lng: 72.87 },
  { icao: "VOBL", lat: 13.20, lng: 77.71 },
  { icao: "VECC", lat: 22.65, lng: 88.45 },
  { icao: "VOMM", lat: 12.99, lng: 80.17 },
  { icao: "VCBI", lat: 7.18, lng: 79.88 },

  // UTC+5 - Pakistan
  { icao: "OPKC", lat: 24.91, lng: 67.16 },
  { icao: "OPRN", lat: 33.62, lng: 73.10 },
  { icao: "OPLA", lat: 31.52, lng: 74.40 },
  { icao: "USSS", lat: 56.74, lng: 60.80 },

  // UTC+4:30 - Afghanistan
  { icao: "OAKB", lat: 34.57, lng: 69.21 },

  // UTC+4 - UAE, Gulf, Caucasus, Indian Ocean
  { icao: "OMDB", lat: 25.25, lng: 55.36 },
  { icao: "OMAA", lat: 24.44, lng: 54.65 },
  { icao: "OOMS", lat: 23.60, lng: 58.28 },
  { icao: "UBBB", lat: 40.47, lng: 50.05 },
  { icao: "UGGG", lat: 41.67, lng: 44.95 },
  { icao: "UDYZ", lat: 40.15, lng: 44.40 },
  { icao: "FIMP", lat: -20.43, lng: 57.68 },
  { icao: "FMEE", lat: -20.89, lng: 55.52 },
  { icao: "FSIA", lat: -4.67, lng: 55.52 },
  { icao: "VRMM", lat: 4.19, lng: 73.53 },
  { icao: "OOBR", lat: 26.27, lng: 50.64 },

  // UTC+3:30 - Iran
  { icao: "OIIE", lat: 35.69, lng: 51.31 },
  { icao: "OIMM", lat: 36.24, lng: 59.64 },

  // UTC+3 - Moscow, East Africa, Middle East
  { icao: "UUEE", lat: 55.97, lng: 37.41 },
  { icao: "UUDD", lat: 55.41, lng: 37.91 },
  { icao: "ULLI", lat: 59.80, lng: 30.26 },
  { icao: "LTFM", lat: 41.26, lng: 28.74 },
  { icao: "OERK", lat: 24.96, lng: 46.70 },
  { icao: "OEJN", lat: 21.68, lng: 39.16 },
  { icao: "ORBI", lat: 33.26, lng: 44.23 },
  { icao: "OTHH", lat: 25.26, lng: 51.61 },
  { icao: "OKBK", lat: 29.23, lng: 47.97 },
  { icao: "HKJK", lat: -1.32, lng: 36.93 },
  { icao: "HAAB", lat: 8.98, lng: 38.80 },
  { icao: "HTDA", lat: -6.88, lng: 39.20 },
  { icao: "FMMI", lat: -18.80, lng: 47.48 },

  // UTC+2 - Eastern Europe, Southern Africa, Mediterranean Islands
  { icao: "HECA", lat: 30.11, lng: 31.40 },
  { icao: "LGAV", lat: 37.94, lng: 23.94 },
  { icao: "LLBG", lat: 32.01, lng: 34.89 },
  { icao: "UKBB", lat: 50.34, lng: 30.89 },
  { icao: "LROP", lat: 44.57, lng: 26.09 },
  { icao: "EFHK", lat: 60.32, lng: 24.96 },
  { icao: "LBSF", lat: 42.69, lng: 23.41 },
  { icao: "FAOR", lat: -26.13, lng: 28.24 },
  { icao: "FACT", lat: -33.97, lng: 18.60 },
  { icao: "FVHA", lat: -17.93, lng: 31.09 },
  { icao: "LCLK", lat: 34.88, lng: 33.63 },
  { icao: "LCPH", lat: 34.72, lng: 32.49 },
  { icao: "LGIR", lat: 35.34, lng: 25.18 },
  { icao: "LGKR", lat: 39.60, lng: 19.91 },
  { icao: "LGSR", lat: 36.40, lng: 25.48 },
  { icao: "LGKO", lat: 36.79, lng: 27.09 },
  { icao: "LGRP", lat: 36.41, lng: 28.09 },
  { icao: "LMML", lat: 35.86, lng: 14.48 },

  // UTC+1 - Central Europe, West Africa, Western Mediterranean Islands
  { icao: "LFPG", lat: 49.01, lng: 2.55 },
  { icao: "EDDF", lat: 50.03, lng: 8.57 },
  { icao: "EDDM", lat: 48.35, lng: 11.79 },
  { icao: "LIRF", lat: 41.80, lng: 12.25 },
  { icao: "LEMD", lat: 40.47, lng: -3.56 },
  { icao: "LEBL", lat: 41.30, lng: 2.08 },
  { icao: "EHAM", lat: 52.31, lng: 4.77 },
  { icao: "EBBR", lat: 50.90, lng: 4.48 },
  { icao: "LOWW", lat: 48.11, lng: 16.57 },
  { icao: "EPWA", lat: 52.17, lng: 20.97 },
  { icao: "LKPR", lat: 50.10, lng: 14.26 },
  { icao: "LHBP", lat: 47.44, lng: 19.26 },
  { icao: "ESSA", lat: 59.65, lng: 17.92 },
  { icao: "EKCH", lat: 55.62, lng: 12.66 },
  { icao: "ENGM", lat: 60.19, lng: 11.10 },
  { icao: "LSZH", lat: 47.46, lng: 8.55 },
  { icao: "DNMM", lat: 6.58, lng: 3.32 },
  { icao: "DAAG", lat: 36.69, lng: 3.22 },
  { icao: "DTTA", lat: 36.85, lng: 10.23 },
  { icao: "LIEE", lat: 39.25, lng: 9.05 },
  { icao: "LIEO", lat: 40.90, lng: 9.52 },
  { icao: "LFKJ", lat: 41.92, lng: 8.80 },
  { icao: "LEIB", lat: 38.87, lng: 1.37 },
  { icao: "LEPA", lat: 39.55, lng: 2.74 },
  { icao: "LEMH", lat: 39.86, lng: 4.22 },
  { icao: "LICC", lat: 37.47, lng: 15.07 },
  { icao: "LICJ", lat: 38.18, lng: 13.10 },

  // UTC+0 - UK, Portugal, West Africa, Canary Islands
  { icao: "EGLL", lat: 51.47, lng: -0.46 },
  { icao: "EGKK", lat: 51.15, lng: -0.18 },
  { icao: "EIDW", lat: 53.43, lng: -6.27 },
  { icao: "LPPT", lat: 38.77, lng: -9.13 },
  { icao: "BIKF", lat: 63.99, lng: -22.61 },
  { icao: "DGAA", lat: 5.61, lng: -0.17 },
  { icao: "GOBD", lat: 14.67, lng: -17.07 },
  { icao: "GMMN", lat: 33.37, lng: -7.59 },
  { icao: "GCTS", lat: 28.04, lng: -16.57 },
  { icao: "GCXO", lat: 28.48, lng: -16.34 },
  { icao: "GCLP", lat: 27.93, lng: -15.39 },
  { icao: "GCLA", lat: 28.63, lng: -17.76 },
  { icao: "GCRR", lat: 28.95, lng: -13.61 },
  { icao: "GCFV", lat: 28.45, lng: -13.86 },
  { icao: "LPMA", lat: 32.70, lng: -16.77 },
  { icao: "EGJJ", lat: 49.21, lng: -2.20 },
  { icao: "EGJB", lat: 49.44, lng: -2.60 },
  { icao: "EGNS", lat: 54.08, lng: -4.63 },
  { icao: "EKVG", lat: 62.07, lng: -7.28 },

  // UTC-1 - Cape Verde, Azores
  { icao: "GVNP", lat: 14.92, lng: -23.49 },
  { icao: "GVSV", lat: 16.83, lng: -25.06 },
  { icao: "GVBA", lat: 16.14, lng: -22.89 },
  { icao: "LPAZ", lat: 36.97, lng: -25.17 },
  { icao: "LPHR", lat: 38.52, lng: -28.72 },
  { icao: "LPLA", lat: 38.76, lng: -27.09 },

  // UTC-3 - Brazil, Argentina
  { icao: "SBGR", lat: -23.43, lng: -46.47 },
  { icao: "SBGL", lat: -22.81, lng: -43.25 },
  { icao: "SBBR", lat: -15.87, lng: -47.92 },
  { icao: "SAEZ", lat: -34.82, lng: -58.54 },
  { icao: "SUMU", lat: -34.84, lng: -56.03 },
  { icao: "SCEL", lat: -33.39, lng: -70.79 },
  { icao: "SLLP", lat: -16.51, lng: -68.19 },
  { icao: "SGAS", lat: -25.24, lng: -57.52 },

  // UTC-3:30 - Newfoundland
  { icao: "CYYT", lat: 47.62, lng: -52.75 },

  // UTC-4 - Atlantic Canada, Caribbean
  { icao: "CYHZ", lat: 44.88, lng: -63.51 },
  { icao: "CYQM", lat: 46.11, lng: -64.68 },
  { icao: "CYFC", lat: 45.87, lng: -66.53 },
  { icao: "CYYG", lat: 46.29, lng: -63.12 },
  { icao: "CYQX", lat: 48.94, lng: -54.57 },
  { icao: "TJSJ", lat: 18.44, lng: -66.00 },
  { icao: "MDSD", lat: 18.43, lng: -69.67 },
  { icao: "SVMI", lat: 10.60, lng: -66.99 },
  { icao: "SBBV", lat: 2.84, lng: -60.69 },
  { icao: "TAPA", lat: 17.14, lng: -61.79 },
  { icao: "TBPB", lat: 13.07, lng: -59.49 },
  { icao: "TLPC", lat: 14.02, lng: -60.99 },
  { icao: "TGPY", lat: 12.00, lng: -61.79 },
  { icao: "TTPP", lat: 10.60, lng: -61.34 },
  { icao: "TNCC", lat: 12.19, lng: -68.96 },
  { icao: "TNCM", lat: 18.04, lng: -63.11 },
  { icao: "TFFR", lat: 16.27, lng: -61.53 },
  { icao: "TFFF", lat: 14.59, lng: -61.00 },
  { icao: "MYNN", lat: 25.04, lng: -77.47 },
  { icao: "MBPV", lat: 21.77, lng: -72.27 },
  { icao: "TIST", lat: 18.34, lng: -64.97 },
  { icao: "TKPK", lat: 17.31, lng: -62.72 },
  { icao: "TDPD", lat: 15.55, lng: -61.30 },
  { icao: "TVSV", lat: 13.14, lng: -61.21 },
  { icao: "TRPG", lat: 16.79, lng: -62.19 },
  { icao: "TQPF", lat: 18.20, lng: -63.05 },
  { icao: "MWCR", lat: 19.29, lng: -81.36 },
  { icao: "TXKF", lat: 32.36, lng: -64.68 },

  // UTC-5 - Eastern US/Canada, Colombia, Peru
  { icao: "KJFK", lat: 40.64, lng: -73.78 },
  { icao: "KLGA", lat: 40.78, lng: -73.87 },
  { icao: "KEWR", lat: 40.69, lng: -74.17 },
  { icao: "KORD", lat: 41.97, lng: -87.91 },
  { icao: "KATL", lat: 33.64, lng: -84.43 },
  { icao: "KMIA", lat: 25.80, lng: -80.29 },
  { icao: "KBOS", lat: 42.36, lng: -71.01 },
  { icao: "KDCA", lat: 38.85, lng: -77.04 },
  { icao: "KIAD", lat: 38.95, lng: -77.46 },
  { icao: "KPHL", lat: 39.87, lng: -75.24 },
  { icao: "KDTW", lat: 42.21, lng: -83.35 },
  { icao: "CYYZ", lat: 43.68, lng: -79.63 },
  { icao: "CYUL", lat: 45.47, lng: -73.74 },
  { icao: "CYOW", lat: 45.32, lng: -75.67 },
  { icao: "CYQB", lat: 46.79, lng: -71.39 },
  { icao: "CYQT", lat: 48.37, lng: -89.32 },
  { icao: "CYHM", lat: 43.17, lng: -79.93 },
  { icao: "CYFB", lat: 63.76, lng: -68.56 },
  { icao: "SKBO", lat: 4.70, lng: -74.15 },
  { icao: "SPJC", lat: -12.02, lng: -77.11 },
  { icao: "SEQM", lat: -0.13, lng: -78.36 },
  { icao: "MUHA", lat: 22.99, lng: -82.41 },
  { icao: "MKJP", lat: 17.94, lng: -76.79 },
  { icao: "MPTO", lat: 9.07, lng: -79.38 },

  // UTC-6 - Central US, Mexico, Central America
  { icao: "KDFW", lat: 32.90, lng: -97.04 },
  { icao: "KIAH", lat: 30.00, lng: -95.34 },
  { icao: "KAUS", lat: 30.19, lng: -97.67 },
  { icao: "KMSP", lat: 44.88, lng: -93.22 },
  { icao: "KSTL", lat: 38.75, lng: -90.37 },
  { icao: "KMSY", lat: 29.99, lng: -90.26 },
  { icao: "CYWG", lat: 49.91, lng: -97.24 },
  { icao: "CYQR", lat: 50.43, lng: -104.67 },
  { icao: "CYXE", lat: 52.17, lng: -106.70 },
  { icao: "MMMX", lat: 19.44, lng: -99.07 },
  { icao: "MMUN", lat: 21.04, lng: -86.87 },
  { icao: "MGGT", lat: 14.58, lng: -90.53 },
  { icao: "MHTG", lat: 14.06, lng: -87.22 },
  { icao: "MSSS", lat: 13.44, lng: -89.06 },
  { icao: "MNMG", lat: 12.14, lng: -86.17 },
  { icao: "MROC", lat: 9.99, lng: -84.21 },

  // UTC-7 - Mountain US/Canada, Mexico
  { icao: "KDEN", lat: 39.86, lng: -104.67 },
  { icao: "KPHX", lat: 33.44, lng: -112.01 },
  { icao: "KSLC", lat: 40.79, lng: -111.98 },
  { icao: "KABQ", lat: 35.04, lng: -106.61 },
  { icao: "KELP", lat: 31.81, lng: -106.38 },
  { icao: "KBOI", lat: 43.57, lng: -116.22 },
  { icao: "CYYC", lat: 51.11, lng: -114.02 },
  { icao: "CYEG", lat: 53.31, lng: -113.58 },
  { icao: "CYZF", lat: 62.46, lng: -114.44 },
  { icao: "CYXY", lat: 60.71, lng: -135.07 },
  { icao: "MMCU", lat: 28.70, lng: -105.96 },
  { icao: "MMHO", lat: 29.10, lng: -111.05 },

  // UTC-8 - Pacific US/Canada
  { icao: "KLAX", lat: 33.94, lng: -118.41 },
  { icao: "KSFO", lat: 37.62, lng: -122.38 },
  { icao: "KSEA", lat: 47.45, lng: -122.31 },
  { icao: "KSAN", lat: 32.73, lng: -117.19 },
  { icao: "KLAS", lat: 36.08, lng: -115.15 },
  { icao: "KPDX", lat: 45.59, lng: -122.60 },
  { icao: "CYVR", lat: 49.19, lng: -123.18 },
  { icao: "CYYJ", lat: 48.65, lng: -123.43 },
  { icao: "CYLW", lat: 49.96, lng: -119.38 },
  { icao: "MMTJ", lat: 32.54, lng: -116.97 },

  // UTC-9 - Alaska
  { icao: "PANC", lat: 61.17, lng: -150.00 },
  { icao: "PAFA", lat: 64.81, lng: -147.86 },
  { icao: "PAJN", lat: 58.36, lng: -134.58 },

  // UTC-10 - Hawaii, Tahiti, Cook Islands
  { icao: "PHNL", lat: 21.32, lng: -157.92 },
  { icao: "PHOG", lat: 20.90, lng: -156.43 },
  { icao: "PHKO", lat: 19.74, lng: -156.05 },
  { icao: "PHLI", lat: 21.98, lng: -159.34 },
  { icao: "NTAA", lat: -17.55, lng: -149.61 },
  { icao: "NTTB", lat: -16.44, lng: -151.75 },
  { icao: "NCAI", lat: -21.20, lng: -159.80 },

  // UTC-11 - American Samoa, Niue
  { icao: "NSTU", lat: -14.33, lng: -170.71 },
  { icao: "NIUE", lat: -19.08, lng: -169.93 },
  { icao: "PMDY", lat: 28.20, lng: -177.38 },

  // Remote South Atlantic
  { icao: "SFAL", lat: -51.69, lng: -57.78 },
  { icao: "FHAW", lat: -7.97, lng: -14.39 },
  { icao: "FHSH", lat: -15.96, lng: -5.67 },

  // Remote South Pacific
  { icao: "SCIP", lat: -27.16, lng: -109.42 },
  { icao: "NCRG", lat: -21.20, lng: -159.81 },

  // French Southern Territories
  { icao: "FMCZ", lat: -12.13, lng: 44.43 },
  { icao: "FMCH", lat: -11.53, lng: 43.27 },
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchTemperatures() {
  const temps = {};
  const batchSize = 50;

  console.log(`Fetching temperatures for ${AIRPORTS.length} airports...`);

  for (let i = 0; i < AIRPORTS.length; i += batchSize) {
    const batch = AIRPORTS.slice(i, i + batchSize);
    const lats = batch.map(a => a.lat).join(',');
    const lngs = batch.map(a => a.lng).join(',');

    // Add delay between batches
    if (i > 0) {
      await delay(500);
    }

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current_weather=true`
      );

      if (!response.ok) {
        console.error(`Batch ${i / batchSize + 1} failed: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        data.forEach((item, idx) => {
          if (item.current_weather?.temperature !== undefined) {
            temps[batch[idx].icao] = Math.round(item.current_weather.temperature);
          }
        });
      } else if (data.current_weather?.temperature !== undefined) {
        temps[batch[0].icao] = Math.round(data.current_weather.temperature);
      }

      console.log(`Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(AIRPORTS.length / batchSize)} complete`);
    } catch (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error.message);
    }
  }

  return temps;
}

function generateTempsCode(temps) {
  const lines = [
    '// Hardcoded temperatures - auto-updated every 6 hours by GitHub Actions',
    `// Last updated: ${new Date().toISOString()}`,
    'const HARDCODED_TEMPS: Record<string, number> = {',
  ];

  // Group by region for readability
  const regions = [
    { name: 'UTC+14 to UTC+12 - Pacific Islands & New Zealand', codes: ['NZAA', 'NZWN', 'NZCH', 'NZQN', 'NFFN', 'NFNA', 'UHPP', 'PLCH', 'NGTA', 'NGFU', 'NLWW', 'NSFA', 'NFTF'] },
    { name: 'UTC+11 - Solomon Islands, Vanuatu', codes: ['NVVV', 'AGGH', 'NWWW', 'UHMM', 'ANYN', 'PTKK', 'PTPN'] },
    { name: 'UTC+10 - Eastern Australia, Papua New Guinea, Micronesia', codes: ['YSSY', 'YMML', 'YBBN', 'YBCS', 'YBCG', 'AYPY', 'UHWW', 'PGUM', 'PGSN', 'PTRO', 'PWAK'] },
    { name: 'UTC+9:30 - Central Australia', codes: ['YPAD', 'YPDN'] },
    { name: 'UTC+9 - Japan, Korea', codes: ['RJTT', 'RJAA', 'RJBB', 'RKSI', 'RKSS', 'RKPK', 'RJCC', 'UEEE'] },
    { name: 'UTC+8 - China, Singapore, Philippines, Malaysia, Western Australia', codes: ['ZBAA', 'ZSPD', 'ZGGG', 'ZGSZ', 'VHHH', 'RCTP', 'WSSS', 'RPLL', 'WMKK', 'YPPH', 'ZMUB', 'UIII'] },
    { name: 'UTC+7 - Thailand, Vietnam, Indonesia', codes: ['VTBS', 'VVNB', 'VVTS', 'WIII', 'UNNT', 'UNKL'] },
    { name: 'UTC+6:30 - Myanmar', codes: ['VYYY'] },
    { name: 'UTC+6 - Bangladesh, Central Asia', codes: ['VGHS', 'UAAA', 'UACC', 'UTTT', 'UNOO'] },
    { name: 'UTC+5:45 - Nepal', codes: ['VNKT'] },
    { name: 'UTC+5:30 - India, Sri Lanka', codes: ['VIDP', 'VABB', 'VOBL', 'VECC', 'VOMM', 'VCBI'] },
    { name: 'UTC+5 - Pakistan', codes: ['OPKC', 'OPRN', 'OPLA', 'USSS'] },
    { name: 'UTC+4:30 - Afghanistan', codes: ['OAKB'] },
    { name: 'UTC+4 - UAE, Gulf, Caucasus, Indian Ocean', codes: ['OMDB', 'OMAA', 'OOMS', 'UBBB', 'UGGG', 'UDYZ', 'FIMP', 'FMEE', 'FSIA', 'VRMM', 'OOBR'] },
    { name: 'UTC+3:30 - Iran', codes: ['OIIE', 'OIMM'] },
    { name: 'UTC+3 - Moscow, East Africa, Middle East', codes: ['UUEE', 'UUDD', 'ULLI', 'LTFM', 'OERK', 'OEJN', 'ORBI', 'OTHH', 'OKBK', 'HKJK', 'HAAB', 'HTDA', 'FMMI'] },
    { name: 'UTC+2 - Eastern Europe, Southern Africa, Mediterranean Islands', codes: ['HECA', 'LGAV', 'LLBG', 'UKBB', 'LROP', 'EFHK', 'LBSF', 'FAOR', 'FACT', 'FVHA', 'LCLK', 'LCPH', 'LGIR', 'LGKR', 'LGSR', 'LGKO', 'LGRP', 'LMML'] },
    { name: 'UTC+1 - Central Europe, West Africa, Western Mediterranean Islands', codes: ['LFPG', 'EDDF', 'EDDM', 'LIRF', 'LEMD', 'LEBL', 'EHAM', 'EBBR', 'LOWW', 'EPWA', 'LKPR', 'LHBP', 'ESSA', 'EKCH', 'ENGM', 'LSZH', 'DNMM', 'DAAG', 'DTTA', 'LIEE', 'LIEO', 'LFKJ', 'LEIB', 'LEPA', 'LEMH', 'LICC', 'LICJ'] },
    { name: 'UTC+0 - UK, Portugal, West Africa, Canary Islands', codes: ['EGLL', 'EGKK', 'EIDW', 'LPPT', 'BIKF', 'DGAA', 'GOBD', 'GMMN', 'GCTS', 'GCXO', 'GCLP', 'GCLA', 'GCRR', 'GCFV', 'LPMA', 'EGJJ', 'EGJB', 'EGNS', 'EKVG'] },
    { name: 'UTC-1 - Cape Verde, Azores', codes: ['GVNP', 'GVSV', 'GVBA', 'LPAZ', 'LPHR', 'LPLA'] },
    { name: 'UTC-3 - Brazil, Argentina', codes: ['SBGR', 'SBGL', 'SBBR', 'SAEZ', 'SUMU', 'SCEL', 'SLLP', 'SGAS'] },
    { name: 'UTC-3:30 - Newfoundland', codes: ['CYYT'] },
    { name: 'UTC-4 - Atlantic Canada, Caribbean', codes: ['CYHZ', 'CYQM', 'CYFC', 'CYYG', 'CYQX', 'TJSJ', 'MDSD', 'SVMI', 'SBBV', 'TAPA', 'TBPB', 'TLPC', 'TGPY', 'TTPP', 'TNCC', 'TNCM', 'TFFR', 'TFFF', 'MYNN', 'MBPV', 'TIST', 'TKPK', 'TDPD', 'TVSV', 'TRPG', 'TQPF', 'MWCR', 'TXKF'] },
    { name: 'UTC-5 - Eastern US/Canada, Colombia, Peru', codes: ['KJFK', 'KLGA', 'KEWR', 'KORD', 'KATL', 'KMIA', 'KBOS', 'KDCA', 'KIAD', 'KPHL', 'KDTW', 'CYYZ', 'CYUL', 'CYOW', 'CYQB', 'CYQT', 'CYHM', 'CYFB', 'SKBO', 'SPJC', 'SEQM', 'MUHA', 'MKJP', 'MPTO'] },
    { name: 'UTC-6 - Central US, Mexico, Central America', codes: ['KDFW', 'KIAH', 'KAUS', 'KMSP', 'KSTL', 'KMSY', 'CYWG', 'CYQR', 'CYXE', 'MMMX', 'MMUN', 'MGGT', 'MHTG', 'MSSS', 'MNMG', 'MROC'] },
    { name: 'UTC-7 - Mountain US/Canada, Mexico', codes: ['KDEN', 'KPHX', 'KSLC', 'KABQ', 'KELP', 'KBOI', 'CYYC', 'CYEG', 'CYZF', 'CYXY', 'MMCU', 'MMHO'] },
    { name: 'UTC-8 - Pacific US/Canada', codes: ['KLAX', 'KSFO', 'KSEA', 'KSAN', 'KLAS', 'KPDX', 'CYVR', 'CYYJ', 'CYLW', 'MMTJ'] },
    { name: 'UTC-9 - Alaska', codes: ['PANC', 'PAFA', 'PAJN'] },
    { name: 'UTC-10 - Hawaii, Tahiti, Cook Islands', codes: ['PHNL', 'PHOG', 'PHKO', 'PHLI', 'NTAA', 'NTTB', 'NCAI'] },
    { name: 'UTC-11 - American Samoa, Niue', codes: ['NSTU', 'NIUE', 'PMDY'] },
    { name: 'Remote South Atlantic', codes: ['SFAL', 'FHAW', 'FHSH'] },
    { name: 'Remote South Pacific', codes: ['SCIP', 'NCRG'] },
    { name: 'French Southern Territories', codes: ['FMCZ', 'FMCH'] },
  ];

  for (const region of regions) {
    lines.push(`  // ${region.name}`);
    const entries = region.codes
      .filter(code => temps[code] !== undefined)
      .map(code => `"${code}": ${temps[code]}`);
    if (entries.length > 0) {
      lines.push(`  ${entries.join(', ')},`);
    }
    lines.push('');
  }

  lines.push('};');
  return lines.join('\n');
}

async function updateMetarService(temps) {
  const filePath = path.join(__dirname, '..', 'services', 'metarService.ts');
  let content = fs.readFileSync(filePath, 'utf-8');

  // Find and replace the HARDCODED_TEMPS section
  const startMarker = '// Hardcoded temperatures';
  const endMarker = '// Convert to Map for faster lookups';

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Could not find HARDCODED_TEMPS section in metarService.ts');
  }

  const newTempsCode = generateTempsCode(temps);
  content = content.substring(0, startIdx) + newTempsCode + '\n\n' + content.substring(endIdx);

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated metarService.ts with new temperatures');
}

async function main() {
  try {
    const temps = await fetchTemperatures();
    console.log(`Fetched ${Object.keys(temps).length} temperatures`);

    if (Object.keys(temps).length < 50) {
      throw new Error('Too few temperatures fetched, something went wrong');
    }

    await updateMetarService(temps);
    console.log('Done!');
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

main();
