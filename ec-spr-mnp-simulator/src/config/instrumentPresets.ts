export type InstrumentPreset = {
  instrument: string;
  opticalMode: "Kretschmann";
  angularRangeDegrees: {
    min: number;
    max: number;
  };
  defaultWavelengthNm: number;
  sensorDimensionsMm: {
    width: number;
    height: number;
    thickness: number;
  };
  glassRefractiveIndexAt670NmRIU: number;
};

export const bioNavisNavi210aVasaPreset: InstrumentPreset = {
  instrument: "BioNavis MP-SPR Navi 210A VASA",
  opticalMode: "Kretschmann",
  angularRangeDegrees: {
    min: 40,
    max: 78,
  },
  defaultWavelengthNm: 670,
  sensorDimensionsMm: {
    width: 20,
    height: 12,
    thickness: 0.55,
  },
  glassRefractiveIndexAt670NmRIU: 1.5202,
};

export const instrumentPresets = [bioNavisNavi210aVasaPreset];
