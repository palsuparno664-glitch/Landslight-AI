import { MonitoringZone, CitizenReport, DispatchRecord, TelemetryPoint } from '@/types';

export const NER_STATES = [
  { id: 'all', name: 'All NER States (Overview)', center: [26.2006, 92.9376] as [number, number], zoom: 7 },
  { id: 'sikkim', name: 'Sikkim', center: [27.5330, 88.5122] as [number, number], zoom: 9 },
  { id: 'meghalaya', name: 'Meghalaya', center: [25.4670, 91.3662] as [number, number], zoom: 9 },
  { id: 'assam', name: 'Assam', center: [26.2006, 92.9376] as [number, number], zoom: 8 },
  { id: 'arunachal', name: 'Arunachal Pradesh', center: [28.2180, 94.7278] as [number, number], zoom: 8 },
  { id: 'nagaland', name: 'Nagaland', center: [26.1584, 94.5624] as [number, number], zoom: 9 },
  { id: 'manipur', name: 'Manipur', center: [24.6637, 93.9063] as [number, number], zoom: 9 },
  { id: 'mizoram', name: 'Mizoram', center: [23.1645, 92.9376] as [number, number], zoom: 9 },
  { id: 'tripura', name: 'Tripura', center: [23.9408, 91.9882] as [number, number], zoom: 9 },
];

export const INITIAL_MONITORING_ZONES: MonitoringZone[] = [
  {
    id: 'ZONE-SKM-01',
    name: 'Mangan - Chungthang Highway Corridor',
    state: 'Sikkim',
    coordinates: [27.5028, 88.5303],
    polygon: [
      [27.54, 88.49], [27.55, 88.56], [27.47, 88.57], [27.46, 88.50]
    ],
    rainfall_last_24h: 142.5,
    slope_angle: 44.2,
    soil_moisture_index: 0.89,
    elevation: 1820,
    geological_formation_score: 8.8,
    historical_landslide_count: 9,
    risk_score: 86.4,
    risk_level: 'Critical',
    active_alert: 'RED ALERT: Massive Debris Flow & Slope Shear Imminent',
    evacuation_status: 'Mandatory Evacuation Triggered (Zone 4)',
    critical_infrastructure: ['North Sikkim Highway (NH-310A)', 'Teesta Stage III Access Road', 'Toong Bridge'],
    nearest_shelter: 'Mangan District Community Hall (Capacity: 850)',
    estimated_population_at_risk: 14200
  },
  {
    id: 'ZONE-SKM-02',
    name: 'Gangtok - Sevoke Road (NH-10 Sector)',
    state: 'Sikkim',
    coordinates: [27.3389, 88.6065],
    polygon: [
      [27.37, 88.57], [27.38, 88.64], [27.30, 88.65], [27.29, 88.58]
    ],
    rainfall_last_24h: 78.0,
    slope_angle: 36.5,
    soil_moisture_index: 0.74,
    elevation: 1650,
    geological_formation_score: 7.2,
    historical_landslide_count: 6,
    risk_score: 64.8,
    risk_level: 'High',
    active_alert: 'AMBER ALERT: Sinking Zone & Rockfall Warning',
    evacuation_status: 'Night Commute Restricted',
    critical_infrastructure: ['National Highway 10 (Sikkim Lifeline)', 'Pakyong Airport Approach'],
    nearest_shelter: 'Ranipool Indoor Sports Complex (Capacity: 1200)',
    estimated_population_at_risk: 28500
  },
  {
    id: 'ZONE-MEG-01',
    name: 'Sohra (Cherrapunji) Cliff Escarpment',
    state: 'Meghalaya',
    coordinates: [25.2986, 91.5822],
    polygon: [
      [25.33, 91.54], [25.34, 91.62], [25.26, 91.63], [25.25, 91.55]
    ],
    rainfall_last_24h: 185.0,
    slope_angle: 48.0,
    soil_moisture_index: 0.94,
    elevation: 1430,
    geological_formation_score: 8.0,
    historical_landslide_count: 11,
    risk_score: 93.2,
    risk_level: 'Critical',
    active_alert: 'EXTREME CRITICAL: Heavy Infiltration & Escarpment Collapse Hazard',
    evacuation_status: 'Relief Shelters Activated',
    critical_infrastructure: ['Cherrapunji-Shella Border Road', 'Nohkalikai Ridge Overlook'],
    nearest_shelter: 'Sohra Civil Sub-Division Shelter (Capacity: 1500)',
    estimated_population_at_risk: 18900
  },
  {
    id: 'ZONE-MEG-02',
    name: 'Shillong Peak Ridge - Umiam Link',
    state: 'Meghalaya',
    coordinates: [25.5788, 91.8933],
    polygon: [
      [25.61, 91.85], [25.62, 91.93], [25.54, 91.94], [25.53, 91.86]
    ],
    rainfall_last_24h: 42.0,
    slope_angle: 24.0,
    soil_moisture_index: 0.58,
    elevation: 1520,
    geological_formation_score: 4.5,
    historical_landslide_count: 2,
    risk_score: 38.5,
    risk_level: 'Moderate',
    active_alert: 'YELLOW ADVISORY: Intermittent Hillside Runoff',
    evacuation_status: 'Normal Operations (Monitoring Active)',
    critical_infrastructure: ['Guwahati-Shillong Expressway (GS Road)', 'Umiam Dam Feeder'],
    nearest_shelter: 'Mawlai Community Centre (Capacity: 600)',
    estimated_population_at_risk: 8500
  },
  {
    id: 'ZONE-ASM-01',
    name: 'Dima Hasao Hill Pass & Jatinga Valley',
    state: 'Assam',
    coordinates: [25.1234, 93.0152],
    polygon: [
      [25.16, 92.97], [25.17, 93.06], [25.08, 93.07], [25.07, 92.99]
    ],
    rainfall_last_24h: 88.0,
    slope_angle: 33.0,
    soil_moisture_index: 0.76,
    elevation: 650,
    geological_formation_score: 7.5,
    historical_landslide_count: 8,
    risk_score: 67.2,
    risk_level: 'High',
    active_alert: 'AMBER ALERT: Railway Track Soil Subsidence Warning',
    evacuation_status: 'Railway Speed Restriction (20 km/h)',
    critical_infrastructure: ['Lumding-Badarpur Broad Gauge Rail Link', 'Haflong Hill Cut'],
    nearest_shelter: 'Haflong District Gymnasium (Capacity: 1100)',
    estimated_population_at_risk: 12400
  },
  {
    id: 'ZONE-ARU-01',
    name: 'Tawang - Bap Teng Kang Gorge',
    state: 'Arunachal Pradesh',
    coordinates: [27.5860, 91.8654],
    polygon: [
      [27.62, 91.82], [27.63, 91.91], [27.54, 91.92], [27.53, 91.83]
    ],
    rainfall_last_24h: 95.0,
    slope_angle: 42.0,
    soil_moisture_index: 0.82,
    elevation: 2660,
    geological_formation_score: 8.2,
    historical_landslide_count: 5,
    risk_score: 74.5,
    risk_level: 'High',
    active_alert: 'HIGH RISK: High Altitude Moraine & Rockfall Hazard',
    evacuation_status: 'BRTF (Border Roads) Clearance Teams Deployed',
    critical_infrastructure: ['Balipara-Charduar-Tawang (BCT) Road', 'Sela Tunnel Approach'],
    nearest_shelter: 'Tawang Town Multipurpose Hall (Capacity: 900)',
    estimated_population_at_risk: 6300
  },
  {
    id: 'ZONE-NAG-01',
    name: 'Kohima - Dimapur NH-29 Paglapahar',
    state: 'Nagaland',
    coordinates: [25.6751, 94.1086],
    polygon: [
      [25.71, 94.06], [25.72, 94.15], [25.63, 94.16], [25.62, 94.07]
    ],
    rainfall_last_24h: 64.0,
    slope_angle: 31.5,
    soil_moisture_index: 0.68,
    elevation: 1440,
    geological_formation_score: 7.0,
    historical_landslide_count: 7,
    risk_score: 58.6,
    risk_level: 'High',
    active_alert: 'AMBER: Paglapahar Mudslide & Boulder Fall Threat',
    evacuation_status: 'Single Lane Traffic Regulation',
    critical_infrastructure: ['National Highway 29 (Nagaland-Manipur Lifeline)', 'Dzüdza River Bridge'],
    nearest_shelter: 'Kohima Science College Shelter (Capacity: 750)',
    estimated_population_at_risk: 16800
  },
  {
    id: 'ZONE-MIZ-01',
    name: 'Aizawl Hunthar Sinking Basin',
    state: 'Mizoram',
    coordinates: [23.7271, 92.7176],
    polygon: [
      [23.76, 92.67], [23.77, 92.76], [23.69, 92.77], [23.68, 92.68]
    ],
    rainfall_last_24h: 55.0,
    slope_angle: 38.0,
    soil_moisture_index: 0.65,
    elevation: 1132,
    geological_formation_score: 6.8,
    historical_landslide_count: 6,
    risk_score: 54.2,
    risk_level: 'High',
    active_alert: 'HIGH CAUTION: Active Slope Sinking & Creep Detected',
    evacuation_status: 'Continuous Drone & Inclinometer Survey',
    critical_infrastructure: ['Hunthar Veng Arterial Link', 'Lengpui Airport Road'],
    nearest_shelter: 'Aizawl West YMA Hall (Capacity: 800)',
    estimated_population_at_risk: 11200
  },
  {
    id: 'ZONE-MAN-01',
    name: 'Noney - Tupul Railway Yard Corridor',
    state: 'Manipur',
    coordinates: [24.8170, 93.6030],
    polygon: [
      [24.85, 93.56], [24.86, 93.65], [24.77, 93.66], [24.76, 93.57]
    ],
    rainfall_last_24h: 72.0,
    slope_angle: 35.0,
    soil_moisture_index: 0.71,
    elevation: 920,
    geological_formation_score: 7.4,
    historical_landslide_count: 5,
    risk_score: 62.0,
    risk_level: 'High',
    active_alert: 'HIGH RISK: Ijei River Catchment Debris Inundation',
    evacuation_status: 'SDRF Rapid Unit Stationed at Noney Camp',
    critical_infrastructure: ['Jiribam-Imphal Rail Line', 'NH-37 Imphal-Silchar Road'],
    nearest_shelter: 'Noney Community Hall (Capacity: 700)',
    estimated_population_at_risk: 7400
  },
  {
    id: 'ZONE-TRI-01',
    name: 'Jampui Hills Ridge Sector',
    state: 'Tripura',
    coordinates: [23.8500, 92.2600],
    polygon: [
      [23.89, 92.22], [23.90, 92.30], [23.81, 92.31], [23.80, 92.23]
    ],
    rainfall_last_24h: 22.0,
    slope_angle: 18.0,
    soil_moisture_index: 0.38,
    elevation: 780,
    geological_formation_score: 3.2,
    historical_landslide_count: 1,
    risk_score: 19.4,
    risk_level: 'Low',
    active_alert: 'GREEN: Stable Weather Conditions',
    evacuation_status: 'Routine Agricultural Operations',
    critical_infrastructure: ['Vanghmun Tourist Corridor', 'Kanchanpur Connecting Road'],
    nearest_shelter: 'Vanghmun Village Hall (Capacity: 450)',
    estimated_population_at_risk: 3200
  }
];

export const INITIAL_CITIZEN_REPORTS: CitizenReport[] = [
  {
    id: 'REP-2026-001',
    timestamp: '2026-08-28T00:45:00Z',
    latitude: 27.5028,
    longitude: 88.5303,
    location_name: 'Mangan North Road, Sikkim',
    state: 'Sikkim',
    severity: 'Critical',
    hazard_type: 'Debris Flow & Road Blockage',
    description: 'Massive mudflow after 120mm torrential overnight downpour. Road blocked near km 34. Retaining wall breached.',
    media_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop',
    reporter_name: 'Tashi Bhutia (Field Volunteer)',
    reporter_phone: '+91 98765 43210',
    cv_verification_score: 94.2,
    cv_detected_hazards: ['Mudflow', 'Structural Breach', 'Road Debris'],
    status: 'Verified & Dispatched',
    sync_status: 'synced'
  },
  {
    id: 'REP-2026-002',
    timestamp: '2026-08-28T01:05:00Z',
    latitude: 25.2986,
    longitude: 91.5822,
    location_name: 'Cherrapunji Escarpment, East Khasi Hills',
    state: 'Meghalaya',
    severity: 'High',
    hazard_type: 'Tension Cracks on Slope',
    description: 'Long horizontal tension cracks (15-20cm wide) observed above village settlement. Water seeping from fracture fissures.',
    media_url: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=600&auto=format&fit=crop',
    reporter_name: 'Wanbiang Marbaniang (Local Resident)',
    reporter_phone: '+91 94361 88231',
    cv_verification_score: 88.7,
    cv_detected_hazards: ['Tension Cracks', 'High Slope Saturation'],
    status: 'Investigating',
    sync_status: 'synced'
  },
  {
    id: 'REP-2026-003',
    timestamp: '2026-08-28T01:10:00Z',
    latitude: 25.1234,
    longitude: 93.0152,
    location_name: 'Dima Hasao Hill Section, Lumding-Badarpur',
    state: 'Assam',
    severity: 'Moderate',
    hazard_type: 'Minor Slump & Ballast Erosion',
    description: 'Minor mud slumping near railway track culvert #42. Track patrol team alerted.',
    media_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop',
    reporter_name: 'Alok Sarma (Track Inspector)',
    reporter_phone: '+91 97060 11223',
    cv_verification_score: 79.4,
    cv_detected_hazards: ['Soil Slump'],
    status: 'Under Repair',
    sync_status: 'synced'
  }
];

export const INITIAL_DISPATCHES: DispatchRecord[] = [
  {
    dispatch_id: 'DISP-9921',
    timestamp: '2026-08-28T00:50:00Z',
    zone_name: 'Mangan - Chungthang Highway Corridor',
    state: 'Sikkim',
    target_audience: 'District Responders & 14,200 Registered Citizens',
    channels: ['SMS Broadcast', 'CAP Alerting Protocol', 'IVR Siren', 'NDRF Radio'],
    languages: ['English', 'Hindi', 'Nepali', 'Assamese'],
    priority: 'CRITICAL PRIORITY',
    message_preview: '🚨 [CRITICAL LANDSLIDE ALERT] Imminent landslide danger at Mangan North Road. Evacuate downhill slopes immediately.',
    sdrf_units_deployed: 3
  },
  {
    dispatch_id: 'DISP-9918',
    timestamp: '2026-08-28T00:15:00Z',
    zone_name: 'Sohra (Cherrapunji) Cliff Escarpment',
    state: 'Meghalaya',
    target_audience: 'East Khasi Hills DEOC & 18,900 Residents',
    channels: ['SMS Broadcast', 'IVR Voice Call', 'WhatsApp Channel'],
    languages: ['English', 'Khasi', 'Hindi'],
    priority: 'CRITICAL PRIORITY',
    message_preview: '🚨 [CRITICAL ALERT] Severe slope saturation at Cherrapunji rim. Relief shelters open at Sohra Civil Sub-Division.',
    sdrf_units_deployed: 2
  }
];

export const SIMULATED_TELEMETRY_SERIES: TelemetryPoint[] = [
  { time: '00:00', rainfall_mm: 12.0, soil_saturation_pct: 42, pore_water_pressure_kpa: 14.2, inclinometer_displacement_mm: 0.2, risk_score: 28 },
  { time: '04:00', rainfall_mm: 24.5, soil_saturation_pct: 54, pore_water_pressure_kpa: 18.5, inclinometer_displacement_mm: 0.4, risk_score: 36 },
  { time: '08:00', rainfall_mm: 58.0, soil_saturation_pct: 68, pore_water_pressure_kpa: 26.8, inclinometer_displacement_mm: 1.1, risk_score: 55 },
  { time: '12:00', rainfall_mm: 92.5, soil_saturation_pct: 79, pore_water_pressure_kpa: 35.4, inclinometer_displacement_mm: 2.8, risk_score: 72 },
  { time: '16:00', rainfall_mm: 135.0, soil_saturation_pct: 88, pore_water_pressure_kpa: 46.1, inclinometer_displacement_mm: 5.4, risk_score: 84 },
  { time: '20:00', rainfall_mm: 168.0, soil_saturation_pct: 94, pore_water_pressure_kpa: 58.9, inclinometer_displacement_mm: 8.9, risk_score: 93 },
  { time: 'Now', rainfall_mm: 185.0, soil_saturation_pct: 96, pore_water_pressure_kpa: 64.2, inclinometer_displacement_mm: 12.4, risk_score: 96 },
];

export const BENCHMARK_SCENARIOS = [
  {
    id: 'normal',
    name: 'Normal Weather Baseline',
    description: 'Dry spell across Sikkim and Meghalaya. Soil moisture index low, all road links normal.',
    zones_modifier: { rainfall: 15, moisture: 0.35, slope: 25, score: 20, level: 'Low' as const }
  },
  {
    id: 'mangan_surge',
    name: 'Monsoon Surge in Mangan (Sikkim)',
    description: '145mm torrential cloudburst triggers critical pore-water surge on Teesta valley slopes.',
    zones_modifier: { rainfall: 145, moisture: 0.91, slope: 45, score: 88, level: 'Critical' as const }
  },
  {
    id: 'cherra_cloudburst',
    name: 'Cherrapunji Extreme Cloudburst (Meghalaya)',
    description: '210mm extreme precipitation along the Southern Khasi escarpment with impending slope collapse.',
    zones_modifier: { rainfall: 210, moisture: 0.98, slope: 52, score: 96, level: 'Critical' as const }
  },
  {
    id: 'all_ner_cyclone',
    name: 'Regional Multi-State Cyclone Alert',
    description: 'Widespread high-intensity depression affecting Meghalaya, Assam, Nagaland, and Manipur.',
    zones_modifier: { rainfall: 110, moisture: 0.85, slope: 38, score: 78, level: 'High' as const }
  }
];
