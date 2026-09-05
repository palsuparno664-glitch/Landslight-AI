"""
LANDSIGHT AI - Multilingual Emergency Alert Dispatcher Service
Generates targeted emergency broadcast warnings across North Eastern languages.
"""

from typing import Dict


def generate_multilingual_alerts(location_name: str, state: str, risk_level: str, risk_score: float) -> Dict[str, str]:
    """
    Generates localized emergency text templates for SMS, IVR audio synthesis, and Siren broadcast.
    """
    if risk_level == "Critical":
        return {
            "en": f"🚨 [CRITICAL LANDSLIDE ALERT] Imminent landslide danger at {location_name}, {state} (Risk Score: {risk_score}/100). Evacuate downhill slopes immediately. Move to nearest designated relief shelter. Dial 1070 for SDRF rescue.",
            "hi": f"🚨 [अति गंभीर भूस्खलन चेतावनी] {location_name}, {state} में भारी भूस्खलन का तत्काल खतरा है (जोखिम स्कोर: {risk_score}/100)। ढलानों वाले इलाकों को तुरंत खाली करें। नजदीकी राहत शिविर में जाएं। SDRF सहायता के लिए 1070 डायल करें।",
            "as": f"🚨 [জৰুৰী ভূমিস্খলন সতৰ্কবাৰ্তা] {location_name}, {state}ত ভূমিস্খলনৰ প্ৰচণ্ড আশংকা দেখা দিছে (বিপদৰ মাত্ৰা: {risk_score}/100)। পাহাৰীয়া ঢালৰ পৰা তৎক্ষণাত নিৰাপদ আশ্ৰয় শিবিৰলৈ যাওক। সহায়ৰ বাবে 1070 নম্বৰত ফোন কৰক।",
            "bn": f"🚨 [জরুরী ভূমিধস সতর্কবার্তা] {location_name}, {state}-এ মারাত্মক ভূমিধসের আশঙ্কা রয়েছে (ঝুঁকি স্কোর: {risk_score}/100)। পাহাড়ি ঢাল ছেড়ে দ্রুত নিরাপদ আশ্রয়কেন্দ্রে যান। জরুরি সহায়তার জন্য ১০৭০ নম্বরে যোগাযোগ করুন।",
            "ne": f"🚨 [अति गम्भीर पहिरो चेतावनी] {location_name}, {state} मा भीषण पहिरो आउने उच्च जोखिम छ (जोखिम स्तर: {risk_score}/100)। तुरुन्त भीरपाखो क्षेत्र खाली गरी सुरक्षित आश्रयस्थलमा जानुहोस्। उद्दारका लागि 1070 मा सम्पर्क गर्नुहोस्।",
            "kha": f"🚨 [JINGMAHAM JINGTIAN KA KHYNDEW] Ka jingma kaba jur ha {location_name}, {state} (Risk: {risk_score}/100). Kynriah noh mardor sha ki jaka shngain. Phone sha 1070 na ka bynta ka jingiarap SDRF.",
            "miz": f"🚨 [LEILUNG CHHIA VAUNA HLOUH] {location_name}, {state}-ah lei tlah hlauhawm tak a awm (Risk: {risk_score}/100). Chhim lam leh tlang thlang atangin inthiarfihlim vat rawh u. SDRF puihna atan 1070 be rawh u.",
            "mni": f"🚨 [খুদোংথিবা চিং চুগৎপগী ৱাৰ্নিং] {location_name}, {state}দা য়াম্না কন্না চিং চুগৎপগী অমুক হন্না খুদোংথিবা লাকপগী ফিভম লৈরে (Risk: {risk_score}/100)। খোঙজেল য়াংনা অশোই-অঙাম থোক্তবা মফমদা চৎলু। মতেংগীদমক 1070 দা কোল তৌবীয়ু।"
        }
    elif risk_level == "High":
        return {
            "en": f"⚠️ [HIGH RISK ADVISORY] Landslide warning active for {location_name}, {state} (Risk: {risk_score}/100). Avoid non-essential road travel and monitor local streams. Stay on high alert.",
            "hi": f"⚠️ [उच्च जोखिम चेतावनी] {location_name}, {state} में भूस्खलन की चेतावनी जारी (जोखिम: {risk_score}/100)। पहाड़ी मार्गों पर गैर-जरूरी यात्रा से बचें और सतर्क रहें।",
            "as": f"⚠️ [উচ্চ সতৰ্কতা জাননী] {location_name}, {state}ৰ বাবে ভূমিস্খলনৰ সতৰ্কবাৰ্তা (বিপদ: {risk_score}/100)। পাহাৰীয়া ৰাস্তাত যাত্ৰা পৰিহাৰ কৰক আৰু সাৱধান থাকক।",
            "bn": f"⚠️ [উচ্চ ঝুঁকি সতর্কবার্তা] {location_name}, {state}-এ ভূমিধসের আশঙ্কা (ঝুঁকি: {risk_score}/100)। পাহাড়ি রাস্তায় যাতায়াত এড়িয়ে চলুন এবং সতর্ক থাকুন।",
            "ne": f"⚠️ [उच्च जोखिम सूचना] {location_name}, {state} मा पहिरोको सम्भावना (जोखिम: {risk_score}/100)। अनावश्यक यात्रा नगर्नुहोस् र सचेत रहनुहोस्।",
            "kha": f"⚠️ [JINGMAHAM JINGMA KABA JUR] Jingmaham ha {location_name}, {state} (Risk: {risk_score}/100). Kieng noh ia ka leit ka wan ha surok lum bad long kiba husiar.",
            "miz": f"⚠️ [VAUNA] {location_name}, {state}-ah lei tlah thil theih a sang (Risk: {risk_score}/100). Zin veivahna fimkhur ula, inpeih rengin awm rawh u.",
            "mni": f"⚠️ [অকন্নবা চেৎসি ৱাৰ্নিং] {location_name}, {state}দা চিং চুগৎপগী ফিভম লৈরে (Risk: {risk_score}/100)। লম্বী চৎপদা য়াম্না চেকশিনবা অমসুং ৱারী য়াংনা লৈবা।"
        }
    elif risk_level == "Moderate":
        return {
            "en": f"🟡 [MODERATE ADVISORY] Elevated landslide potential in {location_name}, {state} due to continuous rainfall. Check route clearance before traveling.",
            "hi": f"🟡 [मध्यम चेतावनी] निरंतर बारिश के कारण {location_name}, {state} में भूस्खलन की संभावना। यात्रा से पहले मार्ग की स्थिति जांचें।",
            "as": f"🟡 [মধ্যম সতৰ্কবাৰ্তা] বৰষুণৰ ফলত {location_name}, {state}ত ভূমিস্খলনৰ সম্ভাৱনা আছে। যাত্ৰা কৰাৰ পূৰ্বে ৰাস্তাৰ অৱস্থা বুজ লওক।",
            "bn": f"🟡 [মাঝারি সতর্কতা] বৃষ্টির কারণে {location_name}, {state}-এ ভূমিধস হতে পারে। ভ্রমণের আগে পথের অবস্থা দেখে নিন।",
            "ne": f"🟡 [मध्यम सतर्कता] वर्षाका कारण {location_name}, {state} मा पहिरोको सम्भावना। यात्रा अघि बाटोको अवस्था जाँच्नुहोस्।",
            "kha": f"🟡 [JINGMAHAM] Don ka jingthmu ba lah ban don jingjulor ha {location_name}, {state}. Peit bniah shuwa ban leit jingleit.",
            "miz": f"🟡 [FIMKHURNA] Ruah sur vangin {location_name}, {state}-ah fimkhurna a ngai. Zin hmain kawng dinhmun ngaihven rawh.",
            "mni": f"🟡 [মচু ওল্লবা চেৎসি] নোং চুবা মরমনা {location_name}, {state}দা চিং তাথকপগী সম্ভাৱনা লৈ।"
        }
    else:
        return {
            "en": f"🟢 [ALL CLEAR] Normal conditions in {location_name}, {state} (Risk: {risk_score}/100). All transport corridors open.",
            "hi": f"🟢 [स्थिति सामान्य] {location_name}, {state} में स्थिति सामान्य है (जोखिम: {risk_score}/100)। सभी मार्ग सुचारू हैं।",
            "as": f"🟢 [স্বাভাৱিক অৱস্থা] {location_name}, {state}ত পৰিস্থিতি স্বাভাৱিক (বিপদ: {risk_score}/100)। সকলো পথ মুকলি আছে।",
            "bn": f"🟢 [স্বাভাবিক অবস্থা] {location_name}, {state}-এ পরিস্থিতি স্বাভাবিক (ঝুঁকি: {risk_score}/100)। সকল রাস্তা খোলা আছে।",
            "ne": f"🟢 [सामान्य अवस्था] {location_name}, {state} मा अवस्था सामान्य छ (जोखिम: {risk_score}/100)। सडकहरू खुला छन्।",
            "kha": f"🟢 [JINGSUK] Ka long kaba suk ha {location_name}, {state} (Risk: {risk_score}/100). Ki surok ki plie beit.",
            "miz": f"🟢 [HUAITAKNA] {location_name}, {state}-ah boruak a tha (Risk: {risk_score}/100). Kawng a tluang vek e.",
            "mni": f"🟢 [স্বভাবিক ফিভম] {location_name}, {state}দা ফিবম ফরে (Risk: {risk_score}/100)। লম্বী খুদিংমক হাংলে।"
        }
