import type { Line, Payer, Phase } from "@/lib/ledger/types";

export const PHASE_SEED: Phase[] = [
  {
    id: "pre",
    name: "Pre-construction & site",
    blurb: "Survey, soil test, clearing, shed, temporary power and water.",
  },
  {
    id: "fees",
    name: "Design & professional fees",
    blurb: "Architect, structural, MEP drawings, supervision, and insurance.",
  },
  {
    id: "permits",
    name: "Permits & government",
    blurb: "Barangay, building permit, fire safety, and occupancy.",
  },
  {
    id: "earth",
    name: "Earthworks & foundation",
    blurb: "Excavation, footings, slab on grade, termite treatment, backfill.",
  },
  {
    id: "structure",
    name: "Structural concrete & steel",
    blurb: "Columns, beams, suspended slabs, stairs, rebar, and formworks.",
  },
  {
    id: "masonry",
    name: "Masonry walls",
    blurb: "Exterior and interior blocks, lintels, and stiffener columns.",
  },
  {
    id: "roof",
    name: "Roofing & rainwater",
    blurb: "Trusses, long-span sheets, insulation, gutters, and flashing.",
  },
  {
    id: "openings",
    name: "Doors, windows & grills",
    blurb: "Doors, aluminum windows, steel grills, and hardware.",
  },
  {
    id: "electrical",
    name: "Electrical",
    blurb: "Rough-in, panel, lights, outlets, aircon lines, utility deposit.",
  },
  {
    id: "plumbing",
    name: "Plumbing & sanitary",
    blurb: "Water lines, sanitary, septic, tank, fixtures, and water meter.",
  },
  {
    id: "wetproof",
    name: "Waterproofing",
    blurb: "Toilet membranes, balcony, and damp-proofing at the wall base.",
  },
  {
    id: "floors",
    name: "Floor finishes",
    blurb: "Floor tile, toilet tile, adhesives, and stair finish.",
  },
  {
    id: "walls",
    name: "Walls, ceilings & paint",
    blurb: "Plaster, ceilings, cornice, interior paint, and exterior paint.",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    blurb: "Cabinets, counter, backsplash, hood, and LPG piping.",
  },
  {
    id: "baths",
    name: "Bathrooms",
    blurb: "Vanities, mirrors, accessories, shower glass, and exhaust fans.",
  },
  {
    id: "stairs",
    name: "Stairs & railings",
    blurb: "Stair railing, handrail, and balcony railing. The flight is under structure.",
  },
  {
    id: "carpentry",
    name: "Built-in carpentry",
    blurb: "Bedroom closets and linen storage.",
  },
  {
    id: "systems",
    name: "Low voltage & safety",
    blurb: "Data cabling, CCTV, smoke alarms, and extinguishers.",
  },
  {
    id: "exterior",
    name: "Exterior, fence & site",
    blurb: "Carport, walks, fence, gate, drainage, plants, and outdoor lights.",
  },
  {
    id: "appliances",
    name: "Fixtures & appliances",
    blurb: "Air-conditioners and owner allowances. Zero these if you will buy later.",
  },
  {
    id: "close",
    name: "Temporary works & closeout",
    blurb: "Scaffolding, hauling, cleaning, punchlist, and consumables.",
  },
  {
    id: "extras",
    name: "Owner additionals",
    blurb: "Paid by you, not the contractor. Power and water connection, extra tanks, and a well allowance.",
  },
];

type Raw = {
  phaseId: string;
  name: string;
  spec: string;
  unit: string;
  qty: number;
  materialRate: number;
  laborRate: number;
  vendor?: string;
  payer?: Payer;
};

export const OWNER_LINE_NAMES = new Set([
  "Power utility deposit",
  "Water meter deposit",
  "Overhead tank and pump",
  "Split air-conditioners",
  "Cooktop allowance",
  "Refrigerator allowance",
  "Washing machine allowance",
]);

function row(
  phaseId: string,
  name: string,
  spec: string,
  unit: string,
  qty: number,
  materialRate: number,
  laborRate: number,
  vendor = "",
  payer?: Payer,
): Raw {
  return { phaseId, name, spec, unit, qty, materialRate, laborRate, vendor, payer };
}

const RAW: Raw[] = [
  row("pre", "Relocation survey", "Geodetic relocation of lot corners", "lot", 1, 18000, 7000, "Geodetic surveyor"),
  row("pre", "Soil investigation", "Two boreholes and a laboratory report", "lot", 1, 22000, 13000, "Soil laboratory"),
  row("pre", "Clearing and grubbing", "Strip vegetation and haul organics", "sqm", 200, 40, 85),
  row("pre", "Temporary bodega and fence", "Material shed and site fence", "lot", 1, 28000, 17000),
  row("pre", "Temporary power and water", "Construction board, hose, and coordination", "lot", 1, 12000, 6000),
  row("pre", "Demolition allowance", "Remove an existing slab, fence, or structure if any", "lot", 1, 5000, 15000),

  row("fees", "Architectural plans", "Working drawings, four printed sets", "lot", 1, 120000, 0, "Architect"),
  row("fees", "Structural design", "Analysis and signed structural drawings", "lot", 1, 45000, 0, "Structural engineer"),
  row("fees", "MEP design", "Electrical, plumbing, and sanitary plans", "lot", 1, 35000, 0, "MEP designer"),
  row("fees", "Site supervision", "Part-time visits through the build", "month", 8, 0, 10000, "Supervisor"),
  row("fees", "Contractor's all-risk insurance", "Allowance. Zero this if you will not insure the works", "lot", 1, 15000, 0),

  row("permits", "Barangay and locational clearances", "Barangay clearance and zoning papers", "lot", 1, 5000, 0, "LGU"),
  row("permits", "Building permit", "Building permit and ancillary local fees", "lot", 1, 55000, 0, "LGU"),
  row("permits", "Occupancy permit", "Allowance at turnover", "lot", 1, 15000, 0, "LGU"),
  row("permits", "Fire safety inspection", "BFP inspection fees", "lot", 1, 8000, 0, "BFP"),

  row("earth", "Excavation", "Footings, tie beams, and septic pit", "cu.m", 45, 0, 650),
  row("earth", "Gravel bedding", "100 mm under footings and the ground slab", "cu.m", 14, 1450, 280),
  row("earth", "Footing concrete", "21 MPa, footings and tie beams", "cu.m", 16, 5200, 1600, "Batching plant"),
  row("earth", "Footing rebar", "Grade 40, cut, bend, and tie", "kg", 1400, 62, 14),
  row("earth", "Footing formworks", "Plywood and lumber, partial reuse", "sqm", 70, 240, 210),
  row("earth", "Termite soil treatment", "Chemical treatment under the slab", "sqm", 90, 55, 30),
  row("earth", "Backfill and compaction", "Selected fill, placed in layers", "cu.m", 28, 380, 320),
  row("earth", "Slab on grade", "100 mm slab with wire mesh", "sqm", 75, 980, 420),
  row("earth", "Vapor barrier", "Polyethylene sheet under the slab", "sqm", 80, 45, 15),

  row("structure", "Column and beam concrete", "Suspended members, 21 MPa", "cu.m", 28, 5400, 1900, "Batching plant"),
  row("structure", "Suspended slab concrete", "100 to 125 mm floor slabs", "cu.m", 18, 5400, 1700, "Batching plant"),
  row("structure", "Structural rebar", "Beams, columns, slabs, and stairs", "kg", 5200, 62, 16),
  row("structure", "Structural formworks", "Contact area, including shores", "sqm", 340, 220, 260),
  row("structure", "Stair structure", "Concrete flight and mid landing", "lot", 1, 28000, 22000),
  row("structure", "Roof tie beam", "Concrete tie at the roof line", "lot", 1, 35000, 18000),

  row("masonry", "6-inch CHB exterior", "Including mortar. Exterior walls", "sqm", 190, 480, 320),
  row("masonry", "4-inch CHB interior", "Room partitions", "sqm", 230, 360, 280),
  row("masonry", "Stiffeners and lintels", "Concrete stiffener columns and window lintels", "lot", 1, 42000, 28000),
  row("masonry", "Wall reinforcement", "10 mm vertical and horizontal bars", "kg", 900, 62, 14),

  row("roof", "Steel roof framing", "Trusses and purlins, painted", "sqm", 170, 1250, 380, "Steel fabricator"),
  row("roof", "Rib-type roofing", "0.5 mm prepainted sheets and screws", "sqm", 185, 820, 190, "Roofing supplier"),
  row("roof", "Foil insulation", "Double-sided foil under the purlins", "sqm", 170, 110, 25),
  row("roof", "Ridge, flashing, sealant", "Ridge roll, valley, and wall flashing", "lot", 1, 22000, 8000),
  row("roof", "Gutters and downspouts", "Prepainted or PVC", "lm", 46, 480, 180),
  row("roof", "Fascia and barge", "Fiber-cement fascia boards", "lm", 48, 320, 140),

  row("openings", "Main door", "Solid wood, jamb, and threshold", "set", 1, 26000, 3500),
  row("openings", "Service door", "Steel or solid service door", "set", 1, 11000, 2000),
  row("openings", "Bedroom doors", "Hollow core, jamb, and lockset", "set", 4, 6200, 1400),
  row("openings", "Toilet doors", "Moisture-resistant door and jamb", "set", 3, 4800, 1200),
  row("openings", "Aluminum windows", "Powder-coated sliding and awning", "sqm", 26, 6200, 900, "Aluminum fabricator"),
  row("openings", "Window grills", "Steel grills, primed and painted", "sqm", 26, 1450, 480),
  row("openings", "Door hardware", "Extra hinges, stoppers, and spare locks", "lot", 1, 9000, 0),

  row("electrical", "Rough-in", "Wires, PVC, boxes, and supports by floor area", "sqm", 150, 720, 380, "Electrician"),
  row("electrical", "Panelboard", "16-branch panel, breakers, and grounding", "set", 1, 24000, 4500),
  row("electrical", "Lighting fixtures", "LED downlights and utility lamps", "set", 32, 950, 180),
  row("electrical", "Switches and outlets", "Devices, plates, and exterior weatherproof points", "set", 48, 280, 90),
  row("electrical", "Dedicated aircon lines", "One circuit per outdoor unit", "set", 4, 2800, 1200),
  row("electrical", "Ceiling fans", "Living area and bedrooms without a split unit", "set", 6, 1600, 250),
  row("electrical", "Service entrance", "Meter base, mast, and feeder", "lot", 1, 12000, 4000),
  row("electrical", "Power utility deposit", "Cooperative or utility deposit. You pay this. Zero it if the electricity connection under Owner additionals already includes the deposit.", "lot", 1, 10000, 0),

  row("plumbing", "Cold water lines", "PPR pipe, valves, and pressure test", "lot", 1, 52000, 24000, "Plumber"),
  row("plumbing", "Sanitary and vent", "PVC waste, vent, and hangers", "lot", 1, 42000, 22000),
  row("plumbing", "Septic tank", "Three-chamber. Swap for a sewer tapping fee if you have a main", "lot", 1, 38000, 22000),
  row("plumbing", "Overhead tank and pump", "1,000 L tank and automatic pump. You pay this unless the contractor supplies it. Zero it if Owner additionals already covers the tanks.", "set", 1, 22000, 5000),
  row("plumbing", "Water closets", "Dual-flush, complete with fittings", "set", 3, 6800, 1200),
  row("plumbing", "Lavatories", "Wall-hung or pedestal", "set", 4, 3200, 800),
  row("plumbing", "Shower sets", "Valve, arm, and head", "set", 3, 3800, 700),
  row("plumbing", "Kitchen sink", "Single-bowl stainless", "set", 1, 5500, 1500),
  row("plumbing", "Faucets and bidet sprays", "Kitchen, baths, and hose bibbs", "lot", 1, 14000, 2000),
  row("plumbing", "Floor drains", "Stainless drains", "pc", 8, 450, 180),
  row("plumbing", "Water heaters", "Instant heaters for two baths", "set", 2, 7500, 1200),
  row("plumbing", "Water meter deposit", "Utility deposit and tapping, if separate. You pay this. Zero it if the water connection under Owner additionals already includes it.", "lot", 1, 8000, 0),

  row("wetproof", "Toilet waterproofing", "Cementitious membrane, two coats, with coves", "sqm", 22, 720, 280),
  row("wetproof", "Balcony and canopy", "Membrane and flashing", "sqm", 14, 820, 320),
  row("wetproof", "Ground damp-proof course", "Along the base of exterior walls", "lm", 42, 260, 140),

  row("floors", "Ground floor tile", "600×600, mid-range", "sqm", 72, 890, 380),
  row("floors", "Upper floor tile", "600×600", "sqm", 62, 890, 400),
  row("floors", "Toilet tile", "Non-slip floor and walls to 2.4 m", "sqm", 48, 980, 460),
  row("floors", "Adhesive, grout, and trims", "Thinset, grout, and edge trims", "lot", 1, 18000, 0),
  row("floors", "Stair tile", "Treads, risers, and nosing", "lot", 1, 14000, 8000),

  row("walls", "Interior plaster", "Skim coat on masonry", "sqm", 420, 95, 160),
  row("walls", "Exterior plaster", "Weather finish on exterior walls", "sqm", 180, 110, 190),
  row("walls", "Interior ceiling", "Metal furring and fiber-cement board", "sqm", 125, 620, 340),
  row("walls", "Cornice", "Simple cornice", "lm", 160, 85, 70),
  row("walls", "Interior paint", "Primer and two coats, walls and ceiling", "sqm", 520, 75, 85),
  row("walls", "Exterior paint", "Acrylic or elastomeric", "sqm", 180, 120, 95),
  row("walls", "Door varnish", "Stain and topcoat on wood doors", "lot", 1, 4500, 3500),

  row("kitchen", "Base and wall cabinets", "Melamine carcass, soft-close, about 4 linear meters", "lm", 4, 14500, 3500, "Cabinet maker"),
  row("kitchen", "Countertop", "20 mm stone or quartz", "lm", 3.2, 7200, 1500),
  row("kitchen", "Backsplash", "Tile backsplash", "sqm", 4, 1200, 450),
  row("kitchen", "Range hood", "Allowance", "set", 1, 8500, 800),
  row("kitchen", "LPG piping", "From the tank cage to the range, if you cook with gas", "lot", 1, 6000, 3500),

  row("baths", "Vanity cabinets", "One per bathroom", "set", 3, 7800, 1800),
  row("baths", "Mirrors", "One per bathroom", "set", 3, 1800, 300),
  row("baths", "Bathroom accessories", "Towel bars, paper holder, soap dish", "set", 3, 2200, 200),
  row("baths", "Master shower enclosure", "Tempered glass", "set", 1, 16000, 3000),
  row("baths", "Exhaust fans", "Baths and the kitchen", "set", 3, 1800, 400),

  row("stairs", "Stair railing", "Powder-coated steel, about 900 mm high", "lm", 9, 3200, 1100),
  row("stairs", "Wood handrail", "Cap on the stair railing", "lot", 1, 8000, 2500),
  row("stairs", "Balcony railing", "Steel railing at the balcony or canopy", "lm", 4, 2800, 900),

  row("carpentry", "Bedroom closets", "Built-in melamine closets", "set", 4, 14000, 3500, "Cabinet maker"),
  row("carpentry", "Linen closet", "Hall or utility closet", "set", 1, 9000, 2500),

  row("systems", "Data rough-in", "CAT6 to the living area and bedrooms", "lot", 1, 9000, 5000),
  row("systems", "CCTV", "Four cameras, recorder, and drive", "set", 1, 18000, 4000),
  row("systems", "Smoke alarms", "One per floor and near bedrooms", "pc", 5, 650, 150),
  row("systems", "Fire extinguishers", "ABC extinguishers, kitchen and stairs", "pc", 3, 900, 0),

  row("exterior", "Carport slab", "Including base preparation", "sqm", 24, 1600, 700),
  row("exterior", "Walkway and apron", "Broomed concrete or pavers", "sqm", 28, 980, 520),
  row("exterior", "Perimeter fence", "CHB fence about 1.8 m, plastered", "lm", 36, 2800, 1400),
  row("exterior", "Vehicle and pedestrian gate", "Steel gate, primed and painted", "set", 1, 28000, 8000),
  row("exterior", "Site drainage", "Catch basin and open canal", "lm", 18, 700, 450),
  row("exterior", "Landscaping allowance", "Soil, grass, and a few plants", "lot", 1, 18000, 7000),
  row("exterior", "Exterior lights", "Gate, eaves, and garden points", "lot", 1, 8000, 3000),

  row("appliances", "Split air-conditioners", "1.5 HP inverter, supplied and installed", "set", 3, 28000, 3500),
  row("appliances", "Cooktop allowance", "Electric or gas range, owner supplied", "set", 1, 12000, 0),
  row("appliances", "Refrigerator allowance", "Owner supplied. Zero it if you already own one", "set", 1, 22000, 0),
  row("appliances", "Washing machine allowance", "Owner supplied", "set", 1, 14000, 0),

  row("close", "Scaffolding and tool rental", "Structure, masonry, and painting", "lot", 1, 18000, 16000),
  row("close", "Debris hauling", "Dump trips off site", "trip", 8, 800, 2800),
  row("close", "Final cleaning", "Floors, glass, and site", "lot", 1, 2000, 6000),
  row("close", "Punchlist and as-built", "Minor corrections before turnover", "lot", 1, 8000, 7000),
  row("close", "Protection and consumables", "Film, tape, blades, and PPE", "lot", 1, 9000, 4000),
];

export function extraLines(): Line[] {
  const items: Raw[] = [
    row(
      "extras",
      "Electricity connection",
      "Application, meter, and service drop from the pole to the house. Outside the contractor package. Zero the utility deposit under Electrical if this figure already includes it.",
      "lot",
      1,
      28000,
      7000,
      "Electric cooperative",
      "owner",
    ),
    row(
      "extras",
      "Water connection",
      "Tapping fee, meter, and restoration to the main. Outside the contractor package. Zero this if the lot has no water district and you will use a well.",
      "lot",
      1,
      12000,
      5000,
      "Water district",
      "owner",
    ),
    row(
      "extras",
      "Additional water tank",
      "A second tank, or a larger one you buy yourself. The first tank and pump sit under Plumbing and are already marked as you pay.",
      "set",
      1,
      16000,
      2500,
      "",
      "owner",
    ),
    row(
      "extras",
      "Deep well allowance",
      "Drill, casing, and pump where there is no water main. Zero this if you are connecting to a water district.",
      "lot",
      1,
      55000,
      25000,
      "",
      "owner",
    ),
  ];
  return items.map((item, index) => toLine(item, 10_000 + index, `seed-extras-${index}`));
}

function toLine(item: Raw, order: number, id: string): Line {
  return {
    id,
    phaseId: item.phaseId,
    name: item.name,
    spec: item.spec,
    unit: item.unit,
    qty: item.qty,
    materialRate: item.materialRate,
    laborRate: item.laborRate,
    actual: 0,
    paid: 0,
    vendor: item.vendor ?? "",
    status: "planned",
    date: "",
    notes: "",
    order,
    payer: item.payer ?? (OWNER_LINE_NAMES.has(item.name) ? "owner" : "contractor"),
  };
}

export function seedPhases(): Phase[] {
  return [
    {
      id: "extras",
      name: "Additionals",
      blurb: "Costs you pay besides the contractor.",
    },
  ];
}

export function seedLines(): Line[] {
  return [];
}
