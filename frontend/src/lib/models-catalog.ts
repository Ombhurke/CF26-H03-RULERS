// Federated Medical Imaging Marketplace — model catalog.
// Each model is a collaboratively trained classifier that hospitals contribute
// to depending on the imaging data they hold. Definitions describe the model,
// the data a hospital must supply to participate, and how to train it.
// No raw images are ever centralized — hospitals train locally and share only
// privacy-noised weight deltas (DP-SGD), per the zero-raw-image invariant.

export type Modality =
  | "Chest X-ray"
  | "Dermatoscopy"
  | "Breast Ultrasound"
  | "Retinal Fundus"
  | "Blood Microscopy"
  | "Abdominal CT";

export type ModelStatus = "recruiting" | "training" | "converged";

export interface ContributingHospital {
  id: string;
  name: string;
  code: string; // short scanner/site code shown on avatars
  region: string;
  scanner: string;
  samples: number;
  /** Seeded adversarial site used to demonstrate the Byzantine defense. */
  adversarial?: boolean;
}

export interface DataRequirement {
  label: string;
  value: string;
}

export interface ModelDefinition {
  id: string;
  name: string;
  shortName: string;
  modality: Modality;
  task: string;
  summary: string;
  description: string;
  architecture: string;
  parameters: string;
  classes: string[];
  /** Input tensor spec the local trainer expects. */
  input: {
    resolution: string;
    channels: string;
    format: string;
  };
  /** What a hospital needs on hand to join this model's training. */
  dataRequirements: DataRequirement[];
  /** Local preprocessing the client runs before each round. */
  preprocessing: string[];
  /** Ordered, human-readable steps a hospital follows to contribute. */
  trainingSteps: { title: string; detail: string }[];
  baseAccuracy: number;
  targetAccuracy: number;
  epsilonMax: number;
  status: ModelStatus;
  hospitals: ContributingHospital[];
  /** Minimum labeled samples a site must hold to be eligible. */
  minSamples: number;
  accent: string; // text/border accent hint
}

export const MODELS: ModelDefinition[] = [
  {
    id: "pneumonia-cxr",
    name: "Pediatric Pneumonia Detector",
    shortName: "PneumoNet",
    modality: "Chest X-ray",
    task: "Binary classification · Normal vs. Pneumonia",
    summary: "Frontal chest radiograph screening for pediatric pneumonia.",
    description:
      "A convolutional classifier that flags pneumonia on frontal pediatric chest X-rays. Trained federally across hospitals so no radiograph ever leaves the site of care.",
    architecture: "ResNet-18 (ImageNet-init, fine-tuned)",
    parameters: "11.2M",
    classes: ["Normal", "Pneumonia"],
    input: { resolution: "224 × 224", channels: "1 (grayscale)", format: "DICOM or PNG" },
    dataRequirements: [
      { label: "Modality", value: "Frontal (AP/PA) chest radiographs" },
      { label: "Labels", value: "Radiologist-confirmed Normal / Pneumonia" },
      { label: "Min. labeled studies", value: "500 per site" },
      { label: "Patient age", value: "Pediatric (1–5 yrs) preferred" },
      { label: "PHI", value: "Must be de-identified at source" },
    ],
    preprocessing: [
      "Window/level normalize to 8-bit grayscale",
      "Center-crop to lung field, resize to 224×224",
      "Histogram equalization (CLAHE)",
      "Per-image z-score standardization",
    ],
    trainingSteps: [
      { title: "Stage your dataset", detail: "Place de-identified studies in the local secure volume with a two-column labels.csv (study_id, label)." },
      { title: "Validate & preprocess", detail: "The client verifies label balance and runs CLAHE + resize locally. Nothing is uploaded." },
      { title: "Local DP-SGD epochs", detail: "Train 3 local epochs with gradient clipping and Gaussian noise (ε budget tracked live)." },
      { title: "Submit weight delta", detail: "Only the noised weight delta is shared. Multi-Krum screens it against the honest consensus." },
      { title: "Receive global checkpoint", detail: "The coordinator aggregates accepted deltas and returns the new global model to every site." },
    ],
    baseAccuracy: 0.781,
    targetAccuracy: 0.964,
    epsilonMax: 5.0,
    status: "training",
    minSamples: 500,
    accent: "indigo",
    hospitals: [
      { id: "h1", name: "St. Jude Children's", code: "GE", region: "Memphis, US", scanner: "GE Discovery", samples: 1200 },
      { id: "h2", name: "Great Ormond Street", code: "SIE", region: "London, UK", scanner: "Siemens Ysio", samples: 850 },
      { id: "h3", name: "Bambino Gesù", code: "PHI", region: "Rome, IT", scanner: "Philips DigitalDiagnost", samples: 640 },
      { id: "h4", name: "Node-Delta Clinic", code: "ROG", region: "Unverified", scanner: "Unknown", samples: 410, adversarial: true },
    ],
  },
  {
    id: "derma-lesion",
    name: "Skin Lesion Classifier",
    shortName: "DermaNet",
    modality: "Dermatoscopy",
    task: "7-class classification · Pigmented skin lesions",
    summary: "Dermatoscopic classification across seven common lesion types.",
    description:
      "Multi-class dermatoscopy model distinguishing melanoma from benign pigmented lesions. Federated training lets dermatology clinics pool rare-class signal without sharing patient photos.",
    architecture: "EfficientNet-B0",
    parameters: "5.3M",
    classes: ["Melanoma", "Melanocytic nevus", "Basal cell carcinoma", "Actinic keratosis", "Benign keratosis", "Dermatofibroma", "Vascular lesion"],
    input: { resolution: "224 × 224", channels: "3 (RGB)", format: "JPEG / PNG" },
    dataRequirements: [
      { label: "Modality", value: "Dermatoscope RGB images" },
      { label: "Labels", value: "Biopsy or expert-consensus lesion type" },
      { label: "Min. labeled images", value: "300 per site" },
      { label: "Color", value: "Calibrated color card recommended" },
      { label: "PHI", value: "Crop to lesion, strip EXIF/GPS" },
    ],
    preprocessing: [
      "Hair-artifact inpainting (DullRazor)",
      "Shades-of-gray color constancy",
      "Resize to 224×224, RGB normalize",
      "Class-balanced augmentation (rare lesions)",
    ],
    trainingSteps: [
      { title: "Stage lesion images", detail: "Organize by class folder or provide labels.csv. EXIF/GPS is stripped on import." },
      { title: "Color-normalize locally", detail: "Shades-of-gray constancy runs on-site to harmonize dermatoscope color casts." },
      { title: "Local DP-SGD epochs", detail: "Rare classes are oversampled locally; noise is added to protect per-patient signal." },
      { title: "Submit weight delta", detail: "Cosine-similarity screening rejects label-flipped or off-consensus updates." },
      { title: "Receive global checkpoint", detail: "Aggregated model improves rare-class recall for every participating clinic." },
    ],
    baseAccuracy: 0.702,
    targetAccuracy: 0.912,
    epsilonMax: 6.0,
    status: "recruiting",
    minSamples: 300,
    accent: "rose",
    hospitals: [
      { id: "d1", name: "Vienna Dermatology", code: "SIE", region: "Vienna, AT", scanner: "FotoFinder", samples: 720 },
      { id: "d2", name: "Sydney Skin Institute", code: "CAN", region: "Sydney, AU", scanner: "Canon EOS-derm", samples: 540 },
      { id: "d3", name: "UCSF Dermatology", code: "GE", region: "San Francisco, US", scanner: "DermLite", samples: 610 },
    ],
  },
  {
    id: "breast-us",
    name: "Breast Ultrasound Triage",
    shortName: "MammoSono",
    modality: "Breast Ultrasound",
    task: "Binary classification · Benign vs. Malignant",
    summary: "B-mode ultrasound triage for suspicious breast masses.",
    description:
      "Screens B-mode breast ultrasound for malignant masses. Federation is critical here because malignant examples are scarce at any single site.",
    architecture: "DenseNet-121",
    parameters: "7.0M",
    classes: ["Benign / Normal", "Malignant"],
    input: { resolution: "256 × 256", channels: "1 (grayscale)", format: "DICOM / PNG" },
    dataRequirements: [
      { label: "Modality", value: "B-mode breast ultrasound stills" },
      { label: "Labels", value: "Pathology-confirmed benign / malignant" },
      { label: "Min. labeled studies", value: "250 per site" },
      { label: "ROI", value: "Mass ROI mask preferred, not required" },
      { label: "PHI", value: "Burn-in text must be masked" },
    ],
    preprocessing: [
      "Detect and mask burned-in annotations",
      "Speckle-reduction filtering",
      "Resize to 256×256 grayscale",
      "Intensity normalization",
    ],
    trainingSteps: [
      { title: "Stage ultrasound stills", detail: "Provide PNG/DICOM with pathology labels. Burned-in PHI text is auto-masked on import." },
      { title: "Despeckle & normalize", detail: "Speckle reduction and intensity normalization run locally to reduce vendor variance." },
      { title: "Local DP-SGD epochs", detail: "Focal loss handles class imbalance; DP noise protects the rare malignant cases." },
      { title: "Submit weight delta", detail: "Multi-Krum + cosine screening protect the small-sample aggregate from poisoning." },
      { title: "Receive global checkpoint", detail: "Pooled malignant signal lifts sensitivity beyond any single site's ceiling." },
    ],
    baseAccuracy: 0.734,
    targetAccuracy: 0.898,
    epsilonMax: 5.0,
    status: "recruiting",
    minSamples: 250,
    accent: "violet",
    hospitals: [
      { id: "b1", name: "MD Anderson", code: "GE", region: "Houston, US", scanner: "GE LOGIQ", samples: 430 },
      { id: "b2", name: "Samsung Medical", code: "SAM", region: "Seoul, KR", scanner: "Samsung RS85", samples: 520 },
    ],
  },
  {
    id: "retina-dr",
    name: "Diabetic Retinopathy Grader",
    shortName: "RetinaGrade",
    modality: "Retinal Fundus",
    task: "5-class ordinal grading · DR severity",
    summary: "Fundus photograph grading of diabetic retinopathy severity.",
    description:
      "Grades diabetic retinopathy from color fundus photographs on the standard 0–4 severity scale. Federated across screening programs to cover diverse populations and cameras.",
    architecture: "Inception-v3",
    parameters: "23.8M",
    classes: ["No DR", "Mild", "Moderate", "Severe", "Proliferative"],
    input: { resolution: "299 × 299", channels: "3 (RGB)", format: "JPEG / PNG" },
    dataRequirements: [
      { label: "Modality", value: "Color fundus photographs (45° field)" },
      { label: "Labels", value: "Grader-adjudicated 0–4 severity" },
      { label: "Min. labeled images", value: "800 per site" },
      { label: "Quality", value: "Gradable images (reject blur/artifact)" },
      { label: "PHI", value: "De-identify, remove overlay text" },
    ],
    preprocessing: [
      "Circular retina crop + black-border removal",
      "Ben Graham color normalization",
      "Resize to 299×299",
      "Quality gate (reject ungradable)",
    ],
    trainingSteps: [
      { title: "Stage fundus images", detail: "Provide graded images; the quality gate rejects ungradable frames locally." },
      { title: "Normalize illumination", detail: "Ben Graham normalization harmonizes camera and lighting differences on-site." },
      { title: "Local DP-SGD epochs", detail: "Ordinal loss respects severity ordering; DP noise bounds per-patient leakage." },
      { title: "Submit weight delta", detail: "Screened against consensus before it can influence the global grader." },
      { title: "Receive global checkpoint", detail: "Cross-population training reduces camera and demographic bias." },
    ],
    baseAccuracy: 0.688,
    targetAccuracy: 0.889,
    epsilonMax: 6.5,
    status: "training",
    minSamples: 800,
    accent: "amber",
    hospitals: [
      { id: "r1", name: "Aravind Eye Care", code: "CAN", region: "Madurai, IN", scanner: "Canon CR-2", samples: 2100 },
      { id: "r2", name: "Moorfields Eye", code: "TOP", region: "London, UK", scanner: "Topcon TRC", samples: 1450 },
      { id: "r3", name: "Joslin Diabetes", code: "ZEI", region: "Boston, US", scanner: "Zeiss Visucam", samples: 980 },
    ],
  },
  {
    id: "blood-cell",
    name: "Blood Cell Classifier",
    shortName: "HemaNet",
    modality: "Blood Microscopy",
    task: "8-class classification · Peripheral blood cells",
    summary: "Microscopy classification of peripheral blood cell types.",
    description:
      "Classifies individual peripheral blood cells into eight types from stained microscopy crops, assisting automated differential counts across hematology labs.",
    architecture: "MobileNetV3-Large",
    parameters: "5.4M",
    classes: ["Neutrophil", "Eosinophil", "Basophil", "Lymphocyte", "Monocyte", "Immature granulocyte", "Erythroblast", "Platelet"],
    input: { resolution: "128 × 128", channels: "3 (RGB)", format: "PNG / TIFF" },
    dataRequirements: [
      { label: "Modality", value: "Single-cell microscopy crops" },
      { label: "Stain", value: "May-Grünwald–Giemsa preferred" },
      { label: "Min. labeled cells", value: "1,000 per site" },
      { label: "Magnification", value: "100× oil immersion" },
      { label: "PHI", value: "Slide-level de-identification" },
    ],
    preprocessing: [
      "Single-cell segmentation / crop",
      "Stain color normalization (Macenko)",
      "Resize to 128×128 RGB",
      "Per-channel normalization",
    ],
    trainingSteps: [
      { title: "Stage cell crops", detail: "Provide single-cell crops with type labels or a labels.csv manifest." },
      { title: "Stain-normalize locally", detail: "Macenko normalization harmonizes staining protocols between labs." },
      { title: "Local DP-SGD epochs", detail: "Balanced sampling across eight classes; DP noise protects slide provenance." },
      { title: "Submit weight delta", detail: "Byzantine screening rejects mislabeled or adversarial batches." },
      { title: "Receive global checkpoint", detail: "Shared model generalizes across stains, scanners, and labs." },
    ],
    baseAccuracy: 0.812,
    targetAccuracy: 0.973,
    epsilonMax: 4.5,
    status: "converged",
    minSamples: 1000,
    accent: "emerald",
    hospitals: [
      { id: "c1", name: "Hospital Clínic BCN", code: "OLY", region: "Barcelona, ES", scanner: "Olympus BX", samples: 3200 },
      { id: "c2", name: "Karolinska Hema", code: "ZEI", region: "Stockholm, SE", scanner: "Zeiss Axio", samples: 2750 },
      { id: "c3", name: "Mayo Clinic Lab", code: "LEI", region: "Rochester, US", scanner: "Leica DM", samples: 4100 },
    ],
  },
  {
    id: "organ-ct",
    name: "Abdominal Organ Classifier",
    shortName: "OrganNet",
    modality: "Abdominal CT",
    task: "11-class classification · Abdominal organs",
    summary: "Axial CT slice classification across eleven abdominal organs.",
    description:
      "Identifies which abdominal organ is centered in an axial CT slice, a building block for downstream segmentation and retrieval pipelines across radiology departments.",
    architecture: "ResNet-34",
    parameters: "21.3M",
    classes: ["Liver", "Kidney-R", "Kidney-L", "Spleen", "Pancreas", "Gallbladder", "Bladder", "Femur-L", "Femur-R", "Heart", "Lung"],
    input: { resolution: "224 × 224", channels: "1 (grayscale)", format: "DICOM / NIfTI" },
    dataRequirements: [
      { label: "Modality", value: "Axial abdominal CT slices" },
      { label: "Labels", value: "Organ-of-interest per slice" },
      { label: "Min. labeled slices", value: "1,500 per site" },
      { label: "Window", value: "Provide HU window metadata" },
      { label: "PHI", value: "Strip DICOM headers on export" },
    ],
    preprocessing: [
      "Apply abdominal HU window (W:400 L:40)",
      "Resample to isotropic spacing",
      "Resize to 224×224 grayscale",
      "Standardize intensities",
    ],
    trainingSteps: [
      { title: "Stage CT slices", detail: "Export de-identified slices with organ labels; DICOM headers are stripped on import." },
      { title: "Window & resample", detail: "HU windowing and isotropic resampling run locally for scanner harmonization." },
      { title: "Local DP-SGD epochs", detail: "FedBN keeps per-site batch-norm stats local to absorb scanner domain shift." },
      { title: "Submit weight delta", detail: "Screened deltas aggregate; batch-norm params stay on-site (FedBN)." },
      { title: "Receive global checkpoint", detail: "Shared backbone with site-local norm layers handles vendor variance." },
    ],
    baseAccuracy: 0.756,
    targetAccuracy: 0.941,
    epsilonMax: 5.5,
    status: "recruiting",
    minSamples: 1500,
    accent: "sky",
    hospitals: [
      { id: "o1", name: "Charité Radiology", code: "SIE", region: "Berlin, DE", scanner: "Siemens SOMATOM", samples: 1800 },
      { id: "o2", name: "Toronto General", code: "GE", region: "Toronto, CA", scanner: "GE Revolution", samples: 1550 },
    ],
  },
];

export function getModel(id: string): ModelDefinition | undefined {
  return MODELS.find((m) => m.id === id);
}
