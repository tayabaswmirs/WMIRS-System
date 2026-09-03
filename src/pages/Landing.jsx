import LandingNavbar from "../components/layout/LandingNavbar";
import LandingHeroOverview from "../components/landing/LandingHeroOverview";
import LandingMandateGallery from "../components/landing/LandingMandateGallery";
import LandingCapabilitiesCta from "../components/landing/LandingCapabilitiesCta";
import LandingFooter from "../components/landing/LandingFooter";
import { useAuth } from "../hooks/useAuth";
import "../styles/landing.css";

/**
 * Landing — Master orchestrator for the ENRO Tayabas WMIRS Showcase page.
 * Implements a hybrid civic and operational portal view adhering to
 * single responsibility, responsive mobile collapse, and MongoDB branding tokens.
 */
export default function Landing() {
  const { currentUser, userRole } = useAuth();

  // Resolve dashboard redirect link based on authenticated user role
  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "staff") return "/staff/dashboard";
    return "/dashboard";
  };

  const portalLink = currentUser ? getDashboardPath() : "/login";
  const portalBtnLabel = currentUser ? "Go to Dashboard" : "Access Portal";

  return (
    <div className="landing-container">
      {/* Sticky Glassmorphic Header with Responsive Mobile Drawer */}
      <LandingNavbar />

      <main>
        {/* Block 1: Asymmetric Hero & What ENRO Does */}
        <LandingHeroOverview
          portalLink={portalLink}
          portalBtnLabel={portalBtnLabel}
        />

        {/* Block 2: 2-Part Mandate/Pledge & Curated Bento Gallery */}
        <LandingMandateGallery />

        {/* Block 3: Sequential Capabilities Flow & Portal CTA */}
        <LandingCapabilitiesCta
          portalLink={portalLink}
          portalBtnLabel={portalBtnLabel}
        />
      </main>

      {/* Institutional LGU Tayabas Footer */}
      <LandingFooter />
    </div>
  );
}
