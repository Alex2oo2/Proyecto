/**
 * Password Validator Utility
 * Validates passwords against company-defined password policies
 */

function validatePasswordPolicy(password, politicas) {
  const errors = [];

  // Validate minimum length
  if (password.length < politicas.PasswordLargo) {
    errors.push(`La contraseña debe tener al menos ${politicas.PasswordLargo} caracteres.`);
  }

  // Validate minimum uppercase letters
  if (politicas.PasswordCantidadMayusculas > 0) {
    const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
    if (uppercaseCount < politicas.PasswordCantidadMayusculas) {
      errors.push(`La contraseña debe contener al menos ${politicas.PasswordCantidadMayusculas} letra(s) mayúscula(s).`);
    }
  }

  // Validate minimum lowercase letters
  if (politicas.PasswordCantidadMinusculas > 0) {
    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    if (lowercaseCount < politicas.PasswordCantidadMinusculas) {
      errors.push(`La contraseña debe contener al menos ${politicas.PasswordCantidadMinusculas} letra(s) minúscula(s).`);
    }
  }

  // Validate minimum numeric digits
  if (politicas.PasswordCantidadNumeros > 0) {
    const digitCount = (password.match(/[0-9]/g) || []).length;
    if (digitCount < politicas.PasswordCantidadNumeros) {
      errors.push(`La contraseña debe contener al menos ${politicas.PasswordCantidadNumeros} dígito(s).`);
    }
  }

  // Validate minimum special characters
  if (politicas.PasswordCantidadCaracteresEspeciales > 0) {
    const specialCharCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    if (specialCharCount < politicas.PasswordCantidadCaracteresEspeciales) {
      errors.push(`La contraseña debe contener al menos ${politicas.PasswordCantidadCaracteresEspeciales} carácter(es) especial(es).`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

module.exports = { validatePasswordPolicy };
