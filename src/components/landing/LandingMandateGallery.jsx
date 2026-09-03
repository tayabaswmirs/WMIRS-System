import treeplantingImg from "../../assets/gallery/treeplanting.jpg";
import rivercleaningImg from "../../assets/gallery/rivercleaning.jpg";
import cleaningImg from "../../assets/gallery/cleaning.jpg";
import youthOutreachImg from "../../assets/gallery/youth-outreach.jpg";
import eventImg from "../../assets/gallery/event.jpg";
import initiativeImg from "../../assets/gallery/initiative.jpg";
import galleryLeavesBg from "../../assets/gallery-leaves-bg.jpg";

const MANDATES = [
  {
    id: "mandate",
    eyebrow: "STATUTORY JURISDICTION",
    title: "Our Mandate",
    desc: "To execute national environmental laws (RA 9003, RA 9275 Clean Water Act) and Tayabas City Ordinances 21-10 and 17-01. ENRO safeguards the municipal territory through systematic resource monitoring, strict commercial plastic regulation, and responsible ecological governance."
  },
  {
    id: "pledge",
    eyebrow: "DEPARTMENTAL COMMITMENT",
    title: "Environmental Pledge",
    desc: "We pledge to preserve the rich biological diversity of Mount Banahaw, ensure clean waterways for future generations, and maintain rapid, transparent field responses to all reported environmental hazards and community concerns."
  }
];

const GALLERY_ITEMS = [
  {
    id: "treeplanting",
    img: treeplantingImg,
    badge: "Upland Greening",
    title: "Reforestation & Riparian Greening",
    desc: "Tree planting and slope stabilization activities along critical watershed boundaries."
  },
  {
    id: "rivercleaning",
    img: rivercleaningImg,
    badge: "Waterway Stewardship",
    title: "River Debris Dredging & Clearing",
    desc: "Active desiltation and trash interception along Tayabas municipal river basins."
  },
  {
    id: "cleaning",
    img: cleaningImg,
    badge: "Solid Waste Action",
    title: "Barangay Cleanup Drives",
    desc: "Coordinated community cleanups enforcing local waste segregation rules."
  },
  {
    id: "youth",
    img: youthOutreachImg,
    badge: "Ecological Education",
    title: "Youth Environmental Outreach",
    desc: "Educating young leaders on biodiversity protection and zero-waste practices."
  },
  {
    id: "event",
    img: eventImg,
    badge: "LGU Coordination",
    title: "Stakeholder Assemblies",
    desc: "Multi-sector summits with barangay officials and environmental rangers."
  },
  {
    id: "initiative",
    img: initiativeImg,
    badge: "Field Programs",
    title: "Green Program Launches",
    desc: "Field deployment of new municipal conservation projects and inspection units."
  }
];

export default function LandingMandateGallery() {
  return (
    <>
      {/* ── Section 3: Mandate & Pledge (Light Green & Blue Gradient) ───── */}
      <section id="mandate" className="mandate-section">
        <div className="section-container">
          <div className="mandate-grid">
            {MANDATES.map((item) => (
              <div key={item.id} className="mandate-card">
                <span className="mandate-eyebrow">{item.eyebrow}</span>
                <h3 className="mandate-title">{item.title}</h3>
                <p className="mandate-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Field Operations Gallery (Foliage Image + Subtle Green-Blue Gradient) ── */}
      <section id="mandate-gallery" className="gallery-section">
        {/* Subdued Foliage Image Background with Green-Blue Overlay */}
        <div className="gallery-bg-container" aria-hidden="true">
          <img
            src={galleryLeavesBg}
            alt=""
            className="gallery-bg-image"
          />
          <div className="gallery-bg-overlay" />
          <div className="gallery-ambient-aura" />
        </div>

        <div className="section-container">
          <div className="section-header">
            <span className="section-eyebrow">FIELD DOCUMENTATION</span>
            <h2 className="section-title">ENRO in Action</h2>
            <p className="section-desc">
              Photographic records from our field patrols, river cleanups, community educational campaigns, and watershed reforestation.
            </p>
          </div>

          <div className="bento-gallery-grid">
            {GALLERY_ITEMS.map((item, idx) => (
              <div key={item.id} className={`bento-gallery-card bento-item-${idx + 1}`}>
                <img
                  src={item.img}
                  alt={item.title}
                  className="bento-gallery-img"
                  loading="lazy"
                />
                <div className="bento-gallery-overlay" />
                <div className="bento-gallery-content">
                  <span className="bento-gallery-badge">{item.badge}</span>
                  <h4 className="bento-gallery-title">{item.title}</h4>
                  <p className="bento-gallery-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
