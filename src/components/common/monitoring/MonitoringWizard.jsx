import { useState } from "react";
import MonitoringSelector from "./MonitoringSelector";
import MonitoringFormContainer from "./MonitoringFormContainer";

/**
 * MonitoringWizard — Controller coordinating step traversal for ecological monitoring logs.
 * Props:
 *   onBackToChoice {Function} — callback when clicking back from Category select (Step 1 of monitoring)
 */
function MonitoringWizard({ onBackToChoice }) {
  // Nested wizard step state: 1 = category, 2 = subcategory, 3 = form
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");

  const handleSelectCategory = (catId) => {
    setCategory(catId);
    setSubcategory("");
    setStep(2);
  };

  const handleSelectSubcategory = (subName) => {
    setSubcategory(subName);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 3) {
      setSubcategory("");
      setStep(2);
    } else if (step === 2) {
      setCategory("");
      setStep(1);
    } else {
      onBackToChoice();
    }
  };

  const handleSubmitSuccess = () => {
    setSubcategory("");
    setStep(2);
  };

  return (
    <div>
      {step === 1 && (
        <MonitoringSelector
          mode="category"
          category={category}
          onSelectCategory={handleSelectCategory}
          onBack={handleBack}
        />
      )}
      {step === 2 && (
        <MonitoringSelector
          mode="subcategory"
          category={category}
          onSelectSubcategory={handleSelectSubcategory}
          onBack={handleBack}
        />
      )}
      {step === 3 && (
        <MonitoringFormContainer
          category={category}
          subcategory={subcategory}
          onBack={handleBack}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  );
}

export default MonitoringWizard;
