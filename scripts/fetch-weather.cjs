// Fetch weather data from Open-Meteo and save to static JSON
// Run by GitHub Actions every 15 minutes

const fs = require('fs');
const path = require('path');

// Same airports as in metarService.ts (just icao, lat, lng)
const AIRPORTS = [
  {icao:"KATL",lat:33.64,lng:-84.43},{icao:"KLAX",lat:33.94,lng:-118.41},{icao:"KORD",lat:41.98,lng:-87.9},{icao:"KDFW",lat:32.9,lng:-97.04},{icao:"KDEN",lat:39.86,lng:-104.67},
  {icao:"KJFK",lat:40.64,lng:-73.78},{icao:"KSFO",lat:37.62,lng:-122.38},{icao:"KSEA",lat:47.45,lng:-122.31},{icao:"KLAS",lat:36.08,lng:-115.15},{icao:"KMCO",lat:28.43,lng:-81.31},
  {icao:"KEWR",lat:40.69,lng:-74.17},{icao:"KMIA",lat:25.8,lng:-80.29},{icao:"KPHX",lat:33.43,lng:-112.01},{icao:"KIAH",lat:29.98,lng:-95.34},{icao:"KBOS",lat:42.36,lng:-71.01},
  {icao:"KMSP",lat:44.88,lng:-93.22},{icao:"KFLL",lat:26.07,lng:-80.15},{icao:"KDTW",lat:42.21,lng:-83.35},{icao:"KPHL",lat:39.87,lng:-75.24},{icao:"KLGA",lat:40.78,lng:-73.87},
  {icao:"KBWI",lat:39.18,lng:-76.67},{icao:"KSLC",lat:40.79,lng:-111.98},{icao:"KDCA",lat:38.85,lng:-77.04},{icao:"KIAD",lat:38.94,lng:-77.46},{icao:"KSAN",lat:32.73,lng:-117.19},
  {icao:"KTPA",lat:27.98,lng:-82.53},{icao:"KPDX",lat:45.59,lng:-122.6},{icao:"KSTL",lat:38.75,lng:-90.37},{icao:"KHNL",lat:21.32,lng:-157.92},{icao:"KMEM",lat:35.04,lng:-89.98},
  {icao:"KAUS",lat:30.19,lng:-97.67},{icao:"KBNA",lat:36.12,lng:-86.68},{icao:"KRDU",lat:35.88,lng:-78.79},{icao:"KCLT",lat:35.21,lng:-80.94},{icao:"KSMF",lat:38.7,lng:-121.59},
  {icao:"KSJC",lat:37.36,lng:-121.93},{icao:"KOAK",lat:37.72,lng:-122.22},{icao:"KCLE",lat:41.41,lng:-81.85},{icao:"KMKE",lat:42.95,lng:-87.9},{icao:"KPIT",lat:40.5,lng:-80.23},
  {icao:"KIND",lat:39.72,lng:-86.29},{icao:"KCVG",lat:39.05,lng:-84.67},{icao:"KMCI",lat:39.3,lng:-94.71},{icao:"KSAT",lat:29.53,lng:-98.47},{icao:"KHOU",lat:29.65,lng:-95.28},
  {icao:"KDAL",lat:32.85,lng:-96.85},{icao:"KMDW",lat:41.79,lng:-87.75},{icao:"PANC",lat:61.17,lng:-150},{icao:"PAFA",lat:64.82,lng:-147.86},{icao:"CYYZ",lat:43.68,lng:-79.63},
  {icao:"CYVR",lat:49.19,lng:-123.18},{icao:"CYUL",lat:45.47,lng:-73.74},{icao:"CYYC",lat:51.11,lng:-114.02},{icao:"CYEG",lat:53.31,lng:-113.58},{icao:"CYOW",lat:45.32,lng:-75.67},
  {icao:"CYWG",lat:49.91,lng:-97.24},{icao:"CYHZ",lat:44.88,lng:-63.51},{icao:"CYQB",lat:46.79,lng:-71.39},{icao:"CYYJ",lat:48.65,lng:-123.43},{icao:"CYLW",lat:49.96,lng:-119.38},
  {icao:"CYXE",lat:52.17,lng:-106.7},{icao:"CYQR",lat:50.43,lng:-104.67},{icao:"CYZF",lat:62.46,lng:-114.44},{icao:"CYXY",lat:60.71,lng:-135.07},{icao:"CYQT",lat:48.37,lng:-89.32},
  {icao:"CYYT",lat:47.62,lng:-52.75},{icao:"MMMX",lat:19.44,lng:-99.07},{icao:"MMUN",lat:21.04,lng:-86.87},{icao:"MMGL",lat:20.52,lng:-103.31},{icao:"MMMY",lat:25.78,lng:-100.11},
  {icao:"MMTJ",lat:32.54,lng:-116.97},{icao:"MMSM",lat:19.07,lng:-104.56},{icao:"MMMD",lat:20.94,lng:-89.66},{icao:"MMCZ",lat:20.52,lng:-86.93},{icao:"MMSD",lat:23.15,lng:-109.72},
  {icao:"MGGT",lat:14.58,lng:-90.53},{icao:"MSLP",lat:13.44,lng:-89.06},{icao:"MHTG",lat:14.06,lng:-87.22},{icao:"MNMG",lat:12.14,lng:-86.17},{icao:"MROC",lat:9.99,lng:-84.21},
  {icao:"MPTO",lat:9.07,lng:-79.38},{icao:"MKJP",lat:17.94,lng:-76.79},{icao:"TNCM",lat:18.04,lng:-63.11},{icao:"TBPB",lat:13.07,lng:-59.49},{icao:"TTPP",lat:10.6,lng:-61.34},
  {icao:"MWCR",lat:19.29,lng:-81.36},{icao:"MUHA",lat:22.99,lng:-82.41},{icao:"MDSD",lat:18.43,lng:-69.67},{icao:"MDPP",lat:19.76,lng:-70.57},{icao:"MTPP",lat:18.58,lng:-72.29},
  {icao:"TJSJ",lat:18.44,lng:-66},{icao:"TIST",lat:18.34,lng:-64.97},{icao:"TLPL",lat:14.02,lng:-60.99},{icao:"TAPA",lat:17.14,lng:-61.79},{icao:"SBGR",lat:-23.43,lng:-46.47},
  {icao:"SBGL",lat:-22.81,lng:-43.25},{icao:"SBBR",lat:-15.87,lng:-47.92},{icao:"SBCF",lat:-19.63,lng:-43.97},{icao:"SBSV",lat:-12.91,lng:-38.33},{icao:"SBRF",lat:-8.13,lng:-34.92},
  {icao:"SBPA",lat:-29.99,lng:-51.17},{icao:"SBCT",lat:-25.53,lng:-49.17},{icao:"SBFZ",lat:-3.78,lng:-38.53},{icao:"SCEL",lat:-33.39,lng:-70.79},{icao:"SAEZ",lat:-34.82,lng:-58.54},
  {icao:"SABE",lat:-34.56,lng:-58.42},{icao:"SACO",lat:-31.32,lng:-64.21},{icao:"SAME",lat:-32.83,lng:-68.79},{icao:"SLLP",lat:-16.51,lng:-68.19},{icao:"SLVR",lat:-17.64,lng:-63.14},
  {icao:"SPJC",lat:-12.02,lng:-77.11},{icao:"SEQM",lat:-0.13,lng:-78.36},{icao:"SEGU",lat:-2.16,lng:-79.88},{icao:"SKBO",lat:4.7,lng:-74.15},{icao:"SKMR",lat:7.93,lng:-72.51},
  {icao:"SKCL",lat:3.54,lng:-76.38},{icao:"SKMD",lat:6.22,lng:-75.59},{icao:"SKRG",lat:6.16,lng:-75.42},{icao:"SVMI",lat:10.6,lng:-66.99},{icao:"SUMU",lat:-34.84,lng:-56.03},
  {icao:"SGAS",lat:-25.24,lng:-57.52},{icao:"SBBV",lat:2.85,lng:-60.69},{icao:"SMJP",lat:5.45,lng:-55.19},{icao:"SYCJ",lat:6.5,lng:-58.25},{icao:"EGLL",lat:51.47,lng:-0.46},
  {icao:"EGKK",lat:51.15,lng:-0.19},{icao:"EGSS",lat:51.89,lng:0.24},{icao:"EGLC",lat:51.51,lng:0.05},{icao:"EGCC",lat:53.35,lng:-2.27},{icao:"EGBB",lat:52.45,lng:-1.75},
  {icao:"EGPH",lat:55.95,lng:-3.36},{icao:"EGPF",lat:55.87,lng:-4.43},{icao:"EGGW",lat:51.87,lng:-0.37},{icao:"EGNX",lat:52.83,lng:-1.33},{icao:"EGNT",lat:55.04,lng:-1.69},
  {icao:"EGGP",lat:53.33,lng:-2.85},{icao:"EGHI",lat:50.95,lng:-1.36},{icao:"EGGD",lat:51.38,lng:-2.72},{icao:"EGPD",lat:57.2,lng:-2.2},{icao:"EGAA",lat:54.66,lng:-6.22},
  {icao:"EIDW",lat:53.42,lng:-6.27},{icao:"EICK",lat:51.84,lng:-8.49},{icao:"EINN",lat:52.7,lng:-8.92},{icao:"LFPG",lat:49.01,lng:2.55},{icao:"LFPO",lat:48.72,lng:2.36},
  {icao:"LFML",lat:43.44,lng:5.22},{icao:"LFLL",lat:45.73,lng:5.09},{icao:"LFMN",lat:43.66,lng:7.22},{icao:"LFBD",lat:44.83,lng:-0.72},{icao:"LFBO",lat:43.63,lng:1.37},
  {icao:"LFRS",lat:47.15,lng:-1.61},{icao:"LFSB",lat:47.59,lng:7.53},{icao:"LFPB",lat:48.97,lng:2.44},{icao:"EDDF",lat:50.03,lng:8.57},{icao:"EDDM",lat:48.35,lng:11.79},
  {icao:"EDDB",lat:52.38,lng:13.52},{icao:"EDDL",lat:51.29,lng:6.77},{icao:"EDDH",lat:53.63,lng:10.01},{icao:"EDDK",lat:50.87,lng:7.14},{icao:"EDDS",lat:48.69,lng:9.22},
  {icao:"EDDW",lat:53.05,lng:8.79},{icao:"EDDN",lat:49.5,lng:11.08},{icao:"EDDV",lat:52.46,lng:9.69},{icao:"EDDP",lat:51.42,lng:12.24},{icao:"LEMD",lat:40.47,lng:-3.56},
  {icao:"LEBL",lat:41.3,lng:2.08},{icao:"LEPA",lat:39.55,lng:2.74},{icao:"LEMG",lat:36.68,lng:-4.5},{icao:"LEVC",lat:39.49,lng:-0.48},{icao:"LEAL",lat:38.29,lng:-0.56},
  {icao:"LEZL",lat:37.42,lng:-5.89},{icao:"GCLP",lat:27.93,lng:-15.39},{icao:"GCTS",lat:28.04,lng:-16.57},{icao:"GCLA",lat:28.61,lng:-17.76},{icao:"GCFV",lat:28.45,lng:-13.86},
  {icao:"LPPT",lat:38.77,lng:-9.13},{icao:"LPPR",lat:41.24,lng:-8.68},{icao:"LPFR",lat:37.01,lng:-7.97},{icao:"LPMA",lat:32.7,lng:-16.78},{icao:"LIRF",lat:41.8,lng:12.25},
  {icao:"LIMC",lat:45.63,lng:8.72},{icao:"LIME",lat:45.67,lng:9.7},{icao:"LIPZ",lat:45.51,lng:12.35},{icao:"LIRN",lat:40.89,lng:14.29},{icao:"LIML",lat:45.45,lng:9.28},
  {icao:"LIPE",lat:44.53,lng:11.29},{icao:"LICC",lat:37.47,lng:15.07},{icao:"LICJ",lat:38.18,lng:13.1},{icao:"LIRA",lat:41.8,lng:12.59},{icao:"LIRP",lat:43.68,lng:10.39},
  {icao:"LIMF",lat:45.2,lng:7.65},{icao:"LIEO",lat:40.9,lng:9.52},{icao:"LIEE",lat:39.25,lng:9.05},{icao:"EHAM",lat:52.31,lng:4.76},{icao:"EHRD",lat:51.96,lng:4.44},
  {icao:"EHEH",lat:51.45,lng:5.37},{icao:"EBBR",lat:50.9,lng:4.48},{icao:"EBCI",lat:50.46,lng:4.45},{icao:"ELLX",lat:49.63,lng:6.22},{icao:"LSZH",lat:47.46,lng:8.55},
  {icao:"LSGG",lat:46.24,lng:6.11},{icao:"LSZB",lat:46.91,lng:7.5},{icao:"LOWW",lat:48.11,lng:16.57},{icao:"LOWS",lat:47.79,lng:13},{icao:"LOWG",lat:46.99,lng:15.44},
  {icao:"LOWI",lat:47.26,lng:11.34},{icao:"LKPR",lat:50.1,lng:14.26},{icao:"EPWA",lat:52.17,lng:20.97},{icao:"EPKK",lat:50.08,lng:19.79},{icao:"EPGD",lat:54.38,lng:18.47},
  {icao:"EPWR",lat:51.1,lng:16.89},{icao:"EPPO",lat:52.42,lng:16.83},{icao:"EKCH",lat:55.62,lng:12.66},{icao:"ESSA",lat:59.65,lng:17.94},{icao:"ENGM",lat:60.19,lng:11.1},
  {icao:"EFHK",lat:60.32,lng:24.96},{icao:"BIKF",lat:63.99,lng:-22.62},{icao:"ESGG",lat:57.67,lng:12.29},{icao:"ESMS",lat:55.54,lng:13.36},{icao:"ENBR",lat:60.29,lng:5.22},
  {icao:"ENZV",lat:58.88,lng:5.63},{icao:"ENTC",lat:69.68,lng:18.92},{icao:"EFOU",lat:64.93,lng:25.35},{icao:"EFRO",lat:66.56,lng:25.83},{icao:"LGAV",lat:37.94,lng:23.94},
  {icao:"LGTS",lat:40.52,lng:22.97},{icao:"LGIR",lat:35.34,lng:25.18},{icao:"LGKR",lat:39.6,lng:19.91},{icao:"LGRP",lat:36.41,lng:28.09},{icao:"LGSR",lat:36.4,lng:25.48},
  {icao:"LGMK",lat:37.44,lng:25.35},{icao:"LTFM",lat:41.26,lng:28.74},{icao:"LTBA",lat:40.98,lng:28.82},{icao:"LTFJ",lat:40.9,lng:29.31},{icao:"LTAI",lat:36.9,lng:30.8},
  {icao:"LTAC",lat:40.13,lng:32.99},{icao:"LTBJ",lat:38.29,lng:27.16},{icao:"LTBS",lat:36.71,lng:28.79},{icao:"LTFE",lat:37.04,lng:27.43},{icao:"LCLK",lat:34.88,lng:33.63},
  {icao:"LCPH",lat:34.72,lng:32.49},{icao:"LHBP",lat:47.44,lng:19.26},{icao:"LROP",lat:44.57,lng:26.09},{icao:"LBSF",lat:42.7,lng:23.41},{icao:"LYBE",lat:44.82,lng:20.31},
  {icao:"LDZA",lat:45.74,lng:16.07},{icao:"LDDU",lat:42.56,lng:18.27},{icao:"LDSP",lat:43.54,lng:16.3},{icao:"LJLJ",lat:46.22,lng:14.46},{icao:"LWSK",lat:41.96,lng:21.62},
  {icao:"LATI",lat:41.41,lng:19.72},{icao:"UKBB",lat:50.35,lng:30.89},{icao:"UKLL",lat:49.81,lng:23.96},{icao:"UUEE",lat:55.97,lng:37.41},{icao:"UUDD",lat:55.41,lng:37.91},
  {icao:"UUWW",lat:55.6,lng:37.27},{icao:"ULLI",lat:59.8,lng:30.26},{icao:"UWWW",lat:53.5,lng:50.16},{icao:"USSS",lat:56.74,lng:60.8},{icao:"UNNT",lat:55.01,lng:82.65},
  {icao:"UUOB",lat:51.82,lng:107.44},{icao:"UHWW",lat:43.4,lng:132.15},{icao:"UEEE",lat:62.09,lng:129.77},{icao:"OMDB",lat:25.25,lng:55.36},
  {icao:"OMDW",lat:24.9,lng:55.17},{icao:"OMAA",lat:24.43,lng:54.65},{icao:"OMSJ",lat:25.33,lng:55.52},{icao:"OTHH",lat:25.26,lng:51.61},{icao:"OERK",lat:24.96,lng:46.7},
  {icao:"OEJN",lat:21.68,lng:39.16},{icao:"OEDF",lat:26.47,lng:49.8},{icao:"OEMA",lat:24.55,lng:39.71},{icao:"OKBK",lat:29.23,lng:47.97},{icao:"OBBI",lat:26.27,lng:50.64},
  {icao:"OOMS",lat:23.59,lng:58.28},{icao:"OYAA",lat:15.48,lng:44.22},{icao:"OIIE",lat:35.42,lng:51.15},{icao:"OIII",lat:35.69,lng:51.31},{icao:"OISS",lat:29.54,lng:52.59},
  {icao:"OIKB",lat:27.22,lng:56.38},{icao:"OIAW",lat:31.34,lng:48.76},{icao:"OIKK",lat:30.27,lng:56.96},{icao:"OICC",lat:34.35,lng:47.16},{icao:"LLBG",lat:32.01,lng:34.89},
  {icao:"OLBA",lat:33.82,lng:35.49},{icao:"OJAM",lat:31.72,lng:35.99},{icao:"ORBI",lat:33.26,lng:44.24},{icao:"ORER",lat:36.24,lng:43.13},{icao:"GMMN",lat:33.37,lng:-7.59},
  {icao:"GMME",lat:33.93,lng:-6.75},{icao:"GMMX",lat:31.61,lng:-8.04},{icao:"GMTT",lat:35.73,lng:-5.92},{icao:"GMFF",lat:33.93,lng:-4.98},{icao:"GMAD",lat:30.33,lng:-9.41},
  {icao:"DAAG",lat:36.69,lng:3.22},{icao:"DAOO",lat:35.62,lng:-0.62},{icao:"DTTA",lat:36.85,lng:10.23},{icao:"DTMB",lat:35.76,lng:10.75},{icao:"DTTJ",lat:33.88,lng:10.78},
  {icao:"HECA",lat:30.12,lng:31.41},{icao:"HEGN",lat:27.18,lng:33.8},{icao:"HESH",lat:27.98,lng:34.39},{icao:"HEBA",lat:25.92,lng:32.82},{icao:"HEAX",lat:31.18,lng:29.95},
  {icao:"HLLT",lat:32.89,lng:13.28},{icao:"DNMM",lat:6.58,lng:3.32},{icao:"DNAA",lat:9.01,lng:7.26},{icao:"DGAA",lat:5.61,lng:-0.17},{icao:"DIAP",lat:5.26,lng:-3.93},
  {icao:"GOBD",lat:14.67,lng:-17.07},{icao:"GABS",lat:13.34,lng:-16.65},{icao:"GVNP",lat:14.95,lng:-23.49},{icao:"GBYD",lat:8.49,lng:-13.2},{icao:"GLRB",lat:6.23,lng:-10.36},
  {icao:"DXXX",lat:6.17,lng:1.25},{icao:"DBBB",lat:6.36,lng:2.38},{icao:"HKJK",lat:-1.32,lng:36.93},{icao:"HKMO",lat:-4.03,lng:39.59},{icao:"HTDA",lat:-6.88,lng:39.2},
  {icao:"HTKJ",lat:-3.43,lng:37.07},{icao:"HUEN",lat:0.04,lng:32.44},{icao:"HRYR",lat:-1.97,lng:30.14},{icao:"HAAB",lat:8.98,lng:38.8},{icao:"HDAM",lat:11.55,lng:43.16},
  {icao:"HCMM",lat:2.01,lng:45.31},{icao:"OYSN",lat:12.63,lng:53.91},{icao:"FMEE",lat:-20.89,lng:55.52},{icao:"FIMP",lat:-20.43,lng:57.68},{icao:"FMCH",lat:-11.53,lng:43.27},
  {icao:"FMMI",lat:-18.8,lng:47.48},{icao:"FSIA",lat:-4.67,lng:55.52},{icao:"FKKD",lat:4.01,lng:9.72},{icao:"FKYS",lat:3.72,lng:11.55},{icao:"FOOL",lat:-0.46,lng:9.41},
  {icao:"FZAA",lat:-4.39,lng:15.44},{icao:"FCBB",lat:-4.25,lng:15.25},{icao:"FLLK",lat:-14.46,lng:28.45},{icao:"FVHA",lat:-17.93,lng:31.09},{icao:"FLLS",lat:-15.33,lng:28.45},
  {icao:"FYWH",lat:-22.48,lng:17.47},{icao:"FBSK",lat:-24.56,lng:25.92},{icao:"FAOR",lat:-26.13,lng:28.23},{icao:"FACT",lat:-33.97,lng:18.6},{icao:"FALE",lat:-29.61,lng:31.12},
  {icao:"FAPE",lat:-33.98,lng:25.62},{icao:"FQMA",lat:-25.92,lng:32.57},{icao:"FWKI",lat:-13.79,lng:33.78},{icao:"ZBAA",lat:40.08,lng:116.58},{icao:"ZBAD",lat:39.51,lng:116.41},
  {icao:"ZSPD",lat:31.14,lng:121.81},{icao:"ZSSS",lat:31.2,lng:121.34},{icao:"ZGGG",lat:23.39,lng:113.3},{icao:"VHHH",lat:22.31,lng:113.91},{icao:"ZGSZ",lat:22.64,lng:113.81},
  {icao:"ZUUU",lat:30.58,lng:103.95},{icao:"ZUCK",lat:29.72,lng:106.64},{icao:"ZHCC",lat:34.52,lng:113.84},{icao:"ZLXY",lat:34.45,lng:108.75},{icao:"ZWSH",lat:43.91,lng:87.47},
  {icao:"ZYHB",lat:45.62,lng:126.25},{icao:"ZYTX",lat:41.64,lng:123.48},{icao:"ZSAM",lat:24.54,lng:118.13},{icao:"ZGKL",lat:25.22,lng:110.04},{icao:"ZSNJ",lat:31.74,lng:118.86},
  {icao:"ZSHC",lat:30.23,lng:120.43},{icao:"ZPPP",lat:25.1,lng:102.93},{icao:"ZBTJ",lat:39.12,lng:117.35},{icao:"VMMC",lat:22.15,lng:113.59},{icao:"RJTT",lat:35.55,lng:139.78},
  {icao:"RJAA",lat:35.76,lng:140.39},{icao:"RJBB",lat:34.43,lng:135.24},{icao:"RJOO",lat:34.79,lng:135.44},{icao:"RJCC",lat:42.77,lng:141.69},{icao:"RJFF",lat:33.58,lng:130.45},
  {icao:"RJGG",lat:34.86,lng:136.8},{icao:"ROAH",lat:26.2,lng:127.65},{icao:"RJSS",lat:38.14,lng:140.92},{icao:"RJSN",lat:37.94,lng:139.1},{icao:"RJOK",lat:33.55,lng:133.67},
  {icao:"RKSI",lat:37.46,lng:126.44},{icao:"RKSS",lat:37.56,lng:126.79},{icao:"RKPK",lat:35.18,lng:128.94},{icao:"RKPC",lat:33.51,lng:126.49},{icao:"RKTN",lat:35.9,lng:128.66},
  {icao:"ZKPY",lat:39.22,lng:125.67},{icao:"WSSS",lat:1.35,lng:103.99},{icao:"WMKK",lat:2.75,lng:101.71},{icao:"WMKP",lat:5.3,lng:100.26},{icao:"WBKK",lat:5.93,lng:116.05},
  {icao:"WBGG",lat:1.49,lng:110.35},{icao:"VTBS",lat:13.69,lng:100.75},{icao:"VTBD",lat:13.91,lng:100.61},{icao:"VTSP",lat:8.11,lng:98.32},{icao:"VTCC",lat:18.77,lng:98.96},
  {icao:"VTSS",lat:7.23,lng:100.51},{icao:"VTUK",lat:12.68,lng:101.01},{icao:"VVNB",lat:21.22,lng:105.81},{icao:"VVTS",lat:10.82,lng:106.65},{icao:"VVDN",lat:16.04,lng:108.2},
  {icao:"VVCR",lat:12.23,lng:109.19},{icao:"VDPP",lat:11.55,lng:104.84},{icao:"VDSR",lat:13.41,lng:103.81},{icao:"VLVT",lat:17.99,lng:102.56},{icao:"VLLB",lat:19.9,lng:102.16},
  {icao:"VYYY",lat:16.91,lng:96.13},{icao:"VYMD",lat:21.7,lng:95.98},{icao:"VGHS",lat:23.84,lng:90.4},{icao:"VGCG",lat:22.25,lng:91.81},{icao:"VECC",lat:22.65,lng:88.45},
  {icao:"VRMM",lat:4.19,lng:73.53},{icao:"VCBI",lat:7.18,lng:79.88},{icao:"WIII",lat:-6.13,lng:106.66},{icao:"WADD",lat:-8.75,lng:115.17},{icao:"WARR",lat:-7.38,lng:112.79},
  {icao:"WIHH",lat:-5.87,lng:106.14},{icao:"WIMM",lat:3.56,lng:98.67},{icao:"WIBB",lat:0.15,lng:104.11},{icao:"WAFF",lat:-5.06,lng:119.55},{icao:"WICC",lat:-6.9,lng:107.58},
  {icao:"WASS",lat:-2.54,lng:140.72},{icao:"RPLL",lat:14.51,lng:121.02},{icao:"RPLC",lat:15.19,lng:120.56},{icao:"RPVM",lat:10.31,lng:123.98},{icao:"RPVD",lat:7.13,lng:125.65},
  {icao:"RPVK",lat:11.68,lng:122.38},{icao:"WBSB",lat:4.94,lng:114.93},{icao:"WBLL",lat:5.27,lng:115.05},{icao:"VIDP",lat:28.57,lng:77.09},{icao:"VABB",lat:19.09,lng:72.87},
  {icao:"VOBL",lat:13.2,lng:77.71},{icao:"VOMM",lat:12.99,lng:80.18},{icao:"VEBS",lat:22.65,lng:88.45},{icao:"VOHY",lat:17.23,lng:78.43},{icao:"VAAH",lat:23.07,lng:72.63},
  {icao:"VOCI",lat:9.94,lng:76.27},{icao:"VAGO",lat:15.38,lng:73.83},{icao:"VOTP",lat:10.49,lng:76.92},{icao:"VIAR",lat:31.71,lng:74.8},{icao:"VIJP",lat:26.82,lng:75.81},
  {icao:"VELR",lat:27.3,lng:88.59},{icao:"VOCL",lat:11.14,lng:75.95},{icao:"VOTV",lat:8.48,lng:76.92},{icao:"VEPT",lat:25.59,lng:85.09},{icao:"VNKT",lat:27.7,lng:85.36},
  {icao:"OPKC",lat:24.91,lng:67.16},{icao:"OPLA",lat:31.52,lng:74.4},{icao:"OPIS",lat:33.62,lng:73.1},{icao:"RCTP",lat:25.08,lng:121.23},{icao:"RCSS",lat:25.07,lng:121.55},
  {icao:"RCMQ",lat:24.26,lng:120.62},{icao:"RCKH",lat:22.58,lng:120.35},{icao:"RCNN",lat:22.95,lng:120.21},{icao:"YSSY",lat:-33.95,lng:151.18},{icao:"YMML",lat:-37.67,lng:144.84},
  {icao:"YBBN",lat:-27.38,lng:153.12},{icao:"YPPH",lat:-31.94,lng:115.97},{icao:"YPAD",lat:-34.94,lng:138.53},{icao:"YBCG",lat:-28.16,lng:153.5},{icao:"YBCS",lat:-16.89,lng:145.75},
  {icao:"YSCB",lat:-35.31,lng:149.19},{icao:"YMHB",lat:-42.84,lng:147.51},{icao:"NZAA",lat:-37.01,lng:174.79},{icao:"NZWN",lat:-41.33,lng:174.81},{icao:"NZCH",lat:-43.49,lng:172.53},
  {icao:"NZQN",lat:-45.02,lng:168.74},{icao:"NZDN",lat:-45.93,lng:170.2},{icao:"NFFN",lat:-17.76,lng:177.44},{icao:"NWWW",lat:-22.01,lng:166.21},{icao:"NTAA",lat:-17.55,lng:-149.61},
  {icao:"NSFA",lat:-13.85,lng:-171.99},{icao:"NIUE",lat:-19.08,lng:-169.93},{icao:"PGSN",lat:15.12,lng:145.73},{icao:"PGUM",lat:13.48,lng:144.8},{icao:"PHOG",lat:20.9,lng:-156.43},
  {icao:"PHKO",lat:19.74,lng:-156.05},{icao:"PHLH",lat:21.98,lng:-159.34},
];

// WMO Weather Codes to condition types
function parseWeatherCode(code) {
  if (code >= 95) return 'thunderstorm';
  if (code >= 73 && code <= 77) return 'snow';
  if (code >= 85 && code <= 86) return 'snow';
  if ((code >= 56 && code <= 57) || (code >= 66 && code <= 67)) return 'freezing';
  if (code === 63 || code === 65) return 'rain';
  if (code === 81 || code === 82) return 'rain';
  if (code >= 45 && code <= 48) return 'fog';
  return null;
}

async function fetchWeather() {
  console.log(`Fetching weather for ${AIRPORTS.length} airports...`);
  const airports = {};

  // Fetch in batches of 100
  for (let i = 0; i < AIRPORTS.length; i += 100) {
    const batch = AIRPORTS.slice(i, i + 100);
    const lats = batch.map(a => a.lat).join(',');
    const lngs = batch.map(a => a.lng).join(',');

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current_weather=true`
      );

      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : [data];

        results.forEach((d, idx) => {
          if (d?.current_weather && batch[idx]) {
            const weatherCode = d.current_weather.weathercode ?? 0;
            airports[batch[idx].icao] = {
              temp: Math.round(d.current_weather.temperature),
              condition: parseWeatherCode(weatherCode),
            };
          }
        });

        console.log(`Batch ${i}-${i + batch.length}: ${results.length} results`);
      } else {
        console.error(`Batch ${i} failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`Batch ${i} error:`, error.message);
    }

    // Delay between batches
    if (i + 100 < AIRPORTS.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const weatherData = {
    airports,
    updatedAt: new Date().toISOString(),
  };

  // Ensure public directory exists
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write to public/weather-data.json
  const outputPath = path.join(publicDir, 'weather-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(weatherData));
  console.log(`Wrote ${Object.keys(airports).length} airports to ${outputPath}`);

  // Also update the hardcoded fallback in metarService.ts
  updateFallbackData(airports);
}

function updateFallbackData(airports) {
  const servicePath = path.join(__dirname, '..', 'services', 'metarService.ts');

  if (!fs.existsSync(servicePath)) {
    console.log('metarService.ts not found, skipping fallback update');
    return;
  }

  let content = fs.readFileSync(servicePath, 'utf8');

  // Generate the new hardcoded data
  const entries = Object.entries(airports).map(([icao, w]) => {
    const conditions = w.condition ? [`"${w.condition}"`] : [];
    return `"${icao}":{temp:${w.temp},conditions:[${conditions.join(',')}],intensity:null}`;
  });

  // Split into lines of ~10 entries for readability
  const lines = [];
  for (let i = 0; i < entries.length; i += 10) {
    lines.push('  ' + entries.slice(i, i + 10).join(','));
  }
  const newData = lines.join(',\n');

  // Find and replace the HARDCODED_WEATHER block
  const startMarker = 'const HARDCODED_WEATHER: Record<string, AirportWeather> = {';
  const endMarker = '};';

  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    console.log('Could not find HARDCODED_WEATHER in metarService.ts');
    return;
  }

  // Find the closing brace for this object (the one followed by newline and FALLBACK_WEATHER)
  const afterStart = content.indexOf('\n', startIdx);
  const fallbackIdx = content.indexOf('const FALLBACK_WEATHER', startIdx);
  if (fallbackIdx === -1) {
    console.log('Could not find FALLBACK_WEATHER marker');
    return;
  }

  // Find the }; just before FALLBACK_WEATHER
  const endIdx = content.lastIndexOf('};', fallbackIdx);
  if (endIdx === -1 || endIdx < startIdx) {
    console.log('Could not find end of HARDCODED_WEATHER');
    return;
  }

  // Replace the content
  const newContent =
    content.substring(0, afterStart + 1) +
    newData + '\n' +
    content.substring(endIdx);

  fs.writeFileSync(servicePath, newContent);
  console.log(`Updated HARDCODED_WEATHER in metarService.ts with ${Object.keys(airports).length} airports`);
}

fetchWeather().catch(console.error);
