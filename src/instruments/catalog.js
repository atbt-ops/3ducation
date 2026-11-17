// Locally generated, dimensionally illustrative teaching models. No CDN assets.
// Each row: name | model family | principle | applications | key components.
const groups = {
  Physics: `Vernier caliper|caliper|The difference between main and vernier divisions resolves fractional lengths.|Measure external diameter, internal diameter and depth.|Fixed jaw,Sliding jaw,Main scale,Vernier scale
Micrometer screw gauge|micrometer|A calibrated screw converts rotation into a small linear displacement.|Measure wire diameter and thin sheet thickness.|Frame,Anvil,Spindle,Thimble
Meter rule|ruler|Equal divisions compare an object's length with a standard unit.|Measure laboratory distances and displacement.|Rule body,Graduations,Zero mark
Measuring tape|tape|A flexible graduated strip follows straight or curved paths.|Measure circumference and larger distances.|Case,Flexible strip,End hook
Stopwatch|stopwatch|An oscillator provides regular intervals counted electronically.|Time oscillations, races and reaction intervals.|Display,Start button,Reset button
Spring balance|spring|Within the elastic limit, spring extension is proportional to applied force.|Measure force and compare object weights.|Housing,Spring,Pointer,Hook
Beam balance|balance|Equal torques about a pivot compare unknown and known masses.|Compare masses without relying on spring calibration.|Beam,Pivot,Left pan,Right pan
Digital balance|digital|A load cell converts deformation into an electrical signal.|Measure small laboratory masses.|Pan,Load cell enclosure,Display,Buttons
Galvanometer|meter|A current-carrying coil experiences torque in a magnetic field.|Detect small electric currents and their direction.|Scale,Pointer,Coil housing,Terminals
Ammeter|meter|A low-resistance measuring circuit responds to current flowing through it.|Measure current in a series circuit.|Scale,Pointer,Shunt housing,Terminals
Voltmeter|meter|A high-resistance measuring circuit responds to potential difference.|Measure voltage across two circuit points.|Scale,Pointer,Resistance housing,Terminals
Multimeter|multimeter|Selectable measuring circuits convert electrical quantities to readings.|Measure voltage, current and resistance.|Display,Selector dial,Input sockets,Probe leads
Oscilloscope|scope|Voltage samples are plotted against time to reveal changing signals.|Inspect waveforms, frequency and amplitude.|Screen,Time dial,Voltage dial,Inputs
Electroscope|electroscope|Like charges repel, separating conductive leaves.|Detect electric charge and compare charging processes.|Metal cap,Conducting rod,Leaves,Glass enclosure
Bar magnet|magnet|Aligned magnetic domains produce a magnetic field with two poles.|Explore magnetic forces and field patterns.|North pole,South pole,Magnetic body
Compass|compass|A magnetized needle aligns with the local magnetic field.|Find direction and map magnetic fields.|Dial,Magnetic needle,Pivot,Case
Optical bench|optics|Light propagation is examined with aligned sources, lenses and screens.|Measure focal length and study image formation.|Rail,Light source,Lens,Screen
Prism|prism|Refraction changes light direction; wavelength dependence separates colours.|Study dispersion and refractive index.|Glass body,Entry face,Exit face
Telescope|telescope|An objective collects light and an eyepiece magnifies the image.|Observe distant objects and angular detail.|Objective tube,Eyepiece,Mount,Tripod
Pendulum apparatus|pendulum|Gravity restores a displaced bob, producing oscillations.|Investigate period, length and gravitational acceleration.|Support,String,Bob,Base`,
  Chemistry: `Beaker|beaker|A wide vessel holds and mixes liquids; its markings give approximate volume.|Mix, heat and transfer solutions.|Glass body,Spout,Graduations
Conical flask|flask|A narrow neck limits splashing while a wide base permits swirling.|Mix titration solutions and conduct reactions.|Conical body,Neck,Rim
Volumetric flask|volumetric|A calibration mark defines one accurate volume at a reference temperature.|Prepare solutions of a known concentration.|Bulb,Narrow neck,Calibration mark,Stopper
Round-bottom flask|roundflask|A spherical vessel distributes heating over a curved surface.|Heat reaction mixtures and assemble distillation equipment.|Round body,Neck,Rim
Measuring cylinder|cylinder|A narrow graduated vessel permits volume readings at the meniscus.|Measure liquid volumes more precisely than a beaker.|Cylinder,Base,Graduations,Spout
Burette|burette|A graduated tube dispenses measured liquid through a controlled valve.|Perform quantitative titrations.|Graduated tube,Stopcock,Tip,Clamp
Volumetric pipette|pipette|A calibrated bulb transfers one fixed volume.|Transfer accurate aliquots for analysis.|Stem,Bulb,Calibration ring,Tip
Dropper|dropper|Squeezing and releasing a bulb changes pressure to draw and expel liquid.|Add reagents one drop at a time.|Rubber bulb,Glass stem,Tip
Test tube|testtube|A narrow glass vessel contains small-scale reactions.|Heat or compare small samples.|Tube,Rounded bottom,Rim
Test tube rack|rack|Spaced supports hold tubes upright and separate.|Organize multiple experimental samples.|Upper support,Tube holes,Base,Tubes
Funnel|funnel|A cone channels liquid into a narrow stem; filter paper can retain solids.|Transfer liquids and carry out gravity filtration.|Cone,Stem,Rim
Separating funnel|separator|Immiscible liquids settle into layers that drain independently.|Separate organic and aqueous phases.|Pear-shaped body,Stopper,Stopcock,Outlet
Bunsen burner|burner|Fuel mixes with air before combustion; air intake changes the flame.|Heat laboratory apparatus.|Base,Barrel,Air collar,Gas inlet
Tripod stand|tripod|Three legs provide stable support above a heat source.|Support vessels during heating.|Top ring,Three legs,Foot ends
Wire gauze|gauze|A mesh supports glassware and spreads heating over a larger area.|Support beakers on a tripod.|Mesh,Frame,Ceramic centre
Crucible|crucible|Refractory ceramic tolerates high temperatures.|Strongly heat solids and determine ash content.|Ceramic cup,Lid,Base
Evaporating dish|dish|A broad exposed liquid surface speeds evaporation.|Concentrate solutions and recover dissolved solids.|Shallow bowl,Spout,Rim
Mortar and pestle|mortar|Compression and friction reduce solid particle size.|Grind and mix solid reagents.|Mortar bowl,Pestle,Base
Liebig condenser|condenser|Cooling water removes heat through a jacket so vapour condenses.|Condense vapours in distillation.|Inner tube,Water jacket,Water inlet,Water outlet
pH meter|phmeter|An electrochemical electrode potential depends on hydrogen ion activity.|Measure acidity and alkalinity.|Display,Electrode,Probe cable,Calibration control`,
  Biology: `Compound microscope|microscope|Objective and eyepiece lenses provide successive magnification.|Observe cells and thin tissue samples.|Eyepiece,Objectives,Stage,Focus knob,Base
Dissecting microscope|stereo|Separate optical paths provide a magnified stereoscopic view.|Examine small organisms and surface structures.|Twin eyepieces,Objective head,Stage,Stand
Hand lens|lens|A converging lens forms a magnified virtual image within its focal length.|Inspect leaves, insects and surface details.|Lens,Frame,Handle
Petri dish|petri|A covered shallow vessel contains specimens or culture media.|Observe specimens and demonstrate culture techniques.|Base dish,Lid,Medium
Microscope slide|slide|A thin transparent support transmits light through a specimen.|Mount samples for microscopy.|Glass slide,Specimen,Coverslip
Cover slip|coverslip|A thin transparent sheet flattens and protects a mounted specimen.|Prepare microscope specimens.|Glass sheet,Edges,Specimen layer
Centrifuge|centrifuge|Rotation produces radial acceleration that separates components by sedimentation.|Separate suspended particles from liquid.|Rotor,Sample tubes,Lid,Motor enclosure
Micropipette|micropipette|A piston displaces a controlled air volume to move microlitres of liquid.|Transfer small precise sample volumes.|Plunger,Volume display,Body,Tip
Dissecting scalpel|scalpel|A thin sharp edge concentrates force over a small area.|Cut specimens during supervised dissection.|Blade,Handle,Grip
Forceps|forceps|Elastic arms and opposing tips grip small objects.|Handle small specimens and delicate tissues.|Upper arm,Lower arm,Tips
Dissecting scissors|scissors|Two pivoted cutting edges shear material.|Cut tissue and preparation materials.|Blades,Pivot,Finger loops
Dissecting needle|needle|A fine rigid tip separates or positions small structures.|Manipulate specimens under magnification.|Handle,Shaft,Point
Dissecting tray|tray|A recessed support contains the specimen during examination.|Position and pin specimens for dissection.|Tray,Wax layer,Pin positions
Inoculating loop|loop|A small wire loop retains a small amount of liquid by surface tension.|Transfer samples during supervised microbiology work.|Handle,Wire,Loop
Incubator|cabinet|Feedback control keeps an enclosed chamber near a chosen temperature.|Maintain controlled experimental temperatures.|Chamber,Door,Temperature controller,Shelves
Autoclave|autoclave|Pressurized saturated steam transfers heat for sterilization.|Sterilize compatible laboratory equipment.|Pressure vessel,Lid,Pressure gauge,Valve
Respirometer|respirometer|Changes in gas volume or pressure indicate respiration rate.|Investigate oxygen consumption in biological samples.|Chamber,Capillary,Indicator drop,Stopper
Potometer|potometer|Water uptake moves an air bubble along a calibrated capillary.|Estimate water uptake associated with transpiration.|Plant stem,Reservoir,Capillary,Bubble marker
Haemocytometer|slide|A calibrated grid defines a known counting area and chamber volume.|Estimate cell concentration from counted cells.|Glass chamber,Counting grid,Coverslip
Spirometer|spirometer|Airflow or displaced volume is integrated to estimate breathing volumes.|Demonstrate respiratory volume measurement.|Mouthpiece,Flow sensor,Display,Tube`,
  Mathematics: `Straight ruler|ruler|A straight edge guides lines and graduated intervals measure length.|Draw line segments and measure constructions.|Straight edge,Graduations,Zero mark
Protractor|protractor|Angular graduations divide a semicircle into degrees.|Measure and construct angles.|Semicircular scale,Centre mark,Baseline
Drawing compass|drawingcompass|A fixed distance between pivot and pencil traces a circle.|Construct circles and perpendicular bisectors.|Pivot leg,Pencil leg,Hinge
Divider|divider|Two pointed legs preserve a distance between positions.|Transfer lengths and divide intervals.|First leg,Second leg,Hinge
Set square 45 degrees|setsquare|Fixed 45-45-90 degree geometry guides perpendicular and diagonal lines.|Construct right angles and parallel lines.|Triangular body,45-degree edge,Right-angle vertex
Set square 30-60 degrees|setsquare|Fixed 30-60-90 degree geometry provides standard angles.|Draw geometric and technical constructions.|Triangular body,30-degree edge,60-degree edge
Abacus|abacus|Bead positions represent quantities and place values.|Explore counting and arithmetic.|Frame,Rods,Beads
Geoboard|geoboard|A regular lattice anchors polygon vertices.|Explore area, perimeter and coordinate geometry.|Board,Pegs,Polygon band
Trundle wheel|wheel|Distance equals circumference multiplied by the number of rotations.|Measure paths and investigate circumference.|Wheel,Axle,Handle,Counter
Clinometer|clinometer|A gravity-referenced indicator measures inclination.|Estimate heights using angles and trigonometry.|Protractor,Sighting tube,Plumb line,Weight
Slide rule|sliderule|Adding logarithmic lengths corresponds to multiplication.|Explore logarithms and approximate calculations.|Fixed scales,Sliding scale,Cursor
Planimeter|planimeter|A tracing mechanism integrates boundary motion to estimate area.|Measure areas on drawings and maps.|Anchor,Tracing arm,Measuring wheel,Tracer
Pantograph|pantograph|A linked parallelogram preserves similarity during scaled tracing.|Enlarge or reduce geometric drawings.|Linked arms,Pivot,Tracer,Pencil
Spherometer|spherometer|A central screw measures surface height relative to three fixed feet.|Estimate radius of curvature and thickness.|Three feet,Central screw,Dial,Frame
Geometry solids kit|solids|Three-dimensional shapes expose faces, edges and vertices.|Compare volume, surface area and polyhedra.|Cube,Cone,Sphere,Cylinder`,
};
export const INSTRUMENTS = Object.entries(groups).flatMap(([subject, text]) =>
  text.split("\n").map((row, index) => {
    const [name, family, principle, applications, components] = row.split("|");
    return {
      id: `instrument-${subject.toLowerCase()}-${index + 1}`,
      name,
      subject,
      family,
      principle,
      applications,
      components: components.split(","),
      description: `${name} is used to ${applications[0].toLowerCase() + applications.slice(1)}`,
      variant: index,
    };
  })
);
export const findInstrument = (id) => INSTRUMENTS.find((i) => i.id === id);
