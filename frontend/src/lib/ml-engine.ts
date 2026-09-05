import { LandslideFeatureInput, RiskPredictionOutput, FactorContribution, RiskLevel } from '@/types';

export class LandslideRiskEngine {
  private weights = {
    rainfall_last_24h: 0.35,
    slope_angle: 0.25,
    soil_moisture_index: 0.18,
    geological_formation_score: 0.12,
    historical_landslide_count: 0.06,
    elevation: 0.04,
  };

  private normalizeRainfall(mm: number): number {
    if (mm <= 20) return (mm / 20.0) * 20.0;
    if (mm <= 65) return 20.0 + ((mm - 20.0) / 45.0) * 30.0;
    if (mm <= 140) return 50.0 + ((mm - 65.0) / 75.0) * 30.0;
    return Math.min(100.0, 80.0 + ((mm - 140.0) / 100.0) * 20.0);
  }

  private normalizeSlope(deg: number): number {
    if (deg <= 15) return (deg / 15.0) * 15.0;
    if (deg <= 32) return 15.0 + ((deg - 15.0) / 17.0) * 35.0;
    if (deg <= 50) return 50.0 + ((deg - 32.0) / 18.0) * 38.0;
    return Math.min(100.0, 88.0 + ((deg - 50.0) / 40.0) * 12.0);
  }

  private normalizeSoilMoisture(smi: number): number {
    if (smi <= 0.4) return (smi / 0.4) * 25.0;
    if (smi <= 0.75) return 25.0 + ((smi - 0.4) / 0.35) * 45.0;
    return Math.min(100.0, 70.0 + ((smi - 0.75) / 0.25) * 30.0);
  }

  private normalizeGeology(score: number): number {
    return Math.min(100.0, Math.max(0.0, ((score - 1.0) / 9.0) * 100.0));
  }

  private normalizeHistory(count: number): number {
    return Math.min(100.0, (count / 12.0) * 100.0);
  }

  private normalizeElevation(elevation_m: number): number {
    if (elevation_m < 500) return 15.0;
    if (elevation_m <= 2800) return 15.0 + ((elevation_m - 500.0) / 2300.0) * 75.0;
    return Math.min(100.0, 90.0 + ((elevation_m - 2800.0) / 3000.0) * 10.0);
  }

  public predict(data: LandslideFeatureInput): RiskPredictionOutput {
    const subScores: Record<string, number> = {
      rainfall_last_24h: this.normalizeRainfall(data.rainfall_last_24h),
      slope_angle: this.normalizeSlope(data.slope_angle),
      soil_moisture_index: this.normalizeSoilMoisture(data.soil_moisture_index),
      geological_formation_score: this.normalizeGeology(data.geological_formation_score),
      historical_landslide_count: this.normalizeHistory(data.historical_landslide_count),
      elevation: this.normalizeElevation(data.elevation),
    };

    let rawScore = 0;
    for (const [k, weight] of Object.entries(this.weights)) {
      rawScore += (subScores[k] || 0) * weight;
    }

    // Synergy compound multiplier
    let compoundMultiplier = 1.0;
    if (data.rainfall_last_24h > 90 && data.slope_angle > 35 && data.soil_moisture_index > 0.7) {
      compoundMultiplier = 1.18;
    } else if (data.rainfall_last_24h > 60 && data.slope_angle > 30) {
      compoundMultiplier = 1.08;
    }

    const finalScore = Math.round(Math.min(100.0, Math.max(0.0, rawScore * compoundMultiplier)) * 10) / 10;

    let level: RiskLevel = 'Low';
    let color = '#10b981';

    if (finalScore < 25.0) {
      level = 'Low';
      color = '#10b981';
    } else if (finalScore < 50.0) {
      level = 'Moderate';
      color = '#f59e0b';
    } else if (finalScore < 75.0) {
      level = 'High';
      color = '#f97316';
    } else {
      level = 'Critical';
      color = '#ef4444';
    }

    const featureMeta: Record<string, [string, number, string, string]> = {
      rainfall_last_24h: [
        '24-Hour Rainfall Intensity',
        data.rainfall_last_24h,
        'mm',
        'Heavy precipitation infiltrates slope crevices, dramatically increasing pore-water pressure.',
      ],
      slope_angle: [
        'Terrain Slope Gradient',
        data.slope_angle,
        '°',
        'Steep hillside exceeds angle of repose, creating strong gravitational shear stress.',
      ],
      soil_moisture_index: [
        'Soil Saturation Index',
        Math.round(data.soil_moisture_index * 1000) / 10,
        '%',
        'Soil pore saturation significantly reduces effective cohesive shear strength.',
      ],
      geological_formation_score: [
        'Lithology & Fault Weakness',
        data.geological_formation_score,
        '/10',
        'Fractured metamorphic phyllite/schist rock strata predisposes to planar slip.',
      ],
      historical_landslide_count: [
        'Historical Recurrence Density',
        data.historical_landslide_count,
        ' events',
        'Documented chronic landslide zone with existing scars and loose debris.',
      ],
      elevation: [
        'Orographic Elevation',
        data.elevation,
        'm',
        'High altitude terrain amplifies runoff velocity and debris entrainment.',
      ],
    };

    const totalSubScoreSum = rawScore || 1.0;
    const contributors: FactorContribution[] = Object.entries(featureMeta).map(([k, [name, val, unit, expl]]) => {
      const weight = (this.weights as Record<string, number>)[k] || 0.1;
      const contribPct = Math.round((((subScores[k] * weight) / totalSubScoreSum) * 100.0) * 10) / 10;
      const subVal = subScores[k];
      let imp: RiskLevel = 'Low';
      if (subVal >= 75) imp = 'Critical';
      else if (subVal >= 50) imp = 'High';
      else if (subVal >= 25) imp = 'Moderate';

      return {
        factor_name: name,
        feature_key: k,
        value: val,
        unit,
        contribution_percentage: contribPct,
        risk_level_impact: imp,
        explanation: expl,
      };
    });

    contributors.sort((a, b) => b.contribution_percentage - a.contribution_percentage);

    const topTrigger = contributors[0]?.feature_key || 'rainfall_last_24h';
    const mitigation = this.getMitigationActions(level, topTrigger, data.location_name);
    const urgency = this.getEvacuationUrgency(level);
    const alerts = this.getMultilingualAlerts(data.location_name, data.state, level, finalScore);

    return {
      risk_score: finalScore,
      risk_level: level,
      risk_color: color,
      confidence: 0.92,
      input_data: data,
      top_contributors: contributors,
      mitigation_actions: mitigation,
      evacuation_urgency: urgency,
      multilingual_alerts: alerts,
      timestamp: new Date().toISOString(),
    };
  }

  private getMitigationActions(risk_level: RiskLevel, top_trigger: string, location_name: string): string[] {
    const actions: string[] = [];
    if (risk_level === 'Critical') {
      actions.push(`🚨 IMMEDIATE EVACUATION: Trigger sirens and SMS alerts in vulnerable downhill settlements of ${location_name}.`);
      actions.push('⛔ HIGHWAY CLOSURE: Restrict vehicular movement on exposed arterial mountain corridors and NH links.');
      actions.push('🚜 HEAVY MACHINERY MOBILIZATION: Pre-stage JCBs, bulldozers, and NDRF/SDRF rescue battalions at staging hubs.');
      actions.push('⚡ UTILITY CUTOFF: De-energize high-tension electrical grids across slide-prone slopes to avoid secondary fires.');
      actions.push('🏥 SHELTER READINESS: Activate designated community cyclone/landslide relief shelters with medical triage.');
    } else if (risk_level === 'High') {
      actions.push(`⚠️ AMBER ADVISORY: Restrict heavy commercial vehicles from passing through ${location_name}.`);
      actions.push('📡 SENSOR POLLING: Increase IoT inclinometer and rain gauge telemetry frequency to 5-minute intervals.');
      actions.push('👷 FIELD INSPECTION: Deploy quick-response engineers to check tension cracks along road embankments.');
      actions.push('📢 CITIZEN ALERT: Broadcast caution notices to local residents via radio, loudspeakers, and WhatsApp channels.');
      actions.push('💧 DRAINAGE CLEARANCE: Clear culverts, roadside drains, and weep holes to prevent hydrostatic pressure buildup.');
    } else if (risk_level === 'Moderate') {
      actions.push('🟡 MONITORING ALERT: District Emergency Operation Center (DEOC) placed on active yellow alert.');
      actions.push('🌧️ WEATHER TRACKING: Monitor IMD Doppler Radar for localized cloudburst clusters in next 6-12 hours.');
      actions.push('🚙 ADVISORY: Advise commuters to avoid nighttime travel on hilly roads unless strictly necessary.');
      actions.push('📋 CITIZEN VERIFICATION: Cross-reference citizen ground reports with satellite soil moisture imagery.');
    } else {
      actions.push('🟢 GREEN - ROUTINE SURVEILLANCE: Normal baseline monitoring active across all seismic and slope sensors.');
      actions.push('🌱 PREVENTATIVE MAINTENANCE: Continue routine slope stabilization, retaining wall checks, and hydro-seeding.');
      actions.push('📊 DATA INGESTION: Satellite and IMD ingestion pipelines operating at standard 1-hour heartbeat.');
    }

    if (top_trigger === 'rainfall_last_24h') {
      actions.push('💧 RAINFALL TRIGGER: Continuous downpour detected — watch out for flash flood debris flows at river bottlenecks.');
    } else if (top_trigger === 'slope_angle') {
      actions.push('⛰️ STEEP SLOPE VULNERABILITY: Escarpment angle exceeds critical stability limit — danger of sudden rockfall.');
    } else if (top_trigger === 'soil_moisture_index') {
      actions.push('🌊 SOIL SATURATION: Liquefaction potential is elevated due to complete groundwater pore saturation.');
    }

    return actions;
  }

  private getEvacuationUrgency(risk_level: RiskLevel): string {
    const map: Record<RiskLevel, string> = {
      Critical: 'IMMEDIATE (0 - 2 Hours) - Mandatory Evacuation',
      High: 'HIGH (2 - 6 Hours) - Voluntary Evacuation Recommended',
      Moderate: 'MODERATE (6 - 24 Hours) - Stay Alert & Prepared',
      Low: 'NONE - Normal Status',
    };
    return map[risk_level] || 'NONE - Normal Status';
  }

  private getMultilingualAlerts(location_name: string, state: string, risk_level: RiskLevel, risk_score: number): Record<string, string> {
    if (risk_level === 'Critical') {
      return {
        en: `🚨 [CRITICAL LANDSLIDE ALERT] Imminent landslide danger at ${location_name}, ${state} (Risk Score: ${risk_score}/100). Evacuate downhill slopes immediately. Move to nearest designated relief shelter. Dial 1070 for SDRF rescue.`,
        hi: `🚨 [अति गंभीर भूस्खलन चेतावनी] ${location_name}, ${state} में भारी भूस्खलन का तत्काल खतरा है (जोखिम स्कोर: ${risk_score}/100)। ढलानों वाले इलाकों को तुरंत खाली करें। नजदीकी राहत शिविर में जाएं। SDRF सहायता के लिए 1070 डायल करें।`,
        as: `🚨 [জৰুৰী ভূমিস্খলন সতৰ্কবাৰ্তা] ${location_name}, ${state}ত ভূমিস্খলনৰ প্ৰচণ্ড আশংকা দেখা দিছে (বিপদৰ মাত্ৰা: ${risk_score}/100)। পাহাৰীয়া ঢালৰ পৰা তৎক্ষণাত নিৰাপদ আশ্ৰয় শিবিৰলৈ যাওক। সহায়ৰ বাবে 1070 নম্বৰত ফোন কৰক।`,
        bn: `🚨 [জরুরী ভূমিধস সতর্কবার্তা] ${location_name}, ${state}-এ মারাত্মক ভূমিধসের আশঙ্কা রয়েছে (ঝুঁকি স্কোর: ${risk_score}/100)। পাহাড়ি ঢাল ছেড়ে দ্রুত নিরাপদ আশ্রয়কেন্দ্রে যান। জরুরি সহায়তার জন্য ১০৭০ নম্বরে যোগাযোগ করুন।`,
        ne: `🚨 [अति गम्भीर पहिरो चेतावनी] ${location_name}, ${state} मा भीषण पहिरो आउने उच्च जोखिम छ (जोखिम स्तर: ${risk_score}/100)। तुरुन्त भीरपाखो क्षेत्र खाली गरी सुरक्षित आश्रयस्थलमा जानुहोस्। उद्दारका लागि 1070 मा सम्पर्क गर्नुहोस्।`,
        kha: `🚨 [JINGMAHAM JINGTIAN KA KHYNDEW] Ka jingma kaba jur ha ${location_name}, ${state} (Risk: ${risk_score}/100). Kynriah noh mardor sha ki jaka shngain. Phone sha 1070 na ka bynta ka jingiarap SDRF.`,
        miz: `🚨 [LEILUNG CHHIA VAUNA HLOUH] ${location_name}, ${state}-ah lei tlah hlauhawm tak a awm (Risk: ${risk_score}/100). Chhim lam leh tlang thlang atangin inthiarfihlim vat rawh u. SDRF puihna atan 1070 be rawh u.`,
        mni: `🚨 [খুদোংথিবা চিং চুগৎপগী ৱাৰ্নিং] ${location_name}, ${state}দা য়াম্না কন্না চিং চুগৎপগী অমুক হন্না খুদোংথিবা লাকপগী ফিভম লৈরে (Risk: ${risk_score}/100)। খোঙজেল য়াংনা অশোই-অঙাম থোক্তবা মফমদা চৎলু। মতেংগীদমক 1070 দা কোল তৌবীয়ু。`,
      };
    } else if (risk_level === 'High') {
      return {
        en: `⚠️ [HIGH RISK ADVISORY] Landslide warning active for ${location_name}, ${state} (Risk: ${risk_score}/100). Avoid non-essential road travel and monitor local streams. Stay on high alert.`,
        hi: `⚠️ [उच्च जोखिम चेतावनी] ${location_name}, ${state} में भूस्खलन की चेतावनी जारी (जोखिम: ${risk_score}/100)। पहाड़ी मार्गों पर गैर-जरूरी यात्रा से बचें और सतर्क रहें।`,
        as: `⚠️ [উচ্চ সতৰ্কতা জাননী] ${location_name}, ${state}ৰ বাবে ভূমিস্খলনৰ সতৰ্কবাৰ্তা (বিপদ: ${risk_score}/100)। পাহাৰীয়া ৰাস্তাত যাত্ৰা পৰিহাৰ কৰক আৰু সাৱধান থাকক।`,
        bn: `⚠️ [উচ্চ ঝুঁকি সতর্কবার্তা] ${location_name}, ${state}-এ ভূমিধসের আশঙ্কা (ঝুঁকি: ${risk_score}/100)। পাহাড়ি রাস্তায় যাতায়াত এড়িয়ে চলুন এবং সতর্ক থাকুন।`,
        ne: `⚠️ [उच्च जोखिम सूचना] ${location_name}, ${state} मा पहिरोको सम्भावना (जोखिम: ${risk_score}/100)। अनावश्यक यात्रा नगर्नुहोस् र सचेत रहनुहोस्।`,
        kha: `⚠️ [JINGMAHAM JINGMA KABA JUR] Jingmaham ha ${location_name}, ${state} (Risk: ${risk_score}/100). Kieng noh ia ka leit ka wan ha surok lum bad long kiba husiar.`,
        miz: `⚠️ [VAUNA] ${location_name}, ${state}-ah lei tlah thil theih a sang (Risk: ${risk_score}/100). Zin veivahna fimkhur ula, inpeih rengin awm rawh u.`,
        mni: `⚠️ [অকন্নবা চেৎসি ৱাৰ্নিং] ${location_name}, ${state}দা চিং চুগৎপগী ফিভম লৈরে (Risk: ${risk_score}/100)। লম্বী চৎপদা য়াম্না চেকশিনবা অমসুং ৱারী য়াংনা লৈবা。`,
      };
    } else if (risk_level === 'Moderate') {
      return {
        en: `🟡 [MODERATE ADVISORY] Elevated landslide potential in ${location_name}, ${state} due to continuous rainfall. Check route clearance before traveling.`,
        hi: `🟡 [मध्यम चेतावनी] निरंतर बारिश के कारण ${location_name}, ${state} में भूस्खलन की संभावना। यात्रा से पहले मार्ग की स्थिति जांचें।`,
        as: `🟡 [মধ্যম সতৰ্কবাৰ্তা] বৰষুণৰ ফলত ${location_name}, ${state}ত ভূমিস্খলনৰ সম্ভাৱনা আছে। যাত্ৰা কৰাৰ পূৰ্বে ৰাস্তাৰ অৱস্থা বুজ লওক।`,
        bn: `🟡 [মাঝারি সতর্কতা] বৃষ্টির কারণে ${location_name}, ${state}-এ ভূমিধস হতে পারে। ভ্রমণের আগে পথের অবস্থা দেখে নিন।`,
        ne: `🟡 [मध्यम सतर्कता] वर्षाका कारण ${location_name}, ${state} मा पहिरोको सम्भावना। यात्रा अघि बाटोको अवस्था जाँच्नुहोस्।`,
        kha: `🟡 [JINGMAHAM] Don ka jingthmu ba lah ban don jingjulor ha ${location_name}, ${state}. Peit bniah shuwa ban leit jingleit.`,
        miz: `🟡 [FIMKHURNA] Ruah sur vangin ${location_name}, ${state}-ah fimkhurna a ngai. Zin hmain kawng dinhmun ngaihven rawh.`,
        mni: `🟡 [মচু ওল্লবা চেৎসি] নোং চুবা মরমনা ${location_name}, ${state}দা চিং তাথকপগী সম্ভাৱনা লৈ。`,
      };
    } else {
      return {
        en: `🟢 [ALL CLEAR] Normal conditions in ${location_name}, ${state} (Risk: ${risk_score}/100). All transport corridors open.`,
        hi: `🟢 [स्थिति सामान्य] ${location_name}, ${state} में स्थिति सामान्य है (जोखिम: ${risk_score}/100)। सभी मार्ग सुचारू हैं।`,
        as: `🟢 [স্বাভাৱিক অৱস্থা] ${location_name}, ${state}ত পৰিস্থিতি স্বাভাৱিক (বিপদ: ${risk_score}/100)। সকলো পথ মুকলি আছে।`,
        bn: `🟢 [স্বাভাবিক অবস্থা] ${location_name}, ${state}-এ পরিস্থিতি স্বাভাবিক (ঝুঁকি: ${risk_score}/100)। সকল রাস্তা খোলা আছে।`,
        ne: `🟢 [सामान्य अवस्था] ${location_name}, ${state} मा अवस्था सामान्य छ (जोखिम: ${risk_score}/100)। सडकहरू खुला छन्।`,
        kha: `🟢 [JINGSUK] Ka long kaba suk ha ${location_name}, ${state} (Risk: ${risk_score}/100). Ki surok ki plie beit.`,
        miz: `🟢 [HUAITAKNA] ${location_name}, ${state}-ah boruak a tha (Risk: ${risk_score}/100). Kawng a tluang vek e.`,
        mni: `🟢 [স্বভাবিক ফিভম] ${location_name}, ${state}দা ফিবম ফরে (Risk: ${risk_score}/100)। লম্বী খুদিংমক হাংলে。`,
      };
    }
  }
}

export const clientRiskEngine = new LandslideRiskEngine();
