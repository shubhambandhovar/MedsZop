import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "nav": {
                "medicines": "Medicines",
                "scan_prescription": "Scan Prescription",
                "ai_doctor": "AI Doctor",
                "dashboard": "Dashboard",
                "my_orders": "My Orders",
                "log_out": "Log Out",
                "log_in": "Log In",
                "get_started": "Get Started",
                "cart": "Cart",
                "profile": "Profile"
            },
            "common": {
                "welcome": "Welcome to MedsZop",
                "search_medicines": "Search for medicines...",
                "language": "Language"
            },
            "landing": {
                "hero": {
                    "badge": "Smart HealthTech Platform",
                    "title": "Your Health, <1>Delivered</1><2/>Smarter",
                    "subtitle": "India's most intelligent medicine ordering platform. AI-powered prescription scanning, trusted pharmacies, and lightning-fast delivery.",
                    "explore_btn": "Explore Medicines",
                    "scan_btn": "Scan Prescription",
                    "trusted_by": "Trusted by 50,000+ users",
                    "delivered_card": "Order Delivered",
                    "in_min": "In 28 minutes",
                    "ai_card": "AI Analysis",
                    "scanned_status": "Prescription scanned"
                },
                "stats": {
                    "customers": "Happy Customers",
                    "medicines": "Medicines",
                    "pharmacies": "Partner Pharmacies",
                    "delivery": "Avg. Delivery"
                },
                "features": {
                    "badge": "Features",
                    "title": "Why Choose MedsZop?",
                    "subtitle": "We combine cutting-edge technology with healthcare expertise to deliver the best experience",
                    "scanner_title": "AI Prescription Scanner",
                    "scanner_desc": "Upload your prescription and let our AI extract medicines automatically",
                    "chat_title": "AI Doctor Chat",
                    "chat_desc": "Get instant health guidance from our AI-powered assistant",
                    "delivery_title": "Same-Hour Delivery",
                    "delivery_desc": "Priority delivery for emergency medicines within 60 minutes",
                    "genuine_title": "100% Genuine",
                    "genuine_desc": "All medicines sourced from verified pharmacies only"
                },
                "ai": {
                    "badge": "AI-Powered",
                    "title": "Healthcare Meets <1>Artificial Intelligence</1>",
                    "description": "Our AI tools make healthcare more accessible. Scan prescriptions instantly, chat with our AI doctor for guidance, and get personalized medicine recommendations.",
                    "list": {
                        "extraction": "Instant prescription text extraction",
                        "recognition": "Medicine name recognition & matching",
                        "guidance": "Symptom-based health guidance",
                        "warnings": "Drug interaction warnings"
                    },
                    "scanner_btn": "Try AI Scanner",
                    "chat_btn": "Chat with AI Doctor"
                },
                "testimonials": {
                    "badge": "Testimonials",
                    "title": "Loved by Thousands",
                    "subtitle": "See what our customers and partners have to say about MedsZop",
                    "content_1": "MedsZop has been a lifesaver! The AI prescription scanner saved me so much time.",
                    "role_1": "Regular Customer",
                    "content_2": "Finally, a platform that understands healthcare needs. Highly recommended!",
                    "role_2": "Healthcare Professional",
                    "content_3": "As a pharmacy partner, the dashboard is intuitive and order management is seamless.",
                    "role_3": "Pharmacy Owner"
                },
                "cta": {
                    "title": "Start Your Health Journey Today",
                    "subtitle": "Join thousands of happy customers who trust MedsZop for their healthcare needs",
                    "get_started": "Get Started Free",
                    "browse": "Browse Medicines"
                }
            }
        }
    },
    hi: {
        translation: {
            "nav": {
                "medicines": "दवाइयाँ",
                "scan_prescription": "पर्ची स्कैन करें",
                "ai_doctor": "AI डॉक्टर",
                "dashboard": "डैशबोर्ड",
                "my_orders": "मेरे ऑर्डर",
                "log_out": "लॉग आउट",
                "log_in": "लॉग इन",
                "get_started": "शुरू करें",
                "cart": "कार्ट",
                "profile": "प्रोफ़ाइल"
            },
            "common": {
                "welcome": "MedsZop में आपका स्वागत है",
                "search_medicines": "दवाइयाँ खोजें...",
                "language": "भाषा"
            },
            "landing": {
                "hero": {
                    "badge": "स्मार्ट हेल्थटेक प्लेटफॉर्म",
                    "title": "आपका स्वास्थ्य, <1>सुरक्षित पहुँचाया</1><2/>बेहतर सुझाव",
                    "subtitle": "भारत का सबसे बुद्धिमान दवा ऑर्डरिंग प्लेटफॉर्म। एआई-संचालित पर्ची स्कैनिंग, विश्वसनीय फार्मेसियों और बिजली की तेजी से डिलीवरी।",
                    "explore_btn": "दवाइयाँ देखें",
                    "scan_btn": "पर्ची स्कैन करें",
                    "trusted_by": "50,000+ उपयोगकर्ताओं द्वारा विश्वसनीय",
                    "delivered_card": "ऑर्डर डिलीवर किया गया",
                    "in_min": "28 मिनट में",
                    "ai_card": "AI विश्लेषण",
                    "scanned_status": "पर्ची स्कैन की गई"
                },
                "stats": {
                    "customers": "खुश ग्राहक",
                    "medicines": "दवाइयाँ",
                    "pharmacies": "पार्टनर फार्मेसी",
                    "delivery": "औसत डिलीवरी समय"
                },
                "features": {
                    "badge": "सुविधाएँ",
                    "title": "MedsZop क्यों चुनें?",
                    "subtitle": "हम आपको सबसे अच्छा अनुभव देने के लिए स्वास्थ्य विशेषज्ञता के साथ अत्याधुनिक तकनीक जोड़ते हैं",
                    "scanner_title": "AI पर्ची स्कैनर",
                    "scanner_desc": "अपनी पर्ची अपलोड करें और हमारे AI को स्वचालित रूप से दवाइयाँ निकालने दें",
                    "chat_title": "AI डॉक्टर चैट",
                    "chat_desc": "हमारे AI-संचालित सहायक से तत्काल स्वास्थ्य मार्गदर्शन प्राप्त करें",
                    "delivery_title": "एक घंटे में डिलीवरी",
                    "delivery_desc": "60 मिनट के भीतर आपातकालीन दवाओं के लिए प्राथमिकता डिलीवरी",
                    "genuine_title": "100% असली",
                    "genuine_desc": "सभी दवाइयाँ केवल सत्यापित फार्मेसियों से प्राप्त की जाती हैं"
                },
                "ai": {
                    "badge": "AI-संचालित",
                    "title": "स्वास्थ्य सेवा और <1>आर्टिफिशियल इंटेलिजेंस</1>",
                    "description": "हमारे AI उपकरण स्वास्थ्य सेवा को अधिक सुलभ बनाते हैं। पर्ची तुरंत स्कैन करें, मार्गदर्शन के लिए हमारे AI डॉक्टर से चैट करें, और व्यक्तिगत दवा सुझाव प्राप्त करें।",
                    "list": {
                        "extraction": "तत्काल पर्ची पाठ निष्कर्षण",
                        "recognition": "दवा का नाम पहचान और मिलान",
                        "guidance": "लक्षण-आधारित स्वास्थ्य मार्गदर्शन",
                        "warnings": "दवाओं के पारस्परिक प्रभाव की चेतावनी"
                    },
                    "scanner_btn": "AI स्कैनर आज़माएं",
                    "chat_btn": "AI डॉक्टर से चैट करें"
                },
                "testimonials": {
                    "badge": "प्रशंसापत्र",
                    "title": "हजारों का भरोसा",
                    "subtitle": "देखें कि हमारे ग्राहक और भागीदार MedsZop के बारे में क्या कहते हैं",
                    "content_1": "MedsZop एक जीवन रक्षक रहा है! AI पर्ची स्कैनर ने मेरा बहुत समय बचाया।",
                    "role_1": "नियमित ग्राहक",
                    "content_2": "अंत में, एक ऐसा मंच जो स्वास्थ्य आवश्यकताओं को समझता है। अत्यधिक अनुशंसित!",
                    "role_2": "स्वास्थ्य देखभाल पेशेवर",
                    "content_3": "एक फार्मेसी भागीदार के रूप में, डैशबोर्ड सहज है और ऑर्डर प्रबंधन निर्बाध है।",
                    "role_3": "फार्मेसी मालिक"
                },
                "cta": {
                    "title": "आज ही अपनी स्वास्थ्य यात्रा शुरू करें",
                    "subtitle": "उन हजारों खुश ग्राहकों में शामिल हों जो अपनी स्वास्थ्य आवश्यकताओं के लिए MedsZop पर भरोसा करते हैं",
                    "get_started": "मुफ्त में शुरू करें",
                    "browse": "दवाइयाँ ब्राउज़ करें"
                }
            }
        }
    },
    bn: {
        translation: {
            "nav": {
                "medicines": "ওষুধ",
                "scan_prescription": "প্রেসক্রিপশন স্ক্যান",
                "ai_doctor": "AI ডাক্তার",
                "dashboard": "ড্যাশবোর্ড",
                "my_orders": "আমার অর্ডার",
                "log_out": "লগ আউট",
                "log_in": "লগ ইন",
                "get_started": "শুরু করুন",
                "cart": "কার্ট",
                "profile": "প্রোফাইল"
            },
            "common": {
                "welcome": "MedsZop এ আপনাকে স্বাগতম",
                "search_medicines": "ওষুধ খুঁজুন...",
                "language": "ভাষা"
            },
            "landing": {
                "hero": {
                    "badge": "স্মার্ট হেলথটেক প্ল্যাটফর্ম",
                    "title": "আপনার স্বাস্থ্য, <1>স্মার্টভাবে</1><2/>পৌঁছে দেওয়া হয়েছে",
                    "subtitle": "ভারতের সবচেয়ে বুদ্ধিমান ওষুধ অর্ডার করার প্ল্যাটফর্ম। আই-পাওয়ার্ড প্রেসক্রিপশন স্ক্যানিং, বিশ্বস্ত ফার্মাসি এবং বিদ্যুৎ-দ্রুত ডেলিভারি।",
                    "explore_btn": "ওষুধ দেখুন",
                    "scan_btn": "প্রেসক্রিপশন স্ক্যান",
                    "trusted_by": "৫০,০০০+ ব্যবহারকারী দ্বারা বিশ্বস্ত",
                    "delivered_card": "অর্ডার ডেলিভার করা হয়েছে",
                    "in_min": "২৮ মিনিটে",
                    "ai_card": "AI বিশ্লেষণ",
                    "scanned_status": "প্রেসক্রিপশন স্ক্যান করা হয়েছে"
                },
                "stats": {
                    "customers": "সুখী গ্রাহক",
                    "medicines": "ওষুধ",
                    "pharmacies": "পার্টনার ফার্মাসি",
                    "delivery": "গড় ডেলিভারি সময়"
                },
                "features": {
                    "badge": "বৈশিষ্ট্য",
                    "title": "কেন MedsZop বেছে নেবেন?",
                    "subtitle": "আমরা আপনাকে সেরা অভিজ্ঞতা দিতে স্বাস্থ্য বিশেষজ্ঞের সাথে অত্যাধুনিক প্রযুক্তি যুক্ত করি",
                    "scanner_title": "AI প্রেসক্রিপশন স্ক্যানার",
                    "scanner_desc": "আপনার প্রেসক্রিপশন আপলোড করুন এবং আমাদের AI কে স্বয়ংক্রিয়ভাবে ওষুধ বের করতে দিন",
                    "chat_title": "AI ডাক্তার চ্যাট",
                    "chat_desc": "আমাদের AI-চালিত সহকারীর কাছ থেকে তাৎক্ষণিক স্বাস্থ্য নির্দেশিকা পান",
                    "delivery_title": "এক ঘণ্টায় ডেলিভারি",
                    "delivery_desc": "৬০ মিনিটের মধ্যে জরুরি ওষুধের জন্য অগ্রাধিকার ডেলিভারি",
                    "genuine_title": "১০০% আসল",
                    "genuine_desc": "সব ওষুধ শুধুমাত্র যাচাইকৃত ফার্মাসি থেকে সংগ্রহ করা হয়"
                },
                "ai": {
                    "badge": "AI-চালিত",
                    "title": "স্বাস্থ্যসেবা এবং <1>কৃত্রিম বুদ্ধিমত্তা</1>",
                    "description": "আমাদের AI সরঞ্জাম স্বাস্থ্যসেবা আরও সহজলভ্য করে তোলে। প্রেসক্রিপশন তাৎক্ষণিক স্ক্যান করুন, নির্দেশনার জন্য আমাদের AI ডাক্তারের সাথে চ্যাট করুন এবং ব্যক্তিগতকৃত ওষুধ পরামর্শ পান।",
                    "list": {
                        "extraction": "তাৎক্ষণিক প্রেসক্রিপশন পাঠ্য নিষ্কাশন",
                        "recognition": "ওষুধের নাম সনাক্তকরণ এবং মিলকরণ",
                        "guidance": "লক্ষণ-ভিত্তিক স্বাস্থ্য নির্দেশিকা",
                        "warnings": "ওষুধের মিথস্ক্রিয়া সতর্কতা"
                    },
                    "scanner_btn": "AI স্ক্যানার ব্যবহার করুন",
                    "chat_btn": "AI ডাক্তারের সাথে চ্যাট করুন"
                },
                "testimonials": {
                    "badge": "প্রশংসাপত্র",
                    "title": "হাজার হাজার মানুষের ভালোবাসা",
                    "subtitle": "দেখুন আমাদের গ্রাহক এবং অংশীদাররা MedsZop সম্পর্কে কী বলছেন",
                    "content_1": "MedsZop একটি জীবন রক্ষাকারী! AI প্রেসক্রিপশন স্ক্যানার আমার অনেক সময় বাঁচিয়েছে।",
                    "role_1": "নিয়মিত গ্রাহক",
                    "content_2": "অবশেষে, এমন একটি প্ল্যাটফর্ম যা স্বাস্থ্যের প্রয়োজনীয়তা বোঝে। অত্যন্ত সুপারিশকৃত!",
                    "role_2": "স্বাস্থ্যসেবা পেশাদার",
                    "content_3": "একজন ফার্মাসি পার্টনার হিসেবে, ড্যাশবোর্ডটি সহজ এবং অর্ডার ম্যানেজমেন্ট নির্বিঘ্ন।",
                    "role_3": "ফার্মাসি মালিক"
                },
                "cta": {
                    "title": "আজই আপনার স্বাস্থ্য যাত্রা শুরু করুন",
                    "subtitle": "হাজার হাজার সুখী গ্রাহকের সাথে যোগ দিন যারা তাদের স্বাস্থ্য প্রয়োজনের জন্য MedsZop এর উপর আস্থা রাখেন",
                    "get_started": "বিনামূল্যে শুরু করুন",
                    "browse": "ওষুধ ব্রাউজ করুন"
                }
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
