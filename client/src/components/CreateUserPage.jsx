import React, { useState } from "react";
import styles from "./CreateUserPage.module.css";
import useUserContext from "../API/UserContext";

export default function CreateUserPage({ onClose, onUserCreated, standalone = false }) {
  const { createUser, loading } = useUserContext();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    userAddress: "",
    dateOfBirth: "",
    userRole: "USER", // Changed to uppercase to match backend enum
    active: true,
    activityStartDate: "",
    activityEndDate: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.dateOfBirth && new Date(formData.dateOfBirth) > new Date()) {
      newErrors.dateOfBirth = "Date of birth cannot be in the future";
    }
    if (formData.activityStartDate && formData.activityEndDate) {
      if (new Date(formData.activityStartDate) > new Date(formData.activityEndDate)) {
        newErrors.activityEndDate = "End date must be after start date";
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      // Format dates properly for Java LocalDate and LocalDateTime
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        userAddress: formData.userAddress || null,
        dateOfBirth: formData.dateOfBirth || null, // Keep as YYYY-MM-DD for LocalDate
        userRole: formData.userRole, // Already uppercase
        active: formData.active,
        activityStartDate: formData.activityStartDate
          ? `${formData.activityStartDate}T00:00:00` // Format for LocalDateTime
          : null,
        activityEndDate: formData.activityEndDate
          ? `${formData.activityEndDate}T00:00:00` // Format for LocalDateTime
          : null,
      };

      console.log("Sending to backend:", userData);

      await createUser(userData, token);

      if (onUserCreated) {
        onUserCreated();
      }

      // Reset form after successful submission
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        userAddress: "",
        dateOfBirth: "",
        userRole: "USER",
        active: true,
        activityStartDate: "",
        activityEndDate: "",
      });

      // Show success message (optional)
      alert("User created successfully!");

    } catch (error) {
      console.error("Failed to create user:", error);
      setErrors({
        submit: error.response?.data?.message || "Failed to create user. Please try again."
      });
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      userAddress: "",
      dateOfBirth: "",
      userRole: "USER",
      active: true,
      activityStartDate: "",
      activityEndDate: "",
    });
    setErrors({});
  };

  return (
    <div className={standalone ? styles.standaloneContainer : styles.modalOverlay}>
      <div className={standalone ? styles.standaloneForm : styles.modal}>
        {!standalone && (
          <div className={styles.modalHeader}>
            <h2>Create New User</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName">
                First Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                className={errors.firstName ? styles.errorInput : ""}
              />
              {errors.firstName && (
                <span className={styles.errorText}>{errors.firstName}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName">
                Last Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                className={errors.lastName ? styles.errorInput : ""}
              />
              {errors.lastName && (
                <span className={styles.errorText}>{errors.lastName}</span>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="email">
                Email <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className={errors.email ? styles.errorInput : ""}
              />
              {errors.email && (
                <span className={styles.errorText}>{errors.email}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">
                Password <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className={errors.password ? styles.errorInput : ""}
              />
              {errors.password && (
                <span className={styles.errorText}>{errors.password}</span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="userAddress">Address</label>
            <input
              type="text"
              id="userAddress"
              name="userAddress"
              value={formData.userAddress}
              onChange={handleChange}
              placeholder="Enter address"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={errors.dateOfBirth ? styles.errorInput : ""}
              />
              {errors.dateOfBirth && (
                <span className={styles.errorText}>{errors.dateOfBirth}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="userRole">Role</label>
              <select
                id="userRole"
                name="userRole"
                value={formData.userRole}
                onChange={handleChange}
              >
                <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                <option value="MANAGER">MANAGER</option>
                <option value="USER">USER</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="activityStartDate">Activity Start Date</label>
              <input
                type="date"
                id="activityStartDate"
                name="activityStartDate"
                value={formData.activityStartDate}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="activityEndDate">Activity End Date</label>
              <input
                type="date"
                id="activityEndDate"
                name="activityEndDate"
                value={formData.activityEndDate}
                onChange={handleChange}
                className={errors.activityEndDate ? styles.errorInput : ""}
              />
              {errors.activityEndDate && (
                <span className={styles.errorText}>{errors.activityEndDate}</span>
              )}
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
              />
              <span>Active User</span>
            </label>
          </div>

          {errors.submit && (
            <div className={styles.submitError}>{errors.submit}</div>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.createBtn}
              disabled={loading}
              title="Create New User"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
            {!standalone && (
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            )}
            {standalone && (
              <button
                type="button"
                className={styles.resetBtn}
                onClick={handleReset}
                disabled={loading}
                title="Reset Form Content"
              >
                Reset Form
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}