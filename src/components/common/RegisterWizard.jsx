import { useState, useRef } from "react";
import PasswordInput from "./PasswordInput";
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
    e.preventDefault();
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
    e.preventDefault();
    setErrorMsg("");
    if (!phone.trim() || !/^(\+639|09)\d{9}$/.test(phone.trim())) return setErrorMsg("Enter a valid Philippine mobile number (e.g. 09123456789).");
    if (!address.trim()) return setErrorMsg("Please enter your complete address or barangay.");
    if (!idNumber.trim()) return setErrorMsg("Please enter your official ID number.");
    if (!idCardFile) return setErrorMsg("Please upload a clear photo of your valid ID.");
    onRegister({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, phone: phone.trim(), address: address.trim(), idNumber: idNumber.trim(), idCardFile });
  };

  return (
    <div className="reg-wizard">
      <div className="reg-stepper" aria-label="Registration Progress">
        <div className="reg-stepper__track"><div className="reg-stepper__track-fill" style={{ width: step === 1 ? "0%" : "100%" }} /></div>
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
        <div className="reg-wizard__step">
          <div className="reg-grid-2">
            <div className="reg-field-group">
              <label className="reg-label" htmlFor="reg-first-name">First Name <span className="reg-label__req">*</span></label>
              <input id="reg-first-name" type="text" className="reg-input" placeholder="e.g. Juan" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="reg-field-group">
              <label className="reg-label" htmlFor="reg-last-name">Last Name <span className="reg-label__req">*</span></label>
              <input id="reg-last-name" type="text" className="reg-input" placeholder="e.g. Dela Cruz" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="reg-field-group" style={{ marginTop: 12 }}>
            <label className="reg-label" htmlFor="reg-email">Email Address <span className="reg-label__req">*</span></label>
            <input id="reg-email" type="email" className="reg-input" placeholder="your.name@domain.gov" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="reg-field-group" style={{ marginTop: 12 }}>
            <label className="reg-label" htmlFor="reg-password">Password (8+ chars) <span className="reg-label__req">*</span></label>
            <PasswordInput id="reg-password" className="reg-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" required />
          </div>
          <div className="reg-field-group" style={{ marginTop: 12 }}>
            <label className="reg-label" htmlFor="reg-confirm-password">Confirm Password <span className="reg-label__req">*</span></label>
            <PasswordInput id="reg-confirm-password" className="reg-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required />
          </div>
          <div className="reg-actions">
            <button type="button" className="reg-btn-continue" onClick={handleNextStep}>
              <span>Continue to Verification</span>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="reg-wizard__step">
          <div className="reg-field-group">
            <label className="reg-label" htmlFor="reg-phone">Phone Number <span className="reg-label__req">*</span></label>
            <input id="reg-phone" type="tel" className="reg-input" placeholder="09123456789" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))} required />
          </div>
          <div className="reg-field-group" style={{ marginTop: 12 }}>
            <label className="reg-label" htmlFor="reg-address">Complete Residential Address <span className="reg-label__req">*</span></label>
            <input id="reg-address" type="text" className="reg-input" placeholder="Barangay, Municipality / City" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>
          <div className="reg-field-group" style={{ marginTop: 12 }}>
            <label className="reg-label" htmlFor="reg-id-num">Official ID Number <span className="reg-label__req">*</span></label>
            <input id="reg-id-num" type="text" className="reg-input" placeholder="e.g. EMP-2026-0814 or PRC/Gov't ID" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
          </div>
          <div className="reg-field-group" style={{ marginTop: 12 }}>
            <label className="reg-label">Upload Valid ID Photo <span className="reg-label__req">*</span></label>
            {idCardPreview ? (
              <div className="reg-preview-card">
                <img src={idCardPreview} alt="ID preview" className="reg-preview-thumb" />
                <div className="reg-preview-meta">
                  <span className="reg-preview-name">{idCardFile?.name}</span>
                  <span className="reg-preview-size">{((idCardFile?.size || 0) / 1024).toFixed(1)} KB</span>
                </div>
                <button type="button" className="reg-preview-remove" onClick={() => { setIdCardFile(null); setIdCardPreview(null); }} title="Remove photo">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                </button>
              </div>
            ) : (
              <div
                className={`reg-dropzone ${isDragOver ? "reg-dropzone--dragover" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileChange(e.dataTransfer.files?.[0]); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="material-symbols-outlined reg-dropzone__icon">badge</span>
                <span className="reg-dropzone__text">Drag & drop your ID photo here, or <strong>browse</strong></span>
                <span className="reg-dropzone__subtext">Supports JPG, PNG, WebP up to 5MB</span>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="reg-dropzone__file-input" onChange={(e) => handleFileChange(e.target.files?.[0])} />
              </div>
            )}
          </div>
          <div className="reg-actions">
            <button type="button" className="reg-btn-back" disabled={loading} onClick={() => { setErrorMsg(""); setStep(1); }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              <span>Back</span>
            </button>
            <button type="button" className="reg-btn-submit" disabled={loading} onClick={handleSubmit}>
              {loading ? "Submitting Application…" : "Submit Registration"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
