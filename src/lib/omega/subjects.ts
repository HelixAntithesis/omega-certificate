export type Kingdom =
  | "fauna"
  | "biome"
  | "particle"
  | "system"
  | "plant"
  | "insect"
  | "microbe";

export type SubjectApp = {
  id: string;
  name: string;
  kingdom: Kingdom;
  repo: string;
  note: string;
  source: string;
  handshake: readonly ["efran", "nanoda-js", "lean4lean-js"];
};

const HANDSHAKE = ["efran", "nanoda-js", "lean4lean-js"] as const;

const ROWS: { kingdom: Kingdom; name: string; a: number; b: number; note: string }[] = [
  { kingdom: "fauna", name: "Gray wolf", a: 2, b: 1, note: "Pack plus pups stays above the pair threshold." },
  { kingdom: "fauna", name: "Blue whale", a: 1, b: 1, note: "Cow and calf are each at least one animal." },
  { kingdom: "fauna", name: "African elephant", a: 3, b: 1, note: "Matriarch herd plus calf." },
  { kingdom: "fauna", name: "Emperor penguin", a: 1, b: 1, note: "Parent pair bound." },
  { kingdom: "fauna", name: "Green sea turtle", a: 1, b: 2, note: "Nesting female plus clutch cohort." },
  { kingdom: "fauna", name: "Red fox", a: 1, b: 3, note: "Vixen plus kits." },
  { kingdom: "fauna", name: "Axolotl", a: 1, b: 1, note: "Regenerating individual stays nonnegative." },
  { kingdom: "fauna", name: "Komodo dragon", a: 1, b: 2, note: "Adult plus hatchlings." },
  { kingdom: "fauna", name: "Polar bear", a: 1, b: 2, note: "Sow plus cubs." },
  { kingdom: "fauna", name: "Humpback whale", a: 2, b: 1, note: "Pod escort plus calf." },

  { kingdom: "biome", name: "Tropical rainforest", a: 8, b: 2, note: "Canopy strata plus understory." },
  { kingdom: "biome", name: "Sahara desert", a: 1, b: 0, note: "Oasis count is at least the watered sites." },
  { kingdom: "biome", name: "Arctic tundra", a: 1, b: 1, note: "Permafrost and active layer both present." },
  { kingdom: "biome", name: "Coral reef", a: 4, b: 1, note: "Reef zones plus lagoon." },
  { kingdom: "biome", name: "Temperate grassland", a: 2, b: 2, note: "Grazer guilds on two ranges." },
  { kingdom: "biome", name: "Mangrove swamp", a: 3, b: 1, note: "Tide bands plus landward fringe." },
  { kingdom: "biome", name: "Boreal taiga", a: 5, b: 1, note: "Conifer stands plus burn patch." },
  { kingdom: "biome", name: "Alpine meadow", a: 2, b: 1, note: "Elevation belts plus snowbed." },
  { kingdom: "biome", name: "Kelp forest", a: 3, b: 2, note: "Stipe canopy plus holdfast guild." },
  { kingdom: "biome", name: "Wetland marsh", a: 2, b: 2, note: "Emergent and open-water plots." },

  { kingdom: "particle", name: "Photon", a: 1, b: 1, note: "Two modes, at least one quantum each." },
  { kingdom: "particle", name: "Electron", a: 1, b: 1, note: "Charge count is additive." },
  { kingdom: "particle", name: "Proton", a: 3, b: 0, note: "Three valence quarks, no extra required." },
  { kingdom: "particle", name: "Neutron", a: 1, b: 1, note: "Nucleon pair bound." },
  { kingdom: "particle", name: "Neutrino", a: 1, b: 0, note: "Flavor count stays nonnegative." },
  { kingdom: "particle", name: "Muon", a: 1, b: 1, note: "Muon plus decay product slot." },
  { kingdom: "particle", name: "Gluon", a: 8, b: 0, note: "Color octet is at least eight charges." },
  { kingdom: "particle", name: "Higgs boson", a: 1, b: 0, note: "Scalar excitation is at least one." },
  { kingdom: "particle", name: "Pion", a: 1, b: 1, note: "Charged pair bound." },
  { kingdom: "particle", name: "Quark", a: 2, b: 1, note: "Up-type plus down-type occupancy." },

  { kingdom: "system", name: "Carbon cycle", a: 2, b: 1, note: "Reservoirs plus flux step." },
  { kingdom: "system", name: "Water cycle", a: 3, b: 1, note: "Ocean, ice, atmosphere plus runoff." },
  { kingdom: "system", name: "Nitrogen cycle", a: 2, b: 2, note: "Fixation and denitrification pools." },
  { kingdom: "system", name: "Krebs cycle", a: 8, b: 1, note: "Turns of the cycle plus acetyl input." },
  { kingdom: "system", name: "Immune system", a: 2, b: 1, note: "Innate plus adaptive arm." },
  { kingdom: "system", name: "Nervous system", a: 1, b: 1, note: "Central plus peripheral." },
  { kingdom: "system", name: "Solar system", a: 8, b: 1, note: "Planets plus the star." },
  { kingdom: "system", name: "Climate system", a: 4, b: 1, note: "Atmosphere, ocean, ice, land plus forcing." },
  { kingdom: "system", name: "Food web", a: 3, b: 1, note: "Trophic levels plus detritus." },
  { kingdom: "system", name: "Circulation", a: 2, b: 2, note: "Pulmonary and systemic loops." },

  { kingdom: "plant", name: "Coast redwood", a: 1, b: 1, note: "Stem plus crown." },
  { kingdom: "plant", name: "Bristlecone pine", a: 1, b: 0, note: "A single ancient stem is enough." },
  { kingdom: "plant", name: "Venus flytrap", a: 2, b: 1, note: "Trigger hairs plus trap." },
  { kingdom: "plant", name: "Wheat", a: 1, b: 3, note: "Head plus spikelets." },
  { kingdom: "plant", name: "Rice", a: 1, b: 2, note: "Tiller plus panicles." },
  { kingdom: "plant", name: "Oak", a: 1, b: 1, note: "Trunk plus canopy." },
  { kingdom: "plant", name: "Baobab", a: 1, b: 1, note: "Bole plus root store." },
  { kingdom: "plant", name: "Moss", a: 2, b: 1, note: "Gametophyte mat plus sporophyte." },
  { kingdom: "plant", name: "Fern", a: 1, b: 2, note: "Rhizome plus fronds." },
  { kingdom: "plant", name: "Seagrass", a: 2, b: 2, note: "Meadow shoots plus rhizomes." },

  { kingdom: "insect", name: "Honey bee", a: 1, b: 100, note: "Queen plus worker floor." },
  { kingdom: "insect", name: "Monarch butterfly", a: 1, b: 1, note: "Adult plus generation." },
  { kingdom: "insect", name: "Hercules beetle", a: 1, b: 1, note: "Adult plus larva slot." },
  { kingdom: "insect", name: "Dragonfly", a: 1, b: 1, note: "Nymph plus adult." },
  { kingdom: "insect", name: "Termite", a: 2, b: 10, note: "Reproductives plus workers." },
  { kingdom: "insect", name: "Ant", a: 1, b: 20, note: "Queen plus workers." },
  { kingdom: "insect", name: "Mosquito", a: 1, b: 1, note: "Adult plus aquatic stage." },
  { kingdom: "insect", name: "Firefly", a: 1, b: 1, note: "Signaler plus reply." },
  { kingdom: "insect", name: "Praying mantis", a: 1, b: 1, note: "Adult plus ootheca." },
  { kingdom: "insect", name: "Cicada", a: 1, b: 13, note: "Emergence plus brood year floor." },

  { kingdom: "microbe", name: "Escherichia coli", a: 1, b: 1, note: "Cell plus daughter after division." },
  { kingdom: "microbe", name: "Saccharomyces cerevisiae", a: 1, b: 1, note: "Mother plus bud." },
  { kingdom: "microbe", name: "Bacteriophage", a: 1, b: 1, note: "Virion plus host." },
  { kingdom: "microbe", name: "Cyanobacterium", a: 2, b: 1, note: "Filament cells plus heterocyst." },
  { kingdom: "microbe", name: "Lactobacillus", a: 2, b: 2, note: "Colony pairs." },
  { kingdom: "microbe", name: "Penicillium", a: 1, b: 1, note: "Mycelium plus spore." },
  { kingdom: "microbe", name: "Thermococcus", a: 1, b: 1, note: "Archaeal cell plus copy." },
  { kingdom: "microbe", name: "Rhizobium", a: 1, b: 1, note: "Bacterium plus nodule." },
  { kingdom: "microbe", name: "Methanogen", a: 1, b: 1, note: "Cell plus substrate pool." },
  { kingdom: "microbe", name: "Paramecium", a: 1, b: 1, note: "Ciliate plus food vacuole." },
];

function ident(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return /^[a-z]/.test(s) ? s : `sub_${s}`;
}

export const SUBJECTS: SubjectApp[] = ROWS.map((row) => {
  const id = ident(row.name);
  return {
    id,
    name: row.name,
    kingdom: row.kingdom,
    repo: `omega-certificate-${id.replace(/_/g, "-")}`,
    note: row.note,
    handshake: HANDSHAKE,
    source: `theorem ${id} (n m : Nat) (hn : n ≥ ${row.a}) (hm : m ≥ ${row.b}) : n + m ≥ ${row.a + row.b} := by
  omega`,
  };
});

export const KINGDOMS: Kingdom[] = [
  "fauna",
  "biome",
  "particle",
  "system",
  "plant",
  "insect",
  "microbe",
];

export function subjectsIn(kingdom: Kingdom | "all"): SubjectApp[] {
  if (kingdom === "all") return SUBJECTS;
  return SUBJECTS.filter((s) => s.kingdom === kingdom);
}
