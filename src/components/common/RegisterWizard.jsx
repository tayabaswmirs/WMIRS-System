import { useState, useRef } from "react";
import RegisterStepCredentials from "./RegisterStepCredentials";
import RegisterStepVetting from "./RegisterStepVetting";
import "../../styles/register-wizard.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function RegisterWizard({ onRegister, loading, setErrorMsg }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleNextStep = (e) => {
    e?.preventDefault();
    setErrorMsg("");
    if (!firstName.trim() || !lastName.trim()) return setErrorMsg("Please provide both first and last name.");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErrorMsg("Please enter a valid email address.");
    if (password.length < 8) return setErrorMsg("Password must be at least 8 characters long.");
    if (password !== confirmPassword) return setErrorMsg("Passwords do not match.");
    setStep(2);
  };

  const handleFileChange = (file) => {
    setErrorMsg("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setErrorMsg("Only JPG, PNG, and WebP images are permitted.");
    if (file.size > MAX_FILE_SIZE) return setErrorMsg("ID image size cannot exceed 5MB.");
    setIdCardFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setIdCardPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setErrorMsg("");
    if (!phone.trim() || !/^(\+639|09)\d{9}$/.test(phone.trim())) return setErrorMsg("Enter a valid Philippine mobile number (e.g. 09123456789).");
    if (!address.trim()) return setErrorMsg("Please enter your complete address or barangay.");
    if (!idNumber.trim()) return setErrorMsg("Please enter your official ID number.");
    if (!idCardFile) return setErrorMsg("Please upload a clear photo of your valid ID.");
    onRegister({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      address: address.trim(),
      idNumber: idNumber.trim(),
      idCardFile,
    });
  };

  return (
    <div className="reg-wizard">
      {/* Progress Stepper */}
      <div className="reg-stepper" aria-label="Registration Progress">
        <div className="reg-stepper__track">
          <div
            className="reg-stepper__track-fill"
            style={{ width: step === 1 ? "0%" : "100%" }}
          />
        </div>
        <div className={`reg-step-item ${step === 1 ? "reg-step-item--active" : "reg-step-item--completed"}`}>
          <div className="reg-step-item__circle">{step > 1 ? "✓" : "1"}</div>
          <span className="reg-step-item__label">Credentials</span>
        </div>
        <div className={`reg-step-item ${step === 2 ? "reg-step-item--active" : ""}`}>
          <div className="reg-step-item__circle">2</div>
          <span className="reg-step-item__label">Vetting Data</span>
        </div>
      </div>

      {step === 1 ? (
        <RegisterStepCredentials
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          onNext={handleNextStep}
          loading={loading}
        />
      ) : (
        <RegisterStepVetting
          phone={phone}
          setPhone={setPhone}
          address={address}
          setAddress={setAddress}
          idNumber={idNumber}
          setIdNumber={setIdNumber}
          idCardFile={idCardFile}
          idCardPreview={idCardPreview}
          fileInputRef={fileInputRef}
          isDragOver={isDragOver}
          setIsDragOver={setIsDragOver}
          handleFileChange={handleFileChange}
          onRemoveFile={() => {
            setIdCardFile(null);
            setIdCardPreview(null);
          }}
          onBack={() => {
            setErrorMsg("");
            setStep(1);
          }}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}
